/**
 * Main JavaScript file for Water Trash Detection System
 */

// Check if document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Water Trash Detection System loaded');

    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Handle any flash messages
    const flashMessages = document.querySelectorAll('.alert');
    if (flashMessages.length > 0) {
        flashMessages.forEach(message => {
            // Auto-dismiss flash messages after 5 seconds
            setTimeout(() => {
                const alert = new bootstrap.Alert(message);
                alert.close();
            }, 5000);
        });
    }

    // Responsive navigation menu
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            } else {
                navbarCollapse.classList.add('show');
            }
        });
    }

    // Highlight active nav item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
        }
    });

    // Initialize any custom components based on page
    initPageSpecificFunctions();
});

/**
 * Initialize page-specific functions based on current page
 */
function initPageSpecificFunctions() {
    // Detect current page based on URL or page ID
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/upload')) {
        // Initialize upload page functionality
        initUploadPage();
    } else if (currentPath.includes('/livestream')) {
        // Initialize livestream page functionality
        initLivestreamPage();
    } else if (currentPath.includes('/reports')) {
        // Initialize reports page functionality
        initReportsPage();
    } else if (currentPath.includes('/contact')) {
        // Initialize contact page functionality
        initContactPage();
    }
}

/**
 * Format date for display
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time for display
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element to show spinner in
 */
function showSpinner(container) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner-container';
    spinner.innerHTML = '<div class="spinner"></div><p class="mt-3">Processing...</p>';
    container.innerHTML = '';
    container.appendChild(spinner);
}

/**
 * Hide loading spinner
 * @param {HTMLElement} container - Container element with spinner
 */
function hideSpinner(container) {
    const spinner = container.querySelector('.spinner-container');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * Display an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert alert-danger alert-dismissible fade show';
    alertContainer.role = 'alert';
    
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find a suitable container for the alert
    const container = document.querySelector('.container') || document.body;
    container.prepend(alertContainer);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = new bootstrap.Alert(alertContainer);
        alert.close();
    }, 5000);
}
