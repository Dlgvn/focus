"""JSON storage utilities for tasks."""

import json
import os
from pathlib import Path
from typing import List

from task_manager.models import Task

DEFAULT_DATA_FILE = Path(__file__).parent.parent.parent / "data" / "tasks.json"


def get_data_file() -> Path:
    """Return the path to the tasks JSON file."""
    path = Path(os.environ.get("TASK_DATA_FILE", DEFAULT_DATA_FILE))
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def load_tasks(data_file: Path | None = None) -> List[Task]:
    """Load all tasks from the JSON file. Returns empty list if file is missing."""
    path = data_file or get_data_file()
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [Task.from_dict(t) for t in data.get("tasks", [])]


def save_tasks(tasks: List[Task], data_file: Path | None = None) -> None:
    """Save all tasks to the JSON file."""
    path = data_file or get_data_file()
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"tasks": [t.to_dict() for t in tasks]}, f, indent=2)
        f.write("\n")


def next_id(tasks: List[Task]) -> int:
    """Return the next available task ID."""
    if not tasks:
        return 1
    return max(t.id for t in tasks) + 1
