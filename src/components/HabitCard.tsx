import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  PanResponder, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Habit, DailyEntry, getChallengeProgress, AppData } from '../types';

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 130;
const { width } = Dimensions.get('window');

interface Props {
  habit: Habit;
  entry?: DailyEntry;
  data: AppData;
  onYes: () => void;
  onNo: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitCard({ habit, entry, data, onYes, onNo, onEdit, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [swiped, setSwiped] = useState(false);

  const status = entry?.status ?? 'pending';
  const isChallenge = habit.type === 'challenge';
  const progress = isChallenge ? getChallengeProgress(data, habit) : null;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -ACTION_WIDTH));
        } else if (swiped) {
          translateX.setValue(Math.min(g.dx - ACTION_WIDTH, 0));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD || swiped && g.dx < 0) {
          Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true, tension: 60 }).start();
          setSwiped(true);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 60 }).start();
          setSwiped(false);
        }
      },
    })
  ).current;

  function closeSwipe() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 60 }).start();
    setSwiped(false);
  }

  function handleYes() {
    closeSwipe();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 60 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    if (status !== 'yes') {
      xpAnim.setValue(0);
      xpOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(xpAnim, { toValue: -50, duration: 800, useNativeDriver: true }),
        Animated.timing(xpOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start();
    }
    onYes();
  }

  function handleNo() {
    closeSwipe();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 60 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    onNo();
  }

  const cardBg = status === 'yes'
    ? 'rgba(5,150,105,0.12)'
    : status === 'no'
    ? 'rgba(220,38,38,0.08)'
    : 'rgba(255,255,255,0.04)';

  const borderColor = status === 'yes'
    ? 'rgba(5,150,105,0.4)'
    : status === 'no'
    ? 'rgba(220,38,38,0.25)'
    : 'rgba(255,255,255,0.07)';

  return (
    <View style={styles.wrapper}>
      {/* Actions derrière */}
      <View style={styles.actionsBack}>
        <TouchableOpacity style={styles.editAction} onPress={() => { closeSwipe(); onEdit(); }}>
          <Text style={styles.actionEmoji}>✏️</Text>
          <Text style={styles.actionText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={() => { closeSwipe(); onDelete(); }}>
          <Text style={styles.actionEmoji}>🗑️</Text>
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.card, { transform: [{ scale: scaleAnim }, { translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.inner, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.colorBar, { backgroundColor: habit.color }]} />

          <View style={styles.body}>
            {/* Header */}
            <View style={styles.topRow}>
              <View style={[styles.iconBg, { backgroundColor: habit.color + '22' }]}>
                <Text style={styles.icon}>{habit.icon}</Text>
              </View>
              <View style={styles.textBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{habit.name}</Text>
                  {isChallenge && (
                    <View style={[styles.challengeBadge, { backgroundColor: habit.color + '33' }]}>
                      <Text style={[styles.challengeText, { color: habit.color }]}>DÉFI</Text>
                    </View>
                  )}
                </View>
                {habit.description ? <Text style={styles.desc}>{habit.description}</Text> : null}
                {isChallenge && habit.endDate && (
                  <Text style={styles.deadline}>📅 Jusqu'au {habit.endDate}</Text>
                )}
              </View>
            </View>

            {/* Challenge progress bar */}
            {isChallenge && progress && (
              <View style={styles.challengeProgress}>
                <View style={styles.progressBg}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress.percent * 100)}%`, backgroundColor: habit.color },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress.done}/{progress.total} jours</Text>
              </View>
            )}

            {/* Bottom row */}
            <View style={styles.bottomRow}>
              <View style={[styles.xpBadge, { borderColor: habit.color + '44' }]}>
                <Text style={[styles.xpText, { color: habit.color }]}>+{habit.xpReward} XP</Text>
              </View>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.btn, status === 'no' && styles.btnNoActive]}
                  onPress={handleNo}
                >
                  <Text style={[styles.btnTxt, { color: status === 'no' ? '#EF4444' : '#475569' }]}>
                    {status === 'no' ? '✗ Raté' : '✗'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, status === 'yes' && styles.btnYesActive]}
                  onPress={handleYes}
                >
                  <Text style={[styles.btnTxt, { color: status === 'yes' ? '#10B981' : '#475569' }]}>
                    {status === 'yes' ? '✓ Fait !' : '✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* XP popup */}
      <Animated.Text style={[styles.xpPopup, { transform: [{ translateY: xpAnim }], opacity: xpOpacity }]}>
        +{habit.xpReward} XP
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginVertical: 5 },
  actionsBack: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: ACTION_WIDTH, flexDirection: 'row', borderRadius: 18, overflow: 'hidden',
  },
  editAction: {
    flex: 1, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center',
  },
  deleteAction: {
    flex: 1, backgroundColor: '#3B0A0A', alignItems: 'center', justifyContent: 'center',
    borderTopRightRadius: 18, borderBottomRightRadius: 18,
  },
  actionEmoji: { fontSize: 20, marginBottom: 2 },
  actionText: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  card: { borderRadius: 18, overflow: 'hidden' },
  inner: {
    flexDirection: 'row', borderRadius: 18,
    borderWidth: 1, overflow: 'hidden',
  },
  colorBar: { width: 4 },
  body: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  icon: { fontSize: 22 },
  textBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', letterSpacing: 0.2 },
  challengeBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  challengeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  desc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deadline: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  challengeProgress: { marginBottom: 10 },
  progressBg: {
    height: 5, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, color: '#64748B' },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  xpBadge: {
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  xpText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)', minWidth: 52, alignItems: 'center',
  },
  btnNoActive: { borderColor: 'rgba(220,38,38,0.5)', backgroundColor: 'rgba(220,38,38,0.15)' },
  btnYesActive: { borderColor: 'rgba(5,150,105,0.5)', backgroundColor: 'rgba(5,150,105,0.15)' },
  btnTxt: { fontWeight: '700', fontSize: 13 },
  xpPopup: {
    position: 'absolute', right: 20, top: 10,
    color: '#A855F7', fontWeight: '900', fontSize: 18,
    textShadowColor: '#A855F7', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
    pointerEvents: 'none',
  },
});
