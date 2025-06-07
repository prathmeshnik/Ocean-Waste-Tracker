/**
 * JavaScript for detection functionality
 * This file is used by both upload.js and livestream.js
 */

/**
 * Display detection results
 * @param {Array} results - Array of detection results
 * @param {HTMLElement} container - Container element to display results in
 * @param {HTMLImageElement|null} imageElement - Optional image element (for scaling and context).
 *  @param {HTMLCanvasElement|null} overlayCanvas - Optional canvas element to draw bounding boxes on.
 */
function displayDetectionResults(results, container, imageElement = null, overlayCanvas = null) {
    if (!container) {
        console.error("DETECT.JS: displayDetectionResults called with no container element.");
        return;
    }
    
    // Clear loading spinner (assuming hideSpinner is globally available from main.js)
    hideSpinner(container);
    
    if (!results || results.length === 0) {
        container.innerHTML = '<p class="text-center">No trash detected in the image.</p>';
        // Clear overlay canvas if it exists and no results
        if (overlayCanvas) {
            const ctx = overlayCanvas.getContext('2d');
            // It's good practice to set canvas size even if clearing,
            // especially if imageElement might not be fully loaded yet or is null.
            // If imageElement is present, match its current displayed size.
            if (imageElement && imageElement.clientWidth > 0 && imageElement.clientHeight > 0) {
                overlayCanvas.width = imageElement.clientWidth;
                overlayCanvas.height = imageElement.clientHeight;
            } else if (!imageElement && overlayCanvas.dataset.defaultWidth) { // Fallback if no image
                overlayCanvas.width = parseInt(overlayCanvas.dataset.defaultWidth);
                overlayCanvas.height = parseInt(overlayCanvas.dataset.defaultHeight);
            }
            ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        return;
    }
    
    // If image element and overlayCanvas are provided, and we have bounding boxes, draw them
    if (imageElement && overlayCanvas && results.some(r => r.bbox)) {
        drawBoundingBoxes(results, imageElement, overlayCanvas);
    }
    
    let html = '<h4>Detected Trash:</h4><div class="results-list">';
    
    results.forEach(result => {
        const confidence = (result.confidence * 100).toFixed(2);
        const confidenceClass = confidence > 70 ? 'text-success' : (confidence > 40 ? 'text-warning' : 'text-danger');
        
        html += `
            <div class="result-item card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${result.trash_type}</h5>
                    <p class="card-text">
                        <span class="confidence-label">Confidence:</span>
                        <span class="${confidenceClass}">${confidence}%</span>
                    </p>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                            style="width: ${confidence}%; background-color: var(--primary-color);" 
                            aria-valuenow="${confidence}" aria-valuemin="0" aria-valuemax="100">
                        </div>
                    </div>
                    ${result.bbox ? `
                    <div class="bbox-info mt-2">
                        <small class="text-muted">
                            Position: (${result.bbox.x}, ${result.bbox.y}) &nbsp; 
                            Size: ${result.bbox.width}×${result.bbox.height}
                        </small>
                    </div>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Draw bounding boxes on an image
 * @param {Array} results - Array of detection results with bounding boxes
 * @param {HTMLImageElement} imageElement - Image element (used for scaling context).
 * @param {HTMLCanvasElement} overlayCanvas - The canvas element to draw boxes on.
 */
function drawBoundingBoxes(results, imageElement, overlayCanvas) {
    if (!overlayCanvas || !imageElement || !results) {
        console.warn("DETECT.JS: drawBoundingBoxes called with missing arguments or no results.");
        return;
    }
    
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) {
        console.error("DETECT.JS: Could not get 2D context from overlay canvas.");
        return;
    }

    // Set canvas dimensions to match the displayed image size.
    // This is crucial for correct positioning of bounding boxes.
    // The image might be scaled by CSS, so use clientWidth/Height.
    overlayCanvas.width = imageElement.clientWidth;
    overlayCanvas.height = imageElement.clientHeight;
    
    // Get the natural dimensions of the image (original size)
    // Fallback to offsetWidth/Height if natural dimensions are 0 (e.g., image not fully loaded, though we try to wait)
    const naturalWidth = imageElement.naturalWidth || imageElement.offsetWidth;
    const naturalHeight = imageElement.naturalHeight || imageElement.offsetHeight;

    if (naturalWidth === 0 || naturalHeight === 0) {
        console.warn("DETECT.JS: Image natural dimensions are zero. Cannot calculate scale for bounding boxes accurately. Ensure image is loaded.");
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height); // Clear if we can't draw
        return;
    }

    // Calculate scaling factors: (displayed size / original size)
    const scaleX = overlayCanvas.width / naturalWidth;
    const scaleY = overlayCanvas.height / naturalHeight;
    
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height); // Clear previous drawings
    
    results.forEach(result => {
        if (!result.bbox) return;
        
        const bbox = result.bbox;
        const confidence = (result.confidence * 100).toFixed(1);
        
        // Scale and draw bounding box
        const x = bbox.x * scaleX;
        const y = bbox.y * scaleY;
        const width = bbox.width * scaleX;
        const height = bbox.height * scaleY;
        
        ctx.strokeStyle = '#00FF00'; // Green
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        const labelText = `${result.trash_type} ${confidence}%`;
        ctx.font = '12px Arial'; // Set font before measuring text
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 10; // Add some padding
        const labelHeight = 18; // Adjusted for padding
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
        
        // Draw label text
        ctx.fillStyle = '#000000'; // Black text
        ctx.fillText(labelText, x + 5, y - 5); // Adjust y for text position within label bg
    });
}

/**
 * Create a chart for detection results
 * @param {Array} results - Array of detection results
 * @param {HTMLElement} chartContainer - Container element for the chart
 */
function createDetectionChart(results, chartContainer) {
    if (!chartContainer || !results || results.length === 0) return;
    
    // Group results by trash type
    const trashTypes = {};
    results.forEach(result => {
        if (trashTypes[result.trash_type]) {
            trashTypes[result.trash_type]++;
        } else {
            trashTypes[result.trash_type] = 1;
        }
    });
    
    // Create canvas for the chart
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    
    // Create the chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(trashTypes),
            datasets: [{
                data: Object.values(trashTypes),
                backgroundColor: [
                    '#6a3db3', '#4dabf7', '#51cf66', '#fcc419', '#ff6b6b',
                    '#cc5de8', '#22b8cf', '#20c997', '#fa5252', '#7950f2'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Detected Trash Types',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

/**
 * Generates a summary of detection results
 * @param {Array} results - Array of detection results
 * @returns {string} HTML string with summary
 */
function generateSummary(results) {
    if (!results || results.length === 0) {
        return '<p>No trash detected.</p>';
    }
    
    // Count types
    const trashTypes = {};
    let maxConfidence = 0;
    let dominantType = '';
    
    results.forEach(result => {
        if (trashTypes[result.trash_type]) {
            trashTypes[result.trash_type]++;
        } else {
            trashTypes[result.trash_type] = 1;
        }
        
        if (result.confidence > maxConfidence) {
            maxConfidence = result.confidence;
            dominantType = result.trash_type;
        }
    });
    
    const typeCount = Object.keys(trashTypes).length;
    
    let html = `
        <div class="summary-card">
            <h4>Detection Summary</h4>
            <p><strong>Total items detected:</strong> ${results.length}</p>
            <p><strong>Types of trash:</strong> ${typeCount}</p>
            <p><strong>Dominant trash type:</strong> ${dominantType} (${(maxConfidence * 100).toFixed(2)}% confidence)</p>
            <div class="types-breakdown">
                <h5>Type Breakdown:</h5>
                <ul>
    `;
    
    for (const [type, count] of Object.entries(trashTypes)) {
        html += `<li>${type}: ${count} item${count > 1 ? 's' : ''}</li>`;
    }
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    return html;
}
