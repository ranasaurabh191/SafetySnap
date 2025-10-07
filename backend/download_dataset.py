from roboflow import Roboflow

# Initialize Roboflow
rf = Roboflow(api_key="WD3ili8Asib7J2Z7W76Q")  

# Download PPE dataset
project = rf.workspace("personal-protective-equipment").project("ppes-kaxsi")
dataset = project.version(7).download("yolov11")

print("Dataset downloaded successfully!")
print(f"Dataset location: {dataset.location}")
