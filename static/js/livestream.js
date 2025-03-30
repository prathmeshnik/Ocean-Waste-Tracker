/**
 * JavaScript for the livestream page
 */

let stream = null;
let videoElement = null;
let canvasElement = null;
let canvasContext = null;
let streamInterval = null;
let isStreaming = false;

function initLivestreamPage() {
    console.log('Initializing livestream page');
    
    // Elements
    videoElement = document.getElementById('video-stream');
    canvasElement = document.getElementById('capture-canvas');
    const startButton = document.getElementById('start-stream');
    const stopButton = document.getElementById('stop-stream');
    const resultsContainer = document.getElementById('stream-results');
    
    if (canvasElement) {
        canvasContext = canvasElement.getContext('2d');
    }
    
    // Handle start button click
    if (startButton) {
        startButton.addEventListener('click', startStreaming);
    }
    
    // Handle stop button click
    if (stopButton) {
        stopButton.addEventListener('click', stopStreaming);
    }
}

/**
 * Start the camera stream
 */
async function startStreaming() {
    if (isStreaming) return;
    
    try {
        // Access the user's camera
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment' // Prefer rear camera on mobile
            },
            audio: false 
        });
        
        // Connect the camera stream to the video element
        if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
            
            // Set the canvas size to match the video
            videoElement.addEventListener('loadedmetadata', () => {
                if (canvasElement) {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                }
            });
            
            isStreaming = true;
            
            // Show the video container
            const videoContainer = document.querySelector('.stream-container');
            if (videoContainer) {
                videoContainer.style.display = 'block';
            }
            
            // Hide the start button, show the stop button
            const startButton = document.getElementById('start-stream');
            const stopButton = document.getElementById('stop-stream');
            if (startButton) startButton.style.display = 'none';
            if (stopButton) stopButton.style.display = 'inline-block';
            
            // Start processing frames
            streamInterval = setInterval(processFrame, 1000); // Process one frame per second
        }
    } catch (err) {
        console.error('Error accessing camera:', err);
        showError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
}

/**
 * Stop the camera stream
 */
function stopStreaming() {
    if (!isStreaming) return;
    
    // Stop the interval
    if (streamInterval) {
        clearInterval(streamInterval);
        streamInterval = null;
    }
    
    // Stop the video tracks
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Clear the video source
    if (videoElement) {
        videoElement.srcObject = null;
    }
    
    isStreaming = false;
    
    // Hide the stop button, show the start button
    const startButton = document.getElementById('start-stream');
    const stopButton = document.getElementById('stop-stream');
    if (startButton) startButton.style.display = 'inline-block';
    if (stopButton) stopButton.style.display = 'none';
}

/**
 * Process a video frame for trash detection
 */
function processFrame() {
    if (!isStreaming || !videoElement || !canvasElement || !canvasContext) return;
    
    // Draw the current video frame to the canvas
    canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Convert the canvas to a blob
    canvasElement.toBlob(async (blob) => {
        // Create a FormData object and append the image
        const formData = new FormData();
        formData.append('frame', blob, 'frame.jpg');
        
        try {
            // Send the frame to the server for processing
            const response = await fetch('/process_frame', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update the results container
                    updateResults(data.results);
                }
            } else {
                console.error('Error processing frame');
            }
        } catch (err) {
            console.error('Error sending frame to server:', err);
        }
    }, 'image/jpeg', 0.95);
}

/**
 * Update the results display
 */
function updateResults(results) {
    const resultsContainer = document.getElementById('stream-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No trash detected in current frame.</p>';
        return;
    }
    
    let html = '<div class="result-list">';
    
    results.forEach(result => {
        const confidence = (result.confidence * 100).toFixed(2);
        html += `
            <div class="result-item">
                <span class="trash-type">${result.trash_type}</span>
                <div class="progress">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${confidence}%" 
                        aria-valuenow="${confidence}" aria-valuemin="0" aria-valuemax="100">
                        ${confidence}%
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    stopStreaming();
});
