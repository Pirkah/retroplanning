import React, { useEffect } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { ViewMode } from '../types/planning';
import {
  Home,
  GanttChartSquare,
  FileSpreadsheet,
  Lightbulb,
  MessageSquare,
  Calendar as CalendarIcon,
  ListOrdered,
  X,
  ChevronRight,
  FolderKanban,
  Printer,
  Share2,
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { sortRetroEventsChronologically } from '../utils/scheduler';

export const NavigationSidebar: React.FC = () => {
  const {
    projects,
    currentProject,
    activeProjectId,
    setActiveProjectId,
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    retroActiveTab,
    setRetroActiveTab,
    currentUser,
    isAuthorized,
    openAuthModal
  } = usePlanning();

  const events = sortRetroEventsChronologically(currentProject.events || []);

  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, setIsSidebarOpen]);

  const handleNavigateToView = (mode: ViewMode) => {
    setViewMode(mode);
    setIsSidebarOpen(false);
  };

  const handleNavigateToRetroTab = (tabId: string) => {
    setViewMode('retroplanning');
    setRetroActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* 1. Toile de fond (Backdrop flouté) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* 2. Tiroir coulissant (Drawer) ouvert via le bouton Sommaire du haut */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-white z-50 shadow-2xl flex flex-col border-r border-slate-200 transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sommaire et navigation de l'application"
      >
        {/* En-tête du sommaire */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Sommaire du Logiciel
              </h2>
              <p className="text-[11px] text-slate-500">Navigation rapide entre les pages</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-lg transition"
            title="Fermer le sommaire"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {/* CARTE : Statut de connexion de l'utilisateur */}
          <div className="rounded-2xl border p-3.5 bg-slate-50/70 border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Session active
              </span>
              {isAuthorized ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  <Lock size={9} />
                  Lecture seule
                </span>
              )}
            </div>

            {isAuthorized && currentUser ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                    style={{ backgroundColor: currentUser.color || '#10B981' }}
                  >
                    {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {currentUser.role || 'Éditeur'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openAuthModal()}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition shrink-0"
                  title="Gérer la session ou se déconnecter"
                >
                  Gérer
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                    <Lock size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Non connecté</p>
                    <p className="text-[10px] text-slate-400">Mode lecture seule</p>
                  </div>
                </div>
                <button
                  onClick={() => openAuthModal()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Se connecter
                </button>
              </div>
            )}
          </div>

          {/* SECTION : NAVIGATION PRINCIPALE DES PAGES */}
          <div className="space-y-1.5">
            <div className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
              Espaces & Pages
            </div>

            {/* 0. ACCUEIL & HUB ÉQUIPE */}
            <div
              onClick={() => handleNavigateToView('home')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'home'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold border-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'home'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700 group-hover:scale-105'
                  }`}
                >
                  <Home size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">Accueil & Hub Équipe</p>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold uppercase ${
                      viewMode === 'home' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Vue d'ensemble
                    </span>
                  </div>
                  <p className={`text-[10px] ${viewMode === 'home' ? 'text-slate-300' : 'text-slate-400'}`}>
                    Portail central de choix de modules
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'home' ? 'text-white translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>

            {/* 1. DIAGRAMME DE GANTT */}
            <div
              onClick={() => handleNavigateToView('gantt')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'gantt'
                  ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs font-bold text-indigo-950'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'gantt'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-100 text-indigo-700 group-hover:scale-105'
                  }`}
                >
                  <GanttChartSquare size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">1. Diagramme de Gantt</p>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-extrabold uppercase">
                      Timeline
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {currentProject.tasks.length} tâche(s) avec barres colorées
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'gantt' ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>

            {/* 2. RÉTROPLANNING (STYLE EXCEL) + SOUS-ONGLETS CHRONOLOGIQUES */}
            <div className="space-y-1">
              <div
                onClick={() => handleNavigateToRetroTab('overview')}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                  viewMode === 'retroplanning' && retroActiveTab === 'overview'
                    ? 'bg-blue-50/80 border-blue-300 shadow-2xs font-bold text-blue-950'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      viewMode === 'retroplanning'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-blue-100 text-blue-700 group-hover:scale-105'
                    }`}
                  >
                    <FileSpreadsheet size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold">2. Rétroplanning</p>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-extrabold uppercase">
                        Excel
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Vue d'ensemble + feuilles par événement
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-transform ${
                    viewMode === 'retroplanning' ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                  }`}
                />
              </div>

              {/* Sous-pages de Rétroplanning (Arborescence élégante) */}
              <div className="ml-5 pl-3 border-l-2 border-slate-200/80 space-y-1 py-1">
                <button
                  onClick={() => handleNavigateToRetroTab('overview')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                    viewMode === 'retroplanning' && retroActiveTab === 'overview'
                      ? 'bg-blue-100/70 text-blue-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">📋 Vue d'ensemble (Récapitulatif)</span>
                  <span className="text-[10px] text-slate-400">
                    {events.length} évts
                  </span>
                </button>

                {events.map((evt, idx) => {
                  const isActive = viewMode === 'retroplanning' && retroActiveTab === evt.id;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => handleNavigateToRetroTab(evt.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between group ${
                        isActive
                          ? 'bg-blue-100/70 text-blue-900 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">
                        #{idx + 1} {evt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-600 shrink-0 ml-1">
                        {evt.date}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. BOÎTE À IDÉES & NOTES */}
            <div
              onClick={() => handleNavigateToView('ideas')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'ideas'
                  ? 'bg-amber-50/80 border-amber-300 shadow-2xs font-bold text-amber-950'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'ideas'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-700 group-hover:scale-105'
                  }`}
                >
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">3. Boîte à Idées & Notes</p>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-extrabold uppercase">
                      Brainstorming
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Propositions, votes et statuts</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'ideas' ? 'text-amber-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>

            {/* 4. MESSAGERIE D'ÉQUIPE PAR SUJETS */}
            <div
              onClick={() => handleNavigateToView('messages')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'messages'
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs font-bold text-emerald-950'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'messages'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-100 text-emerald-700 group-hover:scale-105'
                  }`}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold">4. Messagerie par Sujets</p>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-extrabold uppercase">
                      Chat
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Salons #général, #course, #sponsors...</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'messages' ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>

            {/* 5. CALENDRIER */}
            <div
              onClick={() => handleNavigateToView('calendar')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'calendar'
                  ? 'bg-purple-50/80 border-purple-300 shadow-2xs font-bold text-purple-950'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'calendar'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:scale-105'
                  }`}
                >
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">5. Calendrier Mensuel</p>
                  <p className="text-[10px] text-slate-400">Vue chronologique globale</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'calendar' ? 'text-purple-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>

            {/* 6. LISTE DES TÂCHES */}
            <div
              onClick={() => handleNavigateToView('list')}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                viewMode === 'list'
                  ? 'bg-slate-100 border-slate-400 shadow-2xs font-bold text-slate-900'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                    viewMode === 'list'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:scale-105'
                  }`}
                >
                  <ListOrdered size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">6. Liste des Tâches</p>
                  <p className="text-[10px] text-slate-400">Format tableau avec filtres</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  viewMode === 'list' ? 'text-slate-800 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                }`}
              />
            </div>
          </div>

          {/* SECTION : SÉLECTEUR DE PLANNING / PROJET */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Plannings disponibles</span>
              <span className="text-[10px] font-normal text-slate-400">({projects.length})</span>
            </div>

            <div className="space-y-1">
              {projects.map((proj) => {
                const isCurrent = proj.id === activeProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderKanban size={14} className={isCurrent ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                      {proj.tasks.length} t.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pied du tiroir */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-center text-[10px] text-slate-400">
          Rétroplanning R&F 2026 • Système Collaboratif
        </div>
      </aside>
    </>
  );
};
