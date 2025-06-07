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
            
            // Replace traditional form submission with fetch API
            try {
                const response = await fetch(uploadForm.action, { // Assumes uploadForm.action is the correct endpoint
                    method: 'POST',
                    body: formData
                    // 'Content-Type': 'multipart/form-data' is automatically set by browser with boundary for FormData
                });

                hideSpinner(resultsArea); // Hide spinner once response is received

                if (!response.ok) {
                    let errorMsg = `Server error: ${response.status} ${response.statusText}.`;
                    try {
                        // Attempt to get more detailed error from JSON body, if server sends it
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (e) {
                        // If error response is not JSON, try to get text
                        const textError = await response.text();
                        console.error("Server error response (not JSON):", textError.substring(0, 500)); // Log first 500 chars
                        errorMsg += " The server's response was not in the expected JSON format.";
                    }
                    showError(errorMsg);
                    resultsArea.innerHTML = `<p class="text-danger">Video processing failed on the server. Status: ${response.status}</p>`;
                    return;
                }

                // If response.ok is true, we expect JSON.
                // Let's check Content-Type header first.
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await response.json(); // This should now be safer

                    if (data.success && (data.processed_video_url || data.image_url || data.message)) {
                        // If success and we have a media URL or at least a message, display results/info
                        displayProcessedVideoAndResults(data, resultsArea);
                    } else if (data.success) { // Success but no specific media URL or message in expected fields
                        resultsArea.innerHTML = '<p class="text-success">Operation successful, but no specific media to display.</p>';
                    } else {
                        showError(data.message || 'Processing failed or invalid response from server.');
                        resultsArea.innerHTML = '<p class="text-warning">Could not retrieve processed media or server indicated an issue.</p>';
                    }
                } else {
                    // Response was OK (2xx) but not JSON. This is unexpected.
                    const responseText = await response.text();
                    console.error('Error: Server returned a 2xx status but the response was not JSON. Response text (first 500 chars):', responseText.substring(0, 500));
                    showError('Received an unexpected response format from the server. Expected JSON but received something else (possibly HTML). Please check server logs.');
                    resultsArea.innerHTML = '<p class="text-danger">Unexpected response format from server. Check console for more details.</p>';
                }

            } catch (error) { // Catches network errors or errors in the above logic (e.g. if response.json() fails after all)
                hideSpinner(resultsArea);
                console.error('Error uploading or processing video:', error);
                let userErrorMessage = 'An error occurred during video upload or processing. Please check your network connection and try again.';
                if (error instanceof SyntaxError) { // Specifically catch JSON parsing errors
                    userErrorMessage = 'Error parsing server response. The server might not have sent data in the expected JSON format. Please check server logs.';
                }
                showError(userErrorMessage);
                resultsArea.innerHTML = '<p class="text-danger">An unexpected error occurred during upload.</p>';
            }
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
 * Display the processed video and any associated detection results.
 * @param {object} data - The server response data.
 * @param {HTMLElement} container - The HTML element to display results in.
 */
function displayProcessedVideoAndResults(data, container) {
    container.innerHTML = ''; // Clear previous content (e.g., spinner)
    const resultsArea = container; // Use a more descriptive name internally

    if (data.processed_video_url) {
        // Handle processed video
        const videoTitle = document.createElement('h4');
        videoTitle.textContent = 'Processed Video:';
        resultsArea.appendChild(videoTitle);

        const videoElement = document.createElement('video');
        videoElement.controls = true;
        videoElement.style.maxWidth = '100%';
        videoElement.style.display = 'block';
        videoElement.style.marginBottom = '20px';
        
        const sourceElement = document.createElement('source');
        sourceElement.src = data.processed_video_url;
        sourceElement.type = data.processed_video_type || 'video/mp4';
        videoElement.appendChild(sourceElement);
        
        videoElement.appendChild(document.createTextNode('Your browser does not support the video tag.'));
        resultsArea.appendChild(videoElement);

        const reportMessage = document.createElement('p');
        reportMessage.innerHTML = 'Video processed successfully. Detailed analysis, including detected items and summaries, can be found in the <a href="/reports" class="alert-link">Reports section</a>.';
        reportMessage.className = 'alert alert-info mt-3';
        resultsArea.appendChild(reportMessage);

    } else if (data.image_url) {
        // Handle processed image
        const imageTitle = document.createElement('h4');
        imageTitle.textContent = 'Processed Image:';
        resultsArea.appendChild(imageTitle);

        const imageDisplayContainer = document.createElement('div');
        imageDisplayContainer.style.position = 'relative';
        imageDisplayContainer.style.maxWidth = '600px'; // Or based on your layout needs
        imageDisplayContainer.style.margin = '0 auto 20px auto'; // Center it

        const imgElement = document.createElement('img');
        imgElement.src = data.image_url;
        imgElement.alt = 'Uploaded Image';
        imgElement.className = 'img-fluid rounded shadow-sm'; // Bootstrap classes
        imgElement.style.display = 'block';
        imgElement.style.maxWidth = '100%';
        
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.top = '0';
        overlayCanvas.style.pointerEvents = 'none';

        imageDisplayContainer.appendChild(imgElement);
        imageDisplayContainer.appendChild(overlayCanvas);
        resultsArea.appendChild(imageDisplayContainer);

        const detectionListContainer = document.createElement('div');
        detectionListContainer.id = 'image-detection-list-container'; // For styling or specific selection
        resultsArea.appendChild(detectionListContainer);

        imgElement.onload = () => {
            // Set canvas dimensions after image is loaded to match displayed size
            overlayCanvas.width = imgElement.clientWidth;
            overlayCanvas.height = imgElement.clientHeight;

            if (data.detections && data.detections.length > 0) {
                if (typeof displayDetectionResults === 'function') {
                    // This function (from detect.js) will draw boxes and list items
                    displayDetectionResults(data.detections, detectionListContainer, imgElement, overlayCanvas);
                }
                if (typeof generateSummary === 'function') {
                    const summaryContainer = document.createElement('div');
                    summaryContainer.id = 'image-summary-container';
                    summaryContainer.className = 'mt-3';
                    summaryContainer.innerHTML = generateSummary(data.detections);
                    resultsArea.appendChild(summaryContainer);
                }
            } else {
                detectionListContainer.innerHTML = `<p class="text-center">${data.message || 'No trash detected in the image.'}</p>`;
                const ctx = overlayCanvas.getContext('2d'); // Clear canvas if no detections
                ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            }
        };
        imgElement.onerror = () => {
            imageDisplayContainer.innerHTML = '<p class="text-danger">Could not load the processed image.</p>';
        };

    } else if (data.success && data.message) {
        // Fallback for other success messages from the server without specific media URLs
        const messageP = document.createElement('p');
        messageP.className = 'alert alert-info';
        messageP.textContent = data.message;
        resultsArea.appendChild(messageP);
    } else {
        // This case should ideally not be reached if server response is structured
        resultsArea.innerHTML = '<p class="text-warning">Processed data received in an unexpected format.</p>';
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
        const resultsContainer = document.getElementById('results-container'); // Ensure this ID exists if used
        
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
            // Note: displayDetectionResults expects a container for the list, and optionally image/canvas for drawing
            // This simulation might need its own dedicated display area or careful integration.
            // For now, assuming resultsContainer is where the list should go.
            // We'd also need a canvas overlay for the previewImage if we want boxes on it.
            
            // Simplified: just log or show text for simulation if resultsContainer is not set up for full display
            console.log("Simulated detection preview:", sampleResults);
            resultsContainer.innerHTML = `<p>Simulated: ${sampleResults[0].trash_type} found.</p>`;
            // To fully use displayDetectionResults, you'd need to create an overlay canvas for 'preview-image'
            // and pass it along.
        }
    }, 500); // Give the image time to load
}
