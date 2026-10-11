import { CheapflightsTests as test, expect } from "../helpers/fixtures/cheapflightsTests"
import { addDays, Airports, InvalidAirports, NonsenseAirportText, parseFormDate, roundTrip, toIsoDate } from "../helpers/fixtures/flightSearch.data"
import { Header, SearchErrors } from "../helpers/selectors/homePage.selectors"
import { SortOrder } from "../helpers/selectors/searchResults.selectors"


test.describe("a. Home page header", () => {
    test.beforeEach(async ({ homePage }) => {
        await homePage.openHomePage()
    })

    test(`Validate the logo is displayed with correct link @smoke @header`, async ({ homePage }) => {
        await expect(homePage.logo).toBeVisible()
        await expect(homePage.logo.locator("svg")).toBeVisible()
        await expect(homePage.logo).toHaveAttribute("href", "/")            
    })

    test(`Validate the login (Sign in) button is displayed @smoke @header`, async ({ homePage }) => {
        await expect(homePage.signInButton).toBeVisible()
    })
})

test.describe("b. Search flights", () => {
    test.beforeEach(async ({ homePage }) => {
        await homePage.openHomePage()
    })

    test(`Validate the search form is displayed @smoke @search`, async ({ homePage }) => {
        await expect(homePage.originField).toBeVisible()
        await expect(homePage.destinationField).toBeVisible()
        await expect(homePage.departureDateButton).toBeVisible()
        await expect(homePage.returnDateButton).toBeVisible()
        await expect(homePage.searchButton).toBeVisible()
    })

    test(`Validate origin and destination can be selected @search`, async ({ homePage }) => {
        await homePage.selectOrigin(Airports.sydney)
        await homePage.selectDestination(Airports.melbourne)

        await expect(homePage.originField).toContainText("SYD")
        await expect(homePage.destinationField).toContainText("MEL")
    })

    test(`Validate a return trip search Brisbane to Sydney @search`, async ({ homePage, searchResultsPage }) => {
        const search = roundTrip(Airports.brisbane, Airports.sydney)

        const resultsTab = await homePage.searchFlights(search)
        searchResultsPage.switchTo(resultsTab)

        await expect(resultsTab).toHaveURL(/\/flight-search\/BNE-SYD\//)
        await searchResultsPage.waitForResults()
    })
})

test.describe("c. Flight search results", () => {
    const search = roundTrip(Airports.sydney, Airports.melbourne)

    test.beforeEach(async ({ searchResultsPage }) => {
        await searchResultsPage.openResults(search)
        await searchResultsPage.waitForResults()
    })

    test(`Validate flight results are returned @smoke @results`, async ({ searchResultsPage }) => {
        await expect(searchResultsPage.firstResult).toBeVisible()
    })

    test(`Validate the first result flies the searched route @smoke @results`, async ({ searchResultsPage }) => {
        // Sydney can also return Western Sydney (WSI), Melbourne can return Avalon (AVV)
        const origin = new RegExp(search.origin.areaCodes.join("|"))
        const destination = new RegExp(search.destination.areaCodes.join("|"))

        await expect(searchResultsPage.firstResult).toContainText(origin)
        await expect(searchResultsPage.firstResult).toContainText(destination)
    })

    test(`Validate the first result shows a price, flight times and an airline @results`, async ({ searchResultsPage }) => {
        await expect(searchResultsPage.firstResultPrice).toHaveText(/^\$[\d,]+$/)
        await expect(searchResultsPage.firstResultTimes).toHaveText(/\d{1,2}:\d{2}\s*–\s*\d{1,2}:\d{2}/)
        await expect(searchResultsPage.firstResultAirline).not.toBeEmpty()
    })
})

/**
 * Negative tests: each test makes exactly one input invalid and keeps everything
 * else valid, so a failure points to the single behaviour under test.
 * Expected behaviour for each case was observed on the live site.
 */
test.describe("d. Negative tests", () => {

    test.describe("Home page header", () => {
        test.beforeEach(async ({ homePage }) => {
            await homePage.openHomePage()
        })

        test(`Validate signing in with an invalid email shows an error @negative @header`, async ({ homePage }) => {
            await homePage.submitSignInEmail("not-an-email")
            await expect(homePage.signInEmailError).toHaveText(Header.invalidEmailMessage)
        })
    })

    test.describe("Search form", () => {
        test.beforeEach(async ({ homePage }) => {
            await homePage.openHomePage()
        })

        test(`Validate searching without a destination is blocked @negative @search`, async ({ page, homePage }) => {
            const { departDate, returnDate } = roundTrip(Airports.sydney, Airports.melbourne)

            await homePage.selectOrigin(Airports.sydney)
            await homePage.clearDestination()
            await homePage.selectDates(departDate, returnDate)
            await homePage.clickSearch()

            await expect(homePage.noAirportSelectedWarning).toBeVisible()
            await expect(page).not.toHaveURL(/\/flight-search\//)
        })

        test(`Validate an unknown airport name shows no suggestions @negative @search`, async ({ homePage }) => {
            const suggestionsFromApi = await homePage.typeDestinationAndWaitForSuggestions(NonsenseAirportText)

            expect(suggestionsFromApi, "airports returned by the autocomplete API").toBe(0)
            await expect(homePage.airportSuggestions).toHaveCount(0)
        })

        test(`Validate the same origin and destination is rejected @negative @search`, async ({ page, homePage }) => {
            const { departDate, returnDate } = roundTrip(Airports.sydney, Airports.sydney)

            await homePage.selectOrigin(Airports.sydney)
            await homePage.selectDestination(Airports.sydney)
            await homePage.selectDates(departDate, returnDate)
            await homePage.clickSearch()

            await expect(homePage.searchErrorAlert).toBeVisible()
            await expect(homePage.searchErrorAlert).toHaveText(SearchErrors.sameAirportsMessage)
            await expect(page).not.toHaveURL(/\/flight-search\//)
        })

        test(`Validate past dates cannot be selected @negative @search`, async ({ homePage }) => {
            await homePage.openCalendar()
            const today = await homePage.browserToday()

            await expect(homePage.previousMonthButton).toHaveAttribute("aria-disabled", "true")
            await expect(homePage.calendarDay(today)).not.toHaveAttribute("aria-disabled", "true")

            if (today.getDate() > 1) {
                await expect(homePage.calendarDay(addDays(today, -1))).toHaveAttribute("aria-disabled", "true")
            }
        })
    })

    test.describe("Search results", () => {
        test(`Validate an unknown airport code in the URL returns no results @negative @results`, async ({ page, searchResultsPage }) => {
            const search = roundTrip(InvalidAirports.unknownOrigin, InvalidAirports.unknownDestination)

            await searchResultsPage.openSearchUrl(search)

            await expect(page).toHaveURL(/errorOccurred=true/)
            await expect(page).not.toHaveURL(/\/flight-search\//)
            await expect(searchResultsPage.resultItems).toHaveCount(0)
        })

        test(`Validate a route with no flights shows "No flights found" @negative @results`, async ({ page, searchResultsPage }) => {
            const search = roundTrip(Airports.sydney, InvalidAirports.noFlights)

            await searchResultsPage.openSearchUrl(search)

            await expect(page).toHaveURL(/\/flight-search\/SYD-ZZZ\//)
            await expect(searchResultsPage.noFlightsFound).toBeVisible({ timeout: 60_000 })
            await expect(searchResultsPage.resultItems).toHaveCount(0)
        })
    })
})
