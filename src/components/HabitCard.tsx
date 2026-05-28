import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { Habit, DailyEntry } from '../types';

interface Props {
  habit: Habit;
  entry?: DailyEntry;
  onYes: () => void;
  onNo: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function HabitCard({ habit, entry, onYes, onNo, onEdit, onDelete }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;

  const status = entry?.status ?? 'pending';

  function pressAnim(callback: () => void) {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    callback();
  }

  function handleYes() {
    pressAnim(onYes);
    if (status !== 'yes') {
      xpAnim.setValue(-10);
      xpOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(xpAnim, { toValue: -40, duration: 700, useNativeDriver: true }),
        Animated.timing(xpOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  }

  const cardBg = status === 'yes'
    ? 'rgba(5, 150, 105, 0.15)'
    : status === 'no'
    ? 'rgba(220, 38, 38, 0.1)'
    : 'rgba(255,255,255,0.04)';

  const borderColor = status === 'yes'
    ? 'rgba(5, 150, 105, 0.5)'
    : status === 'no'
    ? 'rgba(220, 38, 38, 0.3)'
    : 'rgba(255,255,255,0.08)';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={[styles.colorBar, { backgroundColor: habit.color }]} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.iconWrap}>
              <View style={[styles.iconBg, { backgroundColor: habit.color + '22' }]}>
                <Text style={styles.icon}>{habit.icon}</Text>
              </View>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.name}>{habit.name}</Text>
              {habit.description ? (
                <Text style={styles.desc}>{habit.description}</Text>
              ) : null}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.xpBadge}>
              <Text style={[styles.xpText, { color: habit.color }]}>+{habit.xpReward} XP</Text>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnNo, status === 'no' && styles.btnNoActive]}
                onPress={() => pressAnim(onNo)}
              >
                <Text style={styles.btnText}>{status === 'no' ? '✗ Raté' : '✗'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnYes, status === 'yes' && styles.btnYesActive]}
                onPress={handleYes}
              >
                <Text style={styles.btnTextYes}>{status === 'yes' ? '✓ Fait !' : '✓'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {status === 'yes' && (
          <View style={styles.doneOverlay}>
            <Text style={styles.doneEmoji}>⚡</Text>
          </View>
        )}
      </View>

      <Animated.Text
        style={[
          styles.xpPopup,
          { transform: [{ translateY: xpAnim }], opacity: xpOpacity },
        ]}
      >
        +{habit.xpReward} XP
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    marginRight: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpBadge: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  btnNo: {
    borderColor: 'rgba(220, 38, 38, 0.4)',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  btnNoActive: {
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
  },
  btnYes: {
    borderColor: 'rgba(5, 150, 105, 0.4)',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  btnYesActive: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.3)',
  },
  btnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  btnTextYes: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  doneOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  doneEmoji: {
    fontSize: 16,
  },
  xpPopup: {
    position: 'absolute',
    right: 16,
    top: 0,
    color: '#A855F7',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: '#A855F7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    pointerEvents: 'none',
  },
});
