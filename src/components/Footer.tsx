import React from 'react';
import { Github, ExternalLink, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const githubUrl = 'https://github.com/Pirkah';
  const xUrl = 'https://x.com/Pirkah';

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-white/80 backdrop-blur-md py-4 px-6 shadow-xs">
      <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Présentation / Auteur */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-200 shrink-0">
            <Sparkles size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-800 font-bold">
              <span>Créé par Julien</span>
              <span className="text-indigo-600 font-extrabold">(@Pirkah)</span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline font-normal text-slate-500">
                Outils web, bots d'automatisation & gestion de projet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <span>Fait avec passion pour le projet Run & Fun</span>
              <Heart size={11} className="text-rose-500 fill-rose-500" />
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                v3.3 (Interface Épurée & Sobre)
              </span>
            </p>
          </div>
        </div>

        {/* Liens Réseaux Sociaux : X & GitHub */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {/* Bouton GitHub */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all duration-150 transform hover:-translate-y-0.5"
            title="Consulter mon profil GitHub @Pirkah"
          >
            <Github size={16} className="text-slate-200 group-hover:scale-110 transition-transform" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-slate-400 font-medium">Découvrir sur</div>
              <div className="font-bold text-slate-100 flex items-center gap-1">
                <span>GitHub</span>
                <span className="text-[10px] text-indigo-400">@Pirkah</span>
                <ExternalLink size={11} className="text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </a>

          {/* Bouton X (Twitter) */}
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-3.5 py-2 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all duration-150 transform hover:-translate-y-0.5 border border-neutral-800"
            title="Suivre mes actualités sur X @Pirkah"
          >
            {/* Logo officiel 𝕏 SVG */}
            <svg
              className="w-4 h-4 fill-white group-hover:scale-110 transition-transform shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <div className="text-left leading-tight">
              <div className="text-[10px] text-neutral-400 font-medium">Me suivre sur</div>
              <div className="font-bold text-white flex items-center gap-1">
                <span>𝕏</span>
                <span className="text-[10px] text-indigo-400">@Pirkah</span>
                <ExternalLink size={11} className="text-neutral-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};
