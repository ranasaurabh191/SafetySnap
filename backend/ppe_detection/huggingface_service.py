import os
from gradio_client import Client

# Compatibility layer for different gradio_client versions
try:
    from gradio_client import handle_file
    HAS_HANDLE_FILE = True
except ImportError:
    HAS_HANDLE_FILE = False
    print("[WARNING] gradio_client.handle_file not available - using direct file paths")


class HuggingFacePPEDetector:
    """PPE Detector using HuggingFace Gradio Space"""
    
    def __init__(self):
        self.space_name = os.environ.get(
            'HUGGINGFACE_SPACE', 
            'srb82191/safetysnap-ppe-detector'
        )
        print(f"[HUGGINGFACE] Connecting to space: {self.space_name}")
        self.client = Client(self.space_name)
        print(f"[HUGGINGFACE] Connected successfully!")
    
    def detect(self, image_path):
        """Send image to HuggingFace Space for detection"""
        try:
            print(f"[HUGGINGFACE] Processing image: {image_path}")
            
            # Use handle_file if available, otherwise just pass the path
            if HAS_HANDLE_FILE:
                image_input = handle_file(image_path)
                print("[HUGGINGFACE] Using handle_file for image input")
            else:
                image_input = image_path
                print("[HUGGINGFACE] Using direct file path for image input")
            
            # Call the HuggingFace Space API
            result = self.client.predict(
                image_input,
                api_name="/predict"
            )
            
            print(f"[HUGGINGFACE] Detection complete. Result type: {type(result)}")
            
            # Parse the result based on the Space's output format
            if isinstance(result, dict):
                return result
            elif isinstance(result, tuple):
                # If result is a tuple, first element is usually the data
                return {
                    'annotated_image_path': result[0] if len(result) > 0 else None,
                    'detections_json': result[1] if len(result) > 1 else {},
                    'num_persons': result[2] if len(result) > 2 else 0,
                }
            else:
                print(f"[HUGGINGFACE] Unexpected result format: {result}")
                return {
                    'error': 'Unexpected result format from HuggingFace',
                    'raw_result': str(result)
                }
            
        except Exception as e:
            print(f"[HUGGINGFACE] Detection error: {e}")
            import traceback
            traceback.print_exc()
            raise


def get_detector():
    """Return the HuggingFace detector instance"""
    return HuggingFacePPEDetector()
