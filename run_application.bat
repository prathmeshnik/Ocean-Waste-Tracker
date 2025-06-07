@echo off
echo Starting application setup...

REM Define the virtual environment directory name
set VENV_DIR=venv

REM Check if the virtual environment directory exists and remove it
if exist "%VENV_DIR%\" (
    echo Found existing virtual environment. Removing %VENV_DIR%...
    rmdir /s /q "%VENV_DIR%"
    echo Virtual environment removed.
)

REM Create a new virtual environment
echo Creating new virtual environment in %VENV_DIR%...
python -m venv %VENV_DIR%
if %ERRORLEVEL% NEQ 0 (
    echo Failed to create virtual environment. Please ensure Python is installed and in PATH.
    goto :eof
)
echo Virtual environment created.

REM Activate the virtual environment and install requirements
echo Activating virtual environment and installing requirements...
call "%VENV_DIR%\Scripts\activate.bat"
pip install -r requirements.txt

REM Create .env file if it doesn't exist or with default values
echo Creating/Updating .env file...
echo FLASK_APP=app.py > .env
echo DATABASE_URL=sqlite:///instance/site.db >> .env
python -c "import secrets; print('SESSION_SECRET=' + secrets.token_hex(16))" >> .env
echo Environment file configured.

REM Create uploads directory
echo Creating upload directory structure if not exists...
if not exist "static\uploads" mkdir "static\uploads"
echo Upload directory checked.

REM Initialize database
echo Initializing database...
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database tables initialized/checked.')"

REM Run the Flask application
echo Starting Flask application...
flask run

echo Script finished.