export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'todo' | 'habit';
}

export interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

export type Tab = 'Tasks' | 'Habits' | 'Routine' | 'Stats' | 'Typing';

export interface AppState {
  habits: Habit[];
  tasks: Task[];
  lastUpdated: number; // For daily refresh
}
