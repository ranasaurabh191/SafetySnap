import os
import time
import json
import requests
from django.conf import settings
import numpy as np
import base64
from PIL import Image
import io


class HuggingFacePPEDetector:
    """PPE Detector using simple HTTP API"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        # Use the /api/detect endpoint
        self.api_url = f"https://{self.space_name.replace('/', '-')}.hf.space/api/detect"
        print(f"[HUGGINGFACE] API URL: {self.api_url}")
    
    def detect(self, image_path: str):
        """Detect PPE using simple HTTP POST"""
        start_time = time.time()
        
        print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
        
        try:
            # Open and send image
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/jpeg')}
                
                print(f"[HUGGINGFACE] Sending request...")
                
                response = requests.post(
                    self.api_url,
                    files=files,
                    timeout=120
                )
            
            print(f"[HUGGINGFACE] Response: {response.status_code}")
            
            if response.status_code != 200:
                raise Exception(f"API returned {response.status_code}: {response.text}")
            
            data = response.json()
            
            if not data.get('success'):
                raise Exception(f"Detection failed: {data.get('error', 'Unknown error')}")
            
            results = data['results']
            persons = results.get('persons', [])
            
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
                'annotated_image_path': None,
            }
            
        except requests.exceptions.Timeout:
            raise Exception("HuggingFace Space timed out (120s)")
        
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise


def get_detector():
    return HuggingFacePPEDetector()
