#!/bin/bash

# Ocean Trash Detection System Installation Script

echo "Installing Ocean Trash Detection System..."
echo "----------------------------------------"

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing required packages (this may take a few minutes)..."
pip install flask flask-login flask-sqlalchemy flask-wtf email-validator
pip install matplotlib numpy opencv-python pandas
pip install psycopg2-binary sqlalchemy tensorflow werkzeug wtforms xlsxwriter
pip install pillow python-dotenv gunicorn

# Create .env file
echo "Creating environment configuration..."
cat > .env << EOL
DATABASE_URL=sqlite:///instance/site.db
SESSION_SECRET=$(python -c "import secrets; print(secrets.token_hex(16))")
EOL

# Create uploads directory
echo "Creating upload directory structure..."
mkdir -p static/uploads

# Initialize database
echo "Initializing database..."
python - << EOL
from app import app, db
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")
EOL

echo ""
echo "Installation complete!"
echo "----------------------------------------"
echo "To run the application:"
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Start the server:"
echo "   python main.py"
echo ""
echo "3. Access the application at:"
echo "   http://localhost:5000"
echo "----------------------------------------"