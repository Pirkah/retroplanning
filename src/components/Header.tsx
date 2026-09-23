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
  Users,
  Wifi,
  Share2,
  Copy
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { TeamModal } from './TeamModal';

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
    selectedMemberId,
    setSelectedMemberId,
    openNewTaskModal,
    exportProjectJson,
    importProjectJson,
    onlineCount,
    isWebSocketConnected,
    serverInfo,
    members
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

  const handleExportImage = async () => {
    setIsExportMenuOpen(false);
    const element = document.getElementById('planning-main-view');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#f8fafc',
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_gantt.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Impossible de générer l'image.");
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
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      {/* Ligne 1 : Titre, Projets, Présence Temps Réel & Actions d'Équipe */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <CalendarIcon size={22} />
          </div>

          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="px-2 py-1 text-base font-bold text-slate-800 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                />
                <button onClick={handleSaveTitle} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                  <Check size={18} />
                </button>
                <button onClick={() => setIsEditingTitle(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {currentProject.name}
                </h1>
                <button
                  onClick={() => {
                    setEditedTitle(currentProject.name);
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                  title="Renommer le rétroplanning"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{currentProject.tasks.length} tâche(s)</span>
              <span>•</span>
              {/* Badge temps réel */}
              <div className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWebSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isWebSocketConnected ? 'text-emerald-700' : 'text-slate-500'}>
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
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition flex items-center gap-1.5"
            >
              <FolderKanban size={14} className="text-indigo-600" />
              <span>Plannings ({projects.length})</span>
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Vos plannings
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`px-3 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 ${
                      p.id === activeProjectId ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{p.tasks.length} tâches</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1 px-2 space-y-1">
                  <button
                    onClick={handleCreateProjectPrompt}
                    className="w-full text-left px-2 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Nouveau planning
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le planning "${currentProject.name}" ?`)) {
                          deleteProject(currentProject.id);
                          setIsProjectDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium flex items-center gap-1.5 transition"
                    >
                      <Trash2 size={14} /> Supprimer ce planning
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'Action : Partage Équipe, Import, Export, Nouvelle Tâche */}
        <div className="flex items-center gap-2">
          {/* Bouton Partage Équipe */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
          >
            <Share2 size={14} className="text-emerald-600" />
            <span>Partager à l'équipe</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            title="Importer un fichier JSON"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Importer</span>
          </button>

          {/* Menu Export */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportProjectJson();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileCode size={14} className="text-indigo-600" />
                  Sauvegarde (JSON)
                </button>
                <button
                  onClick={handleExportImage}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileImage size={14} className="text-emerald-600" />
                  Image capture Gantt (PNG)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => openNewTaskModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Ajouter une tâche</span>
          </button>
        </div>
      </div>

      {/* Ligne 2 : Sélecteur de Vue & Barre de Collaborateurs */}
      <div className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
        {/* Sélecteur de Vue */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl gap-1">
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'gantt'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GanttChartSquare size={15} />
            <span>Diagramme de Gantt (Semaines)</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarIcon size={15} />
            <span>Calendrier</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered size={15} />
            <span>Échéancier & Liste</span>
          </button>
        </div>

        {/* Filtre Collaborateurs (Équipe) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Users size={13} className="text-indigo-600" />
            Équipe :
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedMemberId(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedMemberId === null
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tous
            </button>

            {members.map((member) => {
              const isSelected = selectedMemberId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(isSelected ? null : member.id)}
                  style={{
                    backgroundColor: isSelected ? member.color : '#ffffff',
                    borderColor: member.color,
                    color: isSelected ? '#ffffff' : '#334155'
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                    isSelected ? 'ring-2 ring-offset-1 ring-indigo-400' : 'hover:bg-slate-50'
                  }`}
                  title={`${member.name} (${member.role})`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : member.color }}
                  />
                  <span>{member.name}</span>
                </button>
              );
            })}

            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-2 py-1 bg-white border border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-semibold transition"
              title="Gérer les membres de l'équipe"
            >
              + Gérer
            </button>
          </div>
        </div>

        {/* Recherche & Filtre Couleur */}
        <div className="flex items-center gap-3">
          {/* Nuancier */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedColor(null)}
              className={`w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold transition ${
                selectedColor === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600'
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
                className={`w-4 h-4 rounded-full transition-transform ${
                  selectedColor === preset.hex ? 'scale-125 ring-2 ring-indigo-500 shadow-sm' : 'hover:scale-110 opacity-80'
                }`}
                title={`Filtrer couleur ${preset.label}`}
              />
            ))}
          </div>

          <div className="relative w-44">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Modale d'équipe */}
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />

      {/* Modale de partage */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Partager avec vos collègues</h3>
                  <p className="text-xs text-slate-500">Synchronisation collaborative en direct</p>
                </div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Lien d'accès direct sur votre réseau (Wi-Fi ou Bureau) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Copy size={14} />
                  <span>{copyFeedback ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Toute personne sur le même réseau qui ouvre ce lien verra le planning en temps réel et pourra le modifier.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
