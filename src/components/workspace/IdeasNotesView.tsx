import React, { useState, useMemo } from 'react';
import { usePlanning } from '../../context/PlanningContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { IdeaCategory, IdeaStatus, IdeaItem } from '../../types/workspace';
import {
  Lightbulb,
  Plus,
  Search,
  Heart,
  Tag,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  Sparkles,
  X,
  Check,
  TrendingUp,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';

const CATEGORIES: IdeaCategory[] = [
  'Course & Parcours',
  'Animations & Soirées',
  'Partenaires & Sponsors',
  'Communication & Réseaux',
  'Logistique & Buvette',
  'Général & Idées Vrac'
];

const STATUS_LABELS: Record<IdeaStatus, { label: string; bg: string; text: string; icon: any }> = {
  idea: { label: 'En boîte', bg: 'bg-amber-100', text: 'text-amber-800', icon: Lightbulb },
  in_review: { label: 'En discussion', bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
  approved: { label: 'Validée', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle2 },
  implemented: { label: 'Réalisée', bg: 'bg-purple-100', text: 'text-purple-800', icon: Sparkles }
};

export const IdeasNotesView: React.FC = () => {
  const { isAuthorized, openAuthModal, currentUser } = usePlanning();
  const { ideas, addIdea, toggleLikeIdea, updateIdeaStatus, deleteIdea } = useWorkspace();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal d'ajout d'idée
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('Course & Parcours');
  const [tagsInput, setTagsInput] = useState('');

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (selectedCategory !== 'all' && idea.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && idea.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(q);
        const matchesContent = idea.content.toLowerCase().includes(q);
        const matchesAuthor = idea.authorName.toLowerCase().includes(q);
        const matchesTags = idea.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesTags) return false;
      }
      return true;
    });
  }, [ideas, selectedCategory, selectedStatus, searchQuery]);

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    addIdea({
      title: title.trim(),
      content: content.trim(),
      category,
      tags
    });

    setTitle('');
    setContent('');
    setCategory('Course & Parcours');
    setTagsInput('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-7xl mx-auto w-full">
      {/* 1. En-tête de la Boîte à Idées */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <Lightbulb size={13} className="text-amber-600 dark:text-amber-400" />
            <span>Boîte à Idées & Brainstorming</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Idées, Notes & Propositions R&F
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Un espace carré et intuitif pour noter vos suggestions de parcours, animations étudiantes, goodies, mécénat et voter pour les meilleures initiatives.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthorized) {
              openAuthModal();
            } else {
              setIsModalOpen(true);
            }
          }}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-amber-100 dark:shadow-none transition flex items-center justify-center gap-2 shrink-0 group"
        >
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
          <span>Proposer une nouvelle idée</span>
        </button>
      </div>

      {/* 2. Filtres, Recherche & Catégories */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
        {/* Ligne Catégories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-amber-500 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            Toutes les catégories ({ideas.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = ideas.filter((i) => i.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ligne Statuts & Recherche */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">Statut :</span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tous
            </button>
            {(Object.keys(STATUS_LABELS) as IdeaStatus[]).map((st) => {
              const info = STATUS_LABELS[st];
              const isSelected = selectedStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher une idée, un mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 3. Grille des Idées */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lightbulb size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Aucune idée trouvée</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Aucune proposition ne correspond à vos filtres actuels. Modifiez votre recherche ou proposez la première idée !
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-amber-600 transition"
          >
            Déposer une idée
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => {
            const statusConfig = STATUS_LABELS[idea.status];
            const StatusIcon = statusConfig.icon;
            const hasLiked = idea.likedBy?.includes(currentUser?.name || 'Moi');

            return (
              <div
                key={idea.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group"
              >
                {/* En-tête de la carte */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60 truncate">
                      {idea.category}
                    </span>

                    {/* Statut sélecteur ou badge */}
                    {isAuthorized ? (
                      <select
                        value={idea.status}
                        onChange={(e) => updateIdeaStatus(idea.id, e.target.value as IdeaStatus)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer outline-none ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        <option value="idea">💡 En boîte</option>
                        <option value="in_review">🔍 En discussion</option>
                        <option value="approved">✅ Validée</option>
                        <option value="implemented">🚀 Réalisée</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon size={10} />
                        <span>{statusConfig.label}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {idea.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {idea.content}
                  </p>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {idea.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                        >
                          <Tag size={9} className="text-slate-400 dark:text-slate-500" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bas de carte : Auteur, Date & Vote */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: idea.authorColor || '#3B82F6' }}
                    >
                      {idea.authorInitials || 'RF'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {idea.authorName}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">
                        {new Date(idea.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bouton voter / aimer */}
                    <button
                      onClick={() => toggleLikeIdea(idea.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                        hasLiked
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={hasLiked ? 'Vous aimez cette idée' : 'Voter pour cette idée'}
                    >
                      <Heart size={13} fill={hasLiked ? 'currentColor' : 'none'} className={hasLiked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'} />
                      <span>{idea.likes}</span>
                    </button>

                    {/* Bouton supprimer (si autorisé) */}
                    {isAuthorized && (
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer l'idée "${idea.title}" ?`)) {
                            deleteIdea(idea.id);
                          }
                        }}
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                        title="Supprimer cette idée"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODALE DE PROPOSITION D'IDÉE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Proposer une idée pour l’équipe</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ajoutée au tableau collaboratif Run & Fun</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Titre de l'idée *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Stands crêpes & bar à smoothies au ravitaillement..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Description & arguments *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Expliquez l'idée, les bénéfices pour les coureurs, le public ou les sponsors, et comment la mettre en place..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tags ou mots-clés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Goodies, Finisher, Ravitaillement"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 dark:shadow-none transition flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Publier l’idée</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
