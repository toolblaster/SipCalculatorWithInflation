document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);

    // --- DOM ELEMENT SELECTORS (Cached for performance) ---
    const elements = {
        modeCalculateBtn: getElem('mode-calculate'),
        modeGoalBtn: getElem('mode-goal'),
        // NEW: Goal sub-mode buttons
        goalSubModeToggle: getElem('goal-sub-mode-toggle'),
        goalModeSipBtn: getElem('goal-mode-sip'),
        goalModeTimeBtn: getElem('goal-mode-time'),
        // MODIFIED: Removed wrapper divs, using direct cards
        sipAmountCard: getElem('sip-amount-card'),
        targetAmountCard: getElem('target-amount-card'),
        investmentPeriodCard: getElem('investment-period-card'),
        // END MODIFIED
        standardResultSummary: getElem('standard-result-summary'),
        goalResultSummary: getElem('goal-result-summary'),
        // NEW: Goal time result
        goalTimeResultSummary: getElem('goal-time-result-summary'),
        requiredTimeElem: getElem('required-time'),
        futureGoalValueContainerTime: getElem('future-goal-value-container-time'),
        futureGoalValueTime: getElem('future-goal-value-time'),
        // END NEW
        sipAmountSlider: getElem('sip-amount-slider'),
        sipAmountInput: getElem('sip-amount-input'),
        targetAmountSlider: getElem('target-amount-slider'),
        targetAmountInput: getElem('target-amount-input'),
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
        requiredSipAmountElem: getElem('required-sip-amount'),
        // ENHANCEMENT: Added new element selectors for goal mode
        futureGoalValueContainer: getElem('future-goal-value-container'),
        futureGoalValueElem: getElem('future-goal-value'),
        growthTableContainer: getElem('growth-table-container'),
        growthTableBody: getElem('growth-table-body'),
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
    const chartCtx = elements.chartCanvas.getContext('2d');

    // --- STATE MANAGEMENT ---
    let investmentChart;
    let isStepUpAmount = true;
    let isGoalMode = false;
    let isGoalModeCalculateSip = true; // NEW: State for goal sub-mode

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
            // MODIFIED: Check sub-mode
            if (isGoalModeCalculateSip) {
                calculateRequiredSIP();
            } else {
                calculateRequiredTime(); // NEW function
            }
        } else {
            calculateWealth();
        }
    }
    
    function calculateWealth() {
        const monthlySipAmount = parseFloat(elements.sipAmountInput.value);
        const annualReturnRate = parseFloat(elements.returnRateInput.value) / 100;
        const investmentPeriodYears = parseInt(elements.investmentPeriodInput.value);
        const annualInflationRate = elements.inflationToggle.checked ? parseFloat(elements.inflationRateInput.value) / 100 : 0;
        const stepUpValue = isStepUpAmount ? parseFloat(elements.sipIncreaseAmountInput.value) : parseFloat(elements.sipIncreaseRateInput.value) / 100;

        let totalInvested = 0;
        let finalValue = 0;
        let currentMonthlySip = monthlySipAmount;
        const monthlyRate = annualReturnRate / 12;
        const yearlyGrowthData = [];

        for (let year = 1; year <= investmentPeriodYears; year++) {
            for (let month = 1; month <= 12; month++) {
                finalValue = finalValue * (1 + monthlyRate) + currentMonthlySip;
                totalInvested += currentMonthlySip;
            }
            
            yearlyGrowthData.push({
                year: year,
                invested: totalInvested,
                returns: finalValue - totalInvested,
                total: finalValue
            });

            if (isStepUpAmount) {
                currentMonthlySip += stepUpValue;
            } else {
                currentMonthlySip *= (1 + stepUpValue);
            }
        }

        const totalReturns = finalValue - totalInvested;
        elements.investedAmountElem.textContent = formatCurrency(totalInvested);
        elements.totalReturnsElem.textContent = formatCurrency(totalReturns);
        elements.finalValueElem.textContent = formatCurrency(finalValue);

        if (elements.inflationToggle.checked) {
            const realValue = finalValue / Math.pow(1 + annualInflationRate, investmentPeriodYears);
            elements.realValueElem.textContent = formatCurrency(realValue);
            elements.realValueContainer.classList.remove('hidden');
        } else {
            elements.realValueContainer.classList.add('hidden');
        }

        updateChart([totalInvested, totalReturns], ['Total Invested', 'Total Returns'], ['#EF4444', '#22C55E']);
        generateGrowthTable(yearlyGrowthData);
        
        updateURLParameters(); // ADDED
    }

    function calculateRequiredSIP() {
        const targetAmount = parseFloat(elements.targetAmountInput.value);
        const annualReturnRate = parseFloat(elements.returnRateInput.value) / 100;
        const investmentPeriodYears = parseInt(elements.investmentPeriodInput.value);
        const isInflationOn = elements.inflationToggle.checked;
        const annualInflationRate = isInflationOn ? parseFloat(elements.inflationRateInput.value) / 100 : 0;
        const stepUpValue = isStepUpAmount ? parseFloat(elements.sipIncreaseAmountInput.value) : parseFloat(elements.sipIncreaseRateInput.value) / 100;

        const futureTargetAmount = isInflationOn ? targetAmount * Math.pow(1 + annualInflationRate, investmentPeriodYears) : targetAmount;
        
        // ENHANCEMENT: Show/hide and update the future goal value
        if (isInflationOn) {
            elements.futureGoalValueElem.textContent = formatCurrency(futureTargetAmount);
            elements.futureGoalValueContainer.classList.remove('hidden');
        } else {
            elements.futureGoalValueContainer.classList.add('hidden');
        }

        let requiredSip = 0;
        if (isStepUpAmount) {
            let lowSip = 0;
            let highSip = futureTargetAmount;
            requiredSip = highSip;
            
            for(let i = 0; i < 100; i++) {
                let midSip = (lowSip + highSip) / 2;
                let calculatedFv = getFutureValue(midSip, annualReturnRate, investmentPeriodYears, true, stepUpValue);
                
                if (calculatedFv > futureTargetAmount) {
                    highSip = midSip;
                    requiredSip = midSip;
                } else {
                    lowSip = midSip;
                }
            }
        } else {
            let baseSipFV = getFutureValue(1, annualReturnRate, investmentPeriodYears, false, stepUpValue);
            requiredSip = baseSipFV > 0 ? futureTargetAmount / baseSipFV : 0;
        }
        
        elements.requiredSipAmountElem.textContent = formatCurrency(requiredSip);
        
        updateURLParameters(); // ADDED
    }
    
    // --- NEW: Calculate Time Function ---
    function calculateRequiredTime() {
        const targetAmount = parseFloat(elements.targetAmountInput.value);
        const annualReturnRate = parseFloat(elements.returnRateInput.value) / 100;
        const monthlySipAmount = parseFloat(elements.sipAmountInput.value); // Input
        const isInflationOn = elements.inflationToggle.checked;
        const annualInflationRate = isInflationOn ? parseFloat(elements.inflationRateInput.value) / 100 : 0;
        const stepUpValue = isStepUpAmount ? parseFloat(elements.sipIncreaseAmountInput.value) : parseFloat(elements.sipIncreaseRateInput.value) / 100;
        
        let years = 0;
        let currentValue = 0;
        let currentMonthlySip = monthlySipAmount;
        const monthlyRate = annualReturnRate / 12;

        // Safety check
        if (monthlySipAmount <= 0) {
            elements.requiredTimeElem.textContent = "N/A";
            elements.futureGoalValueContainerTime.classList.add('hidden');
            updateURLParameters();
            return;
        }
        
        // We can't calculate future target amount without 'years', so we calculate it iteratively
        let futureTargetAmount = targetAmount;

        while (currentValue < futureTargetAmount && years < 100) {
            years++;
            
            // Recalculate the future target amount for the *current* year
            futureTargetAmount = isInflationOn ? targetAmount * Math.pow(1 + annualInflationRate, years) : targetAmount;
            
            // Calculate the value of investments made *up to* the beginning of this year
            // This requires re-calculating FV from scratch for 'years'
            currentValue = 0;
            currentMonthlySip = monthlySipAmount; // Reset for full calculation
            
            for (let y = 0; y < years; y++) {
                for (let m = 0; m < 12; m++) {
                    currentValue = currentValue * (1 + monthlyRate) + currentMonthlySip;
                }
                // Apply step-up at the end of the year
                if (isStepUpAmount) {
                    currentMonthlySip += stepUpValue;
                } else {
                    currentMonthlySip *= (1 + stepUpValue);
                }
            }
        }
        
        elements.requiredTimeElem.textContent = years >= 100 ? "100+ Years" : `${years} Years`;

        // Show the final future goal value
        if (isInflationOn) {
            elements.futureGoalValueTime.textContent = formatCurrency(futureTargetAmount);
            elements.futureGoalValueContainerTime.classList.remove('hidden');
        } else {
            elements.futureGoalValueContainerTime.classList.add('hidden');
        }

        updateURLParameters();
    }
    
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
            plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.parsed)}` } } },
            cutout: '70%'
        };
        if (investmentChart) {
            investmentChart.data = chartData;
            investmentChart.options = chartOptions;
            investmentChart.update();
        } else {
            investmentChart = new Chart(chartCtx, { type: 'doughnut', data: chartData, options: chartOptions });
        }
    }
   
    function generateGrowthTable(data) {
        if (!elements.growthTableBody) return;
        const tableHtml = data.map(row => `
            <tr class="hover:bg-gray-100 transition-colors">
                <td class="px-2 py-1 whitespace-nowrap text-xxs">${row.year}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-xxs">${formatCurrency(row.invested)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right text-green-700 font-semibold text-xxs">${formatCurrency(row.returns)}</td>
                <td class="px-2 py-1 whitespace-nowrap table-cell-right font-bold text-xxs">${formatCurrency(row.total)}</td>
            </tr>
        `).join('');
        elements.growthTableBody.innerHTML = tableHtml;
    }

    function updateInputsVisibility() {
        const isAmount = elements.stepUpToggle.classList.contains('active');
        elements.stepUpRateContainer.classList.toggle('hidden', isAmount);
        elements.stepUpAmountContainer.classList.toggle('hidden', !isAmount);
        elements.stepUpLabel.textContent = isAmount ? "Annual Step-up Amount (₹)" : "Annual Step-up Rate (%)";
        calculate();
    }
    
    // MODIFIED: Updated to handle new UI structure
    function setCalculatorMode(goalMode) {
        isGoalMode = goalMode;

        const activeClasses = ['bg-gradient-to-r', 'from-red-600', 'to-red-700', 'text-white', 'shadow'];
        const inactiveClass = 'text-red-700';

        if (isGoalMode) {
            // Make Goal button active
            elements.modeGoalBtn.classList.add(...activeClasses);
            elements.modeGoalBtn.classList.remove(inactiveClass);
            // Make Calculate button inactive
            elements.modeCalculateBtn.classList.remove(...activeClasses);
            elements.modeCalculateBtn.classList.add(inactiveClass);
        } else {
            // Make Calculate button active
            elements.modeCalculateBtn.classList.add(...activeClasses);
            elements.modeCalculateBtn.classList.remove(inactiveClass);
            // Make Goal button inactive
            elements.modeGoalBtn.classList.remove(...activeClasses);
            elements.modeGoalBtn.classList.add(inactiveClass);
        }
        
        // Show/hide the goal sub-mode toggle
        elements.goalSubModeToggle.classList.toggle('hidden', !isGoalMode);
        
        // Update the UI based on the sub-mode
        setGoalSubMode(isGoalModeCalculateSip); // This will call calculate()
    }

    // NEW: Function to handle goal sub-mode switching
    function setGoalSubMode(calculateSip) {
        isGoalModeCalculateSip = calculateSip;

        const activeClasses = ['bg-gradient-to-r', 'from-green-600', 'to-green-700', 'text-white', 'shadow'];
        const inactiveClass = 'text-green-700';

        if (isGoalModeCalculateSip) {
            elements.goalModeSipBtn.classList.add(...activeClasses);
            elements.goalModeSipBtn.classList.remove(inactiveClass);
            elements.goalModeTimeBtn.classList.remove(...activeClasses);
            elements.goalModeTimeBtn.classList.add(inactiveClass);
        } else {
            elements.goalModeTimeBtn.classList.add(...activeClasses);
            elements.goalModeTimeBtn.classList.remove(inactiveClass);
            elements.goalModeSipBtn.classList.remove(...activeClasses);
            elements.goalModeSipBtn.classList.add(inactiveClass);
        }

        // --- Toggle UI elements based on all modes ---
        
        // SIP Amount Input: Visible in "Wealth" OR "Goal(Time)" mode
        elements.sipAmountCard.classList.toggle('hidden', isGoalMode && isGoalModeCalculateSip);

        // Target Amount Input: Visible ONLY in "Goal" mode
        elements.targetAmountCard.classList.toggle('hidden', !isGoalMode);

        // Investment Period: Dim and disable in "Goal(Time)" mode
        const isTimeMode = isGoalMode && !isGoalModeCalculateSip;
        elements.investmentPeriodCard.classList.toggle('opacity-50', isTimeMode);
        if (elements.investmentPeriodSlider) elements.investmentPeriodSlider.disabled = isTimeMode;
        if (elements.investmentPeriodInput) elements.investmentPeriodInput.disabled = isTimeMode;
        
        // Result Cards
        elements.standardResultSummary.classList.toggle('hidden', isGoalMode);
        elements.goalResultSummary.classList.toggle('hidden', !isGoalMode || (isGoalMode && !isGoalModeCalculateSip));
        elements.goalTimeResultSummary.classList.toggle('hidden', !isGoalMode || (isGoalMode && isGoalModeCalculateSip));

        // Chart & Table (hide in all goal modes)
        elements.chartCanvas.parentElement.classList.toggle('hidden', isGoalMode);
        const tableButtonContainer = elements.toggleTableBtn.parentElement;
        if(tableButtonContainer) {
            tableButtonContainer.classList.toggle('hidden', isGoalMode);
        }
        elements.growthTableContainer.classList.add('hidden'); // Always hide table on mode switch
        elements.toggleTableBtn.textContent = 'Show Yearly Growth';

        calculate();
    }

    // --- EVENT LISTENERS ---
    const debouncedCalculate = debounce(calculate, 200);

    const inputsToTrack = [
        { slider: elements.sipAmountSlider, input: elements.sipAmountInput },
        { slider: elements.targetAmountSlider, input: elements.targetAmountInput },
        { slider: elements.sipIncreaseRateSlider, input: elements.sipIncreaseRateInput },
        { slider: elements.sipIncreaseAmountSlider, input: elements.sipIncreaseAmountInput },
        { slider: elements.returnRateSlider, input: elements.returnRateInput },
        { slider: elements.investmentPeriodSlider, input: elements.investmentPeriodInput },
        { slider: elements.inflationRateSlider, input: elements.inflationRateInput }
    ];

    inputsToTrack.forEach(({ slider, input }) => {
        if (!slider || !input) return;
        const update = () => { updateSliderFill(slider); debouncedCalculate(); };
        slider.addEventListener('input', () => { input.value = slider.value; update(); });
        input.addEventListener('input', () => { slider.value = input.value; update(); });
        input.addEventListener('blur', () => {
            let value = parseFloat(input.value) || 0;
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const step = parseFloat(slider.step) || 1;
            value = Math.max(min, Math.min(max, Math.round(value / step) * step));
            input.value = slider.value = value;
            update();
        });
    });
   
    elements.inflationToggle.addEventListener('change', () => {
        const inflationCard = elements.inflationToggle.closest('.input-card');
        const isChecked = elements.inflationToggle.checked;
        elements.inflationRateContainer.classList.toggle('hidden', !isChecked);
        if(inflationCard) inflationCard.classList.toggle('input-card-accent', isChecked);
        calculate();
    });

    elements.stepUpToggle.addEventListener('click', () => {
        isStepUpAmount = !isStepUpAmount;
        elements.stepUpToggle.classList.toggle('active', isStepUpAmount);
        elements.stepUpToggle.setAttribute('aria-checked', isStepUpAmount);
        updateInputsVisibility();
    });
    
    elements.stepUpToggle.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); elements.stepUpToggle.click(); }
    });
   
    elements.toggleTableBtn.addEventListener('click', () => {
        const isHidden = elements.growthTableContainer.classList.toggle('hidden');
        elements.toggleTableBtn.textContent = isHidden ? 'Show Yearly Growth' : 'Hide Yearly Growth';
    });

    document.querySelectorAll('.faq-question-button').forEach(button => {
        button.addEventListener('click', () => {
            const answer = document.getElementById(button.getAttribute('aria-controls'));
            const isOpening = button.getAttribute('aria-expanded') === 'false';
            document.querySelectorAll('.faq-question-button').forEach(btn => {
                if (btn !== button) {
                    btn.setAttribute('aria-expanded', 'false');
                    document.getElementById(btn.getAttribute('aria-controls')).style.maxHeight = null;
                    btn.querySelector('svg').style.transform = 'rotate(0deg)';
                }
            });
            button.setAttribute('aria-expanded', isOpening);
            answer.style.maxHeight = isOpening ? answer.scrollHeight + 'px' : null;
            button.querySelector('svg').style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    // --- Share links are updated dynamically by updateShareLinks() ---
    
    elements.copyLinkBtn.addEventListener('click', () => {
        const textArea = document.createElement('textarea');
        // Get the URL from the browser's current state
        textArea.value = window.location.href; 
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
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
    
    elements.modeCalculateBtn.addEventListener('click', () => setCalculatorMode(false));
    elements.modeGoalBtn.addEventListener('click', () => setCalculatorMode(true));

    // NEW: Event listeners for sub-mode buttons
    elements.goalModeSipBtn.addEventListener('click', () => setGoalSubMode(true));
    elements.goalModeTimeBtn.addEventListener('click', () => setGoalSubMode(false));

    // --- URL STATE FUNCTIONS (NEW) ---
    function loadStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        let needsRecalculate = false;
        let modeChanged = false;

        // Set Mode
        const mode = params.get('mode');
        if (mode === 'goal') {
            setCalculatorMode(true); 
            modeChanged = true;
            
            // NEW: Check for goal sub-mode
            const goalSubMode = params.get('goalSubMode');
            if (goalSubMode === 'time') {
                // setCalculatorMode calls setGoalSubMode(true), so we override
                setGoalSubMode(false); 
            }
            
        } else if (mode === 'wealth') {
            setCalculatorMode(false);
            modeChanged = true;
        }

        // Helper to set value for slider and input
        const setValue = (param, inputElem, sliderElem) => {
            if (params.has(param)) {
                const value = parseFloat(params.get(param));
                if (!isNaN(value) && inputElem && sliderElem) {
                    inputElem.value = value;
                    sliderElem.value = value;
                    updateSliderFill(sliderElem);
                    needsRecalculate = true;
                }
            }
        };

        // Set values
        setValue('sip', elements.sipAmountInput, elements.sipAmountSlider);
        setValue('target', elements.targetAmountInput, elements.targetAmountSlider);
        setValue('returns', elements.returnRateInput, elements.returnRateSlider);
        setValue('period', elements.investmentPeriodInput, elements.investmentPeriodSlider);
        
        // Handle Step-Up
        const stepUpMode = params.get('stepUpMode');
        if (stepUpMode === 'rate') {
            isStepUpAmount = false;
            elements.stepUpToggle.classList.remove('active');
            setValue('stepUp', elements.sipIncreaseRateInput, elements.sipIncreaseRateSlider);
        } else {
            // Default to amount mode if param is 'amount' or not present
            isStepUpAmount = true;
            elements.stepUpToggle.classList.add('active');
            setValue('stepUp', elements.sipIncreaseAmountInput, elements.sipIncreaseAmountSlider);
        }
        // Update visibility based on loaded state
        elements.stepUpToggle.setAttribute('aria-checked', isStepUpAmount);
        elements.stepUpRateContainer.classList.toggle('hidden', isStepUpAmount);
        elements.stepUpAmountContainer.classList.toggle('hidden', !isStepUpAmount);
        elements.stepUpLabel.textContent = isStepUpAmount ? "Annual Step-up Amount (₹)" : "Annual Step-up Rate (%)";
        needsRecalculate = true; // Always true to apply step-up settings


        // Handle Inflation
        if (params.get('inflation') === 'true') {
            elements.inflationToggle.checked = true;
            setValue('inflationRate', elements.inflationRateInput, elements.inflationRateSlider);
            
            const inflationCard = elements.inflationToggle.closest('.input-card');
            elements.inflationRateContainer.classList.remove('hidden');
            if(inflationCard) inflationCard.classList.add('input-card-accent');
            needsRecalculate = true;
        } else {
            elements.inflationToggle.checked = false;
            const inflationCard = elements.inflationToggle.closest('.input-card');
            elements.inflationRateContainer.classList.add('hidden');
            if(inflationCard) inflationCard.classList.remove('input-card-accent');
            needsRecalculate = true; // Always true to apply inflation settings
        }

        // if mode was changed, calculate() was already called.
        // if not, and other params were present, call it now.
        if (needsRecalculate && !modeChanged) {
            calculate();
        } else if (!needsRecalculate && modeChanged) {
            // Mode changed but no other params, ensure default calc runs
            calculate();
        }
    }

    function updateURLParameters() {
        const params = new URLSearchParams();
        
        params.set('mode', isGoalMode ? 'goal' : 'wealth');
        
        if (isGoalMode) {
            // NEW: Add sub-mode param
            params.set('goalSubMode', isGoalModeCalculateSip ? 'sip' : 'time');
            params.set('target', elements.targetAmountInput.value);
            
            if (isGoalModeCalculateSip) {
                // We are calculating SIP, so Period is an input
                params.set('period', elements.investmentPeriodInput.value);
            } else {
                // We are calculating Time, so SIP is an input
                params.set('sip', elements.sipAmountInput.value);
            }
        } else {
            // Wealth mode, SIP and Period are inputs
            params.set('sip', elements.sipAmountInput.value);
            params.set('period', elements.investmentPeriodInput.value);
        }
        
        if (isStepUpAmount) {
            params.set('stepUpMode', 'amount');
            params.set('stepUp', elements.sipIncreaseAmountInput.value);
        } else {
            params.set('stepUpMode', 'rate');
            params.set('stepUp', elements.sipIncreaseRateInput.value);
        }
        
        params.set('returns', elements.returnRateInput.value);
        
        // Only set period if it's NOT the one we are calculating
        if (!isGoalMode || (isGoalMode && isGoalModeCalculateSip)) {
            params.set('period', elements.investmentPeriodInput.value);
        }
        
        if (elements.inflationToggle.checked) {
            params.set('inflation', 'true');
            params.set('inflationRate', elements.inflationRateInput.value);
        } else {
            params.set('inflation', 'false');
        }

        // Use replaceState to avoid cluttering browser history on every slider move
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        // Only push state if it's different to avoid clutter
        if (window.location.href !== newUrl) {
            history.replaceState(null, '', newUrl);
        }

        // Also update the share links
        updateShareLinks(newUrl);
    }

    // New function to update share links
    function updateShareLinks(url) {
        const shareUrl = new URL(url, window.location.origin).href; // Ensure it's an absolute URL
        const shareTitle = "Check out this awesome SIP Calculator with Inflation!";
        elements.shareWhatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
        elements.shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        elements.shareTelegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        elements.shareTwitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
    }

    // --- INITIALIZATION ---
    loadStateFromURL(); // MODIFIED: This now handles all modes
    
    // If no params are present, run a default calculation
    if (!new URLSearchParams(window.location.search).toString()) {
        calculate();
    }
    
    updateShareLinks(window.location.href); // ADDED: Set initial share links
    document.querySelectorAll('.range-slider').forEach(updateSliderFill);
    if(elements.copyrightYear) {
        elements.copyrightYear.textContent = new Date().getFullYear();
    }
});
