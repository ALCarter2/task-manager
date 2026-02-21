import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'
import type { Task } from '../types/task'

// Deterministic IDs
let idCounter = 0
vi.spyOn(crypto, 'randomUUID').mockImplementation(
  () => `00000000-0000-0000-0000-${String(++idCounter).padStart(12, '0')}` as ReturnType<typeof crypto.randomUUID>
)

const STORAGE_KEY = 'taskflow-tasks'

function storedTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'pre-1',
    title: 'Pre-existing task',
    completed: false,
    priority: 'medium',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  idCounter = 0
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── addTask ─────────────────────────────────────────────────────────────────

describe('addTask', () => {
  it('adds a task with correct properties', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Buy groceries', priority: 'high' }) })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0]).toMatchObject({
      title: 'Buy groceries',
      priority: 'high',
      completed: false,
    })
  })

  it('trims whitespace from title', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: '  padded  ', priority: 'low' }) })

    expect(result.current.tasks[0].title).toBe('padded')
  })

  it('prepends new tasks so the most recent appears first', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'First', priority: 'low' })
      result.current.addTask({ title: 'Second', priority: 'low' })
    })

    expect(result.current.tasks[0].title).toBe('Second')
    expect(result.current.tasks[1].title).toBe('First')
  })

  it('stores the provided dueDate', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'medium', dueDate: '2026-12-31' }) })

    expect(result.current.tasks[0].dueDate).toBe('2026-12-31')
  })

  it('leaves dueDate undefined when not provided', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'medium' }) })

    expect(result.current.tasks[0].dueDate).toBeUndefined()
  })

  it('assigns a unique id to each task', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })

    const ids = result.current.tasks.map(t => t.id)
    expect(new Set(ids).size).toBe(2)
  })
})

// ─── toggleTask ───────────────────────────────────────────────────────────────

describe('toggleTask', () => {
  it('marks an active task as completed', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'low' }) })
    const id = result.current.tasks[0].id
    act(() => { result.current.toggleTask(id) })

    expect(result.current.tasks[0].completed).toBe(true)
  })

  it('marks a completed task as active', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'low' }) })
    const id = result.current.tasks[0].id
    act(() => { result.current.toggleTask(id) })
    act(() => { result.current.toggleTask(id) })

    expect(result.current.tasks[0].completed).toBe(false)
  })

  it('does not affect other tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })

    const idToToggle = result.current.tasks[0].id
    act(() => { result.current.toggleTask(idToToggle) })

    const untouched = result.current.tasks.find(t => t.id !== idToToggle)
    expect(untouched?.completed).toBe(false)
  })

  it('is a no-op for an unknown id', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'low' }) })
    act(() => { result.current.toggleTask('nonexistent') })

    expect(result.current.tasks[0].completed).toBe(false)
  })
})

// ─── deleteTask ───────────────────────────────────────────────────────────────

describe('deleteTask', () => {
  it('removes the task from the list', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'low' }) })
    const id = result.current.tasks[0].id
    act(() => { result.current.deleteTask(id) })

    expect(result.current.tasks).toHaveLength(0)
  })

  it('only removes the targeted task', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Keep', priority: 'low' })
      result.current.addTask({ title: 'Delete me', priority: 'low' })
    })

    const idToDelete = result.current.tasks[0].id
    act(() => { result.current.deleteTask(idToDelete) })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Keep')
  })

  it('is a no-op for an unknown id', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'low' }) })
    act(() => { result.current.deleteTask('nonexistent') })

    expect(result.current.tasks).toHaveLength(1)
  })
})

// ─── updateTask ───────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('updates the title of a task', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Old title', priority: 'low' }) })
    const id = result.current.tasks[0].id
    act(() => { result.current.updateTask(id, '<strong>New</strong> title') })

    expect(result.current.tasks[0].title).toBe('<strong>New</strong> title')
  })

  it('does not affect other task properties', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Task', priority: 'high', dueDate: '2026-06-01' }) })
    const id = result.current.tasks[0].id
    act(() => { result.current.updateTask(id, 'Updated') })

    expect(result.current.tasks[0].priority).toBe('high')
    expect(result.current.tasks[0].dueDate).toBe('2026-06-01')
    expect(result.current.tasks[0].completed).toBe(false)
  })

  it('does not affect sibling tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })

    act(() => { result.current.updateTask(result.current.tasks[0].id, 'A updated') })

    expect(result.current.tasks[1].title).toBe('A')
  })
})

// ─── clearCompleted ───────────────────────────────────────────────────────────

describe('clearCompleted', () => {
  it('removes all completed tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })
    act(() => {
      result.current.toggleTask(result.current.tasks[0].id)
      result.current.toggleTask(result.current.tasks[1].id)
    })
    act(() => { result.current.clearCompleted() })

    expect(result.current.tasks).toHaveLength(0)
  })

  it('keeps active tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Active', priority: 'low' })
      result.current.addTask({ title: 'Done', priority: 'low' })
    })
    act(() => { result.current.toggleTask(result.current.tasks[0].id) })
    act(() => { result.current.clearCompleted() })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Active')
  })
})

// ─── reorderTasks ─────────────────────────────────────────────────────────────

describe('reorderTasks', () => {
  it('moves a task to a new position', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
      result.current.addTask({ title: 'C', priority: 'low' })
    })

    // Tasks are prepended: [C, B, A]
    const ids = result.current.tasks.map(t => t.id)
    act(() => { result.current.reorderTasks(ids[0], ids[2]) }) // move C to where A is

    expect(result.current.tasks.map(t => t.title)).toEqual(['B', 'A', 'C'])
  })

  it('is a no-op when active and over id are the same', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })

    const before = result.current.tasks.map(t => t.id)
    act(() => { result.current.reorderTasks(before[0], before[0]) })

    expect(result.current.tasks.map(t => t.id)).toEqual(before)
  })

  it('is a no-op for unknown ids', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'A', priority: 'low' }) })
    act(() => { result.current.reorderTasks('ghost', result.current.tasks[0].id) })

    expect(result.current.tasks).toHaveLength(1)
  })
})

// ─── filtering ───────────────────────────────────────────────────────────────

describe('filterStatus', () => {
  it('shows all tasks by default', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Active', priority: 'low' })
      result.current.addTask({ title: 'Done', priority: 'low' })
    })
    act(() => { result.current.toggleTask(result.current.tasks[0].id) })

    expect(result.current.tasks).toHaveLength(2)
  })

  it('shows only active tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Active', priority: 'low' })
      result.current.addTask({ title: 'Done', priority: 'low' })
    })
    act(() => { result.current.toggleTask(result.current.tasks[0].id) })
    act(() => { result.current.setFilterStatus('active') })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Active')
  })

  it('shows only completed tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Active', priority: 'low' })
      result.current.addTask({ title: 'Done', priority: 'low' })
    })
    act(() => { result.current.toggleTask(result.current.tasks[0].id) })
    act(() => { result.current.setFilterStatus('completed') })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].completed).toBe(true)
  })
})

describe('filterPriority', () => {
  it('shows all priorities by default', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'High', priority: 'high' })
      result.current.addTask({ title: 'Low', priority: 'low' })
    })

    expect(result.current.tasks).toHaveLength(2)
  })

  it('shows only high priority tasks', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'High', priority: 'high' })
      result.current.addTask({ title: 'Low', priority: 'low' })
    })
    act(() => { result.current.setFilterPriority('high') })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('High')
  })

  it('combines status and priority filters', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'Active high', priority: 'high' })
      result.current.addTask({ title: 'Done high', priority: 'high' })
      result.current.addTask({ title: 'Active low', priority: 'low' })
    })
    act(() => { result.current.toggleTask(result.current.tasks[1].id) })
    act(() => {
      result.current.setFilterStatus('active')
      result.current.setFilterPriority('high')
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Active high')
  })
})

// ─── stats ────────────────────────────────────────────────────────────────────

describe('stats', () => {
  it('starts at zero', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.stats).toEqual({ total: 0, active: 0, completed: 0 })
  })

  it('updates when tasks are added', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'low' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })

    expect(result.current.stats).toEqual({ total: 2, active: 2, completed: 0 })
  })

  it('updates when a task is completed', () => {
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'A', priority: 'low' }) })
    act(() => { result.current.toggleTask(result.current.tasks[0].id) })

    expect(result.current.stats).toEqual({ total: 1, active: 0, completed: 1 })
  })

  it('stats reflect all tasks regardless of active filter', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask({ title: 'A', priority: 'high' })
      result.current.addTask({ title: 'B', priority: 'low' })
    })
    act(() => { result.current.setFilterPriority('high') })

    // Only one task visible in filtered view, but stats count all
    expect(result.current.stats.total).toBe(2)
  })
})

// ─── localStorage ─────────────────────────────────────────────────────────────

describe('localStorage', () => {
  it('loads tasks from localStorage on init', () => {
    const tasks = [storedTask()]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))

    const { result } = renderHook(() => useTasks())

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Pre-existing task')
  })

  it('persists tasks to localStorage when tasks change', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useTasks())

    act(() => { result.current.addTask({ title: 'Persist me', priority: 'low' }) })

    expect(setItemSpy).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"title":"Persist me"')
    )
  })

  it('returns empty array when localStorage has corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json {{{{')

    const { result } = renderHook(() => useTasks())

    expect(result.current.tasks).toHaveLength(0)
  })

  it('returns empty array when localStorage is empty', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toHaveLength(0)
  })

  it('sets storageError to "full" on QuotaExceededError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError')
    })

    const { result } = renderHook(() => useTasks())

    expect(result.current.storageError).toBe('full')
  })

  it('sets storageError to "disabled" on SecurityError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError', 'SecurityError')
    })

    const { result } = renderHook(() => useTasks())

    expect(result.current.storageError).toBe('disabled')
  })

  it('clears storageError when a subsequent save succeeds', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })

    const { result } = renderHook(() => useTasks())
    expect(result.current.storageError).toBe('full')

    // Restore normal behaviour
    setItemSpy.mockRestore()

    act(() => { result.current.addTask({ title: 'Recovery task', priority: 'low' }) })

    expect(result.current.storageError).toBeNull()
  })

  it('storageError is null when storage works normally', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.storageError).toBeNull()
  })
})
