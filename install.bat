@echo off
:: Ocean Trash Detection System Installation Script for Windows

echo Installing Ocean Trash Detection System...
echo ----------------------------------------

:: Create virtual environment
echo Creating virtual environment...
python -m venv venv

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing required packages (this may take a few minutes)...
pip install flask flask-login flask-sqlalchemy flask-wtf email-validator
pip install matplotlib numpy opencv-python pandas
pip install sqlalchemy tensorflow werkzeug wtforms xlsxwriter
pip install pillow python-dotenv

:: Try to install psycopg2-binary, use psycopg2 as fallback
pip install psycopg2-binary || pip install psycopg2

:: Create .env file
echo Creating environment configuration...
echo DATABASE_URL=sqlite:///instance/site.db > .env
python -c "import secrets; print('SESSION_SECRET=' + secrets.token_hex(16))" >> .env

:: Create uploads directory
echo Creating upload directory structure...
if not exist static\uploads mkdir static\uploads

:: Initialize database
echo Initializing database...
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables created successfully!')"

echo.
echo Installation complete!
echo ----------------------------------------
echo To run the application:
echo 1. Activate the virtual environment:
echo    venv\Scripts\activate
echo.
echo 2. Start the server:
echo    python main.py
echo.
echo 3. Access the application at:
echo    http://localhost:5000
echo ----------------------------------------

pause