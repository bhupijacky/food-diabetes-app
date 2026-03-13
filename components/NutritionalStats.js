import React from 'react';
import { StyleSheet, View } from 'react-native';
import HealthCard from './HealthCard';

const NutritionalStats = ({ data, onCaloriePress, formatValue }) => (
  <View style={styles.wrapper}>
    <View style={styles.statsGrid}>
      <HealthCard label="CARBS" value={data.carbs} bgColor="#eef2ff" formatValue={formatValue} />
      <HealthCard label="GI INDEX" value={data.gi} bgColor="#fff7ed" formatValue={formatValue} />
    </View>
    <View style={{ marginBottom: 10 }}>
      <HealthCard 
        label="CALORIES" 
        value={data.calories} 
        bgColor="#fef2f2" 
        isCalorie={true} 
        fullWidth={true} 
        onPress={onCaloriePress}
        formatValue={formatValue}
      />
    </View>
    <View style={styles.statsGrid}>
      <HealthCard label="FIBER" value={data.fiber} bgColor="#f0fdf4" formatValue={formatValue} />
      <HealthCard label="PROTEIN" value={data.protein} bgColor="#f5f3ff" formatValue={formatValue} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
});

export default NutritionalStats;
