import React, { useCallback, useMemo } from "react";
import { EventExportMethod } from "src/eventLogic/EventExportMethod";
import { GoogleEventExporter } from "src/eventLogic/GoogleEventExporter";
import { IcalEventExporter } from "src/eventLogic/IcalEventExporter";
import { IEventInputs } from "src/eventLogic/IEventInputs";
import { ISemester } from "src/eventLogic/ISemester";
import { ApiHttpError } from "src/google/CalendarApi";
import { ActionType, IUpdateStateAction } from "src/state/editorStatesActions";
import { IEventEditorState } from "src/state/IEventEditorState";
import { EventExportState } from "src/state/EventExportState";

export function useEventExporter(
    exportMethod: EventExportMethod,
    calendarId: string,
    semester: ISemester | null,
    dispatch: React.Dispatch<IUpdateStateAction>
) {
    const exporter = useMemo(() => {
        if (exportMethod === EventExportMethod.IcalFile) {
            return new IcalEventExporter();
        }
        return new GoogleEventExporter();
    }, [exportMethod]);

    const exportOne = useCallback(async(toExport: IEventEditorState, setStateBeforeExport=true) => {
        const dispatchChange = (updates: Partial<EventExportState>) => {
            dispatch({
                type: ActionType.UpdateExportStates,
                ids: [toExport.id],
                updates: [updates]
            });
        };

        if (!semester) {
            dispatchChange({ isExporting: false, errorMessage: "No semester selected" });
            return false;
        }

        if (setStateBeforeExport) {
            dispatchChange({
                isExporting: true,
                successUrl: "",
                errorMessage: ""
            });
        }

        return new Promise<boolean>((resolve) => {
            exporter.export([toExport.inputs], semester, calendarId,
                (event, url) => {
                    dispatchChange({
                        isExporting: false,
                        successUrl: url,
                        errorMessage: ""
                    });
                    resolve(true);
                },
                (event, error) => {
                    console.error(error);
                    const errorMessage = error instanceof ApiHttpError ? error.message : "Unknown error (bug?)";
                    dispatchChange({
                        isExporting: false,
                        successUrl: "",
                        errorMessage
                    });
                    resolve(false);
                }
            );
        });
    }, [calendarId, semester, dispatch, exporter]);

    const exportMany = useCallback((exports: IEventEditorState[]): Array<Promise<boolean>> => {
        if (!semester) {
            return exports.map(() => Promise.resolve(false));
        }

        dispatch({ // Set everything to be exporting
            type: ActionType.UpdateExportStates,
            ids: exports.map(toExport => toExport.id),
            updates: new Array(exports.length).fill({
                isExporting: true,
                successUrl: "",
                errorMessage: ""
            })
        });

        const promises = exports.map(() => {
            let resolve: (value: boolean) => void;
            const p = new Promise<boolean>(r => resolve = r);
            return { p, resolve: resolve! };
        });
        
        const inputToPromise = new Map<IEventInputs, (val: boolean) => void>();
        exports.forEach((e, i) => inputToPromise.set(e.inputs, promises[i].resolve));
        
        const inputToId = new Map<IEventInputs, string>();
        exports.forEach(e => inputToId.set(e.inputs, e.id));

        exporter.export(exports.map(e => e.inputs), semester, calendarId,
            (event, url) => {
                const id = inputToId.get(event);
                if (id) {
                    dispatch({
                        type: ActionType.UpdateExportStates,
                        ids: [id],
                        updates: [{ isExporting: false, successUrl: url, errorMessage: "" }]
                    });
                }
                inputToPromise.get(event)?.(true);
            },
            (event, error) => {
                const id = inputToId.get(event);
                if (id) {
                    const errorMessage = error instanceof ApiHttpError ? error.message : "Unknown error (bug?)";
                    dispatch({
                        type: ActionType.UpdateExportStates,
                        ids: [id],
                        updates: [{ isExporting: false, successUrl: "", errorMessage }]
                    });
                }
                inputToPromise.get(event)?.(false);
            }
        );

        return promises.map(x => x.p);
    }, [dispatch, exporter, semester, calendarId]);

    return { exportOne, exportMany };
}
