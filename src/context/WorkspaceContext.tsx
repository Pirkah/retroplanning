import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatChannel, ChatMessage, ChatMessageReply, IdeaItem, IdeaStatus, IdeaCategory } from '../types/workspace';
import { DEFAULT_CHANNELS, DEFAULT_MESSAGES, DEFAULT_IDEAS } from '../data/defaultWorkspaceData';
import { usePlanning } from './PlanningContext';

interface WorkspaceContextType {
  // Canaux & Messagerie
  channels: ChatChannel[];
  activeChannelId: string;
  setActiveChannelId: (channelId: string) => void;
  messages: ChatMessage[];
  addMessage: (content: string, channelId?: string, replyTo?: ChatMessageReply) => void;
  addReaction: (messageId: string, emoji: string) => void;

  // Boîte à idées
  ideas: IdeaItem[];
  addIdea: (idea: { title: string; content: string; category: IdeaCategory; tags?: string[] }) => void;
  toggleLikeIdea: (ideaId: string) => void;
  updateIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  deleteIdea: (ideaId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_MESSAGES = 'rnf_team_messages_v2';
const STORAGE_IDEAS = 'rnf_team_ideas_v2';

export const getClientSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem('rnf_chat_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('rnf_chat_session_id', sid);
    }
    return sid;
  } catch {
    return 'default_session';
  }
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthorized, openAuthModal } = usePlanning();

  const [channels] = useState<ChatChannel[]>(DEFAULT_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>(DEFAULT_CHANNELS[0].id);

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const normalizeStoredMsg = (m: ChatMessage): ChatMessage => {
      let updated = { ...m };
      const name = (updated.authorName || '').toLowerCase();
      if (name.includes('julien')) updated.authorId = updated.authorId || 'm-julien';
      if (name.includes('vianney')) updated.authorId = updated.authorId || 'm-vianney';
      if (name.includes('mathias')) updated.authorId = updated.authorId || 'm-mathias';
      if (name.includes('sina')) updated.authorId = updated.authorId || 'm-sina';
      if (name === 'tetew' || name.includes('theo') || name.includes('théo')) {
        updated.authorId = 'm-theo';
        updated.authorName = 'Théo';
        updated.authorInitials = 'TH';
      }
      if (updated.id === 'msg-2' && !updated.replyTo) {
        updated.replyTo = {
          id: 'msg-1',
          authorName: 'Vianney Urbanick',
          content: 'Salut l’équipe ! Bienvenue sur notre espace collaboratif R&F 2026...'
        };
      }
      if (updated.id === 'msg-5' && !updated.replyTo) {
        updated.replyTo = {
          id: 'msg-4',
          authorName: 'Théo',
          content: 'J’ai commencé à tracer la proposition de boucle pour le parcours de 5 km et 10 km...'
        };
      }
      return updated;
    };

    try {
      const saved = localStorage.getItem(STORAGE_MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeStoredMsg);
        }
      }
    } catch (e) {
      console.error('Erreur chargement messages:', e);
    }
    return DEFAULT_MESSAGES;
  });

  // Idées
  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_IDEAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: IdeaItem) => ({
            ...item,
            status: 'implemented' as const
          }));
        }
      }
    } catch (e) {
      console.error('Erreur chargement idées:', e);
    }
    return DEFAULT_IDEAS;
  });

  // Sauvegarde automatique des messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Sauvegarde automatique des idées
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_IDEAS, JSON.stringify(ideas));
    } catch (e) {}
  }, [ideas]);

  const addMessage = (content: string, targetChannelId?: string, replyTo?: ChatMessageReply) => {
    const text = content.trim();
    if (!text) return;

    const channelId = targetChannelId || activeChannelId;
    const authorName = currentUser?.name || 'Visiteur R&F';
    const authorInitials = currentUser?.initials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'RF');
    const authorColor = currentUser?.color || '#6366F1';
    const authorId = currentUser?.id;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      authorId,
      authorName,
      authorInitials,
      authorColor,
      content: text,
      timestamp: new Date().toISOString(),
      reactions: [],
      replyTo,
      clientSessionId: getClientSessionId()
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const addReaction = (messageId: string, emoji: string) => {
    const userName = currentUser?.name || 'Moi';

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = msg.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji);

        if (existing) {
          const hasReacted = existing.users.includes(userName);
          const nextUsers = hasReacted
            ? existing.users.filter((u) => u !== userName)
            : [...existing.users, userName];

          const nextReactions = nextUsers.length === 0
            ? currentReactions.filter((r) => r.emoji !== emoji)
            : currentReactions.map((r) => (r.emoji === emoji ? { ...r, count: nextUsers.length, users: nextUsers } : r));

          return { ...msg, reactions: nextReactions };
        }

        return {
          ...msg,
          reactions: [...currentReactions, { emoji, count: 1, users: [userName] }]
        };
      })
    );
  };

  const addIdea = (ideaData: { title: string; content: string; category: IdeaCategory; tags?: string[] }) => {
    const authorName = currentUser?.name || 'Membre de l’équipe';
    const authorColor = currentUser?.color || '#3B82F6';
    const authorInitials = currentUser?.initials || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'RF');

    const newIdea: IdeaItem = {
      id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: ideaData.title.trim(),
      content: ideaData.content.trim(),
      category: ideaData.category,
      status: 'idea',
      authorName,
      authorColor,
      authorInitials,
      createdAt: new Date().toISOString(),
      likes: 1,
      likedBy: [authorName],
      tags: ideaData.tags || []
    };

    setIdeas((prev) => [newIdea, ...prev]);
  };

  const toggleLikeIdea = (ideaId: string) => {
    const userName = currentUser?.name || 'Moi';

    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const likedBy = idea.likedBy || [];
        const alreadyLiked = likedBy.includes(userName);

        const nextLikedBy = alreadyLiked
          ? likedBy.filter((u) => u !== userName)
          : [...likedBy, userName];

        return {
          ...idea,
          likes: Math.max(0, alreadyLiked ? idea.likes - 1 : idea.likes + 1),
          likedBy: nextLikedBy
        };
      })
    );
  };

  const updateIdeaStatus = (ideaId: string, status: IdeaStatus) => {
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === ideaId ? { ...idea, status } : idea))
    );
  };

  const deleteIdea = (ideaId: string) => {
    if (!isAuthorized) {
      openAuthModal();
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
  };

  return (
    <WorkspaceContext.Provider
      value={{
        channels,
        activeChannelId,
        setActiveChannelId,
        messages,
        addMessage,
        addReaction,
        ideas,
        addIdea,
        toggleLikeIdea,
        updateIdeaStatus,
        deleteIdea
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace doit être utilisé au sein d’un WorkspaceProvider');
  }
  return context;
};
