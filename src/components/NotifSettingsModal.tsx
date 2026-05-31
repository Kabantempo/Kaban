import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, Switch, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifSettings, saveNotifSettings, requestNotifPermission,
} from '../utils/notifications';
import { T } from '../theme';

function formatTimeInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function validateTime(val: string): boolean {
  const m = val.match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  return +m[1] <= 23 && +m[2] <= 59;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotifSettingsModal({ visible, onClose }: Props) {
  const [enabled,  setEnabled]  = useState(false);
  const [timeRaw,  setTimeRaw]  = useState('09:00');
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (visible) {
      getNotifSettings().then(s => { setEnabled(s.enabled); setTimeRaw(s.time); });
      setSaved(false); setError('');
    }
  }, [visible]);

  async function handleToggle(val: boolean) {
    if (val && Platform.OS !== 'web') {
      const granted = await requestNotifPermission();
      if (!granted) { setError('Permission refusée. Active les notifications dans les réglages.'); return; }
    }
    setEnabled(val);
  }

  async function handleSave() {
    if (enabled && !validateTime(timeRaw)) { setError('Format invalide (HH:MM).'); return; }
    await saveNotifSettings(enabled, timeRaw);
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Notifications</Text>

        {/* Toggle */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={20} color={enabled ? T.accent : T.text2} />
            <View>
              <Text style={styles.rowLabel}>Rappel quotidien</Text>
              <Text style={styles.rowSub}>Une notification chaque jour</Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: T.border, true: T.accentDim }}
            thumbColor={enabled ? T.accent : T.text3}
          />
        </View>

        {/* Heure */}
        {enabled && (
          <>
            <Text style={styles.label}>Heure du rappel</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={18} color={T.text2} />
              <TextInput
                style={styles.timeInput}
                value={timeRaw}
                onChangeText={t => { setTimeRaw(formatTimeInput(t)); setError(''); setSaved(false); }}
                placeholder="09:00"
                placeholderTextColor={T.text3}
                keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                maxLength={5}
                selectionColor={T.accent}
              />
              <Text style={styles.timeHint}>HH:MM</Text>
            </View>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {saved  && <Text style={styles.success}>✓ Enregistré</Text>}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveTxt}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: T.border,
  },
  handle:   { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:    { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 20 },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.cardAlt, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: T.text },
  rowSub:   { fontSize: 11, color: T.text2, marginTop: 2 },
  label:    { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: T.border, marginBottom: 16 },
  timeInput:{ flex: 1, paddingVertical: 14, fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: 4 },
  timeHint: { fontSize: 11, color: T.text3 },
  error:    { color: T.error,   fontSize: 12, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  success:  { color: T.success, fontSize: 12, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  saveBtn:  { backgroundColor: T.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
