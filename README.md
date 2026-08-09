# Rent vs. Buy Decision Model

A browser-based calculator that compares renting and buying using two separate questions:

1. **Affordability:** What happens to monthly cash flow?
2. **Net worth:** Which scenario produces more wealth after a chosen holding period?

This version replaces the original annual model with a monthly simulation and makes previously implicit assumptions explicit.

## Major improvements

- Renames `Monthly Expenses` to **Monthly non-housing expenses** to prevent double-counting rent or ownership costs.
- Uses **after-tax** bonus and investment-return inputs.
- Compounds investment returns and home appreciation monthly.
- Adds monthly cash surplus or deficit to each scenario's portfolio.
- Removes the buyer's down payment, closing costs, repairs, and supplemental tax from liquid savings.
- Makes selling costs configurable rather than hardcoding 6%.
- Separates property-tax growth from home appreciation.
- Uses an annual insurance quote instead of a percentage of home value.
- Adds maintenance/capital-reserve growth, HOA growth, PMI, ADU income, renter insurance, and moving costs.
- Calculates buyer net worth net of the remaining mortgage, selling costs, and optional gain tax.
- Includes a simplified optional federal tax-benefit estimate with a visible year-one calculation bridge.
- Adds emergency-fund checks, negative-cash-flow warnings, and a lifestyle ownership-premium input.
- Adds a year-one monthly expense overview with rent, principal, interest, tax, insurance, maintenance, HOA, PMI, and totals.
- Adds 5/10/15/etc. holding-period support, break-even year, break-even appreciation, and a 3×3 sensitivity matrix.
- Includes dependency-free model tests.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Chart.js is loaded from a CDN, so charts require an internet connection. The calculations themselves run locally.

## Run tests

Node.js 18+ is recommended.

```bash
npm test
```

The tests use only Node's built-in `assert` module.

## Input guidance

### Monthly non-housing expenses

Do **not** enter total monthly spending if it already includes rent.

Example:

- Total current spending: $8,000
- Current rent: $5,500
- Monthly non-housing expenses to enter: $2,500

### Investment return

Enter the expected return **after taxes, fees, and portfolio drag**. Use multiple scenarios rather than relying on a single forecast.

### Home appreciation

Use a range. The sensitivity matrix automatically compares:

- 0%, 2%, and 4% annual home appreciation
- 4%, 6%, and 8% after-tax investment returns

### Property tax

Enter the address-specific first-year tax rate. Property-tax growth is modeled separately from market appreciation.

### Insurance

Use an address-specific annual quote. This can be materially different for wildfire, flood, or other higher-risk properties.

### Maintenance

Enter a long-term annual reserve, not only expected routine repairs. Include irregular capital projects such as roofing, drainage, retaining walls, decks, HVAC, sewer work, and exterior maintenance.

### ADU income

Enter **net** income after vacancy, utilities, maintenance, management, and taxes.

### Tax benefit

The estimate is tax savings, not reimbursement of mortgage interest. The dashboard shows the full year-one bridge:

1. Mortgage interest paid and the average mortgage balance.
2. The deductible share of interest under the entered debt limit.
3. Renter and buyer SALT deductions after the entered cap.
4. Renter and buyer itemized deductions compared with the standard deduction.
5. The incremental buyer deduction multiplied by the entered federal marginal rate.
6. Any manual additional benefit and the monthly equivalent used by the model.

The model credits the benefit to the buyer portfolio at each year-end. It reduces buyer unrecoverable costs and the economic ownership premium, but it does not reduce gross mortgage or housing cash outflow.

Use renter-side California income tax and other deductible state/local taxes in **Other annual state/local taxes**. Do not include the prospective property's tax there because the model adds it separately. Use the manual annual tax-benefit field only when tax software or a tax professional provides a better federal or California-specific estimate.

The same entered tax rules are reused in every simulated year, so revisit them for long holding periods.

## Calculation methodology

The model simulates every month:

1. Grow income, non-housing expenses, rent, property tax, insurance, maintenance, HOA, and ADU income using their separate annual growth assumptions.
2. Calculate mortgage interest and principal from the remaining balance.
3. Add each scenario's monthly surplus or deficit to its investment portfolio.
4. Compound positive portfolio balances monthly at the entered after-tax return.
5. Compound the home value monthly.
6. At year end, estimate any incremental homeowner tax benefit.
7. Calculate buyer net worth as:

```text
Investment portfolio
+ home value
- remaining mortgage
- selling costs
- estimated capital-gains tax
```

Renter net worth is the renter's investment portfolio.

## Important limitations

This is a planning tool, not financial, tax, legal, lending, appraisal, or insurance advice.

The model does not currently include:

- Refinancing
- Adjustable-rate mortgages
- Opportunity cost of time spent maintaining a home
- State-specific income-tax deduction rules
- Depreciation or tax treatment for a rented ADU
- Detailed capital-improvement basis tracking
- Brokerage-account tax-lot realization
- Different borrowing rates when a portfolio becomes negative
- Uncertain or stochastic returns

Use conservative, base, and optimistic inputs and verify property-specific costs before making a decision.
