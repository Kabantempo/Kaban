import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Habit, HABIT_COLORS, HABIT_ICONS } from '../types';

interface Props {
  visible: boolean;
  habit?: Habit;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function HabitModal({ visible, habit, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState('50');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [icon, setIcon] = useState(HABIT_ICONS[0]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description);
      setXpReward(String(habit.xpReward));
      setColor(habit.color);
      setIcon(habit.icon);
    } else {
      setName('');
      setDescription('');
      setXpReward('50');
      setColor(HABIT_COLORS[0]);
      setIcon(HABIT_ICONS[0]);
    }
  }, [habit, visible]);

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      xpReward: Math.max(1, parseInt(xpReward) || 50),
      color,
      icon,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <LinearGradient colors={['#1A0533', '#0D1B4B']} style={styles.sheetGrad}>
            <View style={styles.handle} />

            <Text style={styles.title}>
              {habit ? 'Modifier l\'habitude' : 'Nouvelle habitude'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Icône</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
                {HABIT_ICONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    style={[styles.iconBtn, ic === icon && styles.iconBtnActive]}
                    onPress={() => setIcon(ic)}
                  >
                    <Text style={styles.iconBtnText}>{ic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Faire du sport"
                placeholderTextColor="#475569"
                selectionColor="#A855F7"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: 30 minutes minimum"
                placeholderTextColor="#475569"
                selectionColor="#A855F7"
              />

              <Text style={styles.label}>XP récompense</Text>
              <TextInput
                style={styles.input}
                value={xpReward}
                onChangeText={setXpReward}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#475569"
                selectionColor="#A855F7"
              />

              <Text style={styles.label}>Couleur</Text>
              <View style={styles.colorRow}>
                {HABIT_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorBtn, { backgroundColor: c }, c === color && styles.colorBtnActive]}
                    onPress={() => setColor(c)}
                  >
                    {c === color && <Text style={styles.colorCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                  <LinearGradient
                    colors={['#A855F7', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGrad}
                  >
                    <Text style={styles.saveText}>{habit ? 'Enregistrer' : 'Créer'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  sheetGrad: {
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    color: '#A855F7',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  iconRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconBtnActive: {
    borderColor: '#A855F7',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  iconBtnText: {
    fontSize: 22,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  colorCheck: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
