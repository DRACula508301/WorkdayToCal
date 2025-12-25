import { DateTime } from "luxon";

/**
 * User input for date.  Expects input in a format matching Workday's formatting.
 */
export class EventDateInput {
    /**
     * Raw input string.
     */
    public readonly raw: string;

    /**
     * Parsed input string.  Might be invalid.
     */
    public readonly parsed: DateTime;

    /**
     * User-readable instructions for properly formatting their input.
     */
    public readonly formatInstructions = "Use the format MM/DD/YYYY, e.g. 08/25/2023";

    constructor(raw: string) {
        this.raw = raw;
        this.parsed = DateTime.fromFormat(raw, "MM/dd/yyyy");    }
}
