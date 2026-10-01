# ATLAS — Adaptive Timeline, Load & Allocation System

## Workwheel prototype

The optional Workwheel can be enabled from **Application settings**. It supports planning for teams, processes, sections, and other organisational units. In hosted mode, Workwheels are shared and saved in the server database; save state is shown in the Workwheel toolbar. In standalone mode, Workwheel data is included in the planner JSON and browser recovery. Create multiple wheels, add recurring meetings or deadlines, and use the upcoming panel to review future items.

Workwheel data is recovered in browser storage while testing. Use **Workwheel → Data file** to load a separate JSON file or export the current Workwheel as `workwheel.json`. The feature is fully offline and does not use external services or assets. The current prototype supports none, daily, weekly, and monthly recurrence; weekly activities use the weekday of their start date.

The active application is the standalone [`index.html`](index.html). For the smoothest portable workflow in Edge, keep `index.html`, any `assets/` files, and your planner JSON file together in one folder and open the app from a simple local static server such as `http://localhost:8080`.

## Planner files

Team Manager loads planner data from a local JSON file. If no active file is configured, the app requires selecting a planner JSON file before normal use.

Browser storage provides automatic crash and reload recovery, but it is not a replacement for saving the JSON file. The JSON file contains personnel, activities, assignments, statuses, holidays, settings, courses, requirements, and grid preferences. Store portable folders in the approved secure location for your environment.

## Portable Edge workflow

Recommended folder layout:

```text
portable-team-manager/
├── index.html
├── your-planner.json
└── assets/   (if present in your build)
```

Recommended startup:

- Serve the folder locally for reliable browser file and fetch behavior in Edge.
- `python -m http.server 8080`
- `py -m http.server 8080`
- Then open `http://localhost:8080`

Opening `index.html` directly with `file://` may block or inconsistently allow file workflows, depending on browser policy. If the selected JSON file is missing, unreadable, or invalid, Team Manager shows a clear message so you can choose a valid file.

Startup behavior:
- If a previously selected JSON file can be restored, Team Manager reopens it automatically on startup.
- Otherwise, Team Manager shows a required **Choose your data file** step before normal interaction.
- Browser recovery state can still be used after a file is selected.

The startup screen also supports **Create blank planner** for a new empty planner.

Use **Choose Data File** to open a planner JSON and **Save As** to create a writable copy. When the browser has native file access to the selected folder, Team Manager can also write silent weekly backups into a `backups/` subfolder.

Team Manager checks for external changes and keeps a visible sync status:
- **Updated** (green)
- **Syncing…** (amber)
- **Out of sync** (red)

Auto-update runs every 60 seconds by default, and **Sync Now** is available next to **Save** for manual sync.

If no JSON file is attached yet, **Save** opens the Save As flow so a newly created blank planner can be saved to a file.

## Work time codes

Work Time Codes can count assigned dates as **Days** or as **Hours**. Hour codes use either a fixed amount per assigned date or an administrative time interval entered on the assignment. Legacy codes with the `VAKT` or `ATF` abbreviation migrate to a fixed 24 hours; other legacy hour codes use entered time.

Administrative compensation is independent of the physical shift. For example, an ATF assignment can report `ATF (24h)` while its physical shift remains `Night (1930-0730)`. No overtime-rate calculation is performed.

**Additional Work / Overtime (OT)** is recorded independently on an employee date. It can coexist with a status or activity, is added to timed hours in Workload and Summary, and does not change absence or availability. The app records hours and an optional note; it does not calculate overtime rates or pay.

## Schedule behavior

Planned assignments remain visible with diagonal hatching, but only Confirmed activities count in Workload, Summary, availability, and reports. Day and Night use lighter and darker shades of the assigned Work Time Code color.

Personnel receive an automatic employee order number when added. The number can be edited from Personnel, and lower numbers appear first within each hierarchy group. Whole departments and named sub-teams can be moved up or down from Personnel → Department order and Sub-team order. Schedule follows that hierarchy, while direct department employees remain above the named sub-teams.
Each planner represents one organisation. Set its name in **Personnel → Organisation name**; it applies to all personnel and is separate from the application/header name. When loading older planner data, ATLAS adopts its saved default organisation, or otherwise the first existing employee organisation, and applies it to everyone. Departments, sections, processes, teams, assignments, and schedule history are retained. Changing the master name updates all personnel. Use **Save & Add Another** to retain hierarchy fields while entering several people. Hierarchy order is configurable in Organisation Structure, including unassigned departments, sections, processes, and teams.

Dragging across dates creates a visible selection. **Remove from [activity]** removes only that activity from the selected dates; daily statuses and other activities remain. **Clear all selected cells** is the separate action for clearing everything in the selection. Both actions participate in Undo and browser recovery.

The Schedule toolbar includes a **Show** selector for departments and sections. Each browser stores its own selection locally, so users can choose their own scope without changing another workstation's view. The selection limits visible personnel and activity rows. Department views include department-targeted activities and activities targeted to sections within that department; section views show activities explicitly targeted to that section. Choose **Show: All** to restore the complete schedule, including global activities.

Employees can be marked **Temporarily inactive** in the employee editor without deleting their records, assignments, or history. They remain visible in Personnel under a collapsed **Inactive personnel** section at the bottom. In Schedule, the employee picker lets each workstation choose whether inactive personnel are greyed out or hidden; this is a local view preference and does not remove employment data.

Activities can optionally be targeted to one or more Departments and Sections. Activities created while a department or section is selected inherit that scope. An activity with no targets is global and appears in **Show: All**; scoped views show only activities targeted to the selected scope.
Activities can target multiple Departments, Sections, and Processes. Values within a category use OR matching, and selected categories combine with AND matching. The participant list filters to matching personnel while keeping previously selected out-of-scope people visible. An activity with no targets is global and appears in **Show: All**.

The Activities header contains separate report buttons for **Team Work Schedule** and **Activity Schedule**. Team Work Schedule opens with all activities overlapping the selected period included; individual activities can be unchecked before previewing or printing.
Activity type colors can be standardized from Settings. The Activity Schedule print groups ISO weeks, omits weeks without assigned personnel, and places larger week labels at the left of each week group. Turnaround assignments can record a physical shift interval per date; Work Code compensation remains separate.

In Grid View, use **Import .ics holidays** in the Holidays section. Standard all-day `VEVENT` entries are shown for review before import. Only events in the active planner year are offered.

## Grid tools

- Activity filters include All, Planned only, Confirmed only, and Cancelled only. Specific filters reveal a matching activity; this can be disabled under Settings → Grid behavior.
- Activity titles jump to their timeline bars. Past activities can be expanded and are shown before current activities when expanded.
- Drag across employee dates to edit a range. New activities assign selected participants to Normal Working Hours by default. Activity abbreviations support up to six characters; narrow employee cells use a four-character display fallback.
- Right-click an employee/date cell to edit status, activity assignment, overtime, or a per-cell note. Notes are saved with the planner and appear in cell hover text.
- Drag across dates in the Holidays section to create a holiday period.

## Special days and work checks

Settings → Manage Special Days supports recurring dates in `DD-MM` format, such as `04-07`, and one-off dates. Each entry can be edited, colored, and marked as non-working. Special days highlight the date headers, activity grid, employee cells, and a compact Special days row in the Holidays section. Their visual highlighting can be hidden without removing their capacity effect.

Settings → Work schedule checks allows a boss password to be configured. After unlocking the local boss view, activity cells can be marked as checked against an external time system. Checked cells show a gray overlay and green checkmark only while the boss view is unlocked. The password gates the local UI; it does not encrypt the planner JSON.

ATF administrative totals use the following rule: an ATF assignment using the standard Day or Night shift counts as one day when it represents 24 hours. An ATF assignment with a custom administrative interval shorter than 24 hours counts as the actual number of hours. The normal core-workday hours are not subtracted from ATF totals.

Administration can enable the optional **Bug Report** sidebar page. Users can enter a description and reproduction steps and download a readable offline Markdown report. The report contains safe diagnostics only; it does not include planner records, contact details, or passwords.
