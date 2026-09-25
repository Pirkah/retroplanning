import React, { useState, useRef, useEffect } from 'react';
import { usePlanning } from '../../context/PlanningContext';
import { useWorkspace, getClientSessionId } from '../../context/WorkspaceContext';
import { ChatMessage } from '../../types/workspace';
import {
  Hash,
  Send,
  Users,
  Flame,
  Handshake,
  Megaphone,
  ShieldAlert,
  Search,
  MessageSquare,
  Lock,
  Reply,
  X
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
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Réinitialiser la réponse si on change de canal
  useEffect(() => {
    setReplyingTo(null);
  }, [activeChannelId]);

  const clientSessionId = getClientSessionId();

  const getIsMe = (msg: ChatMessage) => {
    if (currentUser?.id && msg.authorId && msg.authorId === currentUser.id) return true;
    if (currentUser?.name && msg.authorName) {
      return msg.authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
    }
    if (msg.clientSessionId && msg.clientSessionId === clientSessionId) return true;
    return false;
  };

  const handleStartReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const scrollToMessage = (targetMsgId: string) => {
    const el = document.getElementById(`chat-msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => {
        setHighlightedMsgId((curr) => (curr === targetMsgId ? null : curr));
      }, 2000);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    addMessage(
      inputMessage.trim(),
      activeChannelId,
      replyingTo
        ? {
            id: replyingTo.id,
            authorName: replyingTo.authorName,
            content: replyingTo.content
          }
        : undefined
    );
    setInputMessage('');
    setReplyingTo(null);
  };

  const ActiveIcon = CHANNEL_ICONS[activeChannel.iconName] || Hash;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[580px] max-w-7xl mx-auto w-full animate-fadeIn">
      {/* 1. PANNEAU GAUCHE : SALONS & COLLABORATEURS */}
      <div className="w-full md:w-72 bg-slate-50/90 dark:bg-slate-900/90 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0">
        {/* En-tête des salons */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Messagerie Équipe
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Run & Fun 2026</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En direct" />
        </div>

        {/* Liste des canaux */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComp size={15} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                    <span className="truncate">#{channel.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {msgCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Section Membres en direct */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>Membres ({members.length})</span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{onlineCount} actif{onlineCount > 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="px-2 py-1.5 rounded-lg flex items-center gap-2 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition"
                >
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{member.name}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ZONE CENTRALE : FILS DE DISCUSSION DU SALON */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* En-tête du canal actif */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ActiveIcon size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  #{activeChannel.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 truncate">{activeChannel.description}</p>
            </div>
          </div>

          {/* Recherche dans le canal */}
          <div className="relative w-36 sm:w-48 shrink-0">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Fil des messages scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <MessageSquare size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucun message pour le moment</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                Soyez le premier à lancer la discussion dans ce salon pour échanger avec vos coéquipiers !
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = getIsMe(msg);
              const isHighlighted = highlightedMsgId === msg.id;

              return (
                <div
                  id={`chat-msg-${msg.id}`}
                  key={msg.id}
                  className={`group relative flex items-end gap-2.5 transition-all duration-300 ${
                    isMe ? 'justify-end' : 'justify-start'
                  } ${
                    isHighlighted
                      ? 'p-2 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-sm'
                      : ''
                  }`}
                >
                  {/* Avatar pour les messages des autres (à gauche) */}
                  {!isMe && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0 mb-1 shadow-2xs select-none"
                      style={{ backgroundColor: msg.authorColor || '#6366F1' }}
                      title={msg.authorName}
                    >
                      {msg.authorInitials || 'RF'}
                    </div>
                  )}

                  {/* Conteneur de la bulle et métadonnées */}
                  <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* En-tête : Nom & Date */}
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {!isMe ? (
                        <>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {msg.authorName}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Moi
                          </span>
                        </>
                      )}
                    </div>

                    {/* Wrapper bulle + barre d'action au survol */}
                    <div className={`relative flex items-center gap-1 group/bubble ${isMe ? 'flex-row-reverse' : ''}`}>
                      {/* Bulle de message principale */}
                      <div
                        onDoubleClick={() => handleStartReply(msg)}
                        className={`p-3 text-xs leading-relaxed break-words max-w-full shadow-xs transition ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-bl-xs'
                        }`}
                      >
                        {/* Aperçu du message cité (Style Instagram) */}
                        {msg.replyTo && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              scrollToMessage(msg.replyTo!.id);
                            }}
                            className={`mb-2 p-2 rounded-xl text-left transition cursor-pointer flex flex-col gap-0.5 border-l-3 ${
                              isMe
                                ? 'bg-black/20 hover:bg-black/30 border-white text-white'
                                : 'bg-slate-200/70 dark:bg-slate-700/60 hover:bg-slate-300/60 dark:hover:bg-slate-700 border-indigo-500 text-slate-700 dark:text-slate-300'
                            }`}
                            title="Cliquer pour voir le message d'origine"
                          >
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              <Reply size={10} className="shrink-0" />
                              <span className="truncate">{msg.replyTo.authorName}</span>
                            </div>
                            <p className={`text-[11px] line-clamp-2 italic ${isMe ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                              {msg.replyTo.content}
                            </p>
                          </div>
                        )}

                        {/* Texte du message */}
                        <div className="select-text whitespace-pre-wrap">{msg.content}</div>
                      </div>

                      {/* Barre d'actions au survol (Répondre + Emojis rapides) */}
                      <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/95 dark:bg-slate-850/95 backdrop-blur-xs p-0.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                        {isMe &&
                          COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addReaction(msg.id, emoji)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs transition"
                              title={`Réagir ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={() => handleStartReply(msg)}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 dark:text-slate-400 rounded-full transition flex items-center gap-1"
                          title="Répondre au message (comme Instagram)"
                        >
                          <Reply size={13} />
                        </button>
                        {!isMe &&
                          COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addReaction(msg.id, emoji)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-xs transition"
                              title={`Réagir ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Réactions Emojis */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex items-center gap-1.5 flex-wrap mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map((reaction, rIdx) => {
                          const hasReacted = reaction.users.includes(currentUser?.name || 'Moi');
                          return (
                            <button
                              key={rIdx}
                              onClick={() => addReaction(msg.id, reaction.emoji)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium transition flex items-center gap-1 border ${
                                hasReacted
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                              title={`Réagi par : ${reaction.users.join(', ')}`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-[10px]">{reaction.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Avatar pour mes propres messages (à droite) */}
                  {isMe && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0 mb-1 shadow-2xs select-none"
                      style={{ backgroundColor: currentUser?.color || msg.authorColor || '#6366F1' }}
                      title="Moi"
                    >
                      {currentUser?.initials || msg.authorInitials || 'MOI'}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre de saisie en bas */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80">
          <form onSubmit={handleSend} className="space-y-2">
            {/* Bannière de réponse Instagram */}
            {replyingTo && (
              <div className="flex items-center justify-between px-4 py-2 bg-indigo-50/90 dark:bg-indigo-950/50 border-t border-l border-r border-indigo-200 dark:border-indigo-800/60 rounded-t-2xl animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Reply size={13} />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-300">
                        Réponse à
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {replyingTo.authorName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-sm sm:max-w-xl">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition shrink-0 ml-2"
                  title="Annuler la réponse (Échap)"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <div
              className={`relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition ${
                replyingTo ? 'rounded-b-2xl rounded-t-none border-t-0' : 'rounded-2xl'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && replyingTo) {
                    setReplyingTo(null);
                  }
                }}
                placeholder={
                  replyingTo
                    ? `Répondre à ${replyingTo.authorName}... (Échap pour annuler)`
                    : `Écrire dans #${activeChannel.name} en tant que ${currentUser?.name || 'Membre'}...`
                }
                className="flex-1 px-4 py-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
              />

              <div className="flex items-center gap-1 pr-2">
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Send size={13} />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
              <span>
                Appuyez sur <kbd className="bg-slate-200/80 dark:bg-slate-700 px-1 rounded font-mono text-[10px] text-slate-700 dark:text-slate-300">Entrée</kbd> pour envoyer {replyingTo && '• Échap pour annuler'}
              </span>
              {!isAuthorized && (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
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

