import os
import time
import json
import requests
from django.conf import settings
import numpy as np
import base64


class HuggingFacePPEDetector:
    """PPE Detector using HuggingFace Gradio Space"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        self.base_url = f"https://{self.space_name.replace('/', '-')}.hf.space"
        print(f"[HUGGINGFACE] Space: {self.space_name}")
        print(f"[HUGGINGFACE] URL: {self.base_url}")
    
    def detect(self, image_path: str):
        """Detect PPE using Gradio API"""
        start_time = time.time()
        
        print(f"[HUGGINGFACE] Processing: {os.path.basename(image_path)}")
        
        try:
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Try direct API call first
            api_url = f"{self.base_url}/api/predict"
            
            print(f"[HUGGINGFACE] Trying direct API: {api_url}")
            
            try:
                response = requests.post(
                    api_url,
                    json={"data": [f"data:image/jpeg;base64,{image_base64}"]},
                    timeout=120
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'data' in data and len(data['data']) >= 2:
                        json_str = data['data'][1]
                        results = json.loads(json_str) if isinstance(json_str, str) else json_str
                        
                        return self._format_results(results, time.time() - start_time)
            
            except Exception as direct_error:
                print(f"[HUGGINGFACE] Direct API failed: {direct_error}")
            
            # Fallback: Try Gradio API with polling
            print(f"[HUGGINGFACE] Trying Gradio API with polling...")
            
            submit_url = f"{self.base_url}/gradio_api/call/predict"
            
            response = requests.post(
                submit_url,
                json={"data": [f"data:image/jpeg;base64,{image_base64}"]},
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Submit failed: {response.status_code} - {response.text}")
            
            result = response.json()
            event_id = result.get('event_id')
            
            if not event_id:
                raise Exception(f"No event_id: {result}")
            
            print(f"[HUGGINGFACE] Event ID: {event_id}")
            
            # Poll for results
            status_url = f"{self.base_url}/gradio_api/call/predict/{event_id}"
            
            max_wait = 120
            elapsed = 0
            
            while elapsed < max_wait:
                try:
                    response = requests.get(status_url, stream=True, timeout=10)
                    
                    for line in response.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith('data: '):
                                data_str = line_str[6:]
                                try:
                                    data = json.loads(data_str)
                                    
                                    if isinstance(data, list) and len(data) >= 2:
                                        json_str = data[1]
                                        results = json.loads(json_str) if isinstance(json_str, str) else json_str
                                        
                                        return self._format_results(results, time.time() - start_time)
                                
                                except json.JSONDecodeError:
                                    continue
                
                except Exception as poll_error:
                    print(f"[HUGGINGFACE] Poll error: {poll_error}")
                
                time.sleep(2)
                elapsed += 2
            
            raise Exception("Timeout waiting for results")
            
        except Exception as e:
            print(f"[HUGGINGFACE] Error: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _format_results(self, results, processing_time):
        """Format detection results"""
        persons = results.get('persons', [])
        
        print(f"[HUGGINGFACE] Found {len(persons)} persons")
        
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


def get_detector():
    return HuggingFacePPEDetector()
