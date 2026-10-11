import { test as base } from "@playwright/test"
import { HomePage } from "../pageObjects/homePage.model"
import { SearchResultsPage } from "../pageObjects/searchResults.model"

export type cheapflightsTests = {
    homePage: HomePage
    searchResultsPage: SearchResultsPage
}

export const CheapflightsTests = base.extend<cheapflightsTests>({
    homePage: async ({ page }, use, worker) => {
        const homePage = new HomePage(page, worker)
        await use(homePage)
    },
    searchResultsPage: async ({ page }, use, worker) => {
        const searchResultsPage = new SearchResultsPage(page, worker)
        await use(searchResultsPage)
    },
})

export { expect } from "@playwright/test"
