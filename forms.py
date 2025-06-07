from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, PasswordField, SubmitField, BooleanField, TextAreaField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from models import User

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is already taken. Please choose a different one.')
            
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('That email is already registered. Please use a different one.')

# class UploadForm(FlaskForm):
#     file = FileField('Choose File', validators=[
#         FileRequired(),
#         FileAllowed(['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mov'], 'Images and videos only!')
#     ])
#     submit = SubmitField('Upload')

# d:\PRATHMESH NIKAM\Downloads\VS\OceanWasteTracker(devesh)\OceanWasteTracker\forms.py
class UploadForm(FlaskForm):
    file = FileField('Choose File', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'jpeg', 'png', 'mp4', 'avi', 'mov'], 'Images and videos only!')
    ])
    submit = SubmitField('Upload') # <--- This field is named 'submit'


class ContactForm(FlaskForm):
    full_name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone Number', validators=[Length(max=15)])
    message = TextAreaField('Feedback or Query', validators=[DataRequired(), Length(min=10, max=500)])
    submit = SubmitField('Submit')
