import { PlaywrightTestConfig, devices } from "@playwright/test"

const config: PlaywrightTestConfig = {
    testDir: "./tests",
    timeout: 120 * 1000,

    // One worker keeps the live site from rate limiting or blocking the run.
    workers: 1,
    fullyParallel: false,
    retries: process.env.CI ? 2 : 1,
    forbidOnly: !!process.env.CI,

    expect: {
        timeout: 30000
    },

    reporter: [
        ["list"],
        ["html", { open: "never" }],
    ],

    use: {
        // Headless by default (and always on CI). Set HEADED=1 to open a real browser window,
        // including in UI mode: npm run test:ui:headed
        headless: !process.env.HEADED,
        baseURL: "https://www.cheapflights.com.au",
        locale: "en-AU",
        timezoneId: "Australia/Sydney",
        viewport: { width: 1440, height: 900 },
        actionTimeout: 15000,
        navigationTimeout: 45000,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },

    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    ],
}

export default config
