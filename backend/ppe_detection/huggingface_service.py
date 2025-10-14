import os
import time
import json
import requests
from django.conf import settings
import numpy as np


class HuggingFacePPEDetector:
    """PPE Detector using Gradio API"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        # Use Gradio's /run/predict endpoint
        self.api_url = f"https://{self.space_name.replace('/', '-')}.hf.space/run/predict"
        print(f"[HUGGINGFACE] API URL: {self.api_url}")
    
    def detect(self, image_path: str):
        """Detect PPE"""
        start_time = time.time()
        
        print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
        
        try:
            # Read image as base64
            import base64
            with open(image_path, 'rb') as f:
                image_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            # Gradio expects data in this format
            payload = {
                "data": [
                    f"data:image/jpeg;base64,{image_base64}"
                ]
            }
            
            print(f"[HUGGINGFACE] Sending request...")
            
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=120
            )
            
            print(f"[HUGGINGFACE] Response: {response.status_code}")
            
            if response.status_code != 200:
                raise Exception(f"API returned {response.status_code}: {response.text}")
            
            data = response.json()
            
            # Gradio returns: {"data": [annotated_image_data, json_string]}
            if 'data' in data and len(data['data']) >= 2:
                json_str = data['data'][1]
                results = json.loads(json_str) if isinstance(json_str, str) else json_str
                
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
            else:
                raise Exception(f"Unexpected response format: {data}")
            
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise


def get_detector():
    return HuggingFacePPEDetector()
