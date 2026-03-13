import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, SafeAreaView, Dimensions, FlatList, Platform, BackHandler, StatusBar, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Picker } from '@react-native-picker/picker';
import { GEMINI_API_KEY } from '@env';
import { 
  Camera, Image as ImageIcon, History, Trash2, 
  ChevronLeft, Info, CheckCircle, AlertCircle, XCircle,
  Home, User, Heart, Activity, Target, ShieldAlert, Leaf, List as ListIcon, Utensils, PieChart
} from 'lucide-react-native';

const { extractJsonFromText, parseParagraphs, formatHealthValue } = require('./logic');
import HealthCard from './components/HealthCard';
import NutritionalStats from './components/NutritionalStats';
import HomeView from './components/HomeView';
import HistoryView from './components/HistoryView';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONDITIONS = [
  { label: 'Diabetes', value: 'diabetes' },
  { label: 'High Blood Pressure', value: 'blood-pressure' },
  { label: 'Hypertension (Low Sodium)', value: 'hypertension' },
  { label: 'Weight Loss', value: 'weight' },
  { label: 'Celiac Disease (Gluten Free)', value: 'celiac' },
];

const AI_MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-1.5-flash"];

export default function App() {
  const [view, setView] = useState('home'); 
  const [scanMode, setScanMode] = useState('single');
  const [condition, setCondition] = useState('diabetes');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showCalorieBreakdown, setShowCalorieBreakdown] = useState(false);

  const resetApp = () => {
    setImage(null);
    setResult(null);
    setSelectedMenuItem(null);
    setShowCalorieBreakdown(false);
  };

  useEffect(() => {
    loadHistory();
    const backAction = () => {
      if (showCalorieBreakdown) { setShowCalorieBreakdown(false); return true; }
      if (selectedMenuItem) { setSelectedMenuItem(null); return true; }
      if (view === 'detail') { setView('history'); setDetailItem(null); return true; }
      if (view !== 'home') { setView('home'); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [view, selectedMenuItem, showCalorieBreakdown]);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('scan_history');
      if (saved) setScanHistory(JSON.parse(saved));
    } catch (e) { console.error("History Load Error", e); }
  };

  const saveToHistory = async (scanData) => {
    try {
      const newHistory = [scanData, ...scanHistory].slice(0, 50);
      setScanHistory(newHistory);
      await AsyncStorage.setItem('scan_history', JSON.stringify(newHistory));
    } catch (e) { console.error("History Save Error", e); }
  };

  const clearHistory = async () => {
    Alert.alert("Clear History", "Delete all saved scans?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await AsyncStorage.removeItem('scan_history');
        setScanHistory([]);
      }}
    ]);
  };

  const pickImage = async () => {
    if (loading) return;
    let res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.5, base64: true });
    if (!res.canceled) { setImage(res.assets[0]); setResult(null); setSelectedMenuItem(null); }
  };

  const takePhoto = async () => {
    if (loading) return;
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert("Error", "Camera permission is required"); return; }
    let res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5, base64: true });
    if (!res.canceled) { setImage(res.assets[0]); setResult(null); setSelectedMenuItem(null); }
  };

  const analyzeFood = async () => {
    if (!image || loading) return;
    setLoading(true);
    const conditionLabel = CONDITIONS.find(c => c.value === condition).label;
    
    const singlePrompt = `Analyze this food for a person with ${conditionLabel}. Return ONLY a JSON object with: 
      "name", "carbs", "gi", "calories", "fiber", "protein", "verdict", "advice", "suggestions",
      "calorie_breakdown": [{"ingredient": "...", "calories": "..."}]
      Verdict must be Safe/Caution/Avoid. Format stats as "Level (Range)".
      IMPORTANT: Keep "advice" and "suggestions" very concise. Use maximum 3 bullet points per section. Focus on the most critical health impact for ${conditionLabel}.`;
      
    const menuPrompt = `Menu scan for ${conditionLabel}. Return ONLY JSON: {"type": "menu", "items": [{"name": "...", "verdict": "...", "advice": "...", "carbs": "...", "gi": "...", "calories": "...", "fiber": "...", "protein": "...", "calorie_breakdown": [{"ingredient": "...", "calories": "..."}]}]}. 
    Keep advice extremely short (one sentence or 2-3 words) for the menu list view.`;

    const promptText = scanMode === 'single' ? singlePrompt : menuPrompt;

    for (const modelName of AI_MODELS) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent([promptText, { inlineData: { data: image.base64, mimeType: "image/jpeg" } }]);
        const parsedData = extractJsonFromText(res.response.text());
        if (parsedData) {
          const finalResult = { ...parsedData, id: Date.now().toString(), timestamp: new Date().toLocaleString(), imageUri: image.uri, medicalCondition: conditionLabel, scanType: scanMode };
          setResult(finalResult);
          saveToHistory(finalResult);
          setLoading(false);
          return;
        }
      } catch (error) { console.log(modelName, error.message); }
    }
    
    Alert.alert("Analysis Failed", "Please check your internet connection and API key.");
    setLoading(false);
  };

  const renderTextWithHighlights = (text) => {
    if (!text || typeof text !== 'string') return <Text style={styles.paragraphText}>{String(text || '')}</Text>;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
      <Text style={styles.paragraphText}>
        {parts.map((part, i) => (
          part.startsWith('**') && part.endsWith('**') 
          ? <Text key={i} style={styles.highlightText}>{part.substring(2, part.length - 2)}</Text> 
          : part
        ))}
      </Text>
    );
  };


  const renderSingleResult = (data) => (
    <View style={styles.resultContainer}>
      <View style={styles.verdictHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle} numberOfLines={1}>{data.name || 'Food Detected'}</Text>
          <Text style={styles.resultConditionTag}>{data.medicalCondition}</Text>
        </View>
        <View style={[styles.badge, styles.floating, { borderColor: data.verdict === 'Safe' ? '#27ae60' : data.verdict === 'Caution' ? '#f39c12' : '#e74c3c' }]}>
          <Text style={[styles.badgeText, { color: data.verdict === 'Safe' ? '#27ae60' : data.verdict === 'Caution' ? '#f39c12' : '#e74c3c' }]}>{data.verdict || 'Unknown'}</Text>
        </View>
      </View>
      <NutritionalStats 
        data={data} 
        onCaloriePress={() => setShowCalorieBreakdown(true)} 
        formatValue={formatHealthValue} 
      />
      <View style={[styles.infoBox, styles.floating]}>
        <View style={styles.cardHeader}>
          <Activity size={16} color="#27ae60" style={{marginRight: 6}} />
          <Text style={styles.infoTitle}>Expert Advice</Text>
        </View>
        {parseParagraphs(data.advice).map((para, idx) => (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <View style={{flex: 1}}>{renderTextWithHighlights(para)}</View>
          </View>
        ))}
      </View>
      {data.suggestions && (
        <View style={[styles.suggestionBox, styles.floating]}>
          <View style={styles.cardHeader}>
            <Target size={16} color="#1b4d3e" style={{marginRight: 6}} />
            <Text style={styles.infoTitle}>Quick Tips</Text>
          </View>
          {parseParagraphs(data.suggestions).map((para, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={[styles.bulletDot, {backgroundColor: '#1b4d3e'}]} />
              <View style={{flex: 1}}>{renderTextWithHighlights(para)}</View>
            </View>
          ))}
        </View>
      )}

      {/* Calorie Breakdown Modal */}
      <Modal visible={showCalorieBreakdown} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calorie Breakdown</Text>
              <TouchableOpacity onPress={() => setShowCalorieBreakdown(false)}><XCircle size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.breakdownList}>
              {data.calorie_breakdown && data.calorie_breakdown.length > 0 ? data.calorie_breakdown.map((item, idx) => (
                <View key={idx} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{item.ingredient}</Text>
                  <Text style={styles.breakdownValue}>{item.calories}</Text>
                </View>
              )) : <Text style={styles.paragraphText}>Detailed breakdown unavailable for this scan.</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderMenuResult = (data) => (
    <View style={styles.resultContainer}>
      <Text style={styles.menuHeader}>Menu Analysis:</Text>
      {data.items?.map((item, index) => (
        <TouchableOpacity key={index} style={[styles.menuItemCard, styles.floating]} onPress={() => setSelectedMenuItem(item)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.menuItemAdvice} numberOfLines={1}>{item.advice}</Text>
          </View>
          <View style={[styles.menuVerdictBadge, { backgroundColor: item.verdict === 'Safe' ? '#e8f5e9' : item.verdict === 'Caution' ? '#fff7ed' : '#fef2f2' }]}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: item.verdict === 'Safe' ? '#27ae60' : item.verdict === 'Caution' ? '#f39c12' : '#e74c3c' }}>{item.verdict}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {selectedMenuItem && (
        <View style={styles.menuDetailOverlay}>
          <View style={styles.menuDetailHeader}>
            <TouchableOpacity onPress={() => setSelectedMenuItem(null)}><ChevronLeft color="#27ae60" size={28} /></TouchableOpacity>
            <Text style={styles.menuDetailTitle}>Dish Details</Text>
            <View width={28} />
          </View>
          <ScrollView contentContainerStyle={{padding: 20}}>{renderSingleResult({...selectedMenuItem, medicalCondition: data.medicalCondition})}</ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {view === 'detail' && <TouchableOpacity onPress={() => setView('history')} style={{ marginRight: 10 }}><ChevronLeft color="#27ae60" size={24} /></TouchableOpacity>}
          <Leaf color="#27ae60" size={24} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>NutriScan AI</Text>
        </View>
        {(view === 'history' || view === 'detail') && <TouchableOpacity onPress={clearHistory}><Trash2 color="#ef4444" size={20} /></TouchableOpacity>}
      </View>

      {view === 'home' && (
        <HomeView 
          scanMode={scanMode} setScanMode={setScanMode}
          condition={condition} setCondition={setCondition}
          image={image} loading={loading} result={result}
          pickImage={pickImage} takePhoto={takePhoto} analyzeFood={analyzeFood} resetApp={resetApp}
          renderResult={result && result.type === 'menu' ? renderMenuResult : renderSingleResult}
          CONDITIONS={CONDITIONS}
        />
      )}

      {view === 'history' && (
        <HistoryView scanHistory={scanHistory} onSelectDetail={(item) => { setDetailItem(item); setView('detail'); }} />
      )}

      {view === 'detail' && detailItem && (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={[styles.imageBox, styles.floating]}><Image source={{ uri: detailItem.imageUri }} style={styles.mainImage} /></View>
          <Text style={styles.timestampText}>{detailItem.timestamp}</Text>
          {detailItem.scanType === 'menu' ? renderMenuResult(detailItem) : renderSingleResult(detailItem)}
        </ScrollView>
      )}

      {view === 'profile' && (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.profileHeader}><View style={[styles.avatar, styles.floating]}><User size={36} color="#fff" /></View><Text style={styles.profileName}>Health Profile</Text></View>
          <View style={[styles.profileSection, styles.floating]}><Text style={styles.sectionTitle}>Condition</Text><Text style={styles.sectionContent}>{condition.toUpperCase()}</Text></View>
          <View style={[styles.profileSection, styles.floating]}><Text style={styles.sectionTitle}>Total Records</Text><Text style={styles.sectionContent}>{scanHistory.length} analyses</Text></View>
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setView('home')}><Home color={view === 'home' ? '#27ae60' : '#94a3b8'} size={32} /><Text style={[styles.navText, { color: view === 'home' ? '#27ae60' : '#94a3b8' }]}>Home</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { setView('history'); setDetailItem(null); setSelectedMenuItem(null); }}><History color={view === 'history' || view === 'detail' ? '#27ae60' : '#a8dadc'} size={32} /><Text style={[styles.navText, { color: view === 'history' || view === 'detail' ? '#27ae60' : '#a8dadc' }]}>History</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setView('profile')}><User color={view === 'profile' ? '#27ae60' : '#a8dadc'} size={32} /><Text style={[styles.navText, { color: view === 'profile' ? '#27ae60' : '#a8dadc' }]}>Profile</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f8f6' },
  floating: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 4 } }) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, paddingTop: Platform.OS === 'android' ? 50 : 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0efea' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1b4d3e' },
  container: { paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 15, width: '100%', borderWidth: 1, borderColor: '#e0efea' },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#27ae60' },
  modeText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#27ae60' },
  conditionSelector: { width: '100%', marginBottom: 15 },
  label: { fontSize: 11, fontWeight: '700', color: '#27ae60', marginBottom: 5 },
  pickerWrapper: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e0efea', overflow: 'hidden', height: 45, justifyContent: 'center' },
  disabledWrapper: { backgroundColor: '#f8fafc', opacity: 0.6 },
  picker: { width: '100%' },
  pickerItem: { fontSize: 12.5 },
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
  resultContainer: { width: '100%' },
  verdictHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitle: { fontSize: 17, fontWeight: '800', color: '#1b4d3e', flex: 1 },
  resultConditionTag: { fontSize: 11, color: '#27ae60', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, backgroundColor: '#fff' },
  badgeText: { fontWeight: '900', fontSize: 11 },
  infoBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0efea', borderRadius: 16, padding: 12, marginBottom: 15 },
  suggestionBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7', borderRadius: 16, padding: 12, marginBottom: 15 },
  infoTitle: { fontSize: 13, fontWeight: '900', color: '#27ae60', textTransform: 'uppercase' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27ae60', marginTop: 7, marginRight: 10 },
  paragraphWrapper: { marginBottom: 6 },
  paragraphText: { fontSize: 13.5, color: '#334155', lineHeight: 19 },
  highlightText: { fontWeight: 'bold', color: '#1b4d3e', backgroundColor: '#dff6ed' },
  menuHeader: { fontSize: 14, fontWeight: '900', color: '#27ae60', marginBottom: 10, textTransform: 'uppercase' },
  menuItemCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e0efea' },
  menuItemName: { fontSize: 15, fontWeight: '800', color: '#1b4d3e' },
  menuItemAdvice: { fontSize: 12, color: '#64748b', marginTop: 2 },
  menuVerdictBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  menuDetailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f1f8f6', zIndex: 10 },
  menuDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0efea' },
  menuDetailTitle: { fontSize: 16, fontWeight: '800', color: '#1b4d3e' },
  historyContainer: { flex: 1 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 2, marginBottom: 12, borderWidth: 1, borderColor: '#e0efea', alignItems: 'center' },
  historyImage: { width: 50, height: 50, borderRadius: 10 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyName: { fontSize: 14, fontWeight: '700', color: '#1b4d3e' },
  historyConditionText: { fontSize: 10, color: '#27ae60', fontWeight: '600' },
  historyVerdict: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  menuBadge: { backgroundColor: '#27ae60', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
  timestampText: { fontSize: 11, color: '#94a3b8', marginBottom: 10, marginLeft: 5 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 14 },
  profileHeader: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '800', color: '#1b4d3e', marginTop: 10 },
  profileSection: { width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e0efea' },
  sectionTitle: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  sectionContent: { fontSize: 14, color: '#1b4d3e', fontWeight: '700', marginTop: 2 },
  bottomNav: { flexDirection: 'row', height: 80, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0efea', paddingBottom: 25, paddingTop: 10 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1b4d3e' },
  breakdownList: { paddingBottom: 20 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  breakdownLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
  breakdownValue: { fontSize: 14, color: '#27ae60', fontWeight: '700' }
});
