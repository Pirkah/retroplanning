import React, { useState, useMemo } from 'react';
import { usePlanning } from '../../context/PlanningContext';
import { Task, RetroplanningTask, TeamMember, ConnectedUser } from '../../types/planning';
import {
  CheckCircle2,
  Circle,
  Calendar,
  CheckSquare,
  ArrowRight,
  User,
  Sparkles,
  Clock,
  Plus,
  FileSpreadsheet,
  GanttChartSquare,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Lock,
  Filter,
  Users
} from 'lucide-react';
import { formatDateFr, parseRetroWeekTimestamp, getCategoryInfo } from '../../utils/scheduler';
import { getCategoryStyle } from '../../utils/categories';

interface PersonalItem {
  id: string;
  source: 'gantt' | 'retro';
  title: string;
  category?: string;
  dateLabel: string;
  timestamp: number;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'event';
  priority?: 'low' | 'medium' | 'high';
  isMilestone?: boolean;
  isTeamTask?: boolean;
  eventTitle?: string;
  eventId?: string;
  rawGanttTask?: Task;
  rawRetroTask?: RetroplanningTask;
}

export function isTaskAssignedToMember(
  taskAssignee?: string,
  taskAssigneeId?: string,
  member?: TeamMember | ConnectedUser | null
): boolean {
  if (!member) return false;
  if (taskAssigneeId && member.id && taskAssigneeId === member.id) return true;
  if (!taskAssignee) return false;

  const a = taskAssignee.toLowerCase().trim();
  const mName = (member.name || '').toLowerCase().trim();
  if (a === mName) return true;

  const firstName = mName.split(' ')[0];
  if (firstName && firstName.length > 2 && (a === firstName || a.startsWith(firstName) || a.includes(firstName))) {
    return true;
  }

  // Prise en compte Théo / Tetew / Theo
  if (
    (mName.includes('théo') || mName.includes('theo') || mName.includes('tetew')) &&
    (a.includes('théo') || a.includes('theo') || a.includes('tetew'))
  ) {
    return true;
  }

  return false;
}

export const PersonalTasksHub: React.FC = () => {
  const {
    currentProject,
    currentUser,
    members,
    isAuthorized,
    openAuthModal,
    openEditTaskModal,
    openNewTaskModal,
    updateTask,
    updateRetroTask,
    setViewMode,
    setRetroActiveTab
  } = usePlanning();

  // Membre actif : soit l'utilisateur actuellement connecté, soit le premier membre sélectionné
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (currentUser?.id) return currentUser.id;
    if (currentUser?.name) {
      const match = members.find((m) => isTaskAssignedToMember(currentUser.name, currentUser.id, m));
      if (match) return match.id;
    }
    return members[0]?.id || 'm-vianney';
  });

  // Filtre d'état : 'todo' (par défaut), 'completed', 'all'
  const [statusFilter, setStatusFilter] = useState<'todo' | 'completed' | 'all'>('todo');

  // Filtre de source : 'all', 'gantt', 'retro'
  const [sourceFilter, setSourceFilter] = useState<'all' | 'gantt' | 'retro'>('all');

  // Inclure les tâches collectives "Toute l'équipe"
  const [includeTeamTasks, setIncludeTeamTasks] = useState<boolean>(false);

  // Synchroniser avec currentUser dès qu'il change
  React.useEffect(() => {
    if (currentUser?.id) {
      setSelectedMemberId(currentUser.id);
    } else if (currentUser?.name) {
      const match = members.find((m) => isTaskAssignedToMember(currentUser.name, currentUser.id, m));
      if (match) setSelectedMemberId(match.id);
    }
  }, [currentUser, members]);

  const activeMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || members[0] || null;
  }, [members, selectedMemberId]);

  const isMe = Boolean(
    currentUser &&
    activeMember &&
    (currentUser.id === activeMember.id ||
     currentUser.name.toLowerCase().trim() === activeMember.name.toLowerCase().trim())
  );

  // Extraction de toutes les tâches personnelles (Gantt + Rétroplanning)
  const allPersonalItems = useMemo(() => {
    if (!activeMember) return [];
    const items: PersonalItem[] = [];

    // 1. Tâches du planning principal (Gantt)
    (currentProject.tasks || []).forEach((t) => {
      const isDirect = isTaskAssignedToMember(t.assignee, t.assigneeId, activeMember);
      const isTeam = (t.assignee?.toLowerCase().includes('équipe') || t.assignee?.toLowerCase().includes('equipe')) ?? false;

      if (isDirect || (includeTeamTasks && isTeam)) {
        const startTs = t.startDate ? new Date(t.startDate).getTime() : 9999999999999;
        const dateStr = t.endDate && t.endDate !== t.startDate
          ? `${formatDateFr(t.startDate, 'dd MMM')} - ${formatDateFr(t.endDate, 'dd MMM yyyy')}`
          : formatDateFr(t.startDate, 'dd MMM yyyy');

        items.push({
          id: `gantt-${t.id}`,
          source: 'gantt',
          title: t.title,
          category: t.category,
          dateLabel: dateStr,
          timestamp: startTs,
          status: t.status,
          priority: t.priority,
          isMilestone: t.isMilestone,
          isTeamTask: !isDirect && isTeam,
          rawGanttTask: t
        });
      }
    });

    // 2. Actions du rétroplanning par événements
    (currentProject.events || []).forEach((evt) => {
      (evt.tasks || []).forEach((rt) => {
        const isDirect = isTaskAssignedToMember(rt.assignee, undefined, activeMember);
        const isTeam = (rt.assignee?.toLowerCase().includes('équipe') || rt.assignee?.toLowerCase().includes('equipe')) ?? false;

        if (isDirect || (includeTeamTasks && isTeam)) {
          const ts = parseRetroWeekTimestamp(rt.weekLabel);
          items.push({
            id: `retro-${evt.id}-${rt.id}`,
            source: 'retro',
            title: rt.action,
            category: rt.category,
            dateLabel: rt.weekLabel,
            timestamp: ts,
            status: rt.status,
            eventTitle: evt.title,
            eventId: evt.id,
            isTeamTask: !isDirect && isTeam,
            rawRetroTask: rt
          });
        }
      });
    });

    // Tri chronologique strict
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }, [currentProject, activeMember, includeTeamTasks]);

  // Filtrage selon le statut et la source
  const filteredItems = useMemo(() => {
    return allPersonalItems.filter((item) => {
      // Filtre source
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;

      // Filtre statut
      if (statusFilter === 'todo') {
        return item.status !== 'completed';
      }
      if (statusFilter === 'completed') {
        return item.status === 'completed';
      }
      return true;
    });
  }, [allPersonalItems, statusFilter, sourceFilter]);

  // Statistiques
  const todoCount = allPersonalItems.filter((i) => i.status !== 'completed').length;
  const completedCount = allPersonalItems.filter((i) => i.status === 'completed').length;
  const totalCount = allPersonalItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Clic sur la case à cocher (toggle completed / in_progress)
  const handleToggleStatus = (item: PersonalItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthorized) {
      openAuthModal();
      return;
    }

    if (item.source === 'gantt' && item.rawGanttTask) {
      const newStatus = item.rawGanttTask.status === 'completed' ? 'in_progress' : 'completed';
      const newProgress = newStatus === 'completed' ? 100 : item.rawGanttTask.progress === 100 ? 50 : item.rawGanttTask.progress;
      updateTask({
        ...item.rawGanttTask,
        status: newStatus,
        progress: newProgress
      });
    } else if (item.source === 'retro' && item.rawRetroTask && item.eventId) {
      const newStatus = item.rawRetroTask.status === 'completed' ? 'todo' : 'completed';
      updateRetroTask(item.eventId, {
        ...item.rawRetroTask,
        status: newStatus
      });
    }
  };

  // Clic sur une ligne pour ouvrir l'élément
  const handleItemClick = (item: PersonalItem) => {
    if (item.source === 'gantt' && item.rawGanttTask) {
      openEditTaskModal(item.rawGanttTask);
    } else if (item.source === 'retro' && item.eventId) {
      setViewMode('retroplanning');
      setRetroActiveTab(item.eventId);
    }
  };

  if (!activeMember) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-900/60 shadow-md overflow-hidden transition-all animate-fadeIn">
      {/* 1. EN-TÊTE SUPÉRIEUR AVEC IDENTITÉ DU PROFIL & STATUT */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md ring-2 ring-white/20 shrink-0"
              style={{ backgroundColor: activeMember.color || '#6366F1' }}
            >
              {activeMember.initials || activeMember.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{isMe ? 'Mes Tâches Personnelles' : `Tâches de ${activeMember.name}`}</span>
                </h2>
                {isMe ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck size={11} className="text-emerald-400" />
                    <span>Votre profil</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/15">
                    {activeMember.role}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5 font-medium">
                Affichage filtré : uniquement les missions confiées à ce profil, sans voir celles des autres.
              </p>
            </div>
          </div>

          {/* Statistiques rapides & Barre d'avancement */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shrink-0 self-start lg:self-auto">
            <div className="text-center pr-3 border-r border-white/15">
              <span className="block text-lg font-black text-amber-300">{todoCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">À faire</span>
            </div>
            <div className="text-center pr-3 border-r border-white/15">
              <span className="block text-lg font-black text-emerald-400">{completedCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Terminées</span>
            </div>
            <div className="w-28 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-200">
                <span>Avancement</span>
                <span className="text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. SÉLECTEUR RAPIDE DE MEMBRES (POUR BASCULER SANS CHANGER DE PAGE) */}
        <div className="mt-4 pt-3 border-t border-indigo-800/80 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <span className="text-[11px] font-bold text-indigo-300 shrink-0 flex items-center gap-1 mr-1">
            <User size={12} />
            <span>Changer de profil :</span>
          </span>
          {members.map((m) => {
            const isSelected = m.id === activeMember.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-white text-indigo-950 shadow-sm ring-2 ring-indigo-400 font-black'
                    : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 hover:text-white border border-indigo-800/60'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color || '#6366F1' }}
                />
                <span>{m.name.split(' ')[0]}</span>
                {currentUser?.id === m.id && (
                  <span className="text-[9px] px-1 rounded bg-indigo-100 text-indigo-800 font-black">MOI</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BARRE DE FILTRES (STATUT & SOURCE) */}
      <div className="p-4 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtres de statut */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'todo'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock size={13} className="text-amber-500" />
              <span>À faire ({todoCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span>Terminées ({completedCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Toutes ({totalCount})
            </button>
          </div>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          {/* Filtres de source */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                sourceFilter === 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setSourceFilter('gantt')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                sourceFilter === 'gantt'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <GanttChartSquare size={13} />
              <span>Gantt</span>
            </button>
            <button
              onClick={() => setSourceFilter('retro')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                sourceFilter === 'retro'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>Rétroplanning</span>
            </button>
          </div>
        </div>

        {/* Options secondaires : inclure collectif & bouton ajout */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeTeamTasks}
              onChange={(e) => setIncludeTeamTasks(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
            />
            <span className="text-[11px] font-medium">Inclure tâches collectives</span>
          </label>

          <button
            onClick={() => {
              if (!isAuthorized) {
                openAuthModal();
              } else {
                openNewTaskModal();
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Créer une nouvelle tâche dans le planning"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Ajouter une tâche</span>
          </button>
        </div>
      </div>

      {/* 4. LISTE DES TÂCHES STRICTEMENT PERSONNELLES */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              {statusFilter === 'todo' ? <Sparkles size={24} /> : <CheckCircle2 size={24} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {statusFilter === 'todo'
                  ? '🎉 Aucune tâche à faire en attente !'
                  : statusFilter === 'completed'
                  ? 'Aucune tâche marquée comme terminée.'
                  : 'Aucune tâche trouvée pour ce profil.'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {statusFilter === 'todo'
                  ? `Toutes les missions de ${activeMember.name} sont validées ou vous n'avez pas de tâche en cours actuellement.`
                  : 'Modifiez vos filtres ou ajoutez une nouvelle mission pour ce collaborateur.'}
              </p>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === 'completed';
            const catStyle = getCategoryStyle(item.category || '');

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 sm:p-4 hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-3.5 group ${
                  isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75' : 'bg-white dark:bg-slate-900'
                }`}
              >
                {/* Case à cocher pour validation directe */}
                <button
                  onClick={(e) => handleToggleStatus(item, e)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-transparent hover:text-emerald-500'
                  }`}
                  title={isCompleted ? 'Marquer comme non terminé' : 'Valider cette tâche (terminée)'}
                >
                  <CheckCircle2 size={16} />
                </button>

                {/* Corps de la tâche */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Badge source : Gantt ou Rétroplanning */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        item.source === 'gantt'
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {item.source === 'gantt' ? (
                        <>
                          <GanttChartSquare size={10} />
                          <span>Planning Gantt</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet size={10} />
                          <span>Rétroplanning</span>
                        </>
                      )}
                    </span>

                    {/* Badge de catégorie */}
                    {item.category && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catStyle.bgBadge} ${catStyle.textBadge}`}>
                        {item.category}
                      </span>
                    )}

                    {/* Événement parent si rétroplanning */}
                    {item.eventTitle && (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {item.eventTitle}
                      </span>
                    )}

                    {/* Badge collectif si tâche d'équipe */}
                    {item.isTeamTask && (
                      <span className="text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded">
                        Équipe
                      </span>
                    )}

                    {/* Badge jalon */}
                    {item.isMilestone && (
                      <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                        Jalon Clé
                      </span>
                    )}
                  </div>

                  {/* Titre / Action */}
                  <h4
                    className={`text-xs sm:text-sm font-bold leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                      isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.title}
                  </h4>

                  {/* Date & Priorité */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
                      <Calendar size={12} className="text-indigo-500" />
                      <span>{item.dateLabel}</span>
                    </span>

                    {item.priority && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.priority === 'high'
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900'
                            : item.priority === 'medium'
                            ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900'
                            : 'text-slate-600 bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        Priorité {item.priority === 'high' ? 'Haute' : item.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    )}

                    <span className="text-slate-400 dark:text-slate-500">
                      {isCompleted ? '✅ Terminée' : item.status === 'in_progress' ? '⚡ En cours' : '📋 À faire'}
                    </span>
                  </div>
                </div>

                {/* Flèche d'accès rapide au détail */}
                <div className="self-center text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. PIED DU MODULE : RAPPEL D'ACCÈS RAPIDE */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles size={13} className="text-amber-500" />
          <span>Cliquez sur une tâche pour afficher sa fiche complète ou sur la case pour la valider.</span>
        </span>

        <button
          onClick={() => setViewMode('list')}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
        >
          <span>Voir l'échéancier global</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
