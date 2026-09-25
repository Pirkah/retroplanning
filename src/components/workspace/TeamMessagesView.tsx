import React, { useState, useRef, useEffect } from 'react';
import { usePlanning } from '../../context/PlanningContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Hash,
  Send,
  Smile,
  Users,
  Flame,
  Handshake,
  Megaphone,
  ShieldAlert,
  Search,
  MessageSquare,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';

const CHANNEL_ICONS: Record<string, any> = {
  Hash,
  Flame,
  Handshake,
  Megaphone,
  ShieldAlert
};

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🎯', '🎉', '💪', '👏'];

export const TeamMessagesView: React.FC = () => {
  const { currentUser, isAuthorized, openAuthModal, members, onlineCount } = usePlanning();
  const { channels, activeChannelId, setActiveChannelId, messages, addMessage, addReaction } = useWorkspace();

  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);

  const filteredMessages = channelMessages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.content.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q);
  });

  // Défilement automatique en bas de page lors d'un nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    addMessage(inputMessage.trim());
    setInputMessage('');
  };

  const ActiveIcon = CHANNEL_ICONS[activeChannel.iconName] || Hash;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[580px] max-w-7xl mx-auto w-full animate-fadeIn">
      {/* 1. PANNEAU GAUCHE : SALONS & COLLABORATEURS */}
      <div className="w-full md:w-72 bg-slate-50/90 border-r border-slate-200/80 flex flex-col shrink-0">
        {/* En-tête des salons */}
        <div className="p-4 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Messagerie Équipe
              </h2>
              <p className="text-[10px] text-slate-500">Run & Fun 2026</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En direct" />
        </div>

        {/* Liste des canaux */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Salons Thématiques
            </div>

            {channels.map((channel) => {
              const IconComp = CHANNEL_ICONS[channel.iconName] || Hash;
              const isActive = channel.id === activeChannelId;
              const msgCount = messages.filter((m) => m.channelId === channel.id).length;

              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between group ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComp size={15} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="truncate">#{channel.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {msgCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section Membres en direct */}
          <div className="pt-2 border-t border-slate-200/60 space-y-2">
            <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Membres ({members.length})</span>
              <span className="text-[10px] font-semibold text-emerald-600">{onlineCount} actif{onlineCount > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100/80 transition"
                >
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{member.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZONE CENTRALE : FILS DE DISCUSSION DU SALON */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* En-tête du canal actif */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ActiveIcon size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  #{activeChannel.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 truncate">{activeChannel.description}</p>
            </div>
          </div>

          {/* Recherche dans le canal */}
          <div className="relative w-36 sm:w-48 shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Fil des messages scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <MessageSquare size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700">Aucun message pour le moment</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Soyez le premier à lancer la discussion dans ce salon pour échanger avec vos coéquipiers !
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-2xs"
                  style={{ backgroundColor: msg.authorColor || '#6366F1' }}
                >
                  {msg.authorInitials || 'RF'}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{msg.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/90 border border-slate-200/60 rounded-2xl rounded-tl-sm text-xs text-slate-800 leading-relaxed inline-block max-w-2xl break-words">
                    {msg.content}
                  </div>

                  {/* Réactions Emojis */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {msg.reactions &&
                      msg.reactions.map((reaction, rIdx) => {
                        const hasReacted = reaction.users.includes(currentUser?.name || 'Moi');
                        return (
                          <button
                            key={rIdx}
                            onClick={() => addReaction(msg.id, reaction.emoji)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-medium transition flex items-center gap-1 border ${
                              hasReacted
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            title={`Réagi par : ${reaction.users.join(', ')}`}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-[10px]">{reaction.count}</span>
                          </button>
                        );
                      })}

                    {/* Barre de réaction rapide au hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-1">
                      {COMMON_EMOJIS.slice(0, 4).map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="p-1 hover:bg-slate-100 rounded text-xs transition"
                          title={`Réagir avec ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre de saisie en bas */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <form onSubmit={handleSend} className="space-y-2">
            <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Écrire dans #${activeChannel.name} en tant que ${currentUser?.name || 'Membre'}...`}
                className="flex-1 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />

              <div className="flex items-center gap-1 pr-2">
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Send size={13} />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Appuyez sur <kbd className="bg-slate-200/80 px-1 rounded font-mono text-[10px]">Entrée</kbd> pour envoyer</span>
              {!isAuthorized && (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Lock size={10} />
                  <span>Se connecter pour signer vos messages</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
