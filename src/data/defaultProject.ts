import { Project, DEFAULT_TEAM_MEMBERS } from '../types/planning';
import { getCategoryColor } from '../utils/categories';

export const DEFAULT_PROJECT: Project = {
  id: 'proj-rnf-2026',
  name: 'Rétroplanning Course R&F 2026 - 2027',
  description: 'Rétroplanning prévisionnel complet de la course et des actions associatives avec suivi en temps réel.',
  createdAt: '2026-09-23T08:00:00.000Z',
  members: DEFAULT_TEAM_MEMBERS,
  tasks: [
    // --- TÂCHES HISTORIQUES EFFECTUÉES (DIAGRAMME GANTT JUIN - AOÛT 2026) ---
    {
      id: 'task-hist-1',
      title: 'Récupération du site internet',
      description: 'Récupération des accès d’administration et du code source du site.',
      startDate: '2026-06-08',
      endDate: '2026-06-21',
      color: '#10B981', // Communication & Médias
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Communication & Médias',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-hist-2',
      title: 'Assemblée générale pour la passation',
      description: 'Tenue de l’AG avec élection du nouveau bureau.',
      startDate: '2026-07-06',
      endDate: '2026-07-19',
      color: '#6366F1', // Administratif & Juridique
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-3',
      title: 'Valider la passation',
      description: 'Signature des procès-verbaux de passation.',
      startDate: '2026-07-13',
      endDate: '2026-07-19',
      color: '#6366F1', // Administratif & Juridique
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-4',
      title: 'Passation administrative à la préfecture',
      description: 'Dépôt des statuts modifiés et déclaration officielle en préfecture.',
      startDate: '2026-07-13',
      endDate: '2026-08-02',
      color: '#6366F1', // Administratif & Juridique
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-5',
      title: 'Passation banque et assurance',
      description: 'Rendez-vous bancaire pour transfert de signature et mise à jour assurance.',
      startDate: '2026-08-03',
      endDate: '2026-08-23',
      color: '#06B6D4', // Finance & Trésorerie
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Finance & Trésorerie',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-6',
      title: 'Changement de nom du président sur le compte',
      description: 'Actualisation bancaire avec procuration.',
      startDate: '2026-08-03',
      endDate: '2026-08-23',
      color: '#06B6D4', // Finance & Trésorerie
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Finance & Trésorerie',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-7',
      title: 'Changement de nom au niveau de l’assurance',
      description: 'Contrat d’assurance association mis à jour.',
      startDate: '2026-08-10',
      endDate: '2026-08-23',
      color: '#6366F1', // Administratif & Juridique
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-hist-8',
      title: 'Récupération des réseaux sociaux de l’association',
      description: 'Récupération des mots de passe Instagram, Facebook, TikTok.',
      startDate: '2026-08-24',
      endDate: '2026-09-06',
      color: '#10B981', // Communication & Médias
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Communication & Médias',
      assignee: 'Mathias Samson',
      assigneeId: 'm-mathias'
    },

    // --- TÂCHES DU TABLEAU DE L'UTILISATEUR ---
    {
      id: 'task-tab-1',
      title: 'Appelée Gravir pour Guérir',
      description: 'Prise de contact téléphonique avec l’association caritative (date fixée au 8 octobre).',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Partenaires & Sponsors',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-2',
      title: 'Trouver une activité pour le 17 septembre',
      description: 'Brainstorming et calage de l’animation de rentrée.',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      color: '#F43F5E', // Événements & Animations
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Événements & Animations',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-3',
      title: 'Envoyer un mail à DPB pour les 5 t-shirts et négocier',
      description: 'Devis et négociation t-shirts de l’équipe avec le fournisseur DPB.',
      startDate: '2026-09-07',
      endDate: '2026-09-11',
      color: '#14B8A6', // Fournisseurs & Commandes
      status: 'completed',
      priority: 'medium',
      progress: 100,
      category: 'Fournisseurs & Commandes',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-tab-4',
      title: 'Carte bleue association',
      description: 'Carte bancaire reçue le 19 septembre et activée.',
      startDate: '2026-09-07',
      endDate: '2026-09-11',
      color: '#06B6D4', // Finance & Trésorerie
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Finance & Trésorerie',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-5',
      title: 'Créer le club Strava et préparer la première page',
      description: 'Lancement du club de running pour les étudiants sur Strava.',
      startDate: '2026-09-11',
      endDate: '2026-09-16',
      color: '#10B981', // Communication & Médias
      status: 'completed',
      priority: 'medium',
      progress: 100,
      category: 'Communication & Médias',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-6',
      title: 'Demande de salle pour la remise de chèque',
      description: 'Réservation de la salle auprès de l’administration IUT GEA.',
      startDate: '2026-09-14',
      endDate: '2026-09-18',
      color: '#3B82F6', // Logistique & Sécurité
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Logistique & Sécurité',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-7',
      title: 'Envoyé un mail aux fournisseurs pour les inviter à la remise de chèque',
      description: 'Invitation officielle pour la cérémonie de remise de chèque.',
      startDate: '2026-09-18',
      endDate: '2026-09-24',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Partenaires & Sponsors',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-8',
      title: 'Aller chercher le chèque pour la remise',
      description: 'Récupération du chèque grand format imprimé et bancaire.',
      startDate: '2026-09-18',
      endDate: '2026-09-24',
      color: '#14B8A6', // Fournisseurs & Commandes
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Fournisseurs & Commandes',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-9',
      title: 'Contact des BDE pour partenariat',
      description: 'Prise de contact avec les autres BDE pour synergie et visibilité.',
      startDate: '2026-09-18',
      endDate: '2026-09-25',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Partenaires & Sponsors',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-tab-10',
      title: 'Rédiger la liste des partenaires potentiels à contacter',
      description: 'Listing des entreprises locales, commerçants et sponsors.',
      startDate: '2026-09-18',
      endDate: '2026-09-27',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'in_progress',
      priority: 'high',
      progress: 50,
      category: 'Partenaires & Sponsors',
      assignee: 'Mathias Samson',
      assigneeId: 'm-mathias'
    },
    {
      id: 'task-tab-11',
      title: 'Faire l’affiche pour le hall de GEA',
      description: 'Création du visuel et impression pour affichage hall.',
      startDate: '2026-09-18',
      endDate: '2026-09-25',
      color: '#10B981', // Communication & Médias
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Communication & Médias',
      assignee: 'Mathias Samson',
      assigneeId: 'm-mathias'
    },
    {
      id: 'task-tab-12',
      title: 'Choisir une date pour la course',
      description: 'Arbitrage avec l’université et calendrier des courses.',
      startDate: '2026-09-18',
      endDate: '2026-09-25',
      color: '#EC4899', // Préparation & Cadrage
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Préparation & Cadrage',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-13',
      title: 'Parler avec ACTU pour les événements qu’on a fait',
      description: 'Bilan et communication croisée avec l’association étudiante ACTU.',
      startDate: '2026-09-21',
      endDate: '2026-09-29',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'in_progress',
      priority: 'medium',
      progress: 50,
      category: 'Partenaires & Sponsors',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-tab-14',
      title: 'Renouveler le site internet de la course',
      description: 'Mise à jour des mentions, dates, et intégration billetterie.',
      startDate: '2026-09-21',
      endDate: '2026-09-30',
      color: '#10B981', // Communication & Médias
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Communication & Médias',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-tab-15',
      title: 'Contacter la mairie pour les autorisations',
      description: 'Dépôt des demandes d’occupation d’espace public et voirie auprès de la mairie.',
      startDate: '2026-09-21',
      endDate: '2026-09-30',
      color: '#6366F1', // Administratif & Juridique
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-16',
      title: 'Rappel invitation des partenaires de l’an dernier pour remise de chèque',
      description: 'Relance téléphonique et email des mécènes.',
      startDate: '2026-09-25',
      endDate: '2026-10-01',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Partenaires & Sponsors',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-tab-17',
      title: 'Appeler SMACL',
      description: 'Vérification des clauses et avenant manifestation avec l’assureur.',
      startDate: '2026-09-23',
      endDate: '2026-09-28',
      color: '#6366F1', // Administratif & Juridique
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-18',
      title: 'Faire un premier TikTok',
      description: 'Teaser vidéo de l’équipe et du projet solidaire.',
      startDate: '2026-09-23',
      endDate: '2026-09-28',
      color: '#10B981', // Communication & Médias
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Communication & Médias',
      assignee: 'Sina Abdoul Bastoi',
      assigneeId: 'm-sina'
    },
    {
      id: 'task-tab-19',
      title: 'Effectuer la demande de permanence et de TPE',
      description: 'Demande auprès de la banque pour terminal de paiement électronique.',
      startDate: '2026-09-23',
      endDate: '2026-09-30',
      color: '#06B6D4', // Finance & Trésorerie
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Finance & Trésorerie',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-20',
      title: 'Appeler les pompiers de l’urgence internationale',
      description: 'Suivi de partenariat et rendez-vous téléphonique.',
      startDate: '2026-09-21',
      endDate: '2026-09-30',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'in_progress',
      priority: 'medium',
      progress: 40,
      category: 'Partenaires & Sponsors',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-21',
      title: 'S’informer sur la vente d’alcool, autorisation, réglementation',
      description: 'Réglementation buvette et licence temporaire débit de boissons.',
      startDate: '2026-09-23',
      endDate: '2026-09-30',
      color: '#6366F1', // Administratif & Juridique
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Administratif & Juridique',
      assignee: 'Théo',
      assigneeId: 'm-theo'
    },
    {
      id: 'task-tab-22',
      title: 'Préparer le dossier de subvention',
      description: 'Rédaction du dossier, budget prévisionnel et pièces justificatives.',
      startDate: '2026-09-28',
      endDate: '2026-10-09',
      color: '#06B6D4', // Finance & Trésorerie
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Finance & Trésorerie',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-tab-23',
      title: 'Post pour la remise de chèque',
      description: 'Publication photo et remerciement des partenaires sur Instagram.',
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      color: '#F97316', // Post-événement
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Post-événement',
      assignee: 'Sina Abdoul Bastoi',
      assigneeId: 'm-sina'
    },

    // --- TÂCHES CLÉS PLANIFIÉES SUR LE GANTT (OCTOBRE 2026 - MARS 2027) ---
    {
      id: 'task-gantt-1',
      title: 'Jalon : Remise de chèque à l’association Gravir pour Guérir',
      description: 'Cérémonie officielle en présence des partenaires et de la presse.',
      startDate: '2026-10-08',
      endDate: '2026-10-08',
      color: '#EF4444', // Activité / Jour J
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Activité / Jour J',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney',
      isMilestone: true
    },
    {
      id: 'task-gantt-2',
      title: 'Démarchages pour la recherche de partenaires',
      description: 'Campagne de prospection active auprès des sponsors.',
      startDate: '2026-10-05',
      endDate: '2026-12-06',
      color: '#F59E0B', // Partenaires & Sponsors
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Partenaires & Sponsors',
      assignee: 'Mathias Samson',
      assigneeId: 'm-mathias'
    },
    {
      id: 'task-gantt-3',
      title: 'Demande de manifestation sportive à la mairie',
      description: 'Dépôt du dossier de sécurité et tracé du parcours.',
      startDate: '2026-10-26',
      endDate: '2026-11-22',
      color: '#6366F1', // Administratif & Juridique
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Administratif & Juridique',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney'
    },
    {
      id: 'task-gantt-4',
      title: 'Balisage & contact organisme de secourisme (Croix-Rouge)',
      description: 'Devis poste de secours et plan de balisage de sécurité.',
      startDate: '2026-11-02',
      endDate: '2026-12-20',
      color: '#3B82F6', // Logistique & Sécurité
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Logistique & Sécurité',
      assignee: 'Théo',
      assigneeId: 'm-theo'
    },
    {
      id: 'task-gantt-5',
      title: 'Recherche et recrutement des bénévoles',
      description: 'Constitution de l’équipe de signaleurs et ravitaillement (40 bénévoles).',
      startDate: '2026-12-07',
      endDate: '2027-01-10',
      color: '#3B82F6', // Logistique & Sécurité
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Logistique & Sécurité',
      assignee: 'Théo',
      assigneeId: 'm-theo'
    },
    {
      id: 'task-gantt-6',
      title: 'Communication de la course & vente de dossards',
      description: 'Affiches, stands IUT et campagnes réseaux sociaux.',
      startDate: '2027-01-04',
      endDate: '2027-02-21',
      color: '#10B981', // Communication & Médias
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Communication & Médias',
      assignee: 'Sina Abdoul Bastoi',
      assigneeId: 'm-sina'
    },
    {
      id: 'task-gantt-7',
      title: 'Vente de dossards en ligne via HelloAsso',
      description: 'Ouverture de la billetterie en ligne et communication.',
      startDate: '2027-01-11',
      endDate: '2027-02-28',
      color: '#10B981', // Communication & Médias
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Communication & Médias',
      assignee: 'Julien Nicolle',
      assigneeId: 'm-julien'
    },
    {
      id: 'task-gantt-8',
      title: 'Jalon : RUN AND FUN DAY (Jour de la Course)',
      description: 'Grand événement de la course solidaire, animations et buvette.',
      startDate: '2027-03-22',
      endDate: '2027-03-22',
      color: '#EF4444', // Activité / Jour J
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Activité / Jour J',
      assignee: 'Vianney Urbanick',
      assigneeId: 'm-vianney',
      isMilestone: true
    }
  ],
  events: [
    {
      id: 'event-rnf-passation',
      title: 'Passation & Conformité Administrative',
      date: '28-sept-26',
      objective: 'Transfert officiel de l’association, mise à jour bancaire, statuts préfecture et conformité juridique',
      content: 'Élection du nouveau bureau en AG, déclaration préfecture, transmission des accès site web et réseaux sociaux, mise à jour assurances et activation carte bancaire.',
      color: '#6366F1',
      tasks: [
        { id: 't-adm-1', weekLabel: 'S24', category: 'Communication & Médias', action: 'Récupération du site internet (accès administration et code source)', assignee: 'Julien Nicolle', status: 'completed' },
        { id: 't-adm-2', weekLabel: 'S28', category: 'Administratif & Juridique', action: 'Assemblée générale pour la passation et élection du bureau', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-3', weekLabel: 'S29', category: 'Administratif & Juridique', action: 'Valider la passation et signature des procès-verbaux', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-4', weekLabel: 'S29', category: 'Administratif & Juridique', action: 'Passation administrative à la préfecture et statuts modifiés', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-5', weekLabel: 'S32', category: 'Finance & Trésorerie', action: 'Passation banque et rendez-vous pour transfert de signature', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-6', weekLabel: 'S32', category: 'Finance & Trésorerie', action: 'Changement de nom du président sur le compte bancaire', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-7', weekLabel: 'S33', category: 'Administratif & Juridique', action: 'Changement de nom au niveau du contrat d’assurance association', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-8', weekLabel: 'S35', category: 'Communication & Médias', action: 'Récupération des comptes réseaux sociaux de l’association (Instagram, TikTok)', assignee: 'Mathias Samson', status: 'completed' },
        { id: 't-adm-9', weekLabel: 'S37', category: 'Finance & Trésorerie', action: 'Réception et activation de la carte bancaire de l’association', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-adm-10', weekLabel: 'S39 (28 sept.)', category: 'Activité / Jour J', action: 'Validation de la Passation Officielle & Statuts déposés en Préfecture', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 't-adm-11', weekLabel: 'S40', category: 'Administratif & Juridique', action: 'Appeler l’assurance SMACL pour avenant manifestation et responsabilités', assignee: 'Vianney Urbanick', status: 'todo' },
        { id: 't-adm-12', weekLabel: 'S40', category: 'Finance & Trésorerie', action: 'Effectuer la demande de permanence bancaire et de TPE (terminal carte)', assignee: 'Vianney Urbanick', status: 'todo' },
        { id: 't-adm-13', weekLabel: 'S40', category: 'Administratif & Juridique', action: 'S’informer sur la vente d’alcool, autorisations et réglementation buvette', assignee: 'Théo', status: 'todo' },
        { id: 't-adm-14', weekLabel: 'S41', category: 'Finance & Trésorerie', action: 'Préparer le dossier de subvention et budget prévisionnel de l’année', assignee: 'Vianney Urbanick', status: 'todo' }
      ]
    },
    {
      id: 'event-rnf-remise',
      title: 'Remise de Chèque Gravir pour Guérir & Rentrée',
      date: '08-oct-26',
      objective: 'Cérémonie officielle de remise de chèque à l’association Gravir pour Guérir et animation de rentrée étudiante',
      content: 'Organisation de la cérémonie avec les partenaires et la presse, réservation de salle à l’IUT GEA, impression chèque géant, cartons d’invitation et diffusion sur les réseaux.',
      color: '#F59E0B',
      tasks: [
        { id: 't-rnf-1', weekLabel: 'S36', category: 'Partenaires & Sponsors', action: 'Prise de contact téléphonique avec l’association Gravir pour Guérir (dispo le 8 octobre)', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-rnf-2', weekLabel: 'S36', category: 'Événements & Animations', action: 'Conception et calage de l’activité d’animation étudiante du 17 septembre', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-rnf-3', weekLabel: 'S38', category: 'Logistique & Sécurité', action: 'Demande de salle pour la remise de chèque auprès de l’administration IUT GEA', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-rnf-4', weekLabel: 'S39', category: 'Fournisseurs & Commandes', action: 'Commande et récupération du chèque grand format cartonné pour la remise', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-rnf-5', weekLabel: 'S39', category: 'Partenaires & Sponsors', action: 'Envoyer un mail aux fournisseurs et partenaires pour les inviter à la remise', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-rnf-6', weekLabel: 'S39', category: 'Communication & Médias', action: 'Création et pose de l’affiche annonçant l’événement dans le hall de GEA', assignee: 'Mathias Samson', status: 'completed' },
        { id: 't-rnf-7', weekLabel: 'S40', category: 'Partenaires & Sponsors', action: 'Relance et rappel d’invitation des partenaires et mécènes de l’an dernier', assignee: 'Julien Nicolle', status: 'completed' },
        { id: 't-rnf-8', weekLabel: 'S41 (08 oct.)', category: 'Activité / Jour J', action: 'Cérémonie officielle de remise de chèque à Gravir pour Guérir – 8 octobre 2026', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 't-rnf-9', weekLabel: 'S42', category: 'Post-événement', action: 'Publication des photos et remerciements aux partenaires sur les réseaux sociaux', assignee: 'Sina Abdoul Bastoi', status: 'todo' }
      ]
    },
    {
      id: 'event-rnf-partenaires',
      title: 'Partenaires, Sponsors & Synergies Inter-BDE',
      date: '06-déc-26',
      objective: 'Recherche active de sponsors, conventions de mécénat pour la course, et partenariats associatifs étudiants',
      content: 'Prospection active des sponsors locaux, signature des conventions de mécénat, relations avec les BDE du campus et commande dotations partenaires.',
      color: '#F59E0B',
      tasks: [
        { id: 't-part-1', weekLabel: 'S39', category: 'Partenaires & Sponsors', action: 'Constitution et rédaction de la liste des partenaires et sponsors potentiels', assignee: 'Mathias Samson', status: 'in_progress' },
        { id: 't-part-2', weekLabel: 'S39', category: 'Partenaires & Sponsors', action: 'Contact des autres BDE pour partenariat et synergie inter-promos', assignee: 'Julien Nicolle', status: 'in_progress' },
        { id: 't-part-3', weekLabel: 'S39', category: 'Partenaires & Sponsors', action: 'Échange avec l’association ACTU pour actions communes et retours d’expérience', assignee: 'Julien Nicolle', status: 'in_progress' },
        { id: 't-part-4', weekLabel: 'S40', category: 'Partenaires & Sponsors', action: 'Prise de contact avec les Pompiers de l’Urgence Internationale (PUI) pour mécénat', assignee: 'Vianney Urbanick', status: 'in_progress' },
        { id: 't-part-5', weekLabel: 'S41', category: 'Partenaires & Sponsors', action: 'Démarchages actifs, rendez-vous physiques et présentation du dossier sponsoring', assignee: 'Mathias Samson', status: 'in_progress' },
        { id: 't-part-6', weekLabel: 'S43', category: 'Fournisseurs & Commandes', action: 'Devis et négociation avec DPB pour les t-shirts sponsors et de l’équipe', assignee: 'Julien Nicolle', status: 'in_progress' },
        { id: 't-part-7', weekLabel: 'S46', category: 'Partenaires & Sponsors', action: 'Finalisation et signature des conventions de partenariat et mécénat', assignee: 'Mathias Samson', status: 'todo' },
        { id: 't-part-8', weekLabel: 'S49 (06 déc.)', category: 'Activité / Jour J', action: 'Clôture de la Campagne de Sponsoring & Budgets Partenaires validés', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 't-part-9', weekLabel: 'S50', category: 'Post-événement', action: 'Envoi des attestations de mécénat, factures acquittées et récapitulatif comptable', assignee: 'Vianney Urbanick', status: 'todo' }
      ]
    },
    {
      id: 'event-rnf-course',
      title: 'Grande Course Solidaire Run & Fun 2027',
      date: '22-mars-27',
      objective: 'Organisation complète, billetterie, sécurité, communication et déroulement de la course solidaire',
      content: 'Recrutement des bénévoles, vente de dossards en ligne via HelloAsso, communication sur le campus, balisage du parcours, secours Croix-Rouge et gestion du jour J.',
      color: '#EF4444',
      tasks: [
        { id: 't-crs-1', weekLabel: 'S39', category: 'Préparation & Cadrage', action: 'Choisir et acter la date définitive de la course avec l’université', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-crs-2', weekLabel: 'S40', category: 'Communication & Médias', action: 'Renouveler et moderniser le site internet de la course (mentions, billetterie)', assignee: 'Julien Nicolle', status: 'todo' },
        { id: 't-crs-3', weekLabel: 'S41', category: 'Communication & Médias', action: 'Création du club Strava Run & Fun et animation des défis running étudiants', assignee: 'Vianney Urbanick', status: 'completed' },
        { id: 't-crs-4', weekLabel: 'S42', category: 'Communication & Médias', action: 'Réalisation et diffusion du premier TikTok teaser pour la course solidaire', assignee: 'Sina Abdoul Bastoi', status: 'todo' },
        { id: 't-crs-5', weekLabel: 'S44', category: 'Administratif & Juridique', action: 'Dépôt officiel en mairie du dossier de manifestation sportive et voirie', assignee: 'Vianney Urbanick', status: 'todo' },
        { id: 't-crs-6', weekLabel: 'S45', category: 'Logistique & Sécurité', action: 'Devis et convention avec l’organisme de secourisme (Croix-Rouge) et plan secours', assignee: 'Théo', status: 'todo' },
        { id: 't-crs-7', weekLabel: 'S50', category: 'Logistique & Sécurité', action: 'Campagne de recrutement et affectation des 40 bénévoles (signaleurs, ravitaillement)', assignee: 'Théo', status: 'todo' },
        { id: 't-crs-8', weekLabel: 'S01', category: 'Communication & Médias', action: 'Grande campagne de communication de la course sur le campus (affiches, réseaux)', assignee: 'Sina Abdoul Bastoi', status: 'todo' },
        { id: 't-crs-9', weekLabel: 'S02', category: 'Communication & Médias', action: 'Permanences d’information et stands dans le hall de l’IUT', assignee: 'Mathias Samson', status: 'todo' },
        { id: 't-crs-10', weekLabel: 'S02 (15 janv.)', category: 'Activité / Jour J', action: 'Lancement Officiel de la Billetterie en ligne HelloAsso & Inscriptions Dossards', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 't-crs-11', weekLabel: 'S08', category: 'Fournisseurs & Commandes', action: 'Commande groupée des t-shirts coureurs, médailles, dossards et ravitaillement', assignee: 'Julien Nicolle', status: 'todo' },
        { id: 't-crs-12', weekLabel: 'S11', category: 'Logistique & Sécurité', action: 'Briefing sécurité général avec la Croix-Rouge, sécurité campus et bénévoles', assignee: 'Mathias Samson', status: 'todo' },
        { id: 't-crs-13', weekLabel: 'S12', category: 'Logistique & Sécurité', action: 'Balisage complet du parcours de la course, montage des arches et stands', assignee: 'Théo', status: 'todo' },
        { id: 't-crs-14', weekLabel: 'S12 (22 mars)', category: 'Activité / Jour J', action: 'JOUR J : RUN AND FUN DAY – Grande Course Solidaire 2027 !', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 't-crs-15', weekLabel: 'S13', category: 'Post-événement', action: 'Démontage, nettoyage éco-responsable du site, proclamation des podiums et débriefing', assignee: 'Toute l’équipe', status: 'todo' },
        { id: 't-crs-16', weekLabel: 'S14', category: 'Post-événement', action: 'Bilan comptable final de la course, diffusion de l’aftermovie vidéo et remerciements', assignee: 'Julien Nicolle', status: 'todo' }
      ]
    }
  ]
};

export const GEA_ENTREPRENEURIAT_PROJECT: Project = {
  id: 'proj-gea-2026',
  name: 'GEA ENTREPRENEURIAT - RÉTRO-PLANNING ANNÉE 2026-2027',
  description: 'Rétro-planning prévisionnel des 4 événements majeurs de l’année 2026-2027.',
  createdAt: '2026-09-23T10:00:00.000Z',
  members: [
    { id: 'm-nora', name: 'Nora RIVET', role: 'Membre équipe', color: '#EC4899', initials: 'NR' },
    { id: 'm-laurine', name: 'Laurine COGHE', role: 'Membre équipe', color: '#10B981', initials: 'LC' },
    { id: 'm-alexandre', name: 'Alexandre VARIERAS', role: 'Membre équipe', color: '#3B82F6', initials: 'AV' },
    { id: 'm-nolann', name: 'Nolann MAZEAU', role: 'Membre équipe', color: '#8B5CF6', initials: 'NM' },
    { id: 'm-david', name: 'David MEIRA', role: 'Membre équipe', color: '#F59E0B', initials: 'DM' },
    { id: 'm-paul', name: 'Paul De SEZE', role: 'Membre équipe', color: '#0EA5E9', initials: 'PS' }
  ],
  tasks: [
    {
      id: 'gea-task-1',
      title: 'Escape Game Entrepreneuriat',
      startDate: '2026-09-21',
      endDate: '2026-10-23',
      color: '#EF4444', // Activité / Jour J
      status: 'in_progress',
      priority: 'high',
      progress: 40,
      category: 'Activité / Jour J',
      assignee: 'Toute l’équipe'
    },
    {
      id: 'gea-task-2',
      title: 'Simulation d’entreprise',
      startDate: '2026-10-12',
      endDate: '2026-11-06',
      color: '#EF4444', // Activité / Jour J
      status: 'todo',
      priority: 'high',
      progress: 10,
      category: 'Activité / Jour J',
      assignee: 'Toute l’équipe'
    },
    {
      id: 'gea-task-3',
      title: 'Conférence PÉPITE & Étudiants',
      startDate: '2026-11-23',
      endDate: '2027-01-08',
      color: '#EF4444', // Activité / Jour J
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Activité / Jour J',
      assignee: 'Toute l’équipe'
    },
    {
      id: 'gea-task-4',
      title: 'Grand Dîner Entrepreneurial',
      startDate: '2027-01-18',
      endDate: '2027-03-12',
      color: '#EF4444', // Activité / Jour J
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Activité / Jour J',
      assignee: 'Toute l’équipe'
    }
  ],
  events: [
    {
      id: 'gea-event-1',
      title: 'Escape Game',
      date: '15-oct-26',
      objective: 'Initiation aux notions de l’entreprenariat pour les BUT 1',
      content: 'Mise en avant des notions de l’entreprenariat de façon ludique ainsi que de faciliter le travail de groupe et l’intégration des BUT 1. Possibilité de le mettre obligatoire sur l’emploi du temps, sinon faire un système d’inscription.',
      color: '#10B981',
      tasks: [
        {
          id: 'gea-eg-1',
          weekLabel: 'S39',
          category: 'Communication & Médias',
          action: 'Créer le formulaire d’inscription en ligne. Si impossible de le rendre obligatoire.',
          assignee: 'Laurine COGHE',
          status: 'todo'
        },
        {
          id: 'gea-eg-2',
          weekLabel: 'S40',
          category: 'Communication & Médias',
          action: 'Réaliser une vidéo de promotion (Reel)',
          assignee: 'Nolann MAZEAU',
          status: 'todo'
        },
        {
          id: 'gea-eg-3',
          weekLabel: 'S40',
          category: 'Communication & Médias',
          action: 'Intervenir dans les cours de BUT 1 pour présenter l’atelier',
          assignee: 'Alexandre VARIERAS',
          status: 'todo'
        },
        {
          id: 'gea-eg-4',
          weekLabel: 'S41',
          category: 'Logistique & Sécurité',
          action: 'Contrôler les inscriptions et relancer si nécessaire',
          assignee: 'Paul De SEZE',
          status: 'todo'
        },
        {
          id: 'gea-eg-5',
          weekLabel: 'S41',
          category: 'Préparation & Cadrage',
          action: 'Préparer l’activité entrepreneuriale et les énigmes',
          assignee: 'David MEIRA',
          status: 'todo'
        },
        {
          id: 'gea-eg-6',
          weekLabel: 'S42',
          category: 'Logistique & Sécurité',
          action: 'Organiser l’ouverture de la salle et le matériel',
          assignee: 'Laurine COGHE',
          status: 'todo'
        },
        {
          id: 'gea-eg-7',
          weekLabel: 'S42 (12 oct.)',
          category: 'Activité / Jour J',
          action: 'Escape Game – Jeudi 22 octobre 2026, 2H',
          assignee: 'Toute l’équipe',
          status: 'event',
          isEventHighlight: true
        },
        {
          id: 'gea-eg-8',
          weekLabel: 'S42 (12 oct.)',
          category: 'Post-événement',
          action: 'Envoyer un sondage de satisfaction aux participants',
          assignee: 'Nora RIVET',
          status: 'todo'
        },
        {
          id: 'gea-eg-9',
          weekLabel: 'S43',
          category: 'Post-événement',
          action: 'Débriefing interne + bilan des inscriptions (formulaire)',
          assignee: 'Toute l’équipe',
          status: 'todo'
        }
      ]
    },
    {
      id: 'gea-event-2',
      title: 'Simulation d’une application pour créer une entreprise',
      date: '05-nov-26',
      objective: 'Simulation entrepreneuriale – préparation à certaines évaluations',
      content: 'Simulation de compétition de gestion d’entreprise pour initier les BUT 1',
      color: '#3B82F6',
      tasks: [
        { id: 'gea-sim-1', weekLabel: 'S42', category: 'Préparation & Cadrage', action: 'Définition des règles et du scénario d’application', assignee: 'Nora RIVET', status: 'todo' },
        { id: 'gea-sim-2', weekLabel: 'S43', category: 'Communication & Médias', action: 'Affiche, vidéo, réseaux sociaux et teasing', assignee: 'Nolann MAZEAU', status: 'todo' },
        { id: 'gea-sim-3', weekLabel: 'S44', category: 'Logistique & Sécurité', action: 'Réservation salle informatique et matériel', assignee: 'Alexandre VARIERAS', status: 'todo' },
        { id: 'gea-sim-4', weekLabel: 'S44', category: 'Logistique & Sécurité', action: 'Installation des logiciels de simulation et tests techniques', assignee: 'David MEIRA', status: 'todo' },
        { id: 'gea-sim-5', weekLabel: 'S45 (05 nov.)', category: 'Activité / Jour J', action: 'Simulation Entreprise – Jeudi 5 novembre 2026', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 'gea-sim-6', weekLabel: 'S45', category: 'Événements & Animations', action: 'Analyse des résultats et remise des classements', assignee: 'Paul De SEZE', status: 'todo' },
        { id: 'gea-sim-7', weekLabel: 'S46', category: 'Post-événement', action: 'Questionnaire satisfaction et bilan pédagogique', assignee: 'Laurine COGHE', status: 'todo' }
      ]
    },
    {
      id: 'gea-event-3',
      title: 'Conférence',
      date: '07-janv-27',
      objective: 'Table ronde PÉPITE + étudiants entrepreneurs',
      content: 'Table ronde interactive en partenariat PÉPITE. Témoignages d’étudiants-entrepreneurs présentation des avantages du Statut National d’Étudiant-Entrepreneur (SNEE), des aides disponibles, et session de Questions/Réponses',
      color: '#8B5CF6',
      tasks: [
        { id: 'gea-conf-1', weekLabel: 'S48', category: 'Partenaires & Sponsors', action: 'Prise de contact avec les référents PÉPITE et intervenants', assignee: 'Nora RIVET', status: 'todo' },
        { id: 'gea-conf-2', weekLabel: 'S49', category: 'Partenaires & Sponsors', action: 'Cadrage des thématiques et des témoignages d’étudiants', assignee: 'David MEIRA', status: 'todo' },
        { id: 'gea-conf-3', weekLabel: 'S50', category: 'Logistique & Sécurité', action: 'Réservation amphi et matériel audiovisuel (micros, vidéo)', assignee: 'Alexandre VARIERAS', status: 'todo' },
        { id: 'gea-conf-4', weekLabel: 'S51', category: 'Communication & Médias', action: 'Diffusion des affiches et campagne réseaux sociaux', assignee: 'Nolann MAZEAU', status: 'todo' },
        { id: 'gea-conf-5', weekLabel: 'S01 (07 janv.)', category: 'Activité / Jour J', action: 'Conférence PÉPITE & Étudiants Entrepreneurs – 7 janvier 2027', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 'gea-conf-6', weekLabel: 'S01', category: 'Événements & Animations', action: 'Session Questions/Réponses et cocktail networking', assignee: 'Toute l’équipe', status: 'todo' },
        { id: 'gea-conf-7', weekLabel: 'S02', category: 'Post-événement', action: 'Remerciements intervenants et synthèse écrite', assignee: 'Paul De SEZE', status: 'todo' }
      ]
    },
    {
      id: 'gea-event-4',
      title: 'Dîner entreprenariale',
      date: '11-mars-27',
      objective: 'Dîner avec des entrepreneurs, des anciens élèves (partenariat avec galumni) + aide de Pépite',
      content: 'Un moment convivial autour d’un dîner, dédié au partage d’expériences professionnelles, permettant d’échanger avec différents professionnels, de découvrir de nouveaux parcours et secteurs d’activité, d’élargir son réseau, de partager des conseils et de rencontrer de nouvelles personnes afin de créer de potentielles opportunités professionnelles.',
      color: '#F59E0B',
      tasks: [
        { id: 'gea-din-1', weekLabel: 'S04', category: 'Partenaires & Sponsors', action: 'Partenariat avec galumni et coordination avec Pépite', assignee: 'Nora RIVET', status: 'todo' },
        { id: 'gea-din-2', weekLabel: 'S05', category: 'Logistique & Sécurité', action: 'Recherche de salle et devis traiteur pour le dîner', assignee: 'Alexandre VARIERAS', status: 'todo' },
        { id: 'gea-din-3', weekLabel: 'S06', category: 'Partenaires & Sponsors', action: 'Envoi des invitations aux entrepreneurs et confirmation intervenants', assignee: 'David MEIRA', status: 'todo' },
        { id: 'gea-din-4', weekLabel: 'S07', category: 'Communication & Médias', action: 'Ouverture des inscriptions étudiants et communication', assignee: 'Nolann MAZEAU', status: 'todo' },
        { id: 'gea-din-5', weekLabel: 'S09', category: 'Logistique & Sécurité', action: 'Clôture inscriptions et finalisation plan de table', assignee: 'Laurine COGHE', status: 'todo' },
        { id: 'gea-din-6', weekLabel: 'S10 (11 mars)', category: 'Activité / Jour J', action: 'Grand Dîner Entrepreneurial – Jeudi 11 mars 2027', assignee: 'Toute l’équipe', status: 'event', isEventHighlight: true },
        { id: 'gea-din-7', weekLabel: 'S11', category: 'Post-événement', action: 'Album photo, remerciements et débriefing général', assignee: 'Paul De SEZE', status: 'todo' }
      ]
    }
  ]
};
