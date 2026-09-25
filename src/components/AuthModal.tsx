import React, { useState, useEffect } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { TeamMember, ConnectedUser } from '../types/planning';
import {
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
  User,
  Users,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthorized,
    isAuthModalOpen,
    closeAuthModal,
    unlockEditMode,
    lockEditMode,
    changePassword,
    members,
    currentUser,
    setCurrentUser
  } = usePlanning();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sélection du membre
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isSwitchingUser, setIsSwitchingUser] = useState<boolean>(false);

  // Initialisation de la sélection au montage / à l'ouverture
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setPassword('');
      setIsSwitchingUser(false);

      if (currentUser?.id) {
        setSelectedMemberId(currentUser.id);
      } else if (currentUser?.name) {
        setSelectedMemberId('custom');
        setCustomName(currentUser.name);
      } else if (members && members.length > 0) {
        setSelectedMemberId(members[0].id);
      }
    }
  }, [isAuthModalOpen, currentUser, members]);

  // Mode changement de mot de passe
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  // Calcul du profil utilisateur sélectionné
  const getSelectedUserProfile = (): ConnectedUser => {
    if (selectedMemberId === 'custom') {
      const trimmed = customName.trim() || 'Collaborateur';
      const words = trimmed.split(' ');
      const initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmed.slice(0, 2).toUpperCase();

      return {
        name: trimmed,
        role: 'Contributeur',
        color: '#6366F1',
        initials
      };
    }

    const member = members.find((m) => m.id === selectedMemberId) || members[0];
    if (member) {
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        color: member.color,
        initials: member.initials
      };
    }

    return {
      name: 'Collaborateur',
      role: 'Éditeur',
      color: '#3B82F6',
      initials: 'RNF'
    };
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Veuillez entrer le mot de passe.');
      return;
    }

    if (selectedMemberId === 'custom' && !customName.trim()) {
      setErrorMessage('Veuillez préciser votre prénom / nom.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const userProfile = getSelectedUserProfile();
    const ok = await unlockEditMode(password.trim(), userProfile);
    setIsLoading(false);

    if (ok) {
      setPassword('');
      closeAuthModal();
    } else {
      setErrorMessage('Mot de passe incorrect. Veuillez réessayer.');
    }
  };

  const handleSwitchUserOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberId === 'custom' && !customName.trim()) {
      setErrorMessage('Veuillez préciser votre prénom / nom.');
      return;
    }

    const userProfile = getSelectedUserProfile();
    const completeUser: ConnectedUser = {
      ...userProfile,
      loggedInAt: new Date().toISOString()
    };
    setCurrentUser(completeUser);
    try {
      localStorage.setItem('rnf_connected_user_v1', JSON.stringify(completeUser));
    } catch {}

    setIsSwitchingUser(false);
    closeAuthModal();
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

  const activeSelectedUser = getSelectedUserProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isAuthorized ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              {isAuthorized ? <ShieldCheck size={20} /> : <Lock size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {isAuthorized
                  ? isSwitchingUser
                    ? 'Changer d’utilisateur'
                    : 'Session d’édition active'
                  : 'Connexion & Mode Édition'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAuthorized
                  ? 'Connecté au rétroplanning collaboratif'
                  : 'Identifiez-vous pour modifier le planning'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {changeSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>Mot de passe d'équipe mis à jour avec succès !</span>
            </div>
          )}

          {/* CAS 1 : Non connecté -> Formulaire de connexion (Qui est-ce + mot de passe) */}
          {!isAuthorized ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              {/* Étape 1 : Qui se connecte ? */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>1. Qui se connecte ?</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((member) => {
                    const isSelected = selectedMemberId === member.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-100'}`}>
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{member.role}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Option Autre / Nom personnalisé */}
                  <div
                    onClick={() => setSelectedMemberId('custom')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 sm:col-span-2 ${
                      selectedMemberId === 'custom'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                      <Users size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Autre membre ou invité</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Saisir un prénom ou nom personnalisé</p>
                    </div>
                    {selectedMemberId === 'custom' && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check size={11} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Champ texte libre si 'custom' */}
                {selectedMemberId === 'custom' && (
                  <div className="pt-1 animate-fadeIn">
                    <input
                      type="text"
                      required
                      placeholder="Votre prénom et nom..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Étape 2 : Mot de passe d'équipe */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>2. Mot de passe d'équipe</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Entrez le mot de passe (rnf2026)..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Mot de passe par défaut : <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">rnf2026</code>
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Mode lecture seule
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition flex items-center gap-2"
                >
                  <Unlock size={14} />
                  <span>
                    {isLoading
                      ? 'Connexion...'
                      : `Se connecter en tant que ${activeSelectedUser.name.split(' ')[0] || '...'}`}
                  </span>
                </button>
              </div>
            </form>
          ) : isSwitchingUser ? (
            /* CAS 2 : Déjà connecté, veut juste changer qui est connecté */
            <form onSubmit={handleSwitchUserOnly} className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Sélectionnez votre profil d'équipe pour signer vos modifications :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((member) => {
                    const isSelected = selectedMemberId === member.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-100'}`}>
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{member.role}</p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                            <Check size={11} />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div
                    onClick={() => setSelectedMemberId('custom')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 sm:col-span-2 ${
                      selectedMemberId === 'custom'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-400 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                      <Users size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Autre membre ou invité</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Saisir un prénom ou nom personnalisé</p>
                    </div>
                    {selectedMemberId === 'custom' && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check size={11} />
                      </div>
                    )}
                  </div>
                </div>

                {selectedMemberId === 'custom' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      required
                      placeholder="Votre prénom et nom..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSwitchingUser(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <UserCheck size={14} />
                  <span>Confirmer le profil</span>
                </button>
              </div>
            </form>
          ) : isChangingPass ? (
            /* CAS 3 : Changement de mot de passe */
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Définissez un nouveau mot de passe pour restreindre l'édition aux personnes autorisées.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
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
            /* CAS 4 : Connecté & Affichage du profil connecté */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
                  style={{ backgroundColor: currentUser?.color || '#10B981' }}
                >
                  {currentUser?.initials || currentUser?.name?.slice(0, 2).toUpperCase() || 'RNF'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 truncate">
                      {currentUser?.name || 'Membre de l’équipe'}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
                      Connecté
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300 truncate">
                    {currentUser?.role || 'Mode Édition Autorisé'}
                  </p>
                  <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/80 mt-0.5">
                    Toutes les modifications seront enregistrées sous ce profil.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setIsSwitchingUser(true)}
                  className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <UserCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Changer d'utilisateur connecté</span>
                </button>

                <button
                  onClick={() => setIsChangingPass(true)}
                  className="w-full py-2.5 px-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Key size={14} className="text-slate-500 dark:text-slate-400" />
                  <span>Modifier le mot de passe d'équipe</span>
                </button>

                <button
                  onClick={() => {
                    lockEditMode();
                    closeAuthModal();
                  }}
                  className="w-full py-2.5 px-3 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut size={14} />
                  <span>Se déconnecter (Mode lecture seule)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
