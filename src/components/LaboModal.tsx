import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { padTime, minutesToDuration, timeToMinutes } from '../types';
import { T } from '../theme';

interface Props {
  visible: boolean;
  onSave: (startTime: string, endTime: string, note?: string) => void;
  onClose: () => void;
}

// Formate la saisie brute en HH:MM pendant la frappe
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// Valide et corrige une chaîne HH:MM
function validateTime(val: string): { ok: boolean; fixed: string } {
  const match = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { ok: false, fixed: val };
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h > 23 || m > 59) return { ok: false, fixed: val };
  return { ok: true, fixed: `${padTime(h)}:${padTime(m)}` };
}

function nowHHMM() {
  const d = new Date();
  return `${padTime(d.getHours())}:${padTime(d.getMinutes())}`;
}
function roundedHour() {
  const d = new Date(); d.setMinutes(0, 0, 0);
  return `${padTime(d.getHours())}:00`;
}

function TimeInput({
  label, icon, iconColor, value, onChange, nextRef,
}: {
  label: string;
  icon: string;
  iconColor: string;
  value: string;
  onChange: (v: string) => void;
  nextRef?: React.RefObject<TextInput | null>;
}) {
  const [raw,   setRaw]   = useState(value);
  const [error, setError] = useState(false);

  useEffect(() => { setRaw(value); }, [value]);

  function handleChange(text: string) {
    const fmt = formatTimeInput(text);
    setRaw(fmt);
    setError(false);
    // Si on a 5 chars (HH:MM) on passe au champ suivant
    if (fmt.length === 5) {
      const { ok, fixed } = validateTime(fmt);
      if (ok) { onChange(fixed); nextRef?.current?.focus(); }
      else setError(true);
    }
  }

  function handleBlur() {
    const { ok, fixed } = validateTime(raw);
    if (ok) { onChange(fixed); setRaw(fixed); setError(false); }
    else setError(true);
  }

  return (
    <View style={[styles.timeCard, error && styles.timeCardError]}>
      <Ionicons name={icon as any} size={15} color={iconColor} />
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={[styles.timeInput, error && { color: T.error }]}
        value={raw}
        onChangeText={handleChange}
        onBlur={handleBlur}
        placeholder="09:00"
        placeholderTextColor={T.text3}
        keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
        maxLength={5}
        selectionColor={T.accent}
        returnKeyType="next"
        onSubmitEditing={() => nextRef?.current?.focus()}
      />
      {error && <Text style={styles.timeError}>Format HH:MM</Text>}
    </View>
  );
}

export default function LaboModal({ visible, onSave, onClose }: Props) {
  const [startTime, setStartTime] = useState(roundedHour);
  const [endTime,   setEndTime]   = useState(nowHHMM);
  const [note,      setNote]      = useState('');
  const [error,     setError]     = useState('');
  const endRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setStartTime(roundedHour()); setEndTime(nowHHMM());
      setNote(''); setError('');
    }
  }, [visible]);

  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

  function handleSave() {
    const vs = validateTime(startTime);
    const ve = validateTime(endTime);
    if (!vs.ok || !ve.ok) { setError('Vérifie les horaires (format HH:MM).'); return; }
    if (duration <= 0)    { setError('L\'heure de départ doit être après l\'arrivée.'); return; }
    onSave(vs.fixed, ve.fixed, note.trim() || undefined);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Nouvelle session</Text>

          {/* Horaires */}
          <View style={styles.timesRow}>
            <TimeInput
              label="Arrivée"
              icon="enter-outline"
              iconColor={T.success}
              value={startTime}
              onChange={setStartTime}
              nextRef={endRef}
            />
            <Ionicons name="arrow-forward" size={16} color={T.text3} style={styles.arrow} />
            <TimeInput
              label="Départ"
              icon="exit-outline"
              iconColor={T.error}
              value={endTime}
              onChange={setEndTime}
            />
          </View>

          {/* Durée */}
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color={T.text2} />
            <Text style={[styles.durationText, duration <= 0 && { color: T.error }]}>
              {duration > 0 ? minutesToDuration(duration) : duration === 0 ? '0m' : 'Horaires invalides'}
            </Text>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* Note */}
          <Text style={styles.label}>
            Note <Text style={styles.optional}>(optionnel)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Note"
            placeholderTextColor={T.text3}
            selectionColor={T.accent}
            returnKeyType="done"
          />

          {/* Boutons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, duration <= 0 && styles.saveBtnDisabled]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: T.card,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  handle: { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 20 },

  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  arrow:    { flexShrink: 0 },

  timeCard: {
    flex: 1, backgroundColor: T.cardAlt, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: T.border,
  },
  timeCardError: { borderColor: T.error + '88' },
  timeLabel:    { fontSize: 10, color: T.text2, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  timeInput: {
    fontSize: 30, fontWeight: '800', color: T.text,
    textAlign: 'center', width: '100%',
    padding: 0, margin: 0,
  },
  timeError: { fontSize: 9, color: T.error, fontWeight: '600' },

  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 16 },
  durationText: { fontSize: 15, color: T.accent, fontWeight: '700' },

  errorText: { color: T.error, fontSize: 12, fontWeight: '600', marginBottom: 10, textAlign: 'center' },

  label:    { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  optional: { color: T.text3, fontWeight: '500', letterSpacing: 0, textTransform: 'none' },
  input: {
    backgroundColor: T.input, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: T.text, fontSize: 15,
    borderWidth: 1, borderColor: T.border, marginBottom: 20,
  },

  btnRow:    { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.input },
  cancelText:{ color: T.text2, fontWeight: '600', fontSize: 15 },
  saveBtn:   { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 14, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnDisabled: { backgroundColor: T.cardAlt },
  saveText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
