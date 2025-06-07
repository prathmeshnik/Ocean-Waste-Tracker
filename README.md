Plastic pollution and other forms of waste in oceans, rivers, and lakes pose a significant threat to marine ecosystems, wildlife, and human health. **Ocean Waste Tracker** provides an accessible tool for automated detection and reporting of waste in aquatic environments using modern computer vision techniques.

---

## 🌟 Overview

Ocean Waste Tracker is a web application designed to detect, track, and analyze waste in water bodies through image and video analysis. It leverages the **YOLO (You Only Look Once)** object detection model to identify various types of trash. Users can register, upload media (images and videos), view detailed detection results including bounding boxes, and generate insightful reports. The application also supports processing frames from a live video stream.

---

## 🎯 Target Audience

- Environmental researchers and organizations
- Local authorities responsible for waterway cleanup
- Citizen scientists and environmental enthusiasts
- Educational institutions

---

## ✨ Features

- **Image and Video Upload**: Users can upload images (JPG, JPEG, PNG) and videos (MP4, AVI, MOV) for waste detection.
- **YOLO-Powered Detection**: Utilizes a pre-trained YOLO model (`best.pt`) to detect and classify trash items in uploaded media, such as plastic bottles, bags, and fishing nets.
- **Real-time Livestream Processing**: Supports processing video frames from a live stream for real-time trash detection (requires appropriate frontend setup to send frames).
- **Detailed Detection Results**: Displays bounding boxes (x, y, width, height), trash types, and confidence scores for each detected item.
- **Processed Media**: Saves and displays videos with detection overlays, visually highlighting the identified waste.
- **Reporting & Analytics**:
    - Generates summary statistics of detections: total items detected, counts of trash by type, average confidence scores.
    - Visualizes data with charts (e.g., a pie chart for trash type distribution).
    - Allows downloading detection data as an Excel (`.xlsx`) report for further analysis.
- **Database Storage**: Stores user information and detailed detection results (including bounding box coordinates) in an SQLite database (configurable to other SQL databases like PostgreSQL).

---

## 🛠️ Technologies Used

### Backend (Python Flask)

- Flask
- Flask-SQLAlchemy
- Flask-Login
- Flask-Migrate (Database Migrations)
- Flask-WTF (Forms)
- Werkzeug (WSGI Utility Library)
- Ultralytics (YOLO Object Detection library)
- OpenCV (cv2) (Image and Video Processing)
- Pillow (PIL) (Image Processing)
- Pandas (Data Manipulation, Excel Export)
- Matplotlib (Chart Generation)
- XlsxWriter (Excel File Writing)
- python-dotenv (Environment variable management)
- SQLAlchemy (Core ORM, used by Flask-SQLAlchemy)
- email-validator (For email validation in forms)
- psycopg2-binary (PostgreSQL adapter, if using PostgreSQL)
- numpy
- tensorflow (If your specific YOLO model or other components require it)

### Frontend

- HTML
- CSS
- JavaScript (for dynamic features and livestream processing)

---

## 📂 Project Structure

Plaintext

```
OceanWasteTracker/
├── instance/                     # Instance folder (e.g., for SQLite DB)
│   └── water_trash_detection.db  # Example database file
├── models/                       # Directory for YOLO model
│   └── best.pt                   # Your trained YOLO model
├── static/
│   ├── css/
│   ├── js/
│   ├── uploads/                  # User uploaded media
│   └── processed_videos/         # Videos with detection overlays
├── templates/                    # HTML templates
├── .env.example                  # Example environment variables file
├── app.py                        # Main Flask application file
├── requirements.txt              # Python dependencies
├── README.md                     # This file
└── LICENSE                       # Project license (recommended)
```

---

## 🚀 Getting Started

Follow these steps to set up and run the Ocean Waste Tracker application locally.

### Prerequisites

- Python 3.8+
- pip (Python package installer)
- Git

### Installation

1. **Clone the repository:**
    
    Bash
    
    ```
    git clone https://github.com/your-username/OceanWasteTracker.git
    cd OceanWasteTracker
    ```
    
2. **Create a virtual environment** (recommended):
    

`bash python -m venv venv`

1. **Activate the virtual environment:**
    
    - On Windows:
        
        Bash
        
        ```
        .\venv\Scripts\activate
        ```
        
    - On macOS/Linux:
        
        Bash
        
        ```
        source venv/bin/activate
        ```
        
    
2. **Install dependencies:**
    
    Create a `requirements.txt` file with the following packages:
    
    Plaintext
    
    ```
    Flask
    Flask-SQLAlchemy
    Flask-Login
    Flask-Migrate
    Flask-WTF
    SQLAlchemy
    WTForms
    Werkzeug
    ultralytics
    opencv-python
    Pillow
    numpy
    pandas
    matplotlib
    xlsxwriter
    python-dotenv
    email-validator
    psycopg2-binary # Only if you plan to use PostgreSQL
    tensorflow      # If used by your project (present in your actual requirements.txt)
    ```
    
    Then install them:
    
    Bash
    
    ```
    pip install -r requirements.txt
    ```
    
3. **Set up the YOLO Model:**
    
    - Create a directory named `models` in the root of your project (`OceanWasteTracker/models/`).
    - Place your trained YOLO model file (e.g., `best.pt`) inside this `models` directory. The application expects it at `OceanWasteTracker/models/best.pt` by default (configurable via `YOLO_MODEL_PATH` environment variable).
4. **Set up Environment Variables:**
    
    Create a `.env` file in the root directory (`OceanWasteTracker/.env`) to store your configuration. You can copy the content from `.env.example`.
    
    Code snippet
    
    ```
    # Flask Secret Key (generate a random string)
    # Used for session security. Generate a strong random key.
    # Example generation (in bash): openssl rand -hex 32
    SESSION_SECRET="your_strong_random_secret_key_here"
    
    # Database URL
    # If not set, the application defaults to SQLite in the 'instance' folder:
    # 'sqlite:///instance/water_trash_detection.db'
    #
    # To use a specific SQLite file in the instance folder:
    # DATABASE_URL="sqlite:///instance/my_custom_database_name.db"
    #
    # To use a SQLite file at an absolute path (ensure the path is correct):
    # DATABASE_URL="sqlite:///D:/path/to/your/database.db"
    #
    # For PostgreSQL (ensure psycopg2-binary is installed):
    # DATABASE_URL="postgresql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    #
    # For MySQL (ensure a MySQL driver like mysqlclient or PyMySQL is installed):
    # DATABASE_URL="mysql+pymysql://your_db_user:your_db_password@your_db_host:your_db_port/your_db_name"
    
    # YOLO Model Path (optional, overrides default path in app.py)
    # If your model is not named 'best.pt' or not in 'OceanWasteTracker/models/', set this.
    # YOLO_MODEL_PATH="/path/to/your/custom/location/best.pt"
    ```
    
    **Note on `app.py` Behavior:** The `app.py` file includes logic to intelligently construct the `SQLALCHEMY_DATABASE_URI`. If `DATABASE_URL` is not set, it defaults to an SQLite database named `water_trash_detection.db` inside the `instance` folder. For production or consistent development, **it is strongly recommended to set a fixed `SESSION_SECRET` in your `.env` file.**
    
5. **Initialize the Database:**
    
    The application uses Flask-Migrate for database migrations.
    
    Bash
    
    ```
    flask db init          # Run this only once per project to initialize migrations
    flask db migrate -m "Initial migration"
    flask db upgrade
    ```
    

---

## 🏃 Running the Application

6. Ensure your virtual environment is activated.
    
7. Make sure all environment variables are correctly set (e.g., in your `.env` file).
    
8. Run the Flask development server:
    
    Bash
    
    ```
    python main.py
    ```
    
    Or, using the Flask CLI:
    
    Bash
    
    ```
    flask --app app run
    ```
    
    The application should typically be accessible at `http://127.0.0.1:5000` or `http://0.0.0.0:5000`. Check your console output for the exact address.
    

---

## 🖥️ Usage

9. **Navigate & Authenticate**:
    
    - Open the application in your web browser.
    - **Sign Up**: If you are a new user, create an account.
    - **Login**: If you have an existing account, log in with your credentials.
10. **Upload Media for Detection**:
    
    - Go to the "Upload" page.
    - Select an image file (JPG, JPEG, PNG) or a video file (MP4, AVI, MOV).
    - Submit the file. The backend will process it using the YOLO model.
    - **Image Results**: For images, you will see the original image with detected waste items highlighted by bounding boxes, along with their classified type and confidence score.
    - **Video Results**: For videos, the system will process it frame by frame. A new video with detection overlays will be generated and made available for viewing/download. Detection data will be stored and summarized.
11. **Livestream Processing (if configured)**:
    
    - Access the "Livestream" page.
    - This feature typically requires a frontend component (JavaScript) to capture video frames (e.g., from a webcam) and send them to the `/process_frame` backend endpoint.
    - The backend processes each frame and returns detection results, which the frontend can then display in real-time.
12. **View Reports**:
    
    - Navigate to the "Reports" page.
    - Here you can view:
        - A summary of all your past detections.
        - Aggregated statistics, such as the total number of items detected, a breakdown of trash counts by type (e.g., "plastic bottle", "bag", "net"), and average confidence scores.
        - Visualizations, like a pie chart showing the distribution of different trash types detected.
        - An option to download your detection data as an Excel (`.xlsx`) file for offline analysis or record-keeping.
13. **Contact/About**:
    
    - Use the "Contact Us" form for any feedback, questions, or issues.
    - The "About" page may provide more information about the project's mission and technology.

---

## 🚨 Troubleshooting

- **YOLO Model Not Found**:
    - Ensure `best.pt` (or your custom model file) is correctly placed in the `OceanWasteTracker/models/` directory.
    - Verify the `YOLO_MODEL_PATH` environment variable is correct if you've customized the path.
    - Check the console logs for errors related to model loading.
- **Database Connection Issues**:
    - Verify your `DATABASE_URL` in the `.env` file is correct.
    - For SQLite, ensure the `instance` folder is writable by the application.
    - For PostgreSQL/MySQL, ensure the database server is running, credentials are correct, and the necessary database/tables exist (after running `flask db upgrade`).
- **Dependency Errors**:
    - Make sure all packages in `requirements.txt` are installed in your active virtual environment (`pip install -r requirements.txt`).
    - Pay special attention to `ultralytics` and `opencv-python` as they are crucial for detection.
- **File Upload Issues**:
    - Check the `MAX_CONTENT_LENGTH` in `app.py` if you are trying to upload large files.
    - Ensure the `static/uploads` and `static/processed_videos` directories exist and are writable.
- **"ModuleNotFoundError" or "ImportError"**:
    - Ensure you are running the application from the root directory (`OceanWasteTracker/`).
    - Double-check that your virtual environment is activated.

---

## 💡 Future Enhancements (Ideas)

- **Geospatial Tagging**: Allow users to associate GPS coordinates with uploads for mapping waste hotspots.
- **Advanced Analytics Dashboard**: More sophisticated charts, trend analysis over time, and comparative reports.
- **User Roles & Permissions**: Different levels of access (e.g., admin, researcher, public user).
- **API for Third-Party Integration**: Allow other applications to submit media or retrieve detection data.
- **Model Retraining Interface**: Allow privileged users to contribute to improving the detection model with new annotated data.
- **Multi-Language Support**.
- **Automated Email Notifications** for new reports or critical detections.

---

## 🤝 Contributing

Contributions are welcome and highly appreciated! If you'd like to contribute, please follow these steps:

14. **Fork the repository** on GitHub.
15. **Clone your fork** locally: `git clone https://github.com/your-username/OceanWasteTracker.git`
16. **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-amazing-feature` or `bugfix/issue-tracker-link`.
17. **Make your changes** and commit them with clear, descriptive messages: `git commit -m 'Add some amazing feature'`.
18. **Push your changes** to your fork on GitHub: `git push origin feature/your-amazing-feature`.
19. **Open a Pull Request (PR)** from your branch to the main repository's `main` or `develop` branch.

Please ensure your code adheres to the project's coding standards (e.g., PEP 8 for Python) and includes tests for new functionality where appropriate.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

**Crucial Next Steps for You:**

20. **Update your actual `requirements.txt` file:** Make sure it includes `ultralytics`, `Flask-Migrate`, and `tensorflow` (if `tensorflow` is indeed needed for your specific YOLO setup, otherwise remove it to keep dependencies lean).
    
21. **Verify `main.py` vs `app.py`:** Confirm that `main.py` is the file containing the `app.run()` command, as indicated in the updated README's "Running the Application" section. If `app.py` is the entry point, you'd adjust the command accordingly.