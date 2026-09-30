import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  Task,
  ViewMode,
  TimelineZoom,
  TeamMember,
  ConnectedUser,
  DEFAULT_TEAM_MEMBERS,
  RetroplanningEvent,
  RetroplanningTask
} from '../types/planning';
import { DEFAULT_PROJECT } from '../data/defaultProject';
import { sortTasksChronologically, sortRetroEventsChronologically, sortRetroTasksChronologically } from '../utils/scheduler';
import { getCategoryDefinition, getCategoryColor, STANDARD_CATEGORIES } from '../utils/categories';

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

  // Import / Export
  exportProjectJson: () => void;
  importProjectJson: (content: string) => boolean;
}

const STORAGE_KEY = 'retroplanning_projects_v4';
const ACTIVE_PROJ_KEY = 'retroplanning_active_id_v4';

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

const normalizeMember = (m: TeamMember): TeamMember => {
  let updated = { ...m };
  if (updated.name.toLowerCase() === 'tetew' || updated.id === 'm-tetew') {
    updated = { ...updated, id: 'm-theo', name: 'Théo', initials: 'TH' };
  }
  const id = (updated.id || '').toLowerCase();
  const name = (updated.name || '').toLowerCase();

  if (id === 'm-vianney' || name.includes('vianney')) {
    updated.role = 'Président';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-julien' || name.includes('julien')) {
    updated.role = 'Vice-président';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-theo' || name.includes('théo') || name.includes('theo')) {
    updated.role = 'Chargé de communication interne';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-mathias' || name.includes('mathias')) {
    updated.role = 'Chargé de communication externe';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-sina' || name.includes('sina')) {
    updated.role = 'Chargé de communication externe';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-christelle' || name.includes('christelle') || name.includes('voisin')) {
    updated.id = 'm-christelle';
    updated.name = 'Christelle Voisin';
    updated.role = 'Professeure encadrante';
    updated.initials = 'CV';
    updated.color = updated.color || '#8B5CF6';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-marius' || name.includes('marius') || name.includes('chevalier')) {
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
  if (updated.name?.toLowerCase() === 'tetew' || updated.id === 'm-tetew') {
    updated = { ...updated, id: 'm-theo', name: 'Théo', initials: 'TH' };
  }
  const id = (updated.id || '').toLowerCase();
  const name = (updated.name || '').toLowerCase();

  if (id === 'm-vianney' || name.includes('vianney')) {
    updated.role = 'Président';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-julien' || name.includes('julien')) {
    updated.role = 'Vice-président';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-theo' || name.includes('théo') || name.includes('theo')) {
    updated.role = 'Chargé de communication interne';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-mathias' || name.includes('mathias')) {
    updated.role = 'Chargé de communication externe';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-sina' || name.includes('sina')) {
    updated.role = 'Chargé de communication externe';
    updated.generation = updated.generation || '10ème équipe';
  } else if (id === 'm-christelle' || name.includes('christelle') || name.includes('voisin')) {
    updated.id = 'm-christelle';
    updated.name = 'Christelle Voisin';
    updated.role = 'Professeure encadrante';
    updated.initials = 'CV';
    updated.color = updated.color || '#8B5CF6';
    updated.generation = 'Équipe pédagogique';
    updated.isSupervisor = true;
  } else if (id === 'm-marius' || name.includes('marius') || name.includes('chevalier')) {
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

const normalizeTask = (t: Task): Task => {
  const catDef = getCategoryDefinition(t.category || STANDARD_CATEGORIES[0].label);
  const isTetew = t.assignee?.toLowerCase() === 'tetew' || t.assigneeId === 'm-tetew';
  return {
    ...t,
    category: catDef.label,
    color: catDef.color,
    assignee: isTetew ? 'Théo' : t.assignee,
    assigneeId: isTetew ? 'm-theo' : t.assigneeId
  };
};

const normalizeRetroEvents = (events: RetroplanningEvent[]): RetroplanningEvent[] => {
  return (events || []).map((e) => ({
    ...e,
    tasks: sortRetroTasksChronologically(
      (e.tasks || []).map((t) => ({
        ...t,
        assignee: t.assignee?.toLowerCase() === 'tetew' ? 'Théo' : t.assignee
      }))
    )
  }));
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
            .map((p: Project) => {
              // Ne JAMAIS écraser les événements existants s'ils sont déjà sauvegardés
              const rawEvents = (p.events && p.events.length > 0)
                ? p.events
                : (DEFAULT_PROJECT.events || []);

              // Ne JAMAIS écraser les tâches existantes si elles sont déjà sauvegardées
              const rawTasks = (p.tasks && p.tasks.length > 0)
                ? p.tasks
                : DEFAULT_PROJECT.tasks;

              const rawMembers = (p.members && p.members.length > 0)
                ? p.members
                : DEFAULT_TEAM_MEMBERS;
              const mergedMembers = [...rawMembers];
              if (p.id === 'proj-rnf-2026') {
                DEFAULT_TEAM_MEMBERS.forEach((dm) => {
                  if (!mergedMembers.some((m) => m.id === dm.id || m.name.toLowerCase().includes(dm.name.toLowerCase().split(' ')[0]))) {
                    mergedMembers.push(dm);
                  }
                });
              }
              const normalizedMembers = mergedMembers.map(normalizeMember);
              const normalizedTasks = rawTasks.map(normalizeTask);
              const normalizedEvents = normalizeRetroEvents(rawEvents);

              return {
                ...p,
                updatedAt: p.updatedAt || new Date().toISOString(),
                tasks: sortTasksChronologically(normalizedTasks),
                members: normalizedMembers,
                events: sortRetroEventsChronologically(normalizedEvents)
              };
            });

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
    return [DEFAULT_PROJECT];
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
        const events = (p.events && p.events.length > 0) ? p.events : (DEFAULT_PROJECT.events || []);
        const tasks = (p.tasks && p.tasks.length > 0) ? p.tasks : DEFAULT_PROJECT.tasks;
        const members = (p.members && p.members.length > 0 ? p.members : DEFAULT_TEAM_MEMBERS);
        return {
          ...p,
          updatedAt: p.updatedAt || incomingLastModified || new Date().toISOString(),
          members: members.map(normalizeMember),
          tasks: sortTasksChronologically(tasks.map(normalizeTask)),
          events: sortRetroEventsChronologically(normalizeRetroEvents(events))
        };
      });

    if (validProjects.length === 0) return;

    const targetActiveId = (incomingActiveId && incomingActiveId !== 'proj-gea-2026')
      ? incomingActiveId
      : DEFAULT_PROJECT.id;

    // Si c'est un STATE_UPDATED en direct d'un collègue
    if (source === 'STATE_UPDATED') {
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

    // Pour initialisation (HTTP ou INIT_STATE), vérifier les horodatages
    const serverTime = incomingLastModified
      ? new Date(incomingLastModified).getTime()
      : getLatestProjectTimestamp(validProjects);
    const clientTime = getLatestProjectTimestamp(projectsRef.current);

    // Si le client local possède des données plus récentes (ex: serveur Render redémarré avec un état disque antérieur)
    if (clientTime > serverTime && clientTime > 0) {
      console.log(`[Sync] Le client local possède des données plus récentes (${new Date(clientTime).toISOString()}) que le serveur (${new Date(serverTime).toISOString()}). Restauration vers le serveur.`);
      syncLocalToServer(projectsRef.current, activeProjectIdRef.current);
    } else {
      console.log(`[Sync] Application des données du serveur (${source}).`);
      setProjects(validProjects);
      setActiveProjectId(targetActiveId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validProjects));
        localStorage.setItem(ACTIVE_PROJ_KEY, targetActiveId);
      } catch {}
    }
  }, [syncLocalToServer]);



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
            const userPasswordsKey = 'rnf_user_passwords_v1';
            const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
            parsed[user.id] = password;
            localStorage.setItem(userPasswordsKey, JSON.stringify(parsed));
          } catch {}
        }
        applyUser();
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch {
      const userPasswordsKey = 'rnf_user_passwords_v1';
      let localUserPass: string | undefined = undefined;
      try {
        const parsed = JSON.parse(localStorage.getItem(userPasswordsKey) || '{}');
        if (user?.id && parsed[user.id]) localUserPass = parsed[user.id];
      } catch {}

      const isDefaultBde = user?.id === 'm-bde' && (password === 'bde2026' || password === 'rnf2026');
      if (password === localUserPass || isDefaultBde || password === 'rnf2026') {
        if (isReadOnlyUser) {
          setIsAuthorized(false);
          setAuthPassword('');
          localStorage.removeItem(AUTH_KEY);
        } else {
          setIsAuthorized(true);
          setAuthPassword(password);
          localStorage.setItem(AUTH_KEY, password);
        }
        applyUser();
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    }
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
  const members = currentProject.members || DEFAULT_TEAM_MEMBERS;

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
    const newTask: Task = {
      ...taskData,
      category: catDef.label,
      color: taskData.color || catDef.color,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    };
    updateCurrentProjectTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    const catDef = getCategoryDefinition(updatedTask.category || STANDARD_CATEGORIES[0].label);
    const normalizedTask: Task = {
      ...updatedTask,
      category: catDef.label,
      color: updatedTask.color || catDef.color
    };
    updateCurrentProjectTasks((prev) =>
      prev.map((t) => (t.id === normalizedTask.id ? normalizedTask : t))
    );
  };

  const deleteTask = (taskId: string) => {
    updateCurrentProjectTasks((prev) => prev.filter((t) => t.id !== taskId));
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
    const newTask: RetroplanningTask = {
      ...taskData,
      id: `rtask-${Date.now()}`
    };
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: sortRetroTasksChronologically([...(e.tasks || []), newTask])
              };
            }
            return e;
          })
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const updateRetroTask = (eventId: string, updatedTask: RetroplanningTask) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: sortRetroTasksChronologically(
                  (e.tasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t))
                )
              };
            }
            return e;
          })
        };
      }
      return p;
    });
    setProjects(updatedProjects);
    broadcastState(updatedProjects, activeProjectId);
  };

  const deleteRetroTask = (eventId: string, taskId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          events: (p.events || []).map((e) => {
            if (e.id === eventId) {
              return {
                ...e,
                tasks: (e.tasks || []).filter((t) => t.id !== taskId)
              };
            }
            return e;
          })
        };
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
      if (!parsed || !Array.isArray(parsed.tasks)) {
        throw new Error('Structure JSON invalide (propriété tasks manquante)');
      }
      const imported: Project = {
        id: 'proj_' + Date.now(),
        name: parsed.name ? `${parsed.name} (Importé)` : 'Planning Importé',
        description: parsed.description || '',
        createdAt: new Date().toISOString(),
        tasks: sortTasksChronologically(parsed.tasks),
        members: parsed.members || DEFAULT_TEAM_MEMBERS,
        events: parsed.events || []
      };
      const nextProjects = [...projects, imported];
      setProjects(nextProjects);
      setActiveProjectId(imported.id);
      broadcastState(nextProjects, imported.id);
      return true;
    } catch (err) {
      console.error(err);
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
