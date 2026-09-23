import {
  parseISO,
  isBefore,
  isAfter,
  addDays,
  differenceInDays,
  format,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
  addWeeks,
  isValid
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task, WeekColumn } from '../types/planning';

/**
 * Trie automatiquement et strictement les tâches dans l'ordre chronologique
 */
export function sortTasksChronologically(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const startA = a.startDate || '9999-12-31';
    const startB = b.startDate || '9999-12-31';
    if (startA !== startB) {
      return startA.localeCompare(startB);
    }
    const endA = a.endDate || startA;
    const endB = b.endDate || startB;
    if (endA !== endB) {
      return endA.localeCompare(endB);
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Génère la liste ordonnée des colonnes de Semaines (Sxx) pour le diagramme de Gantt
 */
export function generateWeekColumns(tasks: Task[], paddingWeeks = 3): WeekColumn[] {
  const today = new Date();
  const currentWeek = getISOWeek(today);
  const currentYear = getISOWeekYear(today);

  let earliest = today;
  let latest = addWeeks(today, 6);

  if (tasks.length > 0) {
    for (const task of tasks) {
      const s = parseISO(task.startDate);
      const e = parseISO(task.endDate || task.startDate);
      if (isValid(s) && isBefore(s, earliest)) earliest = s;
      if (isValid(e) && isAfter(e, latest)) latest = e;
    }
  }

  // Bornes de début et de fin alignées sur les lundis
  const startMonday = startOfISOWeek(addWeeks(earliest, -paddingWeeks));
  const endSunday = endOfISOWeek(addWeeks(latest, paddingWeeks));

  const columns: WeekColumn[] = [];
  let cur = startMonday;

  while (isBefore(cur, endSunday)) {
    const weekNum = getISOWeek(cur);
    const year = getISOWeekYear(cur);
    const wStart = startOfISOWeek(cur);
    const wEnd = endOfISOWeek(cur);

    columns.push({
      weekNumber: weekNum,
      year,
      start: wStart,
      end: wEnd,
      label: `Semaine ${weekNum}`,
      shortLabel: `S${weekNum}`,
      dateRangeLabel: `${format(wStart, 'd MMM', { locale: fr })} - ${format(wEnd, 'd MMM', { locale: fr })}`,
      isCurrentWeek: weekNum === currentWeek && year === currentYear
    });

    cur = addWeeks(cur, 1);
  }

  return columns;
}

/**
 * Calcule la position horizontale (en pixels) d'une tâche sur la grille des semaines
 */
export function calculateGanttPosition(
  task: Task,
  weeks: WeekColumn[],
  columnWidth: number
): { left: number; width: number; startWeekLabel: string; endWeekLabel: string; durationWeeks: number } {
  if (weeks.length === 0) {
    return { left: 0, width: columnWidth, startWeekLabel: 'S1', endWeekLabel: 'S1', durationWeeks: 1 };
  }

  const firstWeekStart = weeks[0].start;
  const taskStart = parseISO(task.startDate);
  const taskEnd = parseISO(task.endDate || task.startDate);

  // Position relative en jours depuis le début de la première semaine
  const startDayOffset = Math.max(0, differenceInDays(taskStart, firstWeekStart));
  const totalDays = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

  // 1 semaine = 7 jours = columnWidth pixels
  const pixelsPerDay = columnWidth / 7;

  const left = startDayOffset * pixelsPerDay;
  const width = Math.max(task.isMilestone ? 26 : totalDays * pixelsPerDay, 26);

  const startWeekNum = getISOWeek(taskStart);
  const endWeekNum = getISOWeek(taskEnd);
  const durationWeeks = Math.max(1, Math.ceil(totalDays / 7));

  return {
    left,
    width,
    startWeekLabel: `S${startWeekNum}`,
    endWeekLabel: `S${endWeekNum}`,
    durationWeeks
  };
}

/**
 * Formate une date en français
 */
export function formatDateFr(dateStr: string | Date, formatPattern = 'dd MMM yyyy'): string {
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '';
    return format(d, formatPattern, { locale: fr });
  } catch {
    return String(dateStr);
  }
}

/**
 * Calcule la durée en jours entre deux dates
 */
export function getDurationDays(startDate: string, endDate: string): number {
  try {
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    if (!isValid(s) || !isValid(e)) return 1;
    const diff = differenceInDays(e, s) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

/**
 * Retourne le numéro de semaine ISO d'une date
 */
export function getWeekNumberFromDate(dateStr: string): number {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? getISOWeek(d) : 1;
  } catch {
    return 1;
  }
}
