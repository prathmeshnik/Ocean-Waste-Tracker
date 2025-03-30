import os
import random
from PIL import Image
import time

# Define the trash categories
TRASH_CATEGORIES = {
    0: 'Plastic Bottle',
    1: 'Glass Bottle',
    2: 'Aluminum Can',
    3: 'Paper/Cardboard',
    4: 'Plastic Bag',
    5: 'Styrofoam',
    6: 'Fishing Net',
    7: 'Cloth/Fabric',
    8: 'Organic Waste',
    9: 'Other'
}

def get_model():
    """
    This function would normally load a pre-trained model.
    For demonstration purposes, we're creating a simple model stub.
    In a real application, you would load a properly trained model.
    """
    # Simulate model loading
    print("Loading trash detection model...")
    
    # For this demo, we'll create a placeholder "model"
    # that will randomly classify input images
    class MockModel:
        def predict(self, img_path):
            # Simulate predictions with random values
            # Each prediction includes class probabilities for various trash types
            num_categories = len(TRASH_CATEGORIES)
            predictions = [random.random() for _ in range(num_categories)]
            return [predictions]
    
    # Return the mock model
    return MockModel()

def preprocess_image(image_path, target_size=(224, 224)):
    """Preprocess image for model input - simplified for demo"""
    try:
        # Just check if image can be opened
        img = Image.open(image_path)
        return image_path
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

def detect_trash_in_image(image_path, model):
    """
    Detect trash in a single image
    
    Args:
        image_path: Path to the image file
        model: Loaded model for prediction
        
    Returns:
        List of dictionaries containing detection results
    """
    # Preprocess image
    img_path = preprocess_image(image_path)
    if not img_path:
        return []
    
    # Make prediction - simplified for demo
    pred = model.predict(img_path)[0]
    
    # Process results
    results = []
    for i, conf in enumerate(pred):
        if conf > 0.2:  # Only include predictions with confidence > 20%
            results.append({
                'trash_type': TRASH_CATEGORIES[i],
                'confidence': float(conf)
            })
    
    # Sort by confidence (descending)
    results = sorted(results, key=lambda x: x['confidence'], reverse=True)
    
    return results

def detect_trash_in_video(video_path, model, sample_interval=30):
    """
    Detect trash in video by sampling frames
    
    Args:
        video_path: Path to video file
        model: Loaded model for prediction
        sample_interval: Process every Nth frame
        
    Returns:
        List of dictionaries containing detection results
    """
    # Simplified for demo - just analyze the video file path
    # In a real application, we would extract frames and process them
    
    # Check if file exists
    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        return []
    
    # For demo purposes, just generate some random detections
    # as if we analyzed several frames
    results = []
    num_detections = random.randint(2, 5)
    
    for _ in range(num_detections):
        # Randomly select trash type
        trash_type_idx = random.randint(0, len(TRASH_CATEGORIES) - 1)
        # Random confidence level between 0.3 and 0.95
        confidence = random.uniform(0.3, 0.95)
        
        results.append({
            'trash_type': TRASH_CATEGORIES[trash_type_idx],
            'confidence': float(confidence)
        })
    
    # Sort by confidence (descending)
    results = sorted(results, key=lambda x: x['confidence'], reverse=True)
    
    return results

def detect_from_camera(model, camera_index=0):
    """
    Stream from camera and detect trash in real-time
    
    Args:
        model: Loaded model for prediction
        camera_index: Camera device index (default: 0 for webcam)
        
    Returns:
        Generator yielding detection results
    """
    # Simplified for demo - in real app, we would access camera
    # For demo purposes, just generate random detections
    
    try:
        # Simulate real-time processing
        for _ in range(10):  # Simulate 10 frames
            # Generate random detections for this frame
            results = []
            
            # 30% chance of detecting something in a frame
            if random.random() < 0.3:
                num_detections = random.randint(1, 3)
                
                for _ in range(num_detections):
                    trash_type_idx = random.randint(0, len(TRASH_CATEGORIES) - 1)
                    confidence = random.uniform(0.4, 0.9)
                    
                    results.append({
                        'trash_type': TRASH_CATEGORIES[trash_type_idx],
                        'confidence': float(confidence)
                    })
                
                # Sort by confidence
                results = sorted(results, key=lambda x: x['confidence'], reverse=True)
            
            # In a real app, we would yield the frame and results
            # Here we just yield the results
            yield None, results
            
            # Simulate frame processing delay
            time.sleep(0.1)
                
    except Exception as e:
        print(f"Error in camera detection: {e}")
        return
