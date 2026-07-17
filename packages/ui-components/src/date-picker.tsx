'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './date-picker.module.css';

export interface DatePickerProps {
  /** Selected date value */
  value?: Date;
  /** Callback fired when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Text to show when value is empty */
  placeholder?: string;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional wrapper CSS class */
  className?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  disabled = false,
  className = '',
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Keep internal calendar view synced if external value changes
  useEffect(() => {
    if (value) {
      setCurrentDate(value);
    }
  }, [value]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (day: number, isOutside = false, offset = 0) => {
    if (disabled) return;
    const selectedMonth = isOutside ? month + offset : month;
    const selectedDate = new Date(year, selectedMonth, day);

    // Guard min/max limits
    if (minDate && selectedDate < minDate) return;
    if (maxDate && selectedDate > maxDate) return;

    onChange?.(selectedDate);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(undefined);
  };

  // Format date for the input field: YYYY-MM-DD
  const formattedValue = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : '';

  // Calculate calendar days grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const daysGrid: { day: number; isOutside: boolean; offset: number }[] = [];

  // Previous month days padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysGrid.push({ day: prevMonthDays - i, isOutside: true, offset: -1 });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push({ day: i, isOutside: false, offset: 0 });
  }

  // Next month days padding to make 6 rows (42 days total)
  const remainingDays = 42 - daysGrid.length;
  for (let i = 1; i <= remainingDays; i++) {
    daysGrid.push({ day: i, isOutside: true, offset: 1 });
  }

  const isToday = (day: number, isOutside: boolean) => {
    if (isOutside) return false;
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number, isOutside: boolean) => {
    if (isOutside || !value) return false;
    return value.getDate() === day && value.getMonth() === month && value.getFullYear() === year;
  };

  const isDayDisabled = (day: number, isOutside: boolean, offset: number) => {
    const checkDate = new Date(year, isOutside ? month + offset : month, day);
    if (minDate && checkDate < minDate) return true;
    if (maxDate && checkDate > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <div className={styles.inputWrapper} onClick={() => !disabled && setIsOpen(!isOpen)}>
        <input
          type="text"
          readOnly
          disabled={disabled}
          placeholder={placeholder}
          value={formattedValue}
          className={styles.input}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear selected date"
          >
            <X size={14} />
          </button>
        )}
        <CalendarIcon size={16} className={styles.calendarIcon} />
      </div>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-label="Calendar dropdown">
          <div className={styles.header}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={styles.navButton}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthLabel}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className={styles.navButton}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.grid}>
            {WEEKDAYS.map((day) => (
              <div key={day} className={styles.weekday}>
                {day}
              </div>
            ))}

            {daysGrid.map(({ day, isOutside, offset }, index) => {
              const disabledDay = isDayDisabled(day, isOutside, offset);
              const dayClasses = [
                styles.day,
                isOutside ? styles.outside : '',
                isSelected(day, isOutside) ? styles.selected : '',
                isToday(day, isOutside) ? styles.today : '',
                disabledDay ? styles.disabled : ''
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={`${day}-${isOutside ? 'out' : 'in'}-${index}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleDaySelect(day, isOutside, offset)}
                  className={dayClasses}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
