import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate # Import Migrate
from sqlalchemy.orm import DeclarativeBase
from ultralytics import YOLO # Import YOLO
import secrets

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Initialize extensions
db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

# Create the Flask app
app = Flask(__name__, instance_relative_config=True)

# Define the base directory for the application
# This ensures paths are relative to this file's location
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
logging.info(f"Application BASE_DIR: {BASE_DIR}")

# --- YOLO Model Configuration ---
# Ensure your model file (e.g., best.pt) is in the 'models' directory
YOLO_MODEL_NAME = "best.pt" # IMPORTANT: Change this if your model file has a different name
YOLO_MODEL_PATH = os.environ.get("YOLO_MODEL_PATH", os.path.join(BASE_DIR, "models", YOLO_MODEL_NAME))
yolo_model_global = None # Use a distinct name to avoid conflict with 'models' module

try:
    if os.path.exists(YOLO_MODEL_PATH):
        logging.info(f"Attempting to load YOLO model from: {YOLO_MODEL_PATH}")
        yolo_model_global = YOLO(YOLO_MODEL_PATH)
        # Optional: Perform a dummy inference to ensure model is loaded and to "warm it up"
        # This can also help catch issues early.
        # yolo_model_global("https://ultralytics.com/images/bus.jpg", verbose=False) 
        logging.info("YOLO model loaded successfully.")
    else:
        logging.error(f"YOLO model file not found at: {YOLO_MODEL_PATH}. Detection will not work with YOLO.")
except Exception as e:
    logging.error(f"Error loading YOLO model from {YOLO_MODEL_PATH}: {e}", exc_info=True)
    yolo_model_global = None # Ensure it's None if loading failed

# --- App Configuration ---

# Secret key for session management
app.secret_key = os.environ.get("SESSION_SECRET", secrets.token_hex(16))

# --- Database Configuration ---
# app.instance_path is the absolute path to the instance folder
# e.g., D:\...\OceanWasteTracker\instance
logging.info(f"Flask app.instance_path: {app.instance_path}")

# Ensure the instance folder (where the DB will reside) exists
try:
    os.makedirs(app.instance_path, exist_ok=True)
    logging.info(f"Ensured instance folder exists at: {app.instance_path}")
except OSError as e:
    logging.error(f"Could not create instance folder {app.instance_path}: {e}")
    # Depending on the severity, you might want to raise e or exit if this is critical

db_uri_from_env = os.environ.get("DATABASE_URL")
final_db_uri = None

if db_uri_from_env:
    logging.info(f"DATABASE_URL found in environment: {db_uri_from_env}")
    if db_uri_from_env.startswith("sqlite:///instance/"):
        db_filename_in_instance = db_uri_from_env.split("sqlite:///instance/", 1)[1]
        absolute_db_path = os.path.join(app.instance_path, db_filename_in_instance)
        uri_path_component = absolute_db_path.replace("\\", "/") # Ensure forward slashes for URI
        final_db_uri = f"sqlite:///{uri_path_component}"
        logging.info(f"DATABASE_URL from env ('{db_uri_from_env}') resolved to absolute URI: {final_db_uri}")
    elif db_uri_from_env.startswith("sqlite:///"):
        final_db_uri = db_uri_from_env
        logging.warning(f"Using DATABASE_URL from env as-is (SQLite, non-instance pattern or pre-resolved): {final_db_uri}")
        logging.warning("If this is a relative path not in 'instance/', it might still lead to issues with Flask reloader.")
    else:
        final_db_uri = db_uri_from_env # For other DB types like PostgreSQL, MySQL
        logging.info(f"Using DATABASE_URL from env (non-SQLite or other type): {final_db_uri}")
else:
    logging.info("DATABASE_URL not found in environment. Using default.")
    default_db_name = "water_trash_detection.db" # Your original default
    absolute_db_path = os.path.join(app.instance_path, default_db_name)
    uri_path_component = absolute_db_path.replace("\\", "/") # Ensure forward slashes for URI
    final_db_uri = f"sqlite:///{uri_path_component}"
    logging.info(f"Using default absolute SQLite URI: {final_db_uri}")

app.config["SQLALCHEMY_DATABASE_URI"] = final_db_uri
logging.info(f"Final SQLALCHEMY_DATABASE_URI set to: {app.config['SQLALCHEMY_DATABASE_URI']}")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Uploads configuration
app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "static", "uploads")
app.config["PROCESSED_FOLDER"] = os.path.join(BASE_DIR, "static", "processed_videos")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload size

# Create upload folder if it doesn't exist
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
# Create processed videos folder if it doesn't exist
os.makedirs(app.config["PROCESSED_FOLDER"], exist_ok=True)
logging.info(f"Ensured processed videos folder exists at: {app.config['PROCESSED_FOLDER']}")

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Import models and routes (after initializing extensions)
with app.app_context():
    import models
    # Make the loaded YOLO model accessible within the application context if needed,
    # or directly in routes by importing yolo_model_global from app.
    app.yolo_model = yolo_model_global
    import routes
    
    # Initialize extensions with the app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login' # Redirect to 'login' view if @login_required fails
    
    # Create database tables
    db.create_all()
