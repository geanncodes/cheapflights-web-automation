/**
 * Flight search results page selectors.
 * "Result item N" only matches real flight results; ads and sponsored
 * placements between results are not labelled this way, so they are excluded.
 */
export const

SearchResults = {
    resultItem: `[aria-label^="Result item"]`,
    price: `.e2GB-price-text`,
    flightTimes: `.vmXl`,
    airline: `.J0g6-operator-text`,

    progress: `.uzk6-progress`,

    /**
     * Exact text match on purpose: a hidden screen-reader copy of this message
     * has invisible characters appended, so it is not matched
     */
    noFlightsFound: `text="No flights found"`,

    /** Sort tabs at desktop width, e.g. "Cheapest $128 • 1h 30m" with aria-selected="true|false" */
    sortTab: (name: string) => `[role="button"][aria-label="${name}"][aria-selected]`,
},

SortOrder = {
    best: "bestflight_a",
    cheapest: "price_a",
    quickest: "duration_a",
}
