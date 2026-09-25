// Référentiel officiel et unifié des catégories pour le Gantt et le Rétroplanning

export interface CategoryDefinition {
  id: string;
  label: string;
  description: string;
  color: string;       // Code hex officiel pour les barres de Gantt et blocs Rétroplanning
  textColor: string;   // Couleur du texte pour contraste
  bgBadge: string;     // Classes Tailwind badge
  textBadge: string;
  borderBadge: string;
  blockColor: string;  // Alias pour rétroplanning
}

export const STANDARD_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'administratif',
    label: 'Administratif & Juridique',
    description: 'Statuts, préfecture, mairie, autorisations et assurances',
    color: '#6366F1', // Indigo
    textColor: '#FFFFFF',
    bgBadge: 'bg-indigo-100',
    textBadge: 'text-indigo-800',
    borderBadge: 'border-indigo-300',
    blockColor: '#6366F1'
  },
  {
    id: 'communication',
    label: 'Communication & Médias',
    description: 'Affiches, vidéo, TikTok, Strava, site internet et réseaux sociaux',
    color: '#10B981', // Émeraude / Vert
    textColor: '#FFFFFF',
    bgBadge: 'bg-emerald-100',
    textBadge: 'text-emerald-800',
    borderBadge: 'border-emerald-300',
    blockColor: '#10B981'
  },
  {
    id: 'logistique',
    label: 'Logistique & Sécurité',
    description: 'Réservation de salles, balisage, secours (Croix-Rouge), bénévoles',
    color: '#3B82F6', // Bleu Océan
    textColor: '#FFFFFF',
    bgBadge: 'bg-sky-100',
    textBadge: 'text-sky-800',
    borderBadge: 'border-sky-300',
    blockColor: '#3B82F6'
  },
  {
    id: 'partenaires',
    label: 'Partenaires & Sponsors',
    description: 'Contacts mécènes, sponsors locaux, BDE partenaires, dons, associations',
    color: '#F59E0B', // Ambre / Or
    textColor: '#FFFFFF',
    bgBadge: 'bg-amber-100',
    textBadge: 'text-amber-800',
    borderBadge: 'border-amber-300',
    blockColor: '#F59E0B'
  },
  {
    id: 'finance',
    label: 'Finance & Trésorerie',
    description: 'Banque, compte, TPE, budget prévisionnel et subventions',
    color: '#06B6D4', // Cyan
    textColor: '#FFFFFF',
    bgBadge: 'bg-cyan-100',
    textBadge: 'text-cyan-800',
    borderBadge: 'border-cyan-300',
    blockColor: '#06B6D4'
  },
  {
    id: 'fournisseurs',
    label: 'Fournisseurs & Commandes',
    description: 'T-shirts (DPB), devis, ravitaillement, matériel et prestataires',
    color: '#14B8A6', // Sarcelle / Teal
    textColor: '#FFFFFF',
    bgBadge: 'bg-teal-100',
    textBadge: 'text-teal-800',
    borderBadge: 'border-teal-300',
    blockColor: '#14B8A6'
  },
  {
    id: 'activite',
    label: 'Activité / Jour J',
    description: 'Événement principal, remise de chèque, course solidaire',
    color: '#EF4444', // Rouge vif
    textColor: '#FFFFFF',
    bgBadge: 'bg-red-100',
    textBadge: 'text-red-800',
    borderBadge: 'border-red-300',
    blockColor: '#EF4444'
  },
  {
    id: 'evenement',
    label: 'Événements & Animations',
    description: 'Animation sur place, accueil, gestion des stands, buvette',
    color: '#F43F5E', // Rose corail
    textColor: '#FFFFFF',
    bgBadge: 'bg-rose-100',
    textBadge: 'text-rose-800',
    borderBadge: 'border-rose-300',
    blockColor: '#F43F5E'
  },
  {
    id: 'post_evenement',
    label: 'Post-événement',
    description: 'Bilan, questionnaire, remerciements et débriefing',
    color: '#F97316', // Orange
    textColor: '#FFFFFF',
    bgBadge: 'bg-orange-100',
    textBadge: 'text-orange-900',
    borderBadge: 'border-orange-300',
    blockColor: '#F97316'
  },
  {
    id: 'preparation',
    label: 'Préparation & Cadrage',
    description: 'Conception initiale, cadrage, réunions internes et planning',
    color: '#EC4899', // Rose Fuchsia
    textColor: '#FFFFFF',
    bgBadge: 'bg-pink-100',
    textBadge: 'text-pink-800',
    borderBadge: 'border-pink-300',
    blockColor: '#EC4899'
  }
];

// Alias pour compatibilité rétroplanning existant
export const RETRO_CATEGORIES = STANDARD_CATEGORIES;

const FALLBACK_PALETTE = [
  '#8B5CF6', // Violet
  '#D946EF', // Fuchsia
  '#64748B', // Ardoise
  '#0284C7', // Bleu ciel
  '#84CC16', // Lime
  '#E11D48', // Rubis
  '#A855F7', // Pourpre
  '#0D9488'  // Vert sarcelle
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Normalise une chaîne pour comparaison insensible aux accents et caractères spéciaux
 */
export function normalizeCategoryName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Trouve la définition officielle pour un nom de catégorie (avec gestion intelligente des synonymes)
 */
export function getCategoryDefinition(categoryName: string): CategoryDefinition {
  if (!categoryName || !categoryName.trim()) {
    return STANDARD_CATEGORIES[0]; // Défaut Administratif
  }

  const raw = categoryName.trim();
  const norm = normalizeCategoryName(raw);

  // 1. Recherche directe par label exact ou ID
  const directMatch = STANDARD_CATEGORIES.find(
    (c) =>
      c.id === norm ||
      normalizeCategoryName(c.label) === norm ||
      c.label.toLowerCase() === raw.toLowerCase()
  );
  if (directMatch) return directMatch;

  // 2. Recherche par mots-clés sémantiques (synonymes récurrents)
  if (
    norm.includes('admin') ||
    norm.includes('jurid') ||
    norm.includes('prefect') ||
    norm.includes('statut') ||
    norm.includes('ag') ||
    norm.includes('bureau') ||
    norm.includes('mairie') ||
    norm.includes('autoris')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'administratif')!;
  }

  if (
    norm.includes('comm') ||
    norm.includes('media') ||
    norm.includes('reseau') ||
    norm.includes('tiktok') ||
    norm.includes('strava') ||
    norm.includes('site') ||
    norm.includes('web') ||
    norm.includes('infor') ||
    norm.includes('affiche') ||
    norm.includes('video')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'communication')!;
  }

  if (
    norm.includes('logist') ||
    norm.includes('secur') ||
    norm.includes('salle') ||
    norm.includes('balis') ||
    norm.includes('secour') ||
    norm.includes('croixrouge') ||
    norm.includes('benevol')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'logistique')!;
  }

  if (
    norm.includes('parten') ||
    norm.includes('sponsor') ||
    norm.includes('mecen') ||
    norm.includes('bde') ||
    norm.includes('interven') ||
    norm.includes('gravir') ||
    norm.includes('assoc')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'partenaires')!;
  }

  if (
    norm.includes('finan') ||
    norm.includes('tresor') ||
    norm.includes('banq') ||
    norm.includes('compte') ||
    norm.includes('tpe') ||
    norm.includes('subvent') ||
    norm.includes('budget')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'finance')!;
  }

  if (
    norm.includes('fourn') ||
    norm.includes('tshirt') ||
    norm.includes('dpb') ||
    norm.includes('command') ||
    norm.includes('matos') ||
    norm.includes('materiel') ||
    norm.includes('cheque')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'fournisseurs')!;
  }

  if (
    norm.includes('activ') ||
    norm.includes('jourj') ||
    norm.includes('course') ||
    norm.includes('billett') ||
    norm.includes('dossard')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'activite')!;
  }

  if (
    norm.includes('even') ||
    norm.includes('anim') ||
    norm.includes('buvette') ||
    norm.includes('stand')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'evenement')!;
  }

  if (
    norm.includes('post') ||
    norm.includes('bilan') ||
    norm.includes('debrief') ||
    norm.includes('sondage') ||
    norm.includes('remercie')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'post_evenement')!;
  }

  if (
    norm.includes('prep') ||
    norm.includes('cadre') ||
    norm.includes('concep') ||
    norm.includes('brainstorm')
  ) {
    return STANDARD_CATEGORIES.find((c) => c.id === 'preparation')!;
  }

  // 3. Catégorie personnalisée créée par l'utilisateur : attribution d'une couleur déterministe
  const assignedColor = FALLBACK_PALETTE[hashString(raw) % FALLBACK_PALETTE.length];
  return {
    id: norm,
    label: raw,
    description: `Catégorie personnalisée : ${raw}`,
    color: assignedColor,
    textColor: '#FFFFFF',
    bgBadge: 'bg-slate-100',
    textBadge: 'text-slate-800',
    borderBadge: 'border-slate-300',
    blockColor: assignedColor
  };
}

/**
 * Retourne directement la couleur hex d'une catégorie
 */
export function getCategoryColor(categoryName: string): string {
  return getCategoryDefinition(categoryName).color;
}

/**
 * Style compatible avec RetroplanningView
 */
export function getCategoryStyle(categoryName: string): CategoryDefinition {
  return getCategoryDefinition(categoryName);
}

/**
 * Extrait toutes les catégories existantes du projet (standard + personnalisées déjà utilisées)
 */
export function getAvailableCategories(
  existingTasks: { category?: string }[] = [],
  existingEvents: { tasks?: { category?: string }[] }[] = []
): { label: string; color: string; definition: CategoryDefinition }[] {
  const map = new Map<string, { label: string; color: string; definition: CategoryDefinition }>();

  // Ajoute toutes les catégories standard
  STANDARD_CATEGORIES.forEach((cat) => {
    map.set(cat.label.toLowerCase(), {
      label: cat.label,
      color: cat.color,
      definition: cat
    });
  });

  // Collecte les catégories existantes dans les tâches
  existingTasks.forEach((t) => {
    if (t.category && t.category.trim()) {
      const def = getCategoryDefinition(t.category);
      if (!map.has(def.label.toLowerCase())) {
        map.set(def.label.toLowerCase(), {
          label: def.label,
          color: def.color,
          definition: def
        });
      }
    }
  });

  // Collecte les catégories existantes dans les événements
  existingEvents.forEach((e) => {
    e.tasks?.forEach((t) => {
      if (t.category && t.category.trim()) {
        const def = getCategoryDefinition(t.category);
        if (!map.has(def.label.toLowerCase())) {
          map.set(def.label.toLowerCase(), {
            label: def.label,
            color: def.color,
            definition: def
          });
        }
      }
    });
  });

  return Array.from(map.values());
}
