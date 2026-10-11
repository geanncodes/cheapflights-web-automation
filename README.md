# Cheapflights Web Automation
Web automation tests for [cheapflights.com.au](https://www.cheapflights.com.au/) through Playwright and TypeScript

## Requirements

|Requirement                                                   |Status              |Spec                                         |
|--------------------------------------------------------------|--------------------|---------------------------------------------|
|a. Validate the logo and login button are displayed           | :white_check_mark: | `a. Home page header` in `tests/cheapflights.spec.ts` |
|b. Search flights                                             | :white_check_mark: | `b. Search flights` in `tests/cheapflights.spec.ts` |
|c. Assertions for flight search results                       | :white_check_mark: | `c. Flight search results` in `tests/cheapflights.spec.ts` |
|Negative tests for a, b and c                                 | :white_check_mark: | `d. Negative tests` in `tests/cheapflights.spec.ts` |

## Test Coverage

|Test                                                     |Tags                 |
|---------------------------------------------------------|---------------------|
|Page loads with the Cheapflights title                   |`@smoke @header`     |
|Logo is displayed                                        |`@smoke @header`     |
|Logo links to the home page                              |`@header`            |
|Login (Sign in) button is displayed and enabled          |`@smoke @header`     |
|Sign in opens the sign-in dialog                         |`@header`            |
|Search form is displayed                                 |`@smoke @search`     |
|Origin and destination can be selected                   |`@search`            |
|Return trip search Sydney to Melbourne                   |`@smoke @search`     |
|Return trip search Brisbane to Sydney                    |`@search`            |
|Flight results are returned                              |`@smoke @results`    |
|Each result flies the searched route                     |`@smoke @results`    |
|Each result shows a price, flight times and an airline   |`@results`           |
|Sorting by Cheapest lists prices in ascending order      |`@results`           |

### Negative tests (`d. Negative tests`)

Each negative test makes exactly one input invalid. The expected behaviour of every case was observed on the live site first.

|Test                                                     |Expected behaviour (observed on the site)                     |Tags                   |
|---------------------------------------------------------|---------------------------------------------------------------|-----------------------|
|Closing the sign-in dialog returns to the page           |Pop-up is removed, Sign in button is usable                    |`@negative @header`    |
|Searching without a destination is blocked               |"You didn't select an airport" pop-up, no results page          |`@negative @search`    |
|An unknown airport name shows no suggestions             |Autocomplete API returns `[]`, no suggestions shown             |`@negative @search`    |
|The same origin and destination is rejected              |Alert "Please enter unique 'From' and 'To' airports."           |`@negative @search`    |
|Past dates cannot be selected                            |Days before today and "Previous month" are `aria-disabled`      |`@negative @search`    |
|A return date before the departure becomes the new departure |The earlier date replaces the departure; return is never before departure |`@negative @search` |
|An unknown airport code in the URL returns no results    |Redirect to the home page with `errorOccurred=true`             |`@negative @results`   |
|A route with no flights shows "No flights found"         |SYD → ZZZ (a real airport code with no flights) shows the message |`@negative @results` |

## Project Structure

```
├── .github/workflows/playwright.yml      # GitHub Actions: runs the tests on push / PR
├── helpers
│   ├── fixtures
│   │   ├── cheapflightsTests.ts          # Extends Playwright test with homePage and searchResultsPage
│   │   └── flightSearch.data.ts          # Airports, dates and other test data
│   ├── pageObjects
│   │   ├── basePage.model.ts             # Navigation, cookie banner, bot protection check
│   │   ├── homePage.model.ts             # Header, search form, calendar
│   │   └── searchResults.model.ts        # Result items, prices, times, route
│   └── selectors
│       ├── homePage.selectors.ts
│       └── searchResults.selectors.ts
├── tests
│   └── cheapflights.spec.ts
└── playwright.config.ts
```

## Setup

```
npm install
npx playwright install chromium
```

Commit the generated `package-lock.json`. The GitHub Actions workflow uses `npm ci`, which requires it.

## Running the tests

|Command                  |Description                       |
|-------------------------|----------------------------------|
|`npm test`               | Run all tests                    |
|`npm run test:headed`    | Run all tests with the browser visible |
|`npm run test:smoke`     | Run `@smoke` tests only          |
|`npm run test:header`    | Run requirement a                |
|`npm run test:search`    | Run requirement b                |
|`npm run test:results`   | Run requirement c                |
|`npm run test:negative`  | Run the negative tests only      |
|`npm run test:ui`        | Open Playwright UI mode          |
|`npm run test:ui:headed` | UI mode with a real browser window (macOS / Linux) |
|`npm run report`         | Open the last HTML report        |
|`npm run build`          | Type check the project           |

## Notes

* **Selectors** were taken from the live site. The site's class names are generated, so `aria-label` and `role` attributes are used wherever possible. If the site changes, only the files in `helpers/selectors` need updating.
* **Dates** are always about 3 weeks ahead with a one week stay, so the tests never search for dates in the past.
* **Live data.** Prices and flights change all the time, so assertions check the structure and validity of results (e.g. price is a positive amount, route matches) and never exact values.
* **Nearby airports.** A Melbourne search can also return Avalon (AVV) and a Sydney search can return Western Sydney (WSI), so route assertions accept every airport in the city's area.
* **Requirement c** opens the results URL directly, so a broken search form only fails the requirement b tests.

### Site behaviour the tests handle

Found by stepping through every test against the live site:

|Behaviour                                                                 |Handling                                   |
|--------------------------------------------------------------------------|-------------------------------------------|
|Origin is pre-filled from the visitor's location, destination from the last search | Cleared with Backspace before typing; then a guard checks exactly one airport is selected |
|Calendar day labels change once a route is picked ("October 27 2026 Prices on this day are below average") | Calendar days are matched by prefix (`aria-label^=`) |
|Calendar opens by itself after the destination is picked                   | Only opened if not already open; picked dates are verified on the form |
|"Compare vs." partner sites (e.g. Trip.com) are ticked by default; Search then sends the tab to the partner site and opens results in a pop-up | Unticked before every search |
|Results stream in ("25% complete.")                                         | Waits for the progress bar to finish before reading results |
|Sort control is tabs at desktop width (a dropdown on narrow screens)        | Viewport fixed at 1440×900; tests click the "Cheapest" tab |

## Known Limitations

* **Bot protection.** Cheapflights (Kayak group) may show a CAPTCHA to automated browsers, especially headless runs from cloud servers such as GitHub Actions. When that happens the affected tests are **skipped** with an explanation instead of failing. `npm run test:headed` on a local machine is the most reliable way to run the suite.
