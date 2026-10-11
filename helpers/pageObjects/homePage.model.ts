import { Locator, Page, TestInfo, expect } from "@playwright/test"
import { BasePage } from "./basePage.model"
import { Header, SearchErrors, SearchForm } from "../selectors/homePage.selectors"
import { Airport, FlightSearch, toCalendarLabel, toFormDate } from "../fixtures/flightSearch.data"

export class HomePage extends BasePage {

    constructor(page: Page, worker: TestInfo) {
        super(page, worker)
    }

    get logo(): Locator { return this.page.locator(Header.logo) }
    get signInButton(): Locator { return this.page.locator(Header.signInButton).first() }
    get signInDialogHeading(): Locator { return this.page.locator(Header.signInDialogHeading).first() }
    get signInWithEmail(): Locator { return this.page.locator(Header.signInWithEmail).first() }
    get signInEmailInput(): Locator { return this.page.locator(Header.signInEmailInput) }
    get signInEmailSubmit(): Locator { return this.page.locator(Header.signInEmailSubmit) }
    get signInEmailError(): Locator { return this.page.locator(Header.signInEmailError) }

    get originField(): Locator { return this.page.locator(SearchForm.originWrapper) }
    get destinationField(): Locator { return this.page.locator(SearchForm.destinationWrapper) }
    get departureDateButton(): Locator { return this.page.locator(SearchForm.departureDate).first() }
    get returnDateButton(): Locator { return this.page.locator(SearchForm.returnDate).first() }
    get searchButton(): Locator { return this.page.locator(SearchForm.searchButton).first() }
    get destinationInput(): Locator { return this.page.locator(SearchForm.destinationInput) }
    get airportSuggestions(): Locator { return this.page.locator(`li[role="option"]:visible`) }
    get previousMonthButton(): Locator { return this.page.locator(SearchForm.previousMonth).first() }
    get noAirportSelectedWarning(): Locator { return this.page.locator(SearchErrors.noAirportSelected).first() }
    get searchErrorAlert(): Locator { return this.page.locator(SearchErrors.errorAlert).first() }

    /** @param date - a day in the open calendar */
    calendarDay(date: Date): Locator {
        return this.page.locator(SearchForm.calendarDay(toCalendarLabel(date))).first()
    }

    async openHomePage() {
        await this.navigateToPage("")
    }

    /**
     * Clicks Sign in until the pop-up appears. A click that lands before the page's
     * JavaScript is ready does nothing, so a single click can silently fail.
     */
    async openSignIn() {
        await expect(async () => {
            if (!(await this.signInDialogHeading.isVisible())) {
                await this.signInButton.click()
            }
            // Not the dialog element itself: it is a 0px-high wrapper (see the sign-in note in Header)
            await expect(this.signInDialogHeading).toBeVisible({ timeout: 5_000 })
        }, "sign-in pop-up to open").toPass({ timeout: 30_000 })
    }

    /**
     * Use this method to clear a field and type an airport
     * @param wrapper - origin or destination field
     * @param input - the text input that appears once the field is clicked
     * @param query - text to type, e.g. "Sydney"
     */
    async typeAirport(wrapper: string, input: string, query: string) {
        const field = this.page.locator(input)

        await expect(async () => {
            const isFocused = await field.evaluate(el => el === document.activeElement).catch(() => false)
            if (!isFocused) {
                await this.page.locator(wrapper).click()
            }
            await expect(field).toBeFocused({ timeout: 3_000 })
        }, "airport field to be ready for typing").toPass({ timeout: 30_000 })

        await field.fill("")

        for (let i = 0; i < 3; i++) {
            await field.press("Backspace")
        }

        await field.pressSequentially(query, { delay: 100 })
    }

    async selectAirport(wrapper: string, input: string, airport: Airport) {
        await this.typeAirport(wrapper, input, airport.query)
        const option = this.page.locator(SearchForm.airportOption(airport.code)).first()
        await expect(option, `suggestion for ${airport.query} (${airport.code})`).toBeVisible()
        await option.click()

        await expect(this.page.locator(wrapper)).toHaveText(new RegExp(`^[^()]*\\(${airport.code}\\)$`))
    }

    /** Opens the sign-in pop-up, picks "Continue with email" and submits the given email */
    async submitSignInEmail(email: string) {
        await this.openSignIn()
        await this.signInWithEmail.click()
        await this.signInEmailInput.fill(email)
        await this.signInEmailSubmit.click()
    }

    /**
     * Types into the destination field and waits for the site's autocomplete
     * response for exactly that text, so "no suggestions" can't be asserted
     * before the suggestions have had a chance to load.
     * @returns the number of airports the autocomplete API returned
     */
    async typeDestinationAndWaitForSuggestions(query: string): Promise<number> {
        const response = this.page.waitForResponse(res =>
            res.url().includes(SearchForm.airportSuggestionsApi) &&
            new URL(res.url()).searchParams.get("where") === query
        )
        await this.typeAirport(SearchForm.destinationWrapper, SearchForm.destinationInput, query)
        const body = await (await response).json()
        return Array.isArray(body) ? body.length : -1
    }

    async clearDestination() {
        await this.typeAirport(SearchForm.destinationWrapper, SearchForm.destinationInput, "")
        await this.page.keyboard.press("Escape")
        await expect(this.destinationField).toHaveText("")
    }

    async selectOrigin(airport: Airport) {
        await this.selectAirport(SearchForm.originWrapper, SearchForm.originInput, airport)
    }

    async selectDestination(airport: Airport) {
        await this.selectAirport(SearchForm.destinationWrapper, SearchForm.destinationInput, airport)
    }

    /**
     * Clicks a day in the open calendar, moving forward a month at a time if needed
     * @param date - day to select
     */
    async selectCalendarDay(date: Date) {
        const day = this.calendarDay(date)
        for (let i = 0; i < 12 && !(await day.isVisible()); i++) {
            await this.page.locator(SearchForm.nextMonth).first().click()
        }
        await expect(day, `calendar day ${toCalendarLabel(date)}`).toBeVisible()
        await day.click()
    }

    /** The calendar opens by itself after a destination is picked; only open it if it isn't */
    async openCalendar() {
        const calendarOpen = await this.page.locator(SearchForm.nextMonth).first().isVisible()
        if (!calendarOpen) {
            await this.departureDateButton.click()
        }
        await expect(this.page.locator(SearchForm.nextMonth).first()).toBeVisible()
    }

    async selectDates(departDate: Date, returnDate: Date) {
        await this.openCalendar()
        await this.selectCalendarDay(departDate)
        await this.selectCalendarDay(returnDate)
        await this.page.keyboard.press("Escape")

        await expect(this.departureDateButton).toHaveText(this.formDatePattern(departDate))
        await expect(this.returnDateButton).toHaveText(this.formDatePattern(returnDate))
    }

    /** Matches a date field like "Tue 3/11". Anchored so 3/11 can't match 13/11. */
    formDatePattern(date: Date): RegExp {
        return new RegExp(`(^|\\s)${toFormDate(date)}$`)
    }

    /**
     * Today's date in the browser's timezone (Australia/Sydney in the config),
     * which is what the site's calendar uses, rather than the machine running the tests
     */
    async browserToday(): Promise<Date> {
        const [year, month, day] = await this.page.evaluate(() => {
            const now = new Date()
            return [now.getFullYear(), now.getMonth(), now.getDate()]
        })
        return new Date(year, month, day)
    }

    /** Clicks Search without waiting for results (for invalid searches) */
    async clickSearch() {
        await this.untickCompareSites()
        await this.searchButton.click()
    }

    /**
     * Unticks every "Compare vs." partner site so results load in this tab
     * instead of the tab being sent to a partner site with results in a pop-up
     */
    async untickCompareSites() {
        const checkboxes = this.page.locator(SearchForm.compareSiteCheckbox)
        for (const checkbox of await checkboxes.all()) {
            if (await checkbox.isChecked()) {
                await checkbox.uncheck({ force: true })
            }
        }
    }

    /**
     * Clicks Search and returns the tab that shows the results.
     * With compare sites unticked results load in the same tab; the poll over
     * all tabs is a safety net in case the site opens them in a new one.
     */
    async submitSearch(): Promise<Page> {
        const context = this.page.context()
        await this.untickCompareSites()
        await this.searchButton.click()

        await expect.poll(
            () => context.pages().some(p => p.url().includes("/flight-search/")),
            { message: "results page to open", timeout: 45_000 }
        ).toBe(true)

        return context.pages().find(p => p.url().includes("/flight-search/"))!
    }

    async searchFlights(search: FlightSearch): Promise<Page> {
        await this.selectOrigin(search.origin)
        await this.selectDestination(search.destination)
        await this.selectDates(search.departDate, search.returnDate)
        return this.submitSearch()
    }
}
