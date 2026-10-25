import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  X,
  History,
  Cloud,
  HardDrive,
  Database
} from 'lucide-react';
import { usePlanning } from '../context/PlanningContext';

interface ServerBackup {
  filename: string;
  size: number;
  createdAt: string;
  taskCount: number;
  eventCount: number;
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    currentProject,
    isWebSocketConnected,
    exportProjectJson,
    importProjectJson,
    importProjectFromExcel,
    vaultSnapshots,
    createVaultSnapshot,
    restoreVaultSnapshot
  } = usePlanning();

  const [serverBackups, setServerBackups] = useState<ServerBackup[]>([]);
  const [githubSync, setGithubSync] = useState<{ lastSync: string | null; status: string; error: string | null }>({
    lastSync: null,
    status: 'idle',
    error: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger la liste des sauvegardes du serveur
  const fetchServerBackups = async () => {
    try {
      setIsLoading(true);
      const isDev = window.location.port === '5173';
      const apiUrl = isDev
        ? `http://${window.location.hostname}:3001/api/backups`
        : '/api/backups';
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setServerBackups(data.backups || []);
          if (data.githubSync) {
            setGithubSync(data.githubSync);
          }
        }
      }
    } catch (err) {
      console.warn('Impossible de joindre le serveur pour les sauvegardes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchServerBackups();
      setActionMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Créer un point de restauration immédiat
  const handleCreateSnapshot = () => {
    createVaultSnapshot('Sauvegarde manuelle utilisateur');
    setActionMessage({
      type: 'success',
      text: 'Point de restauration créé avec succès dans le coffre-fort local et sur le serveur !'
    });
    fetchServerBackups();
  };

  // Forcer la synchronisation GitHub
  const handleForceGitHubSync = async () => {
    try {
      setIsLoading(true);
      const isDev = window.location.port === '5173';
      const apiUrl = isDev
        ? `http://${window.location.hostname}:3001/api/backup/sync-github`
        : '/api/backup/sync-github';
      const res = await fetch(apiUrl, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.githubSync) setGithubSync(data.githubSync);
        setActionMessage({
          type: 'success',
          text: 'Synchronisation Cloud GitHub effectuée avec succès ! Les données sont sécurisées sur le dépôt.'
        });
      } else {
        setActionMessage({
          type: 'error',
          text: `Erreur synchro GitHub : ${data.message || 'Échec de connexion'}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Erreur réseau : ${err.message || 'Serveur indisponible'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurer une sauvegarde serveur
  const handleRestoreServerBackup = async (filename: string) => {
    if (!window.confirm(`Confirmez-vous la restauration de la sauvegarde "${filename}" ? Les modifications actuelles seront archivées.`)) {
      return;
    }
    try {
      setIsLoading(true);
      const isDev = window.location.port === '5173';
      const apiUrl = isDev
        ? `http://${window.location.hostname}:3001/api/backups/restore`
        : '/api/backups/restore';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'success',
          text: 'Sauvegarde restaurée avec succès ! Tous les collaborateurs sont actualisés.'
        });
        fetchServerBackups();
      } else {
        setActionMessage({
          type: 'error',
          text: `Erreur restauration : ${data.message}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Erreur : ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurer un snapshot local
  const handleRestoreVault = (id: string, label: string) => {
    if (!window.confirm(`Confirmez-vous la restauration du point "${label}" ?`)) return;
    const ok = restoreVaultSnapshot(id);
    if (ok) {
      setActionMessage({
        type: 'success',
        text: `Point de restauration "${label}" appliqué avec succès !`
      });
    } else {
      setActionMessage({
        type: 'error',
        text: 'Échec de la restauration du point local.'
      });
    }
  };

  // Gestion de l'import de fichier (.json ou .xlsx)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setActionMessage(null);

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'xlsx' || ext === 'xls') {
        const ok = await importProjectFromExcel(file);
        if (ok) {
          setActionMessage({
            type: 'success',
            text: `Classeur Excel "${file.name}" importé avec succès ! Les événements et tâches ont été réintégrés.`
          });
        } else {
          setActionMessage({
            type: 'error',
            text: "Impossible d'importer le fichier Excel. Vérifiez qu'il s'agit d'un export de rétroplanning valide."
          });
        }
      } else if (ext === 'json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const ok = importProjectJson(content);
            if (ok) {
              setActionMessage({
                type: 'success',
                text: `Sauvegarde JSON "${file.name}" restaurée avec succès !`
              });
            } else {
              setActionMessage({
                type: 'error',
                text: 'Structure du fichier JSON invalide.'
              });
            }
          }
          setIsLoading(false);
        };
        reader.readAsText(file);
        return;
      } else {
        setActionMessage({
          type: 'error',
          text: 'Format de fichier non pris en charge. Veuillez fournir un fichier .json ou .xlsx.'
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Erreur lors de la lecture du fichier : ${err?.message || 'Erreur inconnue'}`
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalCurrentTasks = (currentProject?.tasks?.length || 0) +
    (currentProject?.events?.reduce((acc, e) => acc + (e.tasks?.length || 0), 0) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 dark:shadow-none">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sauvegardes & Sécurité des Données
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Triple protection : Mémoire locale, Snapshots horodatés & Sauvegarde Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps défilable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Messages d'action */}
          {actionMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : actionMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Statut Global des Protections */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Serveur WebSocket */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <Database size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Serveur Live</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {isWebSocketConnected ? 'Synchronisé' : 'Local / Hors-ligne'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{totalCurrentTasks} tâches actives</div>
            </div>

            {/* 2. GitHub Cloud Backup */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <Cloud size={15} className="text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Cloud GitHub</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    githubSync.status === 'success' || githubSync.lastSync
                      ? 'bg-emerald-500'
                      : githubSync.status === 'syncing'
                      ? 'bg-indigo-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {githubSync.lastSync ? 'Sécurisé sur GitHub' : 'Prêt'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                {githubSync.lastSync ? new Date(githubSync.lastSync).toLocaleTimeString('fr-FR') : 'Automatique'}
              </div>
            </div>

            {/* 3. Coffre-fort Navigateur */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <HardDrive size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Coffre Local</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {vaultSnapshots.length} point(s) d’étape
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Anti-écrasement actif</div>
            </div>
          </div>

          {/* Actions Immédiates */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
              Actions de Sauvegarde & Récupération
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Bouton Télécharger JSON */}
              <button
                onClick={exportProjectJson}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Download size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Télécharger la sauvegarde (.json)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Garde un fichier complet sur votre ordinateur
                  </div>
                </div>
              </button>

              {/* Bouton Créer Point de Restauration */}
              <button
                onClick={handleCreateSnapshot}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Créer un point de restauration
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Fige l’état actuel pour pouvoir y revenir
                  </div>
                </div>
              </button>

              {/* Bouton Importer Fichier (JSON ou XLSX) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 text-left transition flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <Upload size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Restaurer depuis un fichier (.json / .xlsx)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Restaure depuis un JSON ou classeur Excel
                  </div>
                </div>
              </button>

              {/* Bouton Forcer Synchro GitHub */}
              <button
                onClick={handleForceGitHubSync}
                disabled={isLoading}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/20 text-left transition flex items-start gap-3 group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 group-hover:scale-105 transition-transform">
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Synchroniser Cloud GitHub
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sécurise immédiatement sur le dépôt GitHub
                  </div>
                </div>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.xlsx,.xls"
              className="hidden"
            />
          </div>

          {/* Liste des Points de Restauration Disponibles */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} />
                <span>Historique des Points de Restauration</span>
              </h3>
              <button
                onClick={fetchServerBackups}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {/* Snapshots Navigateur */}
              {vaultSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <HardDrive size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-white truncate">
                        {snap.label}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{new Date(snap.timestamp).toLocaleString('fr-FR')}</span>
                        <span>•</span>
                        <span>{snap.taskCount} tâches</span>
                        <span>•</span>
                        <span>{snap.eventCount} événements</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreVault(snap.id, snap.label)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-lg transition shrink-0"
                  >
                    Restaurer
                  </button>
                </div>
              ))}

              {/* Backups Serveur */}
              {serverBackups.map((bk) => (
                <div
                  key={bk.filename}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Database size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-white truncate">
                        Sauvegarde serveur ({bk.filename.replace('planning_store_', '').replace('.json', '')})
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{new Date(bk.createdAt).toLocaleString('fr-FR')}</span>
                        <span>•</span>
                        <span>{bk.taskCount} tâches</span>
                        <span>•</span>
                        <span>{bk.eventCount} événements</span>
                        <span>•</span>
                        <span>{(bk.size / 1024).toFixed(1)} Ko</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestoreServerBackup(bk.filename)}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-lg transition shrink-0"
                  >
                    Restaurer
                  </button>
                </div>
              ))}

              {vaultSnapshots.length === 0 && serverBackups.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                  Aucun point de restauration antérieur enregistré pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Protection anti-écrasement activée en continu.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
