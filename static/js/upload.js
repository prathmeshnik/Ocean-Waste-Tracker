/**
 * JavaScript for the upload page
 */

function initUploadPage() {
    console.log('Initializing upload page');
    
    // Elements
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('file');
    const uploadArea = document.querySelector('.upload-area');
    const browseButton = document.getElementById('browse-button');
    const resultsArea = document.querySelector('.results-area');
    
    // Initialize drag and drop functionality
    if (uploadArea) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        // Remove highlight when item is dragged out or dropped
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        // Handle dropped files
        uploadArea.addEventListener('drop', handleDrop, false);
        
        // Handle browse button click
        if (browseButton) {
            browseButton.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // Handle file input change
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect, false);
        }
    }
    
    // Handle form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(uploadForm);
            const file = formData.get('file');
            
            // Validate file
            if (!file || file.size === 0) {
                showError('Please select a file to upload.');
                return;
            }
            
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/avi', 'video/quicktime'];
            if (!allowedTypes.includes(file.type)) {
                showError('Please upload a valid image (JPEG, PNG) or video (MP4, AVI, MOV) file.');
                return;
            }
            
            // Show loading
            if (resultsArea) {
                showSpinner(resultsArea);
            }
            
            // In a real app, we would process the file here
            // For now, just submit the form normally
            uploadForm.submit();
        });
    }
}

/**
 * Prevent default drag and drop behavior
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Highlight drop area
 */
function highlight(e) {
    document.querySelector('.upload-area').classList.add('drag-over');
}

/**
 * Remove highlight from drop area
 */
function unhighlight(e) {
    document.querySelector('.upload-area').classList.remove('drag-over');
}

/**
 * Handle file drop
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        document.getElementById('file').files = files;
        handleFileSelect({ target: { files: files } });
    }
}

/**
 * Handle file selection
 */
function handleFileSelect(e) {
    const files = e.target.files;
    
    if (files.length > 0) {
        const file = files[0];
        const fileName = file.name;
        
        // Update the UI to show selected file
        const fileNameDisplay = document.querySelector('.selected-file-name');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = fileName;
            fileNameDisplay.style.display = 'block';
        }
        
        // Preview image if it's an image file
        if (file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.querySelector('.file-preview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" alt="Preview" id="preview-image">`;
                    preview.style.display = 'block';
                    
                    // Simulate detection results with bounding boxes
                    // This is just for demo of the UI - in a real app, this would happen after form submission
                    // In this demo, we're showing how it would look once implemented
                    simulateDetectionPreview();
                }
            };
            reader.readAsDataURL(file);
        } else if (file.type.match('video.*')) {
            // Show video icon or thumbnail for video files
            const preview = document.querySelector('.file-preview');
            if (preview) {
                preview.innerHTML = `
                    <div class="video-preview-placeholder">
                        <i class="fas fa-film fa-3x"></i>
                        <p>Video file selected</p>
                    </div>
                `;
                preview.style.display = 'block';
            }
        }
    }
}

/**
 * Simulate detection results with bounding boxes for preview
 * This is just for demonstration purposes
 */
function simulateDetectionPreview() {
    // Wait for the image to load
    setTimeout(() => {
        const previewImage = document.getElementById('preview-image');
        const resultsContainer = document.getElementById('results-container');
        
        if (previewImage && resultsContainer) {
            // Create some sample detection results with bounding boxes
            const sampleResults = [
                {
                    trash_type: 'Plastic Bottle',
                    confidence: 0.92,
                    bbox: {
                        x: 50,
                        y: 100,
                        width: 120,
                        height: 180
                    }
                },
                {
                    trash_type: 'Plastic Bag',
                    confidence: 0.78,
                    bbox: {
                        x: 250,
                        y: 150,
                        width: 100,
                        height: 100
                    }
                }
            ];
            
            // Display the results with bounding boxes
            displayDetectionResults(sampleResults, resultsContainer, previewImage);
        }
    }, 500); // Give the image time to load
}
