# Focus — Task Manager Specification

## What is Focus?
Focus is a clean, minimal web app for managing project work.
No accounts, no backend, no clutter — just your tasks, organized.

## Who is it for?
Me. Someone juggling multiple projects who needs to see what's urgent,
what's coming up, and what can wait.

## Features

### Core
- Add a task with: title, description, due date, priority, tags, project name
- View all tasks in a clean list
- Search tasks by title, tag, or project name
- Mark a task as done
- Delete a task

### Priority System
Three levels — kept intentionally simple:
- `urgent` — needs attention now
- `normal` — working on it
- `someday` — not now, but don't forget

### Design
- Clean white/minimal by default
- Dark mode toggle (saved to localStorage)
- Simple, no clutter — if it doesn't need to be there, it isn't

## Task Fields
| Field        | Required | Notes                          |
|--------------|----------|-------------------------------|
| Title        | Yes      | Short description of the task  |
| Priority     | Yes      | urgent / normal / someday      |
| Project name | No       | e.g. "Deep Learning", "Lab 4"  |
| Due date     | No       | YYYY-MM-DD format              |
| Description  | No       | More detail if needed          |
| Tags         | No       | Comma-separated, e.g. "ai, hw" |

## Technical Details
- Language: HTML + CSS + Vanilla JavaScript
- Storage: localStorage (no backend needed)
- No frameworks, no dependencies — runs by opening index.html

## What "Done" Looks Like
I can open the app, add a task for a real project I'm working on,
search for it, mark it done, and it looks clean doing it.
Dark mode works. Data survives a page refresh.

## Stretch Goals (if time allows)
- Filter by priority or project
- Sort by due date
- Edit an existing task
