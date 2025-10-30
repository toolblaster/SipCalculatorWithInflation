document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    const currentPath = window.location.pathname; // e.g., "/", "/contact-us-and-legal.html", etc.

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = getHeaderHTML(currentPath);
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
        return 'text-xs font-semibold text-red-600 underline pointer-events-none';
    }
    return 'text-xs font-semibold text-gray-600 hover:text-red-600 hover:underline transition-colors';
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
    return `
    <header id="main-header" class="bg-white border-b border-gray-200 shadow-lg w-full z-50">
        <div class="w-full max-w-5xl mx-auto px-4">
             <div class="flex items-center justify-between py-2">
                <a href="/" class="flex items-center space-x-1.5 min-w-0 hover:opacity-80 transition-opacity" aria-label="SipCalculatorWithInflation Homepage">
                    <svg class="w-5 h-5 md:w-6 md:h-6 text-red-600 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                       <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <div class="flex flex-col min-w-0">
                        <span class="text-base md:text-lg font-bold text-gray-800 truncate">
                            SipCalculator<span class="text-sm md:text-base font-semibold text-red-600">WithInflation</span>
                        </span>
                        <div class="h-px w-1/2 bg-red-500 mt-0.5"></div>
                    </div>
                </a>
                <!-- Menu Links -->
                <div class="flex items-center space-x-3 sm:space-x-4">
                    <a href="/" class="${getLinkClass('/', currentPath)}" ${getAriaCurrent('/', currentPath)}>
                        SIP Calculator
                    </a>
                    <a href="how-much-sip-for-1-crore-with-inflation.html" class="${getLinkClass('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}" ${getAriaCurrent('/how-much-sip-for-1-crore-with-inflation.html', currentPath)}>
                        SIP Guide to ₹1 Crore
                    </a>
                    <a href="contact-us-and-legal.html" class="${getLinkClass('/contact-us-and-legal.html', currentPath)}" ${getAriaCurrent('/contact-us-and-legal.html', currentPath)}>
                        Contact & Legal
                    </a>
                </div>
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
