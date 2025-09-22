document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);

    // --- DOM ELEMENT SELECTORS (Cached for performance) ---
    const elements = {
        modeCalculateBtn: getElem('mode-calculate'),
        modeGoalBtn: getElem('mode-goal'),
        calculateWealthInputs: getElem('calculate-wealth-inputs'),
        planGoalInputs: getElem('plan-goal-inputs'),
        standardResultSummary: getElem('standard-result-summary'),
        goalResultSummary: getElem('goal-result-summary'),
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
    
    function setCalculatorMode(goalMode) {
        isGoalMode = goalMode;
        elements.modeGoalBtn.classList.toggle('bg-red-600', isGoalMode);
        elements.modeGoalBtn.classList.toggle('text-white', isGoalMode);
        elements.modeGoalBtn.classList.toggle('shadow', isGoalMode);
        elements.modeGoalBtn.classList.toggle('text-red-700', !isGoalMode);
        
        elements.modeCalculateBtn.classList.toggle('bg-red-600', !isGoalMode);
        elements.modeCalculateBtn.classList.toggle('text-white', !isGoalMode);
        elements.modeCalculateBtn.classList.toggle('shadow', !isGoalMode);
        elements.modeCalculateBtn.classList.toggle('text-red-700', isGoalMode);
        
        elements.calculateWealthInputs.classList.toggle('hidden', isGoalMode);
        elements.planGoalInputs.classList.toggle('hidden', !isGoalMode);
        
        elements.standardResultSummary.classList.toggle('hidden', isGoalMode);
        elements.goalResultSummary.classList.toggle('hidden', !isGoalMode);

        elements.chartCanvas.parentElement.classList.toggle('hidden', isGoalMode);
        elements.toggleTableBtn.classList.toggle('hidden', isGoalMode);
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

    const shareUrl = window.location.href;
    const shareTitle = "Check out this awesome SIP Calculator with Inflation!";
    elements.shareWhatsappBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`;
    elements.shareFacebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    elements.shareTwitterBtn.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

    elements.copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            elements.copyLinkDefaultIcon.classList.add('hidden');
            elements.copyLinkSuccessIcon.classList.remove('hidden');
            setTimeout(() => {
                elements.copyLinkDefaultIcon.classList.remove('hidden');
                elements.copyLinkSuccessIcon.classList.add('hidden');
            }, 2000);
        });
    });
    
    elements.modeCalculateBtn.addEventListener('click', () => setCalculatorMode(false));
    elements.modeGoalBtn.addEventListener('click', () => setCalculatorMode(true));

    // --- INITIALIZATION ---
    calculate();
    document.querySelectorAll('.range-slider').forEach(updateSliderFill);
    if(elements.copyrightYear) {
        elements.copyrightYear.textContent = new Date().getFullYear();
    }
});
