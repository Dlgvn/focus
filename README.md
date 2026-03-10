# Focus

A clean, minimal task manager for project work.

No accounts. No backend. Just open and use.

## Features

- Add tasks with title, description, due date, priority, tags, and project name
- Priority levels: **Urgent**, **Normal**, **Someday**
- Mark tasks done, edit them, or delete them
- Search by title, tag, or project name
- Filter by priority
- Sort by due date
- Dark mode toggle — preference saved automatically
- All data stored in localStorage (survives page refresh)

## Setup

No installation needed.

1. Clone or download this repo
2. Open `index.html` in any browser

```bash
git clone https://github.com/Dlgvn/focus.git
cd focus
open index.html
```

## Usage

| Action | How |
|--------|-----|
| Add a task | Fill the form at the top and click **Add Task** |
| Mark done | Click **Done** on any task |
| Edit a task | Click **Edit** — a modal opens with the task fields |
| Delete a task | Click **Delete** and confirm |
| Search | Type in the search bar — filters instantly |
| Filter by priority | Use the **All priorities** dropdown |
| Sort by due date | Use the **Newest first** dropdown |
| Toggle dark mode | Click the moon/sun icon in the top right |

## Tech Stack

- HTML + CSS + Vanilla JavaScript
- localStorage for persistence
- No frameworks, no dependencies

## Project Structure

```
focus/
├── index.html        — layout and structure
├── style.css         — minimal design + dark mode
├── app.js            — all logic and localStorage
├── SPEC.md           — project specification
└── IMPLEMENTATION_PLAN.md
```
