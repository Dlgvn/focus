# Ralph Instructions - Task Manager CLI

## Big Picture
Build a CLI task manager in Python using Click. Each loop iteration starts fresh,
so your memory is in files and git history.

## Loop Algorithm
Each iteration:
1. Read `ralph/goals.json`.
2. Pick the first goal where `status != "passed"` and all dependencies are passed.
3. If verification specifies tests and they do not exist, write tests first.
4. Run that goal's verification command.
5. If verification fails, implement/fix and rerun.
6. If verification passes, mark goal as `"passed"`, commit, and update `ralph/progress.txt`.

## Rules
- One goal per iteration.
- Do not mark a goal passed until its verification command passes.
- Use Python 3.11+, Click, type hints, docstrings.
- Keep code simple and readable.
- If blocked by a missing prerequisite, add a new goal with suffix `a` (e.g. `1a`) and `"added_by": "ralph"`.

## Important Files
- `src/task_manager/` - source code
- `data/tasks.json` - persistence
- `ralph/goals.json` - source of truth for goal status
- `ralph/progress.txt` - short loop notes

## Commands
```bash
pytest tests/ -v
pip install -e .
```

## Commit Message Format
`goal [id]: [short summary]`
