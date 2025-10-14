from ultralytics import YOLO
import cv2
import math
import os
from django.conf import settings
import numpy as np
from PIL import Image


class YOLOPPEDetector:
    """Optimized PPE Detection with improved accuracy and multi-format support"""
    
    def __init__(self):
        model_path = os.path.join(settings.BASE_DIR, 'YOLO11n.pt')
        
        if not os.path.exists(model_path):
            alt_paths = [
                os.path.join(settings.BASE_DIR, 'YOLO-Weights', 'ppe.pt'),
                os.path.join(settings.BASE_DIR, 'models', 'ppe_yolo11', 'weights', 'ppe.pt'),
            ]
            
            for alt_path in alt_paths:
                if os.path.exists(alt_path):
                    model_path = alt_path
                    break
            else:
                raise FileNotFoundError(f"ppe.pt model not found in {settings.BASE_DIR}")
        
        self.model = YOLO(model_path)
        self.classNames = ['Hardhat', 'Mask', 'NO-Hardhat', 'NO-Mask', 'NO-Safety Vest', 
                          'Person', 'Safety Cone', 'Safety Vest', 'machinery', 'vehicle']
        
        print(f"[PPE DETECTOR] Loaded: {model_path}")
    
    def _load_image(self, image_path: str):
        """Load image with support for multiple formats (PNG, JPG, BMP, WebP, TIFF, etc.)"""
        try:
            # Try PIL first (supports more formats)
            pil_image = Image.open(image_path)
            
            # Convert to RGB if needed
            if pil_image.mode != 'RGB':
                print(f"[IMAGE] Converting {pil_image.mode} to RGB")
                pil_image = pil_image.convert('RGB')
            
            # Convert PIL to OpenCV format (BGR)
            img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            print(f"[IMAGE] Loaded: {image_path} ({pil_image.format}, {pil_image.mode})")
            return img
            
        except Exception as e:
            print(f"[ERROR] PIL failed, trying cv2: {e}")
            # Fallback to cv2
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")
            return img
    
    def detect(self, image_path: str):
        """Detect PPE with optimized accuracy"""
        import time
        start_time = time.time()
        
        print(f"\n{'='*70}")
        print(f"PROCESSING: {os.path.basename(image_path)}")
        print(f"{'='*70}")
        
        # Use the new image loader
        img = self._load_image(image_path)
        
        height, width = img.shape[:2]
        print(f"Image: {width}x{height}px")
        
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
                
                print(f"  - {class_name}: {conf:.0%}")
                
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
                        'confidence': conf,
                        'color': color
                    })
        
        print(f"\n[RESULTS] {len(all_detections)} detections")
        
        annotated_path = self._create_annotated_image(img, all_detections, image_path)
        persons = self._build_person_data_optimized(all_detections, width, height)
        
        is_compliant = all(p['ppe']['helmet']['detected'] and 
                          p['ppe']['safety_vest']['detected'] and
                          p['ppe']['face_mask']['detected'] 
                          for p in persons) if persons else False
        
        processing_time = time.time() - start_time
        print(f"[TIME] {processing_time:.2f}s\n")
        
        return {
            'num_persons': len(persons),
            'persons': persons,
            'avg_confidence': np.mean([d['confidence'] for d in all_detections]) if all_detections else 0,
            'processing_time': round(processing_time, 2),
            'annotated_image_path': annotated_path,
            'is_compliant': is_compliant
        }
    
    def _build_person_data_optimized(self, all_detections, width, height):
        """OPTIMIZED: Better person-PPE association with enhanced MASK detection"""
        if not all_detections:
            return []
        
        person_detections = [d for d in all_detections if d['class'] == 'Person']
        ppe_items = [d for d in all_detections if d['class'] != 'Person' and d['class'] not in ['Safety Cone', 'machinery', 'vehicle']]
        
        if not person_detections:
            return self._create_single_person_from_ppe(ppe_items, width, height)
        
        assigned_ppe = set()
        persons = []
        
        for idx, person_det in enumerate(person_detections):
            px1, py1, px2, py2 = person_det['bbox']
            person_conf = person_det['confidence']
            person_height = py2 - py1
            person_width = px2 - px1
            
            print(f"\n  👤 Person #{idx+1} at ({px1:.0f}, {py1:.0f}, {px2:.0f}, {py2:.0f})")
            
            regions = {
                'head': [px1 - 80, py1 - 100, px2 + 80, py1 + (person_height * 0.4)],
                'face': [px1 - 60, py1 - 50, px2 + 60, py1 + (person_height * 0.25)],
                'upper_body': [px1 - 70, py1 + (person_height * 0.15), px2 + 70, py1 + (person_height * 0.7)],
                'full_body': [px1 - 120, py1 - 120, px2 + 120, py2 + 120]
            }
            
            ppe_tracking = {
                'helmet': {'detected': False, 'confidence': 0.0, 'source': None, 'ppe_id': None},
                'vest': {'detected': False, 'confidence': 0.0, 'source': None, 'ppe_id': None},
                'mask': {'detected': False, 'confidence': 0.0, 'source': None, 'ppe_id': None}
            }
            
            mask_candidates = []
            
            for ppe_idx, ppe in enumerate(ppe_items):
                ppe_id = f"{ppe['class']}_{ppe_idx}"
                
                if ppe_id in assigned_ppe:
                    continue
                
                ppe_class = ppe['class']
                ppe_bbox = ppe['bbox']
                ppe_conf = ppe['confidence']
                
                head_overlap = self._calculate_overlap_score(regions['head'], ppe_bbox)
                face_overlap = self._calculate_overlap_score(regions['face'], ppe_bbox)
                body_overlap = self._calculate_overlap_score(regions['upper_body'], ppe_bbox)
                full_overlap = self._calculate_overlap_score(regions['full_body'], ppe_bbox)
                
                if ppe_class in ['Hardhat', 'NO-Hardhat']:
                    score = head_overlap * 2.0 + full_overlap * 0.5
                    print(f"     {ppe_class} ({ppe_conf:.2f}) - Head score: {score:.3f}")
                    
                    if score > 0.05:
                        if ppe_conf > ppe_tracking['helmet']['confidence']:
                            detected = (ppe_class == 'Hardhat')
                            ppe_tracking['helmet'] = {
                                'detected': detected,
                                'confidence': ppe_conf,
                                'source': ppe_class,
                                'ppe_id': ppe_id
                            }
                            print(f"     ASSIGNED: {ppe_class} ({ppe_conf:.2f}) - {'✓' if detected else '✗'}")
                
                elif ppe_class in ['Safety Vest', 'NO-Safety Vest']:
                    score = body_overlap * 2.0 + full_overlap * 0.5
                    if score > 0.05:
                        if ppe_conf > ppe_tracking['vest']['confidence']:
                            detected = (ppe_class == 'Safety Vest')
                            ppe_tracking['vest'] = {
                                'detected': detected,
                                'confidence': ppe_conf,
                                'source': ppe_class,
                                'ppe_id': ppe_id
                            }
                            print(f"     ASSIGNED: {ppe_class} ({ppe_conf:.2f}) - {'✓' if detected else '✗'}")
                
                elif ppe_class in ['Mask', 'NO-Mask']:
                    face_score = face_overlap * 3.0
                    head_score = head_overlap * 2.0
                    full_score = full_overlap * 0.8
                    
                    total_score = max(face_score, head_score, full_score)
                    
                    print(f"     {ppe_class} ({ppe_conf:.2f}) - Mask scores: face={face_score:.3f}, head={head_score:.3f}, full={full_score:.3f}, total={total_score:.3f}")
                    
                    if total_score > 0.02:
                        mask_candidates.append({
                            'detected': (ppe_class == 'Mask'),
                            'confidence': ppe_conf,
                            'score': total_score,
                            'source': ppe_class,
                            'ppe_id': ppe_id
                        })
            
            if mask_candidates:
                mask_candidates.sort(key=lambda x: (x['score'], x['confidence']), reverse=True)
                best_mask = mask_candidates[0]
                
                ppe_tracking['mask'] = {
                    'detected': best_mask['detected'],
                    'confidence': best_mask['confidence'],
                    'source': best_mask['source'],
                    'ppe_id': best_mask['ppe_id']
                }
                print(f"     ASSIGNED BEST: {best_mask['source']} ({best_mask['confidence']:.2f}, score={best_mask['score']:.3f}) - {'✓' if best_mask['detected'] else '✗'}")
            
            if ppe_tracking['helmet']['ppe_id']:
                assigned_ppe.add(ppe_tracking['helmet']['ppe_id'])
            if ppe_tracking['vest']['ppe_id']:
                assigned_ppe.add(ppe_tracking['vest']['ppe_id'])
            if ppe_tracking['mask']['ppe_id']:
                assigned_ppe.add(ppe_tracking['mask']['ppe_id'])
            
            has_helmet = ppe_tracking['helmet']['detected']
            has_vest = ppe_tracking['vest']['detected']
            has_mask = ppe_tracking['mask']['detected']
            
            if not has_mask and ppe_tracking['mask']['source'] == 'NO-Mask' and ppe_tracking['mask']['confidence'] < 0.7:
                has_mask = True
                print(f"     INFERENCE: Low NO-Mask confidence ({ppe_tracking['mask']['confidence']:.2f}) - Assuming mask PRESENT")
            
            print(f"     FINAL: Helmet={has_helmet}, Vest={has_vest}, Mask={has_mask}")
            
            persons.append({
                'person_id': idx + 1,
                'bbox': [float(px1), float(py1), float(px2), float(py2)],
                'confidence': round(person_conf, 2),
                'ppe': {
                    'helmet': {
                        'detected': has_helmet,
                        'confidence': round(ppe_tracking['helmet']['confidence'], 2)
                    },
                    'safety_vest': {
                        'detected': has_vest,
                        'confidence': round(ppe_tracking['vest']['confidence'], 2)
                    },
                    'safety_boots': {'detected': True, 'confidence': 0.70},
                    'gloves': {'detected': False, 'confidence': 0.0},
                    'safety_glasses': {'detected': False, 'confidence': 0.0},
                    'face_mask': {
                        'detected': has_mask,
                        'confidence': round(ppe_tracking['mask']['confidence'], 2) if ppe_tracking['mask']['confidence'] > 0 else 0.5
                    },
                    'harness': {'detected': False, 'confidence': 0.0}
                }
            })
        
        return persons
    
    def _create_single_person_from_ppe(self, ppe_items, width, height):
        """Create single person from PPE when no person detected"""
        if not ppe_items:
            return []
        
        all_x = []
        all_y = []
        for d in ppe_items:
            all_x.extend([d['bbox'][0], d['bbox'][2]])
            all_y.extend([d['bbox'][1], d['bbox'][3]])
        
        person_bbox = [float(min(all_x)), float(min(all_y)), 
                    float(max(all_x)), float(max(all_y))]
        
        has_helmet = any(p['class'] == 'Hardhat' for p in ppe_items) and not any(p['class'] == 'NO-Hardhat' for p in ppe_items)
        has_vest = any(p['class'] == 'Safety Vest' for p in ppe_items) and not any(p['class'] == 'NO-Safety Vest' for p in ppe_items)
        has_mask = any(p['class'] == 'Mask' for p in ppe_items) and not any(p['class'] == 'NO-Mask' for p in ppe_items)
        
        return [{
            'person_id': 1,
            'bbox': person_bbox,
            'confidence': 0.85,
            'ppe': {
                'helmet': {'detected': has_helmet, 'confidence': 0.85 if has_helmet else 0.0},
                'safety_vest': {'detected': has_vest, 'confidence': 0.85 if has_vest else 0.0},
                'safety_boots': {'detected': True, 'confidence': 0.70},

            }
        }]
    
    def _calculate_overlap_score(self, box1, box2):
        """Calculate IoU (Intersection over Union) as overlap score"""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)
        
        if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
            return 0.0
        
        intersection = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
        
        area1 = (x1_max - x1_min) * (y1_max - y1_min)
        area2 = (x2_max - x2_min) * (y2_max - y2_min)
        
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _create_annotated_image(self, img, detections, original_path):
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
        
        results_dir = os.path.join(settings.MEDIA_ROOT, 'results')
        os.makedirs(results_dir, exist_ok=True)
        
        import time
        filename = f"annotated_{os.path.splitext(os.path.basename(original_path))[0]}_{int(time.time())}.jpg"
        annotated_path = os.path.join(results_dir, filename)
        
        cv2.imwrite(annotated_path, annotated)
        print(f"[SAVED] {annotated_path}")
        
        return annotated_path


def get_detector():
    return YOLOPPEDetector()
