document.addEventListener('DOMContentLoaded', () => {
    const getElem = (id) => document.getElementById(id);
   
    // SIP Inputs
    const sipAmountSlider = getElem('sip-amount-slider');
    const sipAmountInput = getElem('sip-amount-input');
    const sipIncreaseRateSlider = getElem('sip-increase-rate-slider');
    const sipIncreaseRateInput = getElem('sip-increase-rate-input');
    const sipIncreaseAmountSlider = getElem('sip-increase-amount-slider');
    const sipIncreaseAmountInput = getElem('sip-increase-amount-input');
   
    const stepUpToggle = getElem('step-up-toggle');
    const stepUpLabel = getElem('step-up-label');
    const stepUpRateContainer = getElem('step-up-rate-container');
    const stepUpAmountContainer = getElem('step-up-amount-container');


    // Common Inputs
    const returnRateSlider = getElem('return-rate-slider');
    const returnRateInput = getElem('return-rate-input');
    const investmentPeriodSlider = getElem('investment-period-slider');
    const investmentPeriodInput = getElem('investment-period-input');
    const inflationToggle = getElem('inflation-toggle');
    const inflationRateContainer = getElem('inflation-rate-container');
    const inflationRateSlider = getElem('inflation-rate-slider');
    const inflationRateInput = getElem('inflation-rate-input');
   
    // Result Elements
    const investedAmountElem = getElem('invested-amount');
    const totalReturnsElem = getElem('total-returns');
    const finalValueElem = getElem('final-value');
    const realValueContainer = getElem('real-value-container');
    const realValueElem = getElem('real-value');
    const growthTableContainer = getElem('growth-table-container');
    const growthTableBody = getElem('growth-table-body');
    const toggleTableBtn = getElem('toggle-table-btn');
    const chartCanvas = getElem('investment-chart');
    const chartCtx = chartCanvas.getContext('2d');
   
    let investmentChart;
    let isStepUpAmount = true;


    // Utility Functions
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(num));
    const updateSliderFill = (slider) => {
        if (!slider) return;
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--fill-percentage', `${percentage}%`);
    };


    // Main Calculation Logic
    function updateCalculator() {
        const annualReturnRate = parseFloat(returnRateInput.value) / 100;
        const investmentPeriodYears = parseFloat(investmentPeriodInput.value);
       
        let annualInflationRate = 0;
        if(inflationToggle.checked) {
            const inflationInput = getElem('inflation-rate-input');
            if(inflationInput) {
                annualInflationRate = parseFloat(inflationInput.value) / 100;
            }
        }
       
        let investedAmount, finalValue, totalReturns;
        let yearlyGrowthData = [];


        const monthlySipAmount = parseFloat(sipAmountInput.value);
        const monthlyRate = annualReturnRate / 12;


        let currentCorpus = 0;
        let totalInvested = 0;
        let currentMonthlySip = monthlySipAmount;


        for (let year = 1; year <= investmentPeriodYears; year++) {
            let yearInvested = 0;
            for (let month = 1; month <= 12; month++) {
                currentCorpus = currentCorpus * (1 + monthlyRate) + currentMonthlySip;
                yearInvested += currentMonthlySip;
            }
            totalInvested += yearInvested;
           
            if (isStepUpAmount) {
                 currentMonthlySip += parseFloat(sipIncreaseAmountInput.value);
            } else {
                const annualIncreaseRate = parseFloat(sipIncreaseRateInput.value) / 100;
                currentMonthlySip *= (1 + annualIncreaseRate);
            }
           
            yearlyGrowthData.push({
                year: year,
                invested: totalInvested,
                returns: currentCorpus - totalInvested,
                total: currentCorpus
            });
        }
        investedAmount = totalInvested;
        finalValue = currentCorpus;
        totalReturns = finalValue - investedAmount;


        investedAmountElem.textContent = formatCurrency(investedAmount);
        totalReturnsElem.textContent = formatCurrency(totalReturns);
        finalValueElem.textContent = formatCurrency(finalValue);


        if (inflationToggle.checked) {
            const realValue = finalValue / Math.pow(1 + annualInflationRate, investmentPeriodYears);
            realValueElem.textContent = formatCurrency(realValue);
            realValueContainer.classList.remove('hidden');
        } else {
            realValueContainer.classList.add('hidden');
        }


        updateChart([investedAmount, totalReturns], ['Total Invested', 'Total Returns'], ['#E34037', '#22C55E']);
        generateGrowthTable(yearlyGrowthData);
    }


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
        const growthTableBody = getElem('growth-table-body');
        if (!growthTableBody) return;
       
        growthTableBody.innerHTML = '';
        data.forEach(row => {
            const newRow = document.createElement('tr');
            newRow.className = 'hover:bg-gray-100 transition-colors';
            newRow.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap">${row.year}</td>
                <td class="px-4 py-2 whitespace-nowrap table-cell-right">${formatCurrency(row.invested)}</td>
                <td class="px-4 py-2 whitespace-nowrap table-cell-right text-green-600 font-semibold">${formatCurrency(row.returns)}</td>
                <td class="px-4 py-2 whitespace-nowrap table-cell-right font-bold">${formatCurrency(row.total)}</td>
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
        updateCalculator();
    }

    // Event Listeners
    const inputs = [
        { slider: sipAmountSlider, input: sipAmountInput },
        { slider: sipIncreaseRateSlider, input: sipIncreaseRateInput },
        { slider: sipIncreaseAmountSlider, input: sipIncreaseAmountInput },
        { slider: returnRateSlider, input: returnRateInput },
        { slider: investmentPeriodSlider, input: investmentPeriodInput },
        { slider: inflationRateSlider, input: inflationRateInput }
    ];


    inputs.forEach(({ slider, input }) => {
        if (slider && input) {
            slider.addEventListener('input', () => { input.value = slider.value; updateSliderFill(slider); debouncedUpdate(); });
            input.addEventListener('input', () => { slider.value = input.value; updateSliderFill(slider); debouncedUpdate(); });
            input.addEventListener('blur', () => { updateInputValue(input, slider); debouncedUpdate(); });
        }
    });


    function updateInputValue(input, slider) {
        let value = parseFloat(input.value);
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);


        if (isNaN(value) || value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }


        const step = parseFloat(input.step) || 1;
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
        updateCalculator();
    });


    stepUpToggle.addEventListener('click', () => {
        isStepUpAmount = !isStepUpAmount;
        stepUpToggle.classList.toggle('active', isStepUpAmount);
        updateInputsVisibility();
    });
   
    toggleTableBtn.addEventListener('click', () => {
        growthTableContainer.classList.toggle('hidden');
        toggleTableBtn.textContent = growthTableContainer.classList.contains('hidden') ? 'Show Yearly Growth' : 'Hide Yearly Growth';
    });

    const faqButtons = document.querySelectorAll('.faq-question-button');
    faqButtons.forEach(button => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('svg');

            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
                icon.style.transform = 'rotate(0deg)';
            } else {
                // This part can be simplified if only one FAQ can be open at a time
                document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = null);
                document.querySelectorAll('.faq-question-button svg').forEach(icn => icn.style.transform = 'rotate(0deg)');
                
                answer.style.maxHeight = answer.scrollHeight + 'px';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });


    const debouncedUpdate = debounce(updateCalculator, 250);


    updateCalculator();
    document.querySelectorAll('.range-slider').forEach(updateSliderFill);
});
