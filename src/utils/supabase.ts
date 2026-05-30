import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ID fixe partagé par tous les appareils de l'équipe
const FIXED_TEAM_ID     = 'KABAN_TEAM_SHARED';
const MY_PROFILE_ID_KEY = 'kaban_my_profile_id';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTeamCode(): string {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export function getTeamId(): string {
  return FIXED_TEAM_ID;
}

export async function getMyProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(MY_PROFILE_ID_KEY);
}

export async function setMyProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(MY_PROFILE_ID_KEY, id);
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
