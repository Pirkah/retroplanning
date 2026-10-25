import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  Task,
  TaskStatus,
  ViewMode,
  TimelineZoom,
  TeamMember,
  ConnectedUser,
  DEFAULT_TEAM_MEMBERS,
  RetroplanningEvent,
  RetroplanningTask
} from '../types/planning';
import { DEFAULT_PROJECT } from '../data/defaultProject';
import { sortTasksChronologically, sortRetroEventsChronologically, sortRetroTasksChronologically, weekLabelToDates } from '../utils/scheduler';
import { getCategoryDefinition, getCategoryColor, STANDARD_CATEGORIES } from '../utils/categories';
import { parseExcelPlanning } from '../utils/excelImport';

export interface VaultSnapshot {
  id: string;
  timestamp: string;
  label: string;
  taskCount: number;
  eventCount: number;
  projects: Project[];
  activeProjectId: string;
}

interface PlanningContextType {
  projects: Project[];
  currentProject: Project;
  activeProjectId: string;
  viewMode: ViewMode;
  zoom: TimelineZoom;
  searchQuery: string;
  selectedColor: string | null;
  selectedMemberId: string | null;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  defaultDateForNewTask: string | null;

  // Utilisateur connecté & Sommaire
  currentUser: ConnectedUser | null;
  setCurrentUser: (user: ConnectedUser | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  retroActiveTab: string;
  setRetroActiveTab: (tab: string) => void;

  // Thème Sombre / Clair
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Temps réel & Équipe
  onlineCount: number;
  onlineUsers: ConnectedUser[];
  isMemberOnline: (memberIdOrName: string) => boolean;
  isWebSocketConnected: boolean;
  serverInfo: { localIp: string; port: number } | null;
  members: TeamMember[];

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: TimelineZoom) => void;
  setSearchQuery: (query: string) => void;
  setSelectedColor: (color: string | null) => void;
  setSelectedMemberId: (memberId: string | null) => void;
  setActiveProjectId: (id: string) => void;
  createNewProject: (name: string, description?: string) => void;
  deleteProject: (id: string) => void;
  updateProjectMeta: (name: string, description?: string) => void;

  // Task Actions (All auto-sort & broadcast live)
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;
  clearAllTasks: () => void;

  // Modal Controls
  openNewTaskModal: (defaultDate?: string) => void;
  openEditTaskModal: (task: Task) => void;
  closeTaskModal: () => void;

  // Membres
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  deleteTeamMember: (memberId: string) => void;

  // Sécurité & Mode Édition
  isAuthorized: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  unlockEditMode: (password: string, user?: ConnectedUser) => Promise<boolean>;
  lockEditMode: () => void;
  changePassword: (oldPass: string, newPass: string, memberId?: string) => Promise<{ success: boolean; message?: string }>;

  // Rétroplanning par Événements (style Excel)
  addRetroEvent: (event: Omit<RetroplanningEvent, 'id'>) => void;
  updateRetroEvent: (event: RetroplanningEvent) => void;
  deleteRetroEvent: (eventId: string) => void;
  addRetroTask: (eventId: string, task: Omit<RetroplanningTask, 'id'>) => void;
  updateRetroTask: (eventId: string, task: RetroplanningTask) => void;
  deleteRetroTask: (eventId: string, taskId: string) => void;

  // Import / Export & Sauvegardes
  exportProjectJson: () => void;
  importProjectJson: (content: string) => boolean;
  importProjectFromExcel: (file: File) => Promise<boolean>;
  vaultSnapshots: VaultSnapshot[];
  createVaultSnapshot: (label?: string) => void;
  restoreVaultSnapshot: (id: string) => boolean;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'retroplanning_projects_v4';
const ACTIVE_PROJ_KEY = 'retroplanning_active_id_v4';

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

const normalizeMember = (m: TeamMember): TeamMember => {
  let updated = { ...m };
  const id = (updated.id || '').toLowerCase();
  const name = (updated.name || '').toLowerCase();

  if (id === 'm-vianney' || id === 'm-pres' || name.includes('vianney') || name.includes('président') || name.includes('president')) {
    updated.id = 'm-vianney';
    updated.name = 'Vianney Urbanick';
    updated.role = 'Président';
    updated.initials = 'VI';
    updated.color = updated.color || '#3B82F6';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-julien' || id === 'm-vp' || name.includes('julien') || name.includes('vice')) {
    updated.id = 'm-julien';
    updated.name = 'Julien Nicolle';
    updated.role = 'Vice-président';
    updated.initials = 'JU';
    updated.color = updated.color || '#6366F1';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-theo' || id === 'm-tetew' || id === 'm-com-int' || name.includes('théo') || name.includes('theo') || name.includes('tetew') || name.includes('interne')) {
    updated.id = 'm-theo';
    updated.name = 'Théo';
    updated.role = 'Chargé de communication interne';
    updated.initials = 'TH';
    updated.color = updated.color || '#EC4899';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-mathias' || id === 'm-com-ext1' || name.includes('mathias') || name.includes('externe 1')) {
    updated.id = 'm-mathias';
    updated.name = 'Mathias Samson';
    updated.role = 'Chargé de communication externe';
    updated.initials = 'MA';
    updated.color = updated.color || '#F59E0B';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-sina' || id === 'm-com-ext2' || name.includes('sina') || name.includes('externe 2') || (name.includes('externe') && !name.includes('1'))) {
    updated.id = 'm-sina';
    updated.name = 'Sina Abdoul Bastoi';
    updated.role = 'Chargé de communication externe';
    updated.initials = 'SI';
    updated.color = updated.color || '#10B981';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-christelle' || id === 'm-prof1' || name.includes('christelle') || name.includes('voisin') || name.includes('encadrant 1')) {
    updated.id = 'm-christelle';
    updated.name = 'Christelle Voisin';
    updated.role = 'Professeure encadrante';
    updated.initials = 'CV';
    updated.color = updated.color || '#8B5CF6';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-marius' || id === 'm-prof2' || name.includes('marius') || name.includes('chevalier') || name.includes('encadrant 2')) {
    updated.id = 'm-marius';
    updated.name = 'Marius Chevalier';
    updated.role = 'Professeur encadrant';
    updated.initials = 'MC';
    updated.color = updated.color || '#0EA5E9';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-bde' || name.includes('bde') || name.includes('bureau des')) {
    updated.id = 'm-bde';
    updated.name = 'BDE IUT GEA';
    updated.role = 'Bureau Des Étudiants (Consultation)';
    updated.initials = 'BDE';
    updated.color = updated.color || '#F59E0B';
    updated.generation = 'Partenaires & BDE';
    updated.isBde = true;
    updated.isReadOnly = true;
  } else {
    updated.generation = updated.generation || '10ème équipe';
  }
  return updated;
};

const normalizeConnectedUser = (u: ConnectedUser): ConnectedUser => {
  let updated = { ...u };
  const id = (updated.id || '').toLowerCase();
  const name = (updated.name || '').toLowerCase();

  if (id === 'm-vianney' || id === 'm-pres' || name.includes('vianney') || name.includes('président') || name.includes('president')) {
    updated.id = 'm-vianney';
    updated.name = 'Vianney Urbanick';
    updated.role = 'Président';
    updated.initials = 'VI';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-julien' || id === 'm-vp' || name.includes('julien') || name.includes('vice')) {
    updated.id = 'm-julien';
    updated.name = 'Julien Nicolle';
    updated.role = 'Vice-président';
    updated.initials = 'JU';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-theo' || id === 'm-tetew' || id === 'm-com-int' || name.includes('théo') || name.includes('theo') || name.includes('tetew') || name.includes('interne')) {
    updated.id = 'm-theo';
    updated.name = 'Théo';
    updated.role = 'Chargé de communication interne';
    updated.initials = 'TH';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-mathias' || id === 'm-com-ext1' || name.includes('mathias') || name.includes('externe 1')) {
    updated.id = 'm-mathias';
    updated.name = 'Mathias Samson';
    updated.role = 'Chargé de communication externe';
    updated.initials = 'MA';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-sina' || id === 'm-com-ext2' || name.includes('sina') || name.includes('externe 2') || (name.includes('externe') && !name.includes('1'))) {
    updated.id = 'm-sina';
    updated.name = 'Sina Abdoul Bastoi';
    updated.role = 'Chargé de communication externe';
    updated.initials = 'SI';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-christelle' || id === 'm-prof1' || name.includes('christelle') || name.includes('voisin') || name.includes('encadrant 1')) {
    updated.id = 'm-christelle';
    updated.name = 'Christelle Voisin';
    updated.role = 'Professeure encadrante';
    updated.initials = 'CV';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-marius' || id === 'm-prof2' || name.includes('marius') || name.includes('chevalier') || name.includes('encadrant 2')) {
    updated.id = 'm-marius';
    updated.name = 'Marius Chevalier';
    updated.role = 'Professeur encadrant';
    updated.initials = 'MC';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-bde' || name.includes('bde') || name.includes('bureau des')) {
    updated.id = 'm-bde';
    updated.name = 'BDE IUT GEA';
    updated.role = 'Bureau Des Étudiants (Consultation)';
    updated.initials = 'BDE';
    updated.generation = 'Partenaires & BDE';
    updated.isBde = true;
    updated.isReadOnly = true;
  } else {
    updated.generation = updated.generation || '10ème équipe';
  }
  return updated;
};

const cleanAssigneeName = (name?: string): string | undefined => {
  if (!name) return name;
  const a = name.toLowerCase().trim();
  if (a === 'vianney' || a.includes('vianney') || a.includes('urbanick') || a === 'président' || a === 'president') return 'Vianney Urbanick';
  if (a === 'julien' || a.includes('julien') || a.includes('nicolle') || a === 'vice-président' || a === 'vice-president' || a === 'vice président') return 'Julien Nicolle';
  if (a === 'théo' || a === 'theo' || a === 'tetew' || a.includes('théo') || a.includes('theo') || a.includes('tetew') || a === 'com interne' || a === 'communication interne') return 'Théo';
  if (a === 'mathias' || a.includes('mathias') || a.includes('samson') || a === 'com externe 1') return 'Mathias Samson';
  if (a === 'sina' || a.includes('sina') || a.includes('bastoi') || a === 'com externe 2' || a === 'com externe') return 'Sina Abdoul Bastoi';
  if (a.includes('christelle') || a.includes('voisin') || a.includes('encadrant 1')) return 'Christelle Voisin';
  if (a.includes('marius') || a.includes('chevalier') || a.includes('encadrant 2')) return 'Marius Chevalier';
  if (a.includes('bde') || a.includes('bureau des')) return 'BDE IUT GEA';
  return name;
};

const normalizeTask = (t: Task): Task => {
  const catDef = getCategoryDefinition(t.category || STANDARD_CATEGORIES[0].label);
  let cleanAssignee = cleanAssigneeName(t.assignee);
  let cleanId = t.assigneeId;

  if (!cleanAssignee && cleanId) {
    if (cleanId === 'm-vianney') cleanAssignee = 'Vianney Urbanick';
    else if (cleanId === 'm-julien') cleanAssignee = 'Julien Nicolle';
    else if (cleanId === 'm-theo') cleanAssignee = 'Théo';
    else if (cleanId === 'm-mathias') cleanAssignee = 'Mathias Samson';
    else if (cleanId === 'm-sina') cleanAssignee = 'Sina Abdoul Bastoi';
    else if (cleanId === 'm-christelle') cleanAssignee = 'Christelle Voisin';
    else if (cleanId === 'm-marius') cleanAssignee = 'Marius Chevalier';
    else if (cleanId === 'm-bde') cleanAssignee = 'BDE IUT GEA';
  }

  if (cleanAssignee === 'Vianney Urbanick') cleanId = 'm-vianney';
  else if (cleanAssignee === 'Julien Nicolle') cleanId = 'm-julien';
  else if (cleanAssignee === 'Théo') cleanId = 'm-theo';
  else if (cleanAssignee === 'Mathias Samson') cleanId = 'm-mathias';
  else if (cleanAssignee === 'Sina Abdoul Bastoi') cleanId = 'm-sina';
  else if (cleanAssignee === 'Christelle Voisin') cleanId = 'm-christelle';
  else if (cleanAssignee === 'Marius Chevalier') cleanId = 'm-marius';
  else if (cleanAssignee === 'BDE IUT GEA') cleanId = 'm-bde';

  return {
    ...t,
    category: catDef.label,
    color: catDef.color,
    assignee: cleanAssignee,
    assigneeId: cleanId
  };
};

const normalizeRetroEvents = (events: RetroplanningEvent[]): RetroplanningEvent[] => {
  return (events || []).map((e) => ({
    ...e,
    tasks: sortRetroTasksChronologically(
      (e.tasks || []).map((t) => {
        const catDef = getCategoryDefinition(t.category || STANDARD_CATEGORIES[0].label);
        return {
          ...t,
          category: catDef.label,
          assignee: cleanAssigneeName(t.assignee) || t.assignee || ''
        };
      })
    )
  }));
};

export const ensureAllDefaultMembers = (existingMembers?: TeamMember[]): TeamMember[] => {
  const list = existingMembers && Array.isArray(existingMembers) ? [...existingMembers] : [];
  DEFAULT_TEAM_MEMBERS.forEach((dm) => {
    const exists = list.some(
      (m) => m.id === dm.id || (m.name && dm.name && m.name.toLowerCase().trim() === dm.name.toLowerCase().trim())
    );
    if (!exists) {
      list.push(dm);
    }
  });
  return list.map(normalizeMember);
};

/**
 * Réconciliation intelligente et bidirectionnelle entre les événements de rétroplanning
 * et la liste globale des tâches Gantt :
 * 1. Garantit que chaque action de rétroplanning (event.tasks) a sa tâche Gantt correspondante dans project.tasks.
 * 2. Maintient une synchronisation stricte 1:1 (action <-> title, statut, dates/semaine, catégorie unifiée, assigné).
 * 3. Préserve les tâches Gantt générales autonomes (ex: "Mail prof") qui ne sont rattachées à aucun événement.
 * 4. Déduplique strictement les tâches dans project.tasks pour éliminer tout risque de doublons.
 */
export const reconcileProjectTasksAndEvents = (p: Project): Project => {
  if (!p) return p;

  const members = ensureAllDefaultMembers(p.members);
  const rawEvents = (p.events && p.events.length > 0) ? p.events : (DEFAULT_PROJECT.events || []);
  const normalizedEvents = normalizeRetroEvents(rawEvents);
  const rawTasks = (p.tasks && p.tasks.length > 0) ? p.tasks : DEFAULT_PROJECT.tasks;
  const currentTasks = rawTasks.map(normalizeTask);

  const finalTasks: Task[] = [...currentTasks];

  // 1. Parcourir toutes les tâches de tous les événements
  const reconciledEvents = normalizedEvents.map((evt) => {
    const updatedEvtTasks = evt.tasks.map((rt) => {
      const dates = weekLabelToDates(rt.weekLabel);
      const catDef = getCategoryDefinition(rt.category || STANDARD_CATEGORIES[0].label);
      const cleanAssignee = cleanAssigneeName(rt.assignee);

      // Chercher la tâche Gantt correspondante
      const matchIdx = finalTasks.findIndex(
        (gt) =>
          (rt.ganttTaskId && gt.id === rt.ganttTaskId) ||
          (gt.retroTaskId && gt.retroTaskId === rt.id) ||
          gt.id === rt.id ||
          (gt.eventId === evt.id && gt.title.toLowerCase().trim() === rt.action.toLowerCase().trim()) ||
          (!gt.eventId && gt.title.toLowerCase().trim() === rt.action.toLowerCase().trim())
      );

      if (matchIdx >= 0) {
        // Tâche Gantt trouvée : mettre à jour et sceller le lien 1:1
        const existingGt = finalTasks[matchIdx];
        const linkedGanttId = existingGt.id;

        const updatedGt: Task = normalizeTask({
          ...existingGt,
          title: rt.action,
          startDate: existingGt.startDate || dates.startDate,
          endDate: existingGt.endDate || dates.endDate,
          category: catDef.label,
          color: catDef.color,
          assignee: cleanAssignee || existingGt.assignee,
          eventId: evt.id,
          eventTitle: evt.title,
          weekLabel: rt.weekLabel,
          retroTaskId: rt.id,
          status: (rt.status === 'completed' || rt.status === 'event'
            ? 'completed'
            : rt.status === 'in_progress'
            ? 'in_progress'
            : existingGt.status || 'todo') as TaskStatus,
          progress: rt.status === 'completed' || rt.status === 'event'
            ? 100
            : rt.status === 'in_progress'
            ? (existingGt.progress && existingGt.progress > 0 && existingGt.progress < 100 ? existingGt.progress : 50)
            : existingGt.progress || 0,
          isMilestone: Boolean(rt.isEventHighlight || rt.status === 'event')
        });

        finalTasks[matchIdx] = updatedGt;

        return {
          ...rt,
          category: catDef.label,
          assignee: cleanAssignee || rt.assignee,
          ganttTaskId: linkedGanttId
        };
      } else {
        // Tâche présente dans le rétroplanning mais manquante dans le Gantt !
        // Création automatique de la tâche Gantt liée
        const newGanttId = rt.ganttTaskId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newGt: Task = normalizeTask({
          id: newGanttId,
          title: rt.action,
          startDate: dates.startDate,
          endDate: dates.endDate,
          color: catDef.color,
          status: (rt.status === 'completed' || rt.status === 'event'
            ? 'completed'
            : rt.status === 'in_progress'
            ? 'in_progress'
            : 'todo') as TaskStatus,
          priority: 'medium',
          progress: rt.status === 'completed' || rt.status === 'event' ? 100 : rt.status === 'in_progress' ? 50 : 0,
          category: catDef.label,
          assignee: cleanAssignee,
          isMilestone: Boolean(rt.isEventHighlight || rt.status === 'event'),
          eventId: evt.id,
          eventTitle: evt.title,
          weekLabel: rt.weekLabel,
          retroTaskId: rt.id
        });

        finalTasks.push(newGt);

        return {
          ...rt,
          category: catDef.label,
          assignee: cleanAssignee || rt.assignee,
          ganttTaskId: newGanttId
        };
      }
    });

    return {
      ...evt,
      tasks: sortRetroTasksChronologically(updatedEvtTasks)
    };
  });

  // 2. Déduplication stricte des tâches Gantt
  const seenGanttIds = new Set<string>();
  const seenRetroKeys = new Set<string>();
  const deduplicatedTasks: Task[] = [];

  for (const t of finalTasks) {
    if (seenGanttIds.has(t.id)) continue;
    seenGanttIds.add(t.id);

    if (t.retroTaskId) {
      if (seenRetroKeys.has(t.retroTaskId)) continue;
      seenRetroKeys.add(t.retroTaskId);
    }

    if (t.eventId) {
      const eventKey = `${t.eventId}:::${t.title.toLowerCase().trim()}`;
      if (seenRetroKeys.has(eventKey)) continue;
      seenRetroKeys.add(eventKey);
    }

    deduplicatedTasks.push(t);
  }

  return {
    ...p,
    members,
    events: sortRetroEventsChronologically(reconciledEvents),
    tasks: sortTasksChronologically(deduplicatedTasks)
  };
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('retroplanning_projects_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loaded = parsed
            .filter((p: Project) => p.id !== 'proj-gea-2026')
            .map((p: Project) => reconcileProjectTasksAndEvents(p));

          if (loaded.length > 0) {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
            } catch {}
            return loaded;
          }
        }
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
    return [reconcileProjectTasksAndEvents(DEFAULT_PROJECT)];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_PROJ_KEY);
    if (savedId && savedId !== 'proj-gea-2026') return savedId;
    return DEFAULT_PROJECT.id;
  });

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('rnf_view_mode_v2');
    const savedUser = localStorage.getItem('rnf_connected_user_v1');
    if (!savedUser && (saved === 'ideas' || saved === 'messages')) {
      return 'home';
    }
    return (saved as ViewMode) || 'home';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('rnf_view_mode_v2', mode);
    } catch {}
  };
  const [zoom, setZoom] = useState<TimelineZoom>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDateForNewTask, setDefaultDateForNewTask] = useState<string | null>(null);

  // Modal Sauvegarde & Sécurité
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Coffre-fort local des points de restauration (Sauvegardes automatiques en navigateur)
  const VAULT_KEY = 'rnf_vault_snapshots_v1';
  const [vaultSnapshots, setVaultSnapshots] = useState<VaultSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(VAULT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const AUTH_KEY = 'rnf_auth_password_v1';
  const USER_KEY = 'rnf_connected_user_v1';

  // Utilisateur connecté & Navigation Sommaire
  const [currentUser, setCurrentUser] = useState<ConnectedUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        const normalized = normalizeConnectedUser(u);
        try { localStorage.setItem(USER_KEY, JSON.stringify(normalized)); } catch {}
        return normalized;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Assurer la cohérence du profil connecté avec les rôles officiels
  useEffect(() => {
    if (currentUser) {
      const normalized = normalizeConnectedUser(currentUser);
      if (
        normalized.role !== currentUser.role ||
        normalized.name !== currentUser.name ||
        normalized.id !== currentUser.id
      ) {
        setCurrentUser(normalized);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        } catch {}
      }
    }
  }, [currentUser]);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [retroActiveTab, setRetroActiveTab] = useState<string>('overview');

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Thème Sombre / Clair
  const THEME_KEY = 'rnf_theme_v1';
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // États Sécurité & Mode Édition
  const [authPassword, setAuthPassword] = useState<string>(() => {
    return localStorage.getItem(AUTH_KEY) || '';
  });
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    try {
      const savedPass = localStorage.getItem(AUTH_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.isReadOnly || parsed?.isBde || parsed?.id === 'm-bde') {
          return false;
        }
      }
      return Boolean(savedPass && savedUser);
    } catch {
      return false;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Vérification & réhydratation automatique du mot de passe sur le serveur au démarrage
  useEffect(() => {
    const verifySavedAuth = async () => {
      const savedPass = localStorage.getItem(AUTH_KEY);
      const savedUserStr = localStorage.getItem(USER_KEY);
      let savedMemberId: string | undefined = undefined;
      let isReadOnlyUser = false;
      try {
        if (savedUserStr) {
          const parsed = JSON.parse(savedUserStr);
          savedMemberId = parsed?.id;
          isReadOnlyUser = Boolean(parsed?.isReadOnly || parsed?.isBde || parsed?.id === 'm-bde');
        }
      } catch {}

      if (isReadOnlyUser) {
        setIsAuthorized(false);
        return;
      }

      if (savedPass && savedMemberId) {
        try {
          const isDev = window.location.port === '5173';
          const apiUrl = isDev
            ? `http://${window.location.hostname}:3001/api/auth/verify`
            : '/api/auth/verify';
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: savedPass, memberId: savedMemberId })
          });
          if (res.ok) {
            setIsAuthorized(true);
            setAuthPassword(savedPass);
          }
        } catch {
          // Serveur en cours de démarrage ou hors-ligne, conserver l'authentification locale
          setIsAuthorized(true);
        }
      }
    };
    verifySavedAuth();
  }, []);

  // États WebSocket & Présence
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineUsers, setOnlineUsers] = useState<ConnectedUser[]>([]);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const [serverInfo, setServerInfo] = useState<{ localIp: string; port: number } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Références d'état pour éviter les fermetures lexicales périmées (stale closures)
  const projectsRef = useRef<Project[]>(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const activeProjectIdRef = useRef<string>(activeProjectId);
  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const authPasswordRef = useRef<string>(authPassword);
  useEffect(() => {
    authPasswordRef.current = authPassword;
  }, [authPassword]);

  const currentUserRef = useRef<ConnectedUser | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Calcul du nombre total d'éléments (tâches Gantt + tâches de rétroplanning)
  const getProjectTotalCount = (projs: Project[]): number => {
    if (!projs || !Array.isArray(projs)) return 0;
    return projs.reduce((acc, p) => {
      const tCount = (p.tasks || []).length;
      const eCount = (p.events || []).reduce((ea, e) => ea + (e.tasks || []).length, 0);
      return acc + tCount + eCount;
    }, 0);
  };

  // Enregistre un instantané de sécurité dans le coffre-fort local (garder les 15 plus récents)
  const saveLocalVaultSnapshot = useCallback((projs: Project[], label: string) => {
    try {
      if (!projs || projs.length === 0) return;
      const tCount = projs.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
      const eCount = projs.reduce((acc, p) => acc + (p.events?.length || 0), 0);
      const newSnap: VaultSnapshot = {
        id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        label,
        taskCount: tCount,
        eventCount: eCount,
        projects: projs,
        activeProjectId: activeProjectIdRef.current
      };

      setVaultSnapshots((prev) => {
        const next = [newSnap, ...prev.slice(0, 14)];
        try { localStorage.setItem('rnf_vault_snapshots_v1', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch (err) {
      console.warn('Erreur sauvegarde point coffre-fort:', err);
    }
  }, []);

  const createVaultSnapshot = (label?: string) => {
    saveLocalVaultSnapshot(projectsRef.current, label || 'Point de restauration manuel');
  };

  const restoreVaultSnapshot = (id: string): boolean => {
    const snap = vaultSnapshots.find((s) => s.id === id);
    if (!snap || !Array.isArray(snap.projects) || snap.projects.length === 0) return false;
    const reconciled = snap.projects.map((p) => reconcileProjectTasksAndEvents(p));
    setProjects(reconciled);
    const targetActive = snap.activeProjectId || activeProjectIdRef.current;
    setActiveProjectId(targetActive);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reconciled));
      localStorage.setItem(ACTIVE_PROJ_KEY, targetActive);
    } catch {}
    broadcastState(reconciled, targetActive);
    return true;
  };

  // Calcul du timestamp le plus récent parmi une liste de projets
  const getLatestProjectTimestamp = (projs: Project[]): number => {
    if (!projs || !Array.isArray(projs)) return 0;
    return projs.reduce((max, p) => {
      const t = p.updatedAt ? new Date(p.updatedAt).getTime() : (p.createdAt ? new Date(p.createdAt).getTime() : 0);
      return isNaN(t) ? max : Math.max(max, t);
    }, 0);
  };

  // Synchronisation sécurisée du client vers le serveur (WebSocket + HTTP)
  const syncLocalToServer = useCallback((projs: Project[], activeId: string) => {
    const now = new Date().toISOString();
    // 1. Envoi prioritaire par WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(
          JSON.stringify({
            type: 'SYNC_PROJECTS',
            password: authPasswordRef.current || 'rnf2026',
            memberId: currentUserRef.current?.id,
            payload: {
              projects: projs,
              activeProjectId: activeId,
              lastModified: now
            }
          })
        );
      } catch (err) {
        console.warn('[WS] Erreur syncLocalToServer:', err);
      }
    }

    // 2. Envoi HTTP de sécurité
    try {
      const isDev = window.location.port === '5173';
      const syncUrl = isDev
        ? `http://${window.location.hostname}:3001/api/projects/sync`
        : '/api/projects/sync';
      fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: authPasswordRef.current || 'rnf2026',
          memberId: currentUserRef.current?.id,
          projects: projs,
          activeProjectId: activeId,
          lastModified: now
        })
      }).catch(() => {});
    } catch {}
  }, []);

  // Réconciliation intelligente des projets entrants (HTTP, INIT_STATE, STATE_UPDATED)
  const handleIncomingState = useCallback((
    incomingProjects: Project[],
    incomingActiveId: string | undefined,
    incomingLastModified: string | undefined,
    source: 'HTTP' | 'INIT_STATE' | 'STATE_UPDATED'
  ) => {
    if (!incomingProjects || !Array.isArray(incomingProjects) || incomingProjects.length === 0) return;

    const validProjects = incomingProjects
      .filter((p: Project) => p.id !== 'proj-gea-2026')
      .map((p: Project) => {
        const withTimestamp = {
          ...p,
          updatedAt: p.updatedAt || incomingLastModified || new Date().toISOString()
        };
        return reconcileProjectTasksAndEvents(withTimestamp);
      });

    if (validProjects.length === 0) return;

    const targetActiveId = (incomingActiveId && incomingActiveId !== 'proj-gea-2026')
      ? incomingActiveId
      : DEFAULT_PROJECT.id;

    const localTotalCount = getProjectTotalCount(projectsRef.current);
    const incomingTotalCount = getProjectTotalCount(validProjects);

    // Si c'est un STATE_UPDATED en direct d'un collègue
    if (source === 'STATE_UPDATED') {
      if (localTotalCount > 0) {
        saveLocalVaultSnapshot(projectsRef.current, `Avant synchro live (${new Date().toLocaleTimeString('fr-FR')})`);
      }
      isBroadcastingRef.current = true;
      setProjects(validProjects);
      setActiveProjectId(targetActiveId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validProjects));
        localStorage.setItem(ACTIVE_PROJ_KEY, targetActiveId);
      } catch {}
      setTimeout(() => {
        isBroadcastingRef.current = false;
      }, 50);
      return;
    }

    // Protection anti-perte Render : Si le client local possède PLUS d'éléments que le serveur
    // (ex: serveur Render qui a redémarré avec un état éphémère vide ou partiel)
    if (localTotalCount > incomingTotalCount && localTotalCount > 0) {
      console.warn(`[Protection Anti-Perte] Le client local possède ${localTotalCount} éléments contre ${incomingTotalCount} sur le serveur. Conservation prioritaire et synchronisation vers le serveur.`);
      syncLocalToServer(projectsRef.current, activeProjectIdRef.current);
      return;
    }

    // Pour initialisation (HTTP ou INIT_STATE), vérifier les horodatages
    const serverTime = incomingLastModified
      ? new Date(incomingLastModified).getTime()
      : getLatestProjectTimestamp(validProjects);
    const clientTime = getLatestProjectTimestamp(projectsRef.current);

    // Si le client local possède des données plus récentes
    if (clientTime > serverTime && clientTime > 0) {
      console.log(`[Sync] Le client local possède des données plus récentes (${new Date(clientTime).toISOString()}) que le serveur (${new Date(serverTime).toISOString()}). Restauration vers le serveur.`);
      syncLocalToServer(projectsRef.current, activeProjectIdRef.current);
    } else {
      if (localTotalCount > 0) {
        saveLocalVaultSnapshot(projectsRef.current, `Avant chargement serveur (${source})`);
      }
      console.log(`[Sync] Application des données du serveur (${source}).`);
      setProjects(validProjects);
      setActiveProjectId(targetActiveId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validProjects));
        localStorage.setItem(ACTIVE_PROJ_KEY, targetActiveId);
      } catch {}
    }
  }, [syncLocalToServer, saveLocalVaultSnapshot]);



  // Récupération initiale via HTTP (chargement immédiat et protection anti-perte Render)
  useEffect(() => {
    let isCancelled = false;
    const fetchInitialProjects = async () => {
      try {
        const isDev = window.location.port === '5173';
        const apiUrl = isDev
          ? `http://${window.location.hostname}:3001/api/projects`
          : '/api/projects';
        const res = await fetch(apiUrl);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data && data.projects && data.projects.length > 0) {
            handleIncomingState(data.projects, data.activeProjectId, data.lastModified, 'HTTP');
          }
        }
      } catch (err) {
        // Mode hors ligne ou attente démarrage serveur
      }
    };
    fetchInitialProjects();
    return () => {
      isCancelled = true;
    };
  }, [handleIncomingState]);

  // Connexion WebSocket temps réel compatible Render (WSS / HTTPS)
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    const isDev = window.location.port === '5173';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = isDev
      ? `ws://${window.location.hostname}:3001/ws`
      : `${protocol}//${window.location.host}/ws`;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setIsWebSocketConnected(true);
          console.log('[WS] Connecté au serveur collaboratif :', wsUrl);
          if (currentUser) {
            try {
              ws.send(JSON.stringify({ type: 'IDENTIFY', user: currentUser }));
            } catch {}
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INIT_STATE' && data.payload) {
              if (data.payload.projects && data.payload.projects.length > 0) {
                handleIncomingState(
                  data.payload.projects,
                  data.payload.activeProjectId,
                  data.payload.lastModified,
                  'INIT_STATE'
                );
              }
            } else if (data.type === 'STATE_UPDATED' && data.payload) {
              if (data.payload.projects && data.payload.projects.length > 0) {
                handleIncomingState(
                  data.payload.projects,
                  data.payload.activeProjectId,
                  data.payload.lastModified,
                  'STATE_UPDATED'
                );
              }
            } else if (data.type === 'PRESENCE') {
              setOnlineCount(data.count || 1);
              if (Array.isArray(data.users)) {
                setOnlineUsers(data.users);
              }
            }
          } catch (e) {
            console.error('[WS] Erreur parsing message:', e);
          }
        };

        ws.onclose = () => {
          setIsWebSocketConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setIsWebSocketConnected(false);
          ws.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Informe le serveur collaboratif de l'identité de l'utilisateur connecté
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          type: 'IDENTIFY',
          user: currentUser || null
        }));
      } catch {}
    }
  }, [currentUser]);

  // Détermine si un membre est actuellement connecté (soit session locale, soit diffusé par WebSocket)
  const isMemberOnline = (memberIdOrName: string): boolean => {
    if (!memberIdOrName) return false;
    const target = memberIdOrName.trim().toLowerCase();

    // 1. Est-ce l'utilisateur actuellement connecté dans cette session ?
    if (currentUser) {
      if (currentUser.id && currentUser.id.toLowerCase() === target) return true;
      if (currentUser.name && currentUser.name.trim().toLowerCase() === target) return true;
    }

    // 2. Est-ce l'un des utilisateurs connectés diffusés par le serveur WebSocket ?
    if (onlineUsers && onlineUsers.length > 0) {
      return onlineUsers.some((u) => {
        if (!u) return false;
        if (u.id && u.id.toLowerCase() === target) return true;
        if (u.name && u.name.trim().toLowerCase() === target) return true;
        return false;
      });
    }

    return false;
  };

  // Synchronisation des modifications vers les autres clients
  const broadcastState = (newProjects: Project[], newActiveId: string) => {
    const now = new Date().toISOString();
    const stampedProjects = newProjects.map((p) => ({
      ...p,
      updatedAt: p.id === newActiveId ? now : (p.updatedAt || now)
    }));

    // Sauvegarde locale immédiate
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stampedProjects));
      localStorage.setItem(ACTIVE_PROJ_KEY, newActiveId);
    } catch (e) {
      console.error(e);
    }

    // Diffusion WebSocket aux collègues
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isBroadcastingRef.current) {
      try {
        socketRef.current.send(
          JSON.stringify({
            type: 'SYNC_PROJECTS',
            password: authPassword || 'rnf2026',
            memberId: currentUser?.id,
            payload: {
              projects: stampedProjects,
              activeProjectId: newActiveId,
              lastModified: now
            }
          })
        );
      } catch (err) {
        console.warn('[WS] Erreur send broadcastState:', err);
      }
    }

    // Sauvegarde HTTP de sécurité (fallback si WebSocket reconnecte)
    try {
      const isDev = window.location.port === '5173';
      const syncUrl = isDev
        ? `http://${window.location.hostname}:3001/api/projects/sync`
        : '/api/projects/sync';
      fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: authPassword || 'rnf2026',
          memberId: currentUser?.id,
          projects: stampedProjects,
          activeProjectId: newActiveId,
          lastModified: now
        })
      }).catch(() => {});
    } catch {}
  };

  const unlockEditMode = async (password: string, user?: ConnectedUser): Promise<boolean> => {
    const isReadOnlyUser = Boolean(user?.isReadOnly || (user as any)?.isBde || user?.id === 'm-bde');
    const applyUser = () => {
      if (user) {
        const completeUser: ConnectedUser = {
          ...normalizeConnectedUser(user),
          loggedInAt: new Date().toISOString()
        };
        setCurrentUser(completeUser);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(completeUser));
        } catch {}
      }
    };

    const userPasswordsKey = 'rnf_user_passwords_v1';
    let localUserPass: string | undefined = undefined;
    try {
      const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
      if (user?.id && parsed[user.id]) localUserPass = parsed[user.id];
    } catch {}

    const isDefaultBde = user?.id === 'm-bde' && (password === 'bde2026' || password === 'rnf2026');
    const isMasterPass = password === 'rnf2026';
    const isLocalMatch = Boolean(localUserPass && password === localUserPass);

    try {
      const isDev = window.location.port === '5173';
      const apiUrl = isDev
        ? `http://${window.location.hostname}:3001/api/auth/verify`
        : '/api/auth/verify';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, memberId: user?.id })
      });
      if (res.ok) {
        if (isReadOnlyUser) {
          setIsAuthorized(false);
          setAuthPassword('');
          localStorage.removeItem(AUTH_KEY);
        } else {
          setIsAuthorized(true);
          setAuthPassword(password);
          localStorage.setItem(AUTH_KEY, password);
        }
        if (user?.id) {
          try {
            const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
            parsed[user.id] = password;
            localStorage.setItem(userPasswordsKey, JSON.stringify(parsed));
          } catch {}
        }
        applyUser();
        setIsAuthModalOpen(false);
        return true;
      }
    } catch (e) {
      console.warn('[Auth] Erreur appel API verify:', e);
    }

    // Fallback de sécurité : si le serveur a un souci ou n'a pas encore enregistré le mot de passe, vérifier en local
    if (isLocalMatch || isDefaultBde || isMasterPass) {
      if (isReadOnlyUser) {
        setIsAuthorized(false);
        setAuthPassword('');
        localStorage.removeItem(AUTH_KEY);
      } else {
        setIsAuthorized(true);
        setAuthPassword(password);
        localStorage.setItem(AUTH_KEY, password);
      }
      if (user?.id) {
        try {
          const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
          parsed[user.id] = password;
          localStorage.setItem(userPasswordsKey, JSON.stringify(parsed));
        } catch {}
        // Tenter de réhydrater le mot de passe sur le serveur en arrière-plan
        try {
          const isDev = window.location.port === '5173';
          const changeUrl = isDev
            ? `http://${window.location.hostname}:3001/api/auth/change-password`
            : '/api/auth/change-password';
          fetch(changeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: 'rnf2026', newPassword: password, memberId: user.id })
          }).catch(() => {});
        } catch {}
      }
      applyUser();
      setIsAuthModalOpen(false);
      return true;
    }

    return false;
  };

  const lockEditMode = () => {
    setIsAuthorized(false);
    setAuthPassword('');
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    if (viewMode === 'ideas' || viewMode === 'messages') {
      setViewMode('home');
    }
  };

  const changePassword = async (oldPass: string, newPass: string, memberId?: string): Promise<{ success: boolean; message?: string }> => {
    const targetMemberId = memberId || currentUser?.id;
    try {
      const isDev = window.location.port === '5173';
      const apiUrl = isDev
        ? `http://${window.location.hostname}:3001/api/auth/change-password`
        : '/api/auth/change-password';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass, memberId: targetMemberId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthPassword(newPass);
        localStorage.setItem(AUTH_KEY, newPass);
        if (targetMemberId) {
          try {
            const userPasswordsKey = 'rnf_user_passwords_v1';
            const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
            parsed[targetMemberId] = newPass;
            localStorage.setItem(userPasswordsKey, JSON.stringify(parsed));
          } catch {}
        }
        return { success: true };
      }
      return { success: false, message: data.message || 'Mot de passe invalide' };
    } catch {
      // Mode offline
      if (oldPass === authPassword || oldPass === 'rnf2026') {
        setAuthPassword(newPass);
        localStorage.setItem(AUTH_KEY, newPass);
        if (targetMemberId) {
          try {
            const userPasswordsKey = 'rnf_user_passwords_v1';
            const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
            parsed[targetMemberId] = newPass;
            localStorage.setItem(userPasswordsKey, JSON.stringify(parsed));
          } catch {}
        }
        return { success: true };
      }
      return { success: false, message: 'Erreur réseau ou mot de passe incorrect' };
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || DEFAULT_PROJECT;
  const members = ensureAllDefaultMembers(currentProject.members);

  const updateCurrentProjectTasks = (updater: (prevTasks: Task[]) => Task[]) => {
    const updatedProjects = projects.map((proj) => {
      if (proj.id !== currentProject.id) return proj;
      const newTasks = updater(proj.tasks || []);
      return {
        ...proj,
        tasks: sortTasksChronologically(newTasks)
      };
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const catDef = getCategoryDefinition(taskData.category || STANDARD_CATEGORIES[0].label);
    const newGanttId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newRetroId = taskData.eventId ? `rtask-${Date.now()}` : undefined;

    const newTask: Task = normalizeTask({
      ...taskData,
      id: newGanttId,
      category: catDef.label,
      color: taskData.color || catDef.color,
      retroTaskId: newRetroId
    });

    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        let updatedEvents = p.events || [];
        if (newTask.eventId) {
          const targetEvt = updatedEvents.find((e) => e.id === newTask.eventId);
          if (targetEvt) {
            newTask.eventTitle = targetEvt.title;
            const newRetroTask: RetroplanningTask = {
              id: newRetroId!,
              weekLabel: newTask.weekLabel || 'S40',
              category: newTask.category || STANDARD_CATEGORIES[0].label,
              action: newTask.title,
              assignee: newTask.assignee || 'Toute l’équipe',
              status: newTask.isMilestone ? 'event' : newTask.status === 'completed' ? 'completed' : newTask.status === 'in_progress' ? 'in_progress' : 'todo',
              isEventHighlight: Boolean(newTask.isMilestone),
              ganttTaskId: newGanttId
            };
            updatedEvents = updatedEvents.map((e) =>
              e.id === newTask.eventId
                ? { ...e, tasks: [...(e.tasks || []), newRetroTask] }
                : e
            );
          }
        }
        const nextProject: Project = {
          ...p,
          updatedAt: new Date().toISOString(),
          tasks: [...(p.tasks || []), newTask],
          events: updatedEvents
        };
        return reconcileProjectTasksAndEvents(nextProject);
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const updateTask = (updatedTask: Task) => {
    const catDef = getCategoryDefinition(updatedTask.category || STANDARD_CATEGORIES[0].label);
    const normalizedTask: Task = normalizeTask({
      ...updatedTask,
      category: catDef.label,
      color: updatedTask.color || catDef.color
    });

    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        let updatedEvents = p.events || [];

        // Synchroniser vers le rétroplanning si la tâche est rattachée à un événement
        if (normalizedTask.eventId) {
          const targetEvt = updatedEvents.find((e) => e.id === normalizedTask.eventId);
          if (targetEvt) {
            normalizedTask.eventTitle = targetEvt.title;
            updatedEvents = updatedEvents.map((e) => {
              if (e.id === normalizedTask.eventId) {
                const retroExists = (e.tasks || []).some(
                  (rt) => rt.id === normalizedTask.retroTaskId || rt.ganttTaskId === normalizedTask.id || rt.id === normalizedTask.id
                );

                if (retroExists) {
                  return {
                    ...e,
                    tasks: (e.tasks || []).map((rt) => {
                      if (rt.id === normalizedTask.retroTaskId || rt.ganttTaskId === normalizedTask.id || rt.id === normalizedTask.id) {
                        return {
                          ...rt,
                          action: normalizedTask.title,
                          category: normalizedTask.category || rt.category || STANDARD_CATEGORIES[0].label,
                          assignee: normalizedTask.assignee || rt.assignee,
                          weekLabel: normalizedTask.weekLabel || rt.weekLabel,
                          status: normalizedTask.status === 'completed'
                            ? 'completed'
                            : normalizedTask.status === 'in_progress'
                            ? 'in_progress'
                            : rt.status === 'event'
                            ? 'event'
                            : 'todo',
                          ganttTaskId: normalizedTask.id
                        };
                      }
                      return rt;
                    })
                  };
                } else {
                  const newRetroTask: RetroplanningTask = {
                    id: normalizedTask.retroTaskId || `rtask-${Date.now()}`,
                    weekLabel: normalizedTask.weekLabel || 'S40',
                    category: normalizedTask.category || STANDARD_CATEGORIES[0].label,
                    action: normalizedTask.title,
                    assignee: normalizedTask.assignee || 'Toute l’équipe',
                    status: normalizedTask.status === 'completed'
                      ? 'completed'
                      : normalizedTask.status === 'in_progress'
                      ? 'in_progress'
                      : 'todo',
                    ganttTaskId: normalizedTask.id
                  };
                  return {
                    ...e,
                    tasks: [...(e.tasks || []), newRetroTask]
                  };
                }
              }
              return e;
            });
          }
        }

        const nextProject: Project = {
          ...p,
          updatedAt: new Date().toISOString(),
          tasks: (p.tasks || []).map((t) => (t.id === normalizedTask.id ? normalizedTask : t)),
          events: updatedEvents
        };

        return reconcileProjectTasksAndEvents(nextProject);
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const deleteTask = (taskId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          updatedAt: new Date().toISOString(),
          tasks: (p.tasks || []).filter((t) => t.id !== taskId),
          events: (p.events || []).map((e) => ({
            ...e,
            tasks: (e.tasks || []).filter(
              (rt) => rt.ganttTaskId !== taskId && rt.id !== taskId
            )
          }))
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const duplicateTask = (taskId: string) => {
    const original = currentProject.tasks.find((t) => t.id === taskId);
    if (!original) return;
    const copy: Task = {
      ...original,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: `${original.title} (Copie)`
    };
    updateCurrentProjectTasks((prev) => [...prev, copy]);
  };

  const clearAllTasks = () => {
    updateCurrentProjectTasks(() => []);
  };

  const createNewProject = (name: string, description?: string) => {
    const newProj: Project = {
      id: 'proj_' + Date.now(),
      name: name.trim() || 'Nouveau Planning',
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      tasks: [],
      members: DEFAULT_TEAM_MEMBERS
    };
    const nextProjects = [...projects, newProj];
    setProjects(nextProjects);
    setActiveProjectId(newProj.id);
    broadcastState(nextProjects, newProj.id);
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert('Vous devez conserver au moins un planning.');
      return;
    }
    const filtered = projects.filter((p) => p.id !== id);
    const nextActive = activeProjectId === id ? filtered[0].id : activeProjectId;
    setProjects(filtered);
    setActiveProjectId(nextActive);
    broadcastState(filtered, nextActive);
  };

  const updateProjectMeta = (name: string, description?: string) => {
    const nextProjects = projects.map((p) =>
      p.id === currentProject.id
        ? { ...p, name: name.trim() || p.name, description: description ?? p.description }
        : p
    );
    setProjects(nextProjects);
    broadcastState(nextProjects, activeProjectId);
  };

  const addTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: 'm_' + Date.now()
    };
    const nextProjects = projects.map((p) =>
      p.id === currentProject.id
        ? { ...p, members: [...(p.members || DEFAULT_TEAM_MEMBERS), newMember] }
        : p
    );
    setProjects(nextProjects);
    broadcastState(nextProjects, activeProjectId);
  };

  const deleteTeamMember = (memberId: string) => {
    const nextProjects = projects.map((p) =>
      p.id === currentProject.id
        ? {
            ...p,
            members: (p.members || DEFAULT_TEAM_MEMBERS).filter((m) => m.id !== memberId),
            tasks: (p.tasks || []).map((t) =>
              t.assigneeId === memberId
                ? { ...t, assigneeId: undefined, assignee: undefined }
                : t
            )
          }
        : p
    );
    setProjects(nextProjects);
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
    }
    broadcastState(nextProjects, activeProjectId);
  };

  const openNewTaskModal = (defaultDate?: string) => {
    setEditingTask(null);
    setDefaultDateForNewTask(defaultDate || null);
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setDefaultDateForNewTask(null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setDefaultDateForNewTask(null);
  };

  // --- Gestion du Rétroplanning par Événements (style Excel) ---
  const addRetroEvent = (eventData: Omit<RetroplanningEvent, 'id'>) => {
    const newEvent: RetroplanningEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      tasks: eventData.tasks || []
    };
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: sortRetroEventsChronologically([...(p.events || []), newEvent])
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const updateRetroEvent = (updatedEvent: RetroplanningEvent) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: sortRetroEventsChronologically((p.events || []).map((e) => (e.id === updatedEvent.id ? updatedEvent : e)))
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const deleteRetroEvent = (eventId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: (p.events || []).filter((e) => e.id !== eventId)
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const addRetroTask = (eventId: string, taskData: Omit<RetroplanningTask, 'id'>) => {
    const newRetroId = `rtask-${Date.now()}`;
    const newGanttId = `gtask-${Date.now()}`;
    const dates = weekLabelToDates(taskData.weekLabel);
    const catDef = getCategoryDefinition(taskData.category || STANDARD_CATEGORIES[0].label);

    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        const targetEvent = (p.events || []).find((e) => e.id === eventId);
        const eventTitle = targetEvent?.title || '';

        const newRetroTask: RetroplanningTask = {
          ...taskData,
          id: newRetroId,
          ganttTaskId: newGanttId
        };

        const newGanttTask: Task = normalizeTask({
          id: newGanttId,
          title: taskData.action,
          startDate: dates.startDate,
          endDate: dates.endDate,
          color: catDef.color,
          status: (taskData.status === 'completed' || taskData.status === 'event'
            ? 'completed'
            : taskData.status === 'in_progress'
            ? 'in_progress'
            : 'todo') as TaskStatus,
          priority: 'medium',
          progress: taskData.status === 'completed' || taskData.status === 'event' ? 100 : taskData.status === 'in_progress' ? 50 : 0,
          category: catDef.label,
          assignee: cleanAssigneeName(taskData.assignee) || taskData.assignee,
          isMilestone: Boolean(taskData.isEventHighlight || taskData.status === 'event'),
          eventId: eventId,
          eventTitle: eventTitle,
          weekLabel: taskData.weekLabel,
          retroTaskId: newRetroId
        });

        const nextProject: Project = {
          ...p,
          updatedAt: new Date().toISOString(),
          tasks: [...(p.tasks || []), newGanttTask],
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: [...(e.tasks || []), newRetroTask]
              };
            }
            return e;
          })
        };

        return reconcileProjectTasksAndEvents(nextProject);
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const updateRetroTask = (eventId: string, updatedTask: RetroplanningTask) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        const targetEvent = (p.events || []).find((e) => e.id === eventId);
        const eventTitle = targetEvent?.title || '';
        const catDef = getCategoryDefinition(updatedTask.category || STANDARD_CATEGORIES[0].label);
        const dates = weekLabelToDates(updatedTask.weekLabel);

        // Synchronisation vers Gantt : si la tâche Gantt existe, la mettre à jour, sinon la créer !
        let ganttTaskFound = false;
        const updatedTasks = (p.tasks || []).map((gt) => {
          if (
            (updatedTask.ganttTaskId && gt.id === updatedTask.ganttTaskId) ||
            (gt.retroTaskId && gt.retroTaskId === updatedTask.id) ||
            gt.id === updatedTask.id ||
            (gt.eventId === eventId && gt.title.toLowerCase().trim() === updatedTask.action.toLowerCase().trim())
          ) {
            ganttTaskFound = true;
            return normalizeTask({
              ...gt,
              title: updatedTask.action,
              category: catDef.label,
              color: catDef.color,
              assignee: cleanAssigneeName(updatedTask.assignee) || gt.assignee,
              startDate: dates.startDate,
              endDate: dates.endDate,
              weekLabel: updatedTask.weekLabel,
              eventId: eventId,
              eventTitle: eventTitle,
              retroTaskId: updatedTask.id,
              status: (updatedTask.status === 'completed'
                ? 'completed'
                : updatedTask.status === 'in_progress'
                ? 'in_progress'
                : updatedTask.status === 'event'
                ? 'completed'
                : 'todo') as TaskStatus,
              progress: updatedTask.status === 'completed' || updatedTask.status === 'event'
                ? 100
                : updatedTask.status === 'in_progress'
                ? (gt.progress === 100 ? 50 : gt.progress || 50)
                : 0,
              isMilestone: Boolean(updatedTask.isEventHighlight || updatedTask.status === 'event')
            });
          }
          return gt;
        });

        if (!ganttTaskFound) {
          const newGanttId = updatedTask.ganttTaskId || `gtask-${Date.now()}`;
          updatedTask.ganttTaskId = newGanttId;
          const newGanttTask: Task = normalizeTask({
            id: newGanttId,
            title: updatedTask.action,
            startDate: dates.startDate,
            endDate: dates.endDate,
            color: catDef.color,
            status: (updatedTask.status === 'completed' || updatedTask.status === 'event'
              ? 'completed'
              : updatedTask.status === 'in_progress'
              ? 'in_progress'
              : 'todo') as TaskStatus,
            priority: 'medium',
            progress: updatedTask.status === 'completed' || updatedTask.status === 'event' ? 100 : updatedTask.status === 'in_progress' ? 50 : 0,
            category: catDef.label,
            assignee: cleanAssigneeName(updatedTask.assignee),
            isMilestone: Boolean(updatedTask.isEventHighlight || updatedTask.status === 'event'),
            eventId: eventId,
            eventTitle: eventTitle,
            weekLabel: updatedTask.weekLabel,
            retroTaskId: updatedTask.id
          });
          updatedTasks.push(newGanttTask);
        }

        const nextProject: Project = {
          ...p,
          updatedAt: new Date().toISOString(),
          tasks: updatedTasks,
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: (e.tasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t))
              };
            }
            return e;
          })
        };

        return reconcileProjectTasksAndEvents(nextProject);
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const deleteRetroTask = (eventId: string, taskId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        const nextProject: Project = {
          ...p,
          updatedAt: new Date().toISOString(),
          // Supprime aussi la tâche Gantt liée
          tasks: (p.tasks || []).filter((t) => t.retroTaskId !== taskId && t.id !== taskId),
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: (e.tasks || []).filter((t) => t.id !== taskId && t.ganttTaskId !== taskId)
              };
            }
            return e;
          })
        };
        return reconcileProjectTasksAndEvents(nextProject);
      }
      return p;
    });

    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const exportProjectJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_planning.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importProjectJson = (content: string): boolean => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed) throw new Error('Contenu vide ou invalide');

      // Sauvegarde du point actuel dans le coffre local avant import
      saveLocalVaultSnapshot(projectsRef.current, 'Avant import JSON');

      // Cas 1 : Export complet de la base de données { projects: [...], activeProjectId: ... }
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        const validProjects = parsed.projects.map((p: Project) => reconcileProjectTasksAndEvents(p));
        const targetActive = (parsed.activeProjectId && validProjects.some((p: Project) => p.id === parsed.activeProjectId))
          ? parsed.activeProjectId
          : validProjects[0].id;

        setProjects(validProjects);
        setActiveProjectId(targetActive);
        broadcastState(validProjects, targetActive);
        return true;
      }

      // Cas 2 : Export d’un projet individuel { tasks: [...], events: [...] }
      if (Array.isArray(parsed.tasks)) {
        const rawImported: Project = {
          id: parsed.id || 'proj_' + Date.now(),
          name: parsed.name ? `${parsed.name} (Restauré)` : 'Planning Restauré',
          description: parsed.description || '',
          createdAt: parsed.createdAt || new Date().toISOString(),
          tasks: parsed.tasks || [],
          members: parsed.members || [],
          events: parsed.events || []
        };
        const imported = reconcileProjectTasksAndEvents(rawImported);
        const nextProjects = [...projects.filter((p) => p.id !== imported.id), imported];
        setProjects(nextProjects);
        setActiveProjectId(imported.id);
        broadcastState(nextProjects, imported.id);
        return true;
      }

      throw new Error('Structure JSON non reconnue (manque "projects" ou "tasks")');
    } catch (err) {
      console.error('[Import JSON] Erreur:', err);
      return false;
    }
  };

  const importProjectFromExcel = async (file: File): Promise<boolean> => {
    try {
      const result = await parseExcelPlanning(file);
      if (!result.success || result.events.length === 0) {
        alert(result.message);
        return false;
      }

      // Sauvegarder l'état actuel dans le coffre local
      saveLocalVaultSnapshot(projectsRef.current, `Avant import Excel (${file.name})`);

      const updatedProjects = projects.map((p) => {
        if (p.id !== activeProjectId) return p;

        const currentEvents = p.events || [];
        const mergedEvents = [...currentEvents];

        result.events.forEach((impEv) => {
          const existingIdx = mergedEvents.findIndex(
            (e) => e.id === impEv.id || e.title.toLowerCase().trim() === impEv.title.toLowerCase().trim()
          );
          if (existingIdx >= 0) {
            // Met à jour l'événement existant avec les nouvelles tâches
            mergedEvents[existingIdx] = {
              ...mergedEvents[existingIdx],
              ...impEv,
              tasks: sortRetroTasksChronologically(impEv.tasks)
            };
          } else {
            mergedEvents.push(impEv);
          }
        });

        const nextProject: Project = {
          ...p,
          events: sortRetroEventsChronologically(mergedEvents),
          updatedAt: new Date().toISOString()
        };
        return reconcileProjectTasksAndEvents(nextProject);
      });

      setProjects(updatedProjects);
      broadcastState(updatedProjects, activeProjectId);
      return true;
    } catch (err: any) {
      console.error('[Import Excel] Erreur:', err);
      return false;
    }
  };

  return (
    <PlanningContext.Provider
      value={{
        projects,
        currentProject,
        activeProjectId,
        viewMode,
        zoom,
        searchQuery,
        selectedColor,
        selectedMemberId,
        isTaskModalOpen,
        editingTask,
        defaultDateForNewTask,
        currentUser,
        setCurrentUser,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        theme,
        setTheme,
        toggleTheme,
        retroActiveTab,
        setRetroActiveTab,
        onlineCount,
        onlineUsers,
        isMemberOnline,
        isWebSocketConnected,
        serverInfo,
        members,
        setViewMode,
        setZoom,
        setSearchQuery,
        setSelectedColor,
        setSelectedMemberId,
        setActiveProjectId,
        createNewProject,
        deleteProject,
        updateProjectMeta,
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        clearAllTasks,
        openNewTaskModal,
        openEditTaskModal,
        closeTaskModal,
        addTeamMember,
        deleteTeamMember,
        isAuthorized,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        unlockEditMode,
        lockEditMode,
        changePassword,
        addRetroEvent,
        updateRetroEvent,
        deleteRetroEvent,
        addRetroTask,
        updateRetroTask,
        deleteRetroTask,
        exportProjectJson,
        importProjectJson,
        importProjectFromExcel,
        vaultSnapshots,
        createVaultSnapshot,
        restoreVaultSnapshot,
        isBackupModalOpen,
        setIsBackupModalOpen,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning doit être utilisé au sein d’un PlanningProvider');
  }
  return context;
};
