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
 * Attaches the necessary event listeners for the mobile menu.
 */
function attachMobileMenuListener() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('mobile-nav-menu');
    const menuIcon = document.getElementById('menu-icon'); // NEW: Get the icon element

    if (menuToggle && navMenu && menuIcon) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            
            // Toggle aria attribute
            menuToggle.setAttribute('aria-expanded', (!isExpanded).toString());
            
            // Toggle Icon Rotation (NEW)
            menuIcon.classList.toggle('rotate-90', !isExpanded);

            if (!isExpanded) {
                // Open menu: remove hidden, calculate scrollHeight, then apply max-height
                navMenu.classList.remove('hidden');
                // Use a short delay to ensure display: block is processed before transition
                setTimeout(() => {
                    navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
                }, 10);
            } else {
                // Close menu: set max-height to 0, then add hidden after transition
                navMenu.style.maxHeight = '0';
                navMenu.addEventListener('transitionend', function handler() {
                    if (navMenu.style.maxHeight === '0px') {
                        navMenu.classList.add('hidden');
                    }
                    navMenu.removeEventListener('transitionend', handler);
                });
            }
        });
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
        return 'font-bold text-red-600'; // Removed underline for mobile focus state
    }
    return 'font-medium text-gray-700 hover:text-red-600 transition-colors'; // Removed underline for cleaner look
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
    // Define shared link classes for desktop and mobile menu
    const desktopLinkClasses = (path) => `hidden sm:block text-xs ${getLinkClass(path, currentPath)} hover:underline`; // Re-added underline for desktop hover
    // UPDATED mobileLinkClasses for left alignment, padding, and hover/active effects
    const mobileLinkClasses = (path) => `block w-full py-2 px-6 text-sm text-left border-b border-gray-100 last:border-b-0 hover:bg-red-50 transition-colors ${getLinkClass(path, currentPath)}`;


    return `
    <header id="main-header" class="bg-white border-b border-gray-200 shadow-lg w-full z-50">
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
                        <!-- USER EDIT: Increased size of 'SIP Calculator' for more contrast -->
                        <span class="text-lg md:text-xl font-extrabold text-gray-900 leading-tight truncate">
                            SIP Calculator
                        </span>
                        <!-- USER EDIT: Made subtext smaller for more contrast and apply to all screens -->
                        <span class="text-[10px] font-semibold text-red-600 leading-none -mt-0.5 md:-mt-1">
                            w/ Inflation & Step Up
                        </span>
                    </div>
                </a>

                <!-- Desktop Menu Links -->
                <nav class="flex items-center space-x-3 sm:space-x-4">
                    <a href="/" class="${desktopLinkClasses('/', currentPath)}" ${getAriaCurrent('/', currentPath)}>
                        Calculator
                    </a>
                    <a href="how-much-sip-for-1-crore-with-inflation.html" class="${desktopLinkClasses('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}" ${getAriaCurrent('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}>
                        SIP Guide to ₹1 Crore
                    </a>
                    <a href="contact-us-and-legal.html" class="${desktopLinkClasses('/contact-us-and-legal.html', currentPath)}" ${getAriaCurrent('/contact-us-and-legal.html', currentPath)}>
                        Contact & Legal
                    </a>
                    
                    <!-- Mobile Menu Toggle Button (with smooth rotation) -->
                    <button id="menu-toggle" class="sm:hidden p-1.5 text-gray-700 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors duration-300" aria-controls="mobile-nav-menu" aria-expanded="false" aria-label="Toggle navigation menu">
                         <svg id="menu-icon" class="w-6 h-6 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
        
        <!-- Mobile Navigation Drawer -->
        <div id="mobile-nav-menu" class="hidden sm:hidden w-full overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-200" style="max-height: 0;">
            <div class="flex flex-col items-center py-0.5"> <!-- Adjusted vertical padding for links below to handle it -->
                <!-- UPDATED: Links now use left alignment and hover background -->
                <a href="/" class="${mobileLinkClasses('/', currentPath)}">
                    SIP Calculator
                </a>
                <a href="how-much-sip-for-1-crore-with-inflation.html" class="${mobileLinkClasses('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}">
                    ₹1 Crore Guide
                </a>
                <a href="contact-us-and-legal.html" class="${mobileLinkClasses('/contact-us-and-legal.html', currentPath)}">
                    Contact & Legal
                </a>
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
    <footer class="bg-white border-t border-gray-200 py-2 mt-6">
        <div class="w-full max-w-5xl mx-auto px-4 text-center">
             <p class="text-xs text-gray-700">
                &copy; <span id="copyright-year">2025</span> SipCalculatorWithInflation.toolblaster.com
             </p>
             <div class="border-t border-gray-200 my-1 max-w-xs mx-auto"></div>
             <p class="text-xs text-gray-700">
                A proud part of the <a href="https://toolblaster.com" target="_blank" rel="noopener noreferrer" class="text-red-600 hover:underline"><strong>toolblaster.com</strong></a> Network by <strong>Vikas Rana</strong>
             </p>
             <div class="border-t border-gray-200 my-1 max-w-xs mx-auto"></div>
             <p class="text-xs text-gray-600 italic">
                As an affiliate, we may earn from qualifying purchases.
             </p>
        </div>
    </footer>
    `;
}
