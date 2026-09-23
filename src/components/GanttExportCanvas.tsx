import React, { useMemo } from 'react';
import { Project, TeamMember, Task, WeekColumn } from '../types/planning';
import {
  CATEGORY_CLASSES,
  groupTasksByClass,
  generateWeekColumns,
  calculateGanttPosition,
  formatDateFr
} from '../utils/scheduler';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sparkles } from 'lucide-react';

interface GanttExportCanvasProps {
  project: Project;
  members: TeamMember[];
}

export const GanttExportCanvas: React.FC<GanttExportCanvasProps> = ({ project, members }) => {
  // Proportions calculées pour un ratio paysage optimal (1.45 - 1.55) sans tassement
  const exportColumnWidth = 52;
  const leftPanelWidth = 470;

  // Colonnes de semaines
  const weekColumns = useMemo(() => {
    return generateWeekColumns(project.tasks, 1);
  }, [project.tasks]);

  // Groupement des tâches par classe
  const taskGroups = useMemo(() => {
    return groupTasksByClass(project.tasks);
  }, [project.tasks]);

  // Groupement des semaines par mois
  const monthGroups = useMemo(() => {
    if (weekColumns.length === 0) return [];
    const groups: { label: string; weekCount: number }[] = [];
    let currentLabel = '';
    let currentCount = 0;

    weekColumns.forEach((col) => {
      const monthLabel = format(col.start, 'MMMM yyyy', { locale: fr });
      if (monthLabel === currentLabel) {
        currentCount++;
      } else {
        if (currentLabel !== '') {
          groups.push({ label: currentLabel, weekCount: currentCount });
        }
        currentLabel = monthLabel;
        currentCount = 1;
      }
    });

    if (currentCount > 0) {
      groups.push({ label: currentLabel, weekCount: currentCount });
    }

    return groups;
  }, [weekColumns]);

  const timelineWidth = weekColumns.length * exportColumnWidth;
  const totalWidth = leftPanelWidth + timelineWidth;

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'completed').length;
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
    <div
      id="gantt-export-canvas-target"
      style={{
        width: `${totalWidth}px`,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
      className="p-6 bg-white"
    >
      {/* 1. EN-TÊTE PRINCIPAL COMPACT ET LISIBLE */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-4 h-4 rounded-full bg-indigo-600 inline-block shadow-xs" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 uppercase tracking-wider">
              Rétroplanning Général
            </span>
          </div>
          <p className="text-xs text-slate-600 font-bold">
            Diagramme de Gantt Hebdomadaire • 7 Classes Métiers • {totalTasks} tâches
          </p>
        </div>

        {/* Métriques */}
        <div className="flex items-center gap-5 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-300">
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-500">Avancement</span>
            <span className="text-lg font-black text-indigo-700">{globalProgress}%</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-500">Tâches Faites</span>
            <span className="text-lg font-black text-emerald-600">
              {completedTasks} / {totalTasks}
            </span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-500">Horizon</span>
            <span className="text-xs font-black text-slate-800">
              {weekColumns.length > 0
                ? `${weekColumns[0].shortLabel} (${format(weekColumns[0].start, 'dd/MM/yy')}) → ${
                    weekColumns[weekColumns.length - 1].shortLabel
                  } (${format(weekColumns[weekColumns.length - 1].end, 'dd/MM/yy')})`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LÉGENDE DES 7 CLASSES */}
      <div className="bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-300 mb-4 flex items-center justify-between gap-3">
        <span className="font-black uppercase text-[11px] text-slate-700 tracking-wider shrink-0">
          Légende :
        </span>
        <div className="flex items-center gap-4 flex-wrap">
          {CATEGORY_CLASSES.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full shadow-2xs shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-black text-slate-800 text-[11px]">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GRILLE DU GANTT */}
      <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-xs">
        {/* EN-TÊTE TEMPORELLE */}
        <div className="flex bg-slate-100 border-b-2 border-slate-300">
          {/* Angle haut-gauche */}
          <div
            style={{ width: `${leftPanelWidth}px` }}
            className="border-r-2 border-slate-300 p-2.5 flex items-center justify-between bg-slate-100 shrink-0"
          >
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Classes & Actions
            </span>
            <span className="text-[10px] text-slate-600 font-bold">
              Responsable • Période
            </span>
          </div>

          {/* Axe Temporel */}
          <div style={{ width: `${timelineWidth}px` }} className="flex flex-col shrink-0">
            {/* Ligne 1 : Mois */}
            <div className="flex border-b border-slate-300">
              {monthGroups.map((mg, idx) => (
                <div
                  key={idx}
                  style={{ width: `${mg.weekCount * exportColumnWidth}px` }}
                  className="h-7 border-r border-slate-300 bg-slate-200/90 flex items-center justify-center text-[11px] font-black text-slate-800 uppercase tracking-wider text-center truncate px-1"
                >
                  {mg.label}
                </div>
              ))}
            </div>

            {/* Ligne 2 : Numéros de Semaines */}
            <div className="flex">
              {weekColumns.map((col) => (
                <div
                  key={`${col.year}-${col.weekNumber}`}
                  style={{ width: `${exportColumnWidth}px` }}
                  className={`h-9 border-r border-slate-300 flex flex-col items-center justify-center text-[10px] ${
                    col.isCurrentWeek ? 'bg-rose-100/90 text-rose-900 font-black' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-black text-[11px]">{col.shortLabel}</span>
                  <span className="text-[8px] text-slate-500 font-bold leading-none mt-0.5">
                    {format(col.start, 'dd/MM')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CORPS DU GANTT : CLASSES ET TÂCHES */}
        <div className="divide-y divide-slate-200">
          {taskGroups.map((group) => (
            <div key={group.categoryClass.id} className="bg-white">
              {/* En-tête de Section Classe */}
              <div className="flex bg-slate-100 border-y border-slate-300">
                <div
                  className="h-8 px-3 border-r-2 border-slate-300 flex items-center justify-between shrink-0"
                  style={{
                    width: `${leftPanelWidth}px`,
                    backgroundColor: `${group.categoryClass.color}18`,
                    borderLeft: `5px solid ${group.categoryClass.color}`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: group.categoryClass.color }}
                    />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {group.categoryClass.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-300 shadow-2xs">
                    {group.tasks.length}
                  </span>
                </div>

                <div
                  className="h-8 flex items-center px-3 shrink-0"
                  style={{
                    width: `${timelineWidth}px`,
                    backgroundColor: `${group.categoryClass.color}0a`
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Section {group.categoryClass.label}
                  </span>
                </div>
              </div>

              {/* Tâches de la section */}
              {group.tasks.map((task, idx) => {
                const member = getMemberInfo(task);
                const pos = calculateGanttPosition(task, weekColumns, exportColumnWidth);

                return (
                  <div
                    key={task.id}
                    className={`flex items-center h-9 border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    {/* Volet gauche : Infos tâche ultra-lisible */}
                    <div
                      style={{ width: `${leftPanelWidth}px` }}
                      className="h-full border-r-2 border-slate-300 px-3 flex items-center justify-between shrink-0 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="text-[11px] font-black text-slate-900 leading-tight truncate" title={task.title}>
                          {task.title}
                        </span>
                      </div>

                      {/* Dates & Membre responsable */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {member && (
                          <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            <span
                              className="w-3.5 h-3.5 rounded-full text-[8px] font-black text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </span>
                            <span className="text-[9px] font-black text-slate-700 max-w-[65px] truncate">
                              {member.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {formatDateFr(task.startDate, 'dd/MM')}
                          {!task.isMilestone && ` → ${formatDateFr(task.endDate, 'dd/MM')}`}
                        </span>
                      </div>
                    </div>

                    {/* Volet droit : Timeline avec grille et barre de Gantt */}
                    <div
                      style={{ width: `${timelineWidth}px` }}
                      className="relative h-full flex items-center shrink-0"
                    >
                      {/* Lignes verticales de grille de semaines */}
                      {weekColumns.map((col) => (
                        <div
                          key={`grid-${col.year}-${col.weekNumber}`}
                          style={{ width: `${exportColumnWidth}px` }}
                          className={`h-full border-r border-slate-200/80 inline-block shrink-0 ${
                            col.isCurrentWeek ? 'bg-rose-50/40' : ''
                          }`}
                        />
                      ))}

                      {/* Barre de Gantt */}
                      <div
                        style={{
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          height: '24px',
                          backgroundColor: task.color
                        }}
                        className={`absolute rounded-md flex items-center px-1.5 shadow-2xs overflow-hidden z-10 ${
                          task.isMilestone ? '!w-6 !h-6 justify-center !p-0 !rounded-md' : ''
                        }`}
                      >
                        {/* Barre de progression */}
                        {!task.isMilestone && task.progress > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 bg-black/25 border-r border-white/40"
                            style={{ width: `${task.progress}%` }}
                          />
                        )}

                        {/* Label de la barre */}
                        {task.isMilestone ? (
                          <Sparkles size={12} className="text-white relative z-10" />
                        ) : pos.width >= 75 ? (
                          <div className="relative z-10 flex items-center justify-between w-full text-white text-[10px] font-black overflow-hidden leading-none">
                            <span className="truncate pr-1 drop-shadow-2xs">{task.title}</span>
                            <span className="text-[9px] bg-black/35 px-1 py-0.5 rounded font-mono font-black shrink-0">
                              {pos.durationWeeks}s
                            </span>
                          </div>
                        ) : (
                          <div className="relative z-10 w-full text-center text-white text-[9px] font-black drop-shadow-2xs">
                            {pos.durationWeeks}s
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. PIED DE PAGE */}
      <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500 font-bold">
        <div>
          <span className="font-black text-slate-800">Rétroplanning RnF</span> • Document de synthèse prévisionnelle officiel
        </div>
        <div className="flex items-center gap-3">
          <span>Développé par <strong className="text-slate-900">Julien (@Pirkah)</strong></span>
          <span>•</span>
          <span className="font-black text-indigo-600">github.com/Pirkah</span>
          <span>•</span>
          <span className="font-black text-slate-800">x.com/Pirkah</span>
        </div>
      </div>
    </div>
  );
};
