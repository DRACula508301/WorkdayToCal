import { DateTime } from "luxon";
import { EventDateInput } from "src/eventLogic/EventDateInput";
import { ISemester } from "src/eventLogic/ISemester";

interface ICourseDateRangeSelectorProps {
    startDate?: EventDateInput;
    endDate?: EventDateInput;
    semester: ISemester | null;
    disabled: boolean;
    onChange: (updates: { startDate?: EventDateInput; endDate?: EventDateInput }) => void;
}

export function CourseDateRangeSelector(props: ICourseDateRangeSelectorProps) {
    const { startDate, endDate, semester, disabled, onChange } = props;

    if (!semester) {
        return null;
    }

    const hasCustomDates = startDate !== undefined || endDate !== undefined;
    const displayStartDate = startDate?.parsed.isValid ? startDate.parsed : semester.firstDayOfClasses;
    const displayEndDate = endDate?.parsed.isValid ? endDate.parsed : semester.lastDayOfClasses;

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            const parsedDate = DateTime.fromISO(value);
            if (parsedDate.isValid) {
                onChange({ startDate: new EventDateInput(parsedDate.toFormat("MM/dd/yyyy")) });
            }
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            const parsedDate = DateTime.fromISO(value);
            if (parsedDate.isValid) {
                onChange({ endDate: new EventDateInput(parsedDate.toFormat("MM/dd/yyyy")) });
            }
        }
    };

    const handleResetToDefaults = () => {
        onChange({ startDate: undefined, endDate: undefined });
    };

    return (
        <div className="mt-1">
            <div className="d-flex align-items-center gap-2">
                <input
                    type="date"
                    className="form-control"
                    style={{ maxWidth: "150px" }}
                    value={displayStartDate.toISODate() || ""}
                    disabled={disabled}
                    onChange={handleStartDateChange}
                    aria-label="Start date"
                />
                <span>—</span>
                <input
                    type="date"
                    className="form-control"
                    style={{ maxWidth: "150px" }}
                    value={displayEndDate.toISODate() || ""}
                    disabled={disabled}
                    onChange={handleEndDateChange}
                    aria-label="End date"
                />
                {hasCustomDates && !disabled && (
                    <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={handleResetToDefaults}
                        style={{ fontSize: "smaller" }}
                    >
                        Reset to semester defaults
                    </button>
                )}
            </div>
            <div style={{ fontSize: "smaller", marginTop: "4px", color: "#666" }}>
                {hasCustomDates ? "Using dates from schedule/user" : "Using semester defaults"}
            </div>
        </div>
    );
}
