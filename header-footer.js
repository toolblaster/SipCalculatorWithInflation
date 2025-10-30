document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    const currentPath = window.location.pathname; // e.g., "/", "/contact-us-and-legal.html", etc.

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = getHeaderHTML(currentPath);
        setupMobileMenu(); // Setup the new mobile menu logic
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
 * Sets up the event listeners for the mobile menu toggle, using max-height
 * for a smooth CSS transition effect.
 */
function setupMobileMenu() {
    const toggleButton = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('mobile-nav-menu');

    if (toggleButton && navMenu) {
        // Initialize menu state (set max-height to 0 to keep it closed and hidden)
        navMenu.style.maxHeight = '0';

        // Add event listener for the menu button
        toggleButton.addEventListener('click', () => {
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
            
            toggleButton.setAttribute('aria-expanded', String(!isExpanded));
            
            if (!isExpanded) {
                // OPENING: Set max-height to scrollHeight to trigger slide-down animation
                navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
            } else {
                // CLOSING: Set max-height back to 0 to trigger slide-up animation
                navMenu.style.maxHeight = '0';
            }
        });

        // Close menu if a link is clicked (e.g., navigating to a new page or section)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggleButton.setAttribute('aria-expanded', 'false');
                navMenu.style.maxHeight = '0';
            });
        });

        // Adjust max-height on window resize if the menu is open, preventing overflow issues.
        window.addEventListener('resize', () => {
             // Only run if screen size suggests mobile (< sm is 640px)
             if (window.innerWidth < 640 && toggleButton.getAttribute('aria-expanded') === 'true') {
                navMenu.style.maxHeight = navMenu.scrollHeight + 'px';
            } else if (window.innerWidth >= 640) {
                 // Ensure desktop mode never has max-height restriction
                navMenu.style.maxHeight = null;
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
        // Mobile Active Style: Larger text and strong red highlight
        return 'text-base font-bold text-red-700 pointer-events-none bg-red-100/50'; 
    }
    // Mobile Inactive Style
    return 'text-base font-semibold text-gray-700 hover:text-red-600 hover:bg-gray-100 transition-colors'; 
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
    // Define the desktop link classes for clarity
    const desktopLinkBase = 'text-xs font-semibold text-gray-600 hover:text-red-600 hover:underline transition-colors';
    const desktopLinkActive = 'text-xs font-semibold text-red-600 underline pointer-events-none';
    
    // Helper to select desktop class
    const getDesktopLinkClass = (pagePath) => {
        const normalizedPath = (currentPath === '/' || currentPath === '/index.html') ? '/' : currentPath;
        const normalizedPagePath = (pagePath === '/' || pagePath === '/index.html') ? '/' : pagePath;
        return (normalizedPath === normalizedPagePath) ? desktopLinkActive : desktopLinkBase;
    };
    

    return `
    <header id="main-header" class="bg-white border-b border-gray-200 shadow-lg w-full z-50">
        <div class="w-full max-w-5xl mx-auto px-4">
             <div class="flex items-center justify-between py-2">
                <a href="/" class="flex items-center space-x-1.5 min-w-0 hover:opacity-80 transition-opacity" aria-label="SipCalculatorWithInflation Homepage">
                    <!-- UPDATED SVG: New icon representing growth and coin/investment. Added logo-icon class for animation. -->
                    <svg class="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0 logo-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="flex flex-col min-w-0">
                        <span class="text-base md:text-lg font-bold text-gray-800 truncate">
                            SipCalculator<span class="text-sm md:text-base font-semibold text-red-600">WithInflation</span>
                        </span>
                        <div class="h-px w-1/2 bg-red-500 mt-0.5"></div>
                    </div>
                </a>
                
                <!-- Desktop Menu Links (Visible on sm and up) -->
                <div class="hidden sm:flex items-center space-x-3 sm:space-x-4">
                    <a href="/" class="${getDesktopLinkClass('/')}" ${getAriaCurrent('/', currentPath)}>
                        SIP Calculator
                    </a>
                    <a href="how-much-sip-for-1-crore-with-inflation.html" class="${getDesktopLinkClass('/how-much-sip-for-1-crore-with-inflation.html')}" ${getAriaCurrent('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}>
                        SIP Guide to ₹1 Crore
                    </a>
                    <a href="contact-us-and-legal.html" class="${getDesktopLinkClass('/contact-us-and-legal.html')}" ${getAriaCurrent('/contact-us-and-legal.html', currentPath)}>
                        Contact & Legal
                    </a>
                </div>

                <!-- Mobile Menu Button (Visible below sm) -->
                <button id="menu-toggle" class="sm:hidden p-1.5 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors" aria-expanded="false" aria-controls="mobile-nav-menu">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </div>
        </div>

        <!-- Mobile Menu (Controlled by JS max-height for smooth dropdown) -->
        <div id="mobile-nav-menu" class="sm:hidden bg-gray-50 border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="flex flex-col space-y-0.5 px-4 py-2">
                <a href="/" class="${getLinkClass('/', currentPath)} p-2 rounded-lg" ${getAriaCurrent('/', currentPath)}>
                    SIP Calculator
                </a>
                <a href="how-much-sip-for-1-crore-with-inflation.html" class="${getLinkClass('/how-much-sip-for-1-crore-with-inflation.html', currentPath)} p-2 rounded-lg" ${getAriaCurrent('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}>
                    SIP Guide to ₹1 Crore
                </a>
                <a href="contact-us-and-legal.html" class="${getLinkClass('/contact-us-and-legal.html', currentPath)} p-2 rounded-lg" ${getAriaCurrent('/contact-us-and-legal.html', currentPath)}>
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
