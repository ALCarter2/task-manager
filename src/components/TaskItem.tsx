import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types/task';
import { plainText, sanitizeTitle } from '../utils/sanitize';
import './TaskItem.css';

type FormatType = 'bold' | 'italic' | 'underline';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function TaskItem({ task, onToggle, onDelete, onUpdate }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<FormatType, boolean>>({
    bold: false,
    italic: false,
    underline: false,
  });

  const editorRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  // When editing starts: seed the editor with the current title and focus it.
  // task.title is intentionally excluded from deps — we only want to seed once
  // on entry, not reset the editor every render while the user is typing.
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    editorRef.current.innerHTML = task.title;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false); // cursor to end
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  function syncFormatState() {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }

  function applyFormat(format: FormatType) {
    editorRef.current?.focus();
    document.execCommand(format, false, undefined);
    syncFormatState();
  }

  function save() {
    const html = editorRef.current?.innerHTML ?? '';
    const text = plainText(html);
    if (text) onUpdate(task.id, sanitizeTitle(html));
    setIsEditing(false);
  }

  function handleEditorKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === 'Escape') setIsEditing(false);
  }

  const overdue =
    task.dueDate && !task.completed && new Date(task.dueDate + 'T00:00:00') < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'task-item',
        `task-item--${task.priority}`,
        task.completed ? 'task-item--completed' : '',
        isDragging ? 'task-item--dragging' : '',
        isEditing ? 'task-item--editing' : '',
      ].filter(Boolean).join(' ')}
    >
      <button className="task-item__drag" aria-label="Drag to reorder" {...listeners} {...attributes}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
          <circle cx="3" cy="2.5" r="1.5" fill="currentColor" />
          <circle cx="7" cy="2.5" r="1.5" fill="currentColor" />
          <circle cx="3" cy="7" r="1.5" fill="currentColor" />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
          <circle cx="3" cy="11.5" r="1.5" fill="currentColor" />
          <circle cx="7" cy="11.5" r="1.5" fill="currentColor" />
        </svg>
      </button>

      <button
        className={`task-item__check${task.completed ? ' task-item__check--done' : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M1.5 5.5L4.5 8.5L9.5 2.5" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="task-item__body">
        {isEditing ? (
          <>
            <div
              ref={editorRef}
              className="task-item__editor"
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Edit task title"
              aria-multiline={false}
              onKeyDown={handleEditorKeyDown}
              onKeyUp={syncFormatState}
              onMouseUp={syncFormatState}
              onBlur={save}
            />
            <div className="task-item__edit-toolbar">
              <div className="task-item__format-group" role="toolbar" aria-label="Text formatting">
                {(['bold', 'italic', 'underline'] as FormatType[]).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    className={`task-item__format-btn task-item__format-btn--${fmt}${activeFormats[fmt] ? ' is-active' : ''}`}
                    onMouseDown={e => { e.preventDefault(); applyFormat(fmt); }}
                    aria-pressed={activeFormats[fmt]}
                    title={fmt.charAt(0).toUpperCase() + fmt.slice(1)}
                  >
                    {fmt === 'bold' ? 'B' : fmt === 'italic' ? 'I' : 'U'}
                  </button>
                ))}
              </div>
              <span className="task-item__edit-hint">Enter to save · Esc to cancel</span>
            </div>
          </>
        ) : (
          <>
            <span
              className="task-item__title"
              dangerouslySetInnerHTML={{ __html: task.title }}
              onClick={() => !isDragging && !task.completed && setIsEditing(true)}
              role={task.completed ? undefined : 'button'}
              tabIndex={task.completed ? undefined : 0}
              onKeyDown={e => e.key === 'Enter' && !task.completed && setIsEditing(true)}
              aria-label={task.completed ? undefined : `Edit: ${plainText(task.title)}`}
            />
            {task.dueDate && (
              <span className={`task-item__due${overdue ? ' task-item__due--overdue' : ''}`}>
                {overdue ? '!' : ''} {formatDate(task.dueDate)}
              </span>
            )}
          </>
        )}
      </div>

      <span className={`task-item__badge task-item__badge--${task.priority}`}>
        {task.priority}
      </span>

      <button className="task-item__delete" onClick={() => onDelete(task.id)} aria-label="Delete task">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
