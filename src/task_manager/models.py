"""Task dataclass definition."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Task:
    """Represents a single task."""

    id: int
    title: str
    status: str = "todo"
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        """Convert Task to a plain dictionary for JSON storage."""
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "description": self.description,
            "due_date": self.due_date,
            "priority": self.priority,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @staticmethod
    def from_dict(data: dict) -> "Task":
        """Create a Task from a dictionary (loaded from JSON)."""
        return Task(
            id=data["id"],
            title=data["title"],
            status=data.get("status", "todo"),
            description=data.get("description"),
            due_date=data.get("due_date"),
            priority=data.get("priority", "medium"),
            created_at=data.get("created_at", datetime.now().isoformat()),
            updated_at=data.get("updated_at", datetime.now().isoformat()),
        )
