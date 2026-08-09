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
- Includes an optional tax model with **Generic federal** and **California (federal + CA)** modes, plus a visible year-one calculation bridge.
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

The estimate is tax savings, not reimbursement of mortgage interest. Choose **Generic — federal only** for a portable baseline or **California — federal + California** for a state-specific estimate.

The federal bridge compares renter and buyer itemized deductions after the federal SALT cap and the mortgage-interest debt limit. California mode adds a separate state calculation using California-allowed property-tax deductions and the state's $1,000,000 acquisition-debt limit for mortgage interest.

For the current personal planning defaults, the app is prefilled from the latest return shared during development:

- Federal SALT baseline: **$41,094**
- Other federal itemized deductions: **$0** as a 2026 planning default; the 2025 $785 charitable gift is below the new federal 0.5%-of-AGI floor at the current income level
- California AGI: **$482,372**
- Other California itemized deductions: **$1,676** ($891 personal-property tax + $785 charity)
- Federal marginal rate: **32%**
- California marginal rate: **9.3%**

These are editable. California's latest published 2025 standard deduction and itemized-deduction limitation threshold are used as planning defaults and should be updated for later tax years. The model warns if entered California AGI is above the limitation threshold; it does not try to reproduce the full high-income limitation worksheet.

The tax benefit is credited to the buyer portfolio at year-end and therefore affects buyer net worth, cumulative unrecoverable costs, net housing cost, and the economic ownership premium. It does **not** reduce the gross mortgage payment or gross housing cash outflow.

Use the manual annual homeowner-tax-benefit field only for a separate incremental amount not already counted by the selected tax model.
