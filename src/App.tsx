import React from 'react';
import { PlanningProvider, usePlanning } from './context/PlanningContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Header } from './components/Header';
import { GanttChartView } from './components/GanttChartView';
import { CalendarView } from './components/CalendarView';
import { TaskListView } from './components/TaskListView';
import { TaskModal } from './components/TaskModal';
import { Footer } from './components/Footer';
import { GanttExportCanvas } from './components/GanttExportCanvas';
import { RetroplanningView } from './components/RetroplanningView';
import { NavigationSidebar } from './components/NavigationSidebar';
import { HomeHubView } from './components/workspace/HomeHubView';
import { IdeasNotesView } from './components/workspace/IdeasNotesView';
import { TeamMessagesView } from './components/workspace/TeamMessagesView';
import { CheckCircle2, Clock, Sparkles, Eye, Lock } from 'lucide-react';
import { formatDateFr, sortTasksChronologically } from './utils/scheduler';

const MainLayout: React.FC = () => {
  const { viewMode, setViewMode, currentProject, members, isAuthorized, currentUser, openAuthModal } = usePlanning();

  const totalTasks = currentProject.tasks.length;
  const completedTasks = currentProject.tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = currentProject.tasks.filter((t) => t.status === 'in_progress').length;
  const nextMilestone = sortTasksChronologically(
    currentProject.tasks.filter((t) => t.isMilestone && t.status !== 'completed')
  )[0];

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Sommaire latéral en tiroir et onglet flottant */}
      <NavigationSidebar />

      <Header />

      {/* Barre de synthèse & KPIs sobre */}
      <div className="px-6 py-1.5 bg-white/60 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 backdrop-blur-xs flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Avancement :</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span><strong className="text-slate-700 dark:text-slate-200">{completedTasks}</strong> terminée{completedTasks > 1 ? 's' : ''}</span>
          </span>

          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-blue-500" />
            <span><strong className="text-slate-700 dark:text-slate-200">{inProgressTasks}</strong> en cours</span>
          </span>
        </div>

        {nextMilestone && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Sparkles size={11} className="text-amber-500 shrink-0" />
            <span className="truncate max-w-[500px]">
              Prochain jalon : <strong className="text-slate-700 dark:text-slate-200">{nextMilestone.title}</strong> ({formatDateFr(nextMilestone.startDate, 'dd MMM')})
            </span>
          </div>
        )}
      </div>

      {/* Conteneur principal de la vue */}
      <main id="planning-main-view" className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden max-w-[1920px] w-full mx-auto">
        {viewMode === 'home' && <HomeHubView />}
        {(viewMode === 'gantt' || viewMode === 'timeline') && <GanttChartView />}
        {viewMode === 'retroplanning' && <RetroplanningView />}
        {viewMode === 'ideas' && (
          isAuthorized ? (
            <IdeasNotesView />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Boîte à Idées Restreinte</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {currentUser?.isBde
                      ? "L'accès à la boîte à idées et de brainstorming est réservé à l'équipe organisatrice Run & Fun."
                      : "En mode lecture, la boîte à idées et de brainstorming est masquée pour préserver la confidentialité du projet."}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setViewMode('home')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Retour à l'accueil
                  </button>
                  {!currentUser && (
                    <button
                      onClick={openAuthModal}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs"
                    >
                      Se connecter
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}
        {viewMode === 'messages' && (
          currentUser ? (
            <TeamMessagesView />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-lg space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Messagerie Interne Protégée</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    En mode lecture, l'accès aux canaux de discussion de l'équipe est restreint. Veuillez vous connecter avec un compte membre ou partenaire pour y accéder.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setViewMode('home')}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Retour à l'accueil
                  </button>
                  <button
                    onClick={openAuthModal}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                  >
                    Se connecter
                  </button>
                </div>
              </div>
            </div>
          )
        )}
        {viewMode === 'calendar' && <CalendarView />}
        {viewMode === 'list' && <TaskListView />}
      </main>

      {/* Pied de page & Liens X / GitHub */}
      <Footer />

      {/* Modale d'ajout / modification de tâche */}
      <TaskModal />

      {/* Cible d'export HD complète (invisible à l'écran par défaut, accessible pour le rendu PDF/PNG paysage et impression vectorielle) */}
      <div
        id="export-canvas-container"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
        aria-hidden="true"
      >
        <GanttExportCanvas project={currentProject} members={members} />
      </div>
    </div>
  );
};

export function App() {
  return (
    <PlanningProvider>
      <WorkspaceProvider>
        <MainLayout />
      </WorkspaceProvider>
    </PlanningProvider>
  );
}

export default App;
