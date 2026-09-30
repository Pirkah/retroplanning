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
    name: 'échanges-encadrement-bde',
    description: 'Espace partagé pour échanger avec l’équipe Run & Fun, les professeurs encadrants et le BDE',
    iconName: 'Users'
  }
];

export const DEFAULT_MESSAGES: ChatMessage[] = [];

export const DEFAULT_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: 'Liens et contacts discrets',
    content: "Avoir un endroit discret pour les informations de développement et liens utiles",
    category: 'Course & Parcours',
    status: 'implemented',
    authorName: 'Vice-président',
    authorColor: '#6366F1',
    authorInitials: 'VP',
    createdAt: '2026-09-25T10:00:00Z',
    likes: 1,
    likedBy: ['Vice-président'],
    tags: ['Dev', 'Discret', 'Contacts']
  },
  {
    id: 'idea-2',
    title: 'Classer les membres par génération',
    content: "Permettre aux promotions suivantes d'avoir leur propre équipe (11ème équipe) tout en gardant l'historique de la 10ème équipe pour transmettre les retours d'expérience et conseils",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Vice-président',
    authorColor: '#6366F1',
    authorInitials: 'VP',
    createdAt: '2026-09-25T10:15:00Z',
    likes: 1,
    likedBy: ['Vice-président'],
    tags: ['Générations', '10e équipe', '11e équipe', 'Transmission']
  },
  {
    id: 'idea-3',
    title: 'Compte spécial pour les enseignants encadrants',
    content: "Permettre aux professeurs encadrants d'avoir un compte avec un salon dédié pour échanger des remarques et conseils sans mélanger avec le chat interne",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Vice-président',
    authorColor: '#6366F1',
    authorInitials: 'VP',
    createdAt: '2026-09-25T10:30:00Z',
    likes: 1,
    likedBy: ['Vice-président'],
    tags: ['Superviseurs', 'Remarques', 'Confidentialité']
  },
  {
    id: 'idea-4',
    title: 'Mots de passe par utilisateur',
    content: "Que chaque compte ou rôle puisse avoir son propre mot de passe personnalisé",
    category: 'Général & Idées Vrac',
    status: 'implemented',
    authorName: 'Vice-président',
    authorColor: '#6366F1',
    authorInitials: 'VP',
    createdAt: '2026-09-25T10:45:00Z',
    likes: 1,
    likedBy: ['Vice-président'],
    tags: ['Sécurité', 'Mots de passe', 'Multi-utilisateurs']
  }
];
