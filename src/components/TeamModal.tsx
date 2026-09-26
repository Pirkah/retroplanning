import React, { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { X, UserPlus, Users, Trash2, Lock, Unlock } from 'lucide-react';
import { COLOR_PRESETS } from '../types/planning';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const { members, addTeamMember, deleteTeamMember, isAuthorized, openAuthModal } = usePlanning();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [generation, setGeneration] = useState('10ème équipe');
  const [color, setColor] = useState('#6366F1');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      onClose();
      openAuthModal();
      return;
    }
    if (!name.trim()) return;

    const parts = name.trim().split(' ');
    const initials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.trim().substring(0, 2).toUpperCase();

    const isSupervisor = generation.toLowerCase().includes('pédagogique');

    addTeamMember({
      name: name.trim(),
      role: role.trim() || 'Collaborateur',
      color,
      initials,
      generation: generation.trim() || '10ème équipe',
      isSupervisor
    });

    setName('');
    setRole('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-base">
            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>Membres de l'équipe ({members.length})</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Liste des membres */}
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between group hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{m.name}</p>
                      {m.generation && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                          m.isSupervisor || m.generation.includes('pédagogique')
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : m.generation.includes('10')
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {m.generation}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{m.role}</p>
                  </div>
                </div>

                {isAuthorized && members.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer ${m.name} de l'équipe ? Les tâches qui lui étaient assignées ne seront plus attribuées.`)) {
                        deleteTeamMember(m.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title={`Supprimer ${m.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Formulaire d'ajout ou invite de déverrouillage */}
          {isAuthorized ? (
            <form onSubmit={handleAdd} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Ajouter un collaborateur
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Prénom ou Nom"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Rôle (ex: Développeur)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Sélection Génération / Promotion */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Génération / Promotion :
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['10ème équipe', '11ème équipe', 'Équipe pédagogique'].map((gen) => (
                    <button
                      key={gen}
                      type="button"
                      onClick={() => setGeneration(gen)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition text-center truncate ${
                        generation === gen
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {gen}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Couleur :</span>
                  <div className="flex items-center gap-1">
                    {COLOR_PRESETS.slice(0, 5).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setColor(p.hex)}
                        style={{ backgroundColor: p.hex }}
                        className={`w-4 h-4 rounded-full ${color === p.hex ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1 transition"
                >
                  <UserPlus size={14} />
                  Ajouter
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Mode consultation</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Unlock size={13} />
                  Déverrouiller
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
