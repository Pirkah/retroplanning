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
  // Proportions calculées pour un ratio paysage A3 parfait (1.40 - 1.45)
  // Panneau gauche élargi à 660px : zéro texte tronqué, dates et responsables nets
  const exportColumnWidth = 52;
  const leftPanelWidth = 660;

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
  const inProgressTasks = project.tasks.filter((t) => t.status === 'in_progress').length;
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
        color: '#475569',
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      }}
      className="p-8 bg-white"
    >
      {/* 1. EN-TÊTE PRINCIPAL : PRÉSENTATION OFFICIELLE ET MÉTRIQUES CLAIRES */}
      <div className="border-b-2 border-slate-900 pb-5 mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 inline-block shadow-sm" />
            <h1 className="text-3xl font-black text-slate-950 tracking-normal">
              {project.name}
            </h1>
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-950 uppercase border border-indigo-200">
              Rétroplanning Prévisionnel Officiel
            </span>
          </div>
          <p className="text-sm text-slate-600 font-bold">
            Diagramme de Gantt Hebdomadaire • 7 Classes Métiers • {totalTasks} actions programmées
          </p>
        </div>

        {/* Métriques / KPIs */}
        <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div>
            <span className="block text-[11px] uppercase font-black text-slate-500">Avancement Global</span>
            <span className="text-2xl font-black text-indigo-700">{globalProgress}%</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div>
            <span className="block text-[11px] uppercase font-black text-slate-500">Tâches Terminées</span>
            <span className="text-2xl font-black text-emerald-600">
              {completedTasks} / {totalTasks}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div>
            <span className="block text-[11px] uppercase font-black text-slate-500">En Cours</span>
            <span className="text-2xl font-black text-blue-600">{inProgressTasks}</span>
          </div>
          <div className="h-8 w-px bg-slate-300" />
          <div>
            <span className="block text-[11px] uppercase font-black text-slate-500">Période du Projet</span>
            <span className="text-sm font-black text-slate-800">
              {weekColumns.length > 0
                ? `${weekColumns[0].shortLabel} (${format(weekColumns[0].start, 'dd/MM/yy')}) → ${
                    weekColumns[weekColumns.length - 1].shortLabel
                  } (${format(weekColumns[weekColumns.length - 1].end, 'dd/MM/yy')})`
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LÉGENDE DES 7 CLASSES MÉTIERS */}
      <div className="bg-slate-100/80 px-5 py-3 rounded-xl border border-slate-300 mb-5 flex items-center justify-between gap-4">
        <span className="font-black uppercase text-xs text-slate-800 shrink-0">
          Légende des 7 Classes :
        </span>
        <div className="flex items-center gap-5 flex-wrap">
          {CATEGORY_CLASSES.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-bold text-slate-900 text-xs">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GRILLE DU DIAGRAMME DE GANTT */}
      <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
        {/* EN-TÊTE TEMPORELLE */}
        <div className="flex bg-slate-100 border-b-2 border-slate-300">
          {/* Angle haut-gauche : Colonne d'informations */}
          <div
            style={{ width: `${leftPanelWidth}px` }}
            className="border-r-2 border-slate-300 px-4 py-3 flex items-center justify-between bg-slate-100 shrink-0"
          >
            <span className="text-sm font-black text-slate-900 uppercase">
              Classes & Actions
            </span>
            <span className="text-xs text-slate-600 font-bold">
              Responsable • Échéance
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
                  className="h-8 border-r border-slate-300 bg-slate-200 flex items-center justify-center text-xs font-black text-slate-900 uppercase text-center truncate px-2"
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
                  className={`h-10 border-r border-slate-300 flex flex-col items-center justify-center ${
                    col.isCurrentWeek ? 'bg-rose-100 text-rose-950 font-black' : 'bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="font-black text-xs">{col.shortLabel}</span>
                  <span className="text-[10px] text-slate-500 font-bold leading-none mt-0.5">
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
              <div className="flex bg-slate-100/90 border-y border-slate-300">
                <div
                  className="h-9 px-4 border-r-2 border-slate-300 flex items-center justify-between shrink-0"
                  style={{
                    width: `${leftPanelWidth}px`,
                    backgroundColor: `${group.categoryClass.color}20`,
                    borderLeft: `6px solid ${group.categoryClass.color}`
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: group.categoryClass.color }}
                    />
                    <span className="text-sm font-black text-slate-950 uppercase">
                      {group.categoryClass.label}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-white text-slate-800 border border-slate-300 shadow-xs">
                    {group.tasks.length} action{group.tasks.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className="h-9 flex items-center px-4 shrink-0"
                  style={{
                    width: `${timelineWidth}px`,
                    backgroundColor: `${group.categoryClass.color}0d`
                  }}
                >
                  <span className="text-xs font-black uppercase text-slate-500">
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
                    className={`flex items-center h-10 border-b border-slate-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                    }`}
                  >
                    {/* Volet gauche : Titre complet non tronqué, responsable et dates */}
                    <div
                      style={{ width: `${leftPanelWidth}px` }}
                      className="h-full border-r-2 border-slate-300 px-4 flex items-center justify-between shrink-0 overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: task.color }}
                        />
                        <span className="text-[12.5px] font-bold text-slate-950 leading-snug">
                          {task.title}
                        </span>
                      </div>

                      {/* Dates & Membre responsable */}
                      <div className="flex items-center gap-2 shrink-0">
                        {member && (
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                            <span
                              className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.initials}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 max-w-[95px] truncate">
                              {member.name.split(' ')[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 whitespace-nowrap">
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
                          className={`h-full border-r border-slate-200/90 inline-block shrink-0 ${
                            col.isCurrentWeek ? 'bg-rose-50/50' : ''
                          }`}
                        />
                      ))}

                      {/* Barre de Gantt */}
                      <div
                        style={{
                          left: `${pos.left}px`,
                          width: `${pos.width}px`,
                          height: '26px',
                          backgroundColor: task.color
                        }}
                        className={`absolute rounded-md flex items-center px-2 shadow-xs overflow-hidden z-10 border border-black/10 ${
                          task.isMilestone ? '!w-7 !h-7 justify-center !p-0 !rounded-md' : ''
                        }`}
                      >
                        {/* Barre de progression */}
                        {!task.isMilestone && task.progress > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 bg-black/25 border-r border-white/50"
                            style={{ width: `${task.progress}%` }}
                          />
                        )}

                        {/* Label de la barre */}
                        {task.isMilestone ? (
                          <Sparkles size={14} className="text-white relative z-10" />
                        ) : pos.width >= 85 ? (
                          <div className="relative z-10 flex items-center justify-between w-full text-white text-[11px] font-black overflow-hidden leading-none">
                            <span className="truncate pr-1 drop-shadow-xs">{task.title}</span>
                            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono font-black shrink-0">
                              {pos.durationWeeks}s
                            </span>
                          </div>
                        ) : (
                          <div className="relative z-10 w-full text-center text-white text-[10px] font-black drop-shadow-xs">
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

      {/* 4. PIED DE PAGE DU DOCUMENT OFFICIEL */}
      <div className="mt-5 pt-4 border-t-2 border-slate-300 flex items-center justify-between text-xs text-slate-600 font-bold">
        <div>
          <span className="font-black text-slate-900">Rétroplanning Course R&F 2026 - 2027</span> • Document de synthèse prévisionnelle officiel
        </div>
        <div className="flex items-center gap-3">
          <span>Développé par <strong className="text-slate-950">Julien (@Pirkah)</strong></span>
          <span>•</span>
          <span className="font-black text-indigo-700">github.com/Pirkah</span>
          <span>•</span>
          <span className="font-black text-slate-900">x.com/Pirkah</span>
        </div>
      </div>
    </div>
  );
};
