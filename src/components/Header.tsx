import React, { useState, useRef } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { COLOR_PRESETS, ViewMode } from '../types/planning';
import {
  Calendar as CalendarIcon,
  GanttChartSquare,
  ListOrdered,
  Plus,
  Search,
  Download,
  Upload,
  FolderKanban,
  Trash2,
  Edit3,
  Check,
  X,
  FileImage,
  FileCode,
  FileText,
  FileSpreadsheet,
  Loader2,
  Users,
  Wifi,
  Share2,
  Copy,
  Lock,
  Unlock,
  Eye,
  Printer,
  ChevronDown,
  Menu,
  Home,
  Lightbulb,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { TeamModal } from './TeamModal';
import { AuthModal } from './AuthModal';
import {
  exportGanttToPdf,
  exportGanttToPng,
  printGantt,
  printRetroplanning,
  exportRetroplanningToPdf,
  exportRetroplanningToPng
} from '../utils/pdfExport';

export const Header: React.FC = () => {
  const {
    projects,
    currentProject,
    activeProjectId,
    setActiveProjectId,
    createNewProject,
    deleteProject,
    updateProjectMeta,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedColor,
    setSelectedColor,
    openNewTaskModal,
    exportProjectJson,
    importProjectJson,
    onlineCount,
    isWebSocketConnected,
    serverInfo,
    isAuthorized,
    openAuthModal,
    currentUser,
    toggleSidebar,
    theme,
    toggleTheme
  } = usePlanning();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(currentProject.name);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      updateProjectMeta(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCreateProjectPrompt = () => {
    const name = prompt('Nom du nouveau rétroplanning :');
    if (name && name.trim()) {
      createNewProject(name.trim());
      setIsProjectDropdownOpen(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importProjectJson(content);
        if (ok) alert('Planning importé avec succès !');
        else alert('Erreur lors de l’import.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExportPdf = async (format: 'a3' | 'a4') => {
    setIsExportMenuOpen(false);
    try {
      await exportGanttToPdf({
        projectName: currentProject.name,
        format,
        onProgress: (msg) => setExportStatus(msg)
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setExportStatus(null);
    }
  };

  const handleExportPng = async () => {
    setIsExportMenuOpen(false);
    try {
      await exportGanttToPng(currentProject.name, (msg) => setExportStatus(msg));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export de l'image.");
    } finally {
      setExportStatus(null);
    }
  };

  const handlePrintGantt = () => {
    setIsExportMenuOpen(false);
    printGantt();
  };

  const handlePrintRetroplanning = () => {
    setIsExportMenuOpen(false);
    if (viewMode !== 'retroplanning') {
      setViewMode('retroplanning');
      setTimeout(() => {
        printRetroplanning();
      }, 250);
    } else {
      printRetroplanning();
    }
  };

  const handleExportRetroPdf = async (format: 'a3' | 'a4') => {
    setIsExportMenuOpen(false);
    try {
      if (viewMode !== 'retroplanning') {
        setViewMode('retroplanning');
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await exportRetroplanningToPdf({
        projectName: currentProject.name,
        format,
        onProgress: (msg) => setExportStatus(msg)
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF du rétroplanning.");
    } finally {
      setExportStatus(null);
    }
  };

  const handleExportRetroPng = async () => {
    setIsExportMenuOpen(false);
    try {
      if (viewMode !== 'retroplanning') {
        setViewMode('retroplanning');
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await exportRetroplanningToPng(currentProject.name, undefined, (msg) => setExportStatus(msg));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export de l'image du rétroplanning.");
    } finally {
      setExportStatus(null);
    }
  };

  const isPublicHost = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);
  const shareUrl = isPublicHost
    ? window.location.origin
    : serverInfo?.localIp
    ? `http://${serverInfo.localIp}:${serverInfo.port || 5173}`
    : window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      {/* Ligne 1 : Titre, Projets, Présence Temps Réel & Actions d'Équipe */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          {/* Bouton Sommaire pour ouvrir le tiroir de navigation gauche */}
          <button
            onClick={toggleSidebar}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/90 dark:border-slate-700 shadow-2xs group"
            title="Ouvrir le sommaire (Gantt, Rétroplanning, Calendrier...)"
          >
            <Menu size={15} className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Sommaire</span>
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none">
            <CalendarIcon size={22} />
          </div>

          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-2 py-1 text-base font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button onClick={handleSaveTitle} className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {currentProject.name}
                </h1>
                <button
                  onClick={() => {
                    if (!isAuthorized) {
                      openAuthModal();
                      return;
                    }
                    setEditedTitle(currentProject.name);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                  title="Renommer le rétroplanning"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{currentProject.tasks.length} tâche(s)</span>
              <span>•</span>
              {/* Badge temps réel */}
              <div className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWebSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isWebSocketConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                  {isWebSocketConnected
                    ? `En direct (${onlineCount} connecté${onlineCount > 1 ? 's' : ''})`
                    : 'Mode local'}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Projets */}
          <div className="relative ml-2">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5 border border-transparent dark:border-slate-700"
            >
              <FolderKanban size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Plannings ({projects.length})</span>
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Vos plannings
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      p.id === activeProjectId ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{p.tasks.length} tâches</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-2 space-y-1">
                  <button
                    onClick={() => {
                      if (!isAuthorized) {
                        setIsProjectDropdownOpen(false);
                        openAuthModal();
                        return;
                      }
                      handleCreateProjectPrompt();
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Nouveau planning
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (!isAuthorized) {
                          setIsProjectDropdownOpen(false);
                          openAuthModal();
                          return;
                        }
                        if (confirm(`Supprimer le planning "${currentProject.name}" ?`)) {
                          deleteProject(currentProject.id);
                          setIsProjectDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-1.5 transition"
                    >
                      <Trash2 size={14} /> Supprimer ce planning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'Action Sobres : Mode Clair/Sombre, Partager, Exporter / Imprimer, Connexion, Nouvelle Tâche */}
        <div className="flex items-center gap-2">
          {/* Input fichier caché pour l'import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {/* Bouton Thème Sombre / Clair */}
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
            title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            aria-label="Basculer le thème clair / sombre"
          >
            {theme === 'dark' ? (
              <Sun size={14} className="text-amber-400" />
            ) : (
              <Moon size={14} className="text-indigo-600" />
            )}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>

          {/* Bouton Partage Équipe (Sobre) */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs"
            title="Partager le planning avec vos collaborateurs"
          >
            <Share2 size={13} className="text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Partager</span>
          </button>

          {/* Menu Unique d'Export & Impression (Gantt & Rétroplanning) */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
              title="Centre d'impression et d'export (Gantt, Rétroplanning, PDF, PNG)"
            >
              <Printer size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Exporter / Imprimer</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2.5 z-50 animate-fadeIn max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="px-4 py-1 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Centre d'Export & Impression</span>
                  {exportStatus && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" />
                      En cours...
                    </span>
                  )}
                </div>

                {exportStatus && (
                  <div className="mx-3 my-2 p-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 font-semibold flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{exportStatus}</span>
                  </div>
                )}

                {/* SECTION 1 : DIAGRAMME DE GANTT */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-4 py-1 flex items-center gap-1.5 text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide bg-indigo-50/60 dark:bg-indigo-950/40 mx-2 rounded-lg">
                    <GanttChartSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>1. Diagramme de Gantt</span>
                  </div>

                  <button
                    onClick={handlePrintGantt}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Printer size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Imprimer le Diagramme de Gantt</p>
                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded font-extrabold uppercase">
                          Vectoriel
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Boîte d'impression macOS ("Enregistrer au format PDF" paysage)
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportPdf('a3')}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Télécharger PDF Gantt (A3 HD)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Grand format paysage optimal
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportPdf('a4')}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Télécharger PDF Gantt (A4)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Format standard pour impression
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportPng}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileImage size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Image Panoramique Gantt (PNG)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Capture intégrale HD
                      </p>
                    </div>
                  </button>
                </div>

                {/* SECTION 2 : RÉTROPLANNING ÉVÉNEMENTS (EXCEL) */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-4 py-1 flex items-center gap-1.5 text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wide bg-blue-50/70 dark:bg-blue-950/40 mx-2 rounded-lg">
                    <FileSpreadsheet size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>2. Rétroplanning Événements (Excel)</span>
                  </div>

                  <button
                    onClick={handlePrintRetroplanning}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Printer size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Imprimer le Rétroplanning</p>
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-extrabold uppercase">
                          Excel
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Imprime la feuille active en plein format paysage
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportRetroPdf('a3')}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Télécharger PDF Rétroplanning (A3 HD)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Génère le PDF de la feuille active
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportRetroPdf('a4')}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Télécharger PDF Rétroplanning (A4)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Format A4 paysage prêt à imprimer
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportRetroPng}
                    disabled={!!exportStatus}
                    className="w-full text-left px-4 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2.5 transition group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileImage size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Image HD Rétroplanning (PNG)</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Capture image nette de la feuille
                      </p>
                    </div>
                  </button>
                </div>

                {/* SECTION 3 : SAUVEGARDE & RESTAURATION */}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-2.5 pt-2 px-1 space-y-0.5">
                  <button
                    onClick={() => {
                      if (!isAuthorized) {
                        setIsExportMenuOpen(false);
                        openAuthModal();
                        return;
                      }
                      setIsExportMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 transition"
                  >
                    <Upload size={14} className="text-slate-400" />
                    <span>Importer un planning (JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportProjectJson();
                    }}
                    className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 transition"
                  >
                    <FileCode size={14} className="text-slate-400" />
                    <span>Sauvegarde complète du projet (JSON)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Badge Utilisateur Connecté / Connexion */}
          {isAuthorized && currentUser ? (
            <button
              onClick={openAuthModal}
              className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center gap-2 shadow-2xs group"
              title="Connecté en mode édition. Cliquez pour modifier le profil ou verrouiller"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs shrink-0"
                style={{ backgroundColor: currentUser.color || '#10B981' }}
              >
                {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="font-bold text-emerald-950 dark:text-emerald-200 truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </button>
          ) : isAuthorized ? (
            <button
              onClick={openAuthModal}
              className="px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
              title="Mode édition actif. Cliquez pour assigner votre nom"
            >
              <Unlock size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Mode Éditeur</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
              title="Cliquez pour vous identifier et activer le mode édition"
            >
              <Lock size={13} className="text-amber-600 dark:text-amber-400" />
              <span className="font-bold">Connexion</span>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 hidden sm:inline">(Lecture)</span>
            </button>
          )}

          {/* Bouton Primaire : Nouvelle Tâche */}
          <button
            onClick={() => {
              if (!isAuthorized) {
                openAuthModal();
              } else {
                openNewTaskModal();
              }
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Ajouter une tâche</span>
          </button>
        </div>
      </div>

      {/* Ligne 2 : Navigation sobre des Espaces & Vues */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/90 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bouton Accueil / Hub Équipe */}
          <button
            onClick={() => setViewMode('home')}
            className={`px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 ${
              viewMode === 'home'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs font-bold'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium'
            }`}
            title="Page d'accueil et hub de travail de l'équipe"
          >
            <Home size={14} className={viewMode === 'home' ? 'text-amber-400' : 'text-slate-500 dark:text-slate-400'} />
            <span>Accueil</span>
          </button>

          {/* Sélecteur Planning Actuel (Gantt & Rétroplanning) */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-xl gap-0.5 border border-transparent dark:border-slate-750">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                viewMode === 'gantt'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
              title="Diagramme de Gantt avec timeline"
            >
              <GanttChartSquare size={14} />
              <span>Gantt</span>
            </button>

            <button
              onClick={() => setViewMode('retroplanning')}
              className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                viewMode === 'retroplanning'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
              title="Rétroplanning par feuilles d'événements"
            >
              <FileSpreadsheet size={14} />
              <span>Rétroplanning</span>
              <span className="px-1 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 rounded text-[9px] font-black uppercase">
                Excel
              </span>
            </button>
          </div>

          {/* Nouveaux Espaces Collaboratifs : Idées & Messagerie */}
          <div className="flex items-center bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-xl gap-0.5 border border-transparent dark:border-slate-750">
            <button
              onClick={() => setViewMode('ideas')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                viewMode === 'ideas'
                  ? 'bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
              title="Boîte à Idées & Notes collaboratives"
            >
              <Lightbulb size={13} className={viewMode === 'ideas' ? 'text-amber-500' : 'text-amber-600 dark:text-amber-400'} />
              <span>Idées</span>
            </button>

            <button
              onClick={() => setViewMode('messages')}
              className={`px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                viewMode === 'messages'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
              title="Messagerie et salons de discussion par sujets"
            >
              <MessageSquare size={13} className={viewMode === 'messages' ? 'text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'} />
              <span>Messagerie</span>
            </button>
          </div>

          {/* Vues complémentaires compactes */}
          <div className="flex items-center bg-slate-200/40 dark:bg-slate-800 p-0.5 rounded-lg border border-transparent dark:border-slate-750">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2 py-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
              title="Vue Calendrier Mensuel"
            >
              <CalendarIcon size={14} />
              <span className="hidden sm:inline">Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1.5 rounded-md text-xs transition flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
              title="Vue Liste des Tâches"
            >
              <ListOrdered size={14} />
              <span className="hidden sm:inline">Liste</span>
            </button>
          </div>
        </div>

        {/* Recherche & Filtre Couleur Sobres */}
        <div className="flex items-center gap-2">
          {/* Nuancier compact */}
          <div className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => setSelectedColor(null)}
              className={`w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[9px] font-bold transition ${
                selectedColor === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
              title="Toutes les couleurs"
            >
              *
            </button>
            {COLOR_PRESETS.slice(0, 5).map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedColor(selectedColor === preset.hex ? null : preset.hex)}
                style={{ backgroundColor: preset.hex }}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  selectedColor === preset.hex ? 'scale-125 ring-2 ring-indigo-500 shadow-2xs' : 'hover:scale-110 opacity-75'
                }`}
                title={`Filtrer couleur ${preset.label}`}
              />
            ))}
          </div>

          <div className="relative w-40 sm:w-48">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Modale d'équipe */}
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />

      {/* Modale de partage */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Partager avec vos collègues</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Synchronisation collaborative en direct</p>
                </div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Lien d'accès direct sur votre réseau (Wi-Fi ou Bureau) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Copy size={14} />
                  <span>{copyFeedback ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Toute personne sur le même réseau qui ouvre ce lien verra le planning en temps réel et pourra le modifier.
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de mot de passe / déverrouillage */}
      <AuthModal />

      {/* Indicateur de progression d'exportation PDF / PNG */}
      {exportStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 max-w-sm w-full mx-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Loader2 size={22} className="animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Génération du document...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exportStatus}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
