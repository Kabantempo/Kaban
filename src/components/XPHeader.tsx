import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { getXPProgress, Profile } from '../types';

interface Props {
  totalXP: number;
  completedToday: number;
  totalHabits: number;
  profile: Profile;
  onProfilePress: () => void;
}

export default function XPHeader({ totalXP, completedToday, totalHabits, profile, onProfilePress }: Props) {
  const { level, current, required, percent } = getXPProgress(totalXP);
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, { toValue: percent, tension: 40, friction: 8, useNativeDriver: false }).start();
  }, [percent]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onProfilePress} activeOpacity={0.7}>
          <Text style={styles.appTitle}>KABAN</Text>
          <View style={styles.profileRow}>
            <Text style={styles.profileEmoji}>{profile.emoji}</Text>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileChevron}>›</Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
        </TouchableOpacity>
        <View style={styles.levelBadge}>
          <Text style={styles.levelLabel}>NIV</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </View>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>Expérience</Text>
          <Text style={styles.xpCount}>{current} / {required} XP</Text>
        </View>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
        <Text style={styles.totalXP}>{totalXP} XP total</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{completedToday}</Text>
          <Text style={styles.statLabel}>Complétées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalHabits - completedToday}</Text>
          <Text style={styles.statLabel}>Restantes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalHabits}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  profileEmoji: { fontSize: 13 },
  profileName: { fontSize: 13, color: '#D1D5DB', fontWeight: '600' },
  profileChevron: { fontSize: 16, color: '#6B7280' },
  dateText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 28,
  },
  xpSection: { marginBottom: 20 },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  xpCount: {
    fontSize: 11,
    color: '#E5E7EB',
    fontWeight: '700',
  },
  barBackground: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  totalXP: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
});
