import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTask } from './AddTask'
import type { NewTaskInput } from '../types/task'

function setup(onAdd = vi.fn()) {
  const user = userEvent.setup()
  render(<AddTask onAdd={onAdd} />)
  return { user, onAdd }
}

/** Type into the contentEditable editor and fire an input event. */
function typeInEditor(editor: HTMLElement, text: string) {
  editor.innerHTML = text
  fireEvent.input(editor)
}

describe('AddTask', () => {
  describe('initial render', () => {
    it('shows the task title textbox', () => {
      setup()
      expect(screen.getByRole('textbox', { name: 'Task title' })).toBeInTheDocument()
    })

    it('does not show the Add button when empty', () => {
      setup()
      expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
    })

    it('does not show options panel before focus', () => {
      setup()
      expect(screen.queryByRole('toolbar', { name: /text formatting/i })).not.toBeInTheDocument()
    })
  })

  describe('expansion on focus', () => {
    it('shows the options panel when the editor is focused', async () => {
      const { user } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)

      expect(screen.getByRole('toolbar', { name: /text formatting/i })).toBeInTheDocument()
    })

    it('shows priority buttons when expanded', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('textbox', { name: 'Task title' }))

      expect(screen.getByRole('button', { name: 'low' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'medium' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'high' })).toBeInTheDocument()
    })

    it('shows the due date input when expanded', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('textbox', { name: 'Task title' }))

      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    })

    it('shows B, I, U format buttons', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('textbox', { name: 'Task title' }))

      expect(screen.getByRole('button', { name: 'bold' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'italic' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'underline' })).toBeInTheDocument()
    })

    it('collapses the options panel on Escape', async () => {
      const { user } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('toolbar', { name: /text formatting/i })).not.toBeInTheDocument()
    })
  })

  describe('content detection', () => {
    it('shows the Add button when content is entered', async () => {
      const { user } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      typeInEditor(editor, 'Buy groceries')

      expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument()
    })

    it('hides the Add button when content is cleared', async () => {
      const { user } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      typeInEditor(editor, 'something')
      typeInEditor(editor, '')

      expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('calls onAdd with correct title, default priority, and no dueDate on Enter', async () => {
      const { user, onAdd } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      typeInEditor(editor, 'Buy groceries')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onAdd).toHaveBeenCalledWith<[NewTaskInput]>({
        title: 'Buy groceries',
        priority: 'medium',
        dueDate: undefined,
      })
    })

    it('calls onAdd with selected priority', async () => {
      const { user, onAdd } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      await user.click(screen.getByRole('button', { name: 'high' }))
      typeInEditor(editor, 'Urgent task')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ priority: 'high' }))
    })

    it('calls onAdd with dueDate when provided', async () => {
      const { user, onAdd } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await user.click(editor)
      await user.type(screen.getByLabelText(/due date/i), '2026-12-31')
      typeInEditor(editor, 'Deadline task')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ dueDate: '2026-12-31' }))
    })

    it('does not call onAdd for whitespace-only content', async () => {
      const { onAdd } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      fireEvent.focus(editor)
      typeInEditor(editor, '   ')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(onAdd).not.toHaveBeenCalled()
    })

    it('resets the editor after successful submission', async () => {
      setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      await userEvent.click(editor)
      typeInEditor(editor, 'Task to submit')
      fireEvent.keyDown(editor, { key: 'Enter' })

      expect(editor.innerHTML).toBe('')
    })

    it('Shift+Enter does not submit', async () => {
      const { onAdd } = setup()
      const editor = screen.getByRole('textbox', { name: 'Task title' })
      fireEvent.focus(editor)
      typeInEditor(editor, 'Task')
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true })

      expect(onAdd).not.toHaveBeenCalled()
    })
  })
})
