import replicate
import os

# Set your token
os.environ["REPLICATE_API_TOKEN"] = "r8_MUwQixq91wqOPIkgAV2XlxWujQeFsys0TkiMO"

# Use an existing YOLO model
# Use Ultralytics official YOLO model
try:
    output = replicate.run(
        "adirik/yolov9:4983b9879d5f02ef6fe8e19b3dc169ed6bb4e4a5b2695c3b0e1a3bc6b45dd5e9",
        input={
            "image": "https://raw.githubusercontent.com/ultralytics/yolov5/master/data/images/bus.jpg",
            "conf": 0.4,
            "iou": 0.5
        }
    )
    
    print("✅ Success!")
    print(f"Output: {output}")
    
except Exception as e:
    print(f"❌ Error: {e}")