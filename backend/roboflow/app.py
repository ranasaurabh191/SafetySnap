import gradio as gr
from ultralytics import YOLO
import cv2
import math
import os
import numpy as np
from PIL import Image
import json
import tempfile

class YOLOPPEDetector:
    """Optimized PPE Detection - Hugging Face Version"""
    
    def __init__(self, model_path='YOLO11n.pt'):
        self.model = YOLO(model_path)
        self.classNames = ['Hardhat', 'Mask', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 
                          'Person', 'Safety Cone', 'Safety Vest', 'machinery', 'vehicle']
        print(f"[PPE DETECTOR] Model loaded: {model_path}")
    
    def _load_image(self, image):
        """Load image - accepts PIL Image or numpy array"""
        if isinstance(image, np.ndarray):
            return image
        elif isinstance(image, Image.Image):
            img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            return img
        else:
            raise ValueError("Unsupported image format")
    
    def detect(self, image):
        """Main detection function"""
        img = self._load_image(image)
        height, width = img.shape[:2]
        
        results = self.model(img, stream=True, conf=0.4, iou=0.5)
        
        all_detections = []
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                
                conf = math.ceil((box.conf[0] * 100)) / 100
                cls = int(box.cls[0])
                class_name = self.classNames[cls]
                
                # Color coding
                if class_name in ['Mask', 'Hardhat', 'Safety Vest']:
                    color = (0, 255, 0)
                elif class_name in ['NO-Hardhat', 'NO-Mask', 'NO-Safety Vest']:
                    color = (0, 0, 255)
                elif class_name in ['machinery', 'vehicle']:
                    color = (0, 149, 255)
                else:
                    color = (85, 45, 255)
                
                if conf > 0.4:
                    all_detections.append({
                        'class': class_name,
                        'bbox': [x1, y1, x2, y2],
                        'confidence': float(conf),
                        'color': color
                    })
        
        # Create annotated image
        annotated_img = self._create_annotated_image(img, all_detections)
        
        # Build person data
        persons = self._build_person_data_optimized(all_detections, width, height)
        
        # Calculate compliance
        is_compliant = all(
            p['ppe']['helmet']['detected'] and 
            p['ppe']['safety_vest']['detected'] and
            p['ppe']['face_mask']['detected'] 
            for p in persons
        ) if persons else False
        
        results_json = {
            'num_persons': len(persons),
            'persons': persons,
            'is_compliant': is_compliant,
            'total_detections': len(all_detections),
            'avg_confidence': float(np.mean([d['confidence'] for d in all_detections])) if all_detections else 0
        }
        
        return annotated_img, results_json
    
    def _build_person_data_optimized(self, all_detections, width, height):
        """Your existing person-PPE association logic"""
        # ... [COPY YOUR ENTIRE _build_person_data_optimized METHOD HERE] ...
        # (I'll skip copying it to save space, but USE YOUR EXACT CODE)
        
        person_detections = [d for d in all_detections if d['class'] == 'Person']
        ppe_items = [d for d in all_detections if d['class'] != 'Person' and d['class'] not in ['Safety Cone', 'machinery', 'vehicle']]
        
        if not person_detections:
            return self._create_single_person_from_ppe(ppe_items, width, height)
        
        # ... rest of your logic ...
        # (Use your complete implementation from above)
        
        persons = []  # Build as in your code
        return persons
    
    def _create_single_person_from_ppe(self, ppe_items, width, height):
        """Your existing method"""
        # ... [COPY YOUR EXACT CODE] ...
        pass
    
    def _calculate_overlap_score(self, box1, box2):
        """Your existing IoU calculation"""
        # ... [COPY YOUR EXACT CODE] ...
        pass
    
    def _create_annotated_image(self, img, detections):
        """Create annotated image"""
        annotated = img.copy()
        
        for detection in detections:
            class_name = detection['class']
            x1, y1, x2, y2 = detection['bbox']
            conf = detection['confidence']
            color = detection['color']
            
            label = f'{class_name} {conf:.2f}'
            t_size = cv2.getTextSize(label, 0, fontScale=0.8, thickness=2)[0]
            c2 = x1 + t_size[0], y1 - t_size[1] - 3
            
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)
            cv2.rectangle(annotated, (x1, y1), c2, color, -1, cv2.LINE_AA)
            cv2.putText(annotated, label, (x1, y1 - 2), 0, 0.8, [255, 255, 255], thickness=2, lineType=cv2.LINE_AA)
        
        return cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)  # Convert back to RGB for display


# Initialize detector globally
detector = YOLOPPEDetector('YOLO11n.pt')


def predict_ppe(image):
    """Main prediction function for Gradio"""
    try:
        annotated_img, results_json = detector.detect(image)
        
        # Format results for display
        summary = f"""
        🔍 **Detection Results**
        
        👥 Persons Detected: {results_json['num_persons']}
        ✅ Overall Compliance: {'YES' if results_json['is_compliant'] else 'NO'}
        📊 Total Detections: {results_json['total_detections']}
        🎯 Avg Confidence: {results_json['avg_confidence']:.2%}
        
        **Person Details:**
        """
        
        for person in results_json['persons']:
            pid = person['person_id']
            ppe = person['ppe']
            summary += f"\n\n👤 Person #{pid}:\n"
            summary += f"  🪖 Helmet: {'✓' if ppe['helmet']['detected'] else '✗'} ({ppe['helmet']['confidence']:.0%})\n"
            summary += f"  🦺 Vest: {'✓' if ppe['safety_vest']['detected'] else '✗'} ({ppe['safety_vest']['confidence']:.0%})\n"
            summary += f"  😷 Mask: {'✓' if ppe['face_mask']['detected'] else '✗'} ({ppe['face_mask']['confidence']:.0%})\n"
        
        return annotated_img, summary, results_json
        
    except Exception as e:
        return None, f"❌ Error: {str(e)}", {"error": str(e)}


# Create Gradio interface
demo = gr.Interface(
    fn=predict_ppe,
    inputs=gr.Image(type="pil", label="Upload Image"),
    outputs=[
        gr.Image(type="numpy", label="Annotated Image"),
        gr.Textbox(label="Detection Summary", lines=15),
        gr.JSON(label="Full Results (JSON)")
    ],
    title="🦺 SafetySnap PPE Detector",
    description="Upload an image to detect Personal Protective Equipment (PPE) compliance",
    examples=[
        # Add example images if you have them
    ],
    api_name="predict"  # Enable API access
)

if __name__ == "__main__":
    demo.launch()
