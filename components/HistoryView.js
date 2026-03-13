import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { History, ChevronLeft } from 'lucide-react-native';

const HistoryView = ({ scanHistory, onSelectDetail }) => (
  <View style={styles.historyContainer}>
    {scanHistory.length > 0 ? (
      <FlatList 
        data={scanHistory} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{ padding: 15 }} 
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.historyCard, styles.floating]} 
            onPress={() => onSelectDetail(item)}
          >
            <Image source={{ uri: item.imageUri }} style={styles.historyImage} />
            <View style={styles.historyInfo}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.historyName} numberOfLines={1}>{item.scanType === 'menu' ? 'Menu Analysis' : (item.name || 'Meal')}</Text>
                {item.scanType === 'menu' && <View style={styles.menuBadge}><Text style={{fontSize: 9, color: '#fff', fontWeight: 'bold'}}>MENU</Text></View>}
              </View>
              <Text style={styles.historyConditionText}>{item.medicalCondition}</Text>
              <Text style={[styles.historyVerdict, { color: item.verdict === 'Safe' ? '#27ae60' : item.verdict === 'Caution' ? '#f39c12' : '#e74c3c' }]}>
                {item.scanType === 'menu' ? `${item.items?.length || 0} items` : (item.verdict || 'Unknown')}
              </Text>
            </View>
            <ChevronLeft color="#27ae60" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        )} 
      />
    ) : (
      <View style={styles.emptyBox}>
        <History color="#27ae60" size={48} opacity={0.3} />
        <Text style={styles.emptyText}>No scans yet</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  historyContainer: { flex: 1 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 2, marginBottom: 12, borderWidth: 1, borderColor: '#e0efea', alignItems: 'center' },
  historyImage: { width: 50, height: 50, borderRadius: 10 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyName: { fontSize: 14, fontWeight: '700', color: '#1b4d3e' },
  historyConditionText: { fontSize: 10, color: '#27ae60', fontWeight: '600' },
  historyVerdict: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  menuBadge: { backgroundColor: '#27ae60', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  floating: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 14 },
});

export default HistoryView;
