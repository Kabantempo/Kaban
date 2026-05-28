export type HabitType = 'daily' | 'challenge';

export interface Habit {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  color: string;
  icon: string;
  createdAt: string;
  type: HabitType;
  startDate?: string; // YYYY-MM-DD, pour les défis
  endDate?: string;   // YYYY-MM-DD, pour les défis
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
  '#7C3AED', '#2563EB', '#059669', '#D97706',
  '#DC2626', '#DB2777', '#0891B2', '#65A30D',
];

export const HABIT_ICONS = [
  '💪', '📚', '🏃', '🧘', '🎯', '💧', '🍎', '😴',
  '✍️', '🎨', '🎵', '🧠', '💊', '🌿', '🔥', '⭐',
  '🚭', '🍬', '🍷', '💻', '🧹', '💰', '📱', '🎮',
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
  return { level, current, required, percent: required > 0 ? current / required : 0 };
}

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function isChallengeActive(habit: Habit, date: string): boolean {
  if (habit.type !== 'challenge') return true;
  const start = habit.startDate ?? habit.createdAt;
  const end = habit.endDate;
  if (date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function getChallengeProgress(data: AppData, habit: Habit): { done: number; total: number; percent: number } {
  if (habit.type !== 'challenge') return { done: 0, total: 0, percent: 0 };
  const start = habit.startDate ?? habit.createdAt;
  const end = habit.endDate ?? getTodayKey();
  const startD = new Date(start);
  const endD = new Date(end);
  const total = Math.max(1, Math.floor((endD.getTime() - startD.getTime()) / 86400000) + 1);
  const done = data.entries.filter(e => e.habitId === habit.id && e.status === 'yes' && e.date >= start && e.date <= end).length;
  return { done, total, percent: done / total };
}
