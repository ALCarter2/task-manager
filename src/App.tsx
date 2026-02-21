import { useTasks } from './hooks/useTasks';
import { AddTask } from './components/AddTask';
import { TaskList } from './components/TaskList';
import './App.css';

function App() {
  const {
    tasks,
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
  } = useTasks();

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-inner">
          <div className="app__brand">
            <div className="app__logo" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 8L6 12L14 4"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="app__title">TaskFlow</h1>
          </div>
          <div className="app__stats">
            <span className="app__stat">
              <strong>{stats.active}</strong> active
            </span>
            <span className="app__stat-divider" aria-hidden="true" />
            <span className="app__stat">
              <strong>{stats.completed}</strong> done
            </span>
          </div>
        </div>
      </header>

      {storageError && (
        <div className={`app__storage-warning app__storage-warning--${storageError}`} role="alert">
          {storageError === 'full'
            ? 'Storage is full — tasks are not being saved. Clear some completed tasks to free up space.'
            : 'localStorage is unavailable — tasks will not persist between sessions.'}
        </div>
      )}

      <main className="app__main">
        <AddTask onAdd={addTask} />
        <TaskList
          tasks={tasks}
          filterStatus={filterStatus}
          filterPriority={filterPriority}
          onFilterStatus={setFilterStatus}
          onFilterPriority={setFilterPriority}
          onToggle={toggleTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onClearCompleted={clearCompleted}
          onReorder={reorderTasks}
          completedCount={stats.completed}
        />
      </main>
    </div>
  );
}

export default App;
