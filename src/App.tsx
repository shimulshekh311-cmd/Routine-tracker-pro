import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Timer, 
  ClipboardList, 
  Flame, 
  BarChart3, 
  Keyboard, 
  Play, 
  Pause, 
  RotateCcw,
  Zap,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit, Tab } from './types';

// Mocking Native Modules for Web
const vibrate = () => {
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Tasks');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'pomo' | 'stopwatch'>('pomo');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Morning Prayer', completed: false },
      { id: '2', name: 'Work Out', completed: false },
      { id: '3', name: 'Learn something new', completed: false },
      { id: '4', name: 'Read Book', completed: false },
      { id: '5', name: 'Evening Reflection', completed: false },
    ];
  });

  const [typingText] = useState("The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging errant code. Excellence is not a gift, but a skill that takes practice.");
  const [userInput, setUserInput] = useState("");
  const [typingTimer, setTypingTimer] = useState(600); // 10 minutes
  const [typingActive, setTypingActive] = useState(false);
  const [isLEDMode, setIsLEDMode] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  // Daily Refresh Logic
  useEffect(() => {
    const lastDate = localStorage.getItem('lastDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
      setHabits(current => current.map(h => ({ ...h, completed: false })));
      localStorage.setItem('lastDate', today);
    }
  }, []);

  // Timer Catch-up Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && startTimeRef.current) {
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTimeRef.current) / 1000);
        
        if (pomodoroMode === 'pomo') {
          // Assuming we started at 25m
          const baseTime = 25 * 60;
          setPomodoroTime(Math.max(0, baseTime - elapsedSinceStart));
        } else {
          setStopwatchTime(elapsedSinceStart);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, pomodoroMode]);

  useEffect(() => {
    if (isActive) {
      if (!startTimeRef.current) {
        // If we're starting fresh, record the start time adjusted for current value
        if (pomodoroMode === 'pomo') {
          startTimeRef.current = Date.now() - ((25 * 60 - pomodoroTime) * 1000);
        } else {
          startTimeRef.current = Date.now() - (stopwatchTime * 1000);
        }
      }
      
      timerRef.current = setInterval(() => {
        if (pomodoroMode === 'pomo') {
          setPomodoroTime(t => {
            if (t <= 1) {
              setIsActive(false);
              vibrate();
              return 0;
            }
            return t - 1;
          });
        } else {
          setStopwatchTime(t => t + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      startTimeRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, pomodoroMode, pomodoroTime, stopwatchTime]);

  // Typing Practice Logic
  useEffect(() => {
    if (typingActive) {
      const interval = setInterval(() => {
        setTypingTimer(t => {
          if (t <= 1) {
            setTypingActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [typingActive]);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    vibrate();
  };

  const toggleLEDMode = () => {
    setIsLEDMode(!isLEDMode);
    vibrate();
  };

  const completedHabitsCount = habits.filter(h => h.completed).length;
  const fatimaPercentage = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderTasks = () => (
    <div className={`flex flex-col items-center space-y-8 p-4 ${isLEDMode ? 'fixed inset-0 z-[100] bg-black justify-center p-0' : ''}`}>
      {isLEDMode && (
        <button 
          onClick={() => setIsLEDMode(false)}
          className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors"
        >
          <RotateCcw size={32} />
        </button>
      )}

      <div className={`w-full aspect-square max-w-[300px] border-4 border-indigo-50 rounded-[3rem] flex flex-col items-center justify-center bg-white text-slate-900 shadow-2xl shadow-indigo-100 relative overflow-hidden transition-all duration-500 ${isLEDMode ? 'max-w-none w-screen h-screen border-none rounded-none shadow-none bg-black scale-100' : ''}`}>
        {/* Glow Background */}
        {!isLEDMode && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.2)_0%,transparent_70%)]" />}
        
        <div className={`font-sans font-black tracking-tighter leading-none mb-2 z-10 transition-all duration-500 tabular-nums ${isLEDMode ? 'text-9xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-7xl text-indigo-600'}`}>
          {pomodoroTime > 0 || pomodoroMode === 'stopwatch' ? formatTime(pomodoroMode === 'pomo' ? pomodoroTime : stopwatchTime) : "DONE"}
        </div>
        {!isLEDMode && (
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 z-10 items-center flex gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
            {pomodoroMode === 'pomo' ? 'Focus Session' : 'Tracking Time'}
          </div>
        )}
      </div>

      {!isLEDMode && (
        <>
          <div className="flex space-x-4">
            <button 
              onClick={() => setIsActive(!isActive)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
              id="play-pause-timer"
            >
              {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {isActive ? 'Pause' : 'Start'}
            </button>
            <button 
              onClick={() => {
                setIsActive(false);
                setPomodoroTime(25 * 60);
                setStopwatchTime(0);
              }}
              className="p-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-colors"
              id="reset-timer"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={toggleLEDMode}
              className="p-4 bg-slate-100 text-indigo-500 rounded-2xl active:scale-95 transition-colors"
              id="led-mode-btn"
            >
              <Zap size={18} fill="currentColor" />
            </button>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-[240px]">
            <button 
              onClick={() => { setPomodoroMode('pomo'); setIsActive(false); }}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pomodoroMode === 'pomo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              Pomo
            </button>
            <button 
              onClick={() => { setPomodoroMode('stopwatch'); setIsActive(false); }}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pomodoroMode === 'stopwatch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              Watch
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderHabits = () => (
    <div className="flex flex-col p-6 space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <Heart className="absolute -right-8 -bottom-8 opacity-10" size={160} />
        <h2 className="text-xs font-bold mb-1 opacity-80 uppercase tracking-widest">Habit Completion</h2>
        <div className="flex justify-between items-end mb-4">
          <div className="text-5xl font-black tracking-tighter">{fatimaPercentage}%</div>
          <p className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold tracking-widest uppercase mb-1">Daily Goal</p>
        </div>
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${fatimaPercentage}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Routine</span>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{completedHabitsCount}/{habits.length}</span>
        </div>
        {habits.map(habit => (
          <button 
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border-2 ${habit.completed ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-50 shadow-sm active:border-indigo-200'}`}
          >
            <span className={`font-bold text-sm tracking-tight ${habit.completed ? 'text-indigo-400 line-through' : 'text-slate-700'}`}>
              {habit.name}
            </span>
            <div className={`p-1.5 rounded-xl transition-all ${habit.completed ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-200'}`}>
              {habit.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTyping = () => (
    <div className="flex flex-col p-6 space-y-6">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white flex justify-between items-center shadow-xl shadow-indigo-100">
        <div>
          <h3 className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1 text-indigo-100">Time Remaining</h3>
          <div className="text-4xl font-black tabular-nums">{formatTime(typingTimer)}</div>
        </div>
        <button 
          onClick={() => setTypingActive(!typingActive)}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${typingActive ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-indigo-600 shadow-lg active:scale-95'}`}
        >
          {typingActive ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 min-h-[120px] relative overflow-hidden shadow-inner">
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
          Deep Practice
        </div>
        <p className="text-slate-400 font-mono text-xs leading-[2] select-none break-words">
          {typingText.split('').map((char, index) => {
            let color = "text-slate-300";
            let decoration = "";
            if (index < userInput.length) {
              if (userInput[index] === char) {
                color = "text-slate-900 font-bold";
              } else {
                color = "text-rose-500 bg-rose-50";
              }
            } else if (index === userInput.length && typingActive) {
              decoration = "border-b-2 border-indigo-500 animate-pulse";
            }
            return <span key={index} className={`${color} ${decoration}`}>{char}</span>;
          })}
        </p>
      </div>

      <textarea 
        disabled={!typingActive}
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="w-full h-40 p-6 rounded-3xl bg-white border-2 border-slate-100 text-slate-900 placeholder:text-slate-300 resize-none focus:border-indigo-200 focus:outline-none font-mono text-sm transition-all disabled:opacity-50 shadow-sm"
        placeholder={typingActive ? "Type carefully..." : "Hit start to begin..."}
      />
      
      <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest py-4 border-2 border-slate-50 rounded-full bg-slate-50/50">
        <span className="opacity-70">Focus Training Session Active</span>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-50 border border-indigo-50">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <ClipboardList size={22} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasks Done</div>
          <div className="text-3xl font-black text-slate-900">12</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-orange-50 border border-orange-50">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
            <Flame size={22} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Streak</div>
          <div className="text-3xl font-black text-orange-600">5 Days</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border-2 border-slate-50 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
          <BarChart3 className="text-indigo-400" size={16} />
          Weekly Consistency
        </h3>
        <div className="h-48 flex items-end justify-between space-x-3 px-2">
          {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
                className={`w-full rounded-t-xl shadow-lg ${h > 75 ? 'bg-indigo-600' : 'bg-slate-100'}`}
              />
              <span className="text-[8px] font-bold text-slate-400 mt-4 uppercase">{"MTWTFSS"[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Course Progress</h3>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] w-3/4" />
             </div>
          </div>
          <span className="text-2xl font-black text-indigo-400">75%</span>
        </div>
      </div>
    </div>
  );

  const renderRoutine = () => (
    <div className="p-6 space-y-6">
      <div className="bg-indigo-50/50 p-8 rounded-3xl border-2 border-indigo-50">
        <h2 className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Rise & Grind (AM)</h2>
        <div className="space-y-6">
          {['06:00 - Morning Prayer', '06:30 - Quick Workout', '07:30 - Brain Food (Breakfast)', '09:00 - Deep Focus Session'].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-5 group">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.4)] group-hover:scale-125 transition-transform" />
              <span className="text-sm font-bold text-slate-700 tracking-tight">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <h2 className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Wind Down (PM)</h2>
         <div className="space-y-6">
          {['21:00 - Digital Curfew', '22:15 - Reading Mode', '23:00 - Recharge (Sleep)'].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="text-sm font-bold text-slate-300 tracking-tight">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex justify-center items-start md:items-center p-0 md:p-6 font-sans">
      <div className="w-full max-w-sm h-screen md:h-[844px] bg-white md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative md:border-[8px] md:border-slate-100">
        
        {/* Notch - Visual only for feeling */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-100 rounded-b-2xl z-50" />

        {/* Header */}
        <header className="px-8 pt-10 pb-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
               <Zap size={20} fill="white" className="text-white" />
             </div>
             <div>
               <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center leading-none">
                 ROUTINE
                 <span className="text-indigo-600 ml-1">TRACKER</span>
               </h1>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Focus Mode</span>
               </div>
             </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-100"
          >
            <Heart size={20} fill="currentColor" />
          </motion.div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-28 pt-2">
          <div className="px-8 py-4">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{activeTab}</h2>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === 'Tasks' && renderTasks()}
              {activeTab === 'Habits' && renderHabits()}
              {activeTab === 'Routine' && renderRoutine()}
              {activeTab === 'Typing' && renderTyping()}
              {activeTab === 'Stats' && renderStats()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar */}
        <nav className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center py-5 px-4 pb-8 md:pb-10">
          {(['Tasks', 'Habits', 'Routine', 'Typing', 'Stats'] as Tab[]).map((tab) => {
            const Icon = {
              Tasks: Timer,
              Habits: ClipboardList,
              Routine: Flame,
              Typing: Keyboard,
              Stats: BarChart3
            }[tab];

            const isActiveTab = activeTab === tab;

            return (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); vibrate(); }}
                className={`flex flex-col items-center space-y-1.5 transition-all relative ${isActiveTab ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <div className={`p-2 transition-all rounded-xl ${isActiveTab ? 'bg-indigo-50 shadow-sm' : ''}`}>
                  <Icon size={22} strokeWidth={isActiveTab ? 3 : 2} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isActiveTab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} transition-all`}>
                  {tab}
                </span>
                {isActiveTab && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute -top-1 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
