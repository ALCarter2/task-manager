import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { FilterStatus, Priority, Task } from '../types/task';
import { TaskItem } from './TaskItem';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  filterStatus: FilterStatus;
  filterPriority: Priority | 'all';
  onFilterStatus: (status: FilterStatus) => void;
  onFilterPriority: (priority: Priority | 'all') => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  onReorder: (activeId: string, overId: string) => void;
  completedCount: number;
}

const STATUS_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function TaskList({
  tasks,
  filterStatus,
  filterPriority,
  onFilterStatus,
  onFilterPriority,
  onToggle,
  onUpdate,
  onDelete,
  onClearCompleted,
  onReorder,
  completedCount,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <div className="task-list">
      <div className="task-list__toolbar">
        <div className="task-list__tabs" role="tablist" aria-label="Filter tasks by status">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={filterStatus === tab.value}
              className={`task-list__tab${filterStatus === tab.value ? ' is-active' : ''}`}
              onClick={() => onFilterStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          className="task-list__priority-select"
          value={filterPriority}
          onChange={e => onFilterPriority(e.target.value as Priority | 'all')}
          aria-label="Filter by priority"
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="task-list__empty" role="status">
          <div className="task-list__empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
              <path
                d="M13 20l5 5 9-9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="task-list__empty-title">All clear</p>
          <p className="task-list__empty-sub">No tasks match this filter</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="task-list__items">
              {tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {completedCount > 0 && (
        <div className="task-list__footer">
          <button className="task-list__clear" onClick={onClearCompleted}>
            Clear {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'}
          </button>
        </div>
      )}
    </div>
  );
}
