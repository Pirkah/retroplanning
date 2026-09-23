import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Project, Task, ViewMode, TimelineZoom, TeamMember, DEFAULT_TEAM_MEMBERS } from '../types/planning';
import { DEFAULT_PROJECT } from '../data/defaultProject';
import { sortTasksChronologically } from '../utils/scheduler';

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

  // Temps réel & Équipe
  onlineCount: number;
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

  // Import / Export
  exportProjectJson: () => void;
  importProjectJson: (content: string) => boolean;
}

const STORAGE_KEY = 'retroplanning_projects_v2';
const ACTIVE_PROJ_KEY = 'retroplanning_active_id_v2';

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            tasks: sortTasksChronologically(p.tasks || []),
            members: p.members || DEFAULT_TEAM_MEMBERS
          }));
        }
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
    return [DEFAULT_PROJECT];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const savedId = localStorage.getItem(ACTIVE_PROJ_KEY);
    return savedId || projects[0]?.id || DEFAULT_PROJECT.id;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [zoom, setZoom] = useState<TimelineZoom>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDateForNewTask, setDefaultDateForNewTask] = useState<string | null>(null);

  // États WebSocket & Présence
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const [serverInfo, setServerInfo] = useState<{ localIp: string; port: number } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const isBroadcastingRef = useRef<boolean>(false);

  // Récupère les infos du serveur pour le partage
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const isDev = window.location.port === '5173';
        const apiUrl = isDev
          ? `http://${window.location.hostname}:3001/api/info`
          : '/api/info';
        const res = await fetch(apiUrl);
        if (res.ok) {
          const data = await res.json();
          setServerInfo({ localIp: data.localIp, port: data.clientPort });
        }
      } catch (err) {
        // Mode hors ligne / pas encore de serveur actif
      }
    };
    fetchInfo();
  }, []);

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
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INIT_STATE' && data.payload) {
              if (data.payload.projects && data.payload.projects.length > 0) {
                setProjects(data.payload.projects);
                if (data.payload.activeProjectId) {
                  setActiveProjectId(data.payload.activeProjectId);
                }
              }
            } else if (data.type === 'STATE_UPDATED' && data.payload) {
              isBroadcastingRef.current = true;
              setProjects(data.payload.projects);
              if (data.payload.activeProjectId) {
                setActiveProjectId(data.payload.activeProjectId);
              }
              setTimeout(() => {
                isBroadcastingRef.current = false;
              }, 50);
            } else if (data.type === 'PRESENCE') {
              setOnlineCount(data.count || 1);
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

  // Synchronisation des modifications vers les autres clients
  const broadcastState = (newProjects: Project[], newActiveId: string) => {
    // Sauvegarde locale
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
      localStorage.setItem(ACTIVE_PROJ_KEY, newActiveId);
    } catch (e) {
      console.error(e);
    }

    // Diffusion WebSocket aux collègues
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && !isBroadcastingRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: 'SYNC_PROJECTS',
          payload: {
            projects: newProjects,
            activeProjectId: newActiveId
          }
        })
      );
    }
  };

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
    const newTask: Task = {
      ...taskData,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    };
    updateCurrentProjectTasks((prev) => [...prev, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    updateCurrentProjectTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
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
        members: parsed.members || DEFAULT_TEAM_MEMBERS
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
        onlineCount,
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
