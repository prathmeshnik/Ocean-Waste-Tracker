# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
# Prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1
# Set the Flask application entry point (this should be the file containing your `app = Flask(__name__)` instance)
ENV FLASK_APP=app.py
# Make Flask development server accessible from outside the container
ENV FLASK_RUN_HOST=0.0.0.0
# Default database URL (SQLite, will be created inside the container)
ENV DATABASE_URL=sqlite:///instance/site.db
# Use a dummy placeholder for sensitive values - will be overridden at runtime
ENV SESSION_SECRET="placeholder_replace_at_runtime"

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install system dependencies required by OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install packages in separate layers to better identify failures
# Install core packages first
RUN pip install --no-cache-dir flask flask-login flask-sqlalchemy flask-wtf email-validator werkzeug wtforms pillow python-dotenv Flask-Migrate

# Install data science packages
RUN pip install --no-cache-dir matplotlib numpy pandas xlsxwriter 

# Install heavier packages separately
RUN pip install --no-cache-dir opencv-python-headless sqlalchemy

# Install tensorflow and ultralytics (which might have specific dependencies)
RUN pip install --no-cache-dir tensorflow
RUN pip install --no-cache-dir ultralytics

# Install database adapter
RUN pip install --no-cache-dir psycopg2-binary

# Copy the rest of the application code into the container at /app
COPY . .

# Create necessary directories if they don't exist
RUN mkdir -p instance static/uploads

# Initialize the database (create tables)
# Update this to match your actual app structure
RUN python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables initialized.')"

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define the command to run your application
CMD ["flask", "run"]