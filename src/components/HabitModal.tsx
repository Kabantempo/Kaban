import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function formatDateInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
function parseDisplayDate(val: string): string | undefined {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
  if (isNaN(d.getTime())) return undefined;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
function isoToDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
import { Habit, HABIT_ICONS, HABIT_COLORS, getTodayKey, HabitType, padTime } from '../types';
import { T } from '../theme';

interface Props {
  visible: boolean;
  habit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function HabitModal({ visible, habit, onSave, onClose }: Props) {
  const [name,           setName]           = useState('');
  const [description,    setDescription]    = useState('');
  const [xpReward,       setXpReward]       = useState('50');
  const [icon,           setIcon]           = useState(HABIT_ICONS[0]);
  const [color,          setColor]          = useState(HABIT_COLORS[0]);
  const [type,           setType]           = useState<HabitType>('daily');
  const [endDateRaw, setEndDateRaw] = useState('');
  const [dateError,  setDateError]  = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description);
      setXpReward(String(habit.xpReward));
      setIcon(HABIT_ICONS.includes(habit.icon) ? habit.icon : HABIT_ICONS[0]);
      setColor(HABIT_COLORS.includes(habit.color) ? habit.color : HABIT_COLORS[0]);
      setType(habit.type ?? 'daily');
      setEndDateRaw(habit.endDate ? isoToDisplay(habit.endDate) : '');
    } else {
      setName(''); setDescription(''); setXpReward('50');
      setIcon(HABIT_ICONS[0]); setColor(HABIT_COLORS[0]);
      setType('daily'); setEndDateRaw('');
    }
    setDateError(false);
  }, [habit, visible]);

  function handleSave() {
    if (!name.trim()) return;
    let endDate: string | undefined;
    if (type === 'challenge' && endDateRaw) {
      endDate = parseDisplayDate(endDateRaw);
      if (!endDate) { setDateError(true); return; }
    }
    onSave({
      name: name.trim(),
      description: description.trim(),
      xpReward: Math.max(1, parseInt(xpReward) || 50),
      color, icon, type,
      startDate: type === 'challenge' ? getTodayKey() : undefined,
      endDate,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{habit ? 'Modifier' : 'Nouvelle habitude'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

            {/* Type */}
            <View style={styles.typeRow}>
              {(['daily', 'challenge'] as HabitType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Ionicons
                    name={t === 'daily' ? 'repeat-outline' : 'flag-outline'}
                    size={16}
                    color={type === t ? T.text : T.text2}
                  />
                  <Text style={[styles.typeLabel, type === t && styles.typeLabelActive]}>
                    {t === 'daily' ? 'Quotidienne' : 'Défi'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Icône */}
            <Text style={styles.label}>Icône</Text>
            <View style={styles.iconGrid}>
              {HABIT_ICONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconBtn, ic === icon && { borderColor: color, backgroundColor: color + '20' }]}
                  onPress={() => setIcon(ic)}
                >
                  <Ionicons name={ic as any} size={20} color={ic === icon ? color : T.text2} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Couleur */}
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorRow}>
              {HABIT_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            {/* Nom */}
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom"
              placeholderTextColor={T.text3}
              selectionColor={T.accent}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={T.text3}
              selectionColor={T.accent}
            />

            {/* XP */}
            <Text style={styles.label}>XP récompense / jour</Text>
            <TextInput
              style={styles.input}
              value={xpReward}
              onChangeText={setXpReward}
              keyboardType="numeric"
              placeholder="50"
              placeholderTextColor={T.text3}
              selectionColor={T.accent}
            />

            {/* Date défi */}
            {type === 'challenge' && (
              <>
                <Text style={styles.label}>Date de fin du défi</Text>
                <View style={[styles.dateBtn, dateError && { borderColor: T.error + '88' }]}>
                  <Ionicons name="calendar-outline" size={18} color={T.text2} />
                  <TextInput
                    style={styles.dateInput}
                    value={endDateRaw}
                    onChangeText={t => { setEndDateRaw(formatDateInput(t)); setDateError(false); }}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor={T.text3}
                    keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                    maxLength={10}
                    selectionColor={T.accent}
                  />
                </View>
                {dateError && <Text style={styles.dateError}>Format attendu : JJ/MM/AAAA</Text>}
              </>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>{habit ? 'Enregistrer' : 'Créer'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%', paddingHorizontal: 20, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  handle: {
    width: 40, height: 4, backgroundColor: T.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 20 },
  scroll: { flexGrow: 0 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 14, backgroundColor: T.input,
    borderWidth: 1, borderColor: T.border,
  },
  typeBtnActive: { borderColor: T.accent, backgroundColor: T.accentDim },
  typeLabel: { fontSize: 13, fontWeight: '600', color: T.text2 },
  typeLabelActive: { color: T.text },
  label: {
    fontSize: 11, color: T.text2, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 18,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: {
    width: 46, height: 46, borderRadius: 12, backgroundColor: T.input,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: T.border,
  },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  input: {
    backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 13, color: T.text, fontSize: 15,
    borderWidth: 1, borderColor: T.border,
  },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: T.border,
  },
  dateInput: { flex: 1, paddingVertical: 13, color: T.text, fontSize: 15 },
  dateError: { fontSize: 11, color: T.error, fontWeight: '600', marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 14,
    borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.input,
  },
  cancelText: { color: T.text2, fontWeight: '600', fontSize: 15 },
  saveBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 14,
    backgroundColor: T.accent, alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
