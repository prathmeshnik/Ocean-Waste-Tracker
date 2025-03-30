import os
import uuid
from datetime import datetime
from io import BytesIO
import pandas as pd
from flask import render_template, url_for, flash, redirect, request, jsonify, send_file
from flask_login import login_user, current_user, logout_user, login_required
from werkzeug.utils import secure_filename

from app import app, db
from models import User, DetectionResult
from forms import LoginForm, RegistrationForm, UploadForm, ContactForm
from detect import detect_trash_in_image, detect_trash_in_video, get_model

# Load the model once at startup
trash_detection_model = get_model()

@app.route('/')
@app.route('/home')
def home():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('home.html', title='Home')

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
    if form.validate_on_submit():
        file = form.file.data
        filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Perform trash detection based on file type
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext in ['.jpg', '.jpeg', '.png']:
            results = detect_trash_in_image(file_path, trash_detection_model)
        elif file_ext in ['.mp4', '.avi', '.mov']:
            results = detect_trash_in_video(file_path, trash_detection_model)
        else:
            flash('Unsupported file format!', 'danger')
            return redirect(url_for('upload'))
        
        # Save detection results to database
        for result in results:
            detection = DetectionResult(
                user_id=current_user.id,
                image_path=file_path,
                trash_type=result['trash_type'],
                confidence=result['confidence']
            )
            db.session.add(detection)
        
        db.session.commit()
        flash('File uploaded and analyzed successfully!', 'success')
        return redirect(url_for('reports'))
        
    return render_template('upload.html', title='Upload', form=form)

@app.route('/livestream')
@login_required
def livestream():
    return render_template('livestream.html', title='Live Stream')

@app.route('/process_frame', methods=['POST'])
@login_required
def process_frame():
    if 'frame' not in request.files:
        return jsonify({'success': False, 'error': 'No frame provided'})
    
    frame = request.files['frame']
    # Save frame temporarily
    frame_path = os.path.join(app.config['UPLOAD_FOLDER'], f'frame_{uuid.uuid4()}.jpg')
    frame.save(frame_path)
    
    # Process the frame
    results = detect_trash_in_image(frame_path, trash_detection_model)
    
    # Save significant detections (e.g., confidence > threshold)
    significant_results = [r for r in results if r['confidence'] > 0.7]
    if significant_results:
        for result in significant_results:
            detection = DetectionResult(
                user_id=current_user.id,
                image_path=frame_path,
                trash_type=result['trash_type'],
                confidence=result['confidence']
            )
            db.session.add(detection)
        db.session.commit()
    else:
        # Remove temporary frame if no significant detection
        os.remove(frame_path)
    
    return jsonify({
        'success': True,
        'results': results
    })

@app.route('/reports')
@login_required
def reports():
    detections = DetectionResult.query.filter_by(user_id=current_user.id).order_by(DetectionResult.detection_date.desc()).all()
    return render_template('reports.html', title='Reports', detections=detections)

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
