import os
import time
import json
from gradio_client import Client, handle_file
from django.conf import settings
import numpy as np


class HuggingFacePPEDetector:
    """PPE Detector using gradio_client (correct usage)"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        print(f"[HUGGINGFACE] Space: {self.space_name}")
        self.client = None
    
    def detect(self, image_path: str):
        """Detect PPE using gradio_client"""
        start_time = time.time()
        
        # Connect on first use
        if self.client is None:
            print("[HUGGINGFACE] Connecting to Space...")
            self.client = Client(self.space_name)
            print("[HUGGINGFACE] ✓ Connected!")
        
        try:
            print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
            
            # Use handle_file() to properly upload the image
            result = self.client.predict(
                image=handle_file(image_path),
                api_name="/predict"
            )
            
            print(f"[HUGGINGFACE] Result type: {type(result)}")
            
            # Result is a tuple: (annotated_image_dict, json_string)
            if isinstance(result, tuple) and len(result) >= 2:
                annotated_image_data = result[0]  # Dict with image info
                json_str = result[1]  # JSON string with detections
                
                # Parse detections JSON
                detections_data = json.loads(json_str) if isinstance(json_str, str) else json_str
                
                persons = detections_data.get('persons', [])
                
                print(f"[HUGGINGFACE] Found {len(persons)} persons")
                
                processing_time = time.time() - start_time
                
                # Calculate average confidence
                all_confidences = []
                for person in persons:
                    all_confidences.append(person.get('confidence', 0))
                    ppe = person.get('ppe', {})
                    for item in ppe.values():
                        if isinstance(item, dict) and 'confidence' in item:
                            all_confidences.append(item['confidence'])
                
                avg_confidence = np.mean(all_confidences) if all_confidences else 0
                
                # Check compliance
                is_compliant = all(
                    p.get('ppe', {}).get('helmet', {}).get('detected', False) and 
                    p.get('ppe', {}).get('safety_vest', {}).get('detected', False) and
                    p.get('ppe', {}).get('face_mask', {}).get('detected', False)
                    for p in persons
                ) if persons else False
                
                return {
                    'num_persons': len(persons),
                    'persons': persons,
                    'avg_confidence': round(avg_confidence, 2),
                    'processing_time': round(processing_time, 2),
                    'annotated_image_path': annotated_image_data.get('path') if isinstance(annotated_image_data, dict) else None,
                    'is_compliant': is_compliant
                }
            
            else:
                raise Exception(f"Unexpected result format: {type(result)}")
            
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise


def get_detector():
    """Return detector instance"""
    return HuggingFacePPEDetector()
