import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import TabBar from './src/components/TabBar';
import { AppData } from './src/types';
import { loadData } from './src/utils/storage';

export default function App() {
  const [tab, setTab] = useState<'home' | 'calendar'>('home');
  const [data, setData] = useState<AppData>({ habits: [], entries: [], totalXP: 0 });

  useEffect(() => {
    loadData().then(setData);
  }, []);

  return (
    <View style={styles.root}>
      {tab === 'home' ? (
        <HomeScreen onDataChange={setData} />
      ) : (
        <CalendarScreen data={data} />
      )}
      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080B1A' },
});
