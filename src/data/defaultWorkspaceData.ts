import { ChatChannel, ChatMessage, IdeaItem } from '../types/workspace';

export const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'c-general',
    name: 'général',
    description: 'Actualités générales, réunions et vie de l’équipe Run & Fun 2026',
    iconName: 'Hash',
    isDefault: true
  },
  {
    id: 'c-course',
    name: 'course-2026',
    description: 'Organisation de la grande course : parcours, dossards, bénévoles et jour J',
    iconName: 'Flame'
  },
  {
    id: 'c-partenaires',
    name: 'partenaires-sponsors',
    description: 'Recherche de sponsors, conventions de mécénat et relations entreprises',
    iconName: 'Handshake'
  },
  {
    id: 'c-communication',
    name: 'communication',
    description: 'Réseaux sociaux, TikTok, affiches, stands et création graphique',
    iconName: 'Megaphone'
  },
  {
    id: 'c-logistique',
    name: 'logistique-sécurité',
    description: 'Buvette, matériel, Croix-Rouge, autorisations et balisage',
    iconName: 'ShieldAlert'
  },
  {
    id: 'c-supervision',
    name: 'suivi-pedagogique-remarques',
    description: 'Remarques, conseils et suivi des professeurs encadrants (Christelle Voisin & Marius Chevalier)',
    iconName: 'GraduationCap'
  }
];

export const DEFAULT_MESSAGES: ChatMessage[] = [];

export const DEFAULT_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: 'modifier réseaux pirkah',
    content: "qu'il y'ai un endroit plus discret avec mes contacts dev",
    category: 'Course & Parcours',
    status: 'implemented',
    authorName: 'Julien Nicolle',
    authorColor: '#6366F1',
    authorInitials: 'JU',
    createdAt: '2026-09-25T10:00:00Z',
    likes: 1,
    likedBy: ['Julien Nicolle'],
    tags: ['Dev', 'Discret', 'Contacts']
  },
  {
    id: 'idea-2',
    title: 'classer les membres par génération',
    content: "en gros si on laisse ce site aux prochains l'année pro qu'ils aient leur compte en qu'ils aient un truc en mode 11eme équipe et que nous y'ai écrit 10 eme équipe. comme ca si on veut passer leur donner des conseil ou voir comment ca avance on peut, et ca leur permet aussi d'avoir nos nom si plus tard des promos ont besoin de nous recontacter",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Julien Nicolle',
    authorColor: '#6366F1',
    authorInitials: 'JU',
    createdAt: '2026-09-25T10:15:00Z',
    likes: 1,
    likedBy: ['Julien Nicolle'],
    tags: ['Générations', '10e équipe', '11e équipe', 'Transmission']
  },
  {
    id: 'idea-3',
    title: 'compte spécial pour Christelle et marius',
    content: "que Christelle et marius ai un compte spécial qui leur enlève la vision de la messagerie d'équipe mais qu'ils aient un endroit pour nous laisser des remarques ou des messages,",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Julien Nicolle',
    authorColor: '#6366F1',
    authorInitials: 'JU',
    createdAt: '2026-09-25T10:30:00Z',
    likes: 1,
    likedBy: ['Julien Nicolle'],
    tags: ['Superviseurs', 'Remarques', 'Confidentialité']
  },
  {
    id: 'idea-4',
    title: 'avoir des mots de pass par utilisateur',
    content: "que chaque utilisateur puisse avoir son propre mot de passe",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Julien Nicolle',
    authorColor: '#6366F1',
    authorInitials: 'JU',
    createdAt: '2026-09-25T10:45:00Z',
    likes: 1,
    likedBy: ['Julien Nicolle'],
    tags: ['Sécurité', 'Mots de passe', 'Multi-utilisateurs']
  }
];
