(() => {
    'use strict';

    const Model = window.RentVsBuyModel;
    if (!Model) {
        throw new Error('RentVsBuyModel failed to load.');
    }

    const form = document.getElementById('calculatorForm');
    const resultsSection = document.getElementById('results');
    const taxToggle = document.getElementById('estimateTaxBenefit');
    const taxInputs = document.getElementById('taxInputs');
    const restoreDefaultsButton = document.getElementById('restoreDefaultsButton');
    const downPaymentInput = document.getElementById('downPaymentPercent');
    const monthlyPmiInput = document.getElementById('monthlyPmi');
    const pmiRemovalLtvInput = document.getElementById('pmiRemovalLtv');
    const pmiRemovalLtvHelp = document.getElementById('pmiRemovalLtvHelp');

    let netWorthChart = null;
    let housingCashFlowChart = null;
    let latestResult = null;

    const percentIds = new Set([
        'afterTaxInvestmentReturn',
        'annualIncomeGrowth',
        'annualExpenseInflation',
        'annualRentIncrease',
        'downPaymentPercent',
        'mortgageInterestRate',
        'buyingClosingCostsPercent',
        'pmiRemovalLtv',
        'propertyTaxRate',
        'annualPropertyTaxGrowth',
        'annualInsuranceGrowth',
        'annualMaintenanceGrowth',
        'annualHoaGrowth',
        'annualAduIncomeGrowth',
        'annualHomeAppreciation',
        'sellingCostsPercent',
        'capitalGainsTaxRate',
        'federalMarginalTaxRate'
    ]);

    const defaults = Object.fromEntries(
        Array.from(form.elements)
            .filter((element) => element.id)
            .map((element) => [
                element.id,
                element.type === 'checkbox' ? element.checked : element.value
            ])
    );

    function readNumber(id) {
        const element = document.getElementById(id);
        const value = Number(element.value);
        return Number.isFinite(value) ? value : 0;
    }

    function readInputs() {
        const values = {};

        Array.from(form.elements).forEach((element) => {
            if (!element.id || element.tagName === 'BUTTON') return;

            if (element.type === 'checkbox') {
                values[element.id] = element.checked;
                return;
            }

            const rawValue = readNumber(element.id);
            values[element.id] = percentIds.has(element.id)
                ? rawValue / 100
                : rawValue;
        });

        return values;
    }

    function restoreDefaults() {
        Object.entries(defaults).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (!element) return;

            if (element.type === 'checkbox') {
                element.checked = Boolean(value);
            } else {
                element.value = value;
            }
        });

        toggleTaxInputs();
        updatePmiControls();
        calculateAndRender();
    }

    function toggleTaxInputs() {
        taxInputs.hidden = !taxToggle.checked;
    }

    function updatePmiControls() {
        const downPaymentPercent = readNumber('downPaymentPercent');
        const monthlyPmi = readNumber('monthlyPmi');
        const startingLtv = Math.max(0, 100 - downPaymentPercent);
        const pmiIsModeled = monthlyPmi > 0 || downPaymentPercent < 20;

        pmiRemovalLtvInput.disabled = !pmiIsModeled;

        if (!pmiIsModeled) {
            pmiRemovalLtvHelp.textContent =
                `Not applicable: ${downPaymentPercent.toFixed(0)}% down means a ` +
                `${startingLtv.toFixed(0)}% starting LTV, and no PMI is modeled. ` +
                'The 80% field matters only when the down payment is below 20%.';
            return;
        }

        pmiRemovalLtvHelp.textContent =
            'Usually 80%. Change this advanced assumption only if your lender or loan terms specify a different PMI cancellation threshold.';
    }

    function formatCurrency(value, digits = 0) {
        if (!Number.isFinite(value)) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: digits,
            minimumFractionDigits: digits
        }).format(value);
    }

    function formatCompactCurrency(value) {
        if (!Number.isFinite(value)) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    }

    function formatPercent(value, digits = 1) {
        if (!Number.isFinite(value)) return '—';
        return `${(value * 100).toFixed(digits)}%`;
    }

    function signedCurrency(value) {
        if (!Number.isFinite(value)) return '—';
        const absolute = formatCurrency(Math.abs(value));
        return value >= 0 ? `+${absolute}` : `−${absolute}`;
    }

    function createTable(headers, rows, options = {}) {
        const table = document.createElement('table');
        table.className = options.className || '';

        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        rows.forEach((row) => {
            const tr = tbody.insertRow();
            row.forEach((cell, index) => {
                const td = tr.insertCell();
                if (cell instanceof Node) {
                    td.appendChild(cell);
                } else {
                    td.textContent = cell;
                }
                if (options.numericColumns?.includes(index)) {
                    td.classList.add('numeric');
                }
            });
        });

        return table;
    }

    function renderWarnings(result) {
        const container = document.getElementById('warnings');
        const warnings = Model.buildWarnings(result);
        container.innerHTML = '';

        if (warnings.length === 0) return;

        const box = document.createElement('div');
        box.className = 'warning-box';

        const title = document.createElement('strong');
        title.textContent = 'Review these assumptions';
        box.appendChild(title);

        const list = document.createElement('ul');
        warnings.forEach((warning) => {
            const item = document.createElement('li');
            item.textContent = warning;
            list.appendChild(item);
        });
        box.appendChild(list);
        container.appendChild(box);
    }

    function renderSummary(result, breakEvenAppreciation) {
        const { selected, inputs, assumptions } = result;
        const buyerAhead = selected.differenceBuyerMinusRenter >= 0;
        const winner = buyerAhead ? 'Buying' : 'Renting';
        const advantage = Math.abs(selected.differenceBuyerMinusRenter);

        document.getElementById('decisionHeading').textContent =
            `${inputs.holdingPeriodYears}-year decision snapshot`;

        document.getElementById('decisionSummary').textContent =
            `${winner} is ahead by ${formatCurrency(advantage)} under the current assumptions.`;

        const cards = [
            {
                label: 'Renting net worth',
                value: formatCurrency(selected.renter.netWorth),
                detail: `After ${inputs.holdingPeriodYears} years`
            },
            {
                label: 'Buying net worth',
                value: formatCurrency(selected.buyer.netWorth),
                detail: 'Net of mortgage and selling costs'
            },
            {
                label: buyerAhead ? 'Buyer advantage' : 'Renter advantage',
                value: formatCurrency(advantage),
                detail: 'Difference in modeled net worth',
                emphasis: true
            },
            {
                label: 'Break-even year',
                value: result.breakEvenYear ? `Year ${result.breakEvenYear}` : 'Not reached',
                detail: `Within ${inputs.simulationYears} simulated years`
            },
            {
                label: 'Break-even appreciation',
                value: breakEvenAppreciation.rate === null
                    ? 'Above tested range'
                    : formatPercent(breakEvenAppreciation.rate, 2),
                detail: `Needed for buying to tie at year ${inputs.holdingPeriodYears}`
            },
            {
                label: 'Year-one economic premium',
                value: signedCurrency(assumptions.economicOwnershipPremiumMonthly),
                detail: 'Buying unrecoverable cost minus rent, monthly'
            }
        ];

        const container = document.getElementById('summaryCards');
        container.innerHTML = '';

        cards.forEach((card) => {
            const article = document.createElement('article');
            article.className = `summary-card${card.emphasis ? ' emphasis' : ''}`;

            const label = document.createElement('p');
            label.className = 'card-label';
            label.textContent = card.label;

            const value = document.createElement('strong');
            value.className = 'card-value';
            value.textContent = card.value;

            const detail = document.createElement('p');
            detail.className = 'card-detail';
            detail.textContent = card.detail;

            article.append(label, value, detail);
            container.appendChild(article);
        });
    }

    function renderMonthlyExpenseOverview(result) {
        const { yearOne, inputs } = result;
        if (!yearOne) return;

        const renter = yearOne.renter;
        const buyer = yearOne.buyer;
        const monthlyIncome = inputs.netMonthlyPay + inputs.annualAfterTaxBonus / 12;
        const monthlyAduIncome = buyer.annualAduIncome / 12;
        const monthlyTaxBenefit = buyer.annualTaxBenefit / 12;
        const renterHousingTotal = renter.averageMonthlyHousingOutflow;
        const buyerHousingTotal = buyer.averageMonthlyHousingOutflow;
        const buyerNetHousingCost = buyerHousingTotal - monthlyAduIncome - monthlyTaxBenefit;
        const renterTotalSpending = inputs.monthlyNonHousingExpenses + renterHousingTotal;
        const buyerTotalSpending = inputs.monthlyNonHousingExpenses + buyerHousingTotal;
        const renterNetMonthlyBurden = renterTotalSpending;
        const buyerNetMonthlyBurden =
            inputs.monthlyNonHousingExpenses + buyerNetHousingCost;

        const rows = [
            ['Base rent', formatCurrency(renter.annualRent / 12), '—'],
            ['Renter insurance', formatCurrency(renter.annualRenterInsurance / 12), '—'],
            ['Mortgage principal', '—', formatCurrency(buyer.annualMortgagePrincipal / 12)],
            ['Mortgage interest', '—', formatCurrency(buyer.annualMortgageInterest / 12)],
            [
                'Mortgage payment subtotal (principal + interest)',
                '—',
                formatCurrency(
                    (buyer.annualMortgagePrincipal + buyer.annualMortgageInterest) / 12
                )
            ],
            ['Property tax', '—', formatCurrency(buyer.annualPropertyTax / 12)],
            ['Homeowners insurance', '—', formatCurrency(buyer.annualHomeInsurance / 12)],
            ['Maintenance / capital reserve', '—', formatCurrency(buyer.annualMaintenance / 12)],
            ['HOA', '—', formatCurrency(buyer.annualHoa / 12)],
            ['PMI', '—', formatCurrency(buyer.annualPmi / 12)],
            ['Gross monthly housing outflow', formatCurrency(renterHousingTotal), formatCurrency(buyerHousingTotal)],
            [
                'Less: net ADU income',
                '—',
                monthlyAduIncome === 0 ? '$0' : signedCurrency(-monthlyAduIncome)
            ],
            [
                'Less: estimated tax benefit',
                '—',
                monthlyTaxBenefit === 0 ? '$0' : signedCurrency(-monthlyTaxBenefit)
            ],
            ['Net monthly housing cost', formatCurrency(renterHousingTotal), formatCurrency(buyerNetHousingCost)],
            ['Non-housing expenses', formatCurrency(inputs.monthlyNonHousingExpenses), formatCurrency(inputs.monthlyNonHousingExpenses)],
            ['Gross total monthly spending', formatCurrency(renterTotalSpending), formatCurrency(buyerTotalSpending)],
            ['Net monthly burden after ADU/tax', formatCurrency(renterNetMonthlyBurden), formatCurrency(buyerNetMonthlyBurden)],
            ['Average monthly income', formatCurrency(monthlyIncome), formatCurrency(monthlyIncome)],
            ['Amount remaining / invested', formatCurrency(monthlyIncome - renterNetMonthlyBurden), formatCurrency(monthlyIncome - buyerNetMonthlyBurden)]
        ];

        const table = createTable(
            ['Monthly component', 'Rent', 'Buy'],
            rows,
            { numericColumns: [1, 2], className: 'expense-overview-table' }
        );

        const subtotalLabels = new Set([
            'Mortgage payment subtotal (principal + interest)'
        ]);
        const emphasisLabels = new Set([
            'Gross monthly housing outflow',
            'Net monthly housing cost',
            'Gross total monthly spending',
            'Net monthly burden after ADU/tax',
            'Amount remaining / invested'
        ]);

        Array.from(table.tBodies[0].rows).forEach((row) => {
            const label = row.cells[0].textContent;
            if (subtotalLabels.has(label)) row.classList.add('subtotal-row');
            if (emphasisLabels.has(label)) row.classList.add('total-row');
        });

        const container = document.getElementById('monthlyExpenseTable');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function renderTaxEstimate(result) {
        const breakdown = result.yearOne?.buyer?.taxBenefitBreakdown;
        const summary = document.getElementById('taxEstimateSummary');
        const container = document.getElementById('taxEstimateTable');
        if (!breakdown || !summary || !container) return;

        if (!breakdown.estimatorEnabled && breakdown.manualBenefit === 0) {
            summary.textContent =
                'Automatic estimation is off, so no homeowner tax benefit is included in the comparison.';
        } else if (!breakdown.estimatorEnabled) {
            summary.textContent =
                `Automatic estimation is off. Only the manual benefit of ${formatCurrency(breakdown.manualBenefit)} per year is included.`;
        } else {
            summary.textContent =
                `Year one estimates ${formatCurrency(breakdown.totalBenefit)} per year ` +
                `(${formatCurrency(breakdown.totalBenefit / 12)} per month) of incremental homeowner tax savings.`;
        }

        const deductionSource = (itemized, standard) =>
            itemized > standard ? 'Itemized deduction' : 'Standard deduction';

        const rows = [
            ['Mortgage interest paid', '—', formatCurrency(breakdown.annualMortgageInterest)],
            ['Average mortgage balance', '—', formatCurrency(breakdown.averageMortgageBalance)],
            ['Mortgage-interest debt limit', '—', formatCurrency(breakdown.mortgageInterestDeductionLimit)],
            ['Deductible share of mortgage interest', '—', formatPercent(breakdown.deductibleMortgageInterestShare, 1)],
            ['Deductible mortgage interest', '$0', formatCurrency(breakdown.deductibleMortgageInterest)],
            ['Property tax paid', '$0', formatCurrency(breakdown.annualPropertyTax)],
            ['Other state/local taxes entered', formatCurrency(breakdown.annualOtherStateLocalTaxes), formatCurrency(breakdown.annualOtherStateLocalTaxes)],
            ['SALT deduction after cap', formatCurrency(breakdown.renterSalt), formatCurrency(breakdown.buyerSalt)],
            ['Other itemized deductions', formatCurrency(breakdown.annualOtherItemizedDeductions), formatCurrency(breakdown.annualOtherItemizedDeductions)],
            ['Total itemized deductions', formatCurrency(breakdown.renterItemized), formatCurrency(breakdown.buyerItemized)],
            ['Standard deduction', formatCurrency(breakdown.standardDeduction), formatCurrency(breakdown.standardDeduction)],
            [
                'Deduction actually used',
                `${formatCurrency(breakdown.renterDeduction)} · ${deductionSource(breakdown.renterItemized, breakdown.standardDeduction)}`,
                `${formatCurrency(breakdown.buyerDeduction)} · ${deductionSource(breakdown.buyerItemized, breakdown.standardDeduction)}`
            ],
            ['Incremental buyer deduction', '—', formatCurrency(breakdown.incrementalDeduction)],
            ['Federal marginal tax rate', '—', formatPercent(breakdown.federalMarginalTaxRate, 1)],
            ['Estimated federal tax savings', '—', formatCurrency(breakdown.estimatedFederalBenefit)],
            ['Manual additional benefit', '—', formatCurrency(breakdown.manualBenefit)],
            ['Total annual tax benefit used by model', '—', formatCurrency(breakdown.totalBenefit)],
            ['Monthly equivalent shown in dashboard', '—', formatCurrency(breakdown.totalBenefit / 12)]
        ];

        const table = createTable(
            ['Year-one tax step', 'Rent', 'Buy / calculation'],
            rows,
            { numericColumns: [1, 2], className: 'tax-estimate-table' }
        );

        const emphasisLabels = new Set([
            'Deduction actually used',
            'Incremental buyer deduction',
            'Total annual tax benefit used by model',
            'Monthly equivalent shown in dashboard'
        ]);
        Array.from(table.tBodies[0].rows).forEach((row) => {
            if (emphasisLabels.has(row.cells[0].textContent)) {
                row.classList.add('total-row');
            }
        });

        container.innerHTML = '';
        container.appendChild(table);
    }

    function renderAffordability(result) {
        const { yearOne, inputs, assumptions } = result;
        const buyerAfterTaxHousing =
            yearOne.buyer.averageMonthlyHousingOutflow -
            yearOne.buyer.annualAduIncome / 12 -
            yearOne.buyer.annualTaxBenefit / 12;

        const rows = [
            [
                'Average monthly income',
                formatCurrency(
                    inputs.netMonthlyPay + inputs.annualAfterTaxBonus / 12
                ),
                formatCurrency(
                    inputs.netMonthlyPay +
                    inputs.annualAfterTaxBonus / 12 +
                    yearOne.buyer.annualAduIncome / 12
                )
            ],
            [
                'Non-housing expenses',
                formatCurrency(inputs.monthlyNonHousingExpenses),
                formatCurrency(inputs.monthlyNonHousingExpenses)
            ],
            [
                'Gross housing cash outflow',
                formatCurrency(yearOne.renter.averageMonthlyHousingOutflow),
                formatCurrency(yearOne.buyer.averageMonthlyHousingOutflow)
            ],
            [
                'Net housing cost after ADU/tax estimate',
                formatCurrency(yearOne.renter.averageMonthlyHousingOutflow),
                formatCurrency(buyerAfterTaxHousing)
            ],
            [
                'Monthly amount invested',
                formatCurrency(yearOne.renter.averageMonthlyCashFlow),
                formatCurrency(
                    yearOne.buyer.averageMonthlyCashFlow +
                    yearOne.buyer.annualTaxBenefit / 12
                )
            ],
            [
                'Gross ownership premium',
                '—',
                signedCurrency(assumptions.grossOwnershipPremiumMonthly)
            ],
            [
                'Economic ownership premium',
                '—',
                signedCurrency(assumptions.economicOwnershipPremiumMonthly)
            ]
        ];

        const table = createTable(
            ['Year one', 'Rent', 'Buy'],
            rows,
            { numericColumns: [1, 2] }
        );

        const container = document.getElementById('affordabilityTable');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function renderUpfront(result) {
        const { assumptions, buyerLiquidSavingsAfterPurchase, yearOne } = result;
        const reserveGap =
            buyerLiquidSavingsAfterPurchase - assumptions.requiredEmergencyFund;
        const annualPropertyTax = yearOne ? yearOne.buyer.annualPropertyTax : 0;
        const annualHomeInsurance = yearOne ? yearOne.buyer.annualHomeInsurance : 0;

        const rows = [
            ['Down payment', formatCurrency(assumptions.downPayment)],
            ['Buying closing costs', formatCurrency(assumptions.buyingClosingCosts)],
            ['Total buyer upfront cash', formatCurrency(assumptions.buyerUpfrontCash)],
            ['Liquid savings after purchase', formatCurrency(buyerLiquidSavingsAfterPurchase)],
            ['Emergency-fund target', formatCurrency(assumptions.requiredEmergencyFund)],
            [
                'Reserve surplus / shortfall',
                signedCurrency(reserveGap)
            ],
            ['Scheduled mortgage payment', formatCurrency(assumptions.scheduledMortgagePayment)],
            ['Monthly property tax — year one', formatCurrency(annualPropertyTax / 12)],
            ['Annual property tax — year one', formatCurrency(annualPropertyTax)],
            ['Monthly homeowners insurance — year one', formatCurrency(annualHomeInsurance / 12)]
        ];

        const table = createTable(
            ['Item', 'Amount'],
            rows,
            { numericColumns: [1] }
        );

        const container = document.getElementById('upfrontTable');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function chartOptions(yTitle) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yTitle
                    },
                    ticks: {
                        callback(value) {
                            return formatCompactCurrency(value);
                        }
                    }
                }
            }
        };
    }

    function renderCharts(result) {
        if (typeof window.Chart === 'undefined') {
            console.warn('Chart.js is unavailable; calculations will still be displayed.');
            return;
        }

        const labels = result.annualResults.map((row) => row.year);
        const renterNetWorth = result.annualResults.map((row) => row.renter.netWorth);
        const buyerNetWorth = result.annualResults.map((row) => row.buyer.netWorth);
        const renterHousing = result.annualResults.map(
            (row) => row.renter.averageMonthlyHousingOutflow
        );
        const buyerHousing = result.annualResults.map(
            (row) => row.buyer.averageMonthlyHousingOutflow -
                     row.buyer.annualAduIncome / 12
        );

        netWorthChart?.destroy();
        housingCashFlowChart?.destroy();

        netWorthChart = new Chart(document.getElementById('netWorthChart'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Renting net worth',
                        data: renterNetWorth,
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.2
                    },
                    {
                        label: 'Buying net worth',
                        data: buyerNetWorth,
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.2
                    }
                ]
            },
            options: chartOptions('Net worth')
        });

        housingCashFlowChart = new Chart(
            document.getElementById('housingCashFlowChart'),
            {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Rent housing outflow',
                            data: renterHousing,
                            borderWidth: 3,
                            pointRadius: 0,
                            tension: 0.2
                        },
                        {
                            label: 'Buy housing outflow, net of ADU',
                            data: buyerHousing,
                            borderWidth: 3,
                            pointRadius: 0,
                            tension: 0.2
                        }
                    ]
                },
                options: chartOptions('Average monthly outflow')
            }
        );
    }

    function renderBreakEven(result, breakEvenAppreciation) {
        const { selected, breakEvenYear, assumptions, inputs } = result;
        const container = document.getElementById('breakEvenAnalysis');
        container.innerHTML = '';

        const list = document.createElement('dl');
        list.className = 'metric-list';

        const metrics = [
            [
                'First year buying catches renting',
                breakEvenYear ? `Year ${breakEvenYear}` : `Not within ${inputs.simulationYears} years`
            ],
            [
                `Appreciation needed at year ${inputs.holdingPeriodYears}`,
                breakEvenAppreciation.rate === null
                    ? 'More than 15% annually'
                    : formatPercent(breakEvenAppreciation.rate, 2)
            ],
            [
                'Buyer net home equity at exit',
                formatCurrency(selected.buyer.netHomeEquity)
            ],
            [
                'Remaining mortgage at exit',
                formatCurrency(selected.buyer.mortgageBalance)
            ],
            [
                'Estimated selling costs at exit',
                formatCurrency(selected.buyer.sellingCosts)
            ],
            [
                'Year-one lifestyle premium entered',
                inputs.maxOwnershipPremiumMonthly > 0
                    ? formatCurrency(inputs.maxOwnershipPremiumMonthly)
                    : 'Not entered'
            ],
            [
                'Year-one economic ownership premium',
                signedCurrency(assumptions.economicOwnershipPremiumMonthly)
            ]
        ];

        metrics.forEach(([term, description]) => {
            const dt = document.createElement('dt');
            dt.textContent = term;
            const dd = document.createElement('dd');
            dd.textContent = description;
            list.append(dt, dd);
        });

        container.appendChild(list);
    }

    function renderSensitivity(matrix, holdingPeriodYears) {
        const headers = [
            'Home appreciation',
            ...matrix.investmentReturns.map(
                (rate) => `${formatPercent(rate, 0)} investment return`
            )
        ];

        const rows = matrix.cells.map((row, rowIndex) => [
            formatPercent(matrix.homeAppreciationRates[rowIndex], 0),
            ...row.map((cell) => {
                const span = document.createElement('span');
                const value = cell.differenceBuyerMinusRenter;
                span.className = value >= 0 ? 'positive' : 'negative';
                span.textContent =
                    value >= 0
                        ? `Buy +${formatCurrency(value)}`
                        : `Rent +${formatCurrency(Math.abs(value))}`;
                return span;
            })
        ]);

        const table = createTable(
            headers,
            rows,
            { numericColumns: [1, 2, 3], className: 'sensitivity-table' }
        );
        table.createCaption().textContent =
            `Net-worth advantage after ${holdingPeriodYears} years`;

        const container = document.getElementById('sensitivityTable');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function renderYearlyTable(result) {
        const rows = result.annualResults.map((row) => [
            String(row.year),
            formatCurrency(row.renter.netWorth),
            formatCurrency(row.buyer.netWorth),
            row.differenceBuyerMinusRenter >= 0
                ? `Buy +${formatCurrency(row.differenceBuyerMinusRenter)}`
                : `Rent +${formatCurrency(Math.abs(row.differenceBuyerMinusRenter))}`,
            formatCurrency(row.renter.averageMonthlyHousingOutflow),
            formatCurrency(row.buyer.averageMonthlyHousingOutflow),
            formatCurrency(row.buyer.mortgageBalance),
            formatCurrency(row.buyer.netHomeEquity),
            formatCurrency(row.renter.cumulativeUnrecoverableCosts),
            formatCurrency(row.buyer.cumulativeUnrecoverableCosts)
        ]);

        const table = createTable(
            [
                'Year',
                'Rent net worth',
                'Buy net worth',
                'Advantage',
                'Rent monthly outflow',
                'Buy monthly outflow',
                'Mortgage balance',
                'Net home equity',
                'Rent unrecoverable',
                'Buy unrecoverable'
            ],
            rows,
            { numericColumns: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
        );

        const container = document.getElementById('yearlyTable');
        container.innerHTML = '';
        container.appendChild(table);
    }

    function calculateAndRender() {
        try {
            const inputs = readInputs();
            const result = Model.simulate(inputs);
            const breakEvenAppreciation = Model.findBreakEvenAppreciation(inputs);
            const sensitivity = Model.buildSensitivityMatrix(inputs);
            latestResult = result;

            renderWarnings(result);
            renderSummary(result, breakEvenAppreciation);
            renderMonthlyExpenseOverview(result);
            renderTaxEstimate(result);
            renderAffordability(result);
            renderUpfront(result);
            renderCharts(result);
            renderBreakEven(result, breakEvenAppreciation);
            renderSensitivity(sensitivity, result.inputs.holdingPeriodYears);
            renderYearlyTable(result);

            resultsSection.classList.add('visible');
        } catch (error) {
            console.error(error);
            const warnings = document.getElementById('warnings');
            warnings.innerHTML = `
                <div class="warning-box">
                    <strong>Unable to calculate</strong>
                    <p>${error.message}</p>
                </div>
            `;
            resultsSection.classList.add('visible');
        }
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        calculateAndRender();
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    taxToggle.addEventListener('change', toggleTaxInputs);
    downPaymentInput.addEventListener('input', updatePmiControls);
    monthlyPmiInput.addEventListener('input', updatePmiControls);
    restoreDefaultsButton.addEventListener('click', restoreDefaults);

    const chartJsScript = document.getElementById('chartJsScript');
    chartJsScript?.addEventListener('load', () => {
        if (latestResult) renderCharts(latestResult);
    });

    toggleTaxInputs();
    updatePmiControls();
    calculateAndRender();
})();
