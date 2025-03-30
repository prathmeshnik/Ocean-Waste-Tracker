from datetime import datetime
from app import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define relationship to DetectionResult
    detections = db.relationship('DetectionResult', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class DetectionResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    image_path = db.Column(db.String(256), nullable=False)
    trash_type = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    detection_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<DetectionResult {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'image_path': self.image_path,
            'trash_type': self.trash_type,
            'confidence': self.confidence,
            'detection_date': self.detection_date.strftime('%Y-%m-%d %H:%M:%S')
        }
