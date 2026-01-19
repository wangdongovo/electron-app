import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Gift, Coffee, Bell, ArrowRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 模拟最近节假日数据 (2025-2026)
const HOLIDAYS = [
  { name: '春节', date: '2026-02-17', type: 'holiday' },
  { name: '清明节', date: '2026-04-05', type: 'holiday' },
  { name: '劳动节', date: '2026-05-01', type: 'holiday' },
  { name: '端午节', date: '2026-06-19', type: 'holiday' },
  { name: '中秋节', date: '2026-09-25', type: 'holiday' },
  { name: '国庆节', date: '2026-10-01', type: 'holiday' },
];

const DateManager: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 16); // 约 60fps 的刷新频率，满足毫秒显示
    return () => clearInterval(timer);
  }, []);

  // 下班时间设置 (默认 18:00)
  const offWorkTime = useMemo(() => {
    const time = new Date(now);
    time.setHours(18, 0, 0, 0);
    // 如果当前已经过了 18:00，显示明天的下班时间 (虽然逻辑上可以显示负数或文案)
    if (now.getTime() > time.getTime()) {
      time.setDate(time.getDate() + 1);
    }
    return time;
  }, [now.toDateString()]); // 仅在日期变更时重新计算基准

  // 发薪日设置 (默认每月 10 号)
  const payday = useMemo(() => {
    const date = new Date(now.getFullYear(), now.getMonth(), 10, 0, 0, 0);
    if (now.getDate() > 10) {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }, [now.getMonth(), now.getDate()]);

  const timeLeft = offWorkTime.getTime() - now.getTime();
  const paydayLeft = payday.getTime() - now.getTime();

  const formatCountdown = (ms: number) => {
    if (ms < 0) return "已下班";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    const milliseconds = ms % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const getDayName = (date: Date) => {
    return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()];
  };

  const nextHoliday = HOLIDAYS.find(h => new Date(h.date) > now) || HOLIDAYS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* 顶部时间卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
          <div className="flex items-center gap-2 mb-4 opacity-80">
            <Clock size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">当前时间</span>
          </div>
          <div className="text-5xl font-bold mb-2 tabular-nums">
            {now.toLocaleTimeString('zh-CN', { hour12: false })}
          </div>
          <div className="flex items-center gap-3 text-lg opacity-90">
            <span>{now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="w-1 h-1 bg-white rounded-full opacity-50" />
            <span className="font-medium text-indigo-100">{getDayName(now)}</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-zinc-400">
            <Coffee size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">下班倒计时</span>
          </div>
          <div className="text-5xl font-bold text-zinc-900 tabular-nums">
            {timeLeft > 0 ? formatCountdown(timeLeft) : <span className="text-emerald-500">🎉 已下班</span>}
          </div>
          <p className="mt-2 text-zinc-500 text-sm">
            休息是为了更好的出发
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 发薪日 */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Gift size={24} />
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">薪资预告</span>
          </div>
          <h3 className="text-zinc-500 text-sm font-medium mb-1">距离发薪日 (每月的 10 号)</h3>
          <div className="text-3xl font-bold text-zinc-900">
            {Math.ceil(paydayLeft / (1000 * 60 * 60 * 24))} <span className="text-lg">天</span>
          </div>
        </div>

        {/* 最近节日 */}
        <div className="md:col-span-2 bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-lg">节假日安排</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HOLIDAYS.slice(0, 4).map((holiday) => (
              <div key={holiday.name} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 px-5">
                <div>
                  <div className="font-bold text-zinc-900">{holiday.name}</div>
                  <div className="text-xs text-zinc-400">{holiday.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-600">
                    {Math.ceil((new Date(holiday.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} 天后
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateManager;
