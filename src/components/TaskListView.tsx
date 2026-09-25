import React from 'react';
import { usePlanning } from '../context/PlanningContext';
import { formatDateFr, getDurationDays } from '../utils/scheduler';
import {
  Calendar,
  Clock,
  MoreVertical,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Task } from '../types/planning';

export const TaskListView: React.FC = () => {
  const {
    currentProject,
    openEditTaskModal,
    openNewTaskModal,
    duplicateTask,
    deleteTask,
    searchQuery,
    selectedColor,
    isAuthorized,
    openAuthModal
  } = usePlanning();

  const filteredTasks = currentProject.tasks.filter((task) => {
    const matchSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchColor = !selectedColor || task.color.toLowerCase() === selectedColor.toLowerCase();
    return matchSearch && matchColor;
  });

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">✅ Terminé</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">⚡ En cours</span>;
      case 'blocked':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">⚠️ Bloqué</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">📋 À faire</span>;
    }
  };

  const getPriorityBadge = (prio: Task['priority']) => {
    switch (prio) {
      case 'high':
        return <span className="text-rose-600 dark:text-rose-400 font-bold text-xs bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/60">Haute</span>;
      case 'medium':
        return <span className="text-amber-600 dark:text-amber-400 font-medium text-xs bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/60">Moyenne</span>;
      default:
        return <span className="text-slate-500 dark:text-slate-400 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Basse</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Barre supérieure */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Échéancier & Liste Ordonnée</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Toutes les tâches sont triées automatiquement dans l'ordre chronologique de début.
          </p>
        </div>
        <button
          onClick={() => {
            if (!isAuthorized) {
              openAuthModal();
            } else {
              openNewTaskModal();
            }
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
        >
          <Plus size={15} />
          Ajouter une tâche
        </button>
      </div>

      {/* Tableau des tâches */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <p className="text-base font-semibold mb-1">Aucune tâche trouvée</p>
            <p className="text-xs">Ajoutez une tâche ou modifiez vos filtres de recherche.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tâche</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Durée</th>
                <th className="py-3 px-4">Progression</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Priorité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredTasks.map((task) => {
                const duration = getDurationDays(task.startDate, task.endDate);
                return (
                  <tr
                    key={task.id}
                    onClick={() => openEditTaskModal(task)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    {/* Titre & Pastille couleur */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/10"
                          style={{ backgroundColor: task.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                              {task.title}
                            </span>
                            {task.isMilestone && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles size={10} /> Jalon
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-md">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{formatDateFr(task.startDate, 'dd MMM yyyy')}</span>
                      {!task.isMilestone && (
                        <span className="text-slate-400 dark:text-slate-500"> → {formatDateFr(task.endDate, 'dd MMM yyyy')}</span>
                      )}
                    </td>

                    {/* Durée */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {duration} jour{duration > 1 ? 's' : ''}
                    </td>

                    {/* Progression */}
                    <td className="py-3 px-4 whitespace-nowrap min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${task.progress}%`,
                              backgroundColor: task.color
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>

                    {/* Priorité */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>

                    {/* Boutons d'action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthorized) {
                              openAuthModal();
                              return;
                            }
                            duplicateTask(task.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition"
                          title="Dupliquer"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTaskModal(task);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isAuthorized) {
                              openAuthModal();
                              return;
                            }
                            if (confirm('Supprimer cette tâche ?')) {
                              deleteTask(task.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
