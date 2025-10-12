import os
import time
import json
from gradio_client import Client
from django.conf import settings
import cv2
import numpy as np

# Compatibility layer
try:
    from gradio_client import handle_file
    HAS_HANDLE_FILE = True
except ImportError:
    HAS_HANDLE_FILE = False


class HuggingFacePPEDetector:
    """PPE Detector using HuggingFace Gradio Space"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        print(f"[HUGGINGFACE] Connecting to: {self.space_name}")
        
        # Single attempt - no retries during init
        try:
            self.client = Client(self.space_name)
            print(f"[HUGGINGFACE] ✓ Connected!")
        except Exception as e:
            print(f"[HUGGINGFACE] ✗ Connection failed: {e}")
            # Don't raise - allow detect() to retry
            self.client = None
    
    def detect(self, image_path: str):
        """Detect PPE with retry logic"""
        start_time = time.time()
        
        # Retry connection if failed during init
        if self.client is None:
            print("[HUGGINGFACE] Retrying connection...")
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    self.client = Client(self.space_name)
                    print(f"[HUGGINGFACE] ✓ Connected on attempt {attempt + 1}")
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise Exception(f"Failed to connect to HuggingFace Space: {str(e)}")
                    time.sleep(10)
        
        try:
            print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
            
            # Prepare input
            if HAS_HANDLE_FILE:
                image_input = handle_file(image_path)
            else:
                image_input = image_path
            
            # Call Space API
            result = self.client.predict(
                image_input,
                api_name="/predict"
            )
            
            print(f"[HUGGINGFACE] Result type: {type(result)}")
            
            # Parse result
            if isinstance(result, tuple) and len(result) >= 2:
                annotated_image_path = result[0]
                detections_json_str = result[1]
                
                detections_data = json.loads(detections_json_str) if isinstance(detections_json_str, str) else detections_json_str
                
                persons = detections_data.get('persons', [])
                
                # Save annotated image
                local_annotated_path = self._save_annotated_image(annotated_image_path, image_path)
                
                processing_time = time.time() - start_time
                
                all_confidences = []
                for person in persons:
                    all_confidences.append(person.get('confidence', 0))
                    ppe = person.get('ppe', {})
                    for item in ppe.values():
                        if isinstance(item, dict) and 'confidence' in item:
                            all_confidences.append(item['confidence'])
                
                return {
                    'num_persons': len(persons),
                    'persons': persons,
                    'avg_confidence': round(np.mean(all_confidences) if all_confidences else 0, 2),
                    'processing_time': round(processing_time, 2),
                    'annotated_image_path': local_annotated_path,
                }
            
            else:
                raise Exception(f"Unexpected result format from HuggingFace: {type(result)}")
            
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _save_annotated_image(self, hf_image_path, original_path):
        """Save annotated image locally"""
        try:
            results_dir = os.path.join(settings.MEDIA_ROOT, 'results')
            os.makedirs(results_dir, exist_ok=True)
            
            filename = f"annotated_{os.path.splitext(os.path.basename(original_path))[0]}_{int(time.time())}.jpg"
            local_path = os.path.join(results_dir, filename)
            
            if os.path.exists(hf_image_path):
                img = cv2.imread(hf_image_path)
                cv2.imwrite(local_path, img)
                return local_path
            else:
                return None
        
        except Exception as e:
            print(f"[ERROR] Failed to save image: {e}")
            return None


def get_detector():
    """Return detector instance"""
    return HuggingFacePPEDetector()
