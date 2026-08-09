const assert = require('node:assert/strict');
const Model = require('../model.js');

function closeTo(actual, expected, tolerance, message) {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${message}: expected ${expected}, received ${actual}`
    );
}

(function testMortgagePayment() {
    const payment = Model.mortgagePayment(1_155_000, 0.06, 30);
    closeTo(payment, 6924.57, 1, '30-year mortgage payment');
})();

(function testUpfrontCashAndYearOneOutputs() {
    const result = Model.simulate({
        simulationYears: 10,
        holdingPeriodYears: 10,
        netMonthlyPay: 13000,
        monthlyNonHousingExpenses: 2500,
        annualAfterTaxBonus: 30000,
        liquidInvestableSavings: 1400000,
        afterTaxInvestmentReturn: 0.06,
        monthlyRent: 5500,
        annualRentIncrease: 0.03,
        homePrice: 1500000,
        downPaymentPercent: 0.23,
        mortgageInterestRate: 0.06,
        buyingClosingCostsPercent: 0.02,
        propertyTaxRate: 0.013,
        annualPropertyTaxGrowth: 0.02,
        annualHomeInsurance: 3750,
        annualMaintenance: 12000,
        annualHomeAppreciation: 0.02,
        sellingCostsPercent: 0.06
    });

    closeTo(result.assumptions.downPayment, 345000, 0.01, 'down payment');
    closeTo(result.assumptions.buyingClosingCosts, 30000, 0.01, 'closing costs');
    closeTo(result.assumptions.buyerUpfrontCash, 375000, 0.01, 'upfront cash');
    assert.equal(result.annualResults.length, 10);
    assert.ok(result.yearOne.buyer.annualMortgagePrincipal > 0);
    assert.ok(result.yearOne.buyer.annualMortgageInterest > 0);
    assert.ok(result.selected.buyer.mortgageBalance < result.assumptions.originalLoan);
})();

(function testPropertyTaxGrowthIsIndependentFromHomeAppreciation() {
    const result = Model.simulate({
        simulationYears: 2,
        holdingPeriodYears: 2,
        liquidInvestableSavings: 1000000,
        homePrice: 1000000,
        downPaymentPercent: 1,
        propertyTaxRate: 0.01,
        annualPropertyTaxGrowth: 0.02,
        annualHomeAppreciation: 0.10,
        annualHomeInsurance: 0,
        annualMaintenance: 0,
        monthlyRent: 0,
        netMonthlyPay: 0,
        monthlyNonHousingExpenses: 0,
        afterTaxInvestmentReturn: 0,
        sellingCostsPercent: 0
    });

    closeTo(result.annualResults[0].buyer.annualPropertyTax, 10000, 0.01, 'year-one property tax');
    closeTo(result.annualResults[1].buyer.annualPropertyTax, 10200, 0.01, 'year-two property tax');
})();

(function testSellingCostIsConfigurable() {
    const noSellingCost = Model.simulate({
        simulationYears: 1,
        holdingPeriodYears: 1,
        liquidInvestableSavings: 1000000,
        homePrice: 500000,
        downPaymentPercent: 1,
        netMonthlyPay: 0,
        monthlyNonHousingExpenses: 0,
        monthlyRent: 0,
        afterTaxInvestmentReturn: 0,
        annualHomeAppreciation: 0,
        propertyTaxRate: 0,
        annualHomeInsurance: 0,
        annualMaintenance: 0,
        buyingClosingCostsPercent: 0,
        sellingCostsPercent: 0
    });

    const sixPercentSellingCost = Model.simulate({
        ...noSellingCost.inputs,
        sellingCostsPercent: 0.06
    });

    closeTo(
        noSellingCost.selected.buyer.netWorth - sixPercentSellingCost.selected.buyer.netWorth,
        30000,
        0.01,
        'six-percent selling cost'
    );
})();

(function testTaxBenefitComparesAgainstRenterDeduction() {
    const inputs = Model.normalizeInputs({
        estimateTaxBenefit: true,
        homePrice: 1500000,
        downPaymentPercent: 0.23,
        mortgageInterestDeductionLimit: 750000,
        standardDeduction: 32200,
        saltCap: 40400,
        annualOtherStateLocalTaxes: 20000,
        annualOtherItemizedDeductions: 0,
        federalMarginalTaxRate: 0.32
    });

    const benefit = Model.estimateAnnualIncrementalTaxBenefit(
        inputs,
        70000,
        19500
    );

    assert.ok(benefit > 0);
    assert.ok(benefit < 70000 * 0.32);
})();

(function testTaxBenefitBreakdownAndNetWorthReflection() {
    const baseInputs = {
        simulationYears: 1,
        holdingPeriodYears: 1,
        netMonthlyPay: 0,
        monthlyNonHousingExpenses: 0,
        annualAfterTaxBonus: 0,
        liquidInvestableSavings: 2_000_000,
        afterTaxInvestmentReturn: 0,
        monthlyRent: 0,
        renterInsuranceMonthly: 0,
        homePrice: 1_500_000,
        downPaymentPercent: 0.23,
        mortgageInterestRate: 0.06,
        mortgageTermYears: 30,
        buyingClosingCostsPercent: 0,
        propertyTaxRate: 0.013,
        annualPropertyTaxGrowth: 0,
        annualHomeInsurance: 0,
        annualMaintenance: 0,
        annualHomeAppreciation: 0,
        sellingCostsPercent: 0,
        estimateTaxBenefit: true,
        federalMarginalTaxRate: 0.32,
        standardDeduction: 32_200,
        mortgageInterestDeductionLimit: 750_000,
        saltCap: 40_400,
        annualOtherStateLocalTaxes: 0,
        annualOtherItemizedDeductions: 0
    };

    const withTax = Model.simulate(baseInputs);
    const withoutTax = Model.simulate({ ...baseInputs, estimateTaxBenefit: false });
    const breakdown = withTax.yearOne.buyer.taxBenefitBreakdown;

    assert.ok(breakdown.deductibleMortgageInterestShare > 0);
    assert.ok(breakdown.deductibleMortgageInterestShare < 1);
    assert.ok(breakdown.incrementalDeduction > 0);
    closeTo(
        breakdown.totalBenefit,
        withTax.yearOne.buyer.annualTaxBenefit,
        0.01,
        'breakdown total matches annual tax benefit'
    );
    closeTo(
        withTax.selected.buyer.netWorth - withoutTax.selected.buyer.netWorth,
        breakdown.totalBenefit,
        0.01,
        'tax benefit is added to buyer net worth'
    );
})();

(function testSensitivityMatrix() {
    const matrix = Model.buildSensitivityMatrix({
        simulationYears: 5,
        holdingPeriodYears: 5
    });
    assert.equal(matrix.cells.length, 3);
    assert.equal(matrix.cells[0].length, 3);
})();

console.log('All model tests passed.');
