import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Profile, GroupTask, HABIT_COLORS } from '../types';
import { T } from '../theme';

const AVATAR_COLORS = HABIT_COLORS;
function avatarColor(p: Profile) { return /^#[0-9A-Fa-f]{6}$/.test(p.emoji) ? p.emoji : AVATAR_COLORS[0]; }

// Auto-format DD/MM/YYYY pendant la frappe
function formatDateInput(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function parseDate(val: string): string | undefined {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}`);
  if (isNaN(d.getTime())) return undefined;
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDisplay(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface Props {
  visible: boolean;
  profiles: Profile[];
  activeId: string;
  task?: GroupTask;
  onSave: (title: string, description: string, assignedTo: string[], deadline?: string) => void;
  onClose: () => void;
}

export default function TaskModal({ visible, profiles, activeId, task, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo,  setAssignedTo]  = useState<string[]>([activeId]);
  const [dateRaw,     setDateRaw]     = useState('');
  const [dateError,   setDateError]   = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssignedTo(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]);
      setDateRaw(isoToDisplay(task.deadline));
    } else {
      setTitle(''); setDescription('');
      setAssignedTo([activeId]); setDateRaw('');
    }
    setError(''); setDateError(false);
  }, [task, visible, activeId]);

  function toggleAssign(id: string) {
    setAssignedTo(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]
    );
  }

  function handleSave() {
    if (!title.trim())         { setError('Le titre est obligatoire.'); return; }
    if (assignedTo.length === 0) { setError('Assigne la tâche à au moins une personne.'); return; }
    let deadline: string | undefined;
    if (dateRaw) {
      deadline = parseDate(dateRaw);
      if (!deadline) { setDateError(true); setError('Date invalide (format JJ/MM/AAAA).'); return; }
    }
    onSave(title.trim(), description.trim(), assignedTo, deadline);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Titre */}
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={t => { setTitle(t); setError(''); }}
              placeholder="Titre de la tâche"
              placeholderTextColor={T.text3}
              selectionColor={T.accent}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={T.text3}
              selectionColor={T.accent}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Assigner à */}
            <Text style={styles.label}>Assigner à</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroll}>
              {profiles.map(p => {
                const color    = avatarColor(p);
                const selected = assignedTo.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.profileChip, selected && { borderColor: color, backgroundColor: color + '22' }]}
                    onPress={() => toggleAssign(p.id)}
                  >
                    <View style={[styles.chipAvatar, { backgroundColor: color }]}>
                      <Text style={styles.chipAvatarLetter}>{p.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.chipName, selected && { color: T.text }]}>{p.name}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={14} color={color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Deadline */}
            <Text style={styles.label}>
              Deadline <Text style={styles.optional}>(optionnel)</Text>
            </Text>
            <View style={[styles.dateRow, dateError && styles.dateRowError]}>
              <Ionicons name="calendar-outline" size={16} color={T.text2} />
              <TextInput
                style={styles.dateInput}
                value={dateRaw}
                onChangeText={t => { setDateRaw(formatDateInput(t)); setDateError(false); setError(''); }}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={T.text3}
                keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                maxLength={10}
                selectionColor={T.accent}
              />
            </View>
            {dateError && <Text style={styles.fieldError}>Format attendu : JJ/MM/AAAA</Text>}

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Boutons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name={task ? 'save-outline' : 'add'} size={16} color="#fff" />
                <Text style={styles.saveText}>{task ? 'Enregistrer' : 'Créer'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', paddingHorizontal: 20, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  handle: { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  title:  { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 20 },
  label:  { fontSize: 11, color: T.text2, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  optional: { color: T.text3, fontWeight: '500', letterSpacing: 0, textTransform: 'none' },

  input: {
    backgroundColor: T.input, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 13, color: T.text, fontSize: 15,
    borderWidth: 1, borderColor: T.border,
  },
  inputMulti: { minHeight: 80, paddingTop: 12 },

  profileScroll: { marginBottom: 4 },
  profileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: T.cardAlt, borderRadius: 24,
    paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 8, borderWidth: 1.5, borderColor: T.border,
  },
  chipAvatar:       { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chipAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chipName:         { fontSize: 13, fontWeight: '600', color: T.text2 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.input, borderRadius: 14,
    paddingHorizontal: 16, borderWidth: 1, borderColor: T.border,
  },
  dateRowError: { borderColor: T.error + '88' },
  dateInput: { flex: 1, paddingVertical: 13, color: T.text, fontSize: 15 },
  fieldError: { fontSize: 11, color: T.error, fontWeight: '600', marginTop: 4 },
  errorText:  { color: T.error, fontSize: 12, fontWeight: '600', marginTop: 10, textAlign: 'center' },

  btnRow:    { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.input },
  cancelText:{ color: T.text2, fontWeight: '600', fontSize: 15 },
  saveBtn:   { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 14, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
});
