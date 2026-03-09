# Task Manager Specification

## Overview
A CLI task management tool for personal productivity, built with Python 3.11+.

## Features
1. Add tasks with title, optional description, due date, and priority
2. List tasks (all, by status, by priority)
3. Mark tasks complete/incomplete
4. Delete tasks
5. Edit tasks
6. Search tasks by keyword

## Technical Details
- Language: Python 3.11+
- Storage: JSON file (`data/tasks.json`)
- Interface: CLI using Click library

## CLI Commands
```
task add "Title" [--description "..."] [--due DATE] [--priority high/medium/low]
task list [--status done/todo] [--priority high/medium/low]
task done ID
task delete ID
task edit ID [--title "..."] [--description "..."] [--due DATE] [--priority ...]
task search "keyword"
```

## Data Structure
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "due_date": "2026-02-15",
      "priority": "high",
      "status": "todo",
      "created_at": "2026-02-10T10:00:00",
      "updated_at": "2026-02-10T10:00:00"
    }
  ]
}
```

## Success Criteria
- [ ] All commands work as specified
- [ ] Data persists between runs
- [ ] Invalid input is handled gracefully
- [ ] Tests pass
