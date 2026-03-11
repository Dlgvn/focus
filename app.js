// ── Storage ─────────────────────────────────────────
const STORAGE_KEY = 'focus_tasks';

function loadTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  if (syncChannel) syncChannel.postMessage('sync');
}

// ── Tab Sync ─────────────────────────────────────────
const syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('focus_sync')
  : null;
if (syncChannel) syncChannel.onmessage = () => refresh();

function nextId(tasks) {
  return tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.id)) + 1;
}

// ── Dark Mode ────────────────────────────────────────
const toggle   = document.getElementById('dark-mode-toggle');
const iconMoon = document.getElementById('icon-moon');
const iconSun  = document.getElementById('icon-sun');

function applyDarkMode(on) {
  document.body.classList.toggle('dark', on);
  iconMoon.classList.toggle('hidden', on);
  iconSun.classList.toggle('hidden', !on);
}

// Auto-detect system preference, fall back to saved preference
const savedDark = localStorage.getItem('focus_dark');
if (savedDark !== null) {
  applyDarkMode(savedDark === 'true');
} else {
  applyDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
}

toggle.addEventListener('click', () => {
  const on = !document.body.classList.contains('dark');
  applyDarkMode(on);
  localStorage.setItem('focus_dark', on);
});

// ── Active Tag Filter ─────────────────────────────────
let activeTagFilter = null;

function setTagFilter(tag) {
  activeTagFilter = activeTagFilter === tag ? null : tag;
  refresh();
}

// ── Project Filter Dropdown ───────────────────────────
function updateProjectFilter() {
  const tasks = loadTasks();
  const projects = [...new Set(tasks.map(t => t.project).filter(Boolean))].sort();
  const select = document.getElementById('filter-project');
  const current = select.value;

  select.innerHTML = '<option value="all">All projects</option>';
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// ── Drag & Drop State ─────────────────────────────────
let draggedId = null;

// ── Render ───────────────────────────────────────────
const PRIORITIES = ['urgent', 'normal', 'someday'];

const COL_EMPTY_DEFAULT = {
  urgent:  'No urgent tasks',
  normal:  'All clear!',
  someday: 'Nothing here yet',
};

function renderTasks(filtered) {
  // Update header stats from full task list
  const allTasks = loadTasks();
  const activeCount = allTasks.filter(t => !t.done).length;
  const doneCount   = allTasks.filter(t => t.done).length;
  const statsEl = document.getElementById('task-stats');
  statsEl.textContent = (activeCount === 0 && doneCount === 0)
    ? ''
    : `${activeCount} active · ${doneCount} done`;

  PRIORITIES.forEach(priority => {
    const list    = document.getElementById(`tasks-${priority}`);
    const emptyEl = document.getElementById(`empty-${priority}`);
    const countEl = document.getElementById(`count-${priority}`);

    const col    = filtered.filter(t => t.priority === priority);
    const active = col.filter(t => !t.done);
    const done   = col.filter(t => t.done);
    const sorted = [...active, ...done]; // done tasks sink to bottom

    // Detect: empty because of filter vs genuinely no tasks
    const totalInCol = allTasks.filter(t => t.priority === priority).length;
    const isFilterEmpty = totalInCol > 0 && sorted.length === 0;

    list.innerHTML = '';
    countEl.textContent = active.length;

    if (sorted.length === 0) {
      emptyEl.textContent = isFilterEmpty ? 'No matches' : COL_EMPTY_DEFAULT[priority];
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      sorted.forEach(task => list.appendChild(createTaskEl(task)));
    }
  });
}

function createTaskEl(task) {
  const due = formatDueDate(task.dueDate);
  const isOverdue = !task.done && due?.overdue;

  const li = document.createElement('li');
  li.className = `task-item ${task.priority}${task.done ? ' done' : ''}${isOverdue ? ' overdue-task' : ''}`;
  li.dataset.id = task.id;

  const tags = (task.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => {
      const isActive = activeTagFilter === t;
      return `<span class="badge tag${isActive ? ' active' : ''}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`;
    })
    .join('');

  const dueBadge = due
    ? `<span class="badge${due.overdue && !task.done ? ' overdue' : ''}">${due.label}</span>`
    : '';

  const gripHandle = !task.done ? `
    <div class="drag-handle" aria-hidden="true">
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
        <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
        <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
      </svg>
    </div>` : '';

  li.innerHTML = `
    ${gripHandle}
    <div class="task-inner">
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${task.project ? `<span class="badge">${escapeHtml(task.project)}</span>` : ''}
          ${dueBadge}
          ${tags}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-done" aria-label="${task.done ? 'Undo task' : 'Mark task done'}">${task.done ? 'Undo' : 'Done'}</button>
        <button class="btn-edit" aria-label="Edit task">Edit</button>
        <button class="btn-delete" aria-label="Delete task">Delete</button>
      </div>
    </div>
  `;

  li.querySelector('.btn-done').addEventListener('click', () => toggleDone(task.id));
  li.querySelector('.btn-edit').addEventListener('click', () => openEdit(task.id));
  li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));

  li.querySelectorAll('.badge.tag').forEach(badge => {
    badge.addEventListener('click', () => setTagFilter(badge.dataset.tag));
  });

  if (!task.done) {
    li.draggable = true;
    li.addEventListener('dragstart', e => {
      draggedId = task.id;
      e.dataTransfer.effectAllowed = 'move';
      requestAnimationFrame(() => li.classList.add('dragging'));
    });
    li.addEventListener('dragend', () => {
      draggedId = null;
      li.classList.remove('dragging');
      document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
    });
  }

  return li;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Drag & Drop ───────────────────────────────────────
function getDragAfterEl(list, y) {
  const items = [...list.querySelectorAll('.task-item:not(.dragging):not(.done)')];
  return items.reduce((closest, el) => {
    const { top, height } = el.getBoundingClientRect();
    const offset = y - top - height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, el };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).el ?? null;
}

function reorderTask(id, newPriority, afterEl) {
  let tasks = loadTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  const [task] = tasks.splice(idx, 1);
  task.priority = newPriority;

  if (afterEl) {
    const afterId = parseInt(afterEl.dataset.id);
    const afterIdx = tasks.findIndex(t => t.id === afterId);
    tasks.splice(afterIdx, 0, task);
  } else {
    // Place before done tasks in this priority column
    const lastActiveIdx = tasks.reduce((last, t, i) =>
      (t.priority === newPriority && !t.done) ? i : last, -1);
    tasks.splice(lastActiveIdx + 1, 0, task);
  }

  saveTasks(tasks);
  refresh();
}

function initDragDrop() {
  PRIORITIES.forEach(priority => {
    const list = document.getElementById(`tasks-${priority}`);

    list.addEventListener('dragover', e => {
      if (draggedId === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const afterEl = getDragAfterEl(list, e.clientY);
      document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
      if (afterEl) afterEl.classList.add('drop-before');
    });

    list.addEventListener('dragleave', e => {
      if (!list.contains(e.relatedTarget)) {
        document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
      }
    });

    list.addEventListener('drop', e => {
      e.preventDefault();
      if (draggedId === null) return;
      const afterEl = getDragAfterEl(list, e.clientY);
      document.querySelectorAll('.drop-before').forEach(el => el.classList.remove('drop-before'));
      reorderTask(draggedId, priority, afterEl);
    });
  });
}

// ── Due Date Formatting ───────────────────────────────
function formatDueDate(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse as local date to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diff < 0)  return { label: `Overdue · ${formatted}`, overdue: true };
  if (diff === 0) return { label: `Today · ${formatted}`,  overdue: false };
  if (diff === 1) return { label: `Tomorrow · ${formatted}`, overdue: false };
  if (diff <= 7)  return { label: `In ${diff} days · ${formatted}`, overdue: false };
  return { label: formatted, overdue: false };
}

// ── Filter + Sort ─────────────────────────────────────
function getFiltered() {
  const query   = document.getElementById('search').value.toLowerCase().trim();
  const project = document.getElementById('filter-project').value;
  const sortBy  = document.getElementById('sort-by').value;

  let result = loadTasks();

  if (query) {
    result = result.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.project || '').toLowerCase().includes(query) ||
      (t.tags || '').toLowerCase().includes(query)
    );
  }

  if (project !== 'all') {
    result = result.filter(t => t.project === project);
  }

  if (activeTagFilter) {
    result = result.filter(t =>
      (t.tags || '').split(',').map(s => s.trim()).includes(activeTagFilter)
    );
  }

  if (sortBy === 'due') {
    result = [...result].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  return result;
}

function refresh() {
  updateProjectFilter();
  renderTasks(getFiltered());
}

document.getElementById('search').addEventListener('input', refresh);
document.getElementById('filter-project').addEventListener('change', refresh);
document.getElementById('sort-by').addEventListener('change', refresh);

// ── Actions ──────────────────────────────────────────
function toggleDone(id) {
  const tasks = loadTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks(tasks);
  refresh();
}

function deleteTask(id) {
  const li = document.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('removing');
    setTimeout(() => {
      saveTasks(loadTasks().filter(t => t.id !== id));
      refresh();
    }, 150);
  } else {
    saveTasks(loadTasks().filter(t => t.id !== id));
    refresh();
  }
}

// ── Add Task Modal ────────────────────────────────────
const addModal = document.getElementById('add-modal');

function openAddModal() {
  addModal.classList.remove('hidden');
  document.getElementById('title').focus();
}

function closeAddModal() {
  addModal.classList.add('hidden');
  document.getElementById('task-form').reset();
  document.getElementById('priority').value = 'normal';
}

document.getElementById('add-task-btn').addEventListener('click', openAddModal);
document.getElementById('add-cancel').addEventListener('click', closeAddModal);
addModal.addEventListener('click', e => { if (e.target === addModal) closeAddModal(); });

// ── Edit Modal ────────────────────────────────────────
const modal = document.getElementById('edit-modal');
let editingId = null;

function openEdit(id) {
  const task = loadTasks().find(t => t.id === id);
  if (!task) return;

  editingId = id;
  document.getElementById('edit-title').value        = task.title;
  document.getElementById('edit-project').value      = task.project || '';
  document.getElementById('edit-tags').value         = task.tags || '';
  document.getElementById('edit-description').value  = task.description || '';
  document.getElementById('edit-priority').value     = task.priority;
  document.getElementById('edit-due-date').value     = task.dueDate || '';

  modal.classList.remove('hidden');
  document.getElementById('edit-title').focus();
}

function closeModal() {
  modal.classList.add('hidden');
  editingId = null;
}

document.getElementById('edit-cancel').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!addModal.classList.contains('hidden')) closeAddModal();
    else if (!modal.classList.contains('hidden')) closeModal();
  }
});

document.getElementById('edit-form').addEventListener('submit', e => {
  e.preventDefault();
  if (editingId === null) return;

  const tasks = loadTasks().map(t => {
    if (t.id !== editingId) return t;
    return {
      ...t,
      title:       document.getElementById('edit-title').value.trim(),
      project:     document.getElementById('edit-project').value.trim(),
      tags:        document.getElementById('edit-tags').value.trim(),
      description: document.getElementById('edit-description').value.trim(),
      priority:    document.getElementById('edit-priority').value,
      dueDate:     document.getElementById('edit-due-date').value,
    };
  });

  saveTasks(tasks);
  closeModal();
  refresh();
});

// ── Add Task ─────────────────────────────────────────
document.getElementById('task-form').addEventListener('submit', e => {
  e.preventDefault();

  const tasks = loadTasks();
  const priority = document.getElementById('priority').value;
  const task = {
    id:          nextId(tasks),
    title:       document.getElementById('title').value.trim(),
    project:     document.getElementById('project').value.trim(),
    tags:        document.getElementById('tags').value.trim(),
    description: document.getElementById('description').value.trim(),
    priority,
    dueDate:     document.getElementById('due-date').value,
    done:        false,
    createdAt:   new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks(tasks);
  closeAddModal();
  refresh();

  // Animate the new task at the top of its priority column
  const newItem = document.querySelector(`#tasks-${priority} .task-item`);
  if (newItem) {
    newItem.classList.add('animate-in');
    newItem.addEventListener('animationend', () => newItem.classList.remove('animate-in'), { once: true });
  }
});

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

// ── Calendar State ────────────────────────────────────
let calMode = 'month'; // 'month' | 'week'
let calDate = new Date();
calDate.setHours(0, 0, 0, 0);

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

// ── Calendar Helpers ──────────────────────────────────
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
  const dots = dayTasks.slice(0, 3).map(t =>
    `<span class="cal-dot ${PRIORITY_COLOR[t.priority] || 'dot-normal'}"></span>`
  ).join('');
  const overflow = dayTasks.length > 3
    ? `<span class="cal-overflow">+${dayTasks.length - 3}</span>`
    : '';
  return `<div class="cal-dots">${dots}${overflow}</div>`;
}

function renderMonthGrid() {
  const grid = document.getElementById('cal-grid');
  const tasks = loadTasks();

  const year  = calDate.getFullYear();
  const month = calDate.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();

  const taskMap = buildTaskMap(tasks);

  let html = '<div class="month-grid">';

  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  for (let i = 0; i < startOffset; i++) {
    html += '<div class="cal-cell other-month"></div>';
  }

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

  const total = startOffset + lastDay.getDate();
  const remainder = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 0; i < remainder; i++) {
    html += '<div class="cal-cell other-month"></div>';
  }

  html += '</div>';
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const key = cell.dataset.date;
      const dayTasks = taskMap[key] || [];
      if (dayTasks.length > 0) showDayPopup(cell, key, dayTasks);
      else closeDayPopup();
    });
  });
}

function renderWeekGrid() {
  document.getElementById('cal-grid').textContent = 'Week grid coming...';
}

// Navigation
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
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
  } else {
    calDate.setDate(calDate.getDate() - 7);
  }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  if (calMode === 'month') {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
  } else {
    calDate.setDate(calDate.getDate() + 7);
  }
  renderCalendar();
});

// ── Init ──────────────────────────────────────────────
refresh();
initDragDrop();
