from ultralytics import YOLO
import torch

def main():
    print(f"CUDA Available: {torch.cuda.is_available()}")
    print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")

    model = YOLO('yolo11n.pt')  # nano model for faster training

    results = model.train(
        data='PPEs-7/data.yaml',
        epochs=100,
        imgsz=640,
        batch=16,
        device=0,
        workers=8,         # fix for Windows
        patience=20,
        save=True,
        project='models',
        name='ppe_yolo11',
        exist_ok=True,
        pretrained=True,
        optimizer='AdamW',
        lr0=0.001,
        mosaic=1.0,
        augment=True,
        cache=False,       # optional if low RAM
    )

    metrics = model.val()

    print(f"\nTraining completed!")
    print(f"Best model saved at: ./backend/ppe.pt")
    print(f"mAP50-95: {metrics.box.map}")
    print(f"mAP50: {metrics.box.map50}")

if __name__ == "__main__":
    main()
