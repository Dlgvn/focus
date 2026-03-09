"""Tests for Task dataclass and JSON storage utilities."""

import json
import tempfile
from pathlib import Path

import pytest

from task_manager.models import Task
from task_manager.storage import load_tasks, next_id, save_tasks


@pytest.fixture
def tmp_data_file(tmp_path: Path) -> Path:
    """Provide a temporary tasks.json file."""
    f = tmp_path / "tasks.json"
    f.write_text('{"tasks": []}\n')
    return f


# --- Task dataclass tests ---

def test_task_creation():
    task = Task(id=1, title="Buy milk")
    assert task.id == 1
    assert task.title == "Buy milk"
    assert task.status == "todo"
    assert task.priority == "medium"
    assert task.description is None


def test_task_to_dict():
    task = Task(id=1, title="Buy milk", priority="high")
    d = task.to_dict()
    assert d["id"] == 1
    assert d["title"] == "Buy milk"
    assert d["priority"] == "high"
    assert d["status"] == "todo"


def test_task_from_dict():
    data = {
        "id": 2,
        "title": "Write tests",
        "status": "done",
        "description": "All unit tests",
        "due_date": "2026-03-10",
        "priority": "high",
        "created_at": "2026-01-01T00:00:00",
        "updated_at": "2026-01-01T00:00:00",
    }
    task = Task.from_dict(data)
    assert task.id == 2
    assert task.title == "Write tests"
    assert task.status == "done"
    assert task.priority == "high"


def test_task_roundtrip():
    """to_dict → from_dict should produce an equal task."""
    original = Task(id=5, title="Roundtrip test", priority="low", description="desc")
    restored = Task.from_dict(original.to_dict())
    assert restored.id == original.id
    assert restored.title == original.title
    assert restored.priority == original.priority
    assert restored.description == original.description


# --- Storage tests ---

def test_load_tasks_empty_file(tmp_data_file: Path):
    tasks = load_tasks(tmp_data_file)
    assert tasks == []


def test_save_and_load_tasks(tmp_data_file: Path):
    tasks = [Task(id=1, title="First"), Task(id=2, title="Second")]
    save_tasks(tasks, tmp_data_file)

    loaded = load_tasks(tmp_data_file)
    assert len(loaded) == 2
    assert loaded[0].title == "First"
    assert loaded[1].title == "Second"


def test_save_creates_valid_json(tmp_data_file: Path):
    tasks = [Task(id=1, title="Test task")]
    save_tasks(tasks, tmp_data_file)

    raw = json.loads(tmp_data_file.read_text())
    assert "tasks" in raw
    assert raw["tasks"][0]["title"] == "Test task"


def test_load_tasks_missing_file(tmp_path: Path):
    missing = tmp_path / "nonexistent.json"
    tasks = load_tasks(missing)
    assert tasks == []


def test_next_id_empty():
    assert next_id([]) == 1


def test_next_id_with_tasks():
    tasks = [Task(id=1, title="A"), Task(id=3, title="B")]
    assert next_id(tasks) == 4
