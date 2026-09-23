import React, { useState, useEffect } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { Task, TaskPriority, TaskStatus, COLOR_PRESETS } from '../types/planning';
import {
  format,
  addDays,
  startOfISOWeek,
  endOfISOWeek,
  addWeeks,
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Calendar, Flag, Tag, CheckCircle2, Clock, Trash2, Palette, Sparkles, UserCheck, CalendarDays, Lock, Unlock } from 'lucide-react';
import { getDurationDays } from '../utils/scheduler';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    editingTask,
    defaultDateForNewTask,
    closeTaskModal,
    addTask,
    updateTask,
    deleteTask,
    members,
    isAuthorized,
    openAuthModal
  } = usePlanning();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(format(addDays(today, 6), 'yyyy-MM-dd'));
  const [color, setColor] = useState('#6366F1');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [progress, setProgress] = useState(0);
  const [category, setCategory] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [inputMode, setInputMode] = useState<'weeks' | 'days'>('weeks');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setStartDate(editingTask.startDate);
      setEndDate(editingTask.endDate || editingTask.startDate);
      setColor(editingTask.color || '#6366F1');
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setProgress(editingTask.progress ?? 0);
      setCategory(editingTask.category || '');
      setAssigneeId(editingTask.assigneeId || '');
      setIsMilestone(!!editingTask.isMilestone);
    } else {
      const baseDate = defaultDateForNewTask || todayStr;
      const baseMonday = startOfISOWeek(parseISO(baseDate));
      setTitle('');
      setDescription('');
      setStartDate(format(baseMonday, 'yyyy-MM-dd'));
      setEndDate(format(endOfISOWeek(baseMonday), 'yyyy-MM-dd'));
      setColor('#6366F1');
      setStatus('todo');
      setPriority('medium');
      setProgress(0);
      setCategory('');
      setAssigneeId(members[0]?.id || '');
      setIsMilestone(false);
    }
  }, [editingTask, defaultDateForNewTask, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  // Numéros de semaines actuelles
  const startWeekNum = getISOWeek(parseISO(startDate));
  const endWeekNum = getISOWeek(parseISO(endDate));
  const currentYear = getISOWeekYear(parseISO(startDate));

  // Options de semaines pour le sélecteur rapide
  const weekOptions = Array.from({ length: 52 }, (_, i) => {
    const wNum = i + 1;
    // Calcule le lundi de cette semaine
    const sampleDate = setISOWeek(new Date(currentYear, 0, 4), wNum);
    const wStart = startOfISOWeek(sampleDate);
    const wEnd = endOfISOWeek(sampleDate);
    return {
      week: wNum,
      label: `Semaine ${wNum} (${format(wStart, 'd MMM', { locale: fr })} - ${format(wEnd, 'd MMM', { locale: fr })})`,
      startDate: format(wStart, 'yyyy-MM-dd'),
      endDate: format(wEnd, 'yyyy-MM-dd')
    };
  });

  const handleStartWeekSelect = (wNum: number) => {
    const opt = weekOptions.find((o) => o.week === wNum);
    if (!opt) return;
    setStartDate(opt.startDate);
    if (isMilestone || wNum > endWeekNum) {
      setEndDate(opt.endDate);
    }
  };

  const handleEndWeekSelect = (wNum: number) => {
    const opt = weekOptions.find((o) => o.week === wNum);
    if (!opt) return;
    setEndDate(opt.endDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      closeTaskModal();
      openAuthModal();
      return;
    }
    if (!title.trim()) return;

    const assignedMember = members.find((m) => m.id === assigneeId);

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate: isMilestone ? startDate : (endDate >= startDate ? endDate : startDate),
      color,
      status,
      priority,
      progress: status === 'completed' ? 100 : progress,
      category: category.trim() || undefined,
      assignee: assignedMember ? assignedMember.name : undefined,
      assigneeId: assigneeId || undefined,
      isMilestone
    };

    if (editingTask) {
      updateTask({ ...taskPayload, id: editingTask.id });
    } else {
      addTask(taskPayload);
    }
    closeTaskModal();
  };

  const durationDays = getDurationDays(startDate, endDate);
  const durationWeeks = Math.max(1, Math.ceil(durationDays / 7));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-lg font-bold text-slate-800">
              {editingTask ? 'Modifier la tâche' : 'Ajouter une tâche au rétroplanning'}
            </h2>
          </div>
          <button
            onClick={closeTaskModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {!isAuthorized && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Mode consultation :</strong> Saisissez le mot de passe équipe pour modifier cette tâche.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeTaskModal();
                  openAuthModal();
                }}
                className="ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 shadow-xs transition"
              >
                Déverrouiller
              </button>
            </div>
          )}

          <fieldset disabled={!isAuthorized} className="space-y-5">
            {/* Titre */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Intitulé de la tâche <span className="text-rose-500">*</span>
              </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Cadrage, Validation des maquettes, Dév Backend..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-base transition font-medium"
            />
          </div>

          {/* Attribution Collaborateur (Équipe) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserCheck size={14} className="text-indigo-600" />
              Responsable de la tâche
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setAssigneeId(member.id)}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                    assigneeId === member.id
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Choix des Semaines ou Dates */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-indigo-600" />
                  Période (Semaines S1 à S52)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={isMilestone}
                    onChange={(e) => {
                      setIsMilestone(e.target.checked);
                      if (e.target.checked) setEndDate(startDate);
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Jalon unique (◆)</span>
                </label>

                {/* Bascule mode semaines / jours */}
                <div className="bg-slate-200/80 p-0.5 rounded-lg flex text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setInputMode('weeks')}
                    className={`px-2 py-0.5 rounded ${inputMode === 'weeks' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                  >
                    Par Semaines
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('days')}
                    className={`px-2 py-0.5 rounded ${inputMode === 'days' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
                  >
                    Par Jours
                  </button>
                </div>
              </div>
            </div>

            {inputMode === 'weeks' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Semaine de début
                  </label>
                  <select
                    value={startWeekNum}
                    onChange={(e) => handleStartWeekSelect(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {weekOptions.map((opt) => (
                      <option key={`start-${opt.week}`} value={opt.week}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isMilestone ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Semaine de fin
                    </label>
                    <select
                      value={endWeekNum}
                      onChange={(e) => handleEndWeekSelect(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                      {weekOptions.filter((o) => o.week >= startWeekNum).map((opt) => (
                        <option key={`end-${opt.week}`} value={opt.week}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <Sparkles size={14} className="mr-1.5 flex-shrink-0" />
                    Jalon clé sur la Semaine {startWeekNum}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date exacte de début</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (isMilestone || e.target.value > endDate) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!isMilestone && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date exacte de fin</label>
                    <input
                      type="date"
                      required
                      min={startDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
              <span>
                Durée : <strong className="text-indigo-600 font-bold">{durationWeeks} semaine{durationWeeks > 1 ? 's' : ''}</strong> ({durationDays} jours)
              </span>
              <span className="text-[11px] text-slate-400">Ordonné automatiquement sur la ligne Gantt</span>
            </div>
          </div>

          {/* Couleur de la tâche */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-600" />
                Couleur de la tâche sur le Gantt
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Libre :</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setColor(preset.hex)}
                  title={preset.label}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color.toLowerCase() === preset.hex.toLowerCase()
                      ? 'scale-115 ring-2 ring-offset-2 ring-indigo-500 shadow-md'
                      : 'hover:scale-110 opacity-90'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {color.toLowerCase() === preset.hex.toLowerCase() && (
                    <div className="w-2 h-2 rounded-full bg-white shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Statut & Priorité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-indigo-600" />
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStat = e.target.value as TaskStatus;
                  setStatus(newStat);
                  if (newStat === 'completed') setProgress(100);
                  if (newStat === 'todo' && progress === 100) setProgress(0);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todo">📋 À faire</option>
                <option value="in_progress">⚡ En cours</option>
                <option value="completed">✅ Terminé</option>
                <option value="blocked">⚠️ Bloqué</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flag size={13} className="text-indigo-600" />
                Priorité
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute / Urgente</option>
              </select>
            </div>
          </div>

          {/* Progression */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Clock size={13} className="text-indigo-600" />
                Avancement ({progress}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => {
                const val = Number(e.target.value);
                setProgress(val);
                if (val === 100) setStatus('completed');
                else if (val > 0 && status === 'todo') setStatus('in_progress');
              }}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Pôle / Catégorie */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag size={13} className="text-indigo-600" />
              Pôle / Catégorie
            </label>
            <input
              type="text"
              placeholder="Ex: Stratégie, Design, Dév, Marketing..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Notes & Livrables
            </label>
            <textarea
              rows={2}
              placeholder="Détails, consignes ou spécifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </fieldset>
      </form>

        {/* Pied de page modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {!isAuthorized ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Lock size={13} className="text-amber-600" />
                <span>Lecture seule</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeTaskModal();
                    openAuthModal();
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 hover:shadow-amber-300 transition flex items-center gap-1.5"
                >
                  <Unlock size={14} />
                  Déverrouiller pour modifier
                </button>
              </div>
            </>
          ) : (
            <>
              {editingTask ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
                      deleteTask(editingTask.id);
                      closeTaskModal();
                    }
                  }}
                  className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 size={15} />
                  Supprimer
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition"
                >
                  {editingTask ? 'Mettre à jour' : 'Ajouter au rétroplanning'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
