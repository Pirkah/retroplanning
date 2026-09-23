import React, { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { X, UserPlus, Users, Trash2 } from 'lucide-react';
import { COLOR_PRESETS } from '../types/planning';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const { members, addTeamMember } = usePlanning();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [color, setColor] = useState('#6366F1');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parts = name.trim().split(' ');
    const initials = parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.trim().substring(0, 2).toUpperCase();

    addTeamMember({
      name: name.trim(),
      role: role.trim() || 'Collaborateur',
      color,
      initials
    });

    setName('');
    setRole('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Users size={18} className="text-indigo-600" />
            <span>Membres de l'équipe ({members.length})</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Liste des membres */}
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire d'ajout */}
          <form onSubmit={handleAdd} className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ajouter un collaborateur
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prénom ou Nom"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Rôle (ex: Développeur)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Couleur :</span>
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
        </div>
      </div>
    </div>
  );
};
