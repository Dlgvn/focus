# Focus — Calendar + UX Polish Design
Date: 2026-03-11

## Overview
Two PRs to add a calendar view with due-date visualization and improve mobile responsiveness, animations, and dark mode contrast.

---

## PR #10 — feature/calendar

### View Toggle
- Two buttons in header: `Board` | `Calendar` — segmented pill control, green accent on active
- Switching hides `.kanban-board` / shows `#calendar-view` and vice versa
- Active view persisted to `localStorage` key `focus_view`

### Calendar Layout
- Full-width panel, replaces board area
- Top bar: Month/Week toggle (left) · `< Prev` / `Today` / `Next >` (center) · period label (right)

### Month Grid
- 7-column Sun–Sat grid
- Each day cell: date number + up to 3 priority dots + `+N` overflow badge
- Dot colors: red = urgent, blue = normal, gray = someday
- Today highlighted with green border

### Week Grid
- 7 columns Mon–Sun for current week
- Taller cells, same dot + badge system
- Easier to read dense task days

### Day Popup
- Click any day cell with tasks → floating card anchored to cell
- Shows: task title, priority badge, project name
- Dismiss: click outside or Escape

### Date Picker (in Add/Edit modals)
- Replaces bare `<input type="date">`
- Shortcut buttons: `Today` · `Tomorrow` · `+1 week`
- Inline mini 7-column calendar grid below shortcuts
- Selected date highlighted green
- Hidden `<input type="date">` holds actual value for form submission

---

## PR #11 — feature/ux-polish

### Mobile / Responsive (< 640px)
- Kanban: columns stack vertically, single-column scroll
- Header: stats hidden, view toggle moves below header row
- Calendar: cells shrink, dots scale down, popup becomes bottom sheet
- Modal: full-screen with safe-area insets

### Animations
- View switch: fade + slight translateY slide (150ms)
- Modal open: scale 95%→100% + fade in (200ms); close: reverse
- Task completion: strikethrough animates left-to-right (300ms)
- Task deletion: slide-up + fade-out (enhance existing `.removing`)
- New task: polish existing `.animate-in` keyframe

### Dark Mode Contrast
- Audit all badges for WCAG AA (4.5:1 minimum)
- Fix: overdue badge, column count badges, empty state text, modal box-shadow
- Date picker calendar grid: distinct dark-mode cell + hover colors

---

## Data Flow
- Calendar reads from `loadTasks()` — no new storage keys except `focus_view`
- Day popup uses existing task data, no extra fetch
- Date picker writes to existing `dueDate` field (YYYY-MM-DD string)

## Out of Scope
- Creating tasks from the calendar
- Recurring tasks
- Time-of-day scheduling
