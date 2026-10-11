/**
 * Home page selectors for https://www.cheapflights.com.au/
 * Verified against the live site. Class names on this site are generated
 * (e.g. "gPDR-main-logo-link"), so aria-labels and roles are preferred.
 */
export const

Header = {
    logo: `a[aria-label="Go to the cheapflights homepage"]`,
    signInButton: `[role="button"][aria-label="Sign in"]`,

    /**
     * Sign-in pop-up. The role="dialog" element can be 0px high, so check
     * visibility on the heading or buttons inside it, not on the dialog itself.
     */
    signInDialogHeading: `[role="dialog"][aria-label="Sign in or create an account"] h1`,
    signInWithEmail: `[role="dialog"][aria-label="Sign in or create an account"] button:has-text("Continue with email")`,

    /** Email step, shown after "Continue with email". name="email" skips a hidden password input with the same aria-label. */
    signInEmailInput: `[role="dialog"][aria-label="Sign in or create an account"] input[name="email"]`,
    signInEmailSubmit: `[role="dialog"][aria-label="Sign in or create an account"] form button[type="submit"]`,
    signInEmailError: `[role="dialog"][aria-label="Sign in or create an account"] [role="alert"]`,
    invalidEmailMessage: `That email format is not correct.`,
},

SearchForm = {
    originWrapper: `[aria-label="Flight origin input"]`,
    originInput: `input[aria-label="Origin location"]`,
    destinationWrapper: `[aria-label="Flight destination input"]`,
    destinationInput: `input[aria-label="Destination location"]`,
    airportOption: (code: string) => `li[role="option"][id^="${code}_"]`,

    departureDate: `[role="button"][aria-label="Departure date"]`,
    returnDate: `[role="button"][aria-label="Return date"]`,
    /**
     * Prefix match on purpose: once a route is chosen the label becomes
     * "October 27 2026 Prices on this day are below average", and after a
     * click "October 27 2026. Selected as start date. ..."
     */
    calendarDay: (label: string) => `[role="button"][aria-label^="${label}"]:visible`,
    nextMonth: `[role="button"][aria-label="Next month"]:visible`,
    previousMonth: `[role="button"][aria-label="Previous month"]:visible`,

    /**
     * "Compare vs." partner checkboxes (e.g. Trip.com), ticked by default.
     * When ticked, Search sends the current tab to the partner site and opens
     * the results in a pop-up, so the tests untick them first.
     */
    compareSiteCheckbox: `input[type="checkbox"][id^="pres-default-"]`,

    searchButton: `button[type="submit"][aria-label="Search"]`,

    /** Autocomplete API the airport fields call on every keystroke: POST /mvm/smartyv2/search?where=<text> */
    airportSuggestionsApi: `/mvm/smartyv2/search`,
},

/**
 * Validation pop-ups shown when Search is clicked with invalid input.
 * Like the sign-in pop-up, their role="dialog" wrappers are 0px high,
 * so visibility is checked on the text inside them.
 */
SearchErrors = {
    noAirportSelected: `[role="dialog"] >> text=/You didn.t select an airport/`,
    errorAlert: `[role="dialog"] [role="alert"]`,
    sameAirportsMessage: /Please enter unique .From. and .To. airports/,
},

BotProtection = [
    'iframe[src*="captcha" i]',
    '#px-captcha',
    'form[action*="captcha" i]',
]
