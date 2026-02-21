export type Priority = 'low' | 'medium' | 'high';

export type FilterStatus = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  dueDate?: string;
}

export interface NewTaskInput {
  title: string;
  priority: Priority;
  dueDate?: string;
}
