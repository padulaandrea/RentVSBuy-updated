(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.RentVsBuyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const MONTHS_PER_YEAR = 12;

    function finiteNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function annualToMonthlyRate(annualRate) {
        if (annualRate <= -1) return -1;
        return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
    }

    function mortgagePayment(principal, annualRate, termYears) {
        if (principal <= 0) return 0;
        const paymentCount = Math.max(1, Math.round(termYears * MONTHS_PER_YEAR));
        const monthlyRate = annualRate / MONTHS_PER_YEAR;
        if (monthlyRate === 0) return principal / paymentCount;
        return principal *
            (monthlyRate * Math.pow(1 + monthlyRate, paymentCount)) /
            (Math.pow(1 + monthlyRate, paymentCount) - 1);
    }

    function normalizeInputs(raw = {}) {
        const inputs = {
            simulationYears: clamp(Math.round(finiteNumber(raw.simulationYears, 30)), 1, 50),
            holdingPeriodYears: clamp(Math.round(finiteNumber(raw.holdingPeriodYears, 10)), 1, 50),

            netMonthlyPay: Math.max(0, finiteNumber(raw.netMonthlyPay, 13000)),
            monthlyNonHousingExpenses: Math.max(0, finiteNumber(raw.monthlyNonHousingExpenses, 2500)),
            annualAfterTaxBonus: finiteNumber(raw.annualAfterTaxBonus, 30000),
            liquidInvestableSavings: finiteNumber(raw.liquidInvestableSavings, 1400000),
            afterTaxInvestmentReturn: finiteNumber(raw.afterTaxInvestmentReturn, 0.06),
            annualIncomeGrowth: finiteNumber(raw.annualIncomeGrowth, 0.03),
            annualExpenseInflation: finiteNumber(raw.annualExpenseInflation, 0.03),
            emergencyFundMonths: Math.max(0, finiteNumber(raw.emergencyFundMonths, 6)),
            maxOwnershipPremiumMonthly: Math.max(0, finiteNumber(raw.maxOwnershipPremiumMonthly, 0)),

            monthlyRent: Math.max(0, finiteNumber(raw.monthlyRent, 5500)),
            annualRentIncrease: finiteNumber(raw.annualRentIncrease, 0.03),
            renterInsuranceMonthly: Math.max(0, finiteNumber(raw.renterInsuranceMonthly, 25)),
            renterMovingCosts: Math.max(0, finiteNumber(raw.renterMovingCosts, 0)),

            homePrice: Math.max(0, finiteNumber(raw.homePrice, 1500000)),
            downPaymentPercent: clamp(finiteNumber(raw.downPaymentPercent, 0.23), 0, 1),
            mortgageInterestRate: finiteNumber(raw.mortgageInterestRate, 0.06),
            mortgageTermYears: clamp(Math.round(finiteNumber(raw.mortgageTermYears, 30)), 1, 50),
            buyingClosingCostsPercent: Math.max(0, finiteNumber(raw.buyingClosingCostsPercent, 0.02)),
            upfrontRepairs: Math.max(0, finiteNumber(raw.upfrontRepairs, 0)),
            supplementalPropertyTaxYearOne: Math.max(0, finiteNumber(raw.supplementalPropertyTaxYearOne, 0)),
            monthlyPmi: Math.max(0, finiteNumber(raw.monthlyPmi, 0)),
            pmiRemovalLtv: clamp(finiteNumber(raw.pmiRemovalLtv, 0.80), 0, 1),

            propertyTaxRate: Math.max(0, finiteNumber(raw.propertyTaxRate, 0.013)),
            annualPropertyTaxGrowth: finiteNumber(raw.annualPropertyTaxGrowth, 0.02),
            annualHomeInsurance: Math.max(0, finiteNumber(raw.annualHomeInsurance, 3750)),
            annualInsuranceGrowth: finiteNumber(raw.annualInsuranceGrowth, 0.05),
            annualMaintenance: Math.max(0, finiteNumber(raw.annualMaintenance, 12000)),
            annualMaintenanceGrowth: finiteNumber(raw.annualMaintenanceGrowth, 0.03),
            monthlyHoa: Math.max(0, finiteNumber(raw.monthlyHoa, 0)),
            annualHoaGrowth: finiteNumber(raw.annualHoaGrowth, 0.03),
            monthlyNetAduIncome: finiteNumber(raw.monthlyNetAduIncome, 0),
            annualAduIncomeGrowth: finiteNumber(raw.annualAduIncomeGrowth, 0.03),

            annualHomeAppreciation: finiteNumber(raw.annualHomeAppreciation, 0.02),
            sellingCostsPercent: Math.max(0, finiteNumber(raw.sellingCostsPercent, 0.06)),
            capitalGainsExclusion: Math.max(0, finiteNumber(raw.capitalGainsExclusion, 500000)),
            capitalGainsTaxRate: Math.max(0, finiteNumber(raw.capitalGainsTaxRate, 0)),

            estimateTaxBenefit: Boolean(raw.estimateTaxBenefit),
            taxMode: raw.taxMode === 'california' ? 'california' : 'generic',
            federalMarginalTaxRate: Math.max(0, finiteNumber(raw.federalMarginalTaxRate, 0.32)),
            standardDeduction: Math.max(0, finiteNumber(raw.standardDeduction, 32200)),
            mortgageInterestDeductionLimit: Math.max(0, finiteNumber(raw.mortgageInterestDeductionLimit, 750000)),
            saltCap: Math.max(0, finiteNumber(raw.saltCap, 40400)),
            annualOtherStateLocalTaxes: Math.max(0, finiteNumber(raw.annualOtherStateLocalTaxes, 41094)),
            annualOtherItemizedDeductions: Math.max(0, finiteNumber(raw.annualOtherItemizedDeductions, 0)),

            californiaMarginalTaxRate: Math.max(0, finiteNumber(raw.californiaMarginalTaxRate, 0.093)),
            californiaStandardDeduction: Math.max(0, finiteNumber(raw.californiaStandardDeduction, 11412)),
            californiaMortgageInterestDeductionLimit: Math.max(0, finiteNumber(raw.californiaMortgageInterestDeductionLimit, 1000000)),
            californiaOtherItemizedDeductions: Math.max(0, finiteNumber(raw.californiaOtherItemizedDeductions, 1676)),
            californiaAgi: Math.max(0, finiteNumber(raw.californiaAgi, 482372)),
            californiaItemizedDeductionLimitThreshold: Math.max(0, finiteNumber(raw.californiaItemizedDeductionLimitThreshold, 504411)),

            additionalAnnualHomeownerTaxBenefit: finiteNumber(raw.additionalAnnualHomeownerTaxBenefit, 0)
        };

        inputs.holdingPeriodYears = Math.min(inputs.holdingPeriodYears, inputs.simulationYears);
        return inputs;
    }

    function calculateAnnualTaxBenefitBreakdown(
        inputs,
        annualMortgageInterest,
        annualPropertyTax,
        averageMortgageBalance
    ) {
        const manualBenefit = inputs.additionalAnnualHomeownerTaxBenefit;
        const originalLoan = inputs.homePrice * (1 - inputs.downPaymentPercent);
        const balanceForLimit = Number.isFinite(averageMortgageBalance)
            ? Math.max(0, averageMortgageBalance)
            : originalLoan;

        const federalDeductibleShare = balanceForLimit > 0
            ? Math.min(1, inputs.mortgageInterestDeductionLimit / balanceForLimit)
            : 0;
        const federalDeductibleMortgageInterest = inputs.estimateTaxBenefit
            ? Math.max(0, annualMortgageInterest * federalDeductibleShare)
            : 0;
        const renterSalt = inputs.estimateTaxBenefit
            ? Math.min(inputs.saltCap, inputs.annualOtherStateLocalTaxes)
            : 0;
        const buyerSalt = inputs.estimateTaxBenefit
            ? Math.min(
                inputs.saltCap,
                inputs.annualOtherStateLocalTaxes + Math.max(0, annualPropertyTax)
              )
            : 0;

        const renterFederalItemized = inputs.estimateTaxBenefit
            ? renterSalt + inputs.annualOtherItemizedDeductions
            : 0;
        const buyerFederalItemized = inputs.estimateTaxBenefit
            ? buyerSalt +
              inputs.annualOtherItemizedDeductions +
              federalDeductibleMortgageInterest
            : 0;
        const renterFederalDeduction = inputs.estimateTaxBenefit
            ? Math.max(inputs.standardDeduction, renterFederalItemized)
            : 0;
        const buyerFederalDeduction = inputs.estimateTaxBenefit
            ? Math.max(inputs.standardDeduction, buyerFederalItemized)
            : 0;
        const incrementalFederalDeduction = inputs.estimateTaxBenefit
            ? Math.max(0, buyerFederalDeduction - renterFederalDeduction)
            : 0;
        const estimatedFederalBenefit =
            incrementalFederalDeduction * inputs.federalMarginalTaxRate;

        const californiaEnabled = inputs.estimateTaxBenefit && inputs.taxMode === 'california';
        const californiaDeductibleShare = balanceForLimit > 0
            ? Math.min(1, inputs.californiaMortgageInterestDeductionLimit / balanceForLimit)
            : 0;
        const californiaDeductibleMortgageInterest = californiaEnabled
            ? Math.max(0, annualMortgageInterest * californiaDeductibleShare)
            : 0;
        const renterCaliforniaItemized = californiaEnabled
            ? inputs.californiaOtherItemizedDeductions
            : 0;
        const buyerCaliforniaItemized = californiaEnabled
            ? inputs.californiaOtherItemizedDeductions +
              Math.max(0, annualPropertyTax) +
              californiaDeductibleMortgageInterest
            : 0;
        const renterCaliforniaDeduction = californiaEnabled
            ? Math.max(inputs.californiaStandardDeduction, renterCaliforniaItemized)
            : 0;
        const buyerCaliforniaDeduction = californiaEnabled
            ? Math.max(inputs.californiaStandardDeduction, buyerCaliforniaItemized)
            : 0;
        const incrementalCaliforniaDeduction = californiaEnabled
            ? Math.max(0, buyerCaliforniaDeduction - renterCaliforniaDeduction)
            : 0;
        const estimatedCaliforniaBenefit =
            incrementalCaliforniaDeduction * inputs.californiaMarginalTaxRate;

        const totalBenefit =
            estimatedFederalBenefit + estimatedCaliforniaBenefit + manualBenefit;

        return {
            estimatorEnabled: inputs.estimateTaxBenefit,
            taxMode: inputs.taxMode,
            californiaEnabled,
            annualMortgageInterest: Math.max(0, annualMortgageInterest),
            averageMortgageBalance: balanceForLimit,
            annualPropertyTax: Math.max(0, annualPropertyTax),

            mortgageInterestDeductionLimit: inputs.mortgageInterestDeductionLimit,
            deductibleMortgageInterestShare: federalDeductibleShare,
            deductibleMortgageInterest: federalDeductibleMortgageInterest,
            annualOtherStateLocalTaxes: inputs.annualOtherStateLocalTaxes,
            saltCap: inputs.saltCap,
            renterSalt,
            buyerSalt,
            annualOtherItemizedDeductions: inputs.annualOtherItemizedDeductions,
            renterItemized: renterFederalItemized,
            buyerItemized: buyerFederalItemized,
            standardDeduction: inputs.standardDeduction,
            renterDeduction: renterFederalDeduction,
            buyerDeduction: buyerFederalDeduction,
            incrementalDeduction: incrementalFederalDeduction,
            federalMarginalTaxRate: inputs.federalMarginalTaxRate,
            estimatedFederalBenefit,

            californiaMarginalTaxRate: inputs.californiaMarginalTaxRate,
            californiaStandardDeduction: inputs.californiaStandardDeduction,
            californiaMortgageInterestDeductionLimit: inputs.californiaMortgageInterestDeductionLimit,
            californiaDeductibleMortgageInterestShare: californiaDeductibleShare,
            californiaDeductibleMortgageInterest,
            californiaOtherItemizedDeductions: inputs.californiaOtherItemizedDeductions,
            renterCaliforniaItemized,
            buyerCaliforniaItemized,
            renterCaliforniaDeduction,
            buyerCaliforniaDeduction,
            incrementalCaliforniaDeduction,
            estimatedCaliforniaBenefit,
            californiaAgi: inputs.californiaAgi,
            californiaItemizedDeductionLimitThreshold: inputs.californiaItemizedDeductionLimitThreshold,
            californiaHighIncomeLimitationMayApply:
                californiaEnabled &&
                inputs.californiaItemizedDeductionLimitThreshold > 0 &&
                inputs.californiaAgi > inputs.californiaItemizedDeductionLimitThreshold,

            manualBenefit,
            totalBenefit
        };
    }

    function estimateAnnualIncrementalTaxBenefit(
        inputs,
        annualMortgageInterest,
        annualPropertyTax,
        averageMortgageBalance
    ) {
        return calculateAnnualTaxBenefitBreakdown(
            inputs,
            annualMortgageInterest,
            annualPropertyTax,
            averageMortgageBalance
        ).totalBenefit;
    }

    function growPortfolio(portfolio, monthlyReturn, contribution) {
        const grown = portfolio > 0 ? portfolio * (1 + monthlyReturn) : portfolio;
        return grown + contribution;
    }

    function calculateSaleOutcome(inputs, homeValue, mortgageBalance, buyingClosingCosts) {
        const sellingCosts = homeValue * inputs.sellingCostsPercent;
        const estimatedBasis = inputs.homePrice + buyingClosingCosts;
        const taxableGain = Math.max(
            0,
            homeValue - sellingCosts - estimatedBasis - inputs.capitalGainsExclusion
        );
        const capitalGainsTax = taxableGain * inputs.capitalGainsTaxRate;
        const netHomeEquity = homeValue - sellingCosts - capitalGainsTax - mortgageBalance;

        return {
            sellingCosts,
            taxableGain,
            capitalGainsTax,
            netHomeEquity
        };
    }

    function simulate(rawInputs = {}) {
        const inputs = normalizeInputs(rawInputs);
        const totalMonths = inputs.simulationYears * MONTHS_PER_YEAR;

        const downPayment = inputs.homePrice * inputs.downPaymentPercent;
        const buyingClosingCosts = inputs.homePrice * inputs.buyingClosingCostsPercent;
        const buyerUpfrontCash =
            downPayment +
            buyingClosingCosts +
            inputs.upfrontRepairs +
            inputs.supplementalPropertyTaxYearOne;
        const renterUpfrontCash = inputs.renterMovingCosts;

        const originalLoan = Math.max(0, inputs.homePrice - downPayment);
        const scheduledMortgagePayment = mortgagePayment(
            originalLoan,
            inputs.mortgageInterestRate,
            inputs.mortgageTermYears
        );

        let mortgageBalance = originalLoan;
        let homeValue = inputs.homePrice;
        let renterPortfolio = inputs.liquidInvestableSavings - renterUpfrontCash;
        let buyerPortfolio = inputs.liquidInvestableSavings - buyerUpfrontCash;

        const monthlyInvestmentReturn = annualToMonthlyRate(inputs.afterTaxInvestmentReturn);
        const monthlyHomeAppreciation = annualToMonthlyRate(inputs.annualHomeAppreciation);
        const monthlyMortgageRate = inputs.mortgageInterestRate / MONTHS_PER_YEAR;

        let cumulativeRent = 0;
        let cumulativeRenterInsurance = 0;
        let cumulativeMortgageInterest = 0;
        let cumulativePropertyTax = inputs.supplementalPropertyTaxYearOne;
        let cumulativeHomeInsurance = 0;
        let cumulativeMaintenance = 0;
        let cumulativeHoa = 0;
        let cumulativePmi = 0;
        let cumulativeAduIncome = 0;
        let cumulativeTaxBenefit = 0;
        let cumulativeMortgagePrincipal = 0;

        let yearMortgageInterest = 0;
        let yearMortgageBalanceSum = 0;
        let yearMortgageBalanceObservationCount = 0;
        let yearPropertyTax = 0;
        let yearMortgagePrincipal = 0;
        let yearRent = 0;
        let yearRenterInsurance = 0;
        let yearHomeInsurance = 0;
        let yearMaintenance = 0;
        let yearHoa = 0;
        let yearPmi = 0;
        let yearAduIncome = 0;
        let yearBuyerHousingOutflow = 0;
        let yearRenterHousingOutflow = 0;
        let yearBuyerCashFlow = 0;
        let yearRenterCashFlow = 0;

        const annualResults = [];

        for (let monthIndex = 0; monthIndex < totalMonths; monthIndex += 1) {
            const yearIndex = Math.floor(monthIndex / MONTHS_PER_YEAR);
            const incomeGrowthFactor = Math.pow(1 + inputs.annualIncomeGrowth, yearIndex);
            const expenseGrowthFactor = Math.pow(1 + inputs.annualExpenseInflation, yearIndex);
            const rentGrowthFactor = Math.pow(1 + inputs.annualRentIncrease, yearIndex);
            const propertyTaxGrowthFactor = Math.pow(1 + inputs.annualPropertyTaxGrowth, yearIndex);
            const insuranceGrowthFactor = Math.pow(1 + inputs.annualInsuranceGrowth, yearIndex);
            const maintenanceGrowthFactor = Math.pow(1 + inputs.annualMaintenanceGrowth, yearIndex);
            const hoaGrowthFactor = Math.pow(1 + inputs.annualHoaGrowth, yearIndex);
            const aduGrowthFactor = Math.pow(1 + inputs.annualAduIncomeGrowth, yearIndex);

            const monthlyIncome =
                inputs.netMonthlyPay * incomeGrowthFactor +
                inputs.annualAfterTaxBonus / MONTHS_PER_YEAR;
            const monthlyLivingExpenses =
                inputs.monthlyNonHousingExpenses * expenseGrowthFactor;

            const monthlyRent = inputs.monthlyRent * rentGrowthFactor;
            const renterHousingOutflow = monthlyRent + inputs.renterInsuranceMonthly;
            const renterCashFlow =
                monthlyIncome -
                monthlyLivingExpenses -
                renterHousingOutflow;

            renterPortfolio = growPortfolio(
                renterPortfolio,
                monthlyInvestmentReturn,
                renterCashFlow
            );

            cumulativeRent += monthlyRent;
            cumulativeRenterInsurance += inputs.renterInsuranceMonthly;
            yearRent += monthlyRent;
            yearRenterInsurance += inputs.renterInsuranceMonthly;
            yearRenterHousingOutflow += renterHousingOutflow;
            yearRenterCashFlow += renterCashFlow;

            let mortgageInterest = 0;
            let mortgagePrincipal = 0;
            let actualMortgagePayment = 0;
            const mortgageBalanceAtMonthStart = mortgageBalance;

            if (mortgageBalance > 0) {
                mortgageInterest = monthlyMortgageRate === 0
                    ? 0
                    : mortgageBalance * monthlyMortgageRate;
                const plannedPrincipal = monthlyMortgageRate === 0
                    ? scheduledMortgagePayment
                    : scheduledMortgagePayment - mortgageInterest;
                mortgagePrincipal = Math.max(
                    0,
                    Math.min(mortgageBalance, plannedPrincipal)
                );
                actualMortgagePayment = mortgageInterest + mortgagePrincipal;
                mortgageBalance = Math.max(0, mortgageBalance - mortgagePrincipal);
            }

            const monthlyPropertyTax =
                (inputs.homePrice * inputs.propertyTaxRate * propertyTaxGrowthFactor) /
                MONTHS_PER_YEAR;
            const monthlyInsurance =
                (inputs.annualHomeInsurance * insuranceGrowthFactor) /
                MONTHS_PER_YEAR;
            const monthlyMaintenance =
                (inputs.annualMaintenance * maintenanceGrowthFactor) /
                MONTHS_PER_YEAR;
            const monthlyHoa = inputs.monthlyHoa * hoaGrowthFactor;
            const currentLtv = homeValue > 0 ? mortgageBalance / homeValue : 0;
            const monthlyPmi =
                mortgageBalance > 0 &&
                inputs.monthlyPmi > 0 &&
                currentLtv > inputs.pmiRemovalLtv
                    ? inputs.monthlyPmi
                    : 0;
            const monthlyAduIncome =
                inputs.monthlyNetAduIncome * aduGrowthFactor;

            const buyerHousingOutflow =
                actualMortgagePayment +
                monthlyPropertyTax +
                monthlyInsurance +
                monthlyMaintenance +
                monthlyHoa +
                monthlyPmi;

            const buyerCashFlow =
                monthlyIncome +
                monthlyAduIncome -
                monthlyLivingExpenses -
                buyerHousingOutflow;

            buyerPortfolio = growPortfolio(
                buyerPortfolio,
                monthlyInvestmentReturn,
                buyerCashFlow
            );

            cumulativeMortgageInterest += mortgageInterest;
            cumulativeMortgagePrincipal += mortgagePrincipal;
            cumulativePropertyTax += monthlyPropertyTax;
            cumulativeHomeInsurance += monthlyInsurance;
            cumulativeMaintenance += monthlyMaintenance;
            cumulativeHoa += monthlyHoa;
            cumulativePmi += monthlyPmi;
            cumulativeAduIncome += monthlyAduIncome;

            yearMortgageInterest += mortgageInterest;
            if (mortgageBalanceAtMonthStart > 0) {
                yearMortgageBalanceSum += mortgageBalanceAtMonthStart;
                yearMortgageBalanceObservationCount += 1;
            }
            yearMortgagePrincipal += mortgagePrincipal;
            yearPropertyTax += monthlyPropertyTax;
            yearHomeInsurance += monthlyInsurance;
            yearMaintenance += monthlyMaintenance;
            yearHoa += monthlyHoa;
            yearPmi += monthlyPmi;
            yearAduIncome += monthlyAduIncome;
            yearBuyerHousingOutflow += buyerHousingOutflow;
            yearBuyerCashFlow += buyerCashFlow;

            homeValue *= 1 + monthlyHomeAppreciation;

            const endOfYear = (monthIndex + 1) % MONTHS_PER_YEAR === 0;
            if (!endOfYear) continue;

            const yearNumber = (monthIndex + 1) / MONTHS_PER_YEAR;
            const averageMortgageBalance = yearMortgageBalanceObservationCount > 0
                ? yearMortgageBalanceSum / yearMortgageBalanceObservationCount
                : 0;
            const taxBenefitBreakdown = calculateAnnualTaxBenefitBreakdown(
                inputs,
                yearMortgageInterest,
                yearPropertyTax,
                averageMortgageBalance
            );
            const taxBenefit = taxBenefitBreakdown.totalBenefit;
            buyerPortfolio += taxBenefit;
            cumulativeTaxBenefit += taxBenefit;

            const sale = calculateSaleOutcome(
                inputs,
                homeValue,
                mortgageBalance,
                buyingClosingCosts
            );
            const renterNetWorth = renterPortfolio;
            const buyerNetWorth = buyerPortfolio + sale.netHomeEquity;

            const renterUnrecoverableCosts =
                renterUpfrontCash +
                cumulativeRent +
                cumulativeRenterInsurance;

            const buyerUnrecoverableCosts =
                buyingClosingCosts +
                inputs.upfrontRepairs +
                cumulativeMortgageInterest +
                cumulativePropertyTax +
                cumulativeHomeInsurance +
                cumulativeMaintenance +
                cumulativeHoa +
                cumulativePmi +
                sale.sellingCosts +
                sale.capitalGainsTax -
                cumulativeAduIncome -
                cumulativeTaxBenefit;

            annualResults.push({
                year: yearNumber,
                renter: {
                    portfolio: renterPortfolio,
                    netWorth: renterNetWorth,
                    annualRent: yearRent,
                    annualRenterInsurance: yearRenterInsurance,
                    averageMonthlyHousingOutflow: yearRenterHousingOutflow / MONTHS_PER_YEAR,
                    averageMonthlyCashFlow: yearRenterCashFlow / MONTHS_PER_YEAR,
                    cumulativeUnrecoverableCosts: renterUnrecoverableCosts
                },
                buyer: {
                    portfolio: buyerPortfolio,
                    homeValue,
                    mortgageBalance,
                    netHomeEquity: sale.netHomeEquity,
                    netWorth: buyerNetWorth,
                    annualMortgageInterest: yearMortgageInterest,
                    annualMortgagePrincipal: yearMortgagePrincipal,
                    annualPropertyTax: yearPropertyTax,
                    annualHomeInsurance: yearHomeInsurance,
                    annualMaintenance: yearMaintenance,
                    annualHoa: yearHoa,
                    annualPmi: yearPmi,
                    annualAduIncome: yearAduIncome,
                    annualTaxBenefit: taxBenefit,
                    taxBenefitBreakdown,
                    averageMonthlyHousingOutflow: yearBuyerHousingOutflow / MONTHS_PER_YEAR,
                    averageMonthlyCashFlow: yearBuyerCashFlow / MONTHS_PER_YEAR,
                    sellingCosts: sale.sellingCosts,
                    capitalGainsTax: sale.capitalGainsTax,
                    taxableGain: sale.taxableGain,
                    cumulativeUnrecoverableCosts: buyerUnrecoverableCosts
                },
                differenceBuyerMinusRenter: buyerNetWorth - renterNetWorth
            });

            yearMortgageInterest = 0;
            yearMortgageBalanceSum = 0;
            yearMortgageBalanceObservationCount = 0;
            yearPropertyTax = 0;
            yearMortgagePrincipal = 0;
            yearRent = 0;
            yearRenterInsurance = 0;
            yearHomeInsurance = 0;
            yearMaintenance = 0;
            yearHoa = 0;
            yearPmi = 0;
            yearAduIncome = 0;
            yearBuyerHousingOutflow = 0;
            yearRenterHousingOutflow = 0;
            yearBuyerCashFlow = 0;
            yearRenterCashFlow = 0;
        }

        const selected = annualResults[inputs.holdingPeriodYears - 1];
        const yearOne = annualResults[0];
        const breakEven = annualResults.find(
            (row) => row.differenceBuyerMinusRenter >= 0
        );

        const requiredEmergencyFund =
            inputs.emergencyFundMonths *
            (
                inputs.monthlyNonHousingExpenses +
                (yearOne ? yearOne.buyer.averageMonthlyHousingOutflow : 0)
            );

        const grossOwnershipPremiumMonthly = yearOne
            ? yearOne.buyer.averageMonthlyHousingOutflow -
              yearOne.renter.averageMonthlyHousingOutflow -
              yearOne.buyer.annualAduIncome / MONTHS_PER_YEAR
            : 0;

        const economicOwnershipPremiumMonthly = yearOne
            ? (
                yearOne.buyer.annualMortgageInterest +
                yearOne.buyer.annualPropertyTax +
                yearOne.buyer.annualHomeInsurance +
                yearOne.buyer.annualMaintenance +
                yearOne.buyer.annualHoa +
                yearOne.buyer.annualPmi -
                yearOne.buyer.annualAduIncome -
                yearOne.buyer.annualTaxBenefit
              ) / MONTHS_PER_YEAR -
              yearOne.renter.averageMonthlyHousingOutflow
            : 0;

        return {
            inputs,
            assumptions: {
                downPayment,
                buyingClosingCosts,
                buyerUpfrontCash,
                renterUpfrontCash,
                originalLoan,
                scheduledMortgagePayment,
                requiredEmergencyFund,
                grossOwnershipPremiumMonthly,
                economicOwnershipPremiumMonthly
            },
            annualResults,
            selected,
            yearOne,
            breakEvenYear: breakEven ? breakEven.year : null,
            buyerLiquidSavingsAfterPurchase:
                inputs.liquidInvestableSavings - buyerUpfrontCash
        };
    }

    function findBreakEvenAppreciation(rawInputs = {}, options = {}) {
        const inputs = normalizeInputs(rawInputs);
        const lowBound = finiteNumber(options.low, -0.10);
        const highBound = finiteNumber(options.high, 0.15);
        const tolerance = Math.max(0.000001, finiteNumber(options.tolerance, 0.00001));
        const maxIterations = Math.max(10, Math.round(finiteNumber(options.maxIterations, 60)));

        function difference(rate) {
            const result = simulate({
                ...inputs,
                annualHomeAppreciation: rate
            });
            return result.selected.differenceBuyerMinusRenter;
        }

        let low = lowBound;
        let high = highBound;
        let lowValue = difference(low);
        let highValue = difference(high);

        if (lowValue >= 0) {
            return {
                rate: low,
                bounded: true,
                message: 'Buying already wins at the lower search bound.'
            };
        }

        if (highValue < 0) {
            return {
                rate: null,
                bounded: false,
                message: 'Buying does not break even within the tested appreciation range.'
            };
        }

        for (let i = 0; i < maxIterations; i += 1) {
            const mid = (low + high) / 2;
            const value = difference(mid);

            if (Math.abs(value) < 1 || high - low < tolerance) {
                return {
                    rate: mid,
                    bounded: true,
                    message: 'Break-even appreciation found.'
                };
            }

            if (value >= 0) {
                high = mid;
                highValue = value;
            } else {
                low = mid;
                lowValue = value;
            }
        }

        return {
            rate: (low + high) / 2,
            bounded: true,
            message: 'Approximate break-even appreciation found.'
        };
    }

    function buildSensitivityMatrix(rawInputs = {}) {
        const inputs = normalizeInputs(rawInputs);
        const investmentReturns = [0.04, 0.06, 0.08];
        const homeAppreciationRates = [0.00, 0.02, 0.04];

        return {
            investmentReturns,
            homeAppreciationRates,
            cells: homeAppreciationRates.map((appreciation) =>
                investmentReturns.map((investmentReturn) => {
                    const result = simulate({
                        ...inputs,
                        annualHomeAppreciation: appreciation,
                        afterTaxInvestmentReturn: investmentReturn
                    });
                    return {
                        appreciation,
                        investmentReturn,
                        differenceBuyerMinusRenter:
                            result.selected.differenceBuyerMinusRenter
                    };
                })
            )
        };
    }

    function buildWarnings(result) {
        const warnings = [];
        const { inputs, assumptions, yearOne } = result;

        if (assumptions.buyerUpfrontCash > inputs.liquidInvestableSavings) {
            warnings.push(
                'The purchase requires more upfront cash than the liquid savings entered.'
            );
        }

        if (result.buyerLiquidSavingsAfterPurchase < assumptions.requiredEmergencyFund) {
            warnings.push(
                'Liquid savings after purchase are below the selected emergency-fund target.'
            );
        }

        if (yearOne && yearOne.buyer.averageMonthlyCashFlow < 0) {
            warnings.push(
                'The buying scenario has negative average monthly cash flow in year one.'
            );
        }

        if (yearOne && yearOne.renter.averageMonthlyCashFlow < 0) {
            warnings.push(
                'The renting scenario has negative average monthly cash flow in year one.'
            );
        }

        if (inputs.downPaymentPercent < 0.20 && inputs.monthlyPmi === 0) {
            warnings.push(
                'The down payment is below 20%, but no PMI cost was entered.'
            );
        }

        if (inputs.annualHomeInsurance === 0) {
            warnings.push(
                'Home insurance is zero. Use an address-specific quote before relying on the result.'
            );
        }

        if (inputs.annualMaintenance === 0) {
            warnings.push(
                'Maintenance is zero. Include both routine repairs and a reserve for major projects.'
            );
        }

        if (inputs.estimateTaxBenefit && inputs.annualOtherStateLocalTaxes === 0) {
            warnings.push(
                'The federal tax estimator assumes no renter-side state or local taxes. In a state with income tax, this can overstate the incremental federal property-tax benefit.'
            );
        }

        if (
            inputs.estimateTaxBenefit &&
            inputs.taxMode === 'california' &&
            inputs.californiaItemizedDeductionLimitThreshold > 0 &&
            inputs.californiaAgi > inputs.californiaItemizedDeductionLimitThreshold
        ) {
            warnings.push(
                'California AGI is above the entered itemized-deduction limitation threshold. The simplified California estimator does not model the high-income limitation; verify the state benefit with tax software.'
            );
        }

        if (inputs.estimateTaxBenefit && inputs.simulationYears > 4) {
            warnings.push(
                'The same tax assumptions are reused in every simulated year. Revisit federal and state deduction limits, standard deductions, and marginal rates for long holding periods.'
            );
        }

        if (inputs.monthlyNonHousingExpenses >= inputs.netMonthlyPay && inputs.annualAfterTaxBonus <= 0) {
            warnings.push(
                'Non-housing expenses consume all or more of regular monthly pay.'
            );
        }

        if (
            inputs.maxOwnershipPremiumMonthly > 0 &&
            assumptions.economicOwnershipPremiumMonthly >
                inputs.maxOwnershipPremiumMonthly
        ) {
            warnings.push(
                'The year-one economic ownership premium exceeds the lifestyle premium you entered.'
            );
        }

        return warnings;
    }

    return {
        MONTHS_PER_YEAR,
        annualToMonthlyRate,
        mortgagePayment,
        normalizeInputs,
        calculateAnnualTaxBenefitBreakdown,
        estimateAnnualIncrementalTaxBenefit,
        calculateSaleOutcome,
        simulate,
        findBreakEvenAppreciation,
        buildSensitivityMatrix,
        buildWarnings
    };
});
