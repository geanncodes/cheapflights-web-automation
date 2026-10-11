import { Locator, Page, TestInfo, expect } from "@playwright/test"
import { BasePage } from "./basePage.model"
import { SearchResults, SortOrder } from "../selectors/searchResults.selectors"
import { FlightSearch, parsePrice, resultsPath } from "../fixtures/flightSearch.data"

export type FlightResult = {
    price: number
    priceText: string
    times: string[]
    airline: string
    /** Airport codes in order, e.g. ["SYD", "MEL", "MEL", "SYD"] */
    airportCodes: string[]
}

export class SearchResultsPage extends BasePage {

    constructor(page: Page, worker: TestInfo) {
        super(page, worker)
    }

    get resultItems(): Locator { return this.page.locator(SearchResults.resultItem) }
    get firstResult(): Locator { return this.resultItems.first() }
    get firstResultPrice(): Locator { return this.firstResult.locator(SearchResults.price).first() }
    get firstResultTimes(): Locator { return this.firstResult.locator(SearchResults.flightTimes).first() }
    get firstResultAirline(): Locator { return this.firstResult.locator(SearchResults.airline).first() }
    get noFlightsFound(): Locator { return this.page.locator(SearchResults.noFlightsFound).first() }

    /**
     * Opens a results URL as-is, for negative tests where the site is expected to
     * redirect or show a message instead of results (no waiting for results)
     */
    async openSearchUrl(search: FlightSearch) {
        await this.navigateToPage(resultsPath(search))
    }

    /** @param name - "Best", "Cheapest" or "Quickest" */
    sortTab(name: string): Locator { return this.page.locator(SearchResults.sortTab(name)).first() }

    /**
     * Clicks a sort tab and waits for the re-sorted results
     * @param name - "Best", "Cheapest" or "Quickest"
     * @param urlValue - the matching SortOrder value the URL should switch to
     */
    async sortBy(name: string, urlValue: string) {
        await this.sortTab(name).click()
        await expect(this.page).toHaveURL(new RegExp(`sort=${urlValue}`))
        await expect(this.sortTab(name)).toHaveAttribute("aria-selected", "true")
        await this.waitForResults()
    }

    /** Reads the price shown on a sort tab, e.g. "Cheapest $128 • 1h 30m" gives 128 */
    async sortTabPrice(name: string): Promise<number> {
        const text = await this.sortTab(name).innerText()
        return parsePrice(text.match(/\$[\d,]+/)?.[0] ?? "")
    }

    /**
     * Opens the results page directly, without using the search form
     * @param search - route and dates
     * @param sort - one of SortOrder, defaults to Best
     */
    async openResults(search: FlightSearch, sort: string = SortOrder.best) {
        await this.navigateToPage(`${resultsPath(search)}?sort=${sort}`)
    }

    async waitForResults() {
        await this.skipIfBlockedByBotProtection()
        await expect(this.resultItems.first(), "first flight result").toBeVisible({ timeout: 60_000 })

        await expect(this.page.locator(SearchResults.progress).first())
            .not.toContainText(/complete/i, { timeout: 60_000 })
            .catch(() => {})
    }

    /**
     * Reads the first results into plain objects for assertions
     * @param limit - number of results to read
     */
    async readResults(limit = 5): Promise<FlightResult[]> {
        const count = Math.min(limit, await this.resultItems.count())
        const results: FlightResult[] = []

        for (let i = 0; i < count; i++) {
            const item = this.resultItems.nth(i)
            const priceText = (await item.locator(SearchResults.price).first().innerText()).trim()
            const legInfo = (await item.locator(SearchResults.flightTimes).allInnerTexts()).map(t => t.replace(/\s+/g, " ").trim())
            const times = legInfo.filter(t => /^\d{1,2}:\d{2}\s*–/.test(t))
            const airline = (await item.locator(SearchResults.airline).first().innerText().catch(() => "")).trim()

            const airportCodes = await item.evaluate(el =>
                [...el.querySelectorAll("*")]
                    .filter(node => node.children.length === 0 && /^[A-Z]{3}$/.test((node as HTMLElement).innerText))
                    .map(node => (node as HTMLElement).innerText)
            )

            results.push({ price: parsePrice(priceText), priceText, times, airline, airportCodes })
        }
        return results
    }
}
