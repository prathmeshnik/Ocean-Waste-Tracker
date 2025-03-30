# Ocean Trash Detection System - Installation Guide

## Prerequisites

1. **Python 3.8+**: Make sure you have Python 3.8 or newer installed
2. **Git**: To clone the repository (optional)

## Installation Steps

### 1. Clone or Download the Project

Either clone the repository using Git:
```bash
git clone <repository-url>
cd ocean-trash-detection
```

Or download as a ZIP file and extract it.

### 2. Set Up a Virtual Environment (Recommended)

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Required Packages

```bash
pip install flask flask-login flask-sqlalchemy flask-wtf email-validator 
pip install gunicorn matplotlib numpy opencv-python pandas
pip install psycopg2-binary sqlalchemy tensorflow werkzeug wtforms xlsxwriter
pip install pillow python-dotenv
```

### 4. Configure Environment Variables

Create a `.env` file in the project root directory with the following content:
```
DATABASE_URL=sqlite:///instance/site.db
SESSION_SECRET=your_secure_random_string_here
```

For production, you might want to use PostgreSQL instead of SQLite.

### 5. Create Upload Directory

```bash
mkdir -p static/uploads
```

### 6. Set Upload Folder in app.py

Make sure to add the following configuration to app.py:

```python
# Add this near the top imports
import os

# Add this after app configuration
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
```

### 7. Initialize the Database

```bash
python
```

```python
from app import app, db
with app.app_context():
    db.create_all()
exit()
```

### 8. Run the Application

```bash
# Development mode
python main.py

# Or using gunicorn (Linux/macOS)
gunicorn --bind 0.0.0.0:5000 main:app
```

## Usage

1. Open your browser and navigate to: `http://localhost:5000`
2. Register for a new account
3. Log in with your credentials
4. Use the upload feature to detect trash in images/videos
5. Or use the livestream feature with your webcam

## System Requirements

- **OS**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM (8GB+ recommended for TensorFlow)
- **Storage**: At least 500MB free space (more if using a large dataset)
- **Camera**: Required for livestream feature

## Troubleshooting

- If you encounter issues with OpenCV or TensorFlow, make sure you have the correct versions compatible with your system
- For webcam access issues, check that your browser has camera permissions
- For database errors, verify that the DATABASE_URL environment variable is correctly set
- If you're using Windows and have issues with psycopg2-binary, you might need to install the binary version manually or use a wheel file

## Testing the Installation

After installation, you should be able to:

1. Register a new user account
2. Log in successfully
3. Upload test images (jpg, png)
4. See bounding boxes displayed around detected objects
5. View detection reports
6. Test the livestream feature (requires camera access)

If any of these features don't work, check the console logs for errors.