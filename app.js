// ── Storage ─────────────────────────────────────────
const STORAGE_KEY = 'focus_tasks';

function loadTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

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

// ── Render ───────────────────────────────────────────
function renderTasks(tasks) {
  const list  = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  list.innerHTML = '';

  if (tasks.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.priority}${task.done ? ' done' : ''}`;
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

    li.innerHTML = `
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          ${task.project ? `<span class="badge">${escapeHtml(task.project)}</span>` : ''}
          ${task.dueDate ? `<span class="badge">Due: ${task.dueDate}</span>` : ''}
          ${tags}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-done" aria-label="${task.done ? 'Undo task' : 'Mark task done'}">${task.done ? 'Undo' : 'Done'}</button>
        <button class="btn-edit" aria-label="Edit task">Edit</button>
        <button class="btn-delete" aria-label="Delete task">Delete</button>
      </div>
    `;

    li.querySelector('.btn-done').addEventListener('click', () => toggleDone(task.id));
    li.querySelector('.btn-edit').addEventListener('click', () => openEdit(task.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));

    li.querySelectorAll('.badge.tag').forEach(badge => {
      badge.addEventListener('click', () => setTagFilter(badge.dataset.tag));
    });

    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Filter + Sort ─────────────────────────────────────
function getFilteredSorted(tasks) {
  const query    = document.getElementById('search').value.toLowerCase().trim();
  const priority = document.getElementById('filter-priority').value;
  const sortBy   = document.getElementById('sort-by').value;

  let result = tasks;

  if (query) {
    result = result.filter(t =>
      t.title.toLowerCase().includes(query) ||
      (t.project || '').toLowerCase().includes(query) ||
      (t.tags || '').toLowerCase().includes(query)
    );
  }

  if (priority !== 'all') {
    result = result.filter(t => t.priority === priority);
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
  } else if (sortBy === 'priority') {
    const order = { urgent: 0, normal: 1, someday: 2 };
    result = [...result].sort((a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1));
  }

  return result;
}

function refresh() {
  renderTasks(getFilteredSorted(loadTasks()));
}

document.getElementById('search').addEventListener('input', refresh);
document.getElementById('filter-priority').addEventListener('change', refresh);
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
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
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
  const task = {
    id:          nextId(tasks),
    title:       document.getElementById('title').value.trim(),
    project:     document.getElementById('project').value.trim(),
    tags:        document.getElementById('tags').value.trim(),
    description: document.getElementById('description').value.trim(),
    priority:    document.getElementById('priority').value,
    dueDate:     document.getElementById('due-date').value,
    done:        false,
    createdAt:   new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks(tasks);
  refresh();

  // Animate the newly added task (first in list)
  const firstItem = document.querySelector('#task-list .task-item');
  if (firstItem) {
    firstItem.classList.add('animate-in');
    firstItem.addEventListener('animationend', () => firstItem.classList.remove('animate-in'), { once: true });
  }

  e.target.reset();
  document.getElementById('priority').value = 'normal';
  document.getElementById('title').focus();
});

// ── Init ──────────────────────────────────────────────
refresh();
