import React from 'react';
import { PlanningProvider, usePlanning } from './context/PlanningContext';
import { Header } from './components/Header';
import { GanttChartView } from './components/GanttChartView';
import { CalendarView } from './components/CalendarView';
import { TaskListView } from './components/TaskListView';
import { TaskModal } from './components/TaskModal';
import { Footer } from './components/Footer';
import { GanttExportCanvas } from './components/GanttExportCanvas';
import { RetroplanningView } from './components/RetroplanningView';
import { CheckCircle2, Clock, Sparkles, Eye, Lock } from 'lucide-react';
import { formatDateFr } from './utils/scheduler';

const MainLayout: React.FC = () => {
  const { viewMode, currentProject, members, isAuthorized, openAuthModal } = usePlanning();

  const totalTasks = currentProject.tasks.length;
  const completedTasks = currentProject.tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = currentProject.tasks.filter((t) => t.status === 'in_progress').length;
  const nextMilestone = currentProject.tasks.find((t) => t.isMilestone && t.status !== 'completed');

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      <Header />

      {/* Bandeau d'information Mode Lecteur */}
      {!isAuthorized && (
        <div className="bg-amber-500/10 border-b border-amber-200/80 px-6 py-2 flex items-center justify-between text-xs text-amber-900 transition-all">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-amber-700 shrink-0" />
            <span>
              <strong>Mode Lecteur actif :</strong> Vous visualisez le planning en lecture seule. Saisissez le mot de passe pour modifier les tâches.
            </span>
          </div>
          <button
            onClick={openAuthModal}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs transition"
          >
            <Lock size={12} />
            <span>Passer en Mode Édition</span>
          </button>
        </div>
      )}

      {/* Barre de synthèse & KPIs rapides */}
      <div className="px-6 py-2 bg-white/70 border-b border-slate-200/60 backdrop-blur-xs flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Avancement global :</span>
            <span className="font-bold text-slate-800">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </span>
            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {completedTasks} terminée{completedTasks > 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={14} className="text-blue-500" />
              {inProgressTasks} en cours
            </span>
          </div>
        </div>

        {nextMilestone && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px] font-semibold">
            <Sparkles size={12} className="text-amber-600" />
            <span>Prochain jalon : <strong>{nextMilestone.title}</strong> ({formatDateFr(nextMilestone.startDate, 'dd MMM')})</span>
          </div>
        )}
      </div>

      {/* Conteneur principal de la vue */}
      <main id="planning-main-view" className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden max-w-[1920px] w-full mx-auto">
        {(viewMode === 'gantt' || viewMode === 'timeline') && <GanttChartView />}
        {viewMode === 'retroplanning' && <RetroplanningView />}
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
      <MainLayout />
    </PlanningProvider>
  );
}

export default App;
