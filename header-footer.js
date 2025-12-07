document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    const currentPath = window.location.pathname; // e.g., "/", "/contact-us-and-legal.html", etc.

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = getHeaderHTML(currentPath);
        // Attach click listener for the mobile menu toggle after the HTML is added to the DOM
        attachMobileMenuListener();
    }

    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = getFooterHTML();
        // Now that footer is in DOM, find the year and set it.
        const yearElem = document.getElementById('copyright-year');
        if (yearElem) {
            yearElem.textContent = new Date().getFullYear();
        }
    }
});

/**
 * Attaches the necessary event listeners for the mobile menu (Right Slide-out).
 */
function attachMobileMenuListener() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('mobile-nav-menu');
    const menuOverlay = document.getElementById('mobile-menu-overlay');
    const closeBtn = document.getElementById('close-menu-btn');
    const body = document.body;

    function openMenu() {
        // Remove hidden first so it exists in DOM
        menuOverlay.classList.remove('hidden');
        
        // Use a small timeout to allow the browser to register the 'hidden' removal
        // before applying the opacity change for the transition to work.
        setTimeout(() => {
            menuOverlay.classList.remove('opacity-0');
            navMenu.classList.remove('translate-x-full');
        }, 10);

        menuToggle.setAttribute('aria-expanded', 'true');
        body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeMenu() {
        // Start the transition out
        navMenu.classList.add('translate-x-full');
        menuOverlay.classList.add('opacity-0');

        // Wait for transition to finish before hiding
        menuOverlay.addEventListener('transitionend', function handler() {
            if (menuOverlay.classList.contains('opacity-0')) {
                menuOverlay.classList.add('hidden');
            }
            menuOverlay.removeEventListener('transitionend', handler);
        }, { once: true });
        
        menuToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = ''; // Restore scrolling
    }

    if (menuToggle && navMenu && menuOverlay && closeBtn) {
        menuToggle.addEventListener('click', openMenu);
        closeBtn.addEventListener('click', closeMenu);
        menuOverlay.addEventListener('click', closeMenu);
    }
}


/**
 * Gets the active class for a nav link based on the current path.
 * @param {string} pagePath - The path of the link to check (e.g., "/").
 * @param {string} currentPath - The current window.location.pathname.
 * @returns {string} - The appropriate Tailwind classes.
 */
function getLinkClass(pagePath, currentPath) {
    // Normalize root paths for comparison
    const normalizedPath = (currentPath === '/' || currentPath === '/index.html') ? '/' : currentPath;
    const normalizedPagePath = (pagePath === '/' || pagePath === '/index.html') ? '/' : pagePath;

    if (normalizedPath === normalizedPagePath) {
        return 'font-bold text-red-700 bg-white/60 shadow-sm'; // Active state: white bg on gradient
    }
    return 'font-medium text-gray-700 hover:text-red-700 hover:bg-white/40 transition-colors'; // Default state
}

/**
 * Gets the aria-current attribute if the link is active.
 * @param {string} pagePath - The path of the link to check.
 * @param {string} currentPath - The current window.location.pathname.
 * @returns {string} - The aria-current attribute or an empty string.
 */
function getAriaCurrent(pagePath, currentPath) {
     const normalizedPath = (currentPath === '/' || currentPath === '/index.html') ? '/' : currentPath;
     const normalizedPagePath = (pagePath === '/' || pagePath === '/index.html') ? '/' : pagePath;
     
     return (normalizedPath === normalizedPagePath) ? 'aria-current="page"' : '';
}

/**
 * Generates the complete header HTML.
 * @param {string} currentPath - The current window.location.pathname.
 * @returns {string} - The header HTML.
 */
function getHeaderHTML(currentPath) {
    // Define shared link classes for desktop
    const desktopLinkClasses = (path) => {
        // Simple logic for desktop links: bold red if active, otherwise gray hover red
        const normalizedPath = (currentPath === '/' || currentPath === '/index.html') ? '/' : currentPath;
        const normalizedPagePath = (path === '/' || path === '/index.html') ? '/' : path;
        const isActive = normalizedPath === normalizedPagePath;
        
        return `hidden sm:block text-xs ${isActive ? 'font-bold text-red-600' : 'font-medium text-gray-700 hover:text-red-600 hover:underline'} transition-colors`;
    };

    // UPDATED mobileLinkClasses for the slide-out menu
    const mobileLinkClasses = (path) => `block w-full py-3 px-4 text-base rounded-lg mb-1 ${getLinkClass(path, currentPath)}`;


    return `
    <header id="main-header" class="bg-gray-50 border-b border-gray-200 shadow-lg w-full z-50 relative">
        <div class="w-full max-w-5xl mx-auto px-4">
             <div class="flex items-center justify-between py-2">
                <!-- Logo and Name -->
                <a href="/" class="flex items-center space-x-2 min-w-0 hover:opacity-90 transition-opacity" aria-label="SipCalculatorWithInflation Homepage">
                    <!-- New SIP Growth Coin Icon -->
                    <svg class="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 logo-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex flex-col min-w-0">
                        <!-- Improved Logo Text -->
                        <span class="text-lg md:text-xl font-extrabold text-gray-900 leading-tight truncate">
                            SIP Calculator
                        </span>
                        <span class="text-[10px] font-semibold text-red-600 leading-none -mt-0.5 md:-mt-1">
                            w/ Inflation & Step Up
                        </span>
                    </div>
                </a>

                <!-- Desktop Menu Links -->
                <nav class="flex items-center space-x-3 sm:space-x-4">
                    <a href="/" class="${desktopLinkClasses('/')}" ${getAriaCurrent('/', currentPath)}>
                        Calculator
                    </a>
                    <a href="how-much-sip-for-1-crore-with-inflation.html" class="${desktopLinkClasses('/how-much-sip-for-1-crore-with-inflation.html')}" ${getAriaCurrent('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}>
                        SIP Guide to ₹1 Crore
                    </a>
                    <a href="contact-us-and-legal.html" class="${desktopLinkClasses('/contact-us-and-legal.html')}" ${getAriaCurrent('/contact-us-and-legal.html', currentPath)}>
                        Contact & Legal
                    </a>
                    
                    <!-- Mobile Menu Toggle Button -->
                    <button id="menu-toggle" class="sm:hidden p-2 text-gray-700 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors duration-200" aria-controls="mobile-nav-menu" aria-expanded="false" aria-label="Open navigation menu">
                         <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
        
        <!-- Mobile Navigation Overlay (Backdrop) -->
        <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] hidden opacity-0 transition-opacity duration-300 ease-in-out sm:hidden"></div>

        <!-- Mobile Navigation Drawer (Right Slide-out) -->
        <div id="mobile-nav-menu" class="fixed top-0 right-0 h-full w-64 bg-gradient-to-b from-red-50 to-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 ease-in-out sm:hidden flex flex-col">
            
            <!-- Drawer Header -->
            <div class="flex items-center justify-between p-4 border-b border-red-100">
                <span class="text-lg font-extrabold text-gray-900">Menu</span>
                <button id="close-menu-btn" class="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-full transition-colors" aria-label="Close menu">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Drawer Links -->
            <div class="flex flex-col p-4 overflow-y-auto">
                <a href="/" class="${mobileLinkClasses('/')}">
                    SIP Calculator
                </a>
                <a href="how-much-sip-for-1-crore-with-inflation.html" class="${mobileLinkClasses('/how-much-sip-for-1-crore-with-inflation.html')}">
                    ₹1 Crore Guide
                </a>
                <a href="contact-us-and-legal.html" class="${mobileLinkClasses('/contact-us-and-legal.html')}">
                    Contact & Legal
                </a>
            </div>

             <!-- Drawer Footer (Optional Branding) -->
            <div class="mt-auto p-4 border-t border-red-100 text-center">
                 <p class="text-[10px] text-gray-500">
                    SipCalculatorWithInflation &copy; ${new Date().getFullYear()}
                 </p>
            </div>
        </div>

    </header>
    `;
}

/**
 * Generates the complete footer HTML.
 * @returns {string} - The footer HTML.
 */
function getFooterHTML() {
    return `
    <footer class="bg-white border-t border-gray-200 py-3 mt-6">
        <div class="w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 text-center md:text-left">
             
             <!-- Brand Logo (Compacted Left Side) -->
             <div class="flex items-center gap-2 group cursor-default select-none">
                <!-- Icon -->
                <svg class="w-4 h-4 text-red-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <!-- Text Stack -->
                <div class="flex flex-col items-start text-left">
                    <span class="text-sm font-extrabold text-gray-900 leading-tight group-hover:text-red-600 transition-colors">SIP Calculator</span>
                    <span class="text-[9px] font-semibold text-red-600 leading-none">w/ Inflation & Step Up</span>
                </div>
             </div>

             <!-- Right Side: Info Stack (Compacted Right Side) -->
             <div class="flex flex-col md:items-end items-center">
                 <p class="text-[10px] text-gray-500 leading-tight">
                    &copy; <span id="copyright-year"></span> SipCalculatorWithInflation.toolblaster.com
                 </p>
                 <p class="text-[10px] text-gray-400 leading-tight mt-0.5 flex items-center gap-1">
                    <span>A Proud Part of</span>
                    <a href="https://toolblaster.com" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-red-600 font-semibold transition-colors">toolblaster.com</a>
                    <span>Network</span>
                    <span class="text-red-500" aria-label="with love">❤️</span>
                 </p>
             </div>
        </div>
    </footer>
    `;
}
