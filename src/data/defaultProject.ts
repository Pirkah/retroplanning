import { Project, DEFAULT_TEAM_MEMBERS } from '../types/planning';
import { addDays, format, startOfISOWeek } from 'date-fns';

const baseMonday = startOfISOWeek(new Date());
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export const DEFAULT_PROJECT: Project = {
  id: 'proj-demo-1',
  name: 'Lancement Produit & Rétroplanning Équipe',
  description: 'Rétroplanning collaboratif par semaines avec diagramme de Gantt en cascade et synchronisation temps réel.',
  createdAt: new Date().toISOString(),
  members: DEFAULT_TEAM_MEMBERS,
  tasks: [
    {
      id: 'task-1',
      title: 'Cadrage stratégique & objectifs opérationnels',
      description: 'Définition des livrables clés, KPIs et enveloppe budgétaire.',
      startDate: fmt(baseMonday),
      endDate: fmt(addDays(baseMonday, 6)), // Semaine 1
      color: '#6366F1', // Indigo
      status: 'completed',
      priority: 'high',
      progress: 100,
      category: 'Stratégie',
      assignee: 'Julien',
      assigneeId: 'm-1'
    },
    {
      id: 'task-2',
      title: 'Design maquettes & prototypes UI / UX',
      description: 'Wireframes, charte graphique et validation de l’expérience utilisateur.',
      startDate: fmt(addDays(baseMonday, 7)),
      endDate: fmt(addDays(baseMonday, 20)), // Semaines 2 à 3
      color: '#F43F5E', // Rose
      status: 'in_progress',
      priority: 'high',
      progress: 55,
      category: 'Design',
      assignee: 'Alice',
      assigneeId: 'm-4'
    },
    {
      id: 'task-3',
      title: 'Rédaction contenus éditoriaux & FAQ',
      description: 'Rédaction des argumentaires, articles de blog et documentation.',
      startDate: fmt(addDays(baseMonday, 14)),
      endDate: fmt(addDays(baseMonday, 27)), // Semaines 3 à 4
      color: '#10B981', // Emerald
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Marketing',
      assignee: 'Camille',
      assigneeId: 'm-3'
    },
    {
      id: 'task-4',
      title: 'Développement Frontend & connecteurs API',
      description: 'Intégration des interfaces réactives et flux de données.',
      startDate: fmt(addDays(baseMonday, 21)),
      endDate: fmt(addDays(baseMonday, 41)), // Semaines 4 à 6
      color: '#3B82F6', // Blue
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Dév',
      assignee: 'Thomas',
      assigneeId: 'm-2'
    },
    {
      id: 'task-5',
      title: 'Jalon : Recette & Validation Bêta',
      description: 'Tests utilisateurs finaux et levée des réserves techniques.',
      startDate: fmt(addDays(baseMonday, 42)),
      endDate: fmt(addDays(baseMonday, 42)), // Fin semaine 6
      color: '#F59E0B', // Amber
      status: 'todo',
      priority: 'high',
      progress: 0,
      category: 'Jalon',
      assignee: 'Julien',
      assigneeId: 'm-1',
      isMilestone: true
    },
    {
      id: 'task-6',
      title: 'Campagne de lancement & Réseaux Sociaux',
      description: 'Déploiement du teasing, communication presse et ads.',
      startDate: fmt(addDays(baseMonday, 42)),
      endDate: fmt(addDays(baseMonday, 55)), // Semaines 7 à 8
      color: '#8B5CF6', // Purple
      status: 'todo',
      priority: 'medium',
      progress: 0,
      category: 'Marketing',
      assignee: 'Camille',
      assigneeId: 'm-3'
    }
  ]
};
