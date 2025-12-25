import { DayOfWeek } from "./DayOfWeek";
import { EventTimeInput } from "src/eventLogic/EventTimeInput";
import { ICourseEventInputs, WorkdayEventType } from "./IEventInputs";

/* Match from a course header to just before the next course header (or end of string), e.g.:
        Opens in new window

    CSE 3407 - Analysis of Algorithms
*/

const COURSE_CHUNK_REGEX = new RegExp(
    "Opens in new window\\s+((?:[A-Z]+\\s+\\d+)\\s*-\\s*[^\\n]+)" +
    "((?:(?!Opens in new window)[\\s\\S])*?)(?=Opens in new window|$)",
    "g"
);

/* Match section header, e.g.:
    CSE 3407 - Analysis of Algorithms
    OR
    CSE 5100-01 - Deep Reinforcement Learning
    OR
    CSE 3407-A - Analysis of Algorithms
*/
const COURSE_HEADER_REGEX = /([A-Z]+\s+\d+(?:[-\s][A-Z0-9]+)?)\s*-\s*([^\n]+)/g;

/* Match something like:
    Tue/Thu | 10:00 AM - 11:20 AM | EADS, Room 00216
    OR Tue/Thu | 11:30 AM - 12:50 PM |
    OR Mon | 10:00 AM - 11:20 AM | LOPATA HALL, Room 00101
    OR Mon | 10:00 AM - 11:20 AM | CUPPLES II, Room 00101

*/

const MEETING_PATTERN_REGEX =
    new RegExp(
        "([A-Za-z/]+)[ \\t\\f\\v\\r]*\\|\\s*(\\d{1,2}:\\d{2}\\s*[AP]M)[ \\t\\f\\v\\r]*-[ \\t\\f\\v\\r]*" +
        "(\\d{1,2}:\\d{2}\\s*[AP]M)[ \\t\\f\\v\\r]*\\|[ \\t\\f\\r]*([^\\n]*)?",
        "g"
    );

/* Match day names in Workday format */
const DAY_REGEX = /Mon|Tue|Wed|Thu|Fri|Sat|Sun/g;

const CourseChunkCaptureGroups = {
    CourseName: 1,
    ChunkContent: 2
};

const CourseHeaderCaptureGroups = {
    FullMatch: 0,
    CourseCodeWithSection: 1,
    CourseTitle: 2
};

const MeetingPatternCaptureGroups = {
    Days: 1,
    StartTime: 2,
    EndTime: 3,
    Building: 4,
    Room: 5
};

const DAY_MAP: Record<string, DayOfWeek> = {
    "Mon": DayOfWeek.Monday,
    "Tue": DayOfWeek.Tuesday,
    "Wed": DayOfWeek.Wednesday,
    "Thu": DayOfWeek.Thursday,
    "Fri": DayOfWeek.Friday,
    "Sat": DayOfWeek.Saturday,
    "Sun": DayOfWeek.Sunday
};

/**
 * Parses courses from Workday.
 */
export class WorkdayCourseParser {
    /**
     * Parses courses from Workday, returning them in an array of ICourseEventInputs.
     * Each section (lecture, lab, recitation) becomes a separate event.
     * 
     * @param rawInput - class schedule copy-pasted from Workday
     * @return array of parsed course sections
     */
    static parseCourses(rawInput: string): ICourseEventInputs[] {
        const events: ICourseEventInputs[] = [];
        
        // Step 1: Split into course chunks
        const courseChunks = Array.from(rawInput.matchAll(COURSE_CHUNK_REGEX));
        
        if (courseChunks.length === 0) {
            return [];
        }

        // Step 2: For each course chunk, extract all sections
        for (const chunk of courseChunks) {
            const courseName = chunk[CourseChunkCaptureGroups.CourseName].trim();
            const chunkContent = chunk[CourseChunkCaptureGroups.ChunkContent];

            // Find all course (sub)sections (lectures, labs, recitations) within this chunk
            // e.g. 3407-A - Analysis of Algorithms
            const sectionMatches = Array.from(chunkContent.matchAll(COURSE_HEADER_REGEX));
            
            // Find all meeting patterns within this chunk
            const meetingMatches = Array.from(chunkContent.matchAll(MEETING_PATTERN_REGEX));

            // Match each (sub)section to a meeting time/location
            if (sectionMatches.length !== meetingMatches.length) {
                console.warn(`Mismatched section and meeting counts for course ${courseName}: ` +
                    `${sectionMatches.length} sections but ${meetingMatches.length} meetings.`);
                alert(`Warning: Could not parse all sections for course ${courseName}. ` +
                    "Please check the console for details.");
                continue; // Skip this course chunk
            }

            const meetingPairs = sectionMatches.map(function (section, i) {
                return {
                    section,
                    meeting: meetingMatches[i]
                };
            });

            // For each section, extract days, times, and location
            for (const { section, meeting } of meetingPairs) {
                const sectionName = section[CourseHeaderCaptureGroups.FullMatch];
                const daysString = meeting[MeetingPatternCaptureGroups.Days];
                const startTimeString = meeting[MeetingPatternCaptureGroups.StartTime];
                const endTimeString = meeting[MeetingPatternCaptureGroups.EndTime];
                const building = meeting[MeetingPatternCaptureGroups.Building];
                const room = meeting[MeetingPatternCaptureGroups.Room];

                // Build location string
                let location = building ? building.trim() : "";
                if (room) {
                    location += location ? ` ${room}` : room;
                }
                
                events.push({
                    type: WorkdayEventType.Course,
                    name: sectionName,
                    location: location,
                    startTime: new EventTimeInput(startTimeString),
                    endTime: new EventTimeInput(endTimeString),
                    repeatingDays: WorkdayCourseParser.parseDays(daysString)
                });
            }
        }
        
        return events;
    }

    /**
     * Parse days from Workday format like "Mon/Wed/Fri" or "Tue/Thu"
     *
     * @param daysString - a slash-separated days string
     * @return set of days that the string represents
     */
    private static parseDays(daysString: string): Set<DayOfWeek> {
        const days: Set<DayOfWeek> = new Set();
        const dayMatches = daysString.matchAll(DAY_REGEX);
        
        for (const match of dayMatches) {
            const dayName = match[0];
            if (dayName in DAY_MAP) {
                days.add(DAY_MAP[dayName]);
            }
        }
        
        return days;
    }

}

