import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Utensils, List as ListIcon, Image as ImageIcon, Camera } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

const HomeView = ({ 
  scanMode, setScanMode, 
  condition, setCondition, 
  image, loading, result, 
  pickImage, takePhoto, analyzeFood, resetApp,
  renderResult,
  CONDITIONS
}) => (
  <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    <View style={styles.modeToggle}>
      <TouchableOpacity style={[styles.modeBtn, scanMode === 'single' && styles.modeBtnActive]} onPress={() => setScanMode('single')}>
        <Utensils size={18} color={scanMode === 'single' ? '#fff' : '#27ae60'} />
        <Text style={[styles.modeText, scanMode === 'single' && {color: '#fff'}]}>Scan Food</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.modeBtn, scanMode === 'menu' && styles.modeBtnActive]} onPress={() => setScanMode('menu')}>
        <ListIcon size={18} color={scanMode === 'menu' ? '#fff' : '#27ae60'} />
        <Text style={[styles.modeText, scanMode === 'menu' && {color: '#fff'}]}>Menu Scan</Text>
      </TouchableOpacity>
    </View>
    
    <View style={styles.conditionSelector}>
      <View style={[styles.pickerWrapper, loading && styles.disabledWrapper, styles.floating]}>
        <Picker selectedValue={condition} onValueChange={(v) => setCondition(v)} style={styles.picker} dropdownIconColor="#27ae60" enabled={!loading}>
          {CONDITIONS.map((c) => <Picker.Item key={c.value} label={c.label} value={c.value} color="#1b4d3e" style={{fontSize: 14}} />)}
        </Picker>
      </View>
    </View>

    <View style={[styles.imageBox, styles.floating]}>
      {image ? <Image source={{ uri: image.uri }} style={styles.mainImage} /> : <View style={styles.placeholderBox}><ImageIcon color="#cbd5e1" size={48} /><Text style={styles.placeholderText}>Scan to Start</Text></View>}
    </View>

    <View style={styles.actionRow}>
      <TouchableOpacity style={[styles.iconButton, styles.floating, loading && styles.disabledButton]} onPress={pickImage} disabled={loading}><ImageIcon color="#27ae60" size={20} /><Text style={styles.iconButtonText}>Gallery</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.iconButton, styles.floating, loading && styles.disabledButton]} onPress={takePhoto} disabled={loading}><Camera color="#27ae60" size={20} /><Text style={styles.iconButtonText}>Camera</Text></TouchableOpacity>
    </View>

    {image && !loading && !result && <TouchableOpacity style={[styles.scanButton, styles.floating]} onPress={analyzeFood}><Text style={styles.scanButtonText}>ANALYZE</Text></TouchableOpacity>}
    {loading && <View style={styles.loaderBox}><ActivityIndicator size="large" color="#27ae60" /><Text style={styles.loaderText}>Processing...</Text></View>}
    
    {result && renderResult(result)}
    
    {result && !loading && (
      <TouchableOpacity style={[styles.resetButton, styles.floating]} onPress={resetApp}>
        <Text style={styles.resetButtonText}>START NEW SCAN</Text>
      </TouchableOpacity>
    )}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 15, width: '100%', borderWidth: 1, borderColor: '#e0efea' },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#27ae60' },
  modeText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#27ae60' },
  conditionSelector: { width: '100%', marginBottom: 15 },
  pickerWrapper: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0efea', height: 45, justifyContent: 'center' },
  floating: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  disabledWrapper: { backgroundColor: '#f8fafc', opacity: 0.6 },
  picker: { width: '100%' },
  imageBox: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#cce3de' },
  mainImage: { width: '100%', height: '100%' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 10, color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  iconButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 12, width: '48%', borderWidth: 1, borderColor: '#27ae60' },
  disabledButton: { opacity: 0.5 },
  iconButtonText: { color: '#27ae60', fontWeight: '700', marginLeft: 8, fontSize: 13 },
  scanButton: { backgroundColor: '#27ae60', width: '100%', padding: 14, borderRadius: 12, alignItems: 'center' },
  scanButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  resetButton: { backgroundColor: '#f1f5f9', width: '100%', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  resetButtonText: { color: '#64748b', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  loaderBox: { marginVertical: 15, alignItems: 'center' },
  loaderText: { marginTop: 8, color: '#27ae60', fontSize: 13, fontWeight: '600' },
});

export default HomeView;
