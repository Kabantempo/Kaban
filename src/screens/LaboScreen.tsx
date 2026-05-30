import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AllProfiles, Profile, LaboSession, getTodayKey, minutesToDuration, HABIT_COLORS } from '../types';
import { addLaboSession, deleteLaboSession, saveAllProfiles } from '../utils/storage';
import LaboModal from '../components/LaboModal';
import { T } from '../theme';

const { width } = Dimensions.get('window');
const DAY_SIZE  = Math.floor((width - 48) / 7);
const MONTHS    = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAY_LABELS = ['L','M','M','J','V','S','D'];

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad2(m+1)}-${pad2(d)}`; }

const AVATAR_COLORS = HABIT_COLORS;
function avatarColor(p: Profile) { return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0]; }
function initial(p: Profile)     { return p.name.charAt(0).toUpperCase(); }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}
const DAY_SHORT = ['D','L','M','M','J','V','S'];

interface Props { all: AllProfiles; onChange: (all: AllProfiles) => void }

export default function LaboScreen({ all, onChange }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const today    = getTodayKey();
  const sessions = all.laboSessions ?? [];
  const activeId = all.activeId;

  const mySessions = sessions
    .filter(s => s.profileId === activeId && s.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const myTotalToday = mySessions.reduce((sum, s) => sum + s.duration, 0);

  const team = all.profiles
    .map(p => ({
      profile: p,
      total: sessions.filter(s => s.profileId === p.id && s.date === today).reduce((sum, s) => sum + s.duration, 0),
    }))
    .sort((a, b) => b.total - a.total);
  const teamMax = Math.max(...team.map(t => t.total), 1);

  const last7    = getLast7Days();
  const weekData = useMemo(() => last7.map(date => {
    const bars = all.profiles
      .map(p => ({
        profileId: p.id,
        color: avatarColor(p),
        duration: sessions.filter(s => s.profileId === p.id && s.date === date).reduce((sum, s) => sum + s.duration, 0),
      }))
      .filter(b => b.duration > 0)
      .sort((a, b) => b.duration - a.duration);
    return {
      date,
      label: DAY_SHORT[new Date(date + 'T12:00:00').getDay()],
      total: bars.reduce((sum, b) => sum + b.duration, 0),
      bars,
    };
  }), [sessions, all.profiles]);
  const weekMax = Math.max(...weekData.map(d => d.total), 1);

  // ── Calendrier mensuel ──────────────────────────────────────────────────────
  const firstDay    = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  let startOffset   = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Pour chaque jour du mois : barres par profil, triées par durée décroissante
  type DayBar = { profileId: string; color: string; duration: number };
  const monthData = useMemo(() => {
    const map: Record<string, DayBar[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dateStr(calYear, calMonth, d);
      const bars = all.profiles
        .map(p => ({
          profileId: p.id,
          color: avatarColor(p),
          duration: sessions.filter(s => s.profileId === p.id && s.date === ds)
            .reduce((sum, s) => sum + s.duration, 0),
        }))
        .filter(b => b.duration > 0)
        .sort((a, b) => b.duration - a.duration);
      if (bars.length > 0) map[ds] = bars;
    }
    return map;
  }, [calYear, calMonth, sessions, all.profiles]);

  function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }
  function nextMonth() { if (calMonth === 11) { setCalMonth(0);  setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }

  function handleSave(startTime: string, endTime: string, note?: string) {
    const updated = addLaboSession(all, activeId, today, startTime, endTime, note);
    onChange(updated); saveAllProfiles(updated);
  }

  function handleDelete(session: LaboSession) {
    Alert.alert('Supprimer', `Supprimer la session ${session.startTime} → ${session.endTime} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => {
        const updated = deleteLaboSession(all, session.id);
        onChange(updated); saveAllProfiles(updated);
      }},
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      {/* Header */}
      <LinearGradient colors={['#0C1F0E', '#0F1810', T.bg]} style={styles.header}>
        <Text style={styles.title}>Labo</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        <View style={styles.myTimeCard}>
          <Text style={styles.myTimeValue}>{myTotalToday > 0 ? minutesToDuration(myTotalToday) : '—'}</Text>
          <Text style={styles.myTimeLabel}>
            {mySessions.length === 0 ? "Aucune session aujourd'hui" : `${mySessions.length} session${mySessions.length > 1 ? 's' : ''} aujourd'hui`}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Graphique 7 jours ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7 derniers jours</Text>
          <View style={styles.weekChart}>
            {weekData.map(({ date, label, total, bars }) => {
              const isToday  = date === today;
              const dayMax   = bars[0]?.duration ?? 1;
              return (
                <View key={date} style={styles.weekCol}>
                  {total > 0 && <Text style={styles.weekBarLabel}>{minutesToDuration(total)}</Text>}
                  {/* Barres horizontales empilées par profil */}
                  <View style={styles.weekBarsWrap}>
                    {bars.length === 0 ? (
                      <View style={styles.weekBarEmpty} />
                    ) : bars.map(({ profileId, color, duration }) => {
                      const w = `${Math.round((duration / dayMax) * 100)}%`;
                      return (
                        <View key={profileId} style={styles.weekBarRow}>
                          <View style={[styles.weekBarSeg, { width: w as any, backgroundColor: color,
                            shadowColor: isToday ? color : 'transparent',
                            shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
                          }]} />
                        </View>
                      );
                    })}
                  </View>
                  <Text style={[styles.weekDayLabel, isToday && { color: T.accentSoft }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Calendrier mensuel ── */}
        <View style={styles.section}>
          <View style={styles.calNavRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
              <Ionicons name="chevron-back" size={18} color={T.text2} />
            </TouchableOpacity>
            <Text style={styles.calMonthTitle}>{MONTHS[calMonth]} {calYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
              <Ionicons name="chevron-forward" size={18} color={T.text2} />
            </TouchableOpacity>
          </View>

          {/* Labels jours */}
          <View style={styles.calDayLabels}>
            {DAY_LABELS.map((d, i) => (
              <View key={i} style={[styles.calCell, { width: DAY_SIZE }]}>
                <Text style={styles.calDayLabel}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grille */}
          {Array.from({ length: cells.length / 7 }, (_, wi) => (
            <View key={wi} style={styles.calRow}>
              {cells.slice(wi * 7, wi * 7 + 7).map((day, di) => {
                if (!day) return <View key={di} style={[styles.calCell, { width: DAY_SIZE, height: DAY_SIZE }]} />;
                const ds       = dateStr(calYear, calMonth, day);
                const isToday  = ds === today;
                const isFuture = ds > today;
                const dayBars  = monthData[ds] ?? [];
                const dayMax   = dayBars[0]?.duration ?? 1;

                return (
                  <View key={di} style={[styles.calCell, { width: DAY_SIZE, height: DAY_SIZE }]}>
                    <View style={[styles.calDayInner, isToday && styles.calDayToday]}>
                      <Text style={[
                        styles.calDayNum,
                        isToday  && styles.calDayNumToday,
                        isFuture && styles.calDayNumFuture,
                        dayBars.length > 0 && styles.calDayNumFilled,
                      ]}>{day}</Text>
                      {/* Barres par profil */}
                      {dayBars.length > 0 && (
                        <View style={styles.calBarsWrap}>
                          {dayBars.map(({ profileId, color, duration }) => (
                            <View key={profileId} style={styles.calBarRow}>
                              <View style={[styles.calBarSeg, {
                                width: `${Math.round((duration / dayMax) * 100)}%` as any,
                                backgroundColor: color,
                              }]} />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}

          {/* Légende profils */}
          <View style={styles.calLegend}>
            {all.profiles.map(p => (
              <View key={p.id} style={styles.calLegendItem}>
                <View style={[styles.calLegendDot, { backgroundColor: avatarColor(p) }]} />
                <Text style={styles.calLegendText}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Mes sessions du jour ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes sessions — aujourd'hui</Text>
          {mySessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={32} color={T.text3} />
              <Text style={styles.emptyText}>Aucune session pour aujourd'hui</Text>
            </View>
          ) : mySessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionLeft}>
                <View style={styles.sessionTimeRow}>
                  <Ionicons name="enter-outline" size={12} color={T.success} />
                  <Text style={styles.sessionTime}>{session.startTime}</Text>
                  <Ionicons name="arrow-forward" size={10} color={T.text3} />
                  <Ionicons name="exit-outline" size={12} color={T.error} />
                  <Text style={styles.sessionTime}>{session.endTime}</Text>
                </View>
                {!!session.note && <Text style={styles.sessionNote}>{session.note}</Text>}
              </View>
              <View style={styles.sessionRight}>
                <Text style={styles.sessionDuration}>{minutesToDuration(session.duration)}</Text>
                <TouchableOpacity onPress={() => handleDelete(session)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={14} color={T.text3} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Équipe ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>L'équipe — aujourd'hui</Text>
          {team.map(({ profile, total }) => {
            const isMe  = profile.id === activeId;
            const barW  = total > 0 ? total / teamMax : 0;
            const color = avatarColor(profile);
            return (
              <View key={profile.id} style={[styles.teamRow, isMe && styles.teamRowMe]}>
                <View style={[styles.teamAvatar, { backgroundColor: color }]}>
                  <Text style={styles.teamAvatarLetter}>{initial(profile)}</Text>
                </View>
                <View style={styles.teamInfo}>
                  <View style={styles.teamNameRow}>
                    <Text style={[styles.teamName, isMe && { color: T.text }]}>{profile.name}</Text>
                    {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>Moi</Text></View>}
                  </View>
                  <View style={styles.teamBarTrack}>
                    <View style={[styles.teamBarFill, {
                      width: `${Math.round(barW * 100)}%` as any,
                      backgroundColor: total > 0 ? color : 'transparent',
                      shadowColor: color, shadowOpacity: total > 0 ? 0.4 : 0,
                      shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
                    }]} />
                  </View>
                </View>
                <Text style={[styles.teamTotal, { color: total > 0 ? T.text : T.text3 }]}>
                  {total > 0 ? minutesToDuration(total) : '—'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.fabWrapper}>
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Ajouter une session</Text>
        </TouchableOpacity>
      </View>

      <LaboModal visible={modalVisible} onSave={handleSave} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  title:    { fontSize: 20, fontWeight: '900', color: T.text, letterSpacing: 4, marginBottom: 2 },
  dateText: { fontSize: 12, color: T.text2, marginBottom: 16, textTransform: 'capitalize' },
  myTimeCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  myTimeValue: { fontSize: 42, fontWeight: '900', color: T.text, lineHeight: 44 },
  myTimeLabel: { fontSize: 12, color: T.text2, marginTop: 4, fontWeight: '600' },

  scroll:       { paddingHorizontal: 16, paddingTop: 20 },
  section:      { marginBottom: 28 },
  sectionTitle: { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },

  // Semaine
  weekChart:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  weekCol:      { flex: 1, alignItems: 'stretch', gap: 4 },
  weekBarLabel: { fontSize: 7, color: T.text3, fontWeight: '600', textAlign: 'center' },
  weekBarsWrap: { gap: 2 },
  weekBarEmpty: { height: 4, backgroundColor: T.border, borderRadius: 2 },
  weekBarRow:   { height: 5 },
  weekBarSeg:   { height: '100%', borderRadius: 3, minWidth: 3 },
  weekDayLabel: { fontSize: 10, color: T.text3, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  // Calendrier
  calNavRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calNavBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: T.cardAlt, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle:{ fontSize: 15, fontWeight: '800', color: T.text },
  calDayLabels: { flexDirection: 'row', marginBottom: 2 },
  calCell:      { alignItems: 'center', justifyContent: 'center', padding: 2 },
  calDayLabel:  { fontSize: 10, color: T.text3, fontWeight: '700' },
  calRow:       { flexDirection: 'row' },
  calDayInner:  { flex: 1, width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', alignItems: 'center', paddingTop: 3, paddingHorizontal: 2, paddingBottom: 2, backgroundColor: T.cardAlt },
  calDayToday:  { borderWidth: 1.5, borderColor: T.accent },
  calDayNum:    { fontSize: 10, fontWeight: '600', color: T.text2, marginBottom: 2 },
  calDayNumToday:  { color: T.accentSoft, fontWeight: '800' },
  calDayNumFuture: { color: T.text3 },
  calDayNumFilled: { color: T.text, fontWeight: '700' },
  calBarsWrap:  { width: '100%', gap: 1.5 },
  calBarRow:    { height: 4, backgroundColor: T.border, borderRadius: 2, overflow: 'hidden', width: '100%' },
  calBarSeg:    { height: '100%', borderRadius: 2 },
  calLegend:    { flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' },
  calLegendItem:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot: { width: 10, height: 10, borderRadius: 5 },
  calLegendText:{ fontSize: 10, color: T.text3 },

  // Sessions
  emptyState:  { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText:   { fontSize: 13, color: T.text3, fontWeight: '600' },
  sessionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  sessionLeft: { flex: 1 },
  sessionTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionTime:    { fontSize: 15, fontWeight: '700', color: T.text },
  sessionNote:    { fontSize: 11, color: T.text2, marginTop: 4 },
  sessionRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sessionDuration:{ fontSize: 14, fontWeight: '800', color: T.accent },
  deleteBtn:      { padding: 6 },

  // Équipe
  teamRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  teamRowMe:      { borderColor: T.accent + '44', backgroundColor: T.accentDim },
  teamAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  teamAvatarLetter:{ color: '#fff', fontWeight: '800', fontSize: 15 },
  teamInfo:       { flex: 1 },
  teamNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  teamName:       { fontSize: 13, fontWeight: '700', color: T.text2 },
  meBadge:        { backgroundColor: T.accentDim, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: T.accent + '55' },
  meBadgeText:    { fontSize: 9, color: T.accentSoft, fontWeight: '700' },
  teamBarTrack:   { height: 5, backgroundColor: T.cardAlt, borderRadius: 3, overflow: 'hidden' },
  teamBarFill:    { height: '100%', borderRadius: 3 },
  teamTotal:      { fontSize: 13, fontWeight: '800', minWidth: 44, textAlign: 'right' },

  // FAB
  fabWrapper: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center' },
  fab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 32, gap: 8, backgroundColor: T.accent, shadowColor: T.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
