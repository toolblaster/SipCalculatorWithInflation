document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);

    // --- DOM ELEMENT SELECTORS (Cached for performance) ---
    // Reduced to only "Calculate Wealth" mode
    const elements = {
        sipAmountSlider: getElem('sip-amount-slider'),
        sipAmountInput: getElem('sip-amount-input'),
        // NEW Lumpsum elements
        lumpsumToggle: getElem('lumpsum-toggle'),
        lumpsumToggleCard: getElem('lumpsum-toggle-card'),
        lumpsumContainer: getElem('lumpsum-container'),
        lumpsumAmountSlider: getElem('lumpsum-amount-slider'),
        lumpsumAmountInput: getElem('lumpsum-amount-input'),
        // END NEW
        sipIncreaseRateSlider: getElem('sip-increase-rate-slider'),
        sipIncreaseRateInput: getElem('sip-increase-rate-input'),
        sipIncreaseAmountSlider: getElem('sip-increase-amount-slider'),
        sipIncreaseAmountInput: getElem('sip-increase-amount-input'),
        returnRateSlider: getElem('return-rate-slider'),
        returnRateInput: getElem('return-rate-input'),
        investmentPeriodSlider: getElem('investment-period-slider'),
        investmentPeriodInput: getElem('investment-period-input'),
        inflationToggle: getElem('inflation-toggle'),
        inflationRateContainer: getElem('inflation-rate-container'),
        inflationRateSlider: getElem('inflation-rate-slider'),
        inflationRateInput: getElem('inflation-rate-input'),
        stepUpToggle: getElem('step-up-toggle'),
        stepUpLabel: getElem('step-up-label'),
        stepUpRateContainer: getElem('step-up-rate-container'),
        stepUpAmountContainer: getElem('step-up-amount-container'),
        investedAmountElem: getElem('invested-amount'),
        totalReturnsElem: getElem('total-returns'),
        finalValueElem: getElem('final-value'),
        realValueContainer: getElem('real-value-container'),
        realValueElem: getElem('real-value'),
        growthTableContainer: getElem('growth-table-container'),
        growthTableBody: getElem('growth-table-body'),
        growthCardsContainer: getElem('growth-cards-container'), // <-- Container for mobile cards
        toggleTableBtn: getElem('toggle-table-btn'),
        // NEW: Line Chart Elements
        toggleLineChartBtn: getElem('toggle-line-chart-btn'),
        lineChartContainer: getElem('line-chart-container'),
        lineChartCanvas: getElem('growth-line-chart'),
        // END NEW
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
    // NEW: Line Chart Context
    const lineChartCtx = elements.lineChartCanvas ? elements.lineChartCanvas.getContext('2d') : null;

    // --- STATE MANAGEMENT ---
    let investmentChart;
    let growthLineChart; // NEW: Line chart instance
    let isStepUpAmount = true;
    let isUserInteraction = false; // Flag to track if user has interacted
    
    // NEW: Map to link input IDs to their sliders for stepper buttons
    const inputSliderMap = {
        'sip-amount-input': elements.sipAmountSlider,
        'lumpsum-amount-input': elements.lumpsumAmountSlider, // NEW
        'sip-increase-rate-input': elements.sipIncreaseRateSlider,
        'sip-increase-amount-input': elements.sipIncreaseAmountSlider,
        'return-rate-input': elements.returnRateSlider,
        'investment-period-input': elements.investmentPeriodSlider,
        'inflation-rate-input': elements.inflationRateSlider
    };

    // --- UTILITY FUNCTIONS ---
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(num));
    
    // NEW: Utility to get step precision
    const getStepPrecision = (step) => {
        if (Math.floor(step) === step) return 0;
        return step.toString().split('.')[1]?.length || 0;
    };
    
    const updateSliderFill = (slider) => {
        if (!slider) return;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--fill-percentage', `${percentage}%`);
    };

    // --- CORE CALCULATION LOGIC ---
    // Simplified to only call calculateWealth
    function calculate() {
        calculateWealth();
    }
    
    function calculateWealth() {
        // Ensure all elements exist before trying to read values
        const monthlySipAmount = parseFloat(elements.sipAmountInput?.value || 0);
        // NEW: Lumpsum values
        const isLumpsumOn = elements.lumpsumToggle?.checked;
        const initialLumpsum = isLumpsumOn ? parseFloat(elements.lumpsumAmountInput?.value || 0) : 0;
        // END NEW
        const annualReturnRate = parseFloat(elements.returnRateInput?.value || 0) / 100;
        const investmentPeriodYears = parseInt(elements.investmentPeriodInput?.value || 0);
        const isInflationOn = elements.inflationToggle?.checked;
        const annualInflationRate = isInflationOn ? parseFloat(elements.inflationRateInput?.value || 0) / 100 : 0;
        const stepUpValue = isStepUpAmount 
            ? parseFloat(elements.sipIncreaseAmountInput?.value || 0) 
            : parseFloat(elements.sipIncreaseRateInput?.value || 0) / 100;

        let totalInvested = initialLumpsum; // Start with lumpsum
        let sipValue = 0; // Value from SIPs
        let lumpsumValue = initialLumpsum; // Value from Lumpsum
        let currentMonthlySip = monthlySipAmount;
        const monthlyRate = annualReturnRate / 12;
        const yearlyGrowthData = [];
        const maxYears = 100; // Safety cap
        
        // Ensure investmentPeriodYears is a valid number and not excessive
        const actualYears = Math.min(investmentPeriodYears, maxYears);

        for (let year = 1; year <= actualYears; year++) {
            let yearlyInvested = 0;
            let yearlySipValue = sipValue; // Start with the SIP value from the previous year
            let yearlyLumpsumValue = lumpsumValue; // Start with the Lumpsum value from the previous year
            
            for (let month = 1; month <= 12; month++) {
                yearlySipValue = yearlySipValue * (1 + monthlyRate) + currentMonthlySip;
                yearlyLumpsumValue = yearlyLumpsumValue * (1 + monthlyRate); // Compound lumpsum monthly
                yearlyInvested += currentMonthlySip;
            }
            
            totalInvested += yearlyInvested; // Add this year's investment to the cumulative total
            sipValue = yearlySipValue; // Update cumulative SIP value
            lumpsumValue = yearlyLumpsumValue; // Update cumulative Lumpsum value
            
            const finalValue = sipValue + lumpsumValue; // Total value is sum of both
            
            // NEW: Calculate real value for this specific year
            const currentRealValue = finalValue / Math.pow(1 + annualInflationRate, year);
            
            yearlyGrowthData.push({
                year: year,
                invested: totalInvested, // Cumulative invested
                returns: finalValue - totalInvested, // Cumulative returns
                total: finalValue,
                realValue: currentRealValue // NEW: Add real value to data
            });

            // Apply step-up for the *next* year
            if (isStepUpAmount) {
                currentMonthlySip += stepUpValue;
            } else {
                currentMonthlySip *= (1 + stepUpValue);
            }
        }

        const finalValue = sipValue + lumpsumValue; // Final total value
        const totalReturns = finalValue - totalInvested;
        
        // Update DOM elements (with checks)
        if (elements.investedAmountElem) elements.investedAmountElem.textContent = formatCurrency(totalInvested);
        if (elements.totalReturnsElem) elements.totalReturnsElem.textContent = formatCurrency(totalReturns);
        if (elements.finalValueElem) elements.finalValueElem.textContent = formatCurrency(finalValue);

        if (isInflationOn && elements.realValueContainer) {
            const realValue = finalValue / Math.pow(1 + annualInflationRate, actualYears);
            if (elements.realValueElem) elements.realValueElem.textContent = formatCurrency(realValue);
            elements.realValueContainer.classList.remove('hidden');
        } else if (elements.realValueContainer) {
            elements.realValueContainer.classList.add('hidden');
        }

        // Updated Chart Colors: Red for Invested, Green for Returns
        updateChart([totalInvested, Math.max(0, finalValue - totalInvested)], ['Total Invested', 'Total Returns'], ['#DC2626', '#16A34A']); 
        generateGrowthTable(yearlyGrowthData); // <-- Call updated function
        updateLineChart(yearlyGrowthData); // <-- NEW: Call line chart update
        
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
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }, 
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` } } 
            },
            cutout: '70%'
        };
        
        if (investmentChart) {
            investmentChart.data = chartData;
            investmentChart.options = chartOptions;
            investmentChart.update();
        } else {
             if (typeof Chart !== 'undefined') {
                investmentChart = new Chart(chartCtx, { type: 'doughnut', data: chartData, options: chartOptions });
            } else {
                console.error("Chart.js not loaded yet for doughnut chart.");
            }
        }
    }
   
    // --- NEW: Line Chart Update Function ---
    function updateLineChart(data) {
        if (!lineChartCtx) return; // Don't proceed if canvas context is not available

        const isInflationOn = elements.inflationToggle.checked;

        // Prepare data
        const labels = data.map(row => row.year);
        const investedData = data.map(row => row.invested);
        const futureValueData = data.map(row => row.total);
        const realValueData = data.map(row => row.realValue);

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Total Invested',
                    data: investedData,
                    borderColor: '#DC2626', // Red
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Future Value (Nominal)',
                    data: futureValueData,
                    borderColor: '#2563EB', // Blue
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: "Real Value (Today's Worth)",
                    data: realValueData,
                    borderColor: '#16A34A', // Green
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: false,
                    tension: 0.1,
                    hidden: !isInflationOn // Hide if inflation is off
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                tooltip: { 
                    mode: 'index', 
                    intersect: false,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Years' }
                },
                y: {
                    title: { display: true, text: 'Value (₹)' },
                    ticks: {
                        // Format Y-axis ticks as currency
                        callback: (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 0 }).format(value)
                    }
                }
            }
        };

        if (growthLineChart) {
            growthLineChart.data = chartData;
            growthLineChart.options = chartOptions;
            growthLineChart.update();
        } else {
            if (typeof Chart !== 'undefined') {
                growthLineChart = new Chart(lineChartCtx, {
                    type: 'line',
                    data: chartData,
                    options: chartOptions
                });
            } else {
                console.error("Chart.js not loaded yet for line chart.");
            }
        }
    }

    // --- MODIFIED: generateGrowthTable to output both table rows and cards ---
    function generateGrowthTable(data) {
        if (!elements.growthTableBody || !elements.growthCardsContainer) return;

        // 1. Generate Table Rows
        const tableHtml = data.map(row => `
            <tr class="hover:bg-gray-100 transition-colors">
                <td class="px-2 py-1 whitespace-nowrap text-xxs">${row.year}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-xxs">${formatCurrency(row.invested)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-green-700 font-semibold text-xxs">${formatCurrency(row.returns)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right font-bold text-xxs">${formatCurrency(row.total)}</td>
            </tr>
        `).join('');
        elements.growthTableBody.innerHTML = tableHtml;

        // 2. Generate Mobile Cards
        const cardHtml = data.map(row => `
            <div class="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-blue-700">Year ${row.year}</span>
                    <span class="text-sm font-bold text-gray-800">${formatCurrency(row.total)}</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xxs">
                    <div class="bg-gray-50 p-1.5 rounded">
                        <p class="text-gray-500">Invested</p>
                        <p class="font-semibold text-gray-700">${formatCurrency(row.invested)}</p>
                    </div>
                    <div class="bg-green-50 p-1.5 rounded">
                        <p class="text-gray-500">Returns</p>
                        <p class="font-semibold text-green-700">${formatCurrency(row.returns)}</p>
                    </div>
                </div>
            </div>
        `).join('');
        elements.growthCardsContainer.innerHTML = cardHtml;
    }

    function updateInputsVisibility() {
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
        { slider: elements.lumpsumAmountSlider, input: elements.lumpsumAmountInput }, // NEW
        { slider: elements.sipIncreaseRateSlider, input: elements.sipIncreaseRateInput },
        { slider: elements.sipIncreaseAmountSlider, input: elements.sipIncreaseAmountInput },
        { slider: elements.returnRateSlider, input: elements.returnRateInput },
        { slider: elements.investmentPeriodSlider, input: elements.investmentPeriodInput },
        { slider: elements.inflationRateSlider, input: elements.inflationRateInput }
    ];

    inputsToTrack.forEach(({ slider, input }) => {
        if (!slider || !input) return;
        const update = () => { updateSliderFill(slider); debouncedCalculate(); };
        
        // Mark as user interaction on input events
        slider.addEventListener('input', () => { 
            isUserInteraction = true; 
            input.value = slider.value; 
            update(); 
        });
        
        input.addEventListener('input', () => { 
            isUserInteraction = true; 
            // Only sync slider if the value is within range, otherwise slider breaks
            const val = parseFloat(input.value);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            if (val >= min && val <= max) {
                 slider.value = input.value; 
            }
            update(); 
        });
        
        // UPDATED: Blur event logic using new precision function
        input.addEventListener('blur', () => {
            isUserInteraction = true;
            let value = parseFloat(input.value) || 0;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const step = parseFloat(slider.step) || 1;
            
            value = Math.max(min, Math.min(max, value)); // Clamp
            
            const precision = getStepPrecision(step);
            const snappedValue = parseFloat((Math.round(value / step) * step).toFixed(precision));
            
            input.value = snappedValue.toFixed(precision); // Apply precision
            
            if (slider.value !== String(snappedValue)) {
                slider.value = snappedValue;
            }
            update();
        });
    });
   
    // NEW: Event listener for all stepper buttons
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.stepper-btn');
        if (!target) return;
        
        isUserInteraction = true; // Mark as interaction

        const inputId = target.dataset.input;
        const action = target.dataset.action;
        const inputElem = getElem(inputId);
        const sliderElem = inputSliderMap[inputId];

        if (!inputElem || !sliderElem) return;

        const step = parseFloat(sliderElem.step) || 1;
        const min = parseFloat(sliderElem.min);
        const max = parseFloat(sliderElem.max);
        const currentValue = parseFloat(inputElem.value) || 0;
        const precision = getStepPrecision(step);

        let newValue;
        if (action === 'increase') {
            newValue = Math.min(max, currentValue + step);
        } else {
            newValue = Math.max(min, currentValue - step);
        }

        const formattedValue = newValue.toFixed(precision);
        inputElem.value = formattedValue;
        sliderElem.value = formattedValue;

        updateSliderFill(sliderElem);
        debouncedCalculate();
    });
   
    if (elements.inflationToggle) {
        elements.inflationToggle.addEventListener('change', () => {
            isUserInteraction = true; // Mark interaction
            const inflationCard = elements.inflationToggle.closest('.input-card');
            const isChecked = elements.inflationToggle.checked;
            if (elements.inflationRateContainer) {
                elements.inflationRateContainer.classList.toggle('hidden', !isChecked);
            }
            if(inflationCard) {
                inflationCard.classList.toggle('input-card-accent', isChecked);
            }
            calculate();
        });
    }

    // NEW: Lumpsum Toggle Event Listener
    if (elements.lumpsumToggle) {
        elements.lumpsumToggle.addEventListener('change', () => {
            isUserInteraction = true; // Mark interaction
            const isChecked = elements.lumpsumToggle.checked;
            if (elements.lumpsumContainer) {
                elements.lumpsumContainer.classList.toggle('hidden', !isChecked);
            }
            if(elements.lumpsumToggleCard) {
                elements.lumpsumToggleCard.classList.toggle('input-card-accent', isChecked);
            }
            calculate();
        });
    }

    if (elements.stepUpToggle) {
        elements.stepUpToggle.addEventListener('click', () => {
            isUserInteraction = true; // Mark interaction
            isStepUpAmount = !isStepUpAmount;
            elements.stepUpToggle.classList.toggle('active', isStepUpAmount);
            elements.stepUpToggle.setAttribute('aria-checked', isStepUpAmount.toString());
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
            
            // NEW: Hide line chart if showing table
            if (!isHidden && elements.lineChartContainer) {
                elements.lineChartContainer.classList.add('hidden');
                elements.toggleLineChartBtn.textContent = 'Show Growth Chart';
            }

             // Scroll to table if showing it and it's off-screen
            if (!isHidden && elements.growthTableContainer.getBoundingClientRect().top > window.innerHeight) {
                 elements.growthTableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- NEW: Event listener for Line Chart Toggle ---
    if (elements.toggleLineChartBtn && elements.lineChartContainer) {
        elements.toggleLineChartBtn.addEventListener('click', () => {
            const isHidden = elements.lineChartContainer.classList.toggle('hidden');
            elements.toggleLineChartBtn.textContent = isHidden ? 'Show Growth Chart' : 'Hide Growth Chart';

            // NEW: Hide table if showing line chart
            if (!isHidden && elements.growthTableContainer) {
                elements.growthTableContainer.classList.add('hidden');
                elements.toggleTableBtn.textContent = 'Show Yearly Growth';
            }

            // Scroll to chart if showing it and it's off-screen
            if (!isHidden && elements.lineChartContainer.getBoundingClientRect().top > window.innerHeight) {
                 elements.lineChartContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    document.querySelectorAll('.faq-question-button').forEach(button => {
        button.addEventListener('click', () => {
            const answer = document.getElementById(button.getAttribute('aria-controls'));
            if (!answer) return;
            const isOpening = button.getAttribute('aria-expanded') === 'false';
            
            // Close all others
            document.querySelectorAll('.faq-question-button').forEach(btn => {
                if (btn !== button) {
                    btn.setAttribute('aria-expanded', 'false');
                    const otherAnswer = document.getElementById(btn.getAttribute('aria-controls'));
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                    const svg = btn.querySelector('svg');
                    if (svg) svg.style.transform = 'rotate(0deg)';
                }
            });

            // Open/close the clicked one
            button.setAttribute('aria-expanded', isOpening.toString());
            answer.style.maxHeight = isOpening ? answer.scrollHeight + 'px' : null;
            const svg = button.querySelector('svg');
            if (svg) svg.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    // --- Share links ---
    const shareButtons = [
        elements.shareWhatsappBtn,
        elements.shareFacebookBtn,
        elements.shareTelegramBtn,
        elements.shareTwitterBtn
    ];
    // Add event listeners to update hrefs just before click (for dynamic URL)
    shareButtons.forEach(btn => {
        if(btn) {
            btn.addEventListener('click', (e) => {
                // Prevent default navigation
                e.preventDefault(); 
                // Update share links with the *current* URL params
                updateShareLinks(window.location.href); 
                // Open the new URL
                if(btn.href) {
                    window.open(btn.href, '_blank', 'noopener,noreferrer');
                }
            });
        }
    });
    
    if (elements.copyLinkBtn) {
        elements.copyLinkBtn.addEventListener('click', () => {
            const textArea = document.createElement('textarea');
            
            // UPDATED: Clean URL to remove query parameters for copying
            const cleanUrl = updateShareLinks(window.location.href);
            textArea.value = cleanUrl; 
            
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful && elements.copyLinkDefaultIcon && elements.copyLinkSuccessIcon) {
                    elements.copyLinkDefaultIcon.classList.add('hidden');
                    elements.copyLinkSuccessIcon.classList.remove('hidden');
                    setTimeout(() => {
                        elements.copyLinkDefaultIcon.classList.remove('hidden');
                        elements.copyLinkSuccessIcon.classList.add('hidden');
                    }, 2000);
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }

            document.body.removeChild(textArea);
        });
    }

    // --- URL STATE FUNCTIONS (Simplified) ---
    function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        let needsRecalculate = false;

        // Helper to set value for slider and input
        const setValue = (param, inputElem, sliderElem) => {
            if (params.has(param)) {
                let value = parseFloat(params.get(param));
                if (!isNaN(value) && inputElem && sliderElem) {
                    const min = parseFloat(sliderElem.min);
                    const max = parseFloat(sliderElem.max);
                    value = Math.max(min, Math.min(max, value)); // Clamp value
                    
                    const precision = getStepPrecision(parseFloat(sliderElem.step));
                    const formattedValue = value.toFixed(precision);

                    inputElem.value = formattedValue;
                    sliderElem.value = formattedValue;
                    updateSliderFill(sliderElem);
                    needsRecalculate = true;
                }
            }
        };

        // Set values
        setValue('sip', elements.sipAmountInput, elements.sipAmountSlider);
        setValue('returns', elements.returnRateInput, elements.returnRateSlider);
        setValue('period', elements.investmentPeriodInput, elements.investmentPeriodSlider);
        
        // NEW: Handle Lumpsum
        if (params.get('lumpsumOn') === 'true') {
            if (elements.lumpsumToggle) elements.lumpsumToggle.checked = true;
            setValue('lumpsum', elements.lumpsumAmountInput, elements.lumpsumAmountSlider);
            
            if (elements.lumpsumContainer) elements.lumpsumContainer.classList.remove('hidden');
            if (elements.lumpsumToggleCard) elements.lumpsumToggleCard.classList.add('input-card-accent');
        } else {
            if (elements.lumpsumToggle) elements.lumpsumToggle.checked = false;
            if (elements.lumpsumContainer) elements.lumpsumContainer.classList.add('hidden');
            if (elements.lumpsumToggleCard) elements.lumpsumToggleCard.classList.remove('input-card-accent');
        }
        // If 'lumpsumOn' is present, we should recalculate
        if (params.has('lumpsumOn')) needsRecalculate = true;
        // END NEW
        
        // Handle Step-Up
        const stepUpMode = params.get('stepUpMode');
        if (stepUpMode === 'rate') {
            isStepUpAmount = false;
            if (elements.stepUpToggle) elements.stepUpToggle.classList.remove('active');
            setValue('stepUp', elements.sipIncreaseRateInput, elements.sipIncreaseRateSlider);
        } else if (stepUpMode === 'amount') {
            // Default to amount mode
            isStepUpAmount = true;
            if (elements.stepUpToggle) elements.stepUpToggle.classList.add('active');
            setValue('stepUp', elements.sipIncreaseAmountInput, elements.sipIncreaseAmountSlider);
        }
        
        if (elements.stepUpToggle) {
            elements.stepUpToggle.setAttribute('aria-checked', isStepUpAmount.toString());
            if (elements.stepUpRateContainer) elements.stepUpRateContainer.classList.toggle('hidden', isStepUpAmount);
            if (elements.stepUpAmountContainer) elements.stepUpAmountContainer.classList.toggle('hidden', !isStepUpAmount);
            if (elements.stepUpLabel) elements.stepUpLabel.textContent = isStepUpAmount ? "Annual Step-up Amount (₹)" : "Annual Step-up Rate (%)";
        }
        if (params.has('stepUpMode')) needsRecalculate = true; 

        // Handle Inflation
        if (params.get('inflation') === 'true') {
            if (elements.inflationToggle) elements.inflationToggle.checked = true;
            setValue('inflationRate', elements.inflationRateInput, elements.inflationRateSlider);
            
            if (elements.inflationRateContainer) elements.inflationRateContainer.classList.remove('hidden');
            const inflationCard = elements.inflationToggle?.closest('.input-card');
            if(inflationCard) inflationCard.classList.add('input-card-accent');
        } else if (params.get('inflation') === 'false') {
            if (elements.inflationToggle) elements.inflationToggle.checked = false;
            if (elements.inflationRateContainer) elements.inflationRateContainer.classList.add('hidden');
            const inflationCard = elements.inflationToggle?.closest('.input-card');
            if(inflationCard) inflationCard.classList.remove('input-card-accent');
        }
        if (params.has('inflation')) needsRecalculate = true;

        if (needsRecalculate) {
            calculate();
        }
    }

    function updateURLParameters() {
        // --- NEW: Guard Clause ---
        // If user hasn't interacted AND there are no existing params, don't update URL.
        // This keeps the URL clean on first load unless we are normalizing existing params.
        const currentSearch = window.location.search;
        const hasExistingParams = currentSearch && currentSearch.length > 1; // >1 to account for just '?'

        if (!isUserInteraction && !hasExistingParams) {
            return;
        }
        // --- End Guard Clause ---

        const params = new URLSearchParams();
        
        // Only set params if elements exist
        if (elements.sipAmountInput) params.set('sip', elements.sipAmountInput.value);
        if (elements.investmentPeriodInput) params.set('period', elements.investmentPeriodInput.value);
        
        // NEW: Lumpsum params
        if (elements.lumpsumToggle?.checked) {
            params.set('lumpsumOn', 'true');
            if (elements.lumpsumAmountInput) params.set('lumpsum', elements.lumpsumAmountInput.value);
        } else {
            params.set('lumpsumOn', 'false');
        }
        // END NEW
        
        if (isStepUpAmount) {
            params.set('stepUpMode', 'amount');
            if (elements.sipIncreaseAmountInput) params.set('stepUp', elements.sipIncreaseAmountInput.value);
        } else {
            params.set('stepUpMode', 'rate');
            if (elements.sipIncreaseRateInput) params.set('stepUp', elements.sipIncreaseRateInput.value);
        }
        
        if (elements.returnRateInput) params.set('returns', elements.returnRateInput.value);
        
        if (elements.inflationToggle?.checked) {
            params.set('inflation', 'true');
            if (elements.inflationRateInput) params.set('inflationRate', elements.inflationRateInput.value);
        } else {
            params.set('inflation', 'false');
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        if (window.location.href !== newUrl) {
            history.replaceState(null, '', newUrl);
        }
    }

    // Function to update share links (called by URL update and share clicks)
    function updateShareLinks(url) {
        // UPDATED: Clean URL to remove query parameters for sharing/copying
        const urlObj = new URL(url, window.location.origin);
        const cleanUrl = urlObj.origin + urlObj.pathname; // Only origin + path
        
        const shareTitle = "Check out this awesome SIP Calculator with Inflation!";
        
        if (elements.shareWhatsappBtn) elements.shareWhatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + cleanUrl)}`;
        if (elements.shareFacebookBtn) elements.shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}`;
        if (elements.shareTelegramBtn) elements.shareTelegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(cleanUrl)}&text=${encodeURIComponent(shareTitle)}`;
        if (elements.shareTwitterBtn) elements.shareTwitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(cleanUrl)}&text=${encodeURIComponent(shareTitle)}`;
        
        return cleanUrl; // Return clean URL for other uses like copy button
    }

    // --- INITIALIZATION ---
    loadStateFromURL(); // Load state from URL first
    
    // If no params were present, run a default calculation
    if (!new URLSearchParams(window.location.search).toString()) {
        calculate();
    }
    
    updateShareLinks(window.location.href); // Set initial share links
    
    if(elements.copyrightYear) {
        elements.copyrightYear.textContent = new Date().getFullYear();
    }
    
    // Final check to fill sliders that might have been loaded from URL
    inputsToTrack.forEach(({ slider }) => updateSliderFill(slider));
});
