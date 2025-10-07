from ultralytics import YOLO
import cv2
import time
import os
from django.conf import settings

class VideoPPEMonitor:
    """Video PPE monitoring (GitHub repo style)"""
    
    def __init__(self):
        model_path = os.path.join(settings.BASE_DIR, 'yolov8s_custom.pt')
        self.model = YOLO(model_path)
        
        self.safety_classes = ['Glass', 'Gloves', 'Helmet', 'Safety-Vest', 'helmet']
        self.last_check_time = time.time()
        
        # Directory for violation snapshots
        self.violation_dir = os.path.join(settings.MEDIA_ROOT, 'violations')
        os.makedirs(self.violation_dir, exist_ok=True)
    
    def process_video(self, video_path: str):
        """Process video file (GitHub style)"""
        cap = cv2.VideoCapture(video_path)
        
        violation_frames = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Process every 30th frame for speed
            if frame_count % 30 != 0:
                continue
            
            # Run detection
            results = self.model(frame, verbose=False)
            detected_classes = []
            
            for r in results:
                for box in r.boxes:
                    class_name = self.model.names[int(box.cls[0])]
                    
                    if class_name in self.safety_classes:
                        detected_classes.append(class_name)
                        
                        # Draw box on frame
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
                        cv2.putText(frame, class_name, (x1, y1 - 10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
            
            # Check for missing safety items (GitHub logic)
            current_time = time.time()
            if current_time - self.last_check_time >= 15:
                for safety_item in self.safety_classes:
                    if safety_item not in detected_classes:
                        # Save violation snapshot
                        now = time.localtime()
                        filename = f"{now.tm_year}{now.tm_mon}{now.tm_mday}_{now.tm_hour}{now.tm_min}{now.tm_sec}.jpg"
                        filepath = os.path.join(self.violation_dir, filename)
                        cv2.imwrite(filepath, frame)
                        
                        violation_frames.append({
                            'frame': frame_count,
                            'timestamp': current_time,
                            'missing_item': safety_item,
                            'snapshot': filepath
                        })
                        break
                
                self.last_check_time = current_time
        
        cap.release()
        
        return {
            'total_frames': frame_count,
            'violations': violation_frames,
            'violation_count': len(violation_frames)
        }
