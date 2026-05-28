import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Habit, DailyEntry, getTodayKey, isChallengeActive } from '../types';

const STORAGE_KEY = 'xp_tracker_data_v2';

const DEFAULT_DATA: AppData = {
  habits: [
    {
      id: '1',
      name: 'Faire du sport',
      description: '30 minutes minimum',
      xpReward: 80,
      color: '#7C3AED',
      icon: '💪',
      createdAt: getTodayKey(),
      type: 'daily',
    },
    {
      id: '2',
      name: 'Lire',
      description: '20 pages par jour',
      xpReward: 50,
      color: '#2563EB',
      icon: '📚',
      createdAt: getTodayKey(),
      type: 'daily',
    },
    {
      id: '3',
      name: 'Pause sucre',
      description: 'Zéro sucre ajouté',
      xpReward: 100,
      color: '#059669',
      icon: '🍬',
      createdAt: getTodayKey(),
      type: 'challenge',
      startDate: getTodayKey(),
      endDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
      })(),
    },
  ],
  entries: [],
  totalXP: 0,
};

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return JSON.parse(raw) as AppData;
  } catch {
    return DEFAULT_DATA;
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getEntryForHabit(data: AppData, habitId: string, date?: string): DailyEntry | undefined {
  const d = date ?? getTodayKey();
  return data.entries.find(e => e.date === d && e.habitId === habitId);
}

export function getTodayActiveHabits(data: AppData): Habit[] {
  const today = getTodayKey();
  return data.habits.filter(h => isChallengeActive(h, today));
}

export function setHabitStatus(
  data: AppData,
  habitId: string,
  status: 'yes' | 'no' | 'pending',
  xpReward: number,
  date?: string,
): AppData {
  const today = date ?? getTodayKey();
  const existing = data.entries.find(e => e.date === today && e.habitId === habitId);
  let xpDelta = 0;

  if (existing) {
    xpDelta -= existing.xpEarned;
    const newEntries = data.entries.filter(e => !(e.date === today && e.habitId === habitId));
    if (status !== 'pending') {
      const newXP = status === 'yes' ? xpReward : 0;
      xpDelta += newXP;
      newEntries.push({ date: today, habitId, status, xpEarned: newXP });
    }
    return { ...data, entries: newEntries, totalXP: Math.max(0, data.totalXP + xpDelta) };
  }

  if (status === 'pending') return data;
  const newXP = status === 'yes' ? xpReward : 0;
  return {
    ...data,
    entries: [...data.entries, { date: today, habitId, status, xpEarned: newXP }],
    totalXP: Math.max(0, data.totalXP + newXP),
  };
}
