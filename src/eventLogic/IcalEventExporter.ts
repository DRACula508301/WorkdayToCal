import ical, { ICalCalendarMethod, ICalWeekday } from 'ical-generator';
import { min } from "lodash";
import { DateTime } from "luxon";
import { DayOfWeek } from "./DayOfWeek";
import { IEventExporter } from "./IEventExporter";
import { ISemester } from "./ISemester";
import { IEventInputs, WorkdayEventType } from "./IEventInputs";

const RECURRENCE_VALUE_FOR_DAY: Readonly<Record<DayOfWeek, ICalWeekday>> = {
    [DayOfWeek.Monday]: "MO" as ICalWeekday,
    [DayOfWeek.Tuesday]: "TU" as ICalWeekday,
    [DayOfWeek.Wednesday]: "WE" as ICalWeekday,
    [DayOfWeek.Thursday]: "TH" as ICalWeekday,
    [DayOfWeek.Friday]: "FR" as ICalWeekday,
    [DayOfWeek.Saturday]: "SA" as ICalWeekday,
    [DayOfWeek.Sunday]: "SU" as ICalWeekday,
};

export class IcalEventExporter implements IEventExporter {
    async export(
        events: IEventInputs[],
        semester: ISemester,
        calendarId: string | undefined,
        onSuccess: (event: IEventInputs, url: string) => void,
        onError: (event: IEventInputs, error: any) => void
    ): Promise<void> {
        const calendar = ical({ name: 'Workday Schedule' });
        calendar.method(ICalCalendarMethod.PUBLISH);
        calendar.prodId({
            company: 'WorkdayToCal',
            product: 'WorkdayToCal',
            language: 'EN'
        });

        for (const event of events) {
            try {
                const startDate = this._getStartDate(event, semester);
                const startDateTime = startDate.set({
                    hour: event.startTime.parsed.hour,
                    minute: event.startTime.parsed.minute
                });
                const endDateTime = startDate.set({
                    hour: event.endTime.parsed.hour,
                    minute: event.endTime.parsed.minute
                });

                const eventData: any = {
                    start: startDateTime.toJSDate(),
                    end: endDateTime.toJSDate(),
                    summary: event.name,
                    location: event.location,
                    description: "Created by WashU Workday to Calendars",
                };

                if (event.type === WorkdayEventType.Course) {
                    const byDay = Array.from(event.repeatingDays).map(day => RECURRENCE_VALUE_FOR_DAY[day]);
                    if (byDay.length > 0) {
                        const endDate = this._getEndDate(event, semester);
                        eventData.repeating = {
                            freq: 'WEEKLY',
                            until: endDate.endOf('day').toJSDate(),
                            byDay: byDay
                        };
                    }
                }

                calendar.createEvent(eventData);
                // For iCal, we mark success immediately as it's included in the file
                onSuccess(event, ""); 
            } catch (error) {
                onError(event, error);
            }
        }

        if (calendar.events().length > 0) {
            const blob = new Blob([calendar.toString()], { type: "text/calendar;charset=utf-8" });
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.setAttribute("download", "workday_schedule.ics");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    private _getStartDate(event: IEventInputs, semester: ISemester): DateTime {
        if (event.type === WorkdayEventType.Course) {
            // If event has custom start date, use it
            if (event.startDate?.parsed.isValid) {
                return event.startDate.parsed;
            }
            // Otherwise calculate from semester start
            return semester.firstDayOfClasses.plus({
                days: this._daysUntilNearestDayOfWeek(semester.firstDayOfClasses.weekday, event.repeatingDays)
            });
        } else {
            return event.date.parsed;
        }
    }

    private _getEndDate(event: IEventInputs, semester: ISemester): DateTime {
        if (event.type === WorkdayEventType.Course && event.endDate?.parsed.isValid) {
            return event.endDate.parsed;
        }
        return semester.lastDayOfClasses;
    }

    private _daysUntilNearestDayOfWeek(startDay: DayOfWeek, weekdays: Set<DayOfWeek>): number {
        const minDuration = min(Array.from(weekdays).map((day) => {
            let dayDiff = day - startDay;
            if (dayDiff < 0) {
                dayDiff += 7;
            }
            return dayDiff;
        }));
        return minDuration || 0;
    }
}
