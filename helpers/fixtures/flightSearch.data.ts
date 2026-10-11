export type Airport = {
    /** Text typed into the airport field */
    query: string
    /** Code of the "All airports" suggestion to pick */
    code: string
    city: string
    /** Every airport the site may return for this city (e.g. MEL also returns Avalon) */
    areaCodes: string[]
}

export type FlightSearch = {
    origin: Airport
    destination: Airport
    departDate: Date
    returnDate: Date
}

export const Airports = {
    sydney: { query: "Sydney", code: "SYD", city: "Sydney", areaCodes: ["SYD", "WSI"] },
    melbourne: { query: "Melbourne", code: "MEL", city: "Melbourne", areaCodes: ["MEL", "AVV", "MEB"] },
    brisbane: { query: "Brisbane", code: "BNE", city: "Brisbane", areaCodes: ["BNE"] },
} satisfies Record<string, Airport>

/** Airports for negative tests */
export const InvalidAirports = {
    /** Codes that do not exist: the site redirects to the home page with errorOccurred=true */
    unknownOrigin: { query: "", code: "XQZ", city: "", areaCodes: [] },
    unknownDestination: { query: "", code: "QQZ", city: "", areaCodes: [] },
    /** A real airport code ("Santo Subito") with no flights from Sydney: shows "No flights found" */
    noFlights: { query: "", code: "ZZZ", city: "Santo Subito", areaCodes: ["ZZZ"] },
} satisfies Record<string, Airport>

/** Text that matches no airport: the autocomplete API returns an empty list */
export const NonsenseAirportText = "qxzqxz"

export function addDays(base: Date, days: number): Date {
    const date = new Date(base)
    date.setDate(date.getDate() + days)
    return date
}

/** 2026-10-27, as used in the results URL */
export function toIsoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
}

/** "October 27 2026", matching the aria-label of a calendar day */
export function toCalendarLabel(date: Date): string {
    const month = date.toLocaleString("en-US", { month: "long" })
    return `${month} ${date.getDate()} ${date.getFullYear()}`
}

/** "3/11", the day/month shown on the search form's date fields (e.g. "Tue 3/11") */
export function toFormDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`
}

/**
 * Reads a form date like "Tue 3/11" back into a Date.
 * The form shows no year, so it is taken from `reference`, rolling over to the
 * next year when the month is earlier (e.g. reference December, shown 5/1).
 * Returns null for an empty field ("Return").
 */
export function parseFormDate(text: string, reference: Date): Date | null {
    const match = text.match(/(\d{1,2})\/(\d{1,2})\s*$/)
    if (!match) return null
    const day = Number(match[1])
    const month = Number(match[2]) - 1
    const year = month < reference.getMonth() ? reference.getFullYear() + 1 : reference.getFullYear()
    return new Date(year, month, day)
}

/** Parses "$1,234" into 1234 */
export function parsePrice(text: string): number {
    const match = text.replace(/\s/g, "").match(/\d[\d,]*(\.\d+)?/)
    return match ? Number(match[0].replace(/,/g, "")) : NaN
}

/**
 * Round trip roughly 3 weeks ahead with a one week stay,
 * so tests never search for dates in the past.
 */
export function roundTrip(origin: Airport, destination: Airport): FlightSearch {
    const today = new Date()
    return {
        origin,
        destination,
        departDate: addDays(today, 21),
        returnDate: addDays(today, 28),
    }
}

export function resultsPath(search: FlightSearch): string {
    return `/flight-search/${search.origin.code}-${search.destination.code}/${toIsoDate(search.departDate)}/${toIsoDate(search.returnDate)}`
}
