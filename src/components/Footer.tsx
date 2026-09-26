import React, { useState } from 'react';
import { Github, ExternalLink, Code2, Heart, X as CloseIcon, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const githubUrl = 'https://github.com/Pirkah';
  const xUrl = 'https://x.com/Pirkah';

  return (
    <footer className="mt-auto border-t border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs py-3 px-6 shadow-2xs">
      <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Info Équipe Run & Fun */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <span className="font-bold text-slate-700 dark:text-slate-300">Run & Fun 2026 - 2027</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-[11px]">Espace collaboratif officiel</span>
          <Heart size={11} className="text-rose-500 fill-rose-500 inline" />
        </div>

        {/* Espace discret développeur Pirkah */}
        <div className="relative flex items-center gap-3">
          <button
            onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
            className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            title="Contacts développeur & réseaux"
          >
            <Code2 size={12} className="text-slate-400 group-hover:text-indigo-500" />
            <span>Dev : Julien Nicolle</span>
          </button>

          {/* Popover discret de contact dev */}
          {isDevMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles size={13} className="text-indigo-500" />
                  <span>Contacts Développeur</span>
                </div>
                <button
                  onClick={() => setIsDevMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                >
                  <CloseIcon size={13} />
                </button>
              </div>

              <div className="pt-2.5 space-y-2 text-xs">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Conçu & développé par <strong>Julien Nicolle</strong> (@Pirkah) pour l'association Run & Fun.
                </p>

                <div className="pt-1 flex flex-col gap-1.5">
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2">
                      <Github size={14} className="text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                      <span>GitHub</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-0.5">
                      @Pirkah <ExternalLink size={9} />
                    </span>
                  </a>

                  <a
                    href={xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3.5 h-3.5 fill-current text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>𝕏 (Twitter)</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-0.5">
                      @Pirkah <ExternalLink size={9} />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
