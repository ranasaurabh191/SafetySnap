from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from django.conf import settings
import os
from datetime import timedelta
import numpy as np  # ✅ ADD THIS LINE
import cv2
from .models import Detection, PersonDetection, Violation, PPEPolicy
from .serializers import (
    DetectionSerializer, DetectionCreateSerializer,
    PersonDetectionSerializer, ViolationSerializer, PPEPolicySerializer,
    NotificationSerializer
)
from .yolo_service import get_detector
from collections import deque

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import connection

from django.http import StreamingHttpResponse
import cv2
from .yolo_service import get_detector
# ==================== NEW REAL-TIME ENDPOINTS ====================
import threading
import time
import cv2
import threading
import time
from queue import Queue
from django.http import JsonResponse
from django.conf import settings
from django.db import connection
import os

def health_check(request):
    """Health check endpoint for Nagios monitoring"""
    try:
        # Check database connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Check YOLO model exists
        model_path = os.path.join(settings.BASE_DIR, 'YOLO11n.pt')
        model_exists = os.path.exists(model_path)
        
        # Check media directory is writable
        media_writable = os.access(settings.MEDIA_ROOT, os.W_OK)
        
        health_status = {
            'status': 'healthy',
            'database': 'connected',
            'model_loaded': model_exists,
            'media_writable': media_writable,
            'version': '1.0.0'
        }
        
        if not model_exists or not media_writable:
            return JsonResponse(health_status, status=503)
        
        return JsonResponse(health_status, status=200)
        
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=503)

# ✅ RTSP Camera Manager with Threading
class RTSPCameraManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance.streams = {}  # Store multiple camera streams
        return cls._instance
    
    def get_stream(self, camera_id, rtsp_url):
        """Get or create RTSP stream for a camera"""
        with self._lock:
            if camera_id not in self.streams or not self.streams[camera_id]['active']:
                print(f"[RTSP] Opening stream for camera {camera_id}: {rtsp_url}")
                
                cap = cv2.VideoCapture(rtsp_url)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce latency
                
                if not cap.isOpened():
                    print(f"[ERROR] Failed to open RTSP stream: {rtsp_url}")
                    return None
                
                self.streams[camera_id] = {
                    'capture': cap,
                    'active': True,
                    'frame_queue': Queue(maxsize=2),
                    'url': rtsp_url
                }
                
                # Start frame reading thread
                thread = threading.Thread(
                    target=self._read_frames,
                    args=(camera_id,),
                    daemon=True
                )
                thread.start()
            
            return self.streams[camera_id]['capture']
    
    def _read_frames(self, camera_id):
        """Continuously read frames in background thread"""
        stream = self.streams.get(camera_id)
        if not stream:
            return
        
        cap = stream['capture']
        queue = stream['frame_queue']
        
        while stream['active']:
            ret, frame = cap.read()
            if not ret:
                print(f"[WARN] Failed to read frame from camera {camera_id}")
                time.sleep(0.1)
                continue
            
            # Keep only latest frame
            if not queue.full():
                queue.put(frame)
            else:
                try:
                    queue.get_nowait()
                    queue.put(frame)
                except:
                    pass
    
    def get_latest_frame(self, camera_id):
        """Get latest frame from queue"""
        stream = self.streams.get(camera_id)
        if not stream:
            return None
        
        try:
            return stream['frame_queue'].get(timeout=1)
        except:
            return None
    
    def release_stream(self, camera_id):
        """Release specific camera stream"""
        with self._lock:
            if camera_id in self.streams:
                print(f"[RTSP] Releasing stream for camera {camera_id}")
                self.streams[camera_id]['active'] = False
                if self.streams[camera_id]['capture']:
                    self.streams[camera_id]['capture'].release()
                del self.streams[camera_id]

rtsp_manager = RTSPCameraManager()


@api_view(['GET'])
@permission_classes([AllowAny])
def rtsp_camera_stream(request):
    """Stream from RTSP camera with PPE detection"""
    
    # Get camera parameters
    camera_id = request.GET.get('camera_id', 'default')
    rtsp_url = request.GET.get('rtsp_url')
    token_key = request.GET.get('token')
    
    if not rtsp_url:
        from django.http import HttpResponse
        return HttpResponse('RTSP URL required', status=400)
    
    if not token_key:
        from django.http import HttpResponse
        return HttpResponse('Unauthorized: No token', status=401)
    
    try:
        from rest_framework.authtoken.models import Token
        token = Token.objects.get(key=token_key)
        user = token.user
        print(f"[RTSP STREAM] User: {user.username}, Camera: {camera_id}")
    except Token.DoesNotExist:
        from django.http import HttpResponse
        return HttpResponse('Unauthorized: Invalid token', status=401)
    
    def generate_frames():
        from .yolo_service import get_detector
        
        # Get RTSP stream
        cap = rtsp_manager.get_stream(camera_id, rtsp_url)
        if not cap:
            print("[ERROR] Failed to initialize RTSP stream")
            return
        
        detector = get_detector()
        print(f"[RTSP] Streaming from: {rtsp_url}")
        
        frame_count = 0
        process_every = 2  # Process every 2nd frame
        fail_count = 0
        max_fails = 10
        
        try:
            while True:
                # Get latest frame from queue
                frame = rtsp_manager.get_latest_frame(camera_id)
                
                if frame is None:
                    fail_count += 1
                    if fail_count >= max_fails:
                        print(f"[ERROR] {max_fails} consecutive failures")
                        break
                    time.sleep(0.1)
                    continue
                
                fail_count = 0
                frame_count += 1
                
                try:
                    # Process every Nth frame
                    if frame_count % process_every == 0:
                        # Use fast video model
                        result = detector.detect_frame(frame, use_fast_model=True)
                        annotated_frame = result['results'].plot()
                    else:
                        annotated_frame = frame
                    
                    # Encode frame
                    success, buffer = cv2.imencode('.jpg', annotated_frame, 
                                                   [cv2.IMWRITE_JPEG_QUALITY, 70])
                    
                    if not success:
                        continue
                    
                    frame_bytes = buffer.tobytes()
                    
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                except GeneratorExit:
                    print(f"[RTSP] Client disconnected")
                    break
                except Exception as e:
                    print(f"[ERROR] Frame processing: {e}")
                    continue
        
        except Exception as e:
            print(f"[ERROR] Stream error: {e}")
        finally:
            rtsp_manager.release_stream(camera_id)
            print(f"[RTSP] Stream ended for camera: {camera_id}")
    
    response = StreamingHttpResponse(
        generate_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )
    
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def stop_camera(request):
    """Force release camera"""
    camera_manager.active_streams = 0
    if camera_manager.camera is not None:
        camera_manager.camera.release()
        camera_manager.camera = None
    
    return Response({'status': 'Camera forcefully released'})

# ✅ GLOBAL CAMERA MANAGER
class CameraManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance.camera = None
                    cls._instance.active_streams = 0
        return cls._instance
    
    def get_camera(self):
        """Get or create camera instance"""
        with self._lock:
            if self.camera is None or not self.camera.isOpened():
                print("[CAMERA] Opening new camera instance")
                self.camera = cv2.VideoCapture(0)
                if not self.camera.isOpened():
                    print("[ERROR] Failed to open camera")
                    return None
            self.active_streams += 1
            print(f"[CAMERA] Active streams: {self.active_streams}")
            return self.camera
    
    def release_camera(self):
        """Release camera if no active streams"""
        with self._lock:
            self.active_streams = max(0, self.active_streams - 1)
            print(f"[CAMERA] Active streams: {self.active_streams}")
            
            if self.active_streams == 0 and self.camera is not None:
                print("[CAMERA] Releasing camera (no active streams)")
                self.camera.release()
                self.camera = None
                print("[CAMERA] ✅ Camera released successfully")

# Global camera manager instance
camera_manager = CameraManager()
@api_view(['GET'])
@permission_classes([AllowAny])
def live_webcam_stream(request):
    """Continuous webcam stream with PPE detection"""
    
    # Token authentication
    token_key = request.GET.get('token')
    
    if not token_key:
        from django.http import HttpResponse
        return HttpResponse('Unauthorized: No token provided', status=401)
    
    try:
        from rest_framework.authtoken.models import Token
        token = Token.objects.get(key=token_key)
        user = token.user
        print(f"[STREAM] Authenticated user: {user.username}")
    except Token.DoesNotExist:
        from django.http import HttpResponse
        return HttpResponse('Unauthorized: Invalid token', status=401)
    
    def generate_frames():
        cap = camera_manager.get_camera()
        
        if cap is None:
            print("[ERROR] Could not get camera")
            return
        
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        from .yolo_service import get_detector
        detector = get_detector()
        print(f"[STREAM] Using FAST video model for {user.username}")
        
        frame_count = 0
        fail_count = 0
        max_fails = 1
        process_every = 3
        last_annotated = None
        processing_times = deque(maxlen=30)
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    fail_count += 1
                    if fail_count >= max_fails:
                        print(f"[ERROR] {max_fails} consecutive failures")
                        break
                    time.sleep(0.05)
                    continue
                
                fail_count = 0
                frame_count += 1
                
                try:
                    if frame_count % process_every == 0:
                        start = time.time()
                        
                        # ✅ Use fast model for video
                        result = detector.detect_frame(frame, use_fast_model=True)
                        
                        # Plot annotations
                        annotated_frame = result['results'].plot()
                        
                        processing_time = time.time() - start
                        processing_times.append(processing_time)
                        
                        last_annotated = annotated_frame
                        
                        if len(processing_times) > 0:
                            avg_time = sum(processing_times) / len(processing_times)
                            fps = 1 / avg_time if avg_time > 0 else 0
                            if frame_count % 90 == 0:
                                print(f"[VIDEO MODEL] FPS: {fps:.1f}, Processing: {avg_time*1000:.1f}ms")
                    else:
                        if last_annotated is not None:
                            annotated_frame = last_annotated
                        else:
                            annotated_frame = frame
                    
                    success, buffer = cv2.imencode('.jpg', annotated_frame, 
                                                [cv2.IMWRITE_JPEG_QUALITY, 70])
                    
                    if not success:
                        continue
                    
                    frame_bytes = buffer.tobytes()
                    
                    yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                    
                except GeneratorExit:
                    print(f"[STREAM] Client disconnected")
                    break
                except Exception as e:
                    print(f"[ERROR] {e}")
                    continue
        
        except Exception as e:
            print(f"[ERROR] Stream error: {e}")
        finally:
            camera_manager.release_camera()
            print(f"[STREAM] ✅ Ended")

    
    response = StreamingHttpResponse(
        generate_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )
    
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def force_release_camera(request):
    """Force release camera (admin/debug endpoint)"""
    camera_manager.active_streams = 0
    if camera_manager.camera is not None:
        camera_manager.camera.release()
        camera_manager.camera = None
    
    return Response({
        'status': 'success',
        'message': 'Camera forcefully released'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_frame_with_annotation(request):
    """Process frame and return annotated image (like Streamlit)"""
    import time
    import base64
    import io
    import numpy as np  # ✅ Import here as backup
    import cv2
    from PIL import Image
    
    image_data = request.data.get('frame')
    
    if not image_data:
        return Response({'error': 'No frame provided'}, status=400)
    
    try:
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return Response({'error': 'Invalid image data'}, status=400)
        
        # Process with YOLO
        start_time = time.time()
        detector = get_detector()
        
        # Get raw results
        results = detector.model(frame)[0]
        
        # Use YOLO's built-in plot() method (like Streamlit)
        annotated_frame = results.plot()
        
        processing_time = time.time() - start_time
        
        # Calculate metrics
        violation_count = 0
        compliant_count = 0
        total_persons = 0
        
        for box in results.boxes:
            cls_id = int(box.cls[0])
            class_name = detector.classNames[cls_id]
            
            if class_name == 'Person':
                total_persons += 1
            
            # Count violations (anything with "NO" in name)
            if "NO" in class_name.upper():
                violation_count += 1
        
        # Estimate compliant (persons without violations)
        compliant_count = max(0, total_persons - violation_count)
        
        # Convert annotated frame to base64
        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return Response({
            'processing_time_ms': round(processing_time * 1000, 2),
            'objects_detected': total_persons,
            'violations': violation_count,
            'compliant': compliant_count,
            'fps': round(1 / processing_time, 2) if processing_time > 0 else 0,
            'annotated_frame': f'data:image/jpeg;base64,{annotated_base64}'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_camera_feed(request):
    """Stream live camera feed with PPE detection"""
    def generate_frames():
        detector = get_detector()
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            yield b''
            return
        
        while True:
            success, frame = cap.read()
            if not success:
                break
            
            try:
                # Process with YOLO
                results = detector.detect_frame(frame)
                
                # Annotate frame
                for person in results.get('persons', []):
                    bbox = person.get('bbox', [0, 0, 0, 0])
                    x1, y1, x2, y2 = [int(c) for c in bbox]
                    
                    # Check compliance
                    ppe = person.get('ppe', {})
                    is_compliant = (
                        ppe.get('helmet', {}).get('detected', False) and
                        ppe.get('safety_vest', {}).get('detected', False) and
                        ppe.get('face_mask', {}).get('detected', False)
                    )
                    
                    # Color coding
                    color = (0, 255, 0) if is_compliant else (0, 0, 255)
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    
                    # Label
                    label = "✓ Compliant" if is_compliant else "✗ Violation"
                    cv2.putText(frame, label, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                # Encode to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
            except Exception as e:
                print(f"Frame error: {e}")
                continue
        
        cap.release()
    
    return StreamingHttpResponse(
        generate_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_frame_metrics(request):
    """Process single frame and return real-time metrics"""
    import time
    import base64
    
    image_data = request.data.get('frame')
    
    if not image_data:
        return Response({'error': 'No frame provided'}, status=400)
    
    try:
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # ✅ ADD VALIDATION
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as decode_error:
            print(f"[ERROR] Base64 decode failed: {decode_error}")
            return Response({'error': 'Invalid base64 encoding'}, status=400)
        
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            print("[ERROR] cv2.imdecode returned None")
            return Response({'error': 'Invalid image data'}, status=400)
        
        # Process with timing
        start_time = time.time()
        detector = get_detector()
        results = detector.detect_frame(frame)
        processing_time = time.time() - start_time
        
        # Calculate violations
        violation_count = 0
        compliant_count = 0
        
        for person in results.get('persons', []):
            ppe = person.get('ppe', {})
            is_compliant = (
                ppe.get('helmet', {}).get('detected', False) and
                ppe.get('safety_vest', {}).get('detected', False) and
                ppe.get('face_mask', {}).get('detected', False)
            )
            
            if is_compliant:
                compliant_count += 1
            else:
                violation_count += 1
        
        return Response({
            'processing_time_ms': round(processing_time * 1000, 2),
            'objects_detected': results.get('num_persons', 0),
            'violations': violation_count,
            'compliant': compliant_count,
            'fps': round(1 / processing_time, 2) if processing_time > 0 else 0,
            'persons': results.get('persons', []) 
        })
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Frame processing failed:\n{error_trace}")
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_violations_csv(request):
    """Export violations to CSV (like Streamlit download)"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="safetysnap_violations.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'Violation Type', 'Severity', 'Confidence', 'Status', 'OSHA Standard'])
    
    violations = Violation.objects.filter(
        detection__user=request.user
    ).select_related('person_detection').order_by('-created_at')
    
    for v in violations:
        writer.writerow([
            v.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            v.violation_type,
            v.severity.upper(),
            round(v.person_detection.confidence, 2) if v.person_detection else 0,
            v.status.upper(),
            v.osha_standard
        ])
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def violation_statistics(request):
    """Get violation statistics for dashboard"""
    from django.db.models import Count, Q
    from datetime import timedelta
    
    twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
    
    # Get violations by severity
    violations = Violation.objects.filter(
        detection__user=request.user
    )
    
    recent_violations = violations.filter(created_at__gte=twenty_four_hours_ago)
    
    by_severity = violations.values('severity').annotate(count=Count('id'))
    by_status = violations.values('status').annotate(count=Count('id'))
    
    # Top violation types
    top_violations = violations.values('violation_type').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    return Response({
        'total_violations': violations.count(),
        'recent_violations': recent_violations.count(),
        'by_severity': {item['severity']: item['count'] for item in by_severity},
        'by_status': {item['status']: item['count'] for item in by_status},
        'top_violations': list(top_violations),
        'compliance_rate': calculate_overall_compliance(request.user)
    })


def calculate_overall_compliance(user):
    """Calculate overall compliance rate"""
    detections = Detection.objects.filter(user=user, status='completed')
    
    if not detections.exists():
        return 100.0
    
    compliant = detections.filter(compliance_status='compliant').count()
    total = detections.count()
    
    return round((compliant / total) * 100, 2) if total > 0 else 100.0

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_frame_metrics(request):
    """Process a single frame and return metrics"""
    import time
    import base64
    import numpy as np
    
    image_data = request.data.get('frame')  # base64 encoded frame
    
    if not image_data:
        return Response({'error': 'No frame provided'}, status=400)
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process with timing
        start_time = time.time()
        detector = get_detector()
        results = detector.detect_frame(frame)
        processing_time = time.time() - start_time
        
        # Calculate violations
        violation_count = 0
        for person in results.get('persons', []):
            ppe = person.get('ppe', {})
            is_compliant = (
                ppe.get('helmet', {}).get('detected', False) and
                ppe.get('safety_vest', {}).get('detected', False) and
                ppe.get('face_mask', {}).get('detected', False)
            )
            if not is_compliant:
                violation_count += 1
        
        return Response({
            'processing_time_ms': round(processing_time * 1000, 2),
            'objects_detected': results.get('num_persons', 0),
            'violations': violation_count,
            'fps': round(1 / processing_time, 2) if processing_time > 0 else 0
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)
from django.http import HttpResponse
import csv

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_violations_csv(request):
    """Export violations to CSV (like Streamlit download feature)"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="violations_log.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Timestamp', 'Violation Type', 'Severity', 'Confidence', 'Status'])
    
    violations = Violation.objects.filter(
        detection__user=request.user
    ).order_by('-created_at')
    
    for v in violations:
        writer.writerow([
            v.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            v.violation_type,
            v.severity,
            v.person_detection.confidence if v.person_detection else 0,
            v.status
        ])
    
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_camera_feed(request):
    """Stream live camera feed with PPE detection"""
    def generate_frames():
        detector = get_detector()
        cap = cv2.VideoCapture(0)  # Webcam
        
        while True:
            success, frame = cap.read()
            if not success:
                break
            
            # Process frame with YOLO
            try:
                results = detector.detect_frame(frame)  # You'll need to add this method
                
                # Annotate frame (draw bounding boxes)
                for person in results.get('persons', []):
                    bbox = person.get('bbox', [0, 0, 0, 0])
                    x1, y1, x2, y2 = [int(c) for c in bbox]
                    
                    # Color: Green if compliant, Red if not
                    ppe = person.get('ppe', {})
                    is_compliant = (
                        ppe.get('helmet', {}).get('detected', False) and
                        ppe.get('safety_vest', {}).get('detected', False) and
                        ppe.get('face_mask', {}).get('detected', False)
                    )
                    
                    color = (0, 255, 0) if is_compliant else (0, 0, 255)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    
                    # Add label
                    label = "✓ Compliant" if is_compliant else "✗ Violation"
                    cv2.putText(frame, label, (x1, y1 - 10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                # Encode frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
            except Exception as e:
                print(f"Frame processing error: {e}")
                continue
        
        cap.release()
    
    return StreamingHttpResponse(
        generate_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def test_db(request):
    """Test database connection"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response({'status': 'Database connected!'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

from users.models import Site

@transaction.atomic
def create(self, request, *args, **kwargs):
    """Create a new detection"""
    # ✅ ADD THIS DEBUG BLOCK
    print(f"\n{'='*70}")
    print(f"[DEBUG] NEW DETECTION REQUEST")
    print(f"{'='*70}")
    print(f"[DEBUG] User: {request.user}")
    print(f"[DEBUG] Content-Type: {request.content_type}")
    print(f"[DEBUG] Request data keys: {list(request.data.keys())}")
    print(f"[DEBUG] Request FILES: {list(request.FILES.keys())}")
    print(f"[DEBUG] Auth: {request.auth}")
    print(f"{'='*70}\n")
    
    serializer = self.get_serializer(data=request.data)
    
    # ✅ CHECK VALIDATION
    if not serializer.is_valid():
        print(f"❌ [VALIDATION ERROR]: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class PPEPolicyViewSet(viewsets.ModelViewSet):
    """ViewSet for PPE Policy operations"""
    serializer_class = PPEPolicySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get active PPE policies"""
        # FIXED: Return PPEPolicy objects, not Detection objects!
        queryset = PPEPolicy.objects.filter(is_active=True)
        
        site_id = self.request.query_params.get('site', None)
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        
        return queryset.order_by('name')

from django.http import StreamingHttpResponse
import cv2

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_video(request):
    """Process uploaded video file"""
    video_file = request.FILES.get('video')
    
    if not video_file:
        return Response({'error': 'No video file provided'}, status=400)
    
    # Save video temporarily
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
        for chunk in video_file.chunks():
            tmp.write(chunk)
        video_path = tmp.name
    
    # Process video
    monitor = VideoSafetyMonitor()
    cap = cv2.VideoCapture(video_path)
    
    results = []
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Process every 5th frame for speed
        if frame_count % 5 == 0:
            result = monitor.process_frame(frame)
            results.append({
                'frame': frame_count,
                'stats': result['frame_stats']
            })
        
        frame_count += 1
    
    cap.release()
    os.unlink(video_path)
    
    return Response({
        'total_frames': frame_count,
        'processed_frames': len(results),
        'summary': {
            'avg_persons': sum(r['stats']['total'] for r in results) / len(results) if results else 0,
            'avg_violations': sum(r['stats']['violations'] for r in results) / len(results) if results else 0
        },
        'frame_results': results
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def webcam_stream(request):
    """Stream webcam with PPE detection"""
    def generate():
        monitor = VideoSafetyMonitor()
        cap = cv2.VideoCapture(0)  # Webcam
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame
            result = monitor.process_frame(frame)
            
            # Annotate frame
            annotated = frame.copy()
            for person in result['persons']:
                x1, y1, x2, y2 = [int(c) for c in person['bbox']]
                
                is_compliant = monitor._is_compliant(person)
                color = (0, 255, 0) if is_compliant else (0, 0, 255)
                
                cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                cv2.putText(annotated, f"ID: {person['track_id']}", (x1, y1-10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Encode frame
            _, buffer = cv2.imencode('.jpg', annotated)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        cap.release()
    
    return StreamingHttpResponse(generate(), content_type='multipart/x-mixed-replace; boundary=frame')

class DetectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Detection operations"""
    serializer_class = DetectionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = None
    
    def get_queryset(self):
        """Get detections for current user only"""
        queryset = Detection.objects.filter(user=self.request.user).select_related(
            'site', 'policy', 'user'
        ).prefetch_related(
            'person_detections',
            'violations'
        ).order_by('-created_at')
        
        # Apply filters if provided
        site = self.request.query_params.get('site', None)
        status_param = self.request.query_params.get('status', None)
        compliance_status = self.request.query_params.get('compliance_status', None)
        
        if site:
            queryset = queryset.filter(site_id=site)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if compliance_status:
            queryset = queryset.filter(compliance_status=compliance_status)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return DetectionCreateSerializer
        return DetectionSerializer
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get detection statistics for current user only"""
        queryset = Detection.objects.filter(user=request.user)
        
        total_detections = queryset.count()
        
        if total_detections == 0:
            return Response({
                'total_detections': 0,
                'total_persons_scanned': 0,
                'total_violations': 0,
                'compliant': 0,
                'partial_compliant': 0,
                'non_compliant': 0,
                'compliance_rate': 0,
            })
        
        total_persons = sum(d.total_persons_detected for d in queryset)
        total_violations = Violation.objects.filter(detection__user=request.user).count()
        
        compliant = queryset.filter(compliance_status='compliant').count()
        partial = queryset.filter(compliance_status='partial').count()
        non_compliant = queryset.filter(compliance_status='non_compliant').count()
        
        return Response({
            'total_detections': total_detections,
            'total_persons_scanned': total_persons,
            'total_violations': total_violations,
            'compliant': compliant,
            'partial_compliant': partial,
            'non_compliant': non_compliant,
            'compliance_rate': (compliant / total_detections * 100) if total_detections > 0 else 0,
        })
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new detection"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        image = serializer.validated_data.get('original_image')
        
        # REMOVED: policy_id logic - no longer needed
        
        detection = serializer.save(
            user=request.user,
           
            status='processing',
            policy=None  # No policy
        )
        
        try:
            detector = get_detector()
            print(f"[VIEWS] Using detector: {type(detector).__name__}")
            
            image_path = detection.original_image.path
            print(f"[VIEWS] Processing image: {image_path}")
            
            results = detector.detect(image_path)
            print(f"[VIEWS] Detection results: {results.get('num_persons')} persons found")
            
            # Save annotated image
            if results.get('annotated_image_path'):
                annotated_path = results['annotated_image_path']
                if os.path.exists(annotated_path):
                    with open(annotated_path, 'rb') as f:
                        detection.annotated_image.save(
                            os.path.basename(annotated_path),
                            ContentFile(f.read()),
                            save=False
                        )
                    try:
                        os.remove(annotated_path)
                    except:
                        pass
            
            detection.total_persons_detected = results.get('num_persons', 0)
            detection.confidence_score = results.get('avg_confidence', 0)
            detection.processing_time = results.get('processing_time', 0)
            detection.status = 'completed'
            
            compliant_count = 0
            non_compliant_count = 0
            
            # SIMPLIFIED: Always check Helmet, Vest, Mask (no policy)
            for idx, person in enumerate(results.get('persons', [])):
                bbox = person.get('bbox', [0, 0, 0, 0])
                ppe = person.get('ppe', {})
                
                # Check ONLY these 3 items
                has_helmet = ppe.get('helmet', {}).get('detected', False)
                has_vest = ppe.get('safety_vest', {}).get('detected', False)
                has_mask = ppe.get('face_mask', {}).get('detected', False)
                
                missing_items = []
                if not has_helmet:
                    missing_items.append('helmet')
                if not has_vest:
                    missing_items.append('safety_vest')
                if not has_mask:
                    missing_items.append('face_mask')
                
                is_compliant = len(missing_items) == 0
                
                if is_compliant:
                    compliant_count += 1
                else:
                    non_compliant_count += 1
                
                person_detection = PersonDetection.objects.create(
                    detection=detection,
                    person_id=idx + 1,
                    bbox_x1=float(bbox[0]),
                    bbox_y1=float(bbox[1]),
                    bbox_x2=float(bbox[2]),
                    bbox_y2=float(bbox[3]),
                    confidence=float(person.get('confidence', 0)),
                    helmet_detected=has_helmet,
                    helmet_confidence=float(ppe.get('helmet', {}).get('confidence', 0)),
                    vest_detected=has_vest,
                    vest_confidence=float(ppe.get('safety_vest', {}).get('confidence', 0)),
                    boots_detected=ppe.get('safety_boots', {}).get('detected', False),
                    boots_confidence=float(ppe.get('safety_boots', {}).get('confidence', 0)),
                    gloves_detected=ppe.get('gloves', {}).get('detected', False),
                    gloves_confidence=float(ppe.get('gloves', {}).get('confidence', 0)),
                    glasses_detected=ppe.get('safety_glasses', {}).get('detected', False),
                    glasses_confidence=float(ppe.get('safety_glasses', {}).get('confidence', 0)),
                    mask_detected=has_mask,
                    mask_confidence=float(ppe.get('face_mask', {}).get('confidence', 0)),
                    harness_detected=ppe.get('harness', {}).get('detected', False),
                    harness_confidence=float(ppe.get('harness', {}).get('confidence', 0)),
                    is_compliant=is_compliant,
                    missing_ppe=missing_items
                )
                
                # Create violation if non-compliant
                if not is_compliant and missing_items:
                    violation_desc = f"Person {idx + 1} is missing: {', '.join([item.replace('_', ' ').title() for item in missing_items])}"
                    
                    # Severity based on what's missing
                    severity = 'medium'
                    if 'helmet' in missing_items:
                        severity = 'critical'
                    elif 'safety_vest' in missing_items:
                        severity = 'high'
                    
                    osha_standard = "29 CFR 1910.132"
                    if 'helmet' in missing_items:
                        osha_standard = "29 CFR 1910.135"
                    
                    Violation.objects.create(
                        detection=detection,
                        person_detection=person_detection,
                        violation_type=f"Missing PPE: {', '.join([item.replace('_', ' ').title() for item in missing_items])}",
                        severity=severity,
                        description=violation_desc,
                        recommendation=f"Worker must wear {', '.join([item.replace('_', ' ') for item in missing_items])} before entering work area",
                        osha_standard=osha_standard,
                        status='open'
                    )
            
            detection.compliant_persons = compliant_count
            detection.non_compliant_persons = non_compliant_count
            
            # Overall compliance
            if detection.total_persons_detected == 0:
                detection.compliance_status = 'compliant'
            elif compliant_count == detection.total_persons_detected:
                detection.compliance_status = 'compliant'
            elif non_compliant_count == detection.total_persons_detected:
                detection.compliance_status = 'non_compliant'
            else:
                detection.compliance_status = 'partial'
            
            detection.save()
            # After detection.save()
            # ✅ Create notification
            from .models import Notification

            if detection.compliance_status == 'compliant':
                notif_type = 'success'
                title = '✓ Full Compliance'
                message = f'All {detection.total_persons_detected} persons are compliant'
            elif detection.compliance_status == 'non_compliant':
                notif_type = 'danger'
                title = '✗ Non-Compliant'
                message = f'{detection.non_compliant_persons} out of {detection.total_persons_detected} persons have violations'
            else:
                notif_type = 'warning'
                title = '⚠ Partial Compliance'
                message = f'{detection.compliant_persons} compliant, {detection.non_compliant_persons} non-compliant'

            Notification.objects.create(
                user=request.user,
                type=notif_type,
                title=title,
                message=message,
                detection=detection
            )

            
            output_serializer = DetectionSerializer(detection)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Detection error: {error_trace}")
            
            detection.status = 'failed'
            detection.notes = str(e)
            detection.save()
            
            return Response(
                {'error': f'Detection failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )





class ViolationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Violation operations"""
    serializer_class = ViolationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get violations for current user's detections only"""
        queryset = Violation.objects.filter(
            detection__user=self.request.user
        ).select_related('detection', 'person_detection').order_by('-created_at')
        
        status_param = self.request.query_params.get('status', None)
        severity = self.request.query_params.get('severity', None)
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a violation"""
        violation = self.get_object()
        violation.status = 'acknowledged'
        violation.acknowledged_by = request.user
        violation.acknowledged_at = timezone.now()
        violation.save()
        
        serializer = self.get_serializer(violation)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a violation"""
        violation = self.get_object()
        violation.status = 'resolved'
        violation.resolved_by = request.user
        violation.resolved_at = timezone.now()
        violation.save()
        
        serializer = self.get_serializer(violation)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get real-time notifications from recent detections and violations"""
    try:  # ✅ Add try-catch for debugging
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        recent_detections = Detection.objects.filter(
            user=request.user,
            created_at__gte=twenty_four_hours_ago
        ).order_by('-created_at')[:10]
        
        recent_violations = Violation.objects.filter(
            detection__user=request.user,
            created_at__gte=twenty_four_hours_ago,
            status__in=['open', 'acknowledged']
        ).order_by('-created_at')[:10]
        
        notifications = []
        
        for violation in recent_violations:
            notif_type = 'danger' if violation.severity in ['critical', 'high'] else 'warning'
            notifications.append({
                'id': f'violation_{violation.id}',
                'type': notif_type,
                'title': f'{violation.severity.upper()} - {violation.violation_type}',
                'message': violation.description,
                'timestamp': violation.created_at.isoformat(),  # ✅ Convert to string
                'read': violation.status == 'acknowledged',
                'detection_id': str(violation.detection.id),
                'violation_id': violation.id,
            })
        
        for detection in recent_detections:
            if detection.status == 'completed':
                if detection.compliance_status == 'compliant':
                    notif_type = 'success'
                    title = '✓ Full Compliance'
                    message = f'All {detection.total_persons_detected} persons are compliant'
                elif detection.compliance_status == 'non_compliant':
                    notif_type = 'danger'
                    title = '✗ Non-Compliant'
                    message = f'{detection.non_compliant_persons} out of {detection.total_persons_detected} persons have violations'
                else:
                    notif_type = 'warning'
                    title = '⚠ Partial Compliance'
                    message = f'{detection.compliant_persons} compliant, {detection.non_compliant_persons} non-compliant'
                
                notifications.append({
                    'id': f'detection_{detection.id}',
                    'type': notif_type,
                    'title': title,
                    'message': message,
                    'timestamp': detection.created_at.isoformat(),  # ✅ Convert to string
                    'read': False,
                    'detection_id': str(detection.id),
                    'violation_id': None,
                })
            elif detection.status == 'failed':
                notifications.append({
                    'id': f'detection_{detection.id}',
                    'type': 'danger',
                    'title': 'Detection Failed',
                    'message': f'Image processing failed: {detection.notes or "Unknown error"}',  # ✅ Handle None
                    'timestamp': detection.created_at.isoformat(),  # ✅ Convert to string
                    'read': False,
                    'detection_id': str(detection.id),
                    'violation_id': None,
                })
        
        notifications.sort(key=lambda x: x['timestamp'], reverse=True)
        notifications = notifications[:20]
        
        # ✅ Return raw data (NotificationSerializer expects dict, not objects)
        return Response(notifications)
        
    except Exception as e:
        import traceback
        traceback.print_exc()  # ✅ Print full error to terminal
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        if notification_id.startswith('violation_'):
            violation_id = int(notification_id.split('_')[1])
            try:
                violation = Violation.objects.get(id=violation_id, detection__user=request.user)
                if violation.status == 'open':
                    violation.status = 'acknowledged'
                    violation.acknowledged_by = request.user
                    violation.acknowledged_at = timezone.now()
                    violation.save()
                return Response({'status': 'success', 'message': 'Notification marked as read'})
            except Violation.DoesNotExist:
                return Response({'error': 'Violation not found'}, status=404)
        
        return Response({'status': 'success', 'message': 'Notification marked as read'})
    
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    Violation.objects.filter(
        detection__user=request.user,
        status='open'
    ).update(
        status='acknowledged',
        acknowledged_by=request.user,
        acknowledged_at=timezone.now()
    )
    return Response({'status': 'success'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_detections(request):
    """Debug endpoint to check detections"""
    all_detections = Detection.objects.all()
    user_detections = Detection.objects.filter(user=request.user)
    
    return Response({
        'total_detections': all_detections.count(),
        'your_detections': user_detections.count(),
        'your_username': request.user.username,
        'recent_detections': [
            {
                'id': str(d.id),
                'user': d.user.username,
                'status': d.status,
                'persons': d.total_persons_detected,
            }
            for d in user_detections.order_by('-created_at')[:5]
        ]
    })