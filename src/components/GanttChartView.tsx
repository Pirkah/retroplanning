import React, { useMemo, useRef, useEffect, useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { generateWeekColumns, calculateGanttPosition, formatDateFr } from '../utils/scheduler';
import { Sparkles, CheckCircle2, Plus, Clock, User, ChevronRight } from 'lucide-react';
import { Task, WeekColumn } from '../types/planning';
import { format } from 'date-fns';

export const GanttChartView: React.FC = () => {
  const {
    currentProject,
    openEditTaskModal,
    openNewTaskModal,
    searchQuery,
    selectedColor,
    selectedMemberId,
    members
  } = usePlanning();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState<number>(130); // Largeur d'une semaine en px
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Filtrage des tâches selon recherche, couleur et collaborateur
  const filteredTasks = useMemo(() => {
    return currentProject.tasks.filter((task) => {
      const matchSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchColor = !selectedColor || task.color.toLowerCase() === selectedColor.toLowerCase();
      const matchMember = !selectedMemberId || task.assigneeId === selectedMemberId || task.assignee === selectedMemberId;

      return matchSearch && matchColor && matchMember;
    });
  }, [currentProject.tasks, searchQuery, selectedColor, selectedMemberId]);

  // Génération des colonnes par semaines (S1 à S52)
  const weekColumns = useMemo(() => {
    return generateWeekColumns(filteredTasks, 2);
  }, [filteredTasks]);

  const rowHeight = 52;
  const headerHeight = 72;
  const leftPanelWidth = 360;

  // Centrer sur la semaine en cours au chargement
  useEffect(() => {
    if (currentWeekRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const weekEl = currentWeekRef.current;
      const offsetLeft = weekEl.offsetLeft - container.clientWidth / 2 + leftPanelWidth / 2;
      container.scrollTo({ left: Math.max(0, offsetLeft), behavior: 'smooth' });
    }
  }, [columnWidth]);

  const scrollToCurrentWeek = () => {
    if (currentWeekRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const weekEl = currentWeekRef.current;
      const offsetLeft = weekEl.offsetLeft - container.clientWidth / 2 + leftPanelWidth / 2;
      container.scrollTo({ left: Math.max(0, offsetLeft), behavior: 'smooth' });
    }
  };

  // Trouver les informations de membre pour une tâche
  const getMemberInfo = (task: Task) => {
    if (task.assigneeId) {
      const m = members.find((mem) => mem.id === task.assigneeId);
      if (m) return m;
    }
    if (task.assignee) {
      const m = members.find((mem) => mem.name.toLowerCase() === task.assignee?.toLowerCase());
      if (m) return m;
      return {
        id: 'tmp',
        name: task.assignee,
        role: 'Collaborateur',
        color: '#64748B',
        initials: task.assignee.substring(0, 2).toUpperCase()
      };
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Barre d'outils du diagramme de Gantt */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Diagramme de Gantt par Semaines</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-medium">
            {filteredTasks.length} tâche(s) ordonnée(s) en cascade chronologique
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom d'échelle des semaines */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-lg text-slate-600 font-medium text-[11px]">
            <span className="px-2 text-slate-400">Échelle :</span>
            <button
              onClick={() => setColumnWidth(90)}
              className={`px-2 py-0.5 rounded-md transition ${columnWidth === 90 ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Compact
            </button>
            <button
              onClick={() => setColumnWidth(130)}
              className={`px-2 py-0.5 rounded-md transition ${columnWidth === 130 ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setColumnWidth(180)}
              className={`px-2 py-0.5 rounded-md transition ${columnWidth === 180 ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Large
            </button>
          </div>

          <button
            onClick={scrollToCurrentWeek}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-700 font-semibold transition shadow-xs flex items-center gap-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Semaine en cours
          </button>
        </div>
      </div>

      {/* Zone défilable contenant la table à gauche et la frise Gantt à droite */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar"
        style={{ minHeight: '480px' }}
      >
        <div
          style={{ width: `${leftPanelWidth + weekColumns.length * columnWidth}px` }}
          className="relative min-w-full"
        >
          {/* EN-TÊTE FIXE DU GANTT */}
          <div className="sticky top-0 z-30 flex bg-white border-b border-slate-200 shadow-xs">
            {/* En-tête volet gauche (Tâches) */}
            <div
              style={{ width: `${leftPanelWidth}px` }}
              className="sticky left-0 z-40 bg-slate-50/95 border-r border-slate-200 px-4 py-3 flex items-center justify-between backdrop-blur-xs"
            >
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tâches & Collaborateurs
              </span>
              <button
                onClick={() => openNewTaskModal()}
                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition"
                title="Ajouter une tâche"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* En-tête des colonnes Semaines */}
            <div className="flex">
              {weekColumns.map((col) => (
                <div
                  key={`${col.year}-${col.weekNumber}`}
                  ref={col.isCurrentWeek ? currentWeekRef : null}
                  style={{ width: `${columnWidth}px` }}
                  onClick={() => openNewTaskModal(format(col.start, 'yyyy-MM-dd'))}
                  className={`h-[72px] px-2 py-2.5 flex flex-col justify-between border-r border-slate-200 text-center cursor-pointer transition-colors group ${
                    col.isCurrentWeek
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-inset ring-rose-300'
                      : 'hover:bg-indigo-50/40 bg-slate-50/40'
                  }`}
                  title={`Cliquer pour ajouter une tâche en ${col.label}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        col.isCurrentWeek ? 'text-rose-600' : 'text-slate-800'
                      }`}
                    >
                      {col.shortLabel}
                    </span>
                    {col.isCurrentWeek && (
                      <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                        Actuelle
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {col.dateRangeLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LIGNES DISTINCTES DU GANTT (1 LIGNE PAR TÂCHE EN HAUTEUR) */}
          <div className="relative">
            {/* Trame de fond des colonnes semaines */}
            <div
              className="absolute top-0 bottom-0 right-0 flex pointer-events-none"
              style={{ left: `${leftPanelWidth}px` }}
            >
              {weekColumns.map((col) => (
                <div
                  key={`bg-${col.year}-${col.weekNumber}`}
                  style={{ width: `${columnWidth}px` }}
                  className={`h-full border-r border-slate-100 ${
                    col.isCurrentWeek ? 'bg-rose-50/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* Rangées pour chaque tâche */}
            {filteredTasks.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="text-sm font-semibold">Aucune tâche dans ce planning pour le moment</p>
                <button
                  onClick={() => openNewTaskModal()}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  Créer la première tâche
                </button>
              </div>
            ) : (
              filteredTasks.map((task, index) => {
                const member = getMemberInfo(task);
                const isHovered = hoveredTaskId === task.id;
                const pos = calculateGanttPosition(task, weekColumns, columnWidth);

                return (
                  <div
                    key={task.id}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                    style={{ height: `${rowHeight}px` }}
                    className={`flex items-center border-b border-slate-100 transition-colors ${
                      isHovered ? 'bg-slate-50/90' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/25'
                    }`}
                  >
                    {/* Volet gauche collant (Sticky) : Détails de la tâche */}
                    <div
                      style={{ width: `${leftPanelWidth}px` }}
                      onClick={() => openEditTaskModal(task)}
                      className={`sticky left-0 z-20 h-full border-r border-slate-200 px-4 flex items-center justify-between cursor-pointer transition-colors ${
                        isHovered ? 'bg-slate-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/90'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        {/* Numéro chronologique */}
                        <span className="text-[11px] font-bold text-slate-400 w-4 text-right flex-shrink-0">
                          {index + 1}
                        </span>

                        {/* Pastille de couleur */}
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: task.color }}
                        />

                        {/* Titre & Jalon */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                            {task.title}
                          </p>
                        </div>
                      </div>

                      {/* Responsable & Badge semaine */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {member && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: member.color }}
                            title={`${member.name} (${member.role})`}
                          >
                            {member.initials}
                          </div>
                        )}

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {pos.startWeekLabel} {pos.startWeekLabel !== pos.endWeekLabel ? `→ ${pos.endWeekLabel}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Volet droit : Ligne de la grille Gantt avec la barre de tâche */}
                    <div
                      className="relative h-full flex-1"
                      onClick={(e) => {
                        // Clic direct sur la ligne pour éditer
                        if (e.target === e.currentTarget) {
                          openEditTaskModal(task);
                        }
                      }}
                    >
                      {/* Barre temporelle Gantt */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTaskModal(task);
                        }}
                        style={{
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          top: '8px',
                          height: '36px',
                        }}
                        className={`absolute rounded-xl z-10 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:shadow-md flex items-center px-3 group overflow-hidden ${
                          task.isMilestone ? '!w-8 !h-8 !top-[10px] justify-center p-0 !rounded-lg' : ''
                        }`}
                      >
                        {/* Fond coloré */}
                        <div
                          className="absolute inset-0 opacity-90 group-hover:opacity-100 transition"
                          style={{ backgroundColor: task.color }}
                        />

                        {/* Barre d'avancement interne */}
                        {!task.isMilestone && task.progress > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 bg-black/15 border-r border-white/20"
                            style={{ width: `${task.progress}%` }}
                          />
                        )}

                        {/* Contenu de la barre Gantt */}
                        {task.isMilestone ? (
                          <div
                            title={`Jalon : ${task.title}`}
                            className="relative z-10 text-white transform rotate-45 flex items-center justify-center"
                          >
                            <Sparkles size={16} />
                          </div>
                        ) : (
                          <div className="relative z-10 flex items-center justify-between w-full text-white text-xs font-semibold overflow-hidden">
                            <span className="truncate pr-1 drop-shadow-xs">{task.title}</span>
                            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                              {pos.durationWeeks} sem.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
