import os
import uuid
from datetime import datetime
from io import BytesIO
import json # For handling detection data if needed
import pandas as pd
from flask import render_template, url_for, flash, redirect, request, jsonify, send_file, current_app
from flask_login import login_user, current_user, logout_user, login_required # type: ignore
from werkzeug.utils import secure_filename
from PIL import Image # For image processing
import cv2 # For video processing and livestream frame decoding
import numpy as np
from app import app, db # type: ignore
from models import User, DetectionResult # type: ignore
from forms import LoginForm, RegistrationForm, UploadForm, ContactForm # type: ignore
from report_generator import generate_trash_summary, generate_trash_type_chart # Import report generator functions

@app.route('/')
@app.route('/home')
def home():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('home.html', title='Home')

def parse_yolo_results_for_db(yolo_output_list, model_class_names):
    """
    Parses the output from a YOLO model (ultralytics format) into a list of detections
    suitable for database storage and frontend display.
    Each detection includes trash_type, confidence, and bbox.
    """
    detections = []
    if not yolo_output_list or not yolo_output_list[0]: # yolo_output_list is a list of Results objects
        current_app.logger.warning("parse_yolo_results_for_db: yolo_output_list is empty or invalid.")
        return detections

    results = yolo_output_list[0]  # Process the first (and usually only) Results object

    # Ensure boxes, confidences, and classes are available and on CPU as numpy arrays
    if results.boxes is None:
        current_app.logger.warning("parse_yolo_results_for_db: No 'boxes' attribute in YOLO results.")
        return detections
        
    boxes_data = results.boxes # This is a Boxes object
    
    if not hasattr(boxes_data, 'xyxy') or not hasattr(boxes_data, 'conf') or not hasattr(boxes_data, 'cls'):
        current_app.logger.warning("parse_yolo_results_for_db: YOLO results.boxes object missing xyxy, conf, or cls attributes.")
        return detections

    if len(boxes_data.xyxy) == 0:
        current_app.logger.info("parse_yolo_results_for_db: YOLO results.boxes.xyxy is empty (no detections).")
        return detections

    # Iterate through detected boxes
    for i in range(len(boxes_data.xyxy)):
        try:
            x1, y1, x2, y2 = boxes_data.xyxy[i].cpu().numpy()
            confidence = boxes_data.conf[i].cpu().numpy()
            class_id = int(boxes_data.cls[i].cpu().numpy())
            
            detections.append({
                "trash_type": model_class_names.get(class_id, f"Class_{class_id}"), # Use .get for safety
                "confidence": float(confidence),
                "bbox": {"x": int(x1), "y": int(y1), "width": int(x2 - x1), "height": int(y2 - y1)}
                # If you want to include segmentation masks (polygons) later:
                # "mask_xy": results.masks.xy[i].tolist() if results.masks and results.masks.xy else None 
            })
        except Exception as e:
            current_app.logger.error(f"parse_yolo_results_for_db: Error processing individual detection {i}: {e}", exc_info=True)
            continue # Skip this problematic detection
    current_app.logger.info(f"parse_yolo_results_for_db: Parsed {len(detections)} detections.")
    return detections

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Login unsuccessful. Please check email and password.', 'danger')
    
    return render_template('login.html', title='Login', form=form)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html', title='Sign Up', form=form)

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/about')
def about():
    return render_template('about.html', title='About Us')

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    form = UploadForm()
    yolo_model = current_app.yolo_model # Get the loaded YOLO model

    if form.validate_on_submit(): # This will work with fetch if FormData is sent
        file = form.file.data
        filename_prefix_uuid = str(uuid.uuid4())
        filename = filename_prefix_uuid + '_' + secure_filename(file.filename)
        # Absolute path for saving the file
        absolute_file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(absolute_file_path)
        current_app.logger.info(f"File saved to absolute path: {absolute_file_path}")
        # Relative path for database and url_for, relative to 'static' folder
        file_path_for_db_and_url = f'uploads/{filename}' # e.g., 'uploads/image.jpg'
        
        detection_results_list = []

        if not yolo_model:
            current_app.logger.error("YOLO model not loaded. Cannot process file for AJAX request.")
            return jsonify({"success": False, "message": "Detection model is not loaded on the server."}), 503

        file_ext = os.path.splitext(filename)[1].lower()
        
        try:
            if file_ext in ['.jpg', '.jpeg', '.png']:
                current_app.logger.info(f"Processing image with YOLO: {absolute_file_path}")
                img_pil = Image.open(absolute_file_path).convert("RGB") # Ensure RGB
                yolo_raw_results = yolo_model(img_pil, verbose=False) # verbose=False to reduce console spam
                current_app.logger.debug(f"Raw YOLO results for image: {yolo_raw_results}")

                model_names = yolo_model.names if hasattr(yolo_model, 'names') and yolo_model.names else {i: f'class_{i}' for i in range(80)}
                detection_results_list = parse_yolo_results_for_db(yolo_raw_results, model_names)
                current_app.logger.info(f"YOLO image detection results: {detection_results_list}")

            elif file_ext in ['.mp4', '.avi', '.mov']:
                current_app.logger.info(f"Starting full video processing with YOLO: {absolute_file_path}")

                # Define output path for processed video
                output_extension = '.mp4' # Standardize output to MP4
                input_filename_base = os.path.splitext(filename)[0] # Contains UUID and original name
                processed_video_filename = f"processed_{input_filename_base}{output_extension}" # Always .mp4
                processed_video_path_abs = os.path.join(app.config['PROCESSED_FOLDER'], processed_video_filename) # Absolute path
                processed_video_url_for_frontend = url_for('static', filename=f'processed_videos/{processed_video_filename}')

                cap = cv2.VideoCapture(absolute_file_path)
                if not cap.isOpened():
                    current_app.logger.error(f"Could not open video file for processing: {absolute_file_path}")
                    return jsonify({"success": False, "message": "Could not open video file."}), 500

                fps = cap.get(cv2.CAP_PROP_FPS) # Get FPS from original video
                if fps <= 0 or fps > 120: # Sanity check and default for FPS
                    current_app.logger.warning(f"Original video FPS ({fps}) is invalid or out of range. Defaulting to 25 FPS for output.")
                    fps = 25.0

                frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                
                # Use H.264 (avc1) for MP4 output. Fallback to mp4v if avc1 fails.
                # H.264 is highly compatible for web playback.
                fourcc_h264 = cv2.VideoWriter_fourcc(*'avc1') # Preferred for MP4/H.264
                fourcc_mp4v = cv2.VideoWriter_fourcc(*'mp4v') # Fallback MPEG-4

                out_writer = cv2.VideoWriter(processed_video_path_abs, fourcc_h264, fps, (frame_width, frame_height))
                
                if not out_writer.isOpened():
                    current_app.logger.warning(f"VideoWriter failed to open with H.264 (avc1) for {processed_video_path_abs}. Trying fallback MPEG-4 (mp4v).")
                    out_writer = cv2.VideoWriter(processed_video_path_abs, fourcc_mp4v, fps, (frame_width, frame_height))

                if not out_writer.isOpened():
                    current_app.logger.error(f"Could not open VideoWriter for: {processed_video_path_abs} even with fallback FourCC.")
                    cap.release()
                    return jsonify({"success": False, "message": "Could not initialize video writer for output."}), 500
                current_app.logger.info(f"VideoWriter opened successfully for {processed_video_path_abs}")
                all_video_detections_summary = [] # Store aggregated detections for JSON response

                while True:
                    ret, frame_cv2 = cap.read()
                    if not ret:
                        break 

                    img_rgb = cv2.cvtColor(frame_cv2, cv2.COLOR_BGR2RGB)
                    yolo_raw_results = yolo_model(img_rgb, verbose=False)
                    
                    model_names = yolo_model.names if hasattr(yolo_model, 'names') and yolo_model.names else {i: f'class_{i}' for i in range(80)}
                    frame_detections = parse_yolo_results_for_db(yolo_raw_results, model_names)
                    
                    for det in frame_detections:
                        bbox = det['bbox']
                        x, y, w, h = bbox['x'], bbox['y'], bbox['width'], bbox['height']
                        label = f"{det['trash_type']}: {det['confidence']:.2f}"
                        color = (0, 255, 0) 
                        cv2.rectangle(frame_cv2, (x, y), (x + w, y + h), color, 2)
                        cv2.putText(frame_cv2, label, (x, y - 10 if y - 10 > 10 else y + 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
                    out_writer.write(frame_cv2)
                    all_video_detections_summary.extend(frame_detections) 
                    detection_results_list.extend(frame_detections) # Also add to the main list for DB saving

                cap.release()
                out_writer.release()
                current_app.logger.info(f"Processed video saved to: {processed_video_path_abs}")
                
                # For videos, we return JSON directly with the processed video URL
                # and also save all detections to DB below

            else:
                current_app.logger.warning(f"Unsupported file format for YOLO: {file_ext}")
                return jsonify({"success": False, "message": f"Unsupported file format: {file_ext}. Please upload an image or video."}), 415

            # Save detection results to database
            if detection_results_list: # Only attempt to save if there are results
                current_app.logger.info(f"Preparing to save {len(detection_results_list)} detections to database.")
                for result_item in detection_results_list:
                    bbox_data = result_item.get('bbox') 
                    # For videos, image_path will be the path to the original uploaded video
                    detection = DetectionResult(
                        user_id=current_user.id,
                        image_path=file_path_for_db_and_url, # Use relative path for DB
                        trash_type=result_item['trash_type'],
                        confidence=result_item['confidence'],
                        bbox_x=bbox_data.get('x') if bbox_data else None,
                        bbox_y=bbox_data.get('y') if bbox_data else None,
                        bbox_width=bbox_data.get('width') if bbox_data else None,
                        bbox_height=bbox_data.get('height') if bbox_data else None
                    )
                    db.session.add(detection)
                db.session.commit()
                current_app.logger.info("Detections committed to database.")
            else:
                current_app.logger.info("No detections found by YOLO, nothing to save to database for this file.")

            # Return JSON response based on file type
            if file_ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv']: # Check original extension
                return jsonify({
                    "success": True,
                    "processed_video_url": processed_video_url_for_frontend, # URL to the processed .mp4 file
                    "processed_video_type": "video/mp4", # MIME type is now consistently video/mp4
                    "detections": all_video_detections_summary 
                })
            elif file_ext in ['.jpg', '.jpeg', '.png']:
                return jsonify({
                    "success": True,
                    "message": "Image uploaded and analyzed successfully!" if detection_results_list else "Image processed, but no trash was detected.",
                    "image_url": url_for('static', filename=file_path_for_db_and_url.replace("\\", "/")),
                    "detections": detection_results_list
                })

        except Exception as e:
            current_app.logger.error(f"Error during YOLO processing for upload: {e}", exc_info=True)
            return jsonify({"success": False, "message": f"Error processing file: {str(e)}"}), 500
        
    return render_template('upload.html', title='Upload', form=form)

@app.route('/livestream')
@login_required
def livestream():
    return render_template('livestream.html', title='Live Stream')

@app.route('/process_frame', methods=['POST'])
@login_required
def process_frame():
    yolo_model = current_app.yolo_model
    if not yolo_model:
        current_app.logger.error("YOLO model not loaded, cannot process frame.")
        return jsonify({"success": False, "error": "Detection model not available"}), 500

    if 'frame' not in request.files:
        return jsonify({'success': False, 'error': 'No frame provided'})
    
    frame_file = request.files['frame']
    
    try:
        # Read the image file stream into a numpy array
        filestr = frame_file.read()
        npimg = np.frombuffer(filestr, np.uint8)
        # Decode the image from the numpy array using OpenCV
        img_cv2 = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        
        if img_cv2 is None:
            current_app.logger.error("Could not decode frame from blob.")
            return jsonify({"success": False, "error": "Could not decode frame"}), 400
        
        # YOLO expects RGB, OpenCV loads as BGR
        img_rgb = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)
        
        yolo_raw_results = yolo_model(img_rgb, verbose=False)
        model_names = yolo_model.names if hasattr(yolo_model, 'names') and yolo_model.names else {i: f'class_{i}' for i in range(80)}
        detection_results_list = parse_yolo_results_for_db(yolo_raw_results, model_names)

        # Save significant detections to database (optional for livestream, adjust as needed)
        # For livestream, you might not want to save every frame's detections to DB.
        # This example saves detections with confidence > 0.7.
        # Also, image_path for livestream frames needs careful consideration.
        # For now, let's not save livestream frames to DB to keep it simpler.
        # If you need to save them, you'd save the frame to a file first.
        # significant_results = [r for r in detection_results_list if r['confidence'] > 0.7]
        # if significant_results:
        #     # temp_frame_path = os.path.join(app.config['UPLOAD_FOLDER'], f'live_frame_{uuid.uuid4()}.jpg')
        #     # cv2.imwrite(temp_frame_path, img_cv2) # Save the BGR frame
        #     # ... save to DB ...

        return jsonify({"success": True, "results": detection_results_list})
    except Exception as e:
        current_app.logger.error(f"Error processing livestream frame with YOLO: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/reports')
@login_required
def reports():
    # Fetch all detections for the current user
    detections = DetectionResult.query.filter_by(user_id=current_user.id).order_by(DetectionResult.detection_date.desc()).all()
    
    # Generate summary statistics using the report_generator
    summary_data = generate_trash_summary(detections)
    
    # Generate pie chart for trash types
    pie_chart_base64 = None
    if summary_data['trash_counts']:
        pie_chart_base64 = generate_trash_type_chart(summary_data['trash_counts'])
        
    return render_template('reports.html', title='Reports', 
                           detections=detections, # Still pass individual detections if needed for a table
                           summary=summary_data, pie_chart=pie_chart_base64)

@app.route('/download_report')
@login_required
def download_report():
    detections = DetectionResult.query.filter_by(user_id=current_user.id).order_by(DetectionResult.detection_date.desc()).all()
    
    # Create DataFrame from detections
    data = []
    for detection in detections:
        data.append({
            'ID': detection.id,
            'Image Path': detection.image_path,
            'Trash Type': detection.trash_type,
            'Confidence': f"{detection.confidence:.2f}",
            'Detection Date': detection.detection_date.strftime('%Y-%m-%d'),
            'Detection Time': detection.detection_date.strftime('%H:%M:%S')
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Trash Detections', index=False)
        
        # Adjust column widths
        worksheet = writer.sheets['Trash Detections']
        for i, col in enumerate(df.columns):
            max_width = max(
                df[col].astype(str).map(len).max(),
                len(col)
            ) + 2
            worksheet.set_column(i, i, max_width)
    
    output.seek(0)
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"trash_detection_report_{timestamp}.xlsx"
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    form = ContactForm()
    if form.validate_on_submit():
        # In a real app, you'd save the form data or send an email
        flash('Your message has been sent! We will contact you soon.', 'success')
        return redirect(url_for('contact'))
    
    return render_template('contact.html', title='Contact Us', form=form)
