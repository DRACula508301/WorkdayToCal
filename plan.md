# Plan: Add iCal Export Support
This plan adds the ability to export events as a single .ics file, offering an alternative to the Google Calendar integration.

## Steps
1. Create src/eventLogic/IcalEventExporter.ts to generate .ics files using ical-generator and trigger browser downloads.
2. Update ExportMethodSelector.tsx to enable the "iCal file" radio button option.
3. Update useEventExporter.ts to accept the EventExportMethod and switch between Google and iCal logic.
4. Update ExportConfirmArea.tsx to pass the selected method to the exporter hook and display "iCal File" in the configuration summary.
5. Update ExportAllPanel.tsx to dynamically change the button text (e.g., "Download .ics file") based on the selected export method.
## Further Considerations
1. Should the iCal export generate one file per event when clicking
individual "Export" buttons, or just one file for the whole batch? (Plan assumes one file per action).
2. The ical-generator library is already in package.json, so no new dependencies are needed.