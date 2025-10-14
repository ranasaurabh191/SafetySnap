import os
import time
import json
import requests
from django.conf import settings
import cv2
import numpy as np
import tempfile


class HuggingFacePPEDetector:
    """PPE Detector using direct HTTP requests to HuggingFace Space"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        self.api_url = f"https://{self.space_name.replace('/', '-')}.hf.space/api/predict"
        print(f"[HUGGINGFACE] API URL: {self.api_url}")
    
    def detect(self, image_path: str):
        """Detect PPE using direct HTTP POST"""
        start_time = time.time()
        
        print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
        
        try:
            # Read image file
            with open(image_path, 'rb') as f:
                files = {
                    'data': (os.path.basename(image_path), f, 'image/jpeg')
                }
                
                print(f"[HUGGINGFACE] Sending request to: {self.api_url}")
                
                # Send POST request
                response = requests.post(
                    self.api_url,
                    files=files,
                    timeout=120
                )
            
            print(f"[HUGGINGFACE] Response status: {response.status_code}")
            
            if response.status_code != 200:
                raise Exception(f"HuggingFace API returned {response.status_code}: {response.text}")
            
            # Parse response
            result = response.json()
            
            print(f"[HUGGINGFACE] Result keys: {result.keys() if isinstance(result, dict) else 'not a dict'}")
            
            # Expected format: {"data": [image_data, json_string]}
            if isinstance(result, dict) and 'data' in result:
                data = result['data']
                
                if isinstance(data, list) and len(data) >= 2:
                    # data[0] = annotated image (path or base64)
                    # data[1] = JSON string with detection results
                    
                    json_str = data[1]
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
                    
                    return {
                        'num_persons': len(persons),
                        'persons': persons,
                        'avg_confidence': round(avg_confidence, 2),
                        'processing_time': round(processing_time, 2),
                        'annotated_image_path': None,  # We'll handle this later if needed
                    }
                else:
                    raise Exception(f"Unexpected data format: {data}")
            else:
                raise Exception(f"Unexpected response format: {result}")
            
        except requests.exceptions.Timeout:
            raise Exception("HuggingFace Space request timed out (120s)")
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"HuggingFace request failed: {str(e)}")
        
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise


def get_detector():
    """Return detector instance"""
    return HuggingFacePPEDetector()
