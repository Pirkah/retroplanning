import React from 'react';
import { usePlanning } from '../../context/PlanningContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  GanttChartSquare,
  FileSpreadsheet,
  Lightbulb,
  MessageSquare,
  Calendar as CalendarIcon,
  ListOrdered,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  ShieldCheck,
  TrendingUp,
  Heart,
  ChevronRight,
  Plus
} from 'lucide-react';
import { sortRetroEventsChronologically, formatDateFr } from '../../utils/scheduler';

export const HomeHubView: React.FC = () => {
  const {
    currentProject,
    setViewMode,
    setRetroActiveTab,
    currentUser,
    isAuthorized,
    openAuthModal,
    members,
    onlineCount,
    isMemberOnline
  } = usePlanning();

  const { ideas, messages, channels, setActiveChannelId } = useWorkspace();

  const events = sortRetroEventsChronologically(currentProject.events || []);
  const totalTasks = currentProject.tasks.length;
  const completedTasks = currentProject.tasks.filter((t) => t.status === 'completed').length;
  const topIdeas = [...ideas].sort((a, b) => b.likes - a.likes).slice(0, 3);
  const latestMessages = [...messages].slice(-3).reverse();

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto w-full">
      {/* 1. HERO BANNER DE BIENVENUE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-60 h-60 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Espace Collaboratif Run & Fun 2026</span>
              <span className="text-indigo-400/60">•</span>
              <span>{onlineCount} membre{onlineCount > 1 ? 's' : ''} en direct</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Bonjour {currentUser?.name ? currentUser.name.split(' ')[0] : 'l’équipe'} ! 👋
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Bienvenue sur votre plateforme tout-en-un. Planifiez la course, notez vos idées créatives, échangez par salon de discussion et suivez chaque étape du projet.
            </p>
          </div>

          {/* Profil connecté & Accès rapide */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-3 min-w-[240px]">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
                style={{ backgroundColor: currentUser?.color || '#10B981' }}
              >
                {currentUser?.initials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'RF')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {currentUser?.name || 'Visiteur'}
                </p>
                <p className="text-xs text-indigo-200 truncate">
                  {currentUser?.role || (isAuthorized ? 'Mode Éditeur' : 'Lecture seule')}
                </p>
              </div>
            </div>

            <button
              onClick={openAuthModal}
              className="w-full py-2 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-white/20"
            >
              {isAuthorized ? <ShieldCheck size={14} className="text-emerald-400" /> : null}
              <span>{isAuthorized ? 'Gérer mon profil' : 'Se connecter pour modifier'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRILLE DES 4 GRANDS MODULES ("OÙ VOULEZ-VOUS ALLER ?") */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Modules de Travail</span>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Cliquez pour accéder</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choisissez l'espace sur lequel vous souhaitez collaborer aujourd'hui</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* MODULE 1 : RÉTROPLANNING (STYLE EXCEL) */}
          <div
            onClick={() => {
              setViewMode('retroplanning');
              setRetroActiveTab('overview');
            }}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                  <FileSpreadsheet size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  Excel & Événements
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Rétroplanning par Événements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Vue d'ensemble chronologique et feuilles préparatoires dédiées aux 4 grands événements de l'année.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{events.length} événements configurés</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Ouvrir le Rétroplanning</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* MODULE 2 : DIAGRAMME DE GANTT */}
          <div
            onClick={() => setViewMode('gantt')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                  <GanttChartSquare size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                  Timeline
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Diagramme de Gantt
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Timeline visuelle des tâches avec barres de couleur par catégorie, filtre et export HD A3/A4.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{totalTasks} tâches au total ({completedTasks} terminées)</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Accéder au Gantt</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* MODULE 3 : BOÎTE À IDÉES & NOTES */}
          <div
            onClick={() => setViewMode('ideas')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                  <Lightbulb size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  Brainstorming
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Boîte à Idées & Notes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Proposez des idées pour la course, les animations, les partenaires, votez et validez-les en équipe.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{ideas.length} idées déposées et débattues</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Explorer les Idées</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* MODULE 4 : MESSAGERIE D'ÉQUIPE PAR SUJETS */}
          <div
            onClick={() => setViewMode('messages')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                  <MessageSquare size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  Messagerie Carrée
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Discussions par Sujets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Salons thématiques (#général, #course-2026, #partenaires, #communication) pour échanger sans se disperser.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{channels.length} salons thématiques actifs</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Rejoindre les discussions</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* MODULE 5 : CALENDRIER */}
          <div
            onClick={() => setViewMode('calendar')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                  <CalendarIcon size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                  Mois par Mois
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Calendrier Mensuel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Repérage visuel des échéances importantes et des jalons semaine par semaine.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Vue d'ensemble par grille</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Voir le calendrier</span>
              <ArrowRight size={15} />
            </div>
          </div>

          {/* MODULE 6 : LISTE COMPLÈTE DES TÂCHES */}
          <div
            onClick={() => setViewMode('list')}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-500 p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-105 group-hover:bg-slate-800 dark:group-hover:bg-slate-700 group-hover:text-white transition-all shadow-xs">
                  <ListOrdered size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Tableau & Filtres
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Tableau Récapitulatif
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Filtres par statut, recherche de mot-clé et modification rapide de toutes les tâches.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>{totalTasks} entrées modifiables</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:translate-x-1 transition-transform">
              <span>Ouvrir la liste</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION WIDGETS : ÉVÉNEMENTS CHRONOLOGIQUES & ÉQUIPE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 & 2 : Les 4 Événements Chronologiques */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Feuille de Route des 4 Événements (Chronologique)
              </h3>
            </div>
            <button
              onClick={() => {
                setViewMode('retroplanning');
                setRetroActiveTab('overview');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>Vue détaillée Excel</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {events.map((evt, idx) => (
              <div
                key={evt.id}
                onClick={() => {
                  setViewMode('retroplanning');
                  setRetroActiveTab(evt.id);
                }}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">
                    Événement #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{evt.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {evt.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {evt.objective}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>{evt.tasks.length} actions préparatoires</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    Voir la feuille →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 3 : L'Équipe Run & Fun 2026 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                <Users size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Équipe Run & Fun</h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {onlineCount} en ligne
            </span>
          </div>

          <div className="space-y-2.5">
            {members.map((member) => {
              const isOnline = isMemberOnline(member.id) || isMemberOnline(member.name);
              return (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition flex items-center gap-3"
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      title={isOnline ? 'En ligne' : 'Hors ligne'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{member.name}</p>
                      <span className={`text-[10px] font-medium shrink-0 ${isOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                        {isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{member.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. SECTION D'ACTUALITÉS : DERNIERS MESSAGES & TOP IDÉES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dernières discussions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Derniers échanges de l'équipe</h3>
            </div>
            <button
              onClick={() => setViewMode('messages')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Ouvrir le chat →
            </button>
          </div>

          <div className="space-y-2">
            {latestMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setActiveChannelId(msg.channelId);
                  setViewMode('messages');
                }}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition flex items-start gap-2.5"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.authorColor }}
                >
                  {msg.authorInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{msg.authorName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(msg.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top idées du moment */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Lightbulb size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Idées les plus plébiscitées</h3>
            </div>
            <button
              onClick={() => setViewMode('ideas')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              Voir la boîte →
            </button>
          </div>

          <div className="space-y-2">
            {topIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => setViewMode('ideas')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer transition flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      {idea.category}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{idea.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{idea.content}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-rose-500 shrink-0 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-lg">
                  <Heart size={12} fill="currentColor" />
                  <span>{idea.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
