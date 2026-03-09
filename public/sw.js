/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';

import {
  Bell,
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
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  setupMedicationNotifications,
  scheduleMedicationNotification,
  cancelAllMedicationNotifications,
} from './lib/medicationNotifications';

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
  type: 'medication' | 'measurement';
}

// --- Constants ---
const STORAGE_KEYS = {
  NAME: 'bp_care_name',
  RECORDS: 'bp_care_records',
  ALARMS: 'bp_care_alarms',
};

const INITIAL_ALARMS: AlarmSetting[] = [
  { id: 'morning_pill', label: '아침 약 복용', time: '08:00', enabled: true, type: 'medication' },
  { id: 'lunch_pill', label: '점심 약 복용', time: '13:00', enabled: true, type: 'medication' },
  { id: 'dinner_pill', label: '저녁 약 복용', time: '19:00', enabled: true, type: 'medication' },
  { id: 'sugar_check', label: '혈당 검사', time: '11:30', enabled: false, type: 'measurement' },
];

// --- Components ---

const Header = ({
  title,
  showBack,
  onBack,
}: {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}) => (
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

const Card = ({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div {...props} className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

// --- Views ---

const HomeView = ({
  name,
  onNavigate,
  records,
  onPrefillRecord,
}: {
  name: string;
  onNavigate: (s: Screen) => void;
  records: HealthRecord[];
  onPrefillRecord: (p: {
    type: 'bloodSugar' | 'medication';
    medicationName?: string;
    category?: TimingCategory;
  }) => void;
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
    const interval = setInterval(updateDate, 60000);
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
  const todayRecords = records.filter((r) => r.dateString === todayStr && r.type === 'bloodSugar');
  const bloodSugarRecords = records.filter((r) => r.type === 'bloodSugar');
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

        <Card
          className="flex items-center justify-between py-4"
          onClick={() => {
            onPrefillRecord({ type: 'medication' });
            onNavigate('record');
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Pill size={24} />
            </div>
            <div>
              <p className="text-slate-900 font-bold">약 복용 기록하기</p>
              <p className="text-slate-400 text-xs">복용 여부를 체크하세요</p>
            </div>
          </div>
          <Plus size={20} className="text-blue-600" />
        </Card>

        <Card
          className="flex items-center justify-between py-4"
          onClick={() => {
            onPrefillRecord({ type: 'bloodSugar', category: '공복' });
            onNavigate('record');
          }}
        >
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
          <p className="text-blue-900 font-bold text-sm">앱으로 설치하면 더 편리해요</p>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
            앱으로 설치하면 복약 알림을 더 안정적으로 받고, 알림에서 바로 복용 여부를 기록할 수 있습니다.
          </p>
        </div>
      </Card>
    </div>
  );
};

const RecordInputView = ({
  onSave,
  prefill,
}: {
  onSave: (r: Partial<HealthRecord>) => void;
  prefill?: { type: 'bloodSugar' | 'medication'; medicationName?: string; category?: TimingCategory };
}) => {
  const [type, setType] = useState<'bloodSugar' | 'medication'>(prefill?.type || 'bloodSugar');
  const [bloodSugar, setBloodSugar] = useState('');
  const [medicationName, setMedicationName] = useState(prefill?.medicationName || '');
  const [meal, setMeal] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<TimingCategory>(prefill?.category || '공복');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));

  const handleSave = () => {
    if (type === 'bloodSugar') {
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
        timeString: time,
      });
    } else {
      if (!medicationName.trim()) {
        alert('약 이름을 입력해주세요.');
        return;
      }

      const timestamp = new Date(`${date}T${time}`).getTime();

      onSave({
        type: 'medication',
        medicationName: medicationName.trim(),
        taken: true,
        notes: notes.trim(),
        category: '약 복용',
        timestamp,
        dateString: date,
        timeString: time,
      });
    }
  };

  const categories: TimingCategory[] = ['공복', '식전', '식후', '취침 전'];

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setType('bloodSugar')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            type === 'bloodSugar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          혈당 측정
        </button>
        <button
          onClick={() => setType('medication')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
            type === 'medication' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          약 복용
        </button>
      </div>

      <Card className="space-y-6">
        {type === 'bloodSugar' ? (
          <>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">측정 시점</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
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
          </>
        ) : (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">약 이름</label>
            <input
              type="text"
              placeholder="복용하신 약 이름을 입력하세요"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        )}

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

        {type === 'bloodSugar' && (
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
        )}

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

const HistoryView = ({
  records,
  onDelete,
}: {
  records: HealthRecord[];
  onDelete: (id: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                  record.type === 'bloodSugar' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                {record.category}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {record.dateString} {record.timeString}
              </span>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(record.id)}
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
              <div
                className={`p-2 rounded-xl ${
                  record.taken ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}
              >
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl text-center space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">기록 삭제</h3>
              <p className="text-sm text-slate-500">이 기록을 정말 삭제하시겠습니까?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-sm"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="bg-rose-500 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-100"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const GraphView = ({ records }: { records: HealthRecord[] }) => {
  const [filter, setFilter] = useState<'7' | '30' | 'all'>('7');

  const filteredData = useMemo(() => {
    const now = Date.now();
    const days = filter === '7' ? 7 : filter === '30' ? 30 : 9999;
    const limit = now - days * 24 * 60 * 60 * 1000;

    return records
      .filter((r) => r.type === 'bloodSugar' && r.timestamp >= limit)
      .reverse()
      .map((r) => ({
        name: r.dateString.slice(5),
        value: r.bloodSugar || 0,
        fullDate: `${r.dateString} ${r.timeString}`,
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
        {(['7', '30', 'all'] as const).map((f) => (
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
          <p className="text-2xl font-black text-slate-900">{stats.latest ?? '--'}</p>
          <p className="text-[10px] text-slate-400">mg/dL</p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">평균 혈당</p>
          <p className="text-2xl font-black text-blue-600">{filteredData.length > 0 ? stats.avg : '--'}</p>
          <p className="text-[10px] text-slate-400">mg/dL</p>
        </Card>
      </div>

      <Card className="p-4 h-[350px]">
        <h3 className="text-sm font-bold text-slate-700 mb-6">혈당 변화 추이</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
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
  statusMessage,
  onClearAllRecords,
  deferredPrompt,
  onInstall,
}: {
  name: string;
  onNameChange: (newName: string) => void;
  onResetName: () => void;
  alarms: AlarmSetting[];
  onToggleAlarm: (id: string) => void;
  onAlarmTimeChange: (id: string, time: string) => void;
  isStandalone: boolean;
  statusMessage: string;
  onClearAllRecords: () => void;
  deferredPrompt: any;
  onInstall: () => void;
}) => {
  const [tempName, setTempName] = useState(name);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
              <button onClick={() => onNameChange(tempName)} className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold">
                저장
              </button>
            </div>
          </div>
          {name && (
            <button
              onClick={() => {
                if (confirm('이름 정보를 초기화하시겠습니까?')) {
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
          <Bell size={20} className="text-blue-600" /> 알림 및 권한 설정
        </h3>

        <Card className="space-y-4">
          {!isStandalone && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Smartphone size={18} />
                <p className="text-sm font-bold">앱으로 설치하면 더 안정적입니다</p>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                정확한 시간에 복약 알림을 받으려면 앱으로 설치한 뒤 휴대폰 설정에서 알림 권한을 허용해주세요.
                이 앱은 직접 복약 알림을 보내며, 알림에서 복용 여부를 바로 기록할 수 있습니다.
              </p>
              {deferredPrompt && (
                <button
                  onClick={onInstall}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                >
                  앱으로 설치하기
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertCircle size={18} className="text-blue-600" />
                <p className="text-sm font-bold">알림 권한 설정 안내</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                정확한 시간에 알림을 받으려면 휴대폰 설정에서 알림 권한을 허용해야 합니다.
              </p>

              <div className="space-y-3 pt-2">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-800 mb-1.5">안드로이드 (갤럭시)</p>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                    <li><strong>설정 &gt; 애플리케이션</strong>으로 이동</li>
                    <li><strong>'혈압 케어'</strong> 앱 선택</li>
                    <li><strong>알림</strong> 메뉴에서 <strong>'알림 허용'</strong> 켜기</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-800 mb-1.5">아이폰 (iOS)</p>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                    <li><strong>설정 &gt; 알림</strong>으로 이동</li>
                    <li><strong>'혈압 케어'</strong> (홈 화면 추가된 앱) 선택</li>
                    <li><strong>알림 허용</strong> 스위치 켜기</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-3">
            <div className="flex items-center justify-between mt-4 mb-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase">시간 설정</h4>
              <p className="text-[10px] text-slate-400">설정한 시간에 앱이 직접 복약 알림을 보냅니다</p>
            </div>

            {alarms.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${alarm.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{alarm.label}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={alarm.time}
                        onChange={(e) => onAlarmTimeChange(alarm.id, e.target.value)}
                        className="text-xs text-slate-400 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                      />
                    </div>
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
            이 앱은 휴대폰 기본 시계 앱 대신 앱 자체 알림을 사용합니다.
            알림에서 <strong>'복용함'</strong> 또는 <strong>'10분 뒤 다시'</strong>를 눌러 복약 여부를 바로 기록할 수 있습니다.
          </p>
        </div>

        <section className="pt-8 border-t border-slate-100">
          <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600 mb-4">
            <Trash2 size={20} /> 데이터 관리
          </h3>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold text-sm border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            모든 건강 기록 삭제하기
          </button>
        </section>

        {showClearConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl text-center space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">전체 삭제 확인</h3>
                <p className="text-sm text-slate-500">지금까지 저장된 모든 기록이 영구적으로 삭제됩니다. 계속하시겠습니까?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-sm"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    onClearAllRecords();
                    setShowClearConfirm(false);
                  }}
                  className="bg-rose-500 text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-rose-100"
                >
                  전체 삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </section>
    </div>
  );
};

// --- Main App ---

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[Debug] ServiceWorker registration failed: ', err);
    });
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [name, setName] = useState('');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [alarms, setAlarms] = useState<AlarmSetting[]>(INITIAL_ALARMS);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [recordPrefill, setRecordPrefill] = useState<
    { type: 'bloodSugar' | 'medication'; medicationName?: string; category?: TimingCategory } | undefined
  >(undefined);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await setupMedicationNotifications();

        await LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
          const actionId = event.actionId;
          const notification = event.notification;
          const now = new Date();

          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const date = String(now.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${date}`;
          const timeString = now.toTimeString().split(' ')[0].slice(0, 5);

          if (actionId === 'TAKEN') {
            const medName = notification.title ?? '복약 알림';

            const medicationRecord: HealthRecord = {
              id: Math.random().toString(36).substr(2, 9),
              type: 'medication',
              timestamp: Date.now(),
              dateString,
              timeString,
              medicationName: medName,
              taken: true,
              category: '약 복용',
              notes: '알림에서 복용함 버튼 선택',
            };

            setRecords((prev) => [medicationRecord, ...prev].sort((a, b) => b.timestamp - a.timestamp));
            setStatusMessage(`${medName} 복용이 기록되었습니다.`);
          }

          if (actionId === 'SNOOZE_10') {
            const newTime = new Date(Date.now() + 10 * 60 * 1000);

            await scheduleMedicationNotification(
              Number(notification.id),
              notification.title ?? '복약 알림',
              notification.body ?? '약을 복용할 시간입니다.',
              newTime
            );

            setStatusMessage('10분 뒤 다시 알림이 예약되었습니다.');
          }
        });
      } catch (error) {
        console.error('알림 초기화 오류:', error);
      }
    };

    initNotifications();

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = setTimeout(() => {
      setStatusMessage('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('[Debug] beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[Debug] User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const syncDeviceNotifications = async () => {
      try {
        await cancelAllMedicationNotifications();

        const now = new Date();

        for (const alarm of alarms) {
          if (!alarm.enabled) continue;

          const [hour, minute] = alarm.time.split(':').map(Number);

          const target = new Date();
          target.setHours(hour, minute, 0, 0);

          if (target <= now) {
            target.setDate(target.getDate() + 1);
          }

          const body =
            alarm.type === 'measurement'
              ? `${alarm.label} 시간입니다. 알림을 확인하고 기록해주세요.`
              : `${alarm.label} 시간입니다. 알림에서 복용 여부를 눌러주세요.`;

          await scheduleMedicationNotification(
            Number(alarm.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)),
            alarm.label,
            body,
            target
          );
        }

        console.log('기기 알림 동기화 완료');
      } catch (error) {
        console.error('기기 알림 예약 오류:', error);
      }
    };

    syncDeviceNotifications();
  }, [alarms]);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    console.log('Standalone mode detected:', standalone);
  }, []);

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

    if (savedName) setName(savedName);
    setRecords(savedRecords);
    setAlarms(savedAlarms);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NAME, name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  }, [alarms]);

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
      category: data.category || '공복',
    };

    setRecords([newRecord, ...records].sort((a, b) => b.timestamp - a.timestamp));
    setCurrentScreen('history');
    setStatusMessage('기록이 저장되었습니다.');
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    setStatusMessage('모든 건강 기록이 삭제되었습니다.');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms(alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const handleAlarmTimeChange = (id: string, time: string) => {
    setAlarms(alarms.map((a) => (a.id === id ? { ...a, time } : a)));
  };

  const getTitle = () => {
    switch (currentScreen) {
      case 'home':
        return '혈압 케어';
      case 'record':
        return '기록 입력';
      case 'history':
        return '기록 히스토리';
      case 'graph':
        return '혈당 분석';
      case 'settings':
        return '설정';
      default:
        return '혈압 케어';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32 max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      <Header title={getTitle()} showBack={currentScreen !== 'home'} onBack={() => setCurrentScreen('home')} />

      {statusMessage && (
        <div className="mx-6 mt-4 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-3 rounded-2xl border border-blue-100 shadow-sm">
          {statusMessage}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentScreen === 'home' && (
            <HomeView name={name} onNavigate={setCurrentScreen} records={records} onPrefillRecord={setRecordPrefill} />
          )}

          {currentScreen === 'record' && (
            <RecordInputView
              onSave={(data) => {
                handleSaveRecord(data);
                setRecordPrefill(undefined);
              }}
              prefill={recordPrefill}
            />
          )}

          {currentScreen === 'history' && <HistoryView records={records} onDelete={handleDeleteRecord} />}

          {currentScreen === 'graph' && <GraphView records={records} />}

          {currentScreen === 'settings' && (
            <SettingsView
              name={name}
              onNameChange={handleNameChange}
              onResetName={() => handleNameChange('')}
              alarms={alarms}
              onToggleAlarm={handleToggleAlarm}
              onAlarmTimeChange={handleAlarmTimeChange}
              isStandalone={isStandalone}
              statusMessage={statusMessage}
              onClearAllRecords={handleClearAllRecords}
              deferredPrompt={deferredPrompt}
              onInstall={handleInstallClick}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <nav className="fixed bottom-10 left-4 right-4 bg-white/90 backdrop-blur-xl border border-slate-200/50 px-2 py-3 flex justify-between items-center z-50 max-w-md mx-auto rounded-[2rem] shadow-2xl shadow-blue-900/10">
        <NavButton active={currentScreen === 'home'} icon={<Calendar size={20} />} label="홈" onClick={() => setCurrentScreen('home')} />
        <NavButton active={currentScreen === 'record'} icon={<Plus size={20} />} label="기록" onClick={() => setCurrentScreen('record')} />
        <NavButton active={currentScreen === 'history'} icon={<History size={20} />} label="내역" onClick={() => setCurrentScreen('history')} />
        <NavButton active={currentScreen === 'graph'} icon={<LineChartIcon size={20} />} label="그래프" onClick={() => setCurrentScreen('graph')} />
        <NavButton active={currentScreen === 'settings'} icon={<Settings size={20} />} label="설정" onClick={() => setCurrentScreen('settings')} />
      </nav>
    </div>
  );
}

const NavButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-blue-50' : 'bg-transparent'}`}>{icon}</div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);