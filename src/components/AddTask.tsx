import { useState, useRef, type FormEvent } from 'react';
import type { NewTaskInput, Priority } from '../types/task';
import { sanitizeTitle, plainText } from '../utils/sanitize';
import './AddTask.css';

interface AddTaskProps {
  onAdd: (input: NewTaskInput) => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
type FormatType = 'bold' | 'italic' | 'underline';

const FORMAT_LABELS: Record<FormatType, string> = {
  bold: 'B',
  italic: 'I',
  underline: 'U',
};

const FORMAT_SHORTCUTS: Record<FormatType, string> = {
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  underline: 'Ctrl+U',
};

export function AddTask({ onAdd }: AddTaskProps) {
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<FormatType, boolean>>({
    bold: false,
    italic: false,
    underline: false,
  });

  const editorRef = useRef<HTMLDivElement>(null);

  function syncFormatState() {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }

  function handleInput() {
    const text = plainText(editorRef.current?.innerHTML ?? '');
    setHasContent(text.length > 0);
    syncFormatState();
  }

  function applyFormat(format: FormatType) {
    editorRef.current?.focus();
    document.execCommand(format, false, undefined);
    syncFormatState();
  }

  function submit() {
    const html = editorRef.current?.innerHTML ?? '';
    const text = plainText(html);
    if (!text) return;

    onAdd({ title: sanitizeTitle(html), priority, dueDate: dueDate || undefined });

    if (editorRef.current) editorRef.current.innerHTML = '';
    setHasContent(false);
    setExpanded(false);
    setPriority('medium');
    setDueDate('');
    setActiveFormats({ bold: false, italic: false, underline: false });
    editorRef.current?.blur();
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      setExpanded(false);
      editorRef.current?.blur();
    }
    // Let the browser handle Ctrl+B/I/U natively in contentEditable,
    // but sync our state after so the toolbar buttons reflect it.
  }

  return (
    <div className="add-task">
      <form onSubmit={handleFormSubmit} className="add-task__form">
        <div className="add-task__row">
          <div className="add-task__icon">+</div>
          <div
            ref={editorRef}
            className="add-task__editor"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Task title"
            aria-multiline={false}
            data-placeholder="Add a new task..."
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={syncFormatState}
            onMouseUp={syncFormatState}
            onFocus={() => setExpanded(true)}
          />
          {hasContent && (
            <button type="submit" className="add-task__submit">
              Add
            </button>
          )}
        </div>

        {expanded && (
          <div className="add-task__options">
            <div className="add-task__field">
              <div className="add-task__format-group" role="toolbar" aria-label="Text formatting">
                {(['bold', 'italic', 'underline'] as FormatType[]).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    className={`add-task__format-btn add-task__format-btn--${fmt}${activeFormats[fmt] ? ' is-active' : ''}`}
                    // onMouseDown + preventDefault keeps editor focus and preserves selection
                    onMouseDown={e => {
                      e.preventDefault();
                      applyFormat(fmt);
                    }}
                    aria-pressed={activeFormats[fmt]}
                    aria-label={fmt}
                    title={`${fmt.charAt(0).toUpperCase() + fmt.slice(1)} (${FORMAT_SHORTCUTS[fmt]})`}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>
            </div>

            <div className="add-task__field">
              <span className="add-task__label">Priority</span>
              <div className="add-task__priority-group">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`add-task__priority-btn add-task__priority-btn--${p}${priority === p ? ' is-active' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="add-task__field">
              <label className="add-task__label" htmlFor="task-due-date">
                Due date
              </label>
              <input
                id="task-due-date"
                type="date"
                className="add-task__date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
