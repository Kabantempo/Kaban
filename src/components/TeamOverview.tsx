import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, AppData, Profile, HABIT_COLORS, getXPProgress, isChallengeActive, getTodayKey, minutesToDuration } from '../types';
import { T } from '../theme';

const AVATAR_COLORS = HABIT_COLORS;
function avatarColor(p: Profile) { return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0]; }
function emptyData(): AppData { return { habits: [], entries: [], totalXP: 0, earnedBadges: [] }; }

function getDailyStatus(data: AppData, today: string): { done: number; total: number } {
  const daily = data.habits.filter(h => h.type === 'daily' && isChallengeActive(h, today));
  const done  = daily.filter(h => data.entries.some(e => e.habitId === h.id && e.date === today && e.status === 'yes')).length;
  return { done, total: daily.length };
}

function ProfileDetailModal({ profile, data, all, visible, onClose }: {
  profile: Profile; data: AppData; all: AllProfiles; visible: boolean; onClose: () => void;
}) {
  const today  = getTodayKey();
  const { done, total } = getDailyStatus(data, today);
  const { level, current, required, percent } = getXPProgress(data.totalXP);
  const color  = avatarColor(profile);
  const badges = (data.earnedBadges ?? []).length;

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
  const weekDays  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  const laboThisWeek = (all.laboSessions ?? [])
    .filter(s => s.profileId === profile.id && weekDays.includes(s.date))
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHeader}>
          <View style={[styles.modalAvatar, { backgroundColor: color }]}>
            <Text style={styles.modalAvatarLetter}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.modalName}>{profile.name}</Text>
            <Text style={styles.modalLevel}>Niveau {level} · {data.totalXP.toLocaleString('fr-FR')} XP</Text>
          </View>
        </View>

        <View style={styles.modalStats}>
          <View style={styles.modalStat}>
            <Ionicons name="checkmark-circle-outline" size={20} color={done === total && total > 0 ? T.success : T.text2} />
            <Text style={styles.modalStatVal}>{done}/{total}</Text>
            <Text style={styles.modalStatLbl}>Habitudes</Text>
          </View>
          <View style={styles.modalStatDiv} />
          <View style={styles.modalStat}>
            <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
            <Text style={styles.modalStatVal}>{badges}</Text>
            <Text style={styles.modalStatLbl}>Badges</Text>
          </View>
          <View style={styles.modalStatDiv} />
          <View style={styles.modalStat}>
            <Ionicons name="flask-outline" size={20} color={T.accent} />
            <Text style={styles.modalStatVal}>{laboThisWeek > 0 ? minutesToDuration(laboThisWeek) : '—'}</Text>
            <Text style={styles.modalStatLbl}>Labo 7j</Text>
          </View>
        </View>

        <View style={styles.xpBarWrap}>
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${Math.round(percent * 100)}%` as any }]} />
          </View>
          <Text style={styles.xpBarLabel}>{current} / {required} XP</Text>
        </View>
      </View>
    </Modal>
  );
}

interface Props {
  all: AllProfiles;
  activeProfileId: string;
}

export default function TeamOverview({ all, activeProfileId }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const today = getTodayKey();
  const selectedProfile = all.profiles.find(p => p.id === selected);
  const selectedData    = selected ? (all.data[selected] ?? emptyData()) : emptyData();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>L'équipe aujourd'hui</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {all.profiles.map(profile => {
          const data   = all.data[profile.id] ?? emptyData();
          const { done, total } = getDailyStatus(data, today);
          const isMe   = profile.id === activeProfileId;
          const color  = avatarColor(profile);
          const isOk   = total > 0 && done === total;
          const isPartial = done > 0 && done < total;
          const indicatorColor = isOk ? T.success : isPartial ? T.warning : T.text3;

          return (
            <TouchableOpacity key={profile.id} style={styles.member} onPress={() => setSelected(profile.id)} activeOpacity={0.75}>
              <View style={[styles.avatar, { backgroundColor: color }, isMe && styles.avatarMe]}>
                <Text style={styles.initial}>{profile.name.charAt(0).toUpperCase()}</Text>
                <View style={[styles.statusDot, { backgroundColor: indicatorColor }]}>
                  {isOk && <Ionicons name="checkmark" size={7} color="#fff" />}
                </View>
              </View>
              <Text style={[styles.name, isMe && { color: T.text }]} numberOfLines={1}>{profile.name}</Text>
              {total > 0 && <Text style={styles.progress}>{done}/{total}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          data={selectedData}
          all={all}
          visible={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { paddingHorizontal: 16, paddingVertical: 10 },
  label: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  row:   { gap: 14, paddingRight: 4 },
  member:{ alignItems: 'center', gap: 5, width: 52 },
  avatar:{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarMe: { borderColor: T.accent },
  initial:  { color: '#fff', fontWeight: '800', fontSize: 18 },
  statusDot:{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  name:    { fontSize: 9, color: T.text2, fontWeight: '600', textAlign: 'center' },
  progress:{ fontSize: 8, color: T.text3, fontWeight: '600' },

  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: T.border },
  modalHandle: { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modalAvatarLetter: { color: '#fff', fontWeight: '900', fontSize: 24 },
  modalName:  { fontSize: 20, fontWeight: '800', color: T.text },
  modalLevel: { fontSize: 12, color: T.text2, marginTop: 2 },
  modalStats: { flexDirection: 'row', backgroundColor: T.cardAlt, borderRadius: 16, paddingVertical: 14, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  modalStat:  { flex: 1, alignItems: 'center', gap: 4 },
  modalStatVal:{ fontSize: 18, fontWeight: '800', color: T.text },
  modalStatLbl:{ fontSize: 10, color: T.text3, fontWeight: '600' },
  modalStatDiv:{ width: 1, backgroundColor: T.border },
  xpBarWrap:  { gap: 6 },
  xpBarTrack: { height: 5, backgroundColor: T.cardAlt, borderRadius: 3, overflow: 'hidden' },
  xpBarFill:  { height: '100%', backgroundColor: T.accent, borderRadius: 3 },
  xpBarLabel: { fontSize: 10, color: T.text3, textAlign: 'right' },
});
