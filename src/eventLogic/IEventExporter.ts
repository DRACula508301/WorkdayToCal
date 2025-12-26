import { IEventInputs } from "./IEventInputs";
import { ISemester } from "./ISemester";

export interface IEventExporter {
    export(
        events: IEventInputs[],
        semester: ISemester,
        calendarId: string | undefined,
        onSuccess: (event: IEventInputs, url: string) => void,
        onError: (event: IEventInputs, error: any) => void
    ): Promise<void>;
}
