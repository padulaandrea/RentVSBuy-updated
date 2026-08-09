# Feedback-to-Implementation Map

This file maps the decision-model feedback to the updated application.

| Feedback | Implementation |
|---|---|
| Clarify whether monthly expenses include rent | Renamed the input to **Monthly non-housing expenses** and added an example directly in the page header. |
| Separate affordability from investment performance | Added a year-one affordability table and a separate long-term net-worth comparison. |
| Use after-tax bonus | Renamed the bonus input to **After-tax stock/bonus per year**. |
| Avoid relying on one 8% stock-return assumption | Renamed the input to **After-tax investment return** and added a 4%/6%/8% sensitivity matrix. |
| Test multiple home-appreciation rates | Added a 0%/2%/4% appreciation sensitivity matrix and break-even appreciation calculation. |
| Model property tax correctly | Property tax has its own initial rate and annual growth rate, independent from home appreciation. |
| Use an address-specific insurance quote | Insurance is entered as an annual dollar amount, with a separate annual growth assumption. |
| Include major maintenance and capital projects | Maintenance is entered as an annual reserve with its own growth rate. |
| Avoid overstating tax benefits | Added an optional incremental tax estimator that compares buyer and renter deductions, plus a manual tax-benefit input. |
| Add complete transaction costs | Added buying closing costs, immediate repairs, supplemental tax, configurable selling costs, and optional gain tax. |
| Compare multiple holding periods | Added a selectable holding period and up to a 50-year chart horizon. |
| Compare equivalent properties | Renamed rent to **Monthly rent for a comparable home** and added a comparable-home checklist. |
| Include lifestyle value | Added an optional maximum monthly ownership premium and a warning when the economic premium exceeds it. |
| Track the down-payment opportunity cost | Buyer savings are reduced by the full upfront purchase cash; renter savings remain invested. |
| Invest the renter's monthly savings | Each scenario's monthly surplus or deficit is added to its portfolio. |
| Do not double-count mortgage principal | Principal reduces the loan and builds equity; only interest is treated as unrecoverable. |
| Remove hardcoded assumptions | Income growth, expense inflation, property-tax growth, insurance growth, maintenance growth, HOA growth, ADU growth, and selling costs are all inputs. |
| Improve timing accuracy | Replaced annual contribution/return calculations with a monthly simulation. |
| Stress affordability | Added emergency-fund and negative-monthly-cash-flow warnings. |
| Account for low down payments | Added PMI and automatic removal at the entered LTV threshold. |
| Treat ADU income conservatively | ADU input is explicitly labeled as net income after vacancy, expenses, and taxes. |
| Make the model testable | Moved financial logic into `model.js` and added Node tests in `tests/model.test.js`. |


## Browser reliability fix

- Replaced the invalid string assignment to `HTMLTableElement.caption` with a real `<caption>` element.
- Calculation errors now force the results section to become visible instead of failing silently.
- Chart.js loads asynchronously, so an unavailable CDN cannot block the calculator UI or core calculations.
- Charts render automatically when Chart.js finishes loading after the initial calculation.

## Ownership-cost visibility update

The results panel now displays the year-one monthly property tax, annual property tax, and monthly homeowners-insurance amount. These figures are derived from the existing annual inputs, so the monthly and annual values always remain synchronized.

## PMI threshold usability

- Clarified that the PMI removal LTV is an advanced, lender-specific assumption.
- Added the note: “The 80% field matters only when the down payment is below 20%.”
- The field is disabled when the down payment is at least 20% and monthly PMI is $0, because it has no effect on the calculation.
- The helper text displays the starting LTV so users can see why PMI is not applicable.


## Monthly expense overview

Added a year-one monthly comparison table that breaks out rent and ownership costs into:

- Base rent and renter insurance
- Mortgage principal and interest
- Property tax and homeowners insurance
- Maintenance reserve, HOA, and PMI
- Gross housing outflow
- ADU income and estimated tax benefit
- Net housing cost, total monthly spending, and amount remaining to invest

Mortgage principal is displayed separately so users can distinguish cash outflow from unrecoverable expense.


## Tax estimate transparency

The results now include a year-one tax calculation bridge showing mortgage interest paid, average mortgage balance, deductible interest share, renter and buyer SALT deductions, standard-versus-itemized deductions, incremental deduction, marginal rate, annual benefit, and monthly equivalent.

The mortgage-interest limit now uses the year's average mortgage balance rather than the original loan balance for every year. The tax benefit continues to be credited to the buyer portfolio annually and is reflected in buyer net worth, cumulative unrecoverable costs, net housing cost, and the economic ownership premium. Gross housing cash outflow remains unchanged.

The input guidance now clarifies 2026 married-filing-jointly defaults, renter-side state/local taxes, the SALT income phase-down caveat, and the role of the manual benefit field.
