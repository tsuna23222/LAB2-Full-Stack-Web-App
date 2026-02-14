// Global variable for current user (will be used in later phases)
let currentUser = null;

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Set brand name
    document.getElementById('brandName').textContent = 'Full-Stack App (Your Name)';
    
    // Initialize routing
    handleRouting();
    
    // Listen for hash changes (URL navigation)
    window.addEventListener('hashchange', handleRouting);
    
    // Set default hash if empty
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
});
// ===================================
// Client-Side Routing
// ===================================

// Navigate to a specific route
function navigateTo(hash) {
    window.location.hash = hash;
}

// Handle routing based on current hash
function handleRouting() {
    // Get current hash from URL (e.g., "#/login")
    let hash = window.location.hash || '#/';
    
    // Remove the "#/" prefix to get the route name
    const route = hash.replace('#/', '');
    
    console.log('Current route:', route); // For debugging
    
    // Hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Determine which page to show based on route
    let pageId = '';
    
    switch(route) {
        case '':
        case '/':
            pageId = 'home-page';
            break;
        case 'register':
            pageId = 'register-page';
            break;
        case 'verify-email':
            pageId = 'verify-email-page';
            break;
        case 'login':
            pageId = 'login-page';
            break;
        case 'profile':
            pageId = 'profile-page';
            break;
        case 'employees':
            pageId = 'employees-page';
            break;
        case 'departments':
            pageId = 'departments-page';
            break;
        case 'accounts':
            pageId = 'accounts-page';
            break;
        case 'requests':
            pageId = 'requests-page';
            break;
        default:
            // If route doesn't exist, go to home
            pageId = 'home-page';
            console.log('Unknown route, redirecting to home');
    }
    
    // Show the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Showing page:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Code runs when HTML is fully loaded
});

window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    // 1. Get the hash
    let hash = window.location.hash;  // "#/login"
    
    // 2. Remove "#/" to get route name
    const route = hash.replace('#/', '');  // "login"
    
    // 3. Hide ALL pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 4. Decide which page to show
    let pageId = '';
    if (route === 'login') {
        pageId = 'login-page';
    } else if (route === 'register') {
        pageId = 'register-page';
    }
    // ... etc
    
    // 5. Show the target page
    document.getElementById(pageId).classList.add('active');
}


if (route === 'login') {
    pageId = 'login-page';
} else if (route === 'register') {
    pageId = 'register-page';
} else if (route === 'profile') {
    pageId = 'profile-page';
}
page.classList.remove('active'); 
page.classList.add('active'); 

getComputedStyle(document.querySelector('.page.active')).display
document.getElementById('home-page').classList.add('active');