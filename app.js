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
const toggle = document.getElementById('dark-mode-toggle');

function applyDarkMode(on) {
  document.body.classList.toggle('dark', on);
  toggle.textContent = on ? '☀️' : '🌙';
}

applyDarkMode(localStorage.getItem('focus_dark') === 'true');

toggle.addEventListener('click', () => {
  const on = !document.body.classList.contains('dark');
  applyDarkMode(on);
  localStorage.setItem('focus_dark', on);
});

// ── Render ───────────────────────────────────────────
function renderTasks(tasks) {
  const list = document.getElementById('task-list');
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
      .map(t => `<span class="badge">${t}</span>`)
      .join('');

    li.innerHTML = `
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge ${task.priority}">${task.priority}</span>
          ${task.project ? `<span class="badge">${escapeHtml(task.project)}</span>` : ''}
          ${task.dueDate ? `<span class="badge">📅 ${task.dueDate}</span>` : ''}
          ${tags}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-done" aria-label="Toggle done">${task.done ? 'Undo' : 'Done'}</button>
        <button class="btn-delete" aria-label="Delete task">Delete</button>
      </div>
    `;

    li.querySelector('.btn-done').addEventListener('click', () => toggleDone(task.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));

    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Actions ──────────────────────────────────────────
function toggleDone(id) {
  const tasks = loadTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks(tasks);
  renderTasks(filterTasks(tasks));
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks(filterTasks(tasks));
}

// ── Add Task ─────────────────────────────────────────
document.getElementById('task-form').addEventListener('submit', e => {
  e.preventDefault();

  const tasks = loadTasks();
  const task = {
    id: nextId(tasks),
    title: document.getElementById('title').value.trim(),
    project: document.getElementById('project').value.trim(),
    tags: document.getElementById('tags').value.trim(),
    description: document.getElementById('description').value.trim(),
    priority: document.getElementById('priority').value,
    dueDate: document.getElementById('due-date').value,
    done: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks(tasks);
  renderTasks(filterTasks(tasks));

  e.target.reset();
  document.getElementById('priority').value = 'normal';
});

// ── Search ────────────────────────────────────────────
function filterTasks(tasks) {
  const query = document.getElementById('search').value.toLowerCase().trim();
  if (!query) return tasks;
  return tasks.filter(t =>
    t.title.toLowerCase().includes(query) ||
    (t.project || '').toLowerCase().includes(query) ||
    (t.tags || '').toLowerCase().includes(query)
  );
}

document.getElementById('search').addEventListener('input', () => {
  renderTasks(filterTasks(loadTasks()));
});

// ── Init ──────────────────────────────────────────────
renderTasks(loadTasks());
