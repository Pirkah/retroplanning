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
import { Task, WeekColumn, RetroplanningEvent } from '../types/planning';

export interface CategoryClass {
  id: string;
  label: string;
  color: string;
  bgLight: string;
  borderLight: string;
  textDark: string;
}

/**
 * Ordre exact des classes (catégories) tel qu'affiché dans le diagramme Gantt
 */
export const CATEGORY_CLASSES: CategoryClass[] = [
  {
    id: 'communication',
    label: 'Communication',
    color: '#16A34A',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    textDark: 'text-emerald-800'
  },
  {
    id: 'association',
    label: 'Association',
    color: '#F97316',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    textDark: 'text-orange-800'
  },
  {
    id: 'administratif',
    label: 'Administratif',
    color: '#0EA5E9',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textDark: 'text-sky-800'
  },
  {
    id: 'partenaires_fournisseurs',
    label: 'Partenaire et Fournisseurs',
    color: '#EAB308',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textDark: 'text-amber-800'
  },
  {
    id: 'finance',
    label: 'Finance',
    color: '#84CC16',
    bgLight: 'bg-lime-50',
    borderLight: 'border-lime-200',
    textDark: 'text-lime-800'
  },
  {
    id: 'activite',
    label: 'Activité',
    color: '#D946EF',
    bgLight: 'bg-fuchsia-50',
    borderLight: 'border-fuchsia-200',
    textDark: 'text-fuchsia-800'
  },
  {
    id: 'logistique_securite',
    label: 'Logistique et Sécurité de la course',
    color: '#EF4444',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textDark: 'text-rose-800'
  },
  {
    id: 'autre',
    label: 'Autres Tâches',
    color: '#64748B',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    textDark: 'text-slate-800'
  }
];

/**
 * Normalise n'importe quelle catégorie saisie vers l'identifiant canonique de classe
 */
export function getCategoryClassId(cat?: string): string {
  if (!cat) return 'autre';
  const c = cat.toLowerCase().trim();

  if (c.includes('comm') || c.includes('réseau') || c.includes('reseau') || c.includes('tiktok') || c.includes('info') || c.includes('site') || c.includes('affiche')) {
    return 'communication';
  }
  if (c.includes('asso') && !c.includes('passation')) {
    return 'association';
  }
  if (c.includes('admin') || c.includes('préfect') || c.includes('prefect') || c.includes('compte') || c.includes('mairie') || c.includes('salle') || c.includes('alcool') || c.includes('tpe') || c.includes('subvent')) {
    return 'administratif';
  }
  if (c.includes('parten') || c.includes('fourn') || c.includes('bde') || c.includes('sponso') || c.includes('dpb') || c.includes('camion') || c.includes('dj') || c.includes('food')) {
    return 'partenaires_fournisseurs';
  }
  if (c.includes('finan') || c.includes('banque') || c.includes('assur') || c.includes('chèque') || c.includes('cheque') || c.includes('smacl')) {
    return 'finance';
  }
  if (c.includes('activ') || c.includes('even') || c.includes('évén') || c.includes('strava') || c.includes('run') || c.includes('gateau') || c.includes('bonbon') || c.includes('dossard') || c.includes('course')) {
    return 'activite';
  }
  if (c.includes('logist') || c.includes('sécur') || c.includes('secur') || c.includes('benevol') || c.includes('bénévol') || c.includes('balis') || c.includes('pompier') || c.includes('croix')) {
    return 'logistique_securite';
  }

  return 'autre';
}

export function getCategoryInfo(cat?: string): CategoryClass {
  const classId = getCategoryClassId(cat);
  return CATEGORY_CLASSES.find((c) => c.id === classId) || CATEGORY_CLASSES[CATEGORY_CLASSES.length - 1];
}

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
 * Trie les tâches par CLASSE (selon l'ordre du diagramme Gantt), puis chronologiquement à l'intérieur
 */
export function sortTasksByClass(tasks: Task[]): Task[] {
  const classOrderMap = new Map<string, number>();
  CATEGORY_CLASSES.forEach((c, idx) => classOrderMap.set(c.id, idx));

  return [...tasks].sort((a, b) => {
    const classA = getCategoryClassId(a.category);
    const classB = getCategoryClassId(b.category);

    const orderA = classOrderMap.get(classA) ?? 999;
    const orderB = classOrderMap.get(classB) ?? 999;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Même classe : ordonnancement chronologique strict
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
 * Regroupe les tâches par classe pour l'affichage en sections dans le Gantt
 */
export function groupTasksByClass(tasks: Task[]): { categoryClass: CategoryClass; tasks: Task[] }[] {
  const sorted = sortTasksByClass(tasks);
  const groupsMap = new Map<string, Task[]>();

  for (const t of sorted) {
    const classId = getCategoryClassId(t.category);
    if (!groupsMap.has(classId)) {
      groupsMap.set(classId, []);
    }
    groupsMap.get(classId)!.push(t);
  }

  const result: { categoryClass: CategoryClass; tasks: Task[] }[] = [];
  for (const catClass of CATEGORY_CLASSES) {
    const groupTasks = groupsMap.get(catClass.id);
    if (groupTasks && groupTasks.length > 0) {
      result.push({
        categoryClass: catClass,
        tasks: groupTasks
      });
    }
  }

  return result;
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

const FRENCH_MONTHS: Record<string, number> = {
  janv: 0, jan: 0, janvier: 0,
  fevr: 1, fev: 1, fevrier: 1, févr: 1, fév: 1, février: 1,
  mars: 2, mar: 2,
  avr: 3, avril: 3,
  mai: 4,
  juin: 5, jun: 5,
  juil: 6, juill: 6, juillet: 6, jul: 6,
  aout: 7, août: 7, aou: 7,
  sept: 8, sep: 8, septembre: 8,
  oct: 9, octo: 9, octobre: 9,
  nov: 10, novembre: 10,
  dec: 11, déc: 11, decembre: 11, décembre: 11
};

/**
 * Convertit une chaîne de date d'événement de rétroplanning en timestamp pour le tri chronologique
 * Gère "28-sept-26", "08-oct-26", "2026-09-28", "28/09/2026", etc.
 */
export function parseRetroEventDate(dateStr: string, event?: RetroplanningEvent): number {
  if (!dateStr || !dateStr.trim()) {
    if (event?.tasks && event.tasks.length > 0) {
      for (const t of event.tasks) {
        const wMatch = t.weekLabel.match(/S(\d{1,2})/i);
        if (wMatch) {
          const wNum = parseInt(wMatch[1], 10);
          const year = wNum >= 24 ? 2026 : 2027;
          return new Date(year, 0, 1 + wNum * 7).getTime();
        }
      }
    }
    return 9999999999999;
  }

  const clean = dateStr.trim().toLowerCase();

  // 1. Format JJ-MMM-AA ou JJ-MMM-AAAA (ex: 28-sept-26, 08-oct-26, 06-déc-26, 22-mars-27, 15-oct-2026)
  const regexAlpha = /^(\d{1,2})[-/ ]([a-zàâéèêëîïôùûüç]+)[-/ ](\d{2,4})$/i;
  const matchAlpha = clean.match(regexAlpha);
  if (matchAlpha) {
    const day = parseInt(matchAlpha[1], 10);
    const monthRaw = matchAlpha[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let year = parseInt(matchAlpha[3], 10);
    if (year < 100) year += 2000;

    let monthIndex = -1;
    for (const [key, idx] of Object.entries(FRENCH_MONTHS)) {
      const cleanKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (monthRaw.startsWith(cleanKey) || cleanKey.startsWith(monthRaw)) {
        monthIndex = idx;
        break;
      }
    }
    if (monthIndex !== -1) {
      return new Date(year, monthIndex, day).getTime();
    }
  }

  // 2. Format ISO AAAA-MM-JJ
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  // 3. Format JJ/MM/AAAA ou JJ/MM/AA
  const slashMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = parseInt(slashMatch[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day).getTime();
  }

  // 4. Fallback basé sur les semaines de tâches
  if (event?.tasks && event.tasks.length > 0) {
    for (const t of event.tasks) {
      const wMatch = t.weekLabel.match(/S(\d{1,2})/i);
      if (wMatch) {
        const wNum = parseInt(wMatch[1], 10);
        const year = wNum >= 24 ? 2026 : 2027;
        return new Date(year, 0, 1 + wNum * 7).getTime();
      }
    }
  }

  return 9999999999999;
}

/**
 * Trie une liste d'événements de rétroplanning par ordre chronologique
 */
export function sortRetroEventsChronologically(events: RetroplanningEvent[]): RetroplanningEvent[] {
  return [...events].sort((a, b) => {
    return parseRetroEventDate(a.date, a) - parseRetroEventDate(b.date, b);
  });
}
