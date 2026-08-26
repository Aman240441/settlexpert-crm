import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

export interface CalendarDateFilterProps {
  selectedDate: string; // 'YYYY-MM-DD' or '' for all
  onDateChange: (dateStr: string) => void;
  fromDate?: string;
  toDate?: string;
  onRangeChange?: (from: string, to: string) => void;
  showAllOption?: boolean;
}

// Get today in YYYY-MM-DD (Asia/Kolkata timezone safe)
export const getTodayStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD to '03 Aug 2026'
export const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return 'All Dates';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const CalendarDateFilter: React.FC<CalendarDateFilterProps> = ({
  selectedDate,
  onDateChange,
  fromDate,
  toDate,
  onRangeChange,
  showAllOption = true
}) => {
  const todayStr = getTodayStr();
  const [isRangeActive, setIsRangeActive] = useState(false);

  const handlePrevDay = () => {
    setIsRangeActive(false);
    const curr = selectedDate ? new Date(selectedDate) : new Date();
    curr.setDate(curr.getDate() - 1);
    const prevStr = curr.toISOString().split('T')[0];
    onDateChange(prevStr);
    if (onRangeChange) onRangeChange('', '');
  };

  const handleNextDay = () => {
    setIsRangeActive(false);
    const curr = selectedDate ? new Date(selectedDate) : new Date();
    curr.setDate(curr.getDate() + 1);
    const nextStr = curr.toISOString().split('T')[0];
    onDateChange(nextStr);
    if (onRangeChange) onRangeChange('', '');
  };

  const handleToday = () => {
    setIsRangeActive(false);
    onDateChange(todayStr);
    if (onRangeChange) onRangeChange('', '');
  };

  const handleAllTime = () => {
    setIsRangeActive(false);
    onDateChange('');
    if (onRangeChange) onRangeChange('', '');
  };

  const handleDirectDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRangeActive(false);
    if (e.target.value) {
      onDateChange(e.target.value);
      if (onRangeChange) onRangeChange('', '');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-medium text-slate-700">
      {/* Previous Day Button */}
      <button
        type="button"
        onClick={handlePrevDay}
        title="Previous Day"
        className="p-1 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Date Display with Native Hidden Datepicker Trigger */}
      <div className="relative flex items-center">
        <label className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-800 tracking-tight">
            {isRangeActive && fromDate && toDate
              ? `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
              : formatDisplayDate(selectedDate)}
          </span>
          <input
            type="date"
            value={selectedDate || ''}
            onChange={handleDirectDatePick}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Choose specific date"
          />
        </label>
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        onClick={handleNextDay}
        title="Next Day"
        className="p-1 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Quick Jump Today */}
      <button
        type="button"
        onClick={handleToday}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
          selectedDate === todayStr && !isRangeActive
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        Today
      </button>

      {/* All Time Option (Optional) */}
      {showAllOption && (
        <button
          type="button"
          onClick={handleAllTime}
          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-semibold ${
            !selectedDate && !isRangeActive
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Time
        </button>
      )}

      {/* Custom Range Inputs if onRangeChange provided */}
      {onRangeChange && (
        <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
          <span className="text-[11px] text-slate-400 font-normal">Range:</span>
          <input
            type="date"
            value={fromDate || ''}
            onChange={(e) => {
              setIsRangeActive(true);
              onDateChange('');
              onRangeChange(e.target.value, toDate || '');
            }}
            className="px-1.5 py-0.5 text-[11px] rounded border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 focus:outline-hidden"
            title="From Date"
          />
          <span className="text-slate-400 text-[10px]">to</span>
          <input
            type="date"
            value={toDate || ''}
            onChange={(e) => {
              setIsRangeActive(true);
              onDateChange('');
              onRangeChange(fromDate || '', e.target.value);
            }}
            className="px-1.5 py-0.5 text-[11px] rounded border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 focus:outline-hidden"
            title="To Date"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setIsRangeActive(false);
                onRangeChange('', '');
                onDateChange(todayStr);
              }}
              title="Reset range to Today"
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
