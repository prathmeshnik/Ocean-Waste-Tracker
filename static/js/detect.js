/**
 * JavaScript for detection functionality
 * This file is used by both upload.js and livestream.js
 */

/**
 * Display detection results
 * @param {Array} results - Array of detection results
 * @param {HTMLElement} container - Container element to display results in
 * @param {HTMLImageElement|null} imageElement - Optional image element to draw bounding boxes on
 */
function displayDetectionResults(results, container, imageElement = null) {
    if (!container) return;
    
    // Clear loading spinner
    hideSpinner(container);
    
    if (results.length === 0) {
        container.innerHTML = '<p class="text-center">No trash detected in the image.</p>';
        return;
    }
    
    // If image element is provided and we have bounding boxes, create an overlay
    if (imageElement && results.some(r => r.bbox)) {
        drawBoundingBoxes(results, imageElement);
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
 * @param {HTMLImageElement} imageElement - Image element to draw boxes on
 */
function drawBoundingBoxes(results, imageElement) {
    // Get the parent container of the image
    const parent = imageElement.parentElement;
    if (!parent) return;
    
    // Make the parent position relative if it's not already
    if (window.getComputedStyle(parent).position !== 'relative') {
        parent.style.position = 'relative';
    }
    
    // Remove any existing overlay
    const existingOverlay = parent.querySelector('.detection-overlay');
    if (existingOverlay) {
        parent.removeChild(existingOverlay);
    }
    
    // Create an overlay for drawing bounding boxes
    const overlay = document.createElement('div');
    overlay.className = 'detection-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';  // Don't interfere with clicks
    
    // Get the natural dimensions of the image
    const imageWidth = imageElement.naturalWidth;
    const imageHeight = imageElement.naturalHeight;
    
    // Get the displayed dimensions
    const displayedWidth = imageElement.offsetWidth;
    const displayedHeight = imageElement.offsetHeight;
    
    // Calculate scaling factors
    const scaleX = displayedWidth / imageWidth;
    const scaleY = displayedHeight / imageHeight;
    
    // Add bounding boxes to the overlay
    results.forEach(result => {
        if (!result.bbox) return;
        
        const bbox = result.bbox;
        const confidence = (result.confidence * 100).toFixed(1);
        
        // Create a box element
        const box = document.createElement('div');
        box.className = 'bounding-box';
        box.style.position = 'absolute';
        box.style.left = `${bbox.x * scaleX}px`;
        box.style.top = `${bbox.y * scaleY}px`;
        box.style.width = `${bbox.width * scaleX}px`;
        box.style.height = `${bbox.height * scaleY}px`;
        box.style.border = '2px solid #00ff00';  // Green border
        box.style.boxSizing = 'border-box';
        
        // Create a label with the trash type and confidence
        const label = document.createElement('div');
        label.className = 'bbox-label';
        label.textContent = `${result.trash_type} ${confidence}%`;
        label.style.position = 'absolute';
        label.style.top = '-25px';
        label.style.left = '0';
        label.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
        label.style.color = 'black';
        label.style.padding = '2px 5px';
        label.style.borderRadius = '3px';
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        
        box.appendChild(label);
        overlay.appendChild(box);
    });
    
    // Add the overlay to the parent
    parent.appendChild(overlay);
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
