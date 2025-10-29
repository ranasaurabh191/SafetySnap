import os
import sys
import django
import cv2
import time
import math
from threading import Lock

# Setup Django environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safetysnap_api.settings')
django.setup()

from .yolo_service import get_detector  # Import your YOLO detector factory


def main():
    detector = get_detector()
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Cannot open webcam")
        return
    
    print("Starting live detection. Press 'q' to quit.")
    
    lock = Lock()
    annotated_frame = None
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame")
            break
        
        start_time = time.time()
        
        # Run detection on every frame (or modify frame_count%N for speed)
        detections = detector.detect_frame(frame)
        
        annotated = frame.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            conf = det['confidence']
            cls = det['class']
            color = det['color']
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            label = f"{cls} {conf:.2f}"
            t_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(annotated, (x1, y1), (x1 + t_size[0], y1 - t_size[1] - 3), color, -1)
            cv2.putText(annotated, label, (x1, y1 - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        fps = 1.0 / (time.time() - start_time)
        cv2.putText(annotated, f"FPS: {fps:.2f}", (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        with lock:
            annotated_frame = annotated
        
        cv2.imshow("Live PPE Detection", annotated_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
