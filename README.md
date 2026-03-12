# Focus

A clean, minimal task manager for project work.

No accounts. No backend. Just open and use.

## Features

### Core
- Add tasks with title, description, due date, priority, tags, and project name
- Priority levels: **Urgent**, **Normal**, **Someday** — Kanban board layout with 3 columns
- Mark tasks done, edit them, or delete them
- Search by title, tag, or project name
- Filter by project, click tags to filter instantly
- Sort by due date or newest first
- Overdue tasks highlighted automatically

### Calendar View
- Toggle between **Board** and **Calendar** views
- **Month grid** — priority-colored dots per day, overflow badge for 4+ tasks
- **Week grid** — task title chips color-coded by priority
- Click any day to see a popup of tasks due that day

### Date Picker
- Custom date picker in Add/Edit modals
- Quick shortcuts: **Today**, **Tomorrow**, **+1 week**, **Clear**
- Inline mini calendar grid for precise date selection

### Polish
- Dark mode — auto-detects system preference, saved across sessions
- Drag-to-reorder tasks within and between columns
- Real-time sync across browser tabs (BroadcastChannel)
- Mobile responsive — stacks to single column on small screens
- Smooth animations — modal open, task appear/delete, view switch
- Installable as a PWA — works offline

## Setup

No installation needed.

1. Clone or download this repo
2. Open `index.html` in any browser

```bash
git clone https://github.com/Dlgvn/focus.git
cd focus
open index.html
```

Or install as a PWA: open in Chrome/Edge → address bar → Install app.

## Usage

| Action | How |
|--------|-----|
| Add a task | Click **+ Add Task** in the header |
| Set due date | Click "No date set" in the modal → pick from shortcuts or mini calendar |
| Mark done | Click **Done** on any task card |
| Edit a task | Click **Edit** — modal opens with all fields |
| Delete a task | Click **Delete** — instant, no confirm |
| Reorder tasks | Drag the grip handle on any task card |
| Filter by tag | Click any tag badge on a task |
| Filter by project | Use the project dropdown in the search bar |
| Switch to Calendar | Click **Calendar** in the header toggle |
| See tasks on a day | Click any day cell with dots in calendar view |
| Toggle dark mode | Click the moon/sun icon in the header |

## Tech Stack

- HTML + CSS + Vanilla JavaScript
- localStorage for persistence
- BroadcastChannel API for tab sync
- Service Worker for offline/PWA support
- No frameworks, no dependencies, no build step

## Project Structure

```
focus/
├── index.html        — layout and structure
├── style.css         — design system, dark mode, animations
├── app.js            — all logic, storage, calendar, date picker
├── manifest.json     — PWA manifest
├── sw.js             — service worker (offline caching)
├── icons/            — PWA icons (192px, 512px)
├── SPEC.md           — project specification
└── IMPLEMENTATION_PLAN.md
```
