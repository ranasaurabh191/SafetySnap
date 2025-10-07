import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safetysnap_api.settings')
django.setup()

from ppe_detection.yolo_service import get_detector

# Test the detector
detector = get_detector()
print("YOLO detector loaded successfully!")

# Test with an image
test_image = "path/to/your/test/image.jpg"  # Replace with actual path
if os.path.exists(test_image):
    results = detector.detect(test_image)
    print(f"\nDetection Results:")
    print(f"  Persons detected: {results['num_persons']}")
    print(f"  Processing time: {results['processing_time']}s")
    print(f"  Average confidence: {results['avg_confidence']}")
    
    for person in results['persons']:
        print(f"\n  Person {person['person_id']}:")
        print(f"    Confidence: {person['confidence']}")
        print(f"    Helmet: {person['ppe']['helmet']}")
        print(f"    Vest: {person['ppe']['safety_vest']}")
