# Ralph Instructions — Focus Web App

## Big Picture
Build a clean, minimal web task manager using HTML, CSS, and Vanilla JS.
No frameworks, no backend. Data lives in localStorage.

## Loop Algorithm
Each iteration:
1. Read `ralph/goals.json`.
2. Pick the first goal where `status != "passed"` and all dependencies are passed.
3. Implement what is needed to satisfy that goal.
4. Verify using the goal's checklist.
5. If satisfied, mark goal `"passed"`, commit, update `ralph/progress.txt`.

## Rules
- One goal per iteration.
- Keep code simple and readable — no frameworks, no build tools.
- All files go in the project root: index.html, style.css, app.js.
- If blocked, add a new goal with suffix `a` and `"added_by": "ralph"`.

## Important Files
- `index.html` — structure
- `style.css` — styling (light + dark mode)
- `app.js` — all JS logic, localStorage
- `ralph/goals.json` — source of truth for goal status
- `ralph/progress.txt` — short notes per iteration

## Commit Message Format
`goal [id]: [short summary]`
