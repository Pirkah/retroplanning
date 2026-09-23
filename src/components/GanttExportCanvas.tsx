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
  // Dimensions calibrées pour une lisibilité maximale sur A3 paysage (420 x 297 mm)
  const exportColumnWidth = 58;
  const leftPanelWidth = 540;

  // Colonnes de semaines calculées pour englober l'ensemble des tâches
  const weekColumns = useMemo(() => {
    return generateWeekColumns(project.tasks, 1);
  }, [project.tasks]);

  // Groupement des tâches par classe
  const taskGroups = useMemo(() => {
    return groupTasksByClass(project.tasks);
  }, [project.tasks]);

  // Groupement des semaines par mois pour l'en-tête temporel
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
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
      className="p-8 bg-white border border-slate-300"
    >
      {/* 1. EN-TÊTE PRINCIPAL DU DOCUMENT */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 inline-block shadow-xs" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 uppercase tracking-wider">
              Rétroplanning Prévisionnel Officiel
            </span>
          </div>
          <p className="text-sm text-slate-600 font-semibold">
            Diagramme de Gantt hebdomadaire • 7 Classes Métiers • {totalTasks} tâches programmées
          </p>
        </div>

        {/* Bloc Métriques & Avancement */}
        <div className="flex items-center gap-6 bg-slate-50 px-6 py-3.5 rounded-2xl border border-slate-300">
          <div>
            <span className="block text-[11px] uppercase font-bold text-slate-500">Avancement Global</span>
            <span className="text-xl font-black text-indigo-700">{globalProgress}%</span>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div>
            <span className="block text-[11px] uppercase font-bold text-slate-500">Tâches Réalisées</span>
            <span className="text-xl font-black text-emerald-600">
              {completedTasks} / {totalTasks}
            </span>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div>
            <span className="block text-[11px] uppercase font-bold text-slate-500">Période du Rétroplanning</span>
            <span className="text-sm font-bold text-slate-800">
              {weekColumns.length > 0
                ? `${weekColumns[0].shortLabel} (${format(weekColumns[0].start, 'dd/MM/yy')}) → ${
                    weekColumns[weekColumns.length - 1].shortLabel
                  } (${format(weekColumns[weekColumns.length - 1].end, 'dd/MM/yy')})`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LÉGENDE DES 7 CLASSES DU DIAGRAMME */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 mb-6 flex flex-wrap items-center justify-between gap-4">
        <span className="font-black uppercase text-xs text-slate-700 tracking-wider">
          Légende des 7 Classes :
        </span>
        <div className="flex items-center gap-5 flex-wrap">
          {CATEGORY_CLASSES.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-2xs shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-extrabold text-slate-800 text-xs">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GRILLE DU DIAGRAMME DE GANTT */}
      <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
        {/* EN-TÊTE TEMPORELLE (Mois + Semaines) */}
        <div className="flex bg-slate-100 border-b-2 border-slate-300">
          {/* Angle haut-gauche */}
          <div
            style={{ width: `${leftPanelWidth}px` }}
            className="border-r-2 border-slate-300 p-3.5 flex flex-col justify-center bg-slate-100 shrink-0"
          >
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Classes & Intitulé des Tâches
            </span>
            <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Responsable & Dates de réalisation
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
                  className="h-8 border-r border-slate-300 bg-slate-200/90 flex items-center justify-center text-xs font-black text-slate-800 uppercase tracking-wider text-center truncate px-1"
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
                  className={`h-10 border-r border-slate-300 flex flex-col items-center justify-center text-[11px] ${
                    col.isCurrentWeek ? 'bg-rose-100/90 text-rose-900 font-black' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-extrabold">{col.shortLabel}</span>
                  <span className="text-[9px] text-slate-500 font-bold">
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
              <div className="flex bg-slate-100 border-y-2 border-slate-300">
                <div
                  className="h-9 px-4 border-r-2 border-slate-300 flex items-center justify-between shrink-0"
                  style={{
                    width: `${leftPanelWidth}px`,
                    backgroundColor: `${group.categoryClass.color}18`,
                    borderLeft: `6px solid ${group.categoryClass.color}`
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: group.categoryClass.color }}
                    />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {group.categoryClass.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-300 shadow-2xs">
                    {group.tasks.length} tâche{group.tasks.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className="h-9 flex items-center px-4 shrink-0"
                  style={{
                    width: `${timelineWidth}px`,
                    backgroundColor: `${group.categoryClass.color}0a`
                  }}
                >
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
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
                    className={`flex items-center h-11 border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Volet gauche : Infos tâche SANS tronquage agressif */}
                    <div
                      style={{ width: `${leftPanelWidth}px` }}
                      className="h-full border-r-2 border-slate-300 px-3.5 flex items-center justify-between shrink-0 overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="text-xs font-bold text-slate-900 leading-snug truncate" title={task.title}>
                          {task.title}
                        </span>
                      </div>

                      {/* Dates & Membre responsable */}
                      <div className="flex items-center gap-2 shrink-0">
                        {member && (
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <span
                              className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 max-w-[70px] truncate">
                              {member.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
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
                          height: '28px',
                          backgroundColor: task.color
                        }}
                        className={`absolute rounded-lg flex items-center px-2 shadow-xs overflow-hidden z-10 ${
                          task.isMilestone ? '!w-7 !h-7 justify-center !p-0 !rounded-lg' : ''
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
                          <Sparkles size={14} className="text-white relative z-10" />
                        ) : pos.width >= 90 ? (
                          <div className="relative z-10 flex items-center justify-between w-full text-white text-[11px] font-bold overflow-hidden leading-none">
                            <span className="truncate pr-1 drop-shadow-2xs">{task.title}</span>
                            <span className="text-[10px] bg-black/35 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              {pos.durationWeeks}s
                            </span>
                          </div>
                        ) : (
                          <div className="relative z-10 w-full text-center text-white text-[10px] font-black drop-shadow-2xs">
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

      {/* 4. PIED DE PAGE DU DOCUMENT PDF */}
      <div className="mt-6 pt-4 border-t-2 border-slate-300 flex items-center justify-between text-xs text-slate-600 font-semibold">
        <div>
          <span className="font-extrabold text-slate-800">Rétroplanning RnF</span> • Document de synthèse prévisionnelle officiel
        </div>
        <div className="flex items-center gap-3">
          <span>Développé par <strong className="text-slate-900">Julien (@Pirkah)</strong></span>
          <span>•</span>
          <span className="font-bold text-indigo-600">github.com/Pirkah</span>
          <span>•</span>
          <span className="font-bold text-slate-800">x.com/Pirkah</span>
        </div>
      </div>
    </div>
  );
};
