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

export const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'c-general',
    authorId: 'm-vianney',
    authorName: 'Vianney Urbanick',
    authorInitials: 'VI',
    authorColor: '#3B82F6',
    content: 'Salut l’équipe ! Bienvenue sur notre espace collaboratif R&F 2026. On a maintenant nos outils de planning, notre boîte à idées et ce fil de discussion pour échanger rapidement.',
    timestamp: '2026-09-22T09:30:00Z',
    reactions: [
      { emoji: '👋', count: 3, users: ['Julien Nicolle', 'Mathias Samson', 'Théo'] },
      { emoji: '🔥', count: 2, users: ['Sina Abdoul Bastoi', 'Julien Nicolle'] }
    ]
  },
  {
    id: 'msg-2',
    channelId: 'c-general',
    authorId: 'm-julien',
    authorName: 'Julien Nicolle',
    authorInitials: 'JU',
    authorColor: '#6366F1',
    content: 'Superbe initiative ! Tout est bien carré. J’ai mis à jour les dates du rétroplanning et l’export A3 fonctionne impeccablement.',
    timestamp: '2026-09-22T10:15:00Z',
    replyTo: {
      id: 'msg-1',
      authorName: 'Vianney Urbanick',
      content: 'Salut l’équipe ! Bienvenue sur notre espace collaboratif R&F 2026...'
    },
    reactions: [
      { emoji: '🚀', count: 4, users: ['Vianney Urbanick', 'Mathias Samson', 'Sina Abdoul Bastoi', 'Théo'] }
    ]
  },
  {
    id: 'msg-3',
    channelId: 'c-general',
    authorId: 'm-mathias',
    authorName: 'Mathias Samson',
    authorInitials: 'MA',
    authorColor: '#F59E0B',
    content: 'De mon côté, les premiers retours des sponsors sont très encourageants. On a déjà 2 rendez-vous calés pour la semaine prochaine.',
    timestamp: '2026-09-22T11:00:00Z',
    reactions: [
      { emoji: '💪', count: 3, users: ['Vianney Urbanick', 'Théo', 'Julien Nicolle'] }
    ]
  },
  {
    id: 'msg-4',
    channelId: 'c-course',
    authorId: 'm-theo',
    authorName: 'Théo',
    authorInitials: 'TH',
    authorColor: '#EC4899',
    content: 'J’ai commencé à tracer la proposition de boucle pour le parcours de 5 km et 10 km. On évite au maximum les passages dangereux pour simplifier le dispositif Croix-Rouge et les signaleurs.',
    timestamp: '2026-09-23T14:20:00Z',
    reactions: [
      { emoji: '🏃‍♂️', count: 3, users: ['Vianney Urbanick', 'Julien Nicolle', 'Mathias Samson'] }
    ]
  },
  {
    id: 'msg-5',
    channelId: 'c-course',
    authorId: 'm-vianney',
    authorName: 'Vianney Urbanick',
    authorInitials: 'VI',
    authorColor: '#3B82F6',
    content: 'Top Théo ! On validera le tracé définitif avec la mairie au moment du dépôt de dossier en S44.',
    timestamp: '2026-09-23T15:05:00Z',
    replyTo: {
      id: 'msg-4',
      authorName: 'Théo',
      content: 'J’ai commencé à tracer la proposition de boucle pour le parcours de 5 km et 10 km...'
    },
    reactions: [
      { emoji: '👍', count: 2, users: ['Théo', 'Julien Nicolle'] }
    ]
  },
  {
    id: 'msg-6',
    channelId: 'c-communication',
    authorId: 'm-sina',
    authorName: 'Sina Abdoul Bastoi',
    authorInitials: 'SI',
    authorColor: '#10B981',
    content: 'J’ai préparé 3 formats d’affiches pour la remise de chèque du 8 octobre et le teaser TikTok de la rentrée. Je les dépose dans la boîte à idées pour avis !',
    timestamp: '2026-09-24T16:45:00Z',
    reactions: [
      { emoji: '🎯', count: 3, users: ['Julien Nicolle', 'Vianney Urbanick', 'Mathias Samson'] }
    ]
  },
  {
    id: 'msg-sup-1',
    channelId: 'c-supervision',
    authorId: 'm-christelle',
    authorName: 'Christelle Voisin',
    authorInitials: 'CV',
    authorColor: '#8B5CF6',
    content: "Bonjour à toute l'équipe Run & Fun ! Nous suivons avec attention l'avancement de votre rétroplanning. N'hésitez pas si vous avez des questions sur la validation universitaire ou les conventions d'objectifs.",
    timestamp: '2026-09-24T14:00:00Z',
    reactions: [
      { emoji: '🙏', count: 3, users: ['Julien Nicolle', 'Vianney Urbanick', 'Théo'] }
    ]
  },
  {
    id: 'msg-sup-2',
    channelId: 'c-supervision',
    authorId: 'm-julien',
    authorName: 'Julien Nicolle',
    authorInitials: 'JU',
    authorColor: '#6366F1',
    content: 'Merci Madame Voisin ! Nous avons bien calé les dates pour les dossiers préfecture et sponsors.',
    timestamp: '2026-09-24T15:20:00Z',
    replyTo: {
      id: 'msg-sup-1',
      authorName: 'Christelle Voisin',
      content: "Bonjour à toute l'équipe Run & Fun ! Nous suivons avec attention l'avancement de votre rétroplanning..."
    },
    reactions: [
      { emoji: '👍', count: 1, users: ['Christelle Voisin'] }
    ]
  },
  {
    id: 'msg-sup-3',
    channelId: 'c-supervision',
    authorId: 'm-marius',
    authorName: 'Marius Chevalier',
    authorInitials: 'MC',
    authorColor: '#0EA5E9',
    content: "Bravo pour la mise en place de cet outil collaboratif, c'est très clair et bien structuré. Pensez bien à anticiper la demande d'occupation du domaine public auprès de la mairie d'Alençon.",
    timestamp: '2026-09-24T16:00:00Z',
    reactions: [
      { emoji: '🎯', count: 3, users: ['Julien Nicolle', 'Vianney Urbanick', 'Mathias Samson'] }
    ]
  }
];

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
