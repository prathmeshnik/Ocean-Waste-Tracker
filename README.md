# Ocean Trash Detection System

An application for detecting and classifying ocean garbage from images, videos, and live camera feeds.

## Features

* Upload images and videos to detect trash
* Real-time trash detection using your camera
* Visual bounding boxes with classifications
* User authentication system
* Report generation and export
* Historical detection tracking

## Quick Installation

### Linux/macOS

```bash
# Make the install script executable
chmod +x install.sh

# Run the installation script
./install.sh

# Start the application
source venv/bin/activate
python main.py
```

### Windows

```
# Run the installation batch file
install.bat

# Start the application (after installation completes)
venv\Scripts\activate
python main.py
```

## Manual Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## Usage

1. Open your browser and navigate to: `http://localhost:5000`
2. Register for a new account
3. Log in with your credentials
4. Use the upload feature to detect trash in images/videos
5. Or use the livestream feature with your webcam

## System Requirements

- **Python**: 3.8 or newer
- **OS**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM (8GB+ recommended)
- **Camera**: Required for livestream feature

## License

This project is open source and available under the [MIT License](LICENSE).