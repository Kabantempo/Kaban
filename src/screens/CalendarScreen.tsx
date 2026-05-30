import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppData, Habit, getTodayKey } from '../types';
import { T } from '../theme';

const { width } = Dimensions.get('window');
const DAY_SIZE  = Math.floor((width - 48) / 7);
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function dateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function getDailyCompletion(data: AppData, date: string) {
  const daily = data.habits.filter(h => h.type === 'daily');
  if (!daily.length) return { percent: 0 };
  const done = data.entries.filter(e => e.date === date && e.status === 'yes' && daily.some(h => h.id === e.habitId)).length;
  return { percent: done / daily.length };
}

function getChallengeHabits(data: AppData): Habit[] {
  return data.habits.filter(h => h.type === 'challenge' && h.startDate && h.endDate);
}

function isChallengeDay(habit: Habit, date: string) {
  return date >= (habit.startDate ?? '') && date <= (habit.endDate ?? '');
}

function isChallengeSuccess(data: AppData, habit: Habit, date: string) {
  return data.entries.some(e => e.habitId === habit.id && e.date === date && e.status === 'yes');
}

function getBarColor(percent: number): [string, string] {
  if (percent === 0)    return ['transparent', 'transparent'];
  if (percent < 0.34)  return ['#7F1D1D', '#991B1B'];
  if (percent < 0.67)  return ['#92400E', '#B45309'];
  if (percent < 1)     return ['#14532D', '#15803D'];
  return ['#4C1D95', '#7C3AED'];
}

export default function CalendarScreen({ data }: { data: AppData }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const todayStr = getTodayKey();

  const firstDay    = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startOffset   = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const dailyHabits = data.habits.filter(h => h.type === 'daily');
  let perfectDays   = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = dateStr(year, month, d);
    if (ds > todayStr) continue;
    const { percent } = getDailyCompletion(data, ds);
    if (dailyHabits.length > 0 && percent === 1) perfectDays++;
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const challengeHabits = getChallengeHabits(data);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0C1F0E', '#0A150C']} style={styles.header}>
        <Text style={styles.title}>Calendrier</Text>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statVal}>{perfectDays}</Text><Text style={styles.statLbl}>Jours parfaits</Text></View>
          <View style={styles.statDiv} />
          <View style={styles.stat}><Text style={styles.statVal}>{challengeHabits.length}</Text><Text style={styles.statLbl}>Défis actifs</Text></View>
          <View style={styles.statDiv} />
          <View style={styles.stat}><Text style={styles.statVal}>{daysInMonth}</Text><Text style={styles.statLbl}>Jours total</Text></View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.dayLabels}>
          {DAYS.map((d, i) => (
            <View key={i} style={[styles.dayLabelCell, { width: DAY_SIZE }]}>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week, wi) => {
          const weekDates = week.map(d => d ? dateStr(year, month, d) : null);
          return (
            <View key={wi}>
              <View style={styles.weekRow}>
                {week.map((day, di) => {
                  if (!day) return <View key={di} style={[styles.cell, { width: DAY_SIZE, height: DAY_SIZE }]} />;
                  const ds       = dateStr(year, month, day);
                  const isFuture = ds > todayStr;
                  const isToday  = ds === todayStr;
                  const { percent } = getDailyCompletion(data, ds);
                  const hasData  = dailyHabits.length > 0 && percent > 0 && !isFuture;
                  const [c1, c2] = getBarColor(percent);
                  const isPerfect = percent === 1 && !isFuture;

                  return (
                    <View key={di} style={[styles.cell, { width: DAY_SIZE, height: DAY_SIZE }]}>
                      <View style={[styles.dayInner, isToday && styles.todayBorder]}>
                        {hasData ? (
                          <LinearGradient colors={[c1, c2]} style={styles.dayFilled}>
                            <Text style={styles.dayNumLight}>{day}</Text>
                            {isPerfect && <View style={styles.perfectDot} />}
                          </LinearGradient>
                        ) : (
                          <View style={styles.dayEmpty}>
                            <Text style={[
                              styles.dayNum,
                              isToday && styles.todayNum,
                              isFuture && styles.futureNum,
                            ]}>{day}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {challengeHabits.map(habit => {
                const firstInWeek = weekDates.findIndex(d => d && isChallengeDay(habit, d));
                const lastInWeek  = [...weekDates].reverse().findIndex(d => d && isChallengeDay(habit, d));
                if (firstInWeek === -1) return null;
                const lastIdx  = 6 - lastInWeek;
                const barLeft  = firstInWeek * DAY_SIZE + 4;
                const barWidth = (lastIdx - firstInWeek + 1) * DAY_SIZE - 8;
                const weekSuccesses = weekDates.filter(d => d && isChallengeDay(habit, d) && isChallengeSuccess(data, habit, d)).length;
                const weekActive    = weekDates.filter(d => d && isChallengeDay(habit, d) && d! <= todayStr).length;
                const weekPercent   = weekActive > 0 ? weekSuccesses / weekActive : 0;
                const opacity       = weekActive === 0 ? 0.3 : 0.9;

                return (
                  <View key={habit.id} style={styles.challengeBarRow}>
                    <View style={[styles.challengeBar, { left: barLeft, width: barWidth, backgroundColor: habit.color + '22', borderColor: habit.color + '55', opacity }]}>
                      <View style={[styles.challengeBarFill, { width: `${Math.round(weekPercent * 100)}%`, backgroundColor: habit.color }]} />
                      <Text style={[styles.challengeBarLabel, { color: habit.color }]} numberOfLines={1}>{habit.name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Habitudes quotidiennes</Text>
          <View style={styles.legendItems}>
            {[
              { color: '#991B1B', label: '1–33%' },
              { color: '#B45309', label: '34–66%' },
              { color: '#15803D', label: '67–99%' },
              { color: '#7C3AED', label: '100%' },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
          {challengeHabits.length > 0 && (
            <>
              <Text style={[styles.legendTitle, { marginTop: 12 }]}>Défis en cours</Text>
              {challengeHabits.map(h => (
                <View key={h.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: h.color }]} />
                  <Text style={styles.legendLabel}>{h.name} · jusqu'au {h.endDate}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 16 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingVertical: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  dayLabels: { flexDirection: 'row', marginBottom: 2 },
  dayLabelCell: { alignItems: 'center', paddingVertical: 4 },
  dayLabel: { fontSize: 11, color: T.text3, fontWeight: '700' },
  weekRow: { flexDirection: 'row' },
  cell: { padding: 2 },
  dayInner: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  todayBorder: { borderWidth: 2, borderColor: T.accent },
  dayFilled: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, minHeight: DAY_SIZE - 4 },
  dayEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: DAY_SIZE - 4 },
  dayNumLight: { fontSize: 12, fontWeight: '700', color: '#fff' },
  dayNum: { fontSize: 12, fontWeight: '600', color: T.text2 },
  todayNum: { color: T.accent, fontWeight: '800' },
  futureNum: { color: T.text3 },
  perfectDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 2 },
  challengeBarRow: { height: 22, position: 'relative', marginBottom: 2 },
  challengeBar: { position: 'absolute', top: 2, height: 18, borderRadius: 9, borderWidth: 1, overflow: 'hidden', justifyContent: 'center' },
  challengeBarFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 9 },
  challengeBarLabel: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, zIndex: 1 },
  legend: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16 },
  legendTitle: { fontSize: 11, color: T.accent, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: T.text2 },
});
