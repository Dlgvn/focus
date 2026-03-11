# Calendar + UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full calendar view with due-date visualization and day popups, a custom date picker in modals, and polish mobile responsiveness, animations, and dark mode contrast.

**Architecture:** Two PRs — `feature/calendar` adds the calendar toggle view and date picker; `feature/ux-polish` adds mobile breakpoints, animation refinements, and dark mode contrast fixes. All new logic lives in `app.js` and `style.css`; `index.html` gets structural additions only.

**Tech Stack:** Vanilla JS, CSS custom properties, localStorage. No external libraries. Existing stack: Inter font, green accent `#059669`.

---

## === PR #10: feature/calendar ===

---

### Task 1: Add view toggle buttons to header

**Files:**
- Modify: `index.html` — header section (line ~21–30)
- Modify: `style.css` — add `.view-toggle` styles

**Step 1: Add view toggle HTML inside `<header>` before `#add-task-btn`**

In `index.html`, find:
```html
    <div class="header-right">
      <span id="task-stats" class="task-stats" aria-live="polite"></span>
      <button id="add-task-btn" aria-label="Add new task">+ Add Task</button>
```

Replace with:
```html
    <div class="header-right">
      <span id="task-stats" class="task-stats" aria-live="polite"></span>
      <div class="view-toggle" role="group" aria-label="View mode">
        <button id="btn-board" class="view-btn active" aria-pressed="true">Board</button>
        <button id="btn-calendar" class="view-btn" aria-pressed="false">Calendar</button>
      </div>
      <button id="add-task-btn" aria-label="Add new task">+ Add Task</button>
```

**Step 2: Add `.view-toggle` CSS to `style.css`**

Add near the header section:
```css
.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.view-btn {
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.view-btn.active {
  background: var(--accent);
  color: #fff;
}
.view-btn:not(.active):hover {
  background: var(--hover-bg);
}
```

**Step 3: Verify in browser**
Open `index.html`. Header should show `Board | Calendar` pill control next to `+ Add Task`. Board should be visually active (green).

**Step 4: Commit**
```bash
git add index.html style.css
git commit -m "feat: add Board/Calendar view toggle to header"
```

---

### Task 2: Add calendar section to HTML

**Files:**
- Modify: `index.html` — after `</section>` closing the kanban board

**Step 1: Add calendar section after the kanban board section**

In `index.html`, find `</section>` that closes the kanban board (after `</div>` for the someday column), then add immediately after:

```html
    <!-- Calendar View -->
    <section id="calendar-view" class="hidden" aria-label="Calendar view">
      <div class="cal-topbar">
        <div class="cal-mode-toggle" role="group" aria-label="Calendar mode">
          <button id="cal-month-btn" class="cal-mode-btn active">Month</button>
          <button id="cal-week-btn" class="cal-mode-btn">Week</button>
        </div>
        <div class="cal-nav">
          <button id="cal-prev" aria-label="Previous period">&lsaquo;</button>
          <button id="cal-today">Today</button>
          <button id="cal-next" aria-label="Next period">&rsaquo;</button>
        </div>
        <span id="cal-label" class="cal-label"></span>
      </div>
      <div id="cal-grid" class="cal-grid"></div>
      <div id="day-popup" class="day-popup hidden" role="dialog" aria-label="Tasks due"></div>
    </section>
```

**Step 2: Verify**
Page should look identical (calendar section has `hidden` class).

**Step 3: Commit**
```bash
git add index.html
git commit -m "feat: add calendar section scaffold to HTML"
```

---

### Task 3: View switch logic in app.js

**Files:**
- Modify: `app.js` — add view switch functions at the bottom before `refresh()` / `initDragDrop()` calls

**Step 1: Add view switch state and function**

Add before the `// ── Init ──` block:

```js
// ── View Switch ───────────────────────────────────────
function switchView(view) {
  const isCalendar = view === 'calendar';
  document.querySelector('.kanban-board').classList.toggle('hidden', isCalendar);
  document.querySelector('.search-section').classList.toggle('hidden', isCalendar);
  document.getElementById('calendar-view').classList.toggle('hidden', !isCalendar);
  document.getElementById('btn-board').classList.toggle('active', !isCalendar);
  document.getElementById('btn-calendar').classList.toggle('active', isCalendar);
  document.getElementById('btn-board').setAttribute('aria-pressed', String(!isCalendar));
  document.getElementById('btn-calendar').setAttribute('aria-pressed', String(isCalendar));
  localStorage.setItem('focus_view', view);
  if (isCalendar) renderCalendar();
}

document.getElementById('btn-board').addEventListener('click', () => switchView('board'));
document.getElementById('btn-calendar').addEventListener('click', () => switchView('calendar'));

// Restore saved view on load
const savedView = localStorage.getItem('focus_view');
if (savedView === 'calendar') switchView('calendar');
```

**Step 2: Add `.hidden` to CSS if not already there**

Check `style.css` for `.hidden { display: none; }`. It should already exist from previous PRs. If not, add it.

**Step 3: Verify in browser**
Click `Calendar` button — board and search bar disappear, calendar section appears (empty for now). Click `Board` — board returns. Refresh page — last view is restored.

**Step 4: Commit**
```bash
git add app.js
git commit -m "feat: implement Board/Calendar view switch with localStorage persistence"
```

---

### Task 4: Calendar state and navigation

**Files:**
- Modify: `app.js` — add calendar state variables and nav handlers

**Step 1: Add calendar state variables**

Add right after the `// ── View Switch ───` section:

```js
// ── Calendar State ────────────────────────────────────
let calMode = 'month'; // 'month' | 'week'
let calDate = new Date();
calDate.setHours(0, 0, 0, 0);
```

**Step 2: Add navigation handlers**

Add after the state variables:

```js
document.getElementById('cal-month-btn').addEventListener('click', () => {
  calMode = 'month';
  document.getElementById('cal-month-btn').classList.add('active');
  document.getElementById('cal-week-btn').classList.remove('active');
  renderCalendar();
});

document.getElementById('cal-week-btn').addEventListener('click', () => {
  calMode = 'week';
  document.getElementById('cal-week-btn').classList.add('active');
  document.getElementById('cal-month-btn').classList.remove('active');
  renderCalendar();
});

document.getElementById('cal-today').addEventListener('click', () => {
  calDate = new Date();
  calDate.setHours(0, 0, 0, 0);
  renderCalendar();
});

document.getElementById('cal-prev').addEventListener('click', () => {
  if (calMode === 'month') {
    calDate.setMonth(calDate.getMonth() - 1);
  } else {
    calDate.setDate(calDate.getDate() - 7);
  }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  if (calMode === 'month') {
    calDate.setMonth(calDate.getMonth() + 1);
  } else {
    calDate.setDate(calDate.getDate() + 7);
  }
  renderCalendar();
});
```

**Step 3: Add stub `renderCalendar` function**

```js
function renderCalendar() {
  const label = document.getElementById('cal-label');
  if (calMode === 'month') {
    label.textContent = calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    renderMonthGrid();
  } else {
    const weekStart = getWeekStart(calDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    label.textContent =
      weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' – ' +
      weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    renderWeekGrid();
  }
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

function renderMonthGrid() {
  document.getElementById('cal-grid').textContent = 'Month grid coming...';
}

function renderWeekGrid() {
  document.getElementById('cal-grid').textContent = 'Week grid coming...';
}
```

**Step 4: Call `renderCalendar` in `switchView` — already done in Task 3.**

**Step 5: Verify**
Switch to calendar. Label shows current month. Clicking prev/next changes the month. Mode toggle switches label format. Today resets.

**Step 6: Commit**
```bash
git add app.js
git commit -m "feat: add calendar state, navigation, and mode toggle"
```

---

### Task 5: Month grid rendering

**Files:**
- Modify: `app.js` — replace stub `renderMonthGrid`
- Modify: `style.css` — add month grid CSS

**Step 1: Replace `renderMonthGrid` stub**

```js
function renderMonthGrid() {
  const grid = document.getElementById('cal-grid');
  const tasks = loadTasks();

  const year  = calDate.getFullYear();
  const month = calDate.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // First day of month, last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Day-of-week offset (0=Sun)
  const startOffset = firstDay.getDay();

  // Build task map: 'YYYY-MM-DD' → [tasks]
  const taskMap = buildTaskMap(tasks);

  let html = '<div class="month-grid">';

  // Day headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="cal-cell other-month"></div>';
  }

  // Day cells
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const cellDate = new Date(year, month, day);
    const key = toDateKey(cellDate);
    const isToday = cellDate.getTime() === today.getTime();
    const dayTasks = taskMap[key] || [];

    html += `<div class="cal-cell${isToday ? ' today' : ''}" data-date="${key}">
      <span class="cal-day-num">${day}</span>
      ${renderDayDots(dayTasks)}
    </div>`;
  }

  // Fill remaining cells to complete last row
  const total = startOffset + lastDay.getDate();
  const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 0; i < remainder; i++) {
    html += '<div class="cal-cell other-month"></div>';
  }

  html += '</div>';
  grid.innerHTML = html;

  // Attach click handlers
  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const key = cell.dataset.date;
      const dayTasks = taskMap[key] || [];
      if (dayTasks.length > 0) showDayPopup(cell, key, dayTasks);
      else closeDayPopup();
    });
  });
}
```

**Step 2: Add helper functions**

```js
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildTaskMap(tasks) {
  const map = {};
  tasks.forEach(task => {
    if (task.dueDate) {
      if (!map[task.dueDate]) map[task.dueDate] = [];
      map[task.dueDate].push(task);
    }
  });
  return map;
}

function renderDayDots(dayTasks) {
  if (dayTasks.length === 0) return '';
  const PRIORITY_COLOR = { urgent: 'dot-urgent', normal: 'dot-normal', someday: 'dot-someday' };
  // Show up to 3 dots + overflow badge
  const dots = dayTasks.slice(0, 3).map(t =>
    `<span class="cal-dot ${PRIORITY_COLOR[t.priority] || 'dot-normal'}"></span>`
  ).join('');
  const overflow = dayTasks.length > 3
    ? `<span class="cal-overflow">+${dayTasks.length - 3}</span>`
    : '';
  return `<div class="cal-dots">${dots}${overflow}</div>`;
}
```

**Step 3: Add month grid CSS to `style.css`**

```css
/* ── Calendar ────────────────────────────────────────── */
.cal-topbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0 1rem;
  flex-wrap: wrap;
}
.cal-mode-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.cal-mode-btn {
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.cal-mode-btn.active {
  background: var(--accent);
  color: #fff;
}
.cal-nav {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}
.cal-nav button {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}
.cal-nav button:hover { background: var(--hover-bg); }
.cal-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text);
  margin-left: auto;
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.cal-day-header {
  background: var(--card-bg);
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0.4rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cal-cell {
  background: var(--card-bg);
  min-height: 80px;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
}
.cal-cell:hover { background: var(--hover-bg); }
.cal-cell.other-month { background: var(--bg); cursor: default; }
.cal-cell.today { outline: 2px solid var(--accent); outline-offset: -2px; }
.cal-day-num {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text);
  display: block;
  margin-bottom: 0.3rem;
}
.cal-cell.today .cal-day-num { color: var(--accent); font-weight: 700; }
.cal-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
}
.cal-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.dot-urgent  { background: #ef4444; }
.dot-normal  { background: #3b82f6; }
.dot-someday { background: #9ca3af; }
.cal-overflow {
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 600;
}
```

**Step 4: Verify**
Switch to calendar. Month grid renders with day headers and day numbers. Days with due tasks show colored dots. Today is outlined in green.

**Step 5: Commit**
```bash
git add app.js style.css
git commit -m "feat: render month calendar grid with priority dots"
```

---

### Task 6: Week grid rendering

**Files:**
- Modify: `app.js` — replace stub `renderWeekGrid`
- Modify: `style.css` — add week grid CSS

**Step 1: Replace `renderWeekGrid` stub**

```js
function renderWeekGrid() {
  const grid = document.getElementById('cal-grid');
  const tasks = loadTasks();
  const taskMap = buildTaskMap(tasks);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = getWeekStart(calDate);

  let html = '<div class="week-grid">';

  // Day columns
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const key = toDateKey(day);
    const isToday = day.getTime() === today.getTime();
    const dayTasks = taskMap[key] || [];

    html += `<div class="week-col${isToday ? ' today' : ''}" data-date="${key}">
      <div class="week-col-header">
        <span class="week-day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
        <span class="week-day-num">${day.getDate()}</span>
      </div>
      <div class="week-tasks">
        ${dayTasks.map(t => `
          <div class="week-task-chip ${t.priority}" data-id="${t.id}">
            ${escapeHtml(t.title)}
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  html += '</div>';
  grid.innerHTML = html;

  // Click handlers on columns
  grid.querySelectorAll('.week-col[data-date]').forEach(col => {
    col.addEventListener('click', e => {
      if (e.target.closest('.week-task-chip')) return; // handled separately
      const key = col.dataset.date;
      const dayTasks = taskMap[key] || [];
      if (dayTasks.length > 0) showDayPopup(col, key, dayTasks);
      else closeDayPopup();
    });
  });
}
```

**Step 2: Add week grid CSS**

```css
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  min-height: 280px;
}
.week-col {
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background 0.1s;
}
.week-col:hover { background: var(--hover-bg); }
.week-col.today { outline: 2px solid var(--accent); outline-offset: -2px; }
.week-col-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.25rem 0.35rem;
  border-bottom: 1px solid var(--border);
}
.week-day-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.week-day-num {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.week-col.today .week-day-num { color: var(--accent); }
.week-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.4rem 0.3rem;
}
.week-task-chip {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.week-task-chip.urgent  { background: #fee2e2; color: #b91c1c; }
.week-task-chip.normal  { background: #dbeafe; color: #1d4ed8; }
.week-task-chip.someday { background: var(--hover-bg); color: var(--text-muted); }
.dark .week-task-chip.urgent  { background: #450a0a; color: #fca5a5; }
.dark .week-task-chip.normal  { background: #1e3a5f; color: #93c5fd; }
```

**Step 3: Verify**
Switch to Week mode. 7 columns appear, each showing task title chips in priority colors. Today column is highlighted.

**Step 4: Commit**
```bash
git add app.js style.css
git commit -m "feat: render week calendar grid with task title chips"
```

---

### Task 7: Day popup

**Files:**
- Modify: `app.js` — add `showDayPopup` and `closeDayPopup`
- Modify: `style.css` — add popup CSS

**Step 1: Add popup functions**

```js
// ── Day Popup ─────────────────────────────────────────
function showDayPopup(anchorEl, dateKey, dayTasks) {
  const popup = document.getElementById('day-popup');

  const [y, m, d] = dateKey.split('-').map(Number);
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  popup.innerHTML = `
    <div class="popup-header">
      <span>${dateLabel}</span>
      <button class="popup-close" aria-label="Close">×</button>
    </div>
    <ul class="popup-task-list">
      ${dayTasks.map(t => `
        <li class="popup-task-item">
          <span class="popup-dot ${t.priority === 'urgent' ? 'dot-urgent' : t.priority === 'normal' ? 'dot-normal' : 'dot-someday'}"></span>
          <span class="popup-task-title">${escapeHtml(t.title)}</span>
          ${t.project ? `<span class="badge">${escapeHtml(t.project)}</span>` : ''}
        </li>
      `).join('')}
    </ul>
  `;

  // Position near anchor
  const rect = anchorEl.getBoundingClientRect();
  const scrollY = window.scrollY;
  popup.style.top  = `${rect.bottom + scrollY + 6}px`;
  popup.style.left = `${Math.min(rect.left, window.innerWidth - 260)}px`;

  popup.classList.remove('hidden');

  popup.querySelector('.popup-close').addEventListener('click', closeDayPopup);
}

function closeDayPopup() {
  document.getElementById('day-popup').classList.add('hidden');
}

// Close popup on outside click
document.addEventListener('click', e => {
  const popup = document.getElementById('day-popup');
  if (!popup.classList.contains('hidden') && !popup.contains(e.target) && !e.target.closest('.cal-cell, .week-col')) {
    closeDayPopup();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDayPopup();
});
```

**Step 2: Add popup CSS**

```css
.day-popup {
  position: absolute;
  z-index: 200;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  width: 240px;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}
.popup-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0 0.2rem;
}
.popup-task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.popup-task-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text);
}
.popup-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.popup-task-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Note:** The `#calendar-view` section needs `position: relative` for absolute popup positioning. Add to CSS:
```css
#calendar-view { position: relative; }
```

**Step 3: Verify**
Click a day with tasks — popup appears with date label and task list. Clicking × or pressing Escape closes it. Clicking outside closes it.

**Step 4: Commit**
```bash
git add app.js style.css
git commit -m "feat: add day popup showing tasks due on clicked calendar date"
```

---

### Task 8: Custom date picker — HTML structure

**Files:**
- Modify: `index.html` — replace both date inputs in add-modal and edit-modal

**Step 1: Replace date input in add-modal**

Find in `index.html`:
```html
            <label for="due-date" class="sr-only">Due date</label>
            <input type="date" id="due-date" />
```

Replace with:
```html
            <div class="date-picker-wrapper">
              <label class="sr-only" for="due-date-hidden">Due date</label>
              <button type="button" class="date-picker-trigger" id="due-date-trigger" aria-haspopup="true">No date set</button>
              <input type="date" id="due-date" class="sr-only" tabindex="-1" />
              <div class="date-picker-dropdown hidden" id="due-date-dropdown">
                <div class="picker-shortcuts">
                  <button type="button" data-picker="due-date" data-offset="0">Today</button>
                  <button type="button" data-picker="due-date" data-offset="1">Tomorrow</button>
                  <button type="button" data-picker="due-date" data-offset="7">+1 week</button>
                  <button type="button" data-picker="due-date" data-clear>Clear</button>
                </div>
                <div class="picker-mini-cal" id="due-date-cal" data-picker="due-date"></div>
              </div>
            </div>
```

**Step 2: Replace date input in edit-modal**

Find:
```html
            <label for="edit-due-date" class="sr-only">Due date</label>
            <input type="date" id="edit-due-date" />
```

Replace with:
```html
            <div class="date-picker-wrapper">
              <label class="sr-only" for="edit-due-date">Due date</label>
              <button type="button" class="date-picker-trigger" id="edit-due-date-trigger" aria-haspopup="true">No date set</button>
              <input type="date" id="edit-due-date" class="sr-only" tabindex="-1" />
              <div class="date-picker-dropdown hidden" id="edit-due-date-dropdown">
                <div class="picker-shortcuts">
                  <button type="button" data-picker="edit-due-date" data-offset="0">Today</button>
                  <button type="button" data-picker="edit-due-date" data-offset="1">Tomorrow</button>
                  <button type="button" data-picker="edit-due-date" data-offset="7">+1 week</button>
                  <button type="button" data-picker="edit-due-date" data-clear>Clear</button>
                </div>
                <div class="picker-mini-cal" id="edit-due-date-cal" data-picker="edit-due-date"></div>
              </div>
            </div>
```

**Step 3: Add date-picker CSS**

```css
/* ── Date Picker ─────────────────────────────────────── */
.date-picker-wrapper {
  position: relative;
}
.date-picker-trigger {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.date-picker-trigger:hover { border-color: var(--accent); }
.date-picker-trigger.has-date { color: var(--text); font-weight: 500; }
.date-picker-dropdown {
  position: absolute;
  z-index: 300;
  top: calc(100% + 4px);
  left: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 0.75rem;
  width: 240px;
}
.picker-shortcuts {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}
.picker-shortcuts button {
  flex: 1;
  min-width: fit-content;
  padding: 0.3rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.picker-shortcuts button:hover {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
/* Mini calendar grid */
.picker-mini-cal .month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}
.picker-mini-cal .month-nav button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 0 0.25rem;
}
.picker-mini-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.picker-mini-grid .day-hdr {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0.15rem 0;
}
.picker-day {
  text-align: center;
  font-size: 0.75rem;
  padding: 0.25rem 0;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text);
  transition: background 0.1s;
}
.picker-day:hover { background: var(--hover-bg); }
.picker-day.today { font-weight: 700; color: var(--accent); }
.picker-day.selected { background: var(--accent); color: #fff; border-radius: 50%; }
.picker-day.other { color: var(--text-muted); }
.picker-day.empty { cursor: default; }
```

**Step 4: Commit**
```bash
git add index.html style.css
git commit -m "feat: add date picker HTML structure and CSS to modals"
```

---

### Task 9: Date picker — JavaScript logic

**Files:**
- Modify: `app.js` — add `initDatePicker`, `renderPickerCal` functions

**Step 1: Add date picker logic**

Add in the `// ── Add Task Modal ──` section (before or after existing modal functions):

```js
// ── Date Picker ───────────────────────────────────────
function initDatePicker(pickerId) {
  const trigger   = document.getElementById(`${pickerId}-trigger`);
  const input     = document.getElementById(pickerId);
  const dropdown  = document.getElementById(`${pickerId}-dropdown`);
  const calDiv    = document.getElementById(`${pickerId}-cal`);
  let pickerMonth = new Date();
  pickerMonth.setDate(1);
  pickerMonth.setHours(0, 0, 0, 0);

  function getSelectedDate() {
    return input.value ? input.value : null;
  }

  function updateTrigger() {
    const val = input.value;
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      trigger.textContent = label;
      trigger.classList.add('has-date');
    } else {
      trigger.textContent = 'No date set';
      trigger.classList.remove('has-date');
    }
  }

  function renderMiniCal() {
    const year  = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const today = new Date(); today.setHours(0,0,0,0);
    const selected = getSelectedDate();

    const firstDay  = new Date(year, month, 1);
    const lastDay   = new Date(year, month + 1, 0);
    const offset    = firstDay.getDay();

    const monthLabel = pickerMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let html = `
      <div class="month-nav">
        <button type="button" class="picker-prev">&lsaquo;</button>
        <span>${monthLabel}</span>
        <button type="button" class="picker-next">&rsaquo;</button>
      </div>
      <div class="picker-mini-grid">
        ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="day-hdr">${d}</div>`).join('')}
    `;

    for (let i = 0; i < offset; i++) html += '<div class="picker-day empty"></div>';

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cellDate = new Date(year, month, day);
      const key = toDateKey(cellDate);
      const isToday    = cellDate.getTime() === today.getTime();
      const isSelected = key === selected;
      const cls = ['picker-day', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
      html += `<div class="${cls}" data-date="${key}">${day}</div>`;
    }

    html += '</div>';
    calDiv.innerHTML = html;

    calDiv.querySelector('.picker-prev').addEventListener('click', () => {
      pickerMonth.setMonth(pickerMonth.getMonth() - 1);
      renderMiniCal();
    });
    calDiv.querySelector('.picker-next').addEventListener('click', () => {
      pickerMonth.setMonth(pickerMonth.getMonth() + 1);
      renderMiniCal();
    });
    calDiv.querySelectorAll('.picker-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.dataset.date;
        updateTrigger();
        dropdown.classList.add('hidden');
      });
    });
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const wasHidden = dropdown.classList.contains('hidden');
    // Close all other pickers
    document.querySelectorAll('.date-picker-dropdown').forEach(d => d.classList.add('hidden'));
    if (wasHidden) {
      // Sync pickerMonth to selected date if any
      if (input.value) {
        const [y, m] = input.value.split('-').map(Number);
        pickerMonth = new Date(y, m - 1, 1);
      }
      renderMiniCal();
      dropdown.classList.remove('hidden');
    }
  });

  // Shortcut buttons
  dropdown.querySelectorAll('[data-offset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(btn.dataset.offset));
      input.value = toDateKey(d);
      updateTrigger();
      dropdown.classList.add('hidden');
    });
  });

  // Clear button
  const clearBtn = dropdown.querySelector('[data-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      updateTrigger();
      dropdown.classList.add('hidden');
    });
  }

  // Close on outside click
  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && e.target !== trigger) {
      dropdown.classList.add('hidden');
    }
  });

  return { updateTrigger };
}
```

**Step 2: Initialize pickers and sync with form reset**

Add to `// ── Init ──` section (after `refresh()` and `initDragDrop()`):

```js
const addPicker  = initDatePicker('due-date');
const editPicker = initDatePicker('edit-due-date');
```

**Step 3: Sync edit picker trigger when opening edit modal**

In `openEdit()`, after setting `document.getElementById('edit-due-date').value = task.dueDate || ''`, add:
```js
  editPicker.updateTrigger();
```

**Step 4: Reset add picker trigger when closing add modal**

In `closeAddModal()`, after `document.getElementById('task-form').reset()`, add:
```js
  addPicker.updateTrigger();
```

**Step 5: Verify**
Open Add Task modal. The due date field shows "No date set" button. Click it → dropdown appears with Today/Tomorrow/+1 week/Clear shortcuts and a mini calendar grid. Click Today → button updates to today's date, dropdown closes. Open Edit modal on a task with a date → trigger shows the existing date.

**Step 6: Commit**
```bash
git add app.js
git commit -m "feat: implement custom date picker with shortcuts and mini calendar grid"
```

---

### Task 10: Wire calendar to refresh and create PR #10

**Step 1: Make `refresh()` also re-render calendar if it's active**

Find the `refresh()` function:
```js
function refresh() {
  updateProjectFilter();
  renderTasks(getFiltered());
}
```

Replace with:
```js
function refresh() {
  updateProjectFilter();
  renderTasks(getFiltered());
  const isCalendar = localStorage.getItem('focus_view') === 'calendar';
  if (isCalendar) renderCalendar();
}
```

**Step 2: Final browser check**
- Add a task with a due date → appears as dot on calendar
- Mark task done → dot disappears on calendar (re-render)
- Day popup shows correct task info
- Date picker works in both modals
- Month/Week toggle works
- Prev/Next/Today nav works

**Step 3: Commit**
```bash
git add app.js
git commit -m "feat: refresh calendar on task changes"
```

**Step 4: Push and open PR #10**
```bash
git checkout -b feature/calendar
# (or git push origin feature/calendar if already on branch)
git push origin feature/calendar
gh pr create --title "feat: calendar view with due-date dots, day popup, and custom date picker" --body "$(cat <<'EOF'
## Summary
- Board/Calendar view toggle in header, persisted to localStorage
- Month grid (7-col, Sun–Sat) and week grid with priority-colored dots + overflow badge
- Popup on day click showing tasks due with priority dot and project badge
- Custom date picker in Add/Edit modals: Today/Tomorrow/+1 week shortcuts + mini calendar grid
- Calendar auto-refreshes when tasks change

## Test plan
- [ ] Switch Board ↔ Calendar — layout swaps, state persists on reload
- [ ] Month grid: today outlined green, tasks show colored dots, +N overflow badge
- [ ] Week grid: task title chips visible, color-coded by priority
- [ ] Day popup: click day with tasks → popup appears, Escape/outside click closes
- [ ] Date picker: shortcuts set correct dates, mini grid navigation works, Clear works
- [ ] Edit modal: picker shows existing date on open

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## === PR #11: feature/ux-polish ===

*(After PR #10 is merged, checkout main, pull, create feature/ux-polish branch)*

```bash
git checkout main && git pull origin main
git checkout -b feature/ux-polish
```

---

### Task 11: Mobile responsive CSS

**Files:**
- Modify: `style.css` — add `@media (max-width: 640px)` block

**Step 1: Add mobile breakpoint styles**

Add at the end of `style.css`:

```css
/* ── Mobile (≤ 640px) ────────────────────────────────── */
@media (max-width: 640px) {
  /* Header */
  header {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
  #task-stats { display: none; }

  /* View toggle below header */
  .view-toggle { order: -1; }

  /* Search section */
  .search-section {
    flex-direction: column;
    gap: 0.5rem;
  }
  .filters {
    flex-direction: row;
    flex-wrap: wrap;
  }

  /* Kanban: stack columns vertically */
  .kanban-board {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* Calendar */
  .cal-topbar {
    gap: 0.5rem;
    justify-content: space-between;
  }
  .cal-label { width: 100%; text-align: center; order: -1; }
  .month-grid { font-size: 0.75rem; }
  .cal-cell { min-height: 52px; padding: 0.25rem; }
  .cal-day-num { font-size: 0.7rem; }
  .week-grid { grid-template-columns: repeat(7, 1fr); }
  .week-col-header { padding: 0.35rem 0.1rem; }
  .week-day-name { font-size: 0.6rem; }
  .week-day-num { font-size: 0.8rem; }
  .week-task-chip { font-size: 0.6rem; padding: 0.15rem 0.2rem; }

  /* Day popup — full width at bottom on mobile */
  .day-popup {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 12px 12px 0 0;
    top: auto;
    padding-bottom: env(safe-area-inset-bottom, 1rem);
  }

  /* Modals */
  .modal-box {
    width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.25rem;
  }

  /* Date picker dropdown */
  .date-picker-dropdown {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 1rem);
    left: 1rem;
    right: 1rem;
    width: auto;
    top: auto;
  }
}
```

**Step 2: Verify on mobile**
Open DevTools → mobile viewport (375px). Kanban columns should stack. Header should wrap cleanly. Calendar should be usable.

**Step 3: Commit**
```bash
git add style.css
git commit -m "fix: add mobile responsive styles for kanban, calendar, modals"
```

---

### Task 12: Animation improvements

**Files:**
- Modify: `style.css` — refine existing and add new keyframes/transitions

**Step 1: Improve modal open/close animation**

Find existing `.modal` styles and add/update:
```css
.modal-box {
  /* existing styles + */
  animation: modal-in 0.2s ease;
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
```

**Step 2: Improve view switch animation**

Add `.kanban-board` and `#calendar-view` fade transitions:
```css
.kanban-board, #calendar-view {
  animation: fade-in 0.18s ease;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Step 3: Improve task completion animation**

Find `.task-item.done .task-title` and ensure strikethrough animates:
```css
.task-item.done .task-title {
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
  transition: text-decoration 0.3s ease;
}
```

**Step 4: Polish `.animate-in` keyframe (new tasks)**

Find existing `.animate-in` definition and replace/update:
```css
@keyframes task-appear {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-in {
  animation: task-appear 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Step 5: Enhance task deletion**

Find `.task-item.removing` and update:
```css
.task-item.removing {
  animation: task-remove 0.18s ease forwards;
}
@keyframes task-remove {
  to { opacity: 0; transform: translateX(-12px) scale(0.97); max-height: 0; margin: 0; padding: 0; }
}
```

**Step 6: Verify**
Add a task → slides in smoothly. Delete → slides out. Open modal → scales in. Switch views → fades in.

**Step 7: Commit**
```bash
git add style.css
git commit -m "fix: improve modal, view switch, task add/remove animations"
```

---

### Task 13: Dark mode contrast fixes

**Files:**
- Modify: `style.css` — audit and fix dark mode badge/text contrast

**Step 1: Fix overdue badge in dark mode**

Find or add:
```css
.dark .badge.overdue {
  background: #450a0a;
  color: #fca5a5;
  border: 1px solid #7f1d1d;
}
```

**Step 2: Fix column count badges**

```css
.dark .col-count {
  background: rgba(255,255,255,0.12);
  color: var(--text);
}
```

**Step 3: Fix empty state text**

```css
.dark .col-empty {
  color: var(--text-muted);
  opacity: 0.7;
}
```

**Step 4: Fix modal in dark mode**

```css
.dark .modal-box {
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
```

**Step 5: Fix date picker in dark mode**

```css
.dark .date-picker-dropdown,
.dark .day-popup {
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.dark .picker-day:hover { background: rgba(255,255,255,0.08); }
.dark .picker-day.selected { background: var(--accent); }
```

**Step 6: Fix calendar cells in dark mode**

```css
.dark .cal-cell { background: var(--card-bg); }
.dark .cal-cell:hover { background: var(--hover-bg); }
.dark .cal-day-header { background: var(--card-bg); }
```

**Step 7: Verify**
Toggle dark mode. Check: overdue badge readable, column counts visible, empty state text visible, modals have proper shadows, calendar cells have distinct hover.

**Step 8: Commit and open PR #11**
```bash
git add style.css
git commit -m "fix: improve dark mode contrast for badges, calendar, and date picker"

git push origin feature/ux-polish
gh pr create --title "fix: mobile responsive, animation polish, dark mode contrast" --body "$(cat <<'EOF'
## Summary
- Mobile (≤640px): Kanban stacks vertically, modals go fullscreen, day popup anchors to bottom, calendar scales down
- Animations: modal scale-in, view switch fade, task appear with spring, task remove slide-out
- Dark mode: overdue badge, column counts, empty state, calendar cells, date picker all meet WCAG AA contrast

## Test plan
- [ ] 375px viewport — kanban stacks, modals fill screen, calendar usable
- [ ] Add/delete tasks — smooth appear/disappear animations
- [ ] Open/close modals — scale-in animation
- [ ] Toggle Board↔Calendar — fade-in transition
- [ ] Dark mode — all badges/text readable, no washed-out elements

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Summary

| PR | Branch | Tasks | Key deliverables |
|----|--------|-------|-----------------|
| #10 | feature/calendar | 1–10 | View toggle, month/week grid, priority dots, day popup, custom date picker |
| #11 | feature/ux-polish | 11–13 | Mobile layout, animations, dark mode contrast |

**Execution order:** Complete all Tasks 1–10 and merge PR #10 before starting PR #11.
