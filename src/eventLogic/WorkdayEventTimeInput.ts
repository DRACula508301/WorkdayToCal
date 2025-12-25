import { DateTime } from "luxon";

/**
 * User input for time.  Expects input in a format matching Workday's formatting.
 */
export class EventTimeInput {
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
    public readonly formatInstructions = "For example, 10:00AM";

    constructor(raw: string) {
        this.raw = raw;
        this.parsed = this._parse();
    }

    private _parse(): DateTime {

        return DateTime.fromFormat(this.raw, "hh:mma");
    }
}

if (require.main === module) {
    const time = new EventTimeInput("10:00AM");
    console.log(time.parsed.toLocaleString());
}
