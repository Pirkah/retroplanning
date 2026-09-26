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
  }
];

export const DEFAULT_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: 'Médailles éco-responsables en bois gravé',
    content: 'Proposer pour tous les finishers de la course 2026 une médaille découpée en bois de forêt certifiée avec le logo Run & Fun et le ruban aux couleurs de l’association.',
    category: 'Course & Parcours',
    status: 'implemented',
    authorName: 'Théo',
    authorColor: '#EC4899',
    authorInitials: 'TH',
    createdAt: '2026-09-21T14:30:00Z',
    likes: 7,
    likedBy: ['Vianney Urbanick', 'Julien Nicolle', 'Mathias Samson', 'Sina Abdoul Bastoi', 'Théo', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['Éco-responsable', 'Goodies', 'Finisher']
  },
  {
    id: 'idea-2',
    title: 'Stand crêpes & bar à smoothies au ravitaillement',
    content: 'Installer un stand gourmand et convivial à côté de l’arche d’arrivée tenu par des bénévoles pour dynamiser l’ambiance après la course.',
    category: 'Logistique & Buvette',
    status: 'implemented',
    authorName: 'Théo',
    authorColor: '#EC4899',
    authorInitials: 'TH',
    createdAt: '2026-09-22T10:15:00Z',
    likes: 6,
    likedBy: ['Julien Nicolle', 'Mathias Samson', 'Sina Abdoul Bastoi', 'Théo', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['Ravitaillement', 'Buvette', 'Convivialité']
  },
  {
    id: 'idea-3',
    title: 'Chèque géant sur support bois réutilisable',
    content: 'Au lieu d’un carton jetable à chaque événement, faire fabriquer un chèque en bois gravé avec surface velleda effaçable pour réutilisation sur toutes les éditions.',
    category: 'Animations & Soirées',
    status: 'implemented',
    authorName: 'Vianney Urbanick',
    authorColor: '#3B82F6',
    authorInitials: 'VI',
    createdAt: '2026-09-23T08:00:00Z',
    likes: 7,
    likedBy: ['Vianney Urbanick', 'Julien Nicolle', 'Mathias Samson', 'Sina Abdoul Bastoi', 'Théo', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['Cérémonie', 'Presse', 'Durable']
  },
  {
    id: 'idea-4',
    title: 'Défi Strava inter-promos IUT GEA',
    content: 'Créer un challenge virtuel sur 2 semaines précédant la course avec affichage des kilomètres parcourus sur l’écran du hall de l’IUT.',
    category: 'Communication & Réseaux',
    status: 'implemented',
    authorName: 'Julien Nicolle',
    authorColor: '#6366F1',
    authorInitials: 'JU',
    createdAt: '2026-09-23T16:20:00Z',
    likes: 5,
    likedBy: ['Vianney Urbanick', 'Sina Abdoul Bastoi', 'Julien Nicolle', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['Strava', 'Étudiants', 'Gamification']
  },
  {
    id: 'idea-5',
    title: 'Pack Partenaires avec flocage t-shirt et banderole',
    content: 'Structurer 3 formules de sponsoring claires (Bronze 200€, Argent 500€, Or 1000€) avec logo sur dossards, t-shirts coureurs et passage sono le jour J.',
    category: 'Partenaires & Sponsors',
    status: 'implemented',
    authorName: 'Mathias Samson',
    authorColor: '#F59E0B',
    authorInitials: 'MA',
    createdAt: '2026-09-24T09:45:00Z',
    likes: 7,
    likedBy: ['Mathias Samson', 'Vianney Urbanick', 'Julien Nicolle', 'Théo', 'Sina Abdoul Bastoi', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['Sponsoring', 'Mécénat', 'Finances']
  },
  {
    id: 'idea-6',
    title: 'Série de micro-trottoirs humoristiques sur TikTok',
    content: 'Interroger des étudiants et des profs dans le hall sur leur niveau en course à pied pour promouvoir l’ouverture de la billetterie HelloAsso.',
    category: 'Communication & Réseaux',
    status: 'implemented',
    authorName: 'Sina Abdoul Bastoi',
    authorColor: '#10B981',
    authorInitials: 'SI',
    createdAt: '2026-09-24T18:10:00Z',
    likes: 6,
    likedBy: ['Sina Abdoul Bastoi', 'Théo', 'Mathias Samson', 'Julien Nicolle', 'Christelle Voisin', 'Marius Chevalier'],
    tags: ['TikTok', 'Viral', 'Communication']
  }
];
