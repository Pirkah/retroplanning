import * as XLSX from 'xlsx';
import { RetroplanningEvent, RetroplanningTask, TeamMember } from '../types/planning';
import {
  sortRetroEventsChronologically,
  sortRetroTasksChronologically,
  sortRetroWeekLabelsChronologically
} from './scheduler';
import { RETRO_CATEGORIES } from './categories';

export interface ExportExcelRetroplanningOptions {
  projectName: string;
  events: RetroplanningEvent[];
  members?: TeamMember[];
}

/**
 * Nettoie et formate un nom d'onglet pour respecter les contraintes strictes d'Excel :
 * - Max 31 caractères
 * - Aucun caractère interdit : \ / ? * [ ] :
 */
function sanitizeExcelSheetName(name: string, index: number, usedNames: Set<string>): string {
  const prefix = `${index + 1}. `;
  const cleanTitle = name.replace(/[\\/?*[\]:]/g, ' ').trim();
  const maxTitleLen = 31 - prefix.length;
  let finalName = (prefix + cleanTitle).substring(0, 31).trim();

  let counter = 2;
  while (usedNames.has(finalName.toLowerCase())) {
    finalName = (prefix + cleanTitle).substring(0, 26) + ` (${counter++})`;
  }
  usedNames.add(finalName.toLowerCase());
  return finalName;
}

/**
 * Exporte l'intégralité du rétroplanning dans un classeur Excel (.xlsx) structuré :
 * - Première feuille : Tableau récapitulatif & vue d'ensemble de tous les événements
 * - Feuilles suivantes : Une feuille dédiée par événement avec sa grille chronologique détaillée
 */
export async function exportRetroplanningToExcel(options: ExportExcelRetroplanningOptions): Promise<void> {
  const { projectName, events } = options;
  const sortedEvents = sortRetroEventsChronologically(events || []);

  // Création du classeur Excel
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  // Dictionnaire associant chaque événement au nom de son onglet dédié
  const eventSheetNameMap = new Map<string, string>();
  sortedEvents.forEach((evt, idx) => {
    const sheetName = sanitizeExcelSheetName(evt.title, idx, usedSheetNames);
    eventSheetNameMap.set(evt.id, sheetName);
  });

  /* ========================================================================= */
  /* FEUILLE 1 : VUE D'ENSEMBLE & RÉCAPITULATIF DES ÉVÉNEMENTS                  */
  /* ========================================================================= */
  const recapRows: any[][] = [];

  // En-tête officiel
  recapRows.push([`RÉTRO-PLANNING OFFICIEL – ${projectName.toUpperCase()}`]);
  recapRows.push(['VUE D’ENSEMBLE & FEUILLE DE ROUTE DES ÉVÉNEMENTS (MÉTHODE PRÉVISIONNELLE BUT GEA)']);
  recapRows.push([
    `Date d'export : ${new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })} | Total Événements : ${sortedEvents.length}`
  ]);
  recapRows.push([]); // Ligne vide

  // Tableau récapitulatif
  recapRows.push([
    'N°',
    'Événement & Étape',
    'Date officielle',
    'Objectif Principal',
    'Contenu & Modalités',
    'Actions Préparatoires',
    'Actions Terminées',
    'Avancement (%)',
    'Onglet Dédié dans ce Classeur'
  ]);

  let totalProjectTasks = 0;
  let totalProjectCompleted = 0;

  sortedEvents.forEach((evt, idx) => {
    const totalTasks = evt.tasks.length;
    const completedTasks = evt.tasks.filter((t) => t.status === 'completed').length;
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const sheetName = eventSheetNameMap.get(evt.id) || `Événement ${idx + 1}`;

    totalProjectTasks += totalTasks;
    totalProjectCompleted += completedTasks;

    recapRows.push([
      idx + 1,
      evt.title,
      evt.date,
      evt.objective,
      evt.content,
      totalTasks,
      completedTasks,
      `${pct}%`,
      sheetName
    ]);
  });

  // Ligne de totalisation
  const overallPct = totalProjectTasks > 0 ? Math.round((totalProjectCompleted / totalProjectTasks) * 100) : 0;
  recapRows.push([
    'TOTAL',
    `${sortedEvents.length} Événements`,
    '',
    '',
    '',
    totalProjectTasks,
    totalProjectCompleted,
    `${overallPct}%`,
    ''
  ]);

  recapRows.push([]); // Ligne vide
  recapRows.push([]); // Ligne vide

  // Légende officielle des phases & catégories
  recapRows.push(['LÉGENDE OFFICIELLE DES PHASES & CATÉGORIES']);
  recapRows.push(['Catégorie / Phase', 'Description & Rôle']);
  RETRO_CATEGORIES.forEach((cat) => {
    recapRows.push([cat.label, cat.description]);
  });

  const recapSheet = XLSX.utils.aoa_to_sheet(recapRows);

  // Largeurs de colonnes de la feuille Récapitulatif
  recapSheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 36 }, // Événement
    { wch: 18 }, // Date
    { wch: 45 }, // Objectif
    { wch: 55 }, // Contenu
    { wch: 22 }, // Actions
    { wch: 20 }, // Terminées
    { wch: 16 }, // %
    { wch: 32 }  // Onglet
  ];

  XLSX.utils.book_append_sheet(workbook, recapSheet, 'Vue d’ensemble');

  /* ========================================================================= */
  /* FEUILLES SUIVANTES : UNE FEUILLE DÉDIÉE POUR CHAQUE ÉVÉNEMENT             */
  /* ========================================================================= */
  sortedEvents.forEach((evt, idx) => {
    const sheetName = eventSheetNameMap.get(evt.id) || `Événement ${idx + 1}`;
    const sortedTasks = sortRetroTasksChronologically(evt.tasks || []);

    // Liste unique et chronologique des semaines mentionnées dans cet événement
    const rawWeeks = sortedTasks.map((t) => t.weekLabel.trim()).filter(Boolean);
    const seenWeeks = new Set<string>();
    const uniqueWeeks: string[] = [];
    rawWeeks.forEach((w) => {
      if (!seenWeeks.has(w)) {
        seenWeeks.add(w);
        uniqueWeeks.push(w);
      }
    });
    const eventWeeks = sortRetroWeekLabelsChronologically(
      uniqueWeeks.length > 0 ? uniqueWeeks : ['S39', 'S40', 'S41', 'S42 (12 oct.)', 'S43']
    );

    const eventRows: any[][] = [];

    // En-tête de la feuille événement
    eventRows.push([`RÉTRO-PLANNING DÉTAILLÉ – ${evt.title.toUpperCase()}`]);
    eventRows.push([`Date de l'événement : ${evt.date} | Objectif principal : ${evt.objective}`]);
    eventRows.push([`Contenu & Modalités : ${evt.content}`]);
    eventRows.push([]); // Ligne vide

    // Ligne des en-têtes de colonnes
    const headers: string[] = ['Semaine', 'Catégorie', 'Action / Tâche'];
    eventWeeks.forEach((w) => headers.push(w));
    headers.push('Responsable');
    headers.push('Statut');
    headers.push('Type');
    eventRows.push(headers);

    // Lignes de données pour chaque action
    sortedTasks.forEach((task) => {
      const isEventRow = task.isEventHighlight || task.status === 'event';
      const statusLabel =
        task.status === 'completed'
          ? 'Fait'
          : task.status === 'in_progress'
          ? 'En cours'
          : isEventRow
          ? 'Événement'
          : 'À faire';

      const row: any[] = [
        task.weekLabel,
        task.category,
        task.action
      ];

      // Colonnes de timeline pour chaque semaine
      eventWeeks.forEach((w) => {
        const targetWeekKey = w.split(' ')[0].toUpperCase();
        const taskWeekKey = task.weekLabel.split(' ')[0].toUpperCase();
        const isMatched = task.weekLabel.trim() === w.trim() || taskWeekKey === targetWeekKey;

        if (isEventRow) {
          row.push('★ EVENT');
        } else if (isMatched) {
          row.push('■ ACTIF');
        } else {
          row.push('');
        }
      });

      row.push(task.assignee);
      row.push(statusLabel);
      row.push(isEventRow ? 'Jalon Événement' : 'Action préparatoire');

      eventRows.push(row);
    });

    const eventSheet = XLSX.utils.aoa_to_sheet(eventRows);

    // Largeurs de colonnes calculées
    const colWidths: { wch: number }[] = [
      { wch: 15 }, // Semaine
      { wch: 26 }, // Catégorie
      { wch: 60 }  // Action
    ];
    eventWeeks.forEach(() => colWidths.push({ wch: 13 })); // Colonnes semaines timeline
    colWidths.push({ wch: 22 }); // Responsable
    colWidths.push({ wch: 14 }); // Statut
    colWidths.push({ wch: 20 }); // Type

    eventSheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, eventSheet, sheetName);
  });

  /* ========================================================================= */
  /* GÉNÉRATION ET TÉLÉCHARGEMENT DU FICHIER .XLSX                             */
  /* ========================================================================= */
  const cleanProjName = projectName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const dateSuffix = new Date().toISOString().split('T')[0];
  const filename = `${cleanProjName}_retroplanning_complet_${dateSuffix}.xlsx`;

  try {
    XLSX.writeFile(workbook, filename);
  } catch {
    // Fallback navigateur avec Blob si writeFile est restreint
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const buffer = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
