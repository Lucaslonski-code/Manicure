import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography } from '@theme';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  isDisabled: boolean;
}

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isDateAvailable: (date: Date) => boolean;
  initialMonth?: Date;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastDay(date: Date, today: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d < t;
}

export default function Calendar({
  selectedDate,
  onDateSelect,
  isDateAvailable,
  initialMonth,
}: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(initialMonth?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth?.getMonth() ?? today.getMonth());

  const goToPreviousMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const days: CalendarDay[] = useMemo(() => {
    const result: CalendarDay[] = [];
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const d = new Date(viewYear, viewMonth, -(firstDayOfWeek - i - 1));
      result.push({
        date: d,
        dayOfMonth: d.getDate(),
        isCurrentMonth: false,
        isPast: isPastDay(d, today),
        isToday: isSameDay(d, today),
        isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
        isAvailable: false,
        isDisabled: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const past = isPastDay(d, today);
      const available = !past && isDateAvailable(d);
      result.push({
        date: d,
        dayOfMonth: day,
        isCurrentMonth: true,
        isPast: past,
        isToday: isSameDay(d, today),
        isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
        isAvailable: available,
        isDisabled: past || !available,
      });
    }

    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      result.push({
        date: d,
        dayOfMonth: i,
        isCurrentMonth: false,
        isPast: isPastDay(d, today),
        isToday: isSameDay(d, today),
        isSelected: selectedDate ? isSameDay(d, selectedDate) : false,
        isAvailable: false,
        isDisabled: true,
      });
    }

    return result;
  }, [viewYear, viewMonth, today, selectedDate, isDateAvailable]);

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={styles.navButton}
          accessibilityLabel="Mês anterior"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.navArrow}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYear}>
            {MONTH_LABELS[viewMonth]} {viewYear}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navButton}
          accessibilityLabel="Próximo mês"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.navArrow}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => (
            <TouchableOpacity
              key={di}
              style={[
                styles.dayCell,
                day.isSelected && styles.dayCellSelected,
                day.isToday && !day.isSelected && styles.dayCellToday,
                day.isCurrentMonth && !day.isDisabled && styles.dayCellActive,
              ]}
              onPress={() => {
                if (!day.isDisabled && day.isCurrentMonth) {
                  onDateSelect(day.date);
                }
              }}
              disabled={day.isDisabled || !day.isCurrentMonth}
              activeOpacity={0.6}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text
                style={[
                  styles.dayText,
                  day.isSelected && styles.dayTextSelected,
                  day.isToday && !day.isSelected && styles.dayTextToday,
                  !day.isCurrentMonth && styles.dayTextOutside,
                  day.isDisabled && day.isCurrentMonth && styles.dayTextDisabled,
                ]}
              >
                {day.dayOfMonth}
              </Text>
              {day.isAvailable && !day.isSelected && day.isCurrentMonth && (
                <View style={styles.availableDot} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  navArrow: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  monthYearContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    ...typography.section,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginHorizontal: 1,
  },
  dayCellActive: {},
  dayCellSelected: {
    backgroundColor: colors.gold,
  },
  dayCellToday: {
    backgroundColor: colors.goldOverlay,
  },
  dayText: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: colors.gold,
    fontWeight: '600',
  },
  dayTextOutside: {
    color: colors.disabled,
  },
  dayTextDisabled: {
    color: colors.disabled,
  },
  availableDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginTop: 2,
  },
});
