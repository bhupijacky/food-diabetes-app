import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { PieChart } from 'lucide-react-native';

const HealthCard = ({ label, value, bgColor, isCalorie = false, fullWidth = false, onPress, formatValue }) => (
  <TouchableOpacity 
    activeOpacity={isCalorie ? 0.7 : 1}
    onPress={onPress}
    style={[styles.statItem, styles.floating, { backgroundColor: bgColor, width: fullWidth ? '100%' : '48%' }]}
  >
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Text style={styles.statVal} numberOfLines={1}>{value ? formatValue(value) : "-"}</Text>
      {isCalorie && <PieChart size={12} color="#1b4d3e" style={{marginLeft: 4}} />}
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    {isCalorie && <Text style={styles.tapText}>TAP FOR BREAKDOWN</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  statItem: { borderWidth: 1, borderColor: '#e0efea', borderRadius: 14, padding: 10, alignItems: 'center' },
  statVal: { fontSize: 13, color: '#1b4d3e', fontWeight: 'bold' },
  statLabel: { fontSize: 9, color: '#27ae60', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  tapText: { fontSize: 8, color: '#1b4d3e', marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },
  floating: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 4 } }) },
});

export default HealthCard;
