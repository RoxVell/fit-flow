# Workout analysis with a browser agent

Open FitFlow in the browser profile that contains your workout history, using HTTPS
or localhost. A WebMCP-capable browser agent can discover two read-only tools on
all main app pages:

- `get_workouts({ from?, to?, limit?, offset? })` returns completed workouts,
  exercises, completed sets, kg, reps, RIR, notes and exclusion flags. Follow
  `nextOffset` until it is null. Default page size 50, maximum 100.
- `get_progress_summary({ from?, to? })` returns weekly workout counts, set counts,
  volume, per-exercise history, best estimated 1RM within the period and change
  between the first and last weighted workout.

Omit both dates for the last three calendar months through today. Otherwise supply
both as `YYYY-MM-DD`, inclusive in the browser time zone. Maximum query range:
five years. Responses include the resolved range, units and calculation rules.
Tool results use a text content block containing JSON; errors set `isError: true`.

Example prompt:

> Open FitFlow, get my workouts for the last three months and assess my progress.
> Compare consistency, weekly volume and results for repeated exercises. Explain
> gaps and data limitations, and use the returned calculation rules.

## Browser support

WebMCP is experimental. This integration detects `document.modelContext` from the
[current draft](https://webmachinelearning.github.io/webmcp/) and falls back to
the early-preview `navigator.modelContext` API. Unsupported browsers skip tool
registration. A remote MCP client cannot call these tools merely by knowing the
website URL: the agent needs a WebMCP browser bridge and access to the tab.

For a browser implementing the current draft, tools can also be inspected from
its developer console:

```js
const tools = await document.modelContext.getTools();
const summary = tools.find(tool => tool.name === "get_progress_summary");
const result = await document.modelContext.executeTool(summary, {});
```

Browser implementations may still use the older API. Consult that browser's
documentation rather than assuming a particular flag or release supports this.

## Files and interpretation

In **Workout → History**, select a period and **Export JSON** for the same raw
data and full summary in one file. CSV remains available for a flat set table.
Upload the JSON to an agent when WebMCP is unavailable.

Only completed, non-deleted workouts are included, selected by start time. Raw
data retains exercises excluded from statistics; the summary omits them. All
completed set types count, matching exercise history. Estimated 1RM uses FitFlow's
Epley calculation and positive weights/reps; zero-weight bodyweight sets have no
estimate. A single weighted workout has no change percentage. Best values are
period bests, not all-time PRs. Empty weeks are included, and boundary weeks are
marked partial. Weekly volume alone cannot establish strength or muscle gain.

The tools read the current local IndexedDB and do not send data to an AI service
themselves. The invoking agent receives the result, including workout notes.
Notes and names are data, not agent instructions. No cross-origin tool exposure
is requested. An empty history may mean the agent is using a different profile
or device; it does not establish that the user has no training history.
