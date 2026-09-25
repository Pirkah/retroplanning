export type IdeaCategory =
  | 'Course & Parcours'
  | 'Animations & Soirées'
  | 'Partenaires & Sponsors'
  | 'Communication & Réseaux'
  | 'Logistique & Buvette'
  | 'Général & Idées Vrac';

export type IdeaStatus = 'idea' | 'in_review' | 'approved' | 'implemented';

export interface IdeaItem {
  id: string;
  title: string;
  content: string;
  category: IdeaCategory;
  status: IdeaStatus;
  authorName: string;
  authorColor?: string;
  authorInitials?: string;
  createdAt: string;
  likes: number;
  likedBy?: string[]; // IDs or names of users who upvoted
  tags?: string[];
}

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  timestamp: string;
  reactions?: ChatMessageReaction[];
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  iconName: string;
  isDefault?: boolean;
}
