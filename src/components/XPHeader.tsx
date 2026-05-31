import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getXPProgress, Profile } from '../types';
import { T } from '../theme';
import NotifSettingsModal from './NotifSettingsModal';

const AVATAR_COLORS = ['#7C5CFC','#2563EB','#059669','#D97706','#DC2626','#DB2777','#0891B2','#65A30D'];

function getAvatarColor(str: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(str)) return str;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface Props {
  totalXP: number;
  completedToday: number;
  totalHabits: number;
  profile: Profile;
  onProfilePress: () => void;
}

export default function XPHeader({ totalXP, completedToday, totalHabits, profile, onProfilePress }: Props) {
  const [showNotif, setShowNotif] = React.useState(false);
  const { level, current, required, percent } = getXPProgress(totalXP);
  const barAnim  = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: percent,
      tension: 35,
      friction: 9,
      useNativeDriver: false,
    }).start();
    // Glow pulse when close to level up
    if (percent > 0.8) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [percent]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const barGlow  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  const today      = new Date();
  const DAY_NAMES  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MON_NAMES  = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  const dateStr    = `${DAY_NAMES[today.getDay()]} ${today.getDate()} ${MON_NAMES[today.getMonth()]}`;

  const avatarColor = getAvatarColor(profile.emoji);
  const initial     = profile.name.charAt(0).toUpperCase();
  const remaining   = totalHabits - completedToday;

  return (
    <LinearGradient
      colors={['#0C1F0E', '#0F1810', T.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.container}
    >

      {/* ── Top row ── */}
      <View style={styles.topRow}>
        <Pressable onPress={onProfilePress} style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.75 }]}>
          <View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={T.text3} />
        </Pressable>

        {/* Cloche notif */}
        <Pressable onPress={() => setShowNotif(true)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, padding: 6 }]}>
          <Ionicons name="notifications-outline" size={20} color={T.text2} />
        </Pressable>

        {/* Badge niveau */}
        <LinearGradient
          colors={['#68C470', '#3A8C46', '#2A6B34']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelBadge}
        >
          <Text style={styles.levelLabel}>NIV</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </LinearGradient>
      </View>

      {/* ── Barre XP ── */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>Expérience</Text>
          <Text style={styles.xpCount}>{current} <Text style={styles.xpTotal}>/ {required} XP</Text></Text>
        </View>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidth, opacity: barGlow }]} />
          {/* Tête lumineuse */}
          <Animated.View style={[styles.barHead, { left: barWidth as any }]} />
        </View>
        <Text style={styles.totalXP}>{totalXP.toLocaleString('fr-FR')} XP total</Text>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatCell value={completedToday} label="Faites" color={T.success} />
        <View style={styles.statDiv} />
        <StatCell value={remaining} label="Restantes" color={remaining > 0 ? T.warning : T.text2} />
        <View style={styles.statDiv} />
        <StatCell value={totalHabits} label="Total" color={T.text2} />
      </View>
      <NotifSettingsModal visible={showNotif} onClose={() => setShowNotif(false)} />
    </LinearGradient>
  );
}

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: T.accentGlow,
    opacity: 0.35,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
  profileName:  { fontSize: 14, color: T.text, fontWeight: '700' },
  dateText:     { fontSize: 11, color: T.text3, marginTop: 1 },
  levelBadge: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  levelLabel:  { fontSize: 8,  fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 2 },
  levelNumber: { fontSize: 28, fontWeight: '900', color: '#fff', lineHeight: 30 },
  xpSection:   { marginBottom: 18 },
  xpLabelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  xpLabel:     { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  xpCount:     { fontSize: 12, color: T.text, fontWeight: '800' },
  xpTotal:     { color: T.text3, fontWeight: '500' },
  barTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'visible',
  },
  barFill: {
    height: '100%',
    backgroundColor: T.accent,
    borderRadius: 4,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  barHead: {
    position: 'absolute',
    top: -2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: T.accentSoft,
    marginLeft: -5,
    shadowColor: T.accentSoft,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  totalXP: { fontSize: 10, color: T.text3, marginTop: 8, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  stat:      { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', lineHeight: 26 },
  statLabel: { fontSize: 10, color: T.text3, marginTop: 3, fontWeight: '600' },
  statDiv:   { width: 1, backgroundColor: T.border },
});
