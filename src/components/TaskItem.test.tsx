import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { TaskItem } from './TaskItem'
import type { Task } from '../types/task'

// useSortable requires DndContext + SortableContext
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <DndContext>
      <SortableContext items={['task-1', 'task-2']}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Buy groceries',
    completed: false,
    priority: 'medium',
    createdAt: '2026-02-20T00:00:00.000Z',
    ...overrides,
  }
}

function setup(task: Task, overrides: { onToggle?: () => void; onDelete?: () => void; onUpdate?: () => void } = {}) {
  const onToggle = overrides.onToggle ?? vi.fn()
  const onDelete = overrides.onDelete ?? vi.fn()
  const onUpdate = overrides.onUpdate ?? vi.fn()
  const user = userEvent.setup()

  render(
    <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} />,
    { wrapper: Wrapper }
  )

  return { onToggle, onDelete, onUpdate, user }
}

describe('TaskItem', () => {
  describe('rendering', () => {
    it('displays the task title', () => {
      setup(makeTask())
      expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    })

    it('renders HTML formatting in the title', () => {
      setup(makeTask({ title: '<strong>Important</strong> task' }))
      expect(screen.getByRole('button', { name: /edit: important task/i })).toBeInTheDocument()
    })

    it('shows the priority badge', () => {
      setup(makeTask({ priority: 'high' }))
      expect(screen.getByText('high')).toBeInTheDocument()
    })

    it('shows the drag handle button', () => {
      setup(makeTask())
      expect(screen.getByRole('button', { name: /drag to reorder/i })).toBeInTheDocument()
    })

    it('shows the delete button', () => {
      setup(makeTask())
      expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument()
    })

    it('shows "Mark complete" checkbox for active tasks', () => {
      setup(makeTask())
      expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument()
    })

    it('shows "Mark incomplete" checkbox for completed tasks', () => {
      setup(makeTask({ completed: true }))
      expect(screen.getByRole('button', { name: /mark incomplete/i })).toBeInTheDocument()
    })
  })

  describe('due dates', () => {
    it('displays a future due date', () => {
      setup(makeTask({ dueDate: '2099-12-31' }))
      expect(screen.getByText(/dec 31/i)).toBeInTheDocument()
    })

    it('does not show a due date section when dueDate is absent', () => {
      setup(makeTask({ dueDate: undefined }))
      expect(screen.queryByText(/due/i)).not.toBeInTheDocument()
    })

    it('marks an overdue date for active tasks', () => {
      setup(makeTask({ dueDate: '2020-01-01', completed: false }))
      // The overdue indicator (!) should be present
      const dueEl = screen.getByText(/jan 1/i).closest('span')
      expect(dueEl).toHaveClass('task-item__due--overdue')
    })

    it('does not mark overdue for completed tasks', () => {
      setup(makeTask({ dueDate: '2020-01-01', completed: true }))
      // completed task — no due date shown at all (it's in the editing branch)
      expect(screen.queryByText('!')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onToggle when the checkbox is clicked', async () => {
      const { onToggle, user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /mark complete/i }))
      expect(onToggle).toHaveBeenCalledWith('task-1')
    })

    it('calls onDelete when the delete button is clicked', async () => {
      const { onDelete, user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /delete task/i }))
      expect(onDelete).toHaveBeenCalledWith('task-1')
    })
  })

  describe('inline editing — active tasks', () => {
    it('enters edit mode when the title is clicked', async () => {
      const { user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))
      expect(screen.getByRole('textbox', { name: /edit task title/i })).toBeInTheDocument()
    })

    it('seeds the editor with the current title on entry', async () => {
      const { user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))
      expect(screen.getByRole('textbox', { name: /edit task title/i }).innerHTML).toBe('Buy groceries')
    })

    it('shows the B/I/U format toolbar while editing', async () => {
      const { user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))
      expect(screen.getByRole('toolbar', { name: /text formatting/i })).toBeInTheDocument()
    })

    it('shows the save/cancel hint', async () => {
      const { user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))
      expect(screen.getByText(/enter to save/i)).toBeInTheDocument()
    })

    it('calls onUpdate with sanitized HTML on Enter', async () => {
      const { user, onUpdate } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      editor.innerHTML = '<strong>Updated</strong> task'
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onUpdate).toHaveBeenCalledWith('task-1', '<strong>Updated</strong> task')
    })

    it('calls onUpdate on blur', async () => {
      const { user, onUpdate } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      editor.innerHTML = 'Blurred save'
      fireEvent.blur(editor)

      expect(onUpdate).toHaveBeenCalledWith('task-1', 'Blurred save')
    })

    it('does not call onUpdate when Escape is pressed', async () => {
      const { user, onUpdate } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      editor.innerHTML = 'Discarded change'
      fireEvent.keyDown(editor, { key: 'Escape' })

      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('exits edit mode after saving', async () => {
      const { user } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(screen.queryByRole('textbox', { name: /edit task title/i })).not.toBeInTheDocument()
    })

    it('does not call onUpdate when editor is empty on save', async () => {
      const { user, onUpdate } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      editor.innerHTML = ''
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('Shift+Enter does not save', async () => {
      const { user, onUpdate } = setup(makeTask())
      await user.click(screen.getByRole('button', { name: /edit: buy groceries/i }))

      const editor = screen.getByRole('textbox', { name: /edit task title/i })
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true })

      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  describe('inline editing — completed tasks', () => {
    it('does not enter edit mode when a completed task title is clicked', async () => {
      const { user } = setup(makeTask({ completed: true }))

      // Completed titles have no role="button" and no aria-label for editing
      const title = screen.getByText('Buy groceries')
      await user.click(title)

      expect(screen.queryByRole('textbox', { name: /edit task title/i })).not.toBeInTheDocument()
    })

    it('completed title has no button role', () => {
      setup(makeTask({ completed: true }))
      expect(screen.queryByRole('button', { name: /edit:/i })).not.toBeInTheDocument()
    })

    it('completed title has no tabIndex', () => {
      setup(makeTask({ completed: true }))
      const title = screen.getByText('Buy groceries')
      expect(title).not.toHaveAttribute('tabIndex')
    })
  })
})
