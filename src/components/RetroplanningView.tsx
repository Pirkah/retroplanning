import React, { useState, useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { RetroplanningEvent, RetroplanningTask, TeamMember } from '../types/planning';
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Sparkles,
  Check,
  X,
  FileText,
  Flag,
  ChevronRight,
  Info
} from 'lucide-react';

// Palette de couleurs officielles pour les phases du rétroplanning (identique aux photos)
export const RETRO_CATEGORIES: {
  id: string;
  label: string;
  description: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  blockColor: string;
  textColor: string;
}[] = [
  {
    id: 'preparation',
    label: 'Préparation',
    description: 'Travail interne de conception et cadrage',
    bgBadge: 'bg-pink-100',
    textBadge: 'text-pink-800',
    borderBadge: 'border-pink-300',
    blockColor: '#F472B6',
    textColor: '#831843'
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Affiche, vidéo, réseaux sociaux',
    bgBadge: 'bg-emerald-100',
    textBadge: 'text-emerald-800',
    borderBadge: 'border-emerald-300',
    blockColor: '#34D399',
    textColor: '#064E3B'
  },
  {
    id: 'logistique',
    label: 'Logistique',
    description: 'Réservation salle, matériel, organisation',
    bgBadge: 'bg-sky-100',
    textBadge: 'text-sky-800',
    borderBadge: 'border-sky-300',
    blockColor: '#60A5FA',
    textColor: '#1E3A8A'
  },
  {
    id: 'partenaires',
    label: 'Partenaires',
    description: 'Contacts et relations avec les intervenants',
    bgBadge: 'bg-amber-100',
    textBadge: 'text-amber-800',
    borderBadge: 'border-amber-300',
    blockColor: '#FBBF24',
    textColor: '#78350F'
  },
  {
    id: 'activite',
    label: 'Activité / Jour J',
    description: 'Tenue de l’événement principal',
    bgBadge: 'bg-red-100',
    textBadge: 'text-red-800',
    borderBadge: 'border-red-300',
    blockColor: '#EF4444',
    textColor: '#FFFFFF'
  },
  {
    id: 'evenement',
    label: 'Événement',
    description: 'Animation sur place et accueil des participants',
    bgBadge: 'bg-rose-100',
    textBadge: 'text-rose-800',
    borderBadge: 'border-rose-300',
    blockColor: '#F43F5E',
    textColor: '#FFFFFF'
  },
  {
    id: 'post_evenement',
    label: 'Post-événement',
    description: 'Bilan, questionnaire, remerciements et débriefing',
    bgBadge: 'bg-orange-100',
    textBadge: 'text-orange-900',
    borderBadge: 'border-orange-300',
    blockColor: '#FB923C',
    textColor: '#7C2D12'
  },
  {
    id: 'administratif',
    label: 'Administratif & Juridique',
    description: 'Statuts, préfecture, mairie, autorisations et assurances',
    bgBadge: 'bg-indigo-100',
    textBadge: 'text-indigo-800',
    borderBadge: 'border-indigo-300',
    blockColor: '#818CF8',
    textColor: '#312E81'
  },
  {
    id: 'finance',
    label: 'Finance & Trésorerie',
    description: 'Banque, compte, TPE, budget prévisionnel et subventions',
    bgBadge: 'bg-cyan-100',
    textBadge: 'text-cyan-800',
    borderBadge: 'border-cyan-300',
    blockColor: '#06B6D4',
    textColor: '#164E63'
  },
  {
    id: 'fournisseurs',
    label: 'Fournisseurs & Matériel',
    description: 'Commandes t-shirts, ravitaillement, devis et prestataires',
    bgBadge: 'bg-teal-100',
    textBadge: 'text-teal-800',
    borderBadge: 'border-teal-300',
    blockColor: '#14B8A6',
    textColor: '#134E4A'
  }
];

export function getCategoryStyle(categoryName: string) {
  const norm = categoryName.toLowerCase().replace(/[^a-z]/g, '');
  if (norm.includes('admin') || norm.includes('jurid') || norm.includes('prefect') || norm.includes('statut')) {
    return RETRO_CATEGORIES.find(c => c.id === 'administratif') || RETRO_CATEGORIES[0];
  }
  if (norm.includes('finan') || norm.includes('tresor') || norm.includes('banq') || norm.includes('budget') || norm.includes('subvent')) {
    return RETRO_CATEGORIES.find(c => c.id === 'finance') || RETRO_CATEGORIES[0];
  }
  if (norm.includes('fourn') || norm.includes('tshirt') || norm.includes('matos')) {
    return RETRO_CATEGORIES.find(c => c.id === 'fournisseurs') || RETRO_CATEGORIES[0];
  }
  if (norm.includes('prep') || norm.includes('concep')) return RETRO_CATEGORIES[0];
  if (norm.includes('comm') || norm.includes('video') || norm.includes('reseau') || norm.includes('tiktok') || norm.includes('strava')) {
    return RETRO_CATEGORIES[1];
  }
  if (norm.includes('logist') || norm.includes('salle') || norm.includes('balis') || norm.includes('secour') || norm.includes('benevol')) {
    return RETRO_CATEGORIES[2];
  }
  if (norm.includes('parten') || norm.includes('interven') || norm.includes('bde') || norm.includes('sponsor')) {
    return RETRO_CATEGORIES[3];
  }
  if (norm.includes('activ') || norm.includes('jourj') || norm.includes('billett') || norm.includes('dossard')) {
    return RETRO_CATEGORIES[4];
  }
  if (norm.includes('post') || norm.includes('bilan') || norm.includes('sondage') || norm.includes('debrief')) {
    return RETRO_CATEGORIES.find(c => c.id === 'post_evenement') || RETRO_CATEGORIES[6];
  }
  if (norm.includes('even') || norm.includes('assoc')) return RETRO_CATEGORIES[5];
  return RETRO_CATEGORIES[1];
}

export const RetroplanningView: React.FC = () => {
  const {
    currentProject,
    members,
    isAuthorized,
    openAuthModal,
    addRetroEvent,
    updateRetroEvent,
    deleteRetroEvent,
    addRetroTask,
    updateRetroTask,
    deleteRetroTask
  } = usePlanning();

  const events = useMemo(() => currentProject.events || [], [currentProject.events]);

  // Active le mode d'impression dédié au rétroplanning
  React.useEffect(() => {
    document.body.classList.add('print-retroplanning');
    return () => {
      document.body.classList.remove('print-retroplanning');
    };
  }, []);

  // Onglet sélectionné : 'overview' pour Vue d'ensemble, ou event.id
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modales
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RetroplanningEvent | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RetroplanningTask | null>(null);

  // Formulaire Événement
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormObjective, setEventFormObjective] = useState('');
  const [eventFormContent, setEventFormContent] = useState('');

  // Formulaire Tâche
  const [taskFormWeek, setTaskFormWeek] = useState('');
  const [taskFormCategory, setTaskFormCategory] = useState('Communication');
  const [taskFormAction, setTaskFormAction] = useState('');
  const [taskFormAssignee, setTaskFormAssignee] = useState('');
  const [taskFormStatus, setTaskFormStatus] = useState<'todo' | 'in_progress' | 'completed' | 'event'>('todo');
  const [taskFormIsEvent, setTaskFormIsEvent] = useState(false);

  // Événement actif si ce n'est pas 'overview'
  const currentEvent = useMemo(() => {
    if (activeTab === 'overview') return null;
    return events.find((e) => e.id === activeTab) || null;
  }, [events, activeTab]);

  // Liste ordonnée unique des semaines mentionnées dans cet événement pour la frise
  const eventWeeks = useMemo(() => {
    if (!currentEvent) return [];
    const rawWeeks = currentEvent.tasks.map((t) => t.weekLabel.trim()).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    rawWeeks.forEach((w) => {
      // Normaliser pour extraction (ex: "S42 (12 oct.)" -> clé unique)
      if (!seen.has(w)) {
        seen.add(w);
        unique.push(w);
      }
    });
    return unique.length > 0 ? unique : ['S39', 'S40', 'S41', 'S42 (12 oct.)', 'S43'];
  }, [currentEvent]);

  // Chaîne des membres d'équipe pour la bannière
  const teamBannerString = useMemo(() => {
    if (members.length === 0) return 'Toute l’équipe';
    return members.map((m) => m.name).join(' | ');
  }, [members]);

  // Handlers pour Événement
  const handleOpenNewEvent = () => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    setEditingEvent(null);
    setEventFormTitle('');
    setEventFormDate('');
    setEventFormObjective('');
    setEventFormContent('');
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: RetroplanningEvent) => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    setEditingEvent(evt);
    setEventFormTitle(evt.title);
    setEventFormDate(evt.date);
    setEventFormObjective(evt.objective);
    setEventFormContent(evt.content);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormTitle.trim()) return;

    if (editingEvent) {
      updateRetroEvent({
        ...editingEvent,
        title: eventFormTitle.trim(),
        date: eventFormDate.trim(),
        objective: eventFormObjective.trim(),
        content: eventFormContent.trim()
      });
    } else {
      addRetroEvent({
        title: eventFormTitle.trim(),
        date: eventFormDate.trim() || 'À définir',
        objective: eventFormObjective.trim(),
        content: eventFormContent.trim(),
        tasks: []
      });
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = (id: string, name: string) => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    if (confirm(`Supprimer la feuille de rétroplanning "${name}" ?`)) {
      deleteRetroEvent(id);
      if (activeTab === id) setActiveTab('overview');
    }
  };

  // Handlers pour Tâches d'Événement
  const handleOpenNewTask = () => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    setEditingTask(null);
    setTaskFormWeek(eventWeeks[0] || 'S40');
    setTaskFormCategory('Communication');
    setTaskFormAction('');
    setTaskFormAssignee(members[0]?.name || 'Toute l’équipe');
    setTaskFormStatus('todo');
    setTaskFormIsEvent(false);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: RetroplanningTask) => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    setEditingTask(task);
    setTaskFormWeek(task.weekLabel);
    setTaskFormCategory(task.category);
    setTaskFormAction(task.action);
    setTaskFormAssignee(task.assignee);
    setTaskFormStatus(task.status);
    setTaskFormIsEvent(!!task.isEventHighlight);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !taskFormAction.trim()) return;

    if (editingTask) {
      updateRetroTask(currentEvent.id, {
        ...editingTask,
        weekLabel: taskFormWeek.trim() || 'S40',
        category: taskFormCategory,
        action: taskFormAction.trim(),
        assignee: taskFormAssignee.trim() || 'Toute l’équipe',
        status: taskFormIsEvent ? 'event' : taskFormStatus,
        isEventHighlight: taskFormIsEvent
      });
    } else {
      addRetroTask(currentEvent.id, {
        weekLabel: taskFormWeek.trim() || 'S40',
        category: taskFormCategory,
        action: taskFormAction.trim(),
        assignee: taskFormAssignee.trim() || 'Toute l’équipe',
        status: taskFormIsEvent ? 'event' : taskFormStatus,
        isEventHighlight: taskFormIsEvent
      });
    }
    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    if (currentEvent && confirm('Supprimer cette tâche du rétroplanning ?')) {
      deleteRetroTask(currentEvent.id, taskId);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full">
      {/* 1. GRAND BANDEAU TITRE OFFICIEL STYLE EXCEL (PHOTO 1 & 2) */}
      <div className="bg-[#0F2756] text-white px-6 py-3.5 shadow-md border-b-2 border-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/60 flex items-center justify-center text-white font-black text-sm">
            📑
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase drop-shadow-xs">
              {currentEvent ? `RÉTRO-PLANNING – ${currentEvent.title}` : `${currentProject.name} – RÉTRO-PLANNING 2026-2027`}
            </h2>
            <p className="text-[11px] text-blue-200 font-semibold mt-0.5">
              Méthode prévisionnelle par événement • BUT GEA & Projets Associatifs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Imprimer cette feuille"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. BANDEAU D'ÉQUIPE (PHOTO 1 & 2) */}
      <div className="bg-[#DBEAFE] text-[#1E3A8A] px-6 py-2 border-b border-blue-200 flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2 truncate">
          <Users size={14} className="text-blue-700 shrink-0" />
          <span className="shrink-0 uppercase font-black tracking-wide text-blue-900">Équipe :</span>
          <span className="truncate">{teamBannerString}</span>
        </div>
        <span className="text-[11px] text-blue-700 bg-white/70 px-2 py-0.5 rounded border border-blue-300 font-extrabold shrink-0">
          {events.length} Événement{events.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* 3. CONTENU PRINCIPAL SELON L'ONGLET SÉLECTIONNÉ */}
      <div className="flex-1 p-4 md:p-6 overflow-x-auto">
        {activeTab === 'overview' ? (
          /* ========================================================================= */
          /* VUE D'ENSEMBLE (PHOTO 1) : TABLEAU SYNTHÉTIQUE DES ÉVÉNEMENTS + LÉGENDE   */
          /* ========================================================================= */
          <div className="max-w-[1700px] mx-auto space-y-6 animate-fadeIn">
            {/* Tableau principal des événements */}
            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-amber-600 px-4 py-2.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span className="font-black text-sm uppercase tracking-wider">
                    Tableau Récapitulatif des Événements & Objectifs
                  </span>
                </div>
                <button
                  onClick={handleOpenNewEvent}
                  className="px-3 py-1 bg-white text-amber-900 hover:bg-amber-50 rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Ajouter un événement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#D97706] text-white border-b-2 border-amber-700 text-xs font-black uppercase">
                      <th className="py-3 px-4 border-r border-amber-600 w-56">Événement</th>
                      <th className="py-3 px-4 border-r border-amber-600 w-36 text-center">Date</th>
                      <th className="py-3 px-4 border-r border-amber-600 w-80">Objectif principal</th>
                      <th className="py-3 px-4 border-r border-amber-600">Contenu & Modalités</th>
                      <th className="py-3 px-3 text-center w-28 no-print">Accès</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                          Aucun événement configuré. Cliquez sur « Ajouter un événement ».
                        </td>
                      </tr>
                    ) : (
                      events.map((evt, idx) => (
                        <tr
                          key={evt.id}
                          className={`hover:bg-amber-50/60 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                        >
                          {/* Événement */}
                          <td className="py-3.5 px-4 border-r border-slate-200 font-black text-slate-900">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: evt.color || '#D97706' }}
                              />
                              <button
                                onClick={() => setActiveTab(evt.id)}
                                className="text-left font-black text-indigo-700 hover:text-indigo-900 hover:underline leading-snug"
                              >
                                {evt.title}
                              </button>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-4 border-r border-slate-200 font-bold text-slate-800 text-center whitespace-nowrap bg-amber-50/30">
                            {evt.date}
                          </td>

                          {/* Objectif principal */}
                          <td className="py-3.5 px-4 border-r border-slate-200 font-semibold text-slate-800 leading-relaxed">
                            {evt.objective}
                          </td>

                          {/* Contenu */}
                          <td className="py-3.5 px-4 border-r border-slate-200 text-slate-600 leading-relaxed font-normal">
                            {evt.content}
                          </td>

                          {/* Actions / Accès */}
                          <td className="py-3.5 px-3 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setActiveTab(evt.id)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition"
                                title="Ouvrir la feuille de rétroplanning"
                              >
                                <ChevronRight size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEditEvent(evt)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="Modifier les infos"
                              >
                                <Edit3 size={14} />
                              </button>
                              {events.length > 1 && (
                                <button
                                  onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                  className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                  title="Supprimer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section LÉGENDE DES PHASES (PHOTO 1) */}
            <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-[#0F2756] text-white px-4 py-2 font-black text-xs uppercase tracking-wider text-center">
                LÉGENDE OFFICIELLE DES COULEURS ET DES PHASES
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                {RETRO_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div
                      style={{ backgroundColor: `${cat.blockColor}25`, borderLeft: `6px solid ${cat.blockColor}` }}
                      className="w-full sm:w-60 py-2.5 px-4 font-black text-slate-900 shrink-0 flex items-center gap-2 border-r border-slate-200"
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0" style={{ backgroundColor: cat.blockColor }} />
                      <span>{cat.label}</span>
                    </div>
                    <div className="py-2.5 px-4 text-slate-600 font-medium leading-normal flex-1">
                      {cat.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FICHE D'ÉVÉNEMENT SPÉCIFIQUE (PHOTO 2 : EX. ESCAPE GAME)                  */
          /* ========================================================================= */
          currentEvent && (
            <div className="max-w-[1850px] mx-auto space-y-4 animate-fadeIn">
              {/* En-tête de synthèse de l'événement */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: currentEvent.color || '#3B82F6' }} />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Rétroplanning détaillé : {currentEvent.title}
                    </h3>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-black">
                      📅 Date : {currentEvent.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    🎯 <strong>Objectif :</strong> {currentEvent.objective}
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={handleOpenNewTask}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Ajouter une action</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditEvent(currentEvent)}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    <span>Modifier l’événement</span>
                  </button>
                </div>
              </div>

              {/* GRILLE RÉTROPLANNING HAUTE FIDÉLITÉ (PHOTO 2) */}
              <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300 text-xs font-black text-slate-800 uppercase">
                        <th className="py-2.5 px-3 border-r border-slate-300 w-32 text-center">Semaine</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 w-36 text-center">Catégorie</th>
                        <th className="py-2.5 px-4 border-r border-slate-300 w-96">Action / Tâche</th>
                        {/* Colonnes de timeline pour chaque semaine de l'événement */}
                        {eventWeeks.map((w) => (
                          <th
                            key={w}
                            className="py-2.5 px-2 border-r border-slate-300 text-center font-black text-[11px] min-w-[70px] bg-slate-200/80"
                          >
                            {w}
                          </th>
                        ))}
                        <th className="py-2.5 px-3 border-r border-slate-300 w-40 text-center">Responsable</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Statut</th>
                        <th className="py-2.5 px-2 text-center w-20 no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {currentEvent.tasks.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5 + eventWeeks.length}
                            className="py-10 text-center text-slate-400 font-bold"
                          >
                            Aucune action pour cet événement. Cliquez sur « Ajouter une action ».
                          </td>
                        </tr>
                      ) : (
                        currentEvent.tasks.map((task) => {
                          const catStyle = getCategoryStyle(task.category);
                          const isEventRow = task.isEventHighlight || task.status === 'event';

                          return (
                            <tr
                              key={task.id}
                              className={`transition ${
                                isEventRow
                                  ? 'bg-red-600 text-white font-black hover:bg-red-700'
                                  : 'hover:bg-slate-50 bg-white'
                              }`}
                            >
                              {/* 1. Semaine */}
                              <td
                                className={`py-3 px-3 border-r text-center font-black whitespace-nowrap ${
                                  isEventRow
                                    ? 'border-red-500 text-white text-xs'
                                    : 'border-slate-200 text-slate-800 bg-slate-50/60'
                                }`}
                              >
                                {task.weekLabel}
                              </td>

                              {/* 2. Catégorie */}
                              <td
                                className={`py-3 px-3 border-r text-center font-bold ${
                                  isEventRow ? 'border-red-500 text-white' : 'border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-black inline-block ${
                                    isEventRow ? 'bg-red-700 text-white' : `${catStyle.bgBadge} ${catStyle.textBadge}`
                                  }`}
                                >
                                  {task.category}
                                </span>
                              </td>

                              {/* 3. Action */}
                              <td
                                className={`py-3 px-4 border-r font-bold leading-snug ${
                                  isEventRow ? 'border-red-500 text-white text-sm' : 'border-slate-200 text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isEventRow && <Sparkles size={16} className="text-amber-300 shrink-0" />}
                                  <span>{task.action}</span>
                                </div>
                              </td>

                              {/* 4. Timeline visuelle par colonnes de semaines */}
                              {eventWeeks.map((w) => {
                                const targetWeekKey = w.split(' ')[0].toUpperCase();
                                const taskWeekKey = task.weekLabel.split(' ')[0].toUpperCase();
                                const isMatched = task.weekLabel.trim() === w.trim() || taskWeekKey === targetWeekKey;

                                return (
                                  <td
                                    key={w}
                                    className={`py-3 px-1 border-r text-center relative ${
                                      isEventRow ? 'border-red-500 bg-red-600' : 'border-slate-200'
                                    }`}
                                  >
                                    {isEventRow ? (
                                      /* Ligne événement traversante en rouge */
                                      <div className="h-6 rounded bg-red-700/80 flex items-center justify-center text-[10px] font-black text-white">
                                        EVENT
                                      </div>
                                    ) : isMatched ? (
                                      /* Bloc coloré plein de la catégorie pour cette semaine */
                                      <div
                                        style={{ backgroundColor: catStyle.blockColor }}
                                        className="h-6 rounded-md shadow-xs flex items-center justify-center text-[10px] font-black text-white"
                                        title={`${task.category} (${w})`}
                                      />
                                    ) : null}
                                  </td>
                                );
                              })}

                              {/* 5. Responsable */}
                              <td
                                className={`py-3 px-3 border-r text-center font-black ${
                                  isEventRow ? 'border-red-500 text-white' : 'border-slate-200 text-slate-800'
                                }`}
                              >
                                {task.assignee}
                              </td>

                              {/* 6. Statut */}
                              <td
                                className={`py-3 px-3 border-r text-center ${
                                  isEventRow ? 'border-red-500' : 'border-slate-200'
                                }`}
                              >
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block ${
                                    isEventRow
                                      ? 'bg-white text-red-700'
                                      : task.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : task.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {isEventRow
                                    ? 'EVENT'
                                    : task.status === 'completed'
                                    ? 'Fait'
                                    : task.status === 'in_progress'
                                    ? 'En cours'
                                    : 'À faire'}
                                </span>
                              </td>

                              {/* 7. Actions */}
                              <td className="py-3 px-2 text-center no-print">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditTask(task)}
                                    className={`p-1 rounded ${
                                      isEventRow
                                        ? 'text-white hover:bg-red-700'
                                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Modifier cette action"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className={`p-1 rounded ${
                                      isEventRow
                                        ? 'text-white hover:bg-red-700'
                                        : 'text-rose-400 hover:text-rose-700 hover:bg-rose-50'
                                    }`}
                                    title="Supprimer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* 4. BARRE D'ONGLETS BASSE STYLE FEUILLES EXCEL (PHOTO 1 & 2) */}
      <div className="bg-slate-200 border-t-2 border-slate-300 px-4 py-1.5 flex items-center gap-1 overflow-x-auto shadow-inner no-print">
        <span className="text-[11px] font-black uppercase text-slate-500 mr-2 shrink-0">
          Feuilles :
        </span>

        {/* Onglet 1 : Vue d'ensemble */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-t-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 border-t-2 ${
            activeTab === 'overview'
              ? 'bg-white text-indigo-700 border-indigo-600 shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-white hover:text-slate-900 border-transparent'
          }`}
        >
          <FileText size={13} />
          <span>Vue d'ensemble</span>
        </button>

        {/* Onglets des Événements individuels */}
        {events.map((evt) => (
          <button
            key={evt.id}
            onClick={() => setActiveTab(evt.id)}
            className={`px-4 py-1.5 rounded-t-lg text-xs font-black transition flex items-center gap-1.5 shrink-0 border-t-2 ${
              activeTab === evt.id
                ? 'bg-white text-blue-700 border-blue-600 shadow-xs'
                : 'bg-slate-100/90 text-slate-600 hover:bg-white hover:text-slate-900 border-transparent'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: evt.color || '#3B82F6' }}
            />
            <span className="truncate max-w-[180px]">{evt.title}</span>
          </button>
        ))}

        {/* Bouton pour créer une nouvelle feuille d'événement */}
        <button
          onClick={handleOpenNewEvent}
          className="px-3 py-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1 shrink-0 ml-1"
          title="Ajouter un nouvel événement"
        >
          <Plus size={14} />
          <span>Nouvelle feuille</span>
        </button>
      </div>

      {/* MODALE : CRÉATION / MODIFICATION D'ÉVÉNEMENT */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingEvent ? 'Modifier l’événement' : 'Ajouter un événement (Feuille de rétroplanning)'}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom de l'événement :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escape Game, Simulation entreprise..."
                  value={eventFormTitle}
                  onChange={(e) => setEventFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date de l'événement :
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 15-oct-26, 05-nov-26..."
                  value={eventFormDate}
                  onChange={(e) => setEventFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Objectif principal :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Initiation aux notions de l'entreprenariat pour les BUT 1"
                  value={eventFormObjective}
                  onChange={(e) => setEventFormObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contenu détaillé & Modalités :
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Mise en avant des notions... Possibilité de le mettre obligatoire sur l'emploi du temps..."
                  value={eventFormContent}
                  onChange={(e) => setEventFormContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : CRÉATION / MODIFICATION D'UNE TÂCHE RÉTROPLANNING */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingTask ? 'Modifier l’action' : 'Ajouter une action au rétroplanning'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semaine :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: S39, S40, S42 (12 oct.)..."
                    value={taskFormWeek}
                    onChange={(e) => setTaskFormWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie :
                  </label>
                  <select
                    value={taskFormCategory}
                    onChange={(e) => setTaskFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {RETRO_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action / Descriptif :
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Créer le formulaire d'inscription en ligne..."
                  value={taskFormAction}
                  onChange={(e) => setTaskFormAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 leading-snug"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Responsable :
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Laurine COGHE, Toute l'équipe..."
                    value={taskFormAssignee}
                    onChange={(e) => setTaskFormAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Statut :
                  </label>
                  <select
                    value={taskFormStatus}
                    onChange={(e) => setTaskFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé (Fait)</option>
                    <option value="event">EVENT</option>
                  </select>
                </div>
              </div>

              {/* Option ligne Jour J */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is-event-checkbox"
                  checked={taskFormIsEvent}
                  onChange={(e) => setTaskFormIsEvent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="is-event-checkbox" className="text-xs font-bold text-red-900 cursor-pointer">
                  Marquer comme événement Jour J (Ligne rouge vif traversante)
                </label>
              </div>

              <div className="border-t pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Enregistrer l'action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
