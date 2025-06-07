@echo off
:: Ocean Trash Detection System Installation Script for Windows
:: This script should be run after cloning the repository.

echo Installing Ocean Trash Detection System...
echo ----------------------------------------
setlocal

set VENV_DIR=venv

:: Check for Python
echo Checking for Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python does not seem to be installed or is not in your PATH.
    echo Please install Python 3.8 or higher and ensure it's added to your PATH.
    goto :error_exit
)
echo Python found.

:: Handle Virtual Environment
if exist "%VENV_DIR%\" (
    echo Found existing virtual environment '%VENV_DIR%'.
    set /p CHOICE=Do you want to remove and recreate it for a clean installation? (y/N): 
    if /I "%CHOICE%"=="Y" (
        echo Removing existing virtual environment %VENV_DIR%...
        rmdir /s /q "%VENV_DIR%"
        if %ERRORLEVEL% NEQ 0 (
            echo ERROR: Failed to remove existing virtual environment.
            echo Please remove the '%VENV_DIR%' directory manually and rerun this script.
            goto :error_exit
        )
        echo Existing virtual environment removed.
        set CREATE_VENV=1
    ) else (
        echo Using existing virtual environment '%VENV_DIR%'.
        set CREATE_VENV=0
    )
) else (
    set CREATE_VENV=1
)

if "%CREATE_VENV%"=="1" (
    echo Creating new virtual environment in %VENV_DIR%...
    python -m venv %VENV_DIR%
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to create virtual environment.
        goto :error_exit
    )
    echo Virtual environment created successfully.
)

:: Activate virtual environment
echo Activating virtual environment...
call "%VENV_DIR%\Scripts\activate.bat"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to activate virtual environment.
    goto :error_exit
)

:: Install dependencies
echo Checking for requirements.txt...
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found. This script should be run from the root of the cloned repository.
    goto :error_exit
)
echo Installing required packages from requirements.txt (this may take a few minutes)...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install packages from requirements.txt. Please check the error messages above.
    goto :error_exit
)
echo Packages installed successfully.

:: Create .env file
echo Creating/Updating .env file with default settings...
echo FLASK_APP=app > .env
echo DATABASE_URL=sqlite:///instance/water_trash_detection.db >> .env
python -c "import secrets; print('SESSION_SECRET=' + secrets.token_hex(16))" >> .env
echo # You can customize DATABASE_URL for PostgreSQL or MySQL if needed. See README.md. >> .env
echo # Example for PostgreSQL: DATABASE_URL=postgresql://user:password@host:port/dbname >> .env
echo # Example for YOLO model path override: YOLO_MODEL_PATH=models/your_custom_model.pt >> .env
echo Default .env file created. Please review and customize if necessary.

:: Create necessary static directories (app.py also does this, but explicit creation is safe)
echo Creating static directory structure (uploads, processed_videos)...
if not exist "static\uploads" mkdir "static\uploads"
if not exist "static\processed_videos" mkdir "static\processed_videos"
echo Static directory structure checked/created.

:: Initialize database
echo Initializing/Updating database schema using Flask-Migrate...
echo IMPORTANT: Ensure you have removed any 'db.create_all()' calls from your app.py startup if you are relying solely on Flask-Migrate.

if not exist "migrations\" (
    echo 'migrations' folder not found. Initializing Flask-Migrate (flask db init)...
    python -m flask db init
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to initialize Flask-Migrate (flask db init).
        echo Make sure Flask and Flask-Migrate are installed correctly.
        goto :error_exit
    )
    echo Flask-Migrate initialized. The 'migrations' folder has been created.
) else (
    echo 'migrations' folder found.
)

echo Generating database migration script (if model changes detected)...
python -m flask db migrate -m "Automated initial setup or update via install.script"
if %ERRORLEVEL% GTR 1 ( 
    echo WARNING: 'flask db migrate' command finished with an error code %ERRORLEVEL%.
    echo This might be an issue if there were actual model changes that failed to migrate.
    echo If it reported 'No changes detected', that is normal.
)

echo Applying database migrations (flask db upgrade)...
python -m flask db upgrade
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to apply database migrations (flask db upgrade).
    goto :error_exit
)
echo Database schema should be up to date.

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
goto :eof

:error_exit
echo.
echo !!!!! INSTALLATION FAILED !!!!!
echo Please check the error messages above and try to resolve them.
:eof
pause