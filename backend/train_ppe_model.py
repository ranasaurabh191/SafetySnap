from ultralytics import YOLO
import os

def train_ppe_model():
    """Train PPE detection model using official Ultralytics dataset"""
    
    print("="*70)
    print("TRAINING PPE DETECTION MODEL")
    print("This will take 15-30 minutes depending on your GPU")
    print("="*70)
    
    # Load base YOLO11 model (auto-downloads if not present)
    model = YOLO("yolo11n.pt")
    
    # Train on Construction-PPE dataset (auto-downloads dataset)
    print("\n[1/3] Downloading Construction-PPE dataset...")
    print("[2/3] Training model (50 epochs)...")
    
    results = model.train(
        data="construction-ppe.yaml",  # Auto-downloads dataset
        epochs=50,
        imgsz=640,
        batch=16,
        name="ppe_detection",
        device=0,  # Use GPU (or 'cpu' for CPU)
        patience=10,
        save=True,
        plots=True
    )
    
    print("\n[3/3] Training complete!")
    print(f"Best model saved at: runs/detect/ppe_detection/weights/best.pt")
    
    # Copy to project root
    import shutil
    best_model_path = "runs/detect/ppe_detection/weights/best.pt"
    target_path = "best.pt"
    
    if os.path.exists(best_model_path):
        shutil.copy(best_model_path, target_path)
        print(f"Model copied to: {target_path}")
    
    return best_model_path

if __name__ == "__main__":
    train_ppe_model()
