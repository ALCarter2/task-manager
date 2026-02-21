import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from './TaskList'
import type { Task, FilterStatus, Priority } from '../types/task'

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Task ${id}`,
    completed: false,
    priority: 'medium',
    createdAt: '2026-02-20T00:00:00.000Z',
    ...overrides,
  }
}

function setup(tasks: Task[], overrides: Partial<Parameters<typeof TaskList>[0]> = {}) {
  const props = {
    tasks,
    filterStatus: 'all' as FilterStatus,
    filterPriority: 'all' as Priority | 'all',
    onFilterStatus: vi.fn(),
    onFilterPriority: vi.fn(),
    onToggle: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onClearCompleted: vi.fn(),
    onReorder: vi.fn(),
    completedCount: 0,
    ...overrides,
  }

  const user = userEvent.setup()
  render(<TaskList {...props} />)
  return { user, ...props }
}

describe('TaskList', () => {
  describe('task rendering', () => {
    it('renders all provided tasks', () => {
      setup([makeTask('1'), makeTask('2'), makeTask('3')])
      expect(screen.getByText('Task 1')).toBeInTheDocument()
      expect(screen.getByText('Task 2')).toBeInTheDocument()
      expect(screen.getByText('Task 3')).toBeInTheDocument()
    })

    it('shows the empty state when tasks array is empty', () => {
      setup([])
      expect(screen.getByText('All clear')).toBeInTheDocument()
    })

    it('shows the empty state sub-text', () => {
      setup([])
      expect(screen.getByText(/no tasks match this filter/i)).toBeInTheDocument()
    })

    it('does not show the empty state when tasks are present', () => {
      setup([makeTask('1')])
      expect(screen.queryByText('All clear')).not.toBeInTheDocument()
    })
  })

  describe('filter tabs', () => {
    it('renders All, Active, and Completed tabs', () => {
      setup([])
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Completed' })).toBeInTheDocument()
    })

    it('marks the current filterStatus tab as selected', () => {
      setup([], { filterStatus: 'active' })
      expect(screen.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'false')
    })

    it('calls onFilterStatus when a tab is clicked', async () => {
      const { user, onFilterStatus } = setup([])
      await user.click(screen.getByRole('tab', { name: 'Completed' }))
      expect(onFilterStatus).toHaveBeenCalledWith('completed')
    })
  })

  describe('priority filter', () => {
    it('renders the priority select', () => {
      setup([])
      expect(screen.getByRole('combobox', { name: /filter by priority/i })).toBeInTheDocument()
    })

    it('calls onFilterPriority when selection changes', async () => {
      const { user, onFilterPriority } = setup([])
      await user.selectOptions(
        screen.getByRole('combobox', { name: /filter by priority/i }),
        'high'
      )
      expect(onFilterPriority).toHaveBeenCalledWith('high')
    })
  })

  describe('clear completed', () => {
    it('does not show the clear button when completedCount is 0', () => {
      setup([], { completedCount: 0 })
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('shows the clear button when completedCount > 0', () => {
      setup([], { completedCount: 3 })
      expect(screen.getByRole('button', { name: /clear 3 completed tasks/i })).toBeInTheDocument()
    })

    it('uses singular "task" when completedCount is 1', () => {
      setup([], { completedCount: 1 })
      expect(screen.getByRole('button', { name: /clear 1 completed task$/i })).toBeInTheDocument()
    })

    it('calls onClearCompleted when the button is clicked', async () => {
      const { user, onClearCompleted } = setup([], { completedCount: 2 })
      await user.click(screen.getByRole('button', { name: /clear/i }))
      expect(onClearCompleted).toHaveBeenCalled()
    })
  })
})
