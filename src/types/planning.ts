export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  initials: string;
}

export interface ConnectedUser {
  id?: string;
  name: string;
  role?: string;
  color?: string;
  initials?: string;
  loggedInAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  color: string;     // Hex color code (e.g. #6366F1)
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;  // 0 - 100
  category?: string;
  assignee?: string;
  assigneeId?: string;
  isMilestone?: boolean;
}

export interface RetroplanningTask {
  id: string;
  weekLabel: string; // e.g. "S39", "S40", "S42 (12 oct.)"
  category: string;  // e.g. "Communication", "Logistique", "Activité", "Événement", "Post-événement"
  action: string;
  assignee: string;  // e.g. "Laurine COGHE", "Toute l'équipe"
  status: 'todo' | 'in_progress' | 'completed' | 'event';
  isEventHighlight?: boolean;
}

export interface RetroplanningEvent {
  id: string;
  title: string;
  date: string; // e.g. "15-oct-26"
  objective: string;
  content: string;
  color?: string;
  tasks: RetroplanningTask[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  tasks: Task[];
  members?: TeamMember[];
  events?: RetroplanningEvent[];
}

export type ViewMode = 'gantt' | 'retroplanning' | 'timeline' | 'calendar' | 'list';
export type TimelineZoom = 'week' | 'day' | 'month';

export interface ColorPreset {
  id: string;
  label: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'indigo', label: 'Indigo', hex: '#6366F1', bgClass: 'bg-indigo-500', borderClass: 'border-indigo-600', textClass: 'text-indigo-700' },
  { id: 'blue', label: 'Bleu Océan', hex: '#3B82F6', bgClass: 'bg-blue-500', borderClass: 'border-blue-600', textClass: 'text-blue-700' },
  { id: 'emerald', label: 'Émeraude', hex: '#10B981', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-600', textClass: 'text-emerald-700' },
  { id: 'amber', label: 'Ambre / Or', hex: '#F59E0B', bgClass: 'bg-amber-500', borderClass: 'border-amber-600', textClass: 'text-amber-700' },
  { id: 'rose', label: 'Rose / Corail', hex: '#F43F5E', bgClass: 'bg-rose-500', borderClass: 'border-rose-600', textClass: 'text-rose-700' },
  { id: 'purple', label: 'Violet', hex: '#8B5CF6', bgClass: 'bg-purple-500', borderClass: 'border-purple-600', textClass: 'text-purple-700' },
  { id: 'teal', label: 'Sarcelle', hex: '#14B8A6', bgClass: 'bg-teal-500', borderClass: 'border-teal-600', textClass: 'text-teal-700' },
  { id: 'orange', label: 'Orange', hex: '#F97316', bgClass: 'bg-orange-500', borderClass: 'border-orange-600', textClass: 'text-orange-700' },
  { id: 'slate', label: 'Ardoise', hex: '#64748B', bgClass: 'bg-slate-500', borderClass: 'border-slate-600', textClass: 'text-slate-700' },
  { id: 'fuchsia', label: 'Fuchsia', hex: '#D946EF', bgClass: 'bg-fuchsia-500', borderClass: 'border-fuchsia-600', textClass: 'text-fuchsia-700' },
];

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'm-vianney', name: 'Vianney Urbanick', role: 'Président / Admin', color: '#3B82F6', initials: 'VI' },
  { id: 'm-julien', name: 'Julien Nicolle', role: 'Secrétaire / Dév', color: '#6366F1', initials: 'JU' },
  { id: 'm-mathias', name: 'Mathias Samson', role: 'Événements & Partenaires', color: '#F59E0B', initials: 'MA' },
  { id: 'm-sina', name: 'Sina Abdoul Bastoi', role: 'Communication & Réseaux', color: '#10B981', initials: 'SI' },
  { id: 'm-tetew', name: 'Tetew', role: 'Événements & Logistique', color: '#EC4899', initials: 'TE' },
];

export interface WeekColumn {
  weekNumber: number;
  year: number;
  start: Date;
  end: Date;
  label: string;       // e.g. "Semaine 42"
  shortLabel: string;  // e.g. "S42"
  dateRangeLabel: string; // e.g. "12 oct - 18 oct"
  isCurrentWeek: boolean;
}
