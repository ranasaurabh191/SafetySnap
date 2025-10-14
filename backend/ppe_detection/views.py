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

from .models import Detection, PersonDetection, Violation, PPEPolicy
from .serializers import (
    DetectionSerializer, DetectionCreateSerializer,
    PersonDetectionSerializer, ViolationSerializer, PPEPolicySerializer,
    NotificationSerializer
)
from .huggingface_service import get_detector  # ✅ Use this




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
