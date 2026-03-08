/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  ChevronRight, 
  Clock, 
  Droplets, 
  Pill, 
  Utensils, 
  Settings,
  Plus,
  ArrowLeft,
  Save,
  History,
  CheckCircle2,
  X,
  Calendar,
  LineChart as LineChartIcon,
  User,
  Trash2,
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// --- Types ---
type Screen = 'home' | 'record' | 'history' | 'graph' | 'settings';
type TimingCategory = '공복' | '식전' | '식후' | '취침 전' | '약 복용';

interface HealthRecord {
  id: string;
  type: 'bloodSugar' | 'medication';
  timestamp: number;
  dateString: string;
  timeString: string;
  bloodSugar?: number;
  medicationName?: string;
  taken?: boolean;
  meal?: string;
  notes?: string;
  category: TimingCategory;
}

interface AlarmSetting {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

// --- Constants ---
const STORAGE_KEYS = {
  NAME: 'bp_care_name',
  RECORDS: 'bp_care_records',
  ALARMS: 'bp_care_alarms',
  SOUND_ENABLED: 'bp_care_sound_enabled',
  SELECTED_SOUND: 'bp_care_selected_sound',
};

const ALARM_SOUNDS = [
  { id: 'beep', label: '기본 비프음', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
  { id: 'chime', label: '차임벨', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
  { id: 'digital', label: '디지털 알람', url: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3' },
];

const INITIAL_ALARMS: AlarmSetting[] = [
  { id: 'morning_pill', label: '아침 약 복용', time: '08:00', enabled: true },
  { id: 'lunch_pill', label: '점심 약 복용', time: '13:00', enabled: true },
  { id: 'dinner_pill', label: '저녁 약 복용', time: '19:00', enabled: true },
  { id: 'sugar_check', label: '혈당 검사', time: '11:30', enabled: false },
];

// --- Components ---

const Header = ({ title, showBack, onBack }: { title: string, showBack?: boolean, onBack?: () => void }) => (
  <header className="bg-white px-6 pt-12 pb-6 rounded-b-[32px] shadow-sm flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-4">
      {showBack && (
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
    </div>
  </header>
);

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div {...props} className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

// --- Views ---

const HomeView = ({ 
  name, 
  onNavigate, 
  records 
}: { 
  name: string, 
  onNavigate: (s: Screen) => void, 
  records: HealthRecord[] 
}) => {
  const [today, setToday] = useState('');
  
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const day = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
      setToday(`${year}년 ${month}월 ${date}일 ${day}요일`);
    };
    
    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();
  const todayRecords = records.filter(r => r.dateString === todayStr && r.type === 'bloodSugar');
  const bloodSugarRecords = records.filter(r => r.type === 'bloodSugar');
  const latestSugar = bloodSugarRecords.length > 0 ? bloodSugarRecords[0].bloodSugar : null;

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="mb-2">
        <p className="text-slate-400 text-sm font-medium mb-1">{today}</p>
        <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
          {name.trim() ? `${name.trim()}님,` : '안녕하세요,'} <br />
          오늘도 건강을 관리해볼까요?
        </h2>
        <p className="text-blue-600 text-sm font-bold mt-2 flex items-center gap-1">
          <CheckCircle2 size={14} /> 오늘의 건강 루틴
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center text-center p-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-2">
            <Droplets size={24} />
          </div>
          <p className="text-slate-400 text-xs font-medium">최근 혈당</p>
          <p className="text-xl font-black text-slate-900">
  {latestSugar !== null && latestSugar !== undefined ? `${latestSugar}` : '--'}
</p>
          <p className="text-[10px] text-slate-400">mg/dL</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-2">
            <Utensils size={24} />
          </div>
          <p className="text-slate-400 text-xs font-medium">오늘 기록</p>
          <p className="text-xl font-black text-slate-900">{todayRecords.length}</p>
          <p className="text-[10px] text-slate-400">건 완료</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">오늘의 체크리스트</h3>
        <Card className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Pill size={24} />
            </div>
            <div>
              <p className="text-slate-900 font-bold">약 복용 확인</p>
              <p className="text-slate-400 text-xs">아침/점심/저녁</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </Card>
        
        <Card className="flex items-center justify-between py-4" onClick={() => onNavigate('record')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-slate-900 font-bold">혈당 측정하기</p>
              <p className="text-slate-400 text-xs">기록을 남겨보세요</p>
            </div>
          </div>
          <Plus size={20} className="text-blue-600" />
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-100 flex items-start gap-3">
        <Smartphone className="text-blue-600 shrink-0" size={20} />
        <div>
          <p className="text-blue-900 font-bold text-sm">앱으로 설치하기</p>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
            브라우저 메뉴에서 '홈 화면에 추가'를 누르면 앱처럼 편리하게 사용할 수 있습니다.
          </p>
        </div>
      </Card>
    </div>
  );
};

const RecordInputView = ({ onSave }: { onSave: (r: Partial<HealthRecord>) => void }) => {
  const [bloodSugar, setBloodSugar] = useState('');
  const [meal, setMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<TimingCategory>('공복');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));

  const handleSave = () => {
    const sugarValue = parseInt(bloodSugar);
    if (!bloodSugar || isNaN(sugarValue) || sugarValue <= 0) {
      alert('올바른 혈당 수치(양수)를 입력해주세요.');
      return;
    }
    
    const timestamp = new Date(`${date}T${time}`).getTime();
    
    onSave({
      type: 'bloodSugar',
      bloodSugar: sugarValue,
      meal: meal.trim(),
      notes: notes.trim(),
      category,
      timestamp,
      dateString: date,
      timeString: time
    });
  };

  const categories: TimingCategory[] = ['공복', '식전', '식후', '취침 전'];

  return (
    <div className="px-6 py-6 space-y-6">
      <Card className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">측정 시점</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-3 rounded-2xl font-bold text-sm transition-all border ${
                  category === cat 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' 
                    : 'bg-slate-50 text-slate-500 border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">혈당 수치 (mg/dL)</label>
          <input 
            type="number" 
            inputMode="numeric"
            placeholder="수치를 입력하세요"
            value={bloodSugar}
            onChange={(e) => setBloodSugar(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">날짜</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">시간</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">식사 내용 (선택)</label>
          <input 
            type="text"
            placeholder="예: 현미밥, 된장찌개"
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">메모 (선택)</label>
          <textarea 
            placeholder="컨디션이나 특이사항을 적어주세요"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
        </div>
      </Card>

      <button 
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-5 rounded-3xl font-bold text-xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
      >
        <Save size={24} /> 기록 저장하기
      </button>
    </div>
  );
};

const AlarmModal = ({ 
  alarm, 
  onDismiss 
}: { 
  alarm: AlarmSetting, 
  onDismiss: (taken: boolean) => void 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center space-y-8"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-bounce">
            <Bell size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{alarm.label}</h2>
            <p className="text-slate-400 font-bold">알람이 울리고 있습니다</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-700">약 복용을 완료하셨나요?</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onDismiss(true)}
              className="bg-emerald-500 text-white py-4 rounded-3xl font-bold text-lg shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
            >
              네, 먹었어요
            </button>
            <button 
              onClick={() => onDismiss(false)}
              className="bg-slate-100 text-slate-600 py-4 rounded-3xl font-bold text-lg active:scale-95 transition-transform"
            >
              아니요
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HistoryView = ({ records, onDelete }: { records: HealthRecord[], onDelete: (id: string) => void }) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <History size={48} />
        </div>
        <h3 className="text-slate-900 font-bold text-xl mb-2">아직 기록이 없어요</h3>
        <p className="text-slate-400">건강 수치를 기록하고 변화를 확인해보세요.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-4">
      {records.map((record) => (
        <Card key={record.id} className="relative group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                record.type === 'bloodSugar' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {record.category}
              </span>
              <span className="text-xs font-bold text-slate-400">{record.dateString} {record.timeString}</span>
            </div>
            <button 
              onClick={() => {
                if(confirm('이 기록을 삭제하시겠습니까?')) onDelete(record.id);
              }}
              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {record.type === 'bloodSugar' ? (
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl font-black text-slate-900 tracking-tight">{record.bloodSugar}</p>
              <p className="text-sm font-bold text-slate-400 uppercase">mg/dL</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${record.taken ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {record.taken ? <CheckCircle2 size={24} /> : <X size={24} />}
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{record.medicationName}</p>
                <p className={`text-xs font-bold ${record.taken ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {record.taken ? '복용 완료' : '복용 안 함'}
                </p>
              </div>
            </div>
          )}
          
          {(record.meal || record.notes) && (
            <div className="space-y-2 pt-3 border-t border-slate-50">
              {record.meal && (
                <div className="flex items-start gap-2">
                  <Utensils size={14} className="text-slate-300 mt-0.5" />
                  <p className="text-slate-600 text-sm font-medium">{record.meal}</p>
                </div>
              )}
              {record.notes && (
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-slate-300 mt-0.5" />
                  <p className="text-slate-500 text-sm italic">{record.notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

const GraphView = ({ records }: { records: HealthRecord[] }) => {
  const [filter, setFilter] = useState<'7' | '30' | 'all'>('7');

  const filteredData = useMemo(() => {
    const now = Date.now();
    const days = filter === '7' ? 7 : filter === '30' ? 30 : 9999;
    const limit = now - (days * 24 * 60 * 60 * 1000);
    
    return records
      .filter(r => r.type === 'bloodSugar' && r.timestamp >= limit)
      .reverse() // Chronological for graph
      .map(r => ({
        name: r.dateString.slice(5), // MM-DD
        value: r.bloodSugar || 0,
        fullDate: `${r.dateString} ${r.timeString}`
      }));
  }, [records, filter]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return { latest: null, avg: 0 };
    const latest = filteredData[filteredData.length - 1].value;
    const avg = Math.round(filteredData.reduce((acc, curr) => acc + curr.value, 0) / filteredData.length);
    return { latest, avg };
  }, [filteredData]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
          <LineChartIcon size={48} />
        </div>
        <h3 className="text-slate-900 font-bold text-xl mb-2">그래프 데이터가 없어요</h3>
        <p className="text-slate-400">기록을 남기면 혈당 변화를 그래프로 보여드려요.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex gap-2">
        {(['7', '30', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
            {f === 'all' ? '전체' : `최근 ${f}일`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">최근 측정</p>
          <p className="text-2xl font-black text-slate-900">
  {stats.latest !== null ? stats.latest : '--'}
</p>
          <p className="text-[10px] text-slate-400">mg/dL</p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">평균 혈당</p>
          <p className="text-2xl font-black text-blue-600">
  {filteredData.length > 0 ? stats.avg : '--'}
</p>
          <p className="text-[10px] text-slate-400">mg/dL</p>
        </Card>
      </div>

      <Card className="p-4 h-[350px]">
        <h3 className="text-sm font-bold text-slate-700 mb-6">혈당 변화 추이</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 20', 'dataMax + 20']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: '정상', position: 'right', fill: '#10b981', fontSize: 10 }} />
            <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '주의', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

const SettingsView = ({ 
  name, 
  onNameChange, 
  onResetName,
  alarms, 
  onToggleAlarm, 
  onAlarmTimeChange,
  isStandalone,
  isSwRegistered,
  soundEnabled,
  onToggleSound,
  selectedSound,
  onSelectSound,
  notifPermission,
  onRequestPermission,
  statusMessage,
  setStatusMessage,
  sendTestNotification
}: { 
  name: string, 
  onNameChange: (n: string) => void,
  onResetName: () => void,
  alarms: AlarmSetting[], 
  onToggleAlarm: (id: string) => void,
  onAlarmTimeChange: (id: string, time: string) => void,
  isStandalone: boolean,
  isSwRegistered: boolean,
  soundEnabled: boolean,
  onToggleSound: () => void,
  selectedSound: string,
  onSelectSound: (id: string) => void,
  notifPermission: NotificationPermission,
  onRequestPermission: () => void,
  statusMessage: string,
  setStatusMessage: (m: string) => void,
  sendTestNotification: () => void
}) => {
  const [tempName, setTempName] = useState(name);

  const playPreview = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(e => console.error('Audio play failed:', e));
  };

  return (
    <div className="px-6 py-6 space-y-8 pb-20">
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <User size={20} className="text-blue-600" /> 사용자 정보
        </h3>
        <Card className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">사용자 이름</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                onClick={() => onNameChange(tempName)}
                className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold"
              >
                저장
              </button>
            </div>
          </div>
          {name && (
            <button 
              onClick={() => {
                if(confirm('이름 정보를 초기화하시겠습니까?')) {
                  onResetName();
                  setTempName('');
                }
              }}
              className="text-rose-500 text-xs font-bold flex items-center gap-1"
            >
              <Trash2 size={14} /> 이름 초기화
            </button>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Bell size={20} className="text-blue-600" /> 알림 및 앱 상태
        </h3>
        <Card className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">앱 실행 모드</p>
                <p className="text-xs font-bold text-slate-700">
                  {isStandalone ? '📱 앱처럼 실행 중' : '🌐 브라우저 모드'}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">서비스 워커</p>
                <p className="text-xs font-bold text-slate-700">
                  {isSwRegistered ? '✅ 등록됨' : '❌ 미등록'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-bold">알림 권한 상태</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    notifPermission === 'granted' ? 'bg-emerald-500' : 
                    notifPermission === 'denied' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <p className="text-xs font-bold text-slate-600">
                    {notifPermission === 'granted' ? '승인됨' : 
                     notifPermission === 'denied' ? '거부됨' : '대기중'}
                    <span className="ml-1 opacity-40 font-normal">({notifPermission})</span>
                  </p>
                </div>
              </div>
              {notifPermission === 'default' && (
                <button 
                  onClick={onRequestPermission}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-100 active:scale-95 transition-transform"
                >
                  권한 요청
                </button>
              )}
              {notifPermission === 'denied' && (
                <button 
                  onClick={() => setStatusMessage('브라우저 설정에서 알림 권한을 직접 허용해야 합니다. 아래 안내를 확인해주세요.')}
                  className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-100 active:scale-95 transition-transform"
                >
                  설정 확인
                </button>
              )}
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-700' : 
                notifPermission === 'denied' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {statusMessage}
              </div>
            )}

            {notifPermission === 'denied' && (
              <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-4">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertCircle size={18} />
                  <p className="text-sm font-bold">알림 권한이 거부되어 있습니다</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-700 mb-2">1단계: 브라우저 설정 변경</p>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>주소창 왼쪽의 <strong>자물쇠</strong> 아이콘을 누르세요.</li>
                      <li><strong>'권한'</strong> 또는 <strong>'사이트 설정'</strong>을 누르세요.</li>
                      <li><strong>'알림'</strong> 스위치를 <strong>허용</strong>으로 켜주세요.</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-700 mb-2">2단계: 갤럭시 시스템 설정 확인</p>
                    <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>휴대폰 <strong>설정 &gt; 애플리케이션</strong>으로 이동하세요.</li>
                      <li>사용 중인 <strong>브라우저(크롬, 삼성 인터넷 등)</strong>를 찾으세요.</li>
                      <li><strong>'알림'</strong> 메뉴에서 <strong>'알림 허용'</strong>이 켜져 있는지 확인하세요.</li>
                    </ul>
                  </div>
                </div>

                <p className="text-[10px] text-rose-400 text-center italic">
                  설정을 변경한 후 앱으로 돌아오면 자동으로 상태가 업데이트됩니다.
                </p>
              </div>
            )}

            <button 
              onClick={sendTestNotification}
              disabled={notifPermission !== 'granted'}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                notifPermission === 'granted' 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              테스트 알림 보내기
            </button>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase">알람 소리 설정</h4>
              <button 
                onClick={onToggleSound}
                className={`w-10 h-5 rounded-full transition-all relative ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${soundEnabled ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {soundEnabled && (
              <div className="grid grid-cols-1 gap-2 mb-4">
                {ALARM_SOUNDS.map(sound => (
                  <button
                    key={sound.id}
                    onClick={() => {
                      onSelectSound(sound.id);
                      playPreview(sound.url);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold border transition-all ${
                      selectedSound === sound.id 
                        ? 'bg-blue-50 border-blue-200 text-blue-600' 
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}
                  >
                    <span>{sound.label}</span>
                    {selectedSound === sound.id && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
            )}

            <h4 className="text-xs font-bold text-slate-400 uppercase mt-4 mb-2">시간 설정</h4>
            {alarms.map(alarm => (
              <div key={alarm.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${alarm.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{alarm.label}</p>
                    <input 
                      type="time" 
                      value={alarm.time}
                      onChange={(e) => onAlarmTimeChange(alarm.id, e.target.value)}
                      className="text-xs text-slate-400 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => onToggleAlarm(alarm.id)}
                  className={`w-12 h-6 rounded-full transition-all relative ${alarm.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${alarm.enabled ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
          <AlertCircle className="text-amber-600 shrink-0" size={18} />
          <p className="text-amber-800 text-[11px] leading-relaxed">
            브라우저 환경의 제약으로 인해 앱이 완전히 종료된 상태에서는 정확한 시간에 알림이 오지 않을 수 있습니다. 
            정확한 알림을 위해서는 앱을 백그라운드에 띄워두시는 것을 권장합니다.
          </p>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

let swRegistration: ServiceWorkerRegistration | null = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('[Debug] Registering Service Worker...');
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[Debug] ServiceWorker registration successful with scope: ', registration.scope);
        swRegistration = registration;
        
        // Check for existing notifications or state
        registration.getNotifications().then(notifications => {
          console.log('[Debug] Current active notifications from SW:', notifications.length);
        });
      })
      .catch(err => {
        console.error('[Debug] ServiceWorker registration failed: ', err);
      });
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[Debug] Message received from Service Worker:', event.data);
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [name, setName] = useState('');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [alarms, setAlarms] = useState<AlarmSetting[]>(INITIAL_ALARMS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('beep');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSwRegistered, setIsSwRegistered] = useState(false);
  const [lastAlarmTime, setLastAlarmTime] = useState<string | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<AlarmSetting | null>(null);
  const [alarmAudio, setAlarmAudio] = useState<HTMLAudioElement | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Permission Tracking
  useEffect(() => {
    const updatePermission = () => {
      if ('Notification' in window) {
        const current = Notification.permission;
        setNotifPermission(current);
        console.log('[Debug] Permission updated:', current);
      }
    };

    // 1. Listen for focus/visibility changes
    window.addEventListener('focus', updatePermission);
    window.addEventListener('visibilitychange', updatePermission);

    // 2. Use Permissions API if available for real-time tracking
    let permissionStatus: PermissionStatus | null = null;
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(status => {
          permissionStatus = status;
          status.onchange = () => {
            console.log('[Debug] Permissions API status change:', status.state);
            // Permissions API uses 'prompt', 'granted', 'denied'
            // Notification API uses 'default', 'granted', 'denied'
            updatePermission();
          };
        })
        .catch(e => console.warn('[Debug] Permissions API not supported for notifications:', e));
    }

    return () => {
      window.removeEventListener('focus', updatePermission);
      window.removeEventListener('visibilitychange', updatePermission);
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const requestPermission = async () => {
    console.log('[Debug] requestPermission called. Current state:', {
      permission: Notification.permission,
      isSecureContext: window.isSecureContext,
      hasServiceWorker: 'serviceWorker' in navigator
    });

    if (!('Notification' in window)) {
      console.error('[Debug] Notification API not supported in this browser.');
      setStatusMessage('이 브라우저는 알림 기능을 지원하지 않습니다.');
      return;
    }

    if (!window.isSecureContext) {
      console.error('[Debug] Not in a secure context.');
      setStatusMessage('알림은 HTTPS 또는 설치된 앱 환경에서만 사용할 수 있습니다.');
      return;
    }

    if (Notification.permission === 'denied') {
      console.warn('[Debug] Notification permission is already DENIED.');
      setStatusMessage('이미 알림이 차단되어 있습니다. 브라우저 사이트 설정에서 직접 허용으로 변경해주세요.');
      return;
    }

    try {
      console.log('[Debug] Triggering Notification.requestPermission()...');
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      console.log('[Debug] Notification.requestPermission() result:', permission);

      if (permission === 'granted') {
        setStatusMessage('알림 권한이 승인되었습니다! 이제 설정한 시간에 알림이 울립니다.');
      } else if (permission === 'denied') {
        setStatusMessage('알림 권한이 거부되었습니다. 아래 안내에 따라 설정에서 직접 허용해주세요.');
      }
    } catch (error) {
      console.error('[Debug] Error during Notification.requestPermission():', error);
      setStatusMessage('권한 요청 중 오류가 발생했습니다.');
    }
  };

  const sendTestNotification = async () => {
    if (notifPermission !== 'granted') {
      setStatusMessage('먼저 알림 권한을 승인해주세요.');
      return;
    }

    const title = '혈압 케어 테스트';
    const options = {
      body: '테스트 알림입니다. 정상적으로 작동하고 있습니다!',
      icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
      tag: 'test-notification',
      renotify: true
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(title, options);
          console.log('[Debug] Test notification sent via Service Worker.');
          setStatusMessage('테스트 알림을 보냈습니다.');
        } else {
          new Notification(title, options);
          console.log('[Debug] Test notification sent via Browser API (SW fallback).');
          setStatusMessage('테스트 알림을 보냈습니다 (브라우저 API).');
        }
      } else {
        new Notification(title, options);
        console.log('[Debug] Test notification sent via Browser API.');
        setStatusMessage('테스트 알림을 보냈습니다 (브라우저 API).');
      }
    } catch (error) {
      console.error('[Debug] Failed to send notification:', error);
      setStatusMessage('알림 전송에 실패했습니다.');
    }
  };

  // Alarm Scheduler
  useEffect(() => {
    const checkAlarms = async () => {
      const permission = Notification.permission;
      console.log('[Debug] Alarm Scheduler checking...', {
        permission,
        soundEnabled,
        activeAlarmsCount: alarms.filter(a => a.enabled).length
      });

      if (permission !== 'granted' && !soundEnabled) {
        return;
      }

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      // Avoid double triggering in the same minute
      if (currentTime === lastAlarmTime) {
        return;
      }

      const activeAlarms = alarms.filter(a => a.enabled && a.time === currentTime);
      
      if (activeAlarms.length > 0) {
        console.log('[Debug] Alarms triggered!', activeAlarms.map(a => a.label));
        setLastAlarmTime(currentTime);
        
        const firstAlarm = activeAlarms[0];
        setActiveAlarm(firstAlarm);
        
        // Play sound if enabled
        if (soundEnabled) {
          console.log('[Debug] Playing alarm sound:', selectedSound);
          const sound = ALARM_SOUNDS.find(s => s.id === selectedSound) || ALARM_SOUNDS[0];
          const audio = new Audio(sound.url);
          audio.loop = true;
          audio.play().catch(e => console.error('[Debug] Audio play failed:', e));
          setAlarmAudio(audio);
        }

        // Show notification if permitted
        if (permission === 'granted') {
          for (const alarm of activeAlarms) {
            const title = '혈압 케어 알림';
            const options = {
              body: `${alarm.label} 시간입니다!`,
              icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
              badge: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
              tag: alarm.id,
              renotify: true
            };

            console.log('[Debug] Showing notification for:', alarm.label);
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              if (registration.showNotification) {
                registration.showNotification(title, options);
              } else {
                new Notification(title, options);
              }
            } else {
              new Notification(title, options);
            }
          }
        } else {
          console.warn('[Debug] Notification skipped: Permission is', permission);
        }
      }
    };

    const interval = setInterval(checkAlarms, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [alarms, lastAlarmTime, notifPermission, soundEnabled, selectedSound]);

  // Detect standalone mode
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    console.log('Standalone mode detected:', standalone);
  }, []);

  // Check SW registration
  useEffect(() => {
    const checkRegistration = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          const registered = !!reg;
          setIsSwRegistered(registered);
          console.log('[Debug] Service Worker registration status:', registered);
        } catch (e) {
          console.error('[Debug] Error checking SW registration:', e);
          setIsSwRegistered(false);
        }
      }
    };

    checkRegistration();
    
    // Also check when controller changes
    navigator.serviceWorker.addEventListener('controllerchange', checkRegistration);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', checkRegistration);
  }, []);

  // Load data on mount
  useEffect(() => {
    const safeParse = (key: string, fallback: any) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
        return fallback;
      }
    };

    const savedName = localStorage.getItem(STORAGE_KEYS.NAME);
    const savedRecords = safeParse(STORAGE_KEYS.RECORDS, []);
    const savedAlarms = safeParse(STORAGE_KEYS.ALARMS, INITIAL_ALARMS);
    const savedSoundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    const savedSelectedSound = localStorage.getItem(STORAGE_KEYS.SELECTED_SOUND);

    if (savedName) setName(savedName);
    setRecords(savedRecords);
    setAlarms(savedAlarms);
    if (savedSoundEnabled !== null) setSoundEnabled(savedSoundEnabled === 'true');
    if (savedSelectedSound) setSelectedSound(savedSelectedSound);
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NAME, name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SOUND, selectedSound);
  }, [selectedSound]);

  const handleNameChange = (newName: string) => {
    const trimmed = newName.trim();
    setName(trimmed);
    if (trimmed) {
      setStatusMessage(`안녕하세요, ${trimmed}님! 이름이 저장되었습니다.`);
    } else {
      setStatusMessage('이름 정보가 초기화되었습니다.');
    }
  };

  const handleSaveRecord = (data: Partial<HealthRecord>) => {
    const newRecord: HealthRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type: data.type || 'bloodSugar',
      timestamp: data.timestamp || Date.now(),
      dateString: data.dateString || new Date().toISOString().split('T')[0],
      timeString: data.timeString || new Date().toTimeString().split(' ')[0].slice(0, 5),
      bloodSugar: data.bloodSugar,
      medicationName: data.medicationName,
      taken: data.taken,
      meal: data.meal || '',
      notes: data.notes || '',
      category: data.category || '공복'
    };
    setRecords([newRecord, ...records].sort((a, b) => b.timestamp - a.timestamp));
    setCurrentScreen('history');
  };

  const handleDismissAlarm = (taken: boolean) => {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      setAlarmAudio(null);
    }

    if (activeAlarm) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${date}`;
      const timeString = now.toTimeString().split(' ')[0].slice(0, 5);

      const medicationRecord: HealthRecord = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'medication',
        timestamp: Date.now(),
        dateString,
        timeString,
        medicationName: activeAlarm.label,
        taken,
        category: '약 복용'
      };

      setRecords([medicationRecord, ...records].sort((a, b) => b.timestamp - a.timestamp));
      setActiveAlarm(null);
      alert(taken ? '약 복용이 기록되었습니다.' : '약 복용 안 함으로 기록되었습니다.');
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleAlarmTimeChange = (id: string, time: string) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, time } : a));
  };

  const getTitle = () => {
    switch(currentScreen) {
      case 'home': return '혈압 케어';
      case 'record': return '기록 입력';
      case 'history': return '기록 히스토리';
      case 'graph': return '혈당 분석';
      case 'settings': return '설정';
      default: return '혈압 케어';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      <Header 
        title={getTitle()} 
        showBack={currentScreen !== 'home'} 
        onBack={() => setCurrentScreen('home')} 
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentScreen === 'home' && (
            <HomeView 
              name={name} 
              onNavigate={setCurrentScreen} 
              records={records} 
            />
          )}
          {currentScreen === 'record' && (
            <RecordInputView onSave={handleSaveRecord} />
          )}
          {currentScreen === 'history' && (
            <HistoryView records={records} onDelete={handleDeleteRecord} />
          )}
          {currentScreen === 'graph' && (
            <GraphView records={records} />
          )}
          {currentScreen === 'settings' && (
            <SettingsView 
              name={name} 
              onNameChange={handleNameChange} 
              onResetName={() => handleNameChange('')}
              alarms={alarms} 
              onToggleAlarm={handleToggleAlarm} 
              onAlarmTimeChange={handleAlarmTimeChange}
              isStandalone={isStandalone}
              isSwRegistered={isSwRegistered}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              selectedSound={selectedSound}
              onSelectSound={setSelectedSound}
              notifPermission={notifPermission}
              onRequestPermission={requestPermission}
              statusMessage={statusMessage}
              setStatusMessage={setStatusMessage}
              sendTestNotification={sendTestNotification}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {activeAlarm && (
        <AlarmModal 
          alarm={activeAlarm} 
          onDismiss={handleDismissAlarm} 
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-4 py-3 flex justify-between items-center z-50 max-w-md mx-auto">
        <NavButton 
          active={currentScreen === 'home'} 
          icon={<Calendar size={20} />} 
          label="홈" 
          onClick={() => setCurrentScreen('home')} 
        />
        <NavButton 
          active={currentScreen === 'record'} 
          icon={<Plus size={20} />} 
          label="기록" 
          onClick={() => setCurrentScreen('record')} 
        />
        <NavButton 
          active={currentScreen === 'history'} 
          icon={<History size={20} />} 
          label="내역" 
          onClick={() => setCurrentScreen('history')} 
        />
        <NavButton 
          active={currentScreen === 'graph'} 
          icon={<LineChartIcon size={20} />} 
          label="그래프" 
          onClick={() => setCurrentScreen('graph')} 
        />
        <NavButton 
          active={currentScreen === 'settings'} 
          icon={<Settings size={20} />} 
          label="설정" 
          onClick={() => setCurrentScreen('settings')} 
        />
      </nav>
    </div>
  );
}

const NavButton = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);
