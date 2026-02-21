import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, NewTaskInput, FilterStatus, Priority } from '../types/task';

const STORAGE_KEY = 'taskflow-tasks';

export type StorageError = 'full' | 'disabled' | null;

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Task[]) : [];
  } catch {
    // localStorage disabled (SecurityError) or corrupted JSON
    return [];
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [storageError, setStorageError] = useState<StorageError>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      setStorageError(null);
    } catch (err) {
      setStorageError(isQuotaError(err) ? 'full' : 'disabled');
    }
  }, [tasks]);

  function addTask(input: NewTaskInput) {
    const task: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      completed: false,
      priority: input.priority,
      createdAt: new Date().toISOString(),
      dueDate: input.dueDate,
    };
    setTasks(prev => [task, ...prev]);
  }

  function toggleTask(id: string) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function clearCompleted() {
    setTasks(prev => prev.filter(t => !t.completed));
  }

  function updateTask(id: string, title: string) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, title } : t)));
  }

  function reorderTasks(activeId: string, overId: string) {
    setTasks(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId);
      const newIndex = prev.findIndex(t => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const filteredTasks = tasks.filter(t => {
    const statusMatch =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !t.completed) ||
      (filterStatus === 'completed' && t.completed);
    const priorityMatch =
      filterPriority === 'all' || t.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  return {
    tasks: filteredTasks,
    stats,
    storageError,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    clearCompleted,
    reorderTasks,
  };
}
