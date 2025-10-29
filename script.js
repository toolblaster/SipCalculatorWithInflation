document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);

    // --- DOM ELEMENT SELECTORS (Simplified) ---
    const elements = {
        // Input Cards
        sipAmountCard: getElem('sip-amount-card'),
        investmentPeriodCard: getElem('investment-period-card'),
        
        // Result Cards
        standardResultSummary: getElem('standard-result-summary'),
        
        // Input Sliders & Fields
        sipAmountSlider: getElem('sip-amount-slider'),
        sipAmountInput: getElem('sip-amount-input'),
        sipIncreaseRateSlider: getElem('sip-increase-rate-slider'),
        sipIncreaseRateInput: getElem('sip-increase-rate-input'),
        sipIncreaseAmountSlider: getElem('sip-increase-amount-slider'),
        sipIncreaseAmountInput: getElem('sip-increase-amount-input'),
        returnRateSlider: getElem('return-rate-slider'),
        returnRateInput: getElem('return-rate-input'),
        investmentPeriodSlider: getElem('investment-period-slider'),
        investmentPeriodInput: getElem('investment-period-input'),
        
        // Inflation
        inflationToggle: getElem('inflation-toggle'),
        inflationRateContainer: getElem('inflation-rate-container'),
        inflationRateSlider: getElem('inflation-rate-slider'),
        inflationRateInput: getElem('inflation-rate-input'),
        
        // Step-Up
        stepUpToggle: getElem('step-up-toggle'),
        stepUpLabel: getElem('step-up-label'),
        stepUpRateContainer: getElem('step-up-rate-container'),
        stepUpAmountContainer: getElem('step-up-amount-container'),
        
        // Result Display Elements
        investedAmountElem: getElem('invested-amount'),
        totalReturnsElem: getElem('total-returns'),
        finalValueElem: getElem('final-value'),
        realValueContainer: getElem('real-value-container'),
        realValueElem: getElem('real-value'),
        
        // Table, Chart & Share
        growthTableContainer: getElem('growth-table-container'),
        growthTableBody: getElem('growth-table-body'),
        growthCardsContainer: getElem('growth-cards-container'), // <-- ADDED: Container for mobile cards
        toggleTableBtn: getElem('toggle-table-btn'),
        chartCanvas: getElem('investment-chart'),
        shareWhatsappBtn: getElem('share-whatsapp'),
        shareFacebookBtn: getElem('share-facebook'),
        shareTelegramBtn: getElem('share-telegram'),
        shareTwitterBtn: getElem('share-twitter'),
        copyLinkBtn: getElem('copy-link-btn'),
        copyLinkDefaultIcon: getElem('copy-link-default'),
        copyLinkSuccessIcon: getElem('copy-link-success'),
        copyrightYear: getElem('copyright-year')
    };
    
    // Check if chartCanvas exists before getting context
    const chartCtx = elements.chartCanvas ? elements.chartCanvas.getContext('2d') : null;

    // --- STATE MANAGEMENT ---
    let investmentChart;
    let isStepUpAmount = true;

    // --- UTILITY FUNCTIONS ---
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(num));
    const updateSliderFill = (slider) => {
        if (!slider) return;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--fill-percentage', `${percentage}%`);
    };

    // --- CORE CALCULATION LOGIC ---
    function calculate() {
        // Guard against missing elements if HTML hasn't fully loaded or is incorrect
        if (!elements.sipAmountInput || !elements.returnRateInput || !elements.investmentPeriodInput || !elements.inflationToggle || !elements.sipIncreaseAmountInput || !elements.sipIncreaseRateInput) {
            console.error("One or more essential input elements are missing.");
            return; 
        }

        const monthlySipAmount = parseFloat(elements.sipAmountInput.value) || 0; // Default to 0 if parsing fails
        const annualReturnRate = (parseFloat(elements.returnRateInput.value) || 0) / 100;
        const investmentPeriodYears = parseInt(elements.investmentPeriodInput.value) || 0;
        const annualInflationRate = elements.inflationToggle.checked && elements.inflationRateInput ? (parseFloat(elements.inflationRateInput.value) || 0) / 100 : 0;
        const stepUpValue = isStepUpAmount 
            ? parseFloat(elements.sipIncreaseAmountInput.value) || 0 
            : (parseFloat(elements.sipIncreaseRateInput.value) || 0) / 100;

        let totalInvested = 0;
        let finalValue = 0;
        let currentMonthlySip = monthlySipAmount;
        const monthlyRate = annualReturnRate / 12;
        const yearlyGrowthData = [];

        // Avoid infinite loops or excessively long calculations
        const maxYears = 100; 
        const actualYears = Math.min(investmentPeriodYears, maxYears);

        for (let year = 1; year <= actualYears; year++) {
            let yearlyInvested = 0;
            let yearlyEndValue = finalValue; // Start value for the year
            for (let month = 1; month <= 12; month++) {
                yearlyEndValue = yearlyEndValue * (1 + monthlyRate) + currentMonthlySip;
                totalInvested += currentMonthlySip;
                yearlyInvested += currentMonthlySip;
            }
            finalValue = yearlyEndValue; // Update finalValue at the end of the year
            
            yearlyGrowthData.push({
                year: year,
                invested: totalInvested, // Cumulative invested
                returns: finalValue - totalInvested, // Cumulative returns
                total: finalValue
            });

            // Apply step-up for the *next* year
            if (isStepUpAmount) {
                currentMonthlySip += stepUpValue;
            } else {
                currentMonthlySip *= (1 + stepUpValue);
            }
             // Safety break if SIP amount becomes excessively large or negative
            if (currentMonthlySip < 0 || !isFinite(currentMonthlySip)) { 
                console.warn("SIP amount became invalid, breaking calculation.");
                break; 
            }
        }

         // Update UI elements only if they exist
        if (elements.investedAmountElem) elements.investedAmountElem.textContent = formatCurrency(totalInvested);
        if (elements.totalReturnsElem) elements.totalReturnsElem.textContent = formatCurrency(finalValue - totalInvested);
        if (elements.finalValueElem) elements.finalValueElem.textContent = formatCurrency(finalValue);

        if (elements.inflationToggle.checked && elements.realValueContainer && elements.realValueElem) {
            const realValue = actualYears > 0 ? finalValue / Math.pow(1 + annualInflationRate, actualYears) : finalValue;
            elements.realValueElem.textContent = formatCurrency(realValue);
            elements.realValueContainer.classList.remove('hidden');
        } else if (elements.realValueContainer) {
            elements.realValueContainer.classList.add('hidden');
        }

        // Updated Chart Colors: Red for Invested, Green for Returns
        updateChart([totalInvested, Math.max(0, finalValue - totalInvested)], ['Total Invested', 'Total Returns'], ['#DC2626', '#16A34A']); 
        generateGrowthTable(yearlyGrowthData); // <-- Call updated function
        
        updateURLParameters(); // Update URL with new values
    }
    
    // --- UI UPDATE FUNCTIONS ---
    function updateChart(data, labels, colors) {
        if (!chartCtx) return; // Don't proceed if canvas context is not available
        
        const chartData = {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                hoverOffset: 4,
                borderRadius: 5,
                spacing: 2
            }]
        };
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }, // Adjusted legend
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` } } 
            },
            cutout: '70%'
        };
        if (investmentChart) {
            investmentChart.data = chartData;
            investmentChart.options = chartOptions;
            investmentChart.update();
        } else {
            // Ensure Chart.js is loaded before creating a new chart
             if (typeof Chart !== 'undefined') {
                investmentChart = new Chart(chartCtx, { type: 'doughnut', data: chartData, options: chartOptions });
            } else {
                console.error("Chart.js not loaded yet.");
            }
        }
    }
   
    // --- MODIFIED: generateGrowthTable to output both table rows and cards ---
    function generateGrowthTable(data) {
        let tableHtml = '';
        let cardsHtml = '';

        data.forEach(row => {
            // Generate Table Row HTML
            tableHtml += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="px-2 py-1 whitespace-nowrap text-xxs">${row.year}</td>
                    <td class="px-2 py-1 whitespace-nowrap table-cell-right text-xxs text-red-700">${formatCurrency(row.invested)}</td>
                    <td class="px-2 py-1 whitespace-nowrap table-cell-right text-green-700 font-semibold text-xxs">${formatCurrency(row.returns)}</td>
                    <td class="px-2 py-1 whitespace-nowrap table-cell-right font-bold text-xxs">${formatCurrency(row.total)}</td>
                </tr>`;

            // Generate Card HTML (for mobile)
            cardsHtml += `
                <div class="bg-white p-2 rounded-lg shadow border border-blue-100">
                    <strong class="text-sm font-semibold text-blue-700">Year ${row.year}</strong>
                    <div class="grid grid-cols-3 gap-1 mt-1 text-xs">
                        <div>
                            <span class="text-gray-500 text-xxs">Invested:</span>
                            <strong class="block text-red-700">${formatCurrency(row.invested)}</strong>
                        </div>
                        <div>
                            <span class="text-gray-500 text-xxs">Returns:</span>
                            <strong class="block text-green-700">${formatCurrency(row.returns)}</strong>
                        </div>
                        <div>
                            <span class="text-gray-500 text-xxs">Total:</span>
                            <strong class="block text-gray-800">${formatCurrency(row.total)}</strong>
                        </div>
                    </div>
                </div>`;
        });

        // Populate Table Body (for desktop)
        if (elements.growthTableBody) {
            elements.growthTableBody.innerHTML = tableHtml;
        }

        // Populate Cards Container (for mobile)
        if (elements.growthCardsContainer) {
            elements.growthCardsContainer.innerHTML = cardsHtml;
        }
    }

    function updateInputsVisibility() {
        // Ensure elements exist before accessing properties/methods
        if (!elements.stepUpToggle || !elements.stepUpRateContainer || !elements.stepUpAmountContainer || !elements.stepUpLabel) return;

        const isAmount = elements.stepUpToggle.classList.contains('active');
        elements.stepUpRateContainer.classList.toggle('hidden', isAmount);
        elements.stepUpAmountContainer.classList.toggle('hidden', !isAmount);
        elements.stepUpLabel.textContent = isAmount ? "Annual Step-up Amount (₹)" : "Annual Step-up Rate (%)";
        calculate();
    }
    
    // --- EVENT LISTENERS ---
    const debouncedCalculate = debounce(calculate, 200);

    const inputsToTrack = [
        { slider: elements.sipAmountSlider, input: elements.sipAmountInput },
        { slider: elements.sipIncreaseRateSlider, input: elements.sipIncreaseRateInput },
        { slider: elements.sipIncreaseAmountSlider, input: elements.sipIncreaseAmountInput },
        { slider: elements.returnRateSlider, input: elements.returnRateInput },
        { slider: elements.investmentPeriodSlider, input: elements.investmentPeriodInput },
        { slider: elements.inflationRateSlider, input: elements.inflationRateInput }
    ];

    inputsToTrack.forEach(({ slider, input }) => {
        if (!slider || !input) return; // Skip if elements don't exist
        const update = () => { updateSliderFill(slider); debouncedCalculate(); };
        
        slider.addEventListener('input', () => { 
            input.value = slider.value; 
            update(); 
        });
        input.addEventListener('input', () => { 
            // Basic validation to prevent non-numeric input issues
            const numericValue = input.value.replace(/[^0-9.]/g, ''); 
            if (input.value !== numericValue) {
                input.value = numericValue;
            }
            // Sync slider if value is valid number within range
            const val = parseFloat(numericValue);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            if (!isNaN(val) && val >= min && val <= max) {
                 slider.value = val;
            } else if (!isNaN(val) && val < min) {
                slider.value = min; // Clamp to min
            } else if (!isNaN(val) && val > max) {
                slider.value = max; // Clamp to max
            }
             update(); 
        });
        input.addEventListener('blur', () => {
             let value = parseFloat(input.value) || parseFloat(slider.min) || 0; // Fallback to min or 0
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const step = parseFloat(slider.step) || 1;
            
            // Clamp value within min/max and round to nearest step
             value = Math.max(min, Math.min(max, Math.round(value / step) * step)); 
            
             input.value = value; // Update input field first
            slider.value = value; // Then sync slider
            update();
        });
    });
   
    if (elements.inflationToggle) {
        elements.inflationToggle.addEventListener('change', () => {
            // Ensure related elements exist
            if (!elements.inflationRateContainer) return; 
            
            const inflationCard = elements.inflationToggle.closest('.input-card');
            const isChecked = elements.inflationToggle.checked;
            elements.inflationRateContainer.classList.toggle('hidden', !isChecked);
            if(inflationCard) inflationCard.classList.toggle('input-card-accent', isChecked);
            calculate();
        });
    }

    if (elements.stepUpToggle) {
        elements.stepUpToggle.addEventListener('click', () => {
            isStepUpAmount = !isStepUpAmount;
            elements.stepUpToggle.classList.toggle('active', isStepUpAmount);
            elements.stepUpToggle.setAttribute('aria-checked', String(isStepUpAmount)); // Ensure boolean is string
            updateInputsVisibility();
        });
        
        elements.stepUpToggle.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') { 
                e.preventDefault(); 
                elements.stepUpToggle.click(); 
            }
        });
    }
   
    if (elements.toggleTableBtn && elements.growthTableContainer) { // Check both exist
        elements.toggleTableBtn.addEventListener('click', () => {
            const isHidden = elements.growthTableContainer.classList.toggle('hidden');
            elements.toggleTableBtn.textContent = isHidden ? 'Show Yearly Growth' : 'Hide Yearly Growth';
             // Scroll to table if showing it and it's off-screen
            if (!isHidden && elements.growthTableContainer.getBoundingClientRect().top > window.innerHeight) {
                 elements.growthTableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    document.querySelectorAll('.faq-question-button').forEach(button => {
        button.addEventListener('click', () => {
            const answerId = button.getAttribute('aria-controls');
            if (!answerId) return;
            const answer = document.getElementById(answerId);
            if (!answer) return;

            const isOpening = button.getAttribute('aria-expanded') === 'false';
            
            // Close other FAQ items first
            document.querySelectorAll('.faq-question-button').forEach(btn => {
                if (btn !== button) {
                    btn.setAttribute('aria-expanded', 'false');
                    const otherAnswerId = btn.getAttribute('aria-controls');
                    if (otherAnswerId) {
                         const otherAnswer = document.getElementById(otherAnswerId);
                         if (otherAnswer) otherAnswer.style.maxHeight = null;
                    }
                    const svg = btn.querySelector('svg');
                    if (svg) svg.style.transform = 'rotate(0deg)';
                }
            });

            // Toggle the clicked item
            button.setAttribute('aria-expanded', String(isOpening)); // Ensure boolean is string
            answer.style.maxHeight = isOpening ? answer.scrollHeight + 'px' : null;
            const svg = button.querySelector('svg');
             if (svg) svg.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });
    
    if (elements.copyLinkBtn && elements.copyLinkDefaultIcon && elements.copyLinkSuccessIcon) { // Check elements exist
        elements.copyLinkBtn.addEventListener('click', () => {
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href; 
            textArea.style.position = "fixed"; // Keep off-screen
            textArea.style.top = "-9999px";
            textArea.style.left = "-9999px";
            
            document.body.appendChild(textArea);
            textArea.select(); // Select the text

            try {
                // Use execCommand as a fallback for potential iframe issues
                const successful = document.execCommand('copy'); 
                if (successful) {
                    elements.copyLinkDefaultIcon.classList.add('hidden');
                    elements.copyLinkSuccessIcon.classList.remove('hidden');
                    setTimeout(() => {
                        elements.copyLinkDefaultIcon.classList.remove('hidden');
                        elements.copyLinkSuccessIcon.classList.add('hidden');
                    }, 2000);
                } else {
                     console.error('Copy command was unsuccessful');
                     // Optionally show a failure message to the user here
                }
            } catch (err) {
                console.error('Fallback: Error copying text', err);
                 // Optionally show a failure message to the user here
            } finally {
                document.body.removeChild(textArea); // Clean up the element
            }
        });
    }

    // --- URL STATE FUNCTIONS (Simplified) ---
    function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        let needsRecalculate = false; // Flag to check if calculation needed after loading

        // Helper to set value safely
        const setValue = (param, inputElem, sliderElem) => {
            if (params.has(param) && inputElem && sliderElem) {
                const value = parseFloat(params.get(param));
                const min = parseFloat(sliderElem.min);
                const max = parseFloat(sliderElem.max);
                // Validate and clamp the value from URL
                if (!isNaN(value)) {
                    const clampedValue = Math.max(min, Math.min(max, value));
                    inputElem.value = clampedValue;
                    sliderElem.value = clampedValue;
                    updateSliderFill(sliderElem);
                    needsRecalculate = true; // Mark that state was loaded
                }
            }
        };

        // Set values from URL
        setValue('sip', elements.sipAmountInput, elements.sipAmountSlider);
        setValue('returns', elements.returnRateInput, elements.returnRateSlider);
        setValue('period', elements.investmentPeriodInput, elements.investmentPeriodSlider);
        
        // Handle Step-Up (ensure elements exist)
        if (elements.stepUpToggle && elements.sipIncreaseRateInput && elements.sipIncreaseRateSlider && elements.sipIncreaseAmountInput && elements.sipIncreaseAmountSlider) {
            const stepUpMode = params.get('stepUpMode');
            if (stepUpMode === 'rate') {
                isStepUpAmount = false;
                elements.stepUpToggle.classList.remove('active');
                setValue('stepUp', elements.sipIncreaseRateInput, elements.sipIncreaseRateSlider);
            } else {
                isStepUpAmount = true;
                elements.stepUpToggle.classList.add('active');
                setValue('stepUp', elements.sipIncreaseAmountInput, elements.sipIncreaseAmountSlider);
            }
            elements.stepUpToggle.setAttribute('aria-checked', String(isStepUpAmount)); // Update ARIA state
            updateInputsVisibility(); // Update visibility based on loaded state (calls calculate)
            needsRecalculate = true; // Mark that state was loaded
        }

        // Handle Inflation (ensure elements exist)
        if (elements.inflationToggle && elements.inflationRateContainer) {
            if (params.get('inflation') === 'true') {
                elements.inflationToggle.checked = true;
                setValue('inflationRate', elements.inflationRateInput, elements.inflationRateSlider);
                elements.inflationRateContainer.classList.remove('hidden');
                const inflationCard = elements.inflationToggle.closest('.input-card');
                if (inflationCard) inflationCard.classList.add('input-card-accent');
            } else {
                elements.inflationToggle.checked = false; // Explicitly uncheck if not 'true'
                elements.inflationRateContainer.classList.add('hidden');
                 const inflationCard = elements.inflationToggle.closest('.input-card');
                 if (inflationCard) inflationCard.classList.remove('input-card-accent');
            }
             needsRecalculate = true; // Mark that state was loaded
        }
        
         // If state was loaded via URL params, recalculate. Otherwise, calculate runs in Initialization.
        // Note: updateInputsVisibility already calls calculate, so this might be redundant if step-up params were present.
        // It's safer to leave it to ensure calculation happens if *only* other params (like sip, inflation) were present.
        if (needsRecalculate) {
           calculate();
        }
    }

    function updateURLParameters() {
         // Prevent errors if essential elements are missing
        if (!elements.sipAmountInput || !elements.investmentPeriodInput || !elements.returnRateInput || !elements.inflationToggle || !elements.sipIncreaseAmountInput || !elements.sipIncreaseRateInput) {
             return; 
        }

        const params = new URLSearchParams();
        
        params.set('sip', elements.sipAmountInput.value);
        params.set('period', elements.investmentPeriodInput.value);
        
        if (isStepUpAmount) {
            params.set('stepUpMode', 'amount');
            params.set('stepUp', elements.sipIncreaseAmountInput.value);
        } else {
            params.set('stepUpMode', 'rate');
            params.set('stepUp', elements.sipIncreaseRateInput.value);
        }
        
        params.set('returns', elements.returnRateInput.value);
        
        if (elements.inflationToggle.checked) {
            params.set('inflation', 'true');
             if(elements.inflationRateInput) params.set('inflationRate', elements.inflationRateInput.value);
        } else {
            params.set('inflation', 'false');
        }

        // Use replaceState to avoid cluttering browser history on every slider move
        // Check if params actually changed to avoid unnecessary history entries
        const currentSearch = window.location.search;
        const newSearch = `?${params.toString()}`;
        
        if (currentSearch !== newSearch) {
            const newUrl = `${window.location.pathname}${newSearch}`;
            try {
                history.replaceState(null, '', newUrl);
                updateShareLinks(newUrl); // Update share links only when URL changes
            } catch (e) {
                // Handle potential security errors in sandboxed environments
                 console.error("Could not update URL using replaceState:", e);
            }
        }
    }

    function updateShareLinks(url) {
        const shareUrl = new URL(url, window.location.origin).href;
        const shareTitle = "Check out this awesome SIP Calculator with Inflation!";
        // Check if elements exist before setting href
        if (elements.shareWhatsappBtn) elements.shareWhatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
        if (elements.shareFacebookBtn) elements.shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        if (elements.shareTelegramBtn) elements.shareTelegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        if (elements.shareTwitterBtn) elements.shareTwitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
    }

    // --- INITIALIZATION ---
    loadStateFromURL(); // Load URL params first to set the initial state. This calls calculate() if params exist.
    
    // If no URL parameters were present, run a default calculation.
    if (!window.location.search) {
        calculate(); 
    }

    updateShareLinks(window.location.href); // Set initial share links based on the final URL state.
    document.querySelectorAll('.range-slider').forEach(updateSliderFill); // Style initial sliders
    if(elements.copyrightYear) {
        elements.copyrightYear.textContent = new Date().getFullYear(); // Set copyright year
    }
});
