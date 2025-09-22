document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);

    // --- DOM ELEMENT SELECTORS ---
    // Calculator Mode
    const modeCalculateBtn = getElem('mode-calculate');
    const modeGoalBtn = getElem('mode-goal');
    const calculateWealthInputs = getElem('calculate-wealth-inputs');
    const planGoalInputs = getElem('plan-goal-inputs');
    const standardResultSummary = getElem('standard-result-summary');
    const goalResultSummary = getElem('goal-result-summary');

    // Inputs
    const sipAmountSlider = getElem('sip-amount-slider');
    const sipAmountInput = getElem('sip-amount-input');
    const targetAmountSlider = getElem('target-amount-slider');
    const targetAmountInput = getElem('target-amount-input');
    const sipIncreaseRateSlider = getElem('sip-increase-rate-slider');
    const sipIncreaseRateInput = getElem('sip-increase-rate-input');
    const sipIncreaseAmountSlider = getElem('sip-increase-amount-slider');
    const sipIncreaseAmountInput = getElem('sip-increase-amount-input');
    const returnRateSlider = getElem('return-rate-slider');
    const returnRateInput = getElem('return-rate-input');
    const investmentPeriodSlider = getElem('investment-period-slider');
    const investmentPeriodInput = getElem('investment-period-input');
    const inflationToggle = getElem('inflation-toggle');
    const inflationRateContainer = getElem('inflation-rate-container');
    const inflationRateSlider = getElem('inflation-rate-slider');
    const inflationRateInput = getElem('inflation-rate-input');
    
    // Toggles
    const stepUpToggle = getElem('step-up-toggle');
    const stepUpLabel = getElem('step-up-label');
    const stepUpRateContainer = getElem('step-up-rate-container');
    const stepUpAmountContainer = getElem('step-up-amount-container');

    // Result Elements
    const investedAmountElem = getElem('invested-amount');
    const totalReturnsElem = getElem('total-returns');
    const finalValueElem = getElem('final-value');
    const realValueContainer = getElem('real-value-container');
    const realValueElem = getElem('real-value');
    const requiredSipAmountElem = getElem('required-sip-amount');
    
    // Table & Chart
    const growthTableContainer = getElem('growth-table-container');
    const growthTableBody = getElem('growth-table-body');
    const toggleTableBtn = getElem('toggle-table-btn');
    const chartCanvas = getElem('investment-chart');
    const chartCtx = chartCanvas.getContext('2d');

    // Sharing
    const shareWhatsappBtn = getElem('share-whatsapp');
    const shareFacebookBtn = getElem('share-facebook');
    const shareTwitterBtn = getElem('share-twitter');
    const copyLinkBtn = getElem('copy-link-btn');
    const copyLinkDefaultIcon = getElem('copy-link-default');
    const copyLinkSuccessIcon = getElem('copy-link-success');

    // --- STATE MANAGEMENT ---
    let investmentChart;
    let isStepUpAmount = true;
    let isGoalMode = false;

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
        if (isGoalMode) {
            calculateRequiredSIP();
        } else {
            calculateWealth();
        }
    }
    
    function calculateWealth() {
        const monthlySipAmount = parseFloat(sipAmountInput.value);
        const annualReturnRate = parseFloat(returnRateInput.value) / 100;
        const investmentPeriodYears = parseInt(investmentPeriodInput.value);
        const annualInflationRate = inflationToggle.checked ? parseFloat(inflationRateInput.value) / 100 : 0;
        const stepUpValue = isStepUpAmount ? parseFloat(sipIncreaseAmountInput.value) : parseFloat(sipIncreaseRateInput.value) / 100;

        let totalInvested = 0;
        let finalValue = 0;
        let currentMonthlySip = monthlySipAmount;
        const monthlyRate = annualReturnRate / 12;
        let yearlyGrowthData = [];

        for (let year = 1; year <= investmentPeriodYears; year++) {
            let yearInvested = 0;
            for (let month = 1; month <= 12; month++) {
                finalValue = finalValue * (1 + monthlyRate) + currentMonthlySip;
                yearInvested += currentMonthlySip;
            }
            totalInvested += yearInvested;
            
            if (isStepUpAmount) {
                currentMonthlySip += stepUpValue;
            } else {
                currentMonthlySip *= (1 + stepUpValue);
            }
            
            yearlyGrowthData.push({
                year: year,
                invested: totalInvested,
                returns: finalValue - totalInvested,
                total: finalValue
            });
        }

        const totalReturns = finalValue - totalInvested;
        investedAmountElem.textContent = formatCurrency(totalInvested);
        totalReturnsElem.textContent = formatCurrency(totalReturns);
        finalValueElem.textContent = formatCurrency(finalValue);

        if (inflationToggle.checked) {
            const realValue = finalValue / Math.pow(1 + annualInflationRate, investmentPeriodYears);
            realValueElem.textContent = formatCurrency(realValue);
            realValueContainer.classList.remove('hidden');
        } else {
            realValueContainer.classList.add('hidden');
        }

        updateChart([totalInvested, totalReturns], ['Total Invested', 'Total Returns'], ['#EF4444', '#22C55E']);
        generateGrowthTable(yearlyGrowthData);
    }

    function calculateRequiredSIP() {
        const targetAmount = parseFloat(targetAmountInput.value);
        const annualReturnRate = parseFloat(returnRateInput.value) / 100;
        const investmentPeriodYears = parseInt(investmentPeriodInput.value);
        const annualInflationRate = inflationToggle.checked ? parseFloat(inflationRateInput.value) / 100 : 0;
        const stepUpValue = isStepUpAmount ? parseFloat(sipIncreaseAmountInput.value) : parseFloat(sipIncreaseRateInput.value) / 100;

        // Adjust target for inflation first
        const futureTargetAmount = inflationToggle.checked ? targetAmount * Math.pow(1 + annualInflationRate, investmentPeriodYears) : targetAmount;
        
        // This logic is a bit complex, we need to find the initial SIP that results in the futureTargetAmount.
        // We can do this by calculating the future value of a "base" SIP of 1 and then scaling it.
        let baseSipFV = 0;
        let currentBaseSip = 1;
        const monthlyRate = annualReturnRate / 12;

        for (let year = 1; year <= investmentPeriodYears; year++) {
            for (let month = 1; month <= 12; month++) {
                baseSipFV = baseSipFV * (1 + monthlyRate) + currentBaseSip;
            }
            if (isStepUpAmount) {
                // For amount step-up, the step-up value itself needs to be scaled relative to the base SIP of 1. This is tricky.
                // A simpler approach for the user is to disable amount-based step-up in goal mode, but let's try to calculate it.
                // A step-up of X on a base SIP of 1 is not meaningful.
                // Let's assume the step-up amount is also a factor we need to solve for, relative to the initial SIP. 
                // This becomes a non-linear problem.
                // The most robust way is to perform a binary search or iterative approximation to find the required SIP.
                
                // Iterative Approach:
                let lowSip = 0;
                let highSip = futureTargetAmount; // A safe upper bound
                let requiredSip = highSip;
                
                for(let i = 0; i < 100; i++) { // 100 iterations for precision
                    let midSip = (lowSip + highSip) / 2;
                    let calculatedFv = getFutureValue(midSip, annualReturnRate, investmentPeriodYears, isStepUpAmount, stepUpValue);
                    
                    if (calculatedFv > futureTargetAmount) {
                        highSip = midSip;
                        requiredSip = midSip;
                    } else {
                        lowSip = midSip;
                    }
                }
                
                requiredSipAmountElem.textContent = formatCurrency(requiredSip);

            } else { // Percentage-based step-up is straightforward
                if (isStepUpAmount) {
                     // This case is complex, let's just show an estimate or a message
                    requiredSipAmountElem.textContent = "N/A with amount step-up";
                    return;
                }
                
                // Re-calculate the base FV for percentage step-up
                baseSipFV = 0;
                currentBaseSip = 1;
                for (let year = 1; year <= investmentPeriodYears; year++) {
                    for (let month = 1; month <= 12; month++) {
                        baseSipFV = baseSipFV * (1 + monthlyRate) + currentBaseSip;
                    }
                    currentBaseSip *= (1 + stepUpValue);
                }

                if (baseSipFV === 0) {
                     requiredSipAmountElem.textContent = formatCurrency(0);
                     return;
                }
                
                const requiredInitialSip = futureTargetAmount / baseSipFV;
                requiredSipAmountElem.textContent = formatCurrency(requiredInitialSip);
            }
        
        }
    }
    
    // Helper for goal calculation
    function getFutureValue(initialSip, annualReturnRate, years, isAmountStep, stepValue) {
        let fv = 0;
        let currentSip = initialSip;
        const monthlyRate = annualReturnRate / 12;

        for (let y = 0; y < years; y++) {
            for (let m = 0; m < 12; m++) {
                fv = fv * (1 + monthlyRate) + currentSip;
            }
            if (isAmountStep) {
                currentSip += stepValue;
            } else {
                currentSip *= (1 + stepValue);
            }
        }
        return fv;
    }


    // --- UI UPDATE FUNCTIONS ---
    function updateChart(data, labels, colors) {
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
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${formatCurrency(context.parsed)}`
                    }
                }
            },
            cutout: '70%'
        };
        if (investmentChart) {
            investmentChart.data = chartData;
            investmentChart.options = chartOptions;
            investmentChart.update();
        } else {
            investmentChart = new Chart(chartCtx, {
                type: 'doughnut',
                data: chartData,
                options: chartOptions
            });
        }
    }
   
    function generateGrowthTable(data) {
        if (!growthTableBody) return;
        growthTableBody.innerHTML = '';
        data.forEach(row => {
            const newRow = document.createElement('tr');
            newRow.className = 'hover:bg-gray-100 transition-colors';
            newRow.innerHTML = `
                <td class="px-2 py-1 whitespace-nowrap text-xxs">${row.year}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-xxs">${formatCurrency(row.invested)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-green-700 font-semibold text-xxs">${formatCurrency(row.returns)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right font-bold text-xxs">${formatCurrency(row.total)}</td>
            `;
            growthTableBody.appendChild(newRow);
        });
    }

    function updateInputsVisibility() {
        if (isStepUpAmount) {
            stepUpRateContainer.classList.add('hidden');
            stepUpAmountContainer.classList.remove('hidden');
            stepUpLabel.textContent = "Annual Step-up Amount (₹)";
        } else {
            stepUpRateContainer.classList.remove('hidden');
            stepUpAmountContainer.classList.add('hidden');
            stepUpLabel.textContent = "Annual Step-up Rate (%)";
        }
        calculate();
    }
    
    function setCalculatorMode(goalMode) {
        isGoalMode = goalMode;
        if (isGoalMode) {
            // Switch to Goal Mode
            modeGoalBtn.classList.add('bg-red-600', 'text-white', 'shadow');
            modeCalculateBtn.classList.remove('bg-red-600', 'text-white', 'shadow');
            modeCalculateBtn.classList.add('text-red-700');
            
            calculateWealthInputs.classList.add('hidden');
            planGoalInputs.classList.remove('hidden');
            
            standardResultSummary.classList.add('hidden');
            goalResultSummary.classList.remove('hidden');

            // In goal mode, the chart and table might not make sense, let's hide them.
            chartCanvas.parentElement.classList.add('hidden');
            toggleTableBtn.classList.add('hidden');
            growthTableContainer.classList.add('hidden');
        } else {
            // Switch to Calculate Mode
            modeCalculateBtn.classList.add('bg-red-600', 'text-white', 'shadow');
            modeGoalBtn.classList.remove('bg-red-600', 'text-white', 'shadow');
            modeGoalBtn.classList.add('text-red-700');

            planGoalInputs.classList.add('hidden');
            calculateWealthInputs.classList.remove('hidden');

            goalResultSummary.classList.add('hidden');
            standardResultSummary.classList.remove('hidden');
            
            chartCanvas.parentElement.classList.remove('hidden');
            toggleTableBtn.classList.remove('hidden');
             // Retain hidden state of table
        }
        calculate();
    }

    // --- EVENT LISTENERS ---
    const debouncedCalculate = debounce(calculate, 250);

    const inputsToTrack = [
        { slider: sipAmountSlider, input: sipAmountInput },
        { slider: targetAmountSlider, input: targetAmountInput },
        { slider: sipIncreaseRateSlider, input: sipIncreaseRateInput },
        { slider: sipIncreaseAmountSlider, input: sipIncreaseAmountInput },
        { slider: returnRateSlider, input: returnRateInput },
        { slider: investmentPeriodSlider, input: investmentPeriodInput },
        { slider: inflationRateSlider, input: inflationRateInput }
    ];

    inputsToTrack.forEach(({ slider, input }) => {
        if (slider && input) {
            slider.addEventListener('input', () => { 
                input.value = slider.value; 
                updateSliderFill(slider); 
                debouncedCalculate(); 
            });
            input.addEventListener('input', () => { 
                // Basic validation to prevent overly large numbers that might crash the browser
                if (parseFloat(input.value) > parseFloat(slider.max) * 1.1) {
                    input.value = slider.max;
                }
                slider.value = input.value; 
                updateSliderFill(slider); 
                debouncedCalculate(); 
            });
            input.addEventListener('blur', () => { 
                updateInputValue(input, slider); 
                debouncedCalculate(); 
            });
        }
    });

    function updateInputValue(input, slider) {
        let value = parseFloat(input.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        // Use the slider's step attribute, not the input's
        const step = parseFloat(slider.step) || 1;

        if (isNaN(value) || value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        
        // Round to the nearest valid step
        value = Math.round(value / step) * step;

        input.value = value;
        slider.value = value;
        updateSliderFill(slider);
    }
   
    inflationToggle.addEventListener('change', () => {
        const inflationCard = inflationToggle.closest('.input-card');
        if (inflationToggle.checked) {
            inflationRateContainer.classList.remove('hidden');
            if(inflationCard) inflationCard.classList.add('input-card-accent');
        } else {
            inflationRateContainer.classList.add('hidden');
            if(inflationCard) inflationCard.classList.remove('input-card-accent');
        }
        calculate();
    });

    stepUpToggle.addEventListener('click', () => {
        isStepUpAmount = !isStepUpAmount;
        stepUpToggle.classList.toggle('active', isStepUpAmount);
        stepUpToggle.setAttribute('aria-checked', isStepUpAmount);
        updateInputsVisibility();
    });
    
    stepUpToggle.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            stepUpToggle.click();
        }
    });
   
    toggleTableBtn.addEventListener('click', () => {
        growthTableContainer.classList.toggle('hidden');
        toggleTableBtn.textContent = growthTableContainer.classList.contains('hidden') ? 'Show Yearly Growth' : 'Hide Yearly Growth';
    });

    const faqButtons = document.querySelectorAll('.faq-question-button');
    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const answer = document.getElementById(button.getAttribute('aria-controls'));
            const isOpening = button.getAttribute('aria-expanded') === 'false';

            // Close all other FAQs first
            faqButtons.forEach(btn => {
                if (btn !== button) {
                    btn.setAttribute('aria-expanded', 'false');
                    const otherAnswer = document.getElementById(btn.getAttribute('aria-controls'));
                    otherAnswer.style.maxHeight = null;
                    btn.querySelector('svg').style.transform = 'rotate(0deg)';
                }
            });

            // Toggle the clicked FAQ
            if (isOpening) {
                button.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                button.querySelector('svg').style.transform = 'rotate(180deg)';
            } else {
                button.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = null;
                button.querySelector('svg').style.transform = 'rotate(0deg)';
            }
        });
    });

    // Sharing Logic
    const shareUrl = window.location.href;
    const shareTitle = "Check out this awesome SIP Calculator with Inflation!";
    shareWhatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
    shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    shareTwitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

    copyLinkBtn.addEventListener('click', () => {
        const dummy = document.createElement('textarea');
        document.body.appendChild(dummy);
        dummy.value = shareUrl;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);

        copyLinkDefaultIcon.classList.add('hidden');
        copyLinkSuccessIcon.classList.remove('hidden');
        setTimeout(() => {
            copyLinkDefaultIcon.classList.remove('hidden');
            copyLinkSuccessIcon.classList.add('hidden');
        }, 2000);
    });
    
    // Calculator mode buttons
    modeCalculateBtn.addEventListener('click', () => setCalculatorMode(false));
    modeGoalBtn.addEventListener('click', () => setCalculatorMode(true));


    // --- INITIALIZATION ---
    calculate();
    document.querySelectorAll('.range-slider').forEach(updateSliderFill);
    
    // Set the copyright year dynamically
    if(getElem('copyright-year')) {
        getElem('copyright-year').textContent = new Date().getFullYear();
    }
});
