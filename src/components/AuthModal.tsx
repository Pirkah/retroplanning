import React, { useState } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { Lock, Unlock, Key, Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthorized, isAuthModalOpen, closeAuthModal, unlockEditMode, lockEditMode, changePassword } = usePlanning();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mode changement de mot de passe
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    const ok = await unlockEditMode(password.trim());
    setIsLoading(false);

    if (ok) {
      setPassword('');
      closeAuthModal();
    } else {
      setErrorMessage('Mot de passe incorrect. Veuillez réessayer.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const res = await changePassword(oldPassword.trim(), newPassword.trim());
    setIsLoading(false);

    if (res.success) {
      setChangeSuccess(true);
      setTimeout(() => {
        setChangeSuccess(false);
        setIsChangingPass(false);
        setOldPassword('');
        setNewPassword('');
        closeAuthModal();
      }, 1500);
    } else {
      setErrorMessage(res.message || 'Erreur lors du changement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              {isAuthorized ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isAuthorized ? 'Mode Édition Déverrouillé' : 'Protection par Mot de Passe'}
            </h2>
          </div>
          <button onClick={closeAuthModal} className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {changeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <Check size={16} className="flex-shrink-0" />
              <span>Mot de passe d'équipe mis à jour avec succès !</span>
            </div>
          )}

          {!isAuthorized ? (
            /* Formulaire de déverrouillage */
            <form onSubmit={handleUnlock} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Le rétroplanning est protégé en écriture. Seules les personnes qui connaissent le mot de passe de l'équipe peuvent ajouter, modifier ou déplacer des tâches.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Mot de passe d'équipe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Entrez le mot de passe..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Mot de passe initial par défaut : <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-600">rnf2026</code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Consulter en lecture seule
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition flex items-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>{isLoading ? 'Vérification...' : 'Déverrouiller pour modifier'}</span>
                </button>
              </div>
            </form>
          ) : isChangingPass ? (
            /* Formulaire pour changer le mot de passe */
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-xs text-slate-600">
                Définissez un nouveau mot de passe pour restreindre l'édition aux personnes autorisées.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Enregistrer le mot de passe
                </button>
              </div>
            </form>
          ) : (
            /* Déjà autorisé : options de verrouillage ou changement de pass */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Check size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Vous êtes actuellement <strong>autorisé à modifier</strong> le rétroplanning sur cet appareil.</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setIsChangingPass(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Key size={14} />
                  <span>Changer le mot de passe d'équipe</span>
                </button>

                <button
                  onClick={() => {
                    lockEditMode();
                    closeAuthModal();
                  }}
                  className="w-full py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Lock size={14} />
                  <span>Reverrouiller (Mode lecture seule)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
