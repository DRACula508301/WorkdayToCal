## Plan: Add iCal Export Support

This plan adds the ability to export events as a single `.ics` file, offering an alternative to the Google Calendar integration.

### Steps
1. Create a common interface `src/eventLogic/IEventExporter.ts` (or abstract base class) that defines the contract for exporting events.
2. Refactor `src/eventLogic/GoogleEventExporter.ts` to implement `IEventExporter`.
3. Create `src/eventLogic/IcalEventExporter.ts` implementing `IEventExporter`.
    - It should use `ical-generator` to create a calendar.
    - It should generate a single `.ics` file containing all provided events (whether 1 or many).
    - It should trigger a browser download for the file.
4. Update [ExportMethodSelector.tsx](../../src/components/configStep/ExportMethodSelector.tsx) to enable the "iCal file" radio button option.
5. Update [useEventExporter.ts](../../src/components/confirmStep/useEventExporter.ts) to accept the `EventExportMethod` and instantiate the appropriate `IEventExporter`.
    - Ensure `exportMany` logic handles the difference: Google might need individual tracking (or the exporter handles it), while iCal is a single operation.
6. Update [ExportConfirmArea.tsx](../../src/components/confirmStep/ExportConfirmArea.tsx) to pass the selected method to the exporter hook and display "iCal File" in the configuration summary.
7. Update [ExportAllPanel.tsx](../../src/components/confirmStep/ExportAllPanel.tsx) to dynamically change the button text (e.g., "Download .ics file") based on the selected export method.

### Further Considerations
1. **Single File Export:** For iCal, any export action (single event or batch) results in a single downloaded file containing the selected event(s).
2. The `ical-generator` library is already in `package.json`, so no new dependencies are needed.
