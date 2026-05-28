export interface Habit {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  color: string;
  icon: string;
  createdAt: string;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  habitId: string;
  status: 'yes' | 'no' | 'pending';
  xpEarned: number;
}

export interface AppData {
  habits: Habit[];
  entries: DailyEntry[];
  totalXP: number;
}

export const HABIT_COLORS = [
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#D97706',
  '#DC2626',
  '#DB2777',
  '#0891B2',
  '#65A30D',
];

export const HABIT_ICONS = [
  '💪', '📚', '🏃', '🧘', '🎯', '💧', '🍎', '😴',
  '✍️', '🎨', '🎵', '🧠', '💊', '🌿', '🔥', '⭐',
];

export function getLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50));
}

export function getXPForLevel(level: number): number {
  return level * level * 50;
}

export function getXPProgress(xp: number): { level: number; current: number; required: number; percent: number } {
  const level = getLevel(xp);
  const current = xp - getXPForLevel(level);
  const required = getXPForLevel(level + 1) - getXPForLevel(level);
  return { level, current, required, percent: current / required };
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}
