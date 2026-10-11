import { Page, TestInfo, test } from "@playwright/test"
import { BotProtection } from "../selectors/homePage.selectors"

export class BasePage {
    page: Page
    worker: TestInfo

    constructor(page: Page, worker: TestInfo) {
        this.page = page
        this.worker = worker
    }

    /**
     * Use this method to navigate to a page
     * @param uri - path relative to baseURL, "" for the home page
     */
    async navigateToPage(uri: string) {
        // "load" rather than "domcontentloaded": buttons are in the HTML before the
        // site's JavaScript attaches their click handlers, and early clicks do nothing
        await this.page.goto(uri || "/", { waitUntil: "load" })
        await this.skipIfBlockedByBotProtection()
        await this.closeCookie()
    }

    /**
     * Points this page object at another tab,
     * e.g. when results open in a new tab
     */
    switchTo(page: Page) {
        this.page = page
    }

    async closeCookie(): Promise<void> {
        const acceptButton = this.page.locator(`#onetrust-accept-btn-handler, button:has-text("Accept all")`).first()
        if (await acceptButton.isVisible()) {
            await acceptButton.click()
        }
    }

    /**
     * Cheapflights (Kayak group) uses bot protection. When it serves a
     * CAPTCHA instead of the site there is nothing to test, so the test is
     * skipped with a clear reason instead of failing.
     */
    async skipIfBlockedByBotProtection(): Promise<void> {
        const captchaShown = await this.page.locator(BotProtection.join(", ")).first().isVisible()
        const captchaText = await this.page.getByText(/are you a (human|robot)|verify you are human|unusual traffic/i).first().isVisible()
        const captchaUrl = /captcha|security\/check/i.test(this.page.url())

        test.skip(captchaShown || captchaText || captchaUrl,
            `Blocked by the site's bot protection (${this.page.url()}). Run locally with --headed.`)
    }
}
