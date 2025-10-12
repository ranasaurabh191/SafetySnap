import os
from gradio_client import Client, handle_file
from django.conf import settings


class HuggingFacePPEDetector:
    """Call Hugging Face hosted YOLO model using Gradio Client"""
    
    def __init__(self):
        self.space_name = os.environ.get('HUGGINGFACE_SPACE', 'srb82191/safetysnap-ppe-detector')
        self.client = Client(self.space_name)
        print(f"[HF DETECTOR] Connected to: {self.space_name}")
    
    def detect(self, image_path: str):
        """
        Call Hugging Face API for detection
        
        Args:
            image_path: Path to image file
            
        Returns:
            dict: Detection results with persons, compliance, etc.
        """
        try:
            print(f"[HF DETECTOR] Processing: {image_path}")
            
            # Call Gradio API using the client
            result = self.client.predict(
                image=handle_file(image_path),
                api_name="/predict"
            )
            
            # Result is a tuple: (annotated_image, summary_text, results_json)
            annotated_image_info = result[0]  # Dict with image info
            summary_text = result[1]           # String summary
            results_json = result[2]           # Your detection JSON
            
            print(f"[HF DETECTOR] Success! Detected {results_json.get('num_persons', 0)} persons")
            
            # Save annotated image
            annotated_path = self._save_annotated_image(
                annotated_image_info, 
                image_path
            )
            
            # Add annotated image path to results
            results_json['annotated_image_path'] = annotated_path
            results_json['processing_time'] = 0  # HF doesn't return this
            
            return results_json
            
        except Exception as e:
            print(f"[HF DETECTOR ERROR] {str(e)}")
            raise Exception(f"Detection failed: {str(e)}")
    
    def _save_annotated_image(self, image_info: dict, original_path: str):
        """
        Save annotated image from Gradio response
        
        Args:
            image_info: Dict from Gradio with 'path' or 'url'
            original_path: Original image path for naming
            
        Returns:
            str: Path to saved annotated image
        """
        import time
        import shutil
        from pathlib import Path
        
        # Create results directory
        results_dir = os.path.join(settings.MEDIA_ROOT, 'results')
        os.makedirs(results_dir, exist_ok=True)
        
        # Generate filename
        original_name = Path(original_path).stem
        timestamp = int(time.time())
        filename = f"annotated_{original_name}_{timestamp}.jpg"
        annotated_path = os.path.join(results_dir, filename)
        
        # Copy file from Gradio temp path to our media directory
        if 'path' in image_info and image_info['path']:
            shutil.copy(image_info['path'], annotated_path)
            print(f"[SAVED] {annotated_path}")
        else:
            print(f"[WARNING] No annotated image path in response")
        
        return annotated_path


def get_detector():
    """Factory function to get detector"""
    return HuggingFacePPEDetector()
