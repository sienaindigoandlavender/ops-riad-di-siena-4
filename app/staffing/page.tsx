"use client";

import { useState, useEffect } from "react";

interface DayInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  isWeekend: boolean;
  checkIns: number;
  checkOuts: number;
  rooms: number;
  guests: string[];
  status: 'day-off' | 'normal' | 'busy' | 'extra-help';
}

interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  days: DayInfo[];
  weekendClear: boolean;
  saturdayClear: boolean;
  sundayClear: boolean;
}

export default function StaffingPage() {
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);

  useEffect(() => {
    fetch("/api/staffing?weeks=6")
      .then((res) => res.json())
      .then((data) => {
        setWeeks(data.weeks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${startStr} – ${endStr}`;
  };

  const getStatusColor = (status: DayInfo['status'], isWeekend: boolean) => {
    if (status === 'day-off') return isWeekend ? 'bg-sage/10 border-sage/40' : 'bg-bone border-border-subtle';
    if (status === 'extra-help') return 'bg-brick/10 border-brick/40';
    if (status === 'busy') return 'bg-gold/10 border-gold/40';
    return 'bg-cream border-border-subtle';
  };

  const getStatusBadge = (status: DayInfo['status']) => {
    if (status === 'day-off') return null;
    if (status === 'extra-help') return (
      <span className="text-[10px] bg-brick text-cream px-2 py-0.5 rounded-full font-semibold tracking-wide">
        +1 CLEANER
      </span>
    );
    if (status === 'busy') return (
      <span className="text-[10px] bg-gold/100 text-cream px-2 py-0.5 rounded-full font-semibold tracking-wide">
        BUSY
      </span>
    );
    return null;
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-[13px] text-ink-tertiary">Loading staffing data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-cream border-b border-border-subtle px-4 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-[22px] text-ink-primary">Staffing Planner</h1>
          <p className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mt-1">
            Plan Zahra & Siham's days off • Green weekends = day off possible
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-cream border-b border-border-subtle px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-5 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sage/10 border border-sage/40 rounded"></div>
            <span className="text-ink-secondary">Weekend day off OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-cream border border-border-subtle rounded"></div>
            <span className="text-ink-secondary">Normal (1-2 check-ins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold/10 border border-gold/40 rounded"></div>
            <span className="text-ink-secondary">Busy (3-4 check-ins)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-brick/10 border border-brick/40 rounded"></div>
            <span className="text-ink-secondary">Need 2nd cleaner (5+ check-ins)</span>
          </div>
        </div>
      </div>

      {/* Weeks Grid */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {weeks.map((week, weekIdx) => (
          <div key={week.weekStart} className="bg-cream rounded-lg border border-border-subtle overflow-hidden">
            {/* Week Header */}
            <div className="px-4 py-3 bg-bone border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="font-medium text-[13px] text-ink-primary">
                  {formatWeekRange(week.weekStart, week.weekEnd)}
                </span>
                {weekIdx === 0 && (
                  <span className="ml-2 text-[10px] bg-accent text-cream px-2 py-0.5 rounded-full font-semibold tracking-wide">
                    THIS WEEK
                  </span>
                )}
              </div>
              {week.weekendClear && (
                <span className="text-[10px] bg-sage/20 text-forest px-2.5 py-1 rounded-full font-semibold tracking-wide">
                  ✓ WEEKEND DAY OFF
                  {week.saturdayClear && week.sundayClear ? ' (SAT & SUN)' : 
                   week.saturdayClear ? ' (SAT)' : ' (SUN)'}
                </span>
              )}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
              {week.days.map((day) => (
                <div
                  key={day.date}
                  onClick={() => day.checkIns > 0 && setSelectedDay(day)}
                  className={`
                    p-3 border-r border-border-subtle last:border-r-0
                    ${getStatusColor(day.status, day.isWeekend)}
                    ${day.isWeekend ? 'bg-opacity-50' : ''}
                    ${isToday(day.date) ? 'ring-2 ring-black ring-inset' : ''}
                    ${day.checkIns > 0 ? 'cursor-pointer hover:bg-opacity-75' : ''}
                    transition-colors
                  `}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${day.isWeekend ? 'text-ink-secondary' : 'text-ink-tertiary'}`}>
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span className={`font-serif text-lg ${isToday(day.date) ? 'text-ink-primary' : 'text-ink-body'}`}>
                      {day.dayNumber}
                    </span>
                  </div>

                  {/* Check-ins Count */}
                  <div className="text-center">
                    {day.checkIns === 0 ? (
                      <div className={`text-2xl ${day.isWeekend ? 'text-sage' : 'text-ink-tertiary'}`}>
                        {day.isWeekend ? '✓' : '—'}
                      </div>
                    ) : (
                      <div className="font-serif text-[28px] text-ink-primary">
                        {day.checkIns}
                      </div>
                    )}
                    {day.checkIns > 0 && (
                      <div className="text-[10px] text-ink-tertiary mt-0.5 uppercase tracking-wide">
                        check-in{day.checkIns !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2 flex justify-center min-h-[20px]">
                    {getStatusBadge(day.status)}
                  </div>

                  {/* Check-outs indicator */}
                  {day.checkOuts > 0 && (
                    <div className="mt-1 text-[10px] text-ink-tertiary text-center">
                      {day.checkOuts} out
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Guest List Modal */}
      {selectedDay && (
        <div 
          className="fixed inset-0 bg-parchment flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-cream rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-ink-primary">
                {new Date(selectedDay.date).toLocaleDateString('en-GB', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h2>
              <button 
                onClick={() => setSelectedDay(null)}
                className="text-ink-tertiary hover:text-ink-secondary transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-20 text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">Check-ins</span>
                <span className="font-medium text-ink-primary">{selectedDay.checkIns}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="w-20 text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">Check-outs</span>
                <span className="font-medium text-ink-primary">{selectedDay.checkOuts}</span>
              </div>
              
              {selectedDay.guests.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <h3 className="text-[11px] uppercase tracking-[0.08em] text-ink-tertiary mb-3">Arriving guests</h3>
                  <ul className="space-y-1.5">
                    {selectedDay.guests.map((guest, i) => (
                      <li key={i} className="text-[13px] text-ink-body pl-3 border-l-2 border-border-subtle">
                        {guest}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-[11px] text-ink-tertiary tracking-wide">
        Data from Master_Guests • Tap a day to see guest names
      </div>
    </div>
  );
}
