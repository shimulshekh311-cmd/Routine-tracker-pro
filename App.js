import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Dimensions,
  Vibration,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5 
} from '@expo/vector-icons';

// Notifications Setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldVibrate: true,
  }),
});

const { width } = Dimensions.get('window');

export default function App() {
  const [activeTab, setActiveTab] = useState('Tasks');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('pomo');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  
  const [habits, setHabits] = useState([
    { id: '1', name: 'Morning Prayer', completed: false },
    { id: '2', name: 'Work Out', completed: false },
    { id: '3', name: 'Learn something new', completed: false },
    { id: '4', name: 'Read Book', completed: false },
    { id: '5', name: 'Evening Reflection', completed: false },
  ]);

  const [userInput, setUserInput] = useState("");
  const [typingTimer, setTypingTimer] = useState(600); // 10 minutes
  const [typingActive, setTypingActive] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const typingText = "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging errant code. Excellence is not a gift, but a skill that takes practice.";

  // Persistence
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedHabits = await AsyncStorage.getItem('habits');
        if (savedHabits) setHabits(JSON.parse(savedHabits));
        
        const lastDate = await AsyncStorage.getItem('lastDate');
        const today = new Date().toDateString();
        if (lastDate !== today) {
          setHabits(current => current.map(h => ({ ...h, completed: false })));
          await AsyncStorage.setItem('lastDate', today);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('habits', JSON.stringify(habits));
      } catch (e) {
        console.error(e);
      }
    };
    saveData();
  }, [habits]);

  // Timer Catch-up Logic
  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (pomodoroMode === 'pomo' ? (25 * 60 - pomodoroTime) * 1000 : stopwatchTime * 1000);
      }
      
      timerRef.current = setInterval(() => {
        if (pomodoroMode === 'pomo') {
          setPomodoroTime(t => {
            if (t <= 1) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Notifications.scheduleNotificationAsync({
                content: { title: "Time's Up!", body: "Your Pomodoro session is complete." },
                trigger: null,
              });
              setIsActive(false);
              return 0;
            }
            return t - 1;
          });
        } else {
          setStopwatchTime(t => t + 1);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      startTimeRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, pomodoroMode]);

  // Typing Practice Logic
  useEffect(() => {
    if (typingActive) {
      activateKeepAwake();
      const interval = setInterval(() => {
        setTypingTimer(t => {
          if (t <= 1) {
            setTypingActive(false);
            deactivateKeepAwake();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        clearInterval(interval);
        deactivateKeepAwake();
      };
    }
  }, [typingActive]);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const completedHabits = habits.filter(h => h.completed).length;
  const fatimaPercentage = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderTasks = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.timerCircle, isActive && styles.timerActive]}>
        <Text style={styles.timerText}>
          {pomodoroMode === 'pomo' ? formatTime(pomodoroTime) : formatTime(stopwatchTime)}
        </Text>
        <Text style={styles.timerSub}>{pomodoroMode === 'pomo' ? 'FOCUS SESSION' : 'STOPWATCH'}</Text>
      </View>

      <View style={styles.timerControls}>
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => {
            setIsActive(!isActive);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Ionicons name={isActive ? "pause" : "play"} size={24} color="white" />
          <Text style={styles.mainButtonText}>{isActive ? 'PAUSE' : 'START'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => {
            setIsActive(false);
            setPomodoroTime(25 * 60);
            setStopwatchTime(0);
          }}
        >
          <Ionicons name="refresh" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity 
          onPress={() => { setPomodoroMode('pomo'); setIsActive(false); }}
          style={[styles.modeButton, pomodoroMode === 'pomo' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, pomodoroMode === 'pomo' && styles.modeButtonTextActive]}>Pomo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => { setPomodoroMode('stopwatch'); setIsActive(false); }}
          style={[styles.modeButton, pomodoroMode === 'stopwatch' && styles.modeButtonActive]}
        >
          <Text style={[styles.modeButtonText, pomodoroMode === 'stopwatch' && styles.modeButtonTextActive]}>Watch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHabits = () => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Daily Progress</Text>
        <View style={styles.scoreValueWrapper}>
          <Text style={styles.scoreValue}>{fatimaPercentage}%</Text>
          <Text style={styles.scoreLabel}>GOAL_ACTIVE</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${fatimaPercentage}%` }]} />
        </View>
      </View>

      {habits.map(habit => (
        <TouchableOpacity 
          key={habit.id} 
          onPress={() => toggleHabit(habit.id)}
          style={[styles.habitItem, habit.completed && styles.habitCompleted]}
        >
          <Text style={[styles.habitText, habit.completed && styles.habitTextDone]}>{habit.name}</Text>
          <Ionicons 
            name={habit.completed ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={habit.completed ? "#4CAF50" : "#DDD"} 
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTyping = () => (
    <View style={styles.scrollContainer}>
      <View style={styles.typingHeader}>
        <View>
          <Text style={styles.typingTimerLabel}>TIME REMAINING</Text>
          <Text style={styles.typingTimerVal}>{formatTime(typingTimer)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.typingStartBtn}
          onPress={() => setTypingActive(!typingActive)}
        >
          <Text style={styles.typingStartBtnText}>{typingActive ? "PAUSE" : "START"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.typingSample}>
        <Text style={styles.typingSampleText}>{typingText}</Text>
      </View>

      <TextInput 
        multiline
        editable={typingActive}
        value={userInput}
        onChangeText={setUserInput}
        style={styles.typingInput}
        placeholder="Type here..."
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ROUTINE <Text style={styles.headerTitleAccent}>TRACKER</Text></Text>
        <View style={styles.avatar}>
          <FontAwesome5 name="zap" size={18} color="white" />
        </View>
      </View>

      <View style={styles.content}>
        {activeTab === 'Tasks' && renderTasks()}
        {activeTab === 'Habits' && renderHabits()}
        {activeTab === 'Typing' && renderTyping()}
        {activeTab === 'Stats' && <Text style={styles.placeholder}>Stats Coming Soon</Text>}
        {activeTab === 'Routine' && <Text style={styles.placeholder}>Routine Coming Soon</Text>}
      </View>

      <View style={styles.tabBar}>
        {['Tasks', 'Habits', 'Routine', 'Typing', 'Stats'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={styles.tabItem}
          >
            <Ionicons 
              name={
                tab === 'Tasks' ? 'timer' : 
                tab === 'Habits' ? 'list' : 
                tab === 'Routine' ? 'flame' : 
                tab === 'Typing' ? 'keyboard' : 'bar-chart'
              } 
              size={24} 
              color={activeTab === tab ? '#FF6B00' : '#BBB'} 
            />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    paddingTop: 60,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  headerTitleAccent: { color: '#4F46E5' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  timerCircle: { 
    width: 280, 
    height: 280, 
    borderRadius: 60, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  timerActive: { borderColor: '#4F46E5', borderWidth: 3 },
  timerText: { fontSize: 64, fontWeight: '900', color: '#4F46E5', letterSpacing: -2 },
  timerSub: { fontSize: 10, fontWeight: '900', color: '#64748B', marginTop: 8, letterSpacing: 2 },
  timerControls: { flexDirection: 'row', marginTop: 48, alignItems: 'center' },
  mainButton: { backgroundColor: '#4F46E5', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 20, marginHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  mainButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 8, letterSpacing: 1 },
  secondaryButton: { backgroundColor: '#F1F5F9', padding: 18, borderRadius: 20, marginHorizontal: 8 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 4, marginTop: 40 },
  modeButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  modeButtonActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  modeButtonText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  modeButtonTextActive: { color: '#4F46E5' },
  scrollContainer: { flex: 1, padding: 24 },
  scoreCard: { backgroundColor: '#4F46E5', padding: 28, borderRadius: 24, marginBottom: 24, overflow: 'hidden' },
  scoreTitle: { color: 'white', opacity: 0.7, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  scoreValueWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: 12 },
  scoreValue: { color: 'white', fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  scoreLabel: { color: 'white', fontSize: 10, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: 'white', borderRadius: 4 },
  habitItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  habitCompleted: { backgroundColor: '#EEF2FF', borderColor: '#E0E7FF' },
  habitText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  habitTextDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  typingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#4F46E5', 
    padding: 24, 
    borderRadius: 24, 
    marginBottom: 20 
  },
  typingTimerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  typingTimerVal: { color: 'white', fontSize: 36, fontWeight: '900' },
  typingStartBtn: { backgroundColor: 'white', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  typingStartBtnText: { color: '#4F46E5', fontWeight: '900', fontSize: 12 },
  typingSample: { padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  typingSampleText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#64748B', lineHeight: 22, fontSize: 13 },
  typingInput: { fontSize: 15, backgroundColor: '#FFF', borderRadius: 20, padding: 20, minHeight: 150, textAlignVertical: 'top', borderWidth: 1, borderColor: '#F1F5F9' },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF',
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9', 
    paddingBottom: 30, 
    paddingTop: 15 
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 9, color: '#CBD5E1', marginTop: 6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabLabelActive: { color: '#4F46E5' },
  placeholder: { textAlign: 'center', marginTop: 100, color: '#94A3B8', fontWeight: '700' }
});
