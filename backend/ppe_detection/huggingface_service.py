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
    print("[WARNING] gradio_client.handle_file not available - using direct file paths")


class HuggingFacePPEDetector:
    """PPE Detector using HuggingFace Gradio Space - matches YOLO detector format"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        print(f"\n{'='*70}")
        print(f"[HUGGINGFACE] Connecting to space: {self.space_name}")
        
        # Retry logic for cold starts
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.client = Client(self.space_name)
                print(f"[HUGGINGFACE] ✓ Connected successfully!")
                print(f"{'='*70}\n")
                break
            except json.JSONDecodeError as e:
                print(f"[HUGGINGFACE] Connection attempt {attempt + 1} failed: Space may be sleeping or returning HTML")
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 15  # 15s, 30s, 45s
                    print(f"[HUGGINGFACE] Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"HuggingFace Space is not responding. Please wake it up at: https://huggingface.co/spaces/{self.space_name}")
            except Exception as e:
                print(f"[HUGGINGFACE] Connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 10
                    print(f"[HUGGINGFACE] Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Failed to connect to HuggingFace Space after {max_retries} attempts: {str(e)}")
    
    def detect(self, image_path: str):
        """Detect PPE - matches YOLO detector output format"""
        start_time = time.time()
        
        print(f"\n{'='*70}")
        print(f"PROCESSING: {os.path.basename(image_path)}")
        print(f"{'='*70}")
        
        try:
            # Prepare image input
            if HAS_HANDLE_FILE:
                image_input = handle_file(image_path)
                print("[HUGGINGFACE] Using handle_file for image input")
            else:
                image_input = image_path
                print("[HUGGINGFACE] Using direct file path for image input")
            
            print(f"[HUGGINGFACE] Sending request to Space...")
            
            # Call the HuggingFace Space API
            result = self.client.predict(
                image_input,
                api_name="/predict"
            )
            
            print(f"[HUGGINGFACE] Response received. Type: {type(result)}")
            
            # Parse result based on format
            if isinstance(result, tuple) and len(result) >= 2:
                # Format: (annotated_image_path, json_string)
                annotated_image_path = result[0]
                detections_json_str = result[1]
                
                try:
                    detections_data = json.loads(detections_json_str) if isinstance(detections_json_str, str) else detections_json_str
                except:
                    detections_data = {}
                
                print(f"[HUGGINGFACE] Parsed detections: {len(detections_data.get('persons', []))} persons")
                
                # Convert to YOLO format
                persons = detections_data.get('persons', [])
                num_persons = len(persons)
                
                # Save annotated image to local media folder
                local_annotated_path = self._save_annotated_image(annotated_image_path, image_path)
                
                processing_time = time.time() - start_time
                print(f"[TIME] {processing_time:.2f}s\n")
                
                # Check compliance
                is_compliant = all(
                    p.get('ppe', {}).get('helmet', {}).get('detected', False) and 
                    p.get('ppe', {}).get('safety_vest', {}).get('detected', False) and
                    p.get('ppe', {}).get('face_mask', {}).get('detected', False)
                    for p in persons
                ) if persons else False
                
                # Calculate average confidence
                all_confidences = []
                for person in persons:
                    all_confidences.append(person.get('confidence', 0))
                    ppe = person.get('ppe', {})
                    for item in ppe.values():
                        if isinstance(item, dict) and 'confidence' in item:
                            all_confidences.append(item['confidence'])
                
                avg_confidence = np.mean(all_confidences) if all_confidences else 0
                
                return {
                    'num_persons': num_persons,
                    'persons': persons,
                    'avg_confidence': round(avg_confidence, 2),
                    'processing_time': round(processing_time, 2),
                    'annotated_image_path': local_annotated_path,
                    'is_compliant': is_compliant
                }
            
            elif isinstance(result, dict):
                # Already in correct format
                processing_time = time.time() - start_time
                result['processing_time'] = round(processing_time, 2)
                return result
            
            else:
                raise Exception(f"Unexpected result format: {type(result)}")
            
        except Exception as e:
            print(f"[HUGGINGFACE] Detection error: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _save_annotated_image(self, hf_image_path, original_path):
        """Save HuggingFace annotated image to local media folder"""
        try:
            # Create results directory
            results_dir = os.path.join(settings.MEDIA_ROOT, 'results')
            os.makedirs(results_dir, exist_ok=True)
            
            # Generate filename
            import time
            filename = f"annotated_{os.path.splitext(os.path.basename(original_path))[0]}_{int(time.time())}.jpg"
            local_path = os.path.join(results_dir, filename)
            
            # Read HuggingFace image and save locally
            if os.path.exists(hf_image_path):
                img = cv2.imread(hf_image_path)
                cv2.imwrite(local_path, img)
                print(f"[SAVED] {local_path}")
                return local_path
            else:
                print(f"[WARNING] HuggingFace image not found: {hf_image_path}")
                return None
        
        except Exception as e:
            print(f"[ERROR] Failed to save annotated image: {e}")
            return None


def get_detector():
    """Return the HuggingFace detector instance"""
    return HuggingFacePPEDetector()
