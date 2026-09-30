import * as XLSXModule from 'xlsx-js-style';
import { RetroplanningEvent, TeamMember } from '../types/planning';
import {
  sortRetroEventsChronologically,
  sortRetroTasksChronologically,
  sortRetroWeekLabelsChronologically
} from './scheduler';
import { RETRO_CATEGORIES, getCategoryDefinition } from './categories';

// Résolution universelle du module xlsx-js-style pour Vite et Node
const XLSX: any = (XLSXModule as any).default || XLSXModule;

export interface ExportExcelRetroplanningOptions {
  projectName: string;
  events: RetroplanningEvent[];
  members?: TeamMember[];
}

/* ========================================================================= */
/* PALETTE DE COULEURS & STYLES OFFICIELS EXCEL                              */
/* ========================================================================= */

interface ExcelCategoryColor {
  solid: string;      // Couleur vive officielle pour les cellules Gantt actives
  softBg: string;     // Fond pastel doux pour les badges de catégories
  textDark: string;   // Texte sombre à fort contraste pour les badges
}

// Couleurs harmonisées avec l'application web
const CATEGORY_STYLE_MAP: Record<string, ExcelCategoryColor> = {
  administratif:  { solid: '6366F1', softBg: 'EEF2FF', textDark: '4338CA' }, // Indigo
  communication:  { solid: '10B981', softBg: 'ECFDF5', textDark: '065F46' }, // Émeraude / Vert
  logistique:     { solid: '3B82F6', softBg: 'EFF6FF', textDark: '1D4ED8' }, // Bleu Océan
  partenaires:    { solid: 'F59E0B', softBg: 'FFFBEB', textDark: 'B45309' }, // Ambre / Or
  finance:        { solid: '06B6D4', softBg: 'ECFEFF', textDark: '0E7490' }, // Cyan
  fournisseurs:   { solid: '14B8A6', softBg: 'F0FDFA', textDark: '0F766E' }, // Sarcelle / Teal
  activite:       { solid: 'EF4444', softBg: 'FEF2F2', textDark: 'B91C1C' }, // Rouge vif
  evenement:      { solid: 'F43F5E', softBg: 'FFF1F2', textDark: 'BE123C' }, // Rose / Corail
  post_evenement: { solid: 'F97316', softBg: 'FFF7ED', textDark: 'C2410C' }, // Orange
  preparation:    { solid: 'EC4899', softBg: 'FDF2F8', textDark: 'BE185D' }  // Fuchsia
};

/**
 * Récupère le triplet de couleurs Excel (solid, softBg, textDark) d'une catégorie
 */
function getExcelCategoryStyle(categoryName: string): ExcelCategoryColor {
  const def = getCategoryDefinition(categoryName);
  if (CATEGORY_STYLE_MAP[def.id]) {
    return CATEGORY_STYLE_MAP[def.id];
  }
  const cleanHex = (def.color || '#6366F1').replace(/^#/, '').toUpperCase();
  return {
    solid: cleanHex,
    softBg: 'F1F5F9',
    textDark: '1E293B'
  };
}

/* ========================================================================= */
/* DÉFINITIONS DES BORDURES ET DÉLIMITATIONS NETTES                          */
/* ========================================================================= */

const borderThin = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } }
};

const borderSubtle = {
  top: { style: 'thin', color: { rgb: 'E2E8F0' } },
  bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
  left: { style: 'thin', color: { rgb: 'E2E8F0' } },
  right: { style: 'thin', color: { rgb: 'E2E8F0' } }
};

const borderHeader = {
  top: { style: 'thin', color: { rgb: '334155' } },
  bottom: { style: 'medium', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: '334155' } },
  right: { style: 'thin', color: { rgb: '334155' } }
};

const borderTotal = {
  top: { style: 'thin', color: { rgb: '94A3B8' } },
  bottom: { style: 'double', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: '94A3B8' } },
  right: { style: 'thin', color: { rgb: '94A3B8' } }
};

/* ========================================================================= */
/* OUTILS DE FORMATAGE ET STYLISATION CELLULE PAR CELLULE                     */
/* ========================================================================= */

function ensureCell(ws: any, r: number, c: number) {
  const address = XLSX.utils.encode_cell({ r, c });
  if (!ws[address]) {
    ws[address] = { t: 's', v: '' };
  }
  return ws[address];
}

function styleCell(ws: any, r: number, c: number, style: any, value?: any, type?: string) {
  const cell = ensureCell(ws, r, c);
  if (value !== undefined) {
    cell.v = value;
    if (type) {
      cell.t = type;
    } else if (typeof value === 'number') {
      cell.t = 'n';
    } else {
      cell.t = 's';
    }
  }
  cell.s = style;
  return cell;
}

/**
 * Fusionne une plage rectangulaire ET applique le style sur l'intégralité des cellules
 * fusionnées afin qu'Excel n'affiche aucun carré blanc de décalage dans les bannières.
 */
function mergeAndStyleRange(
  ws: any,
  startR: number,
  startC: number,
  endR: number,
  endC: number,
  style: any,
  value?: any
) {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: startR, c: startC }, e: { r: endR, c: endC } });

  for (let r = startR; r <= endR; r++) {
    for (let c = startC; c <= endC; c++) {
      const isTopLeft = r === startR && c === startC;
      styleCell(ws, r, c, style, isTopLeft ? value : undefined);
    }
  }
}

/**
 * Nettoie et formate un nom d'onglet pour respecter les contraintes strictes d'Excel :
 * - Max 31 caractères
 * - Aucun caractère interdit : \ / ? * [ ] :
 */
function sanitizeExcelSheetName(name: string, index: number, usedNames: Set<string>): string {
  const prefix = `${index + 1}. `;
  const cleanTitle = name.replace(/[\\/?*[\]:]/g, ' ').trim();
  let finalName = (prefix + cleanTitle).substring(0, 31).trim();

  let counter = 2;
  while (usedNames.has(finalName.toLowerCase())) {
    finalName = (prefix + cleanTitle).substring(0, 26) + ` (${counter++})`;
  }
  usedNames.add(finalName.toLowerCase());
  return finalName;
}

/**
 * Exporte l'intégralité du rétroplanning dans un classeur Excel (.xlsx) stylisé et premium :
 * - Première feuille : Tableau récapitulatif & vue d'ensemble avec métriques, badges et légende officielle
 * - Feuilles suivantes : Une feuille dédiée par événement avec sa grille chronologique détaillée & frise Gantt
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

  const exportDateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  /* ========================================================================= */
  /* FEUILLE 1 : VUE D'ENSEMBLE & RÉCAPITULATIF DES ÉVÉNEMENTS                  */
  /* ========================================================================= */
  const recapWs: any = {};
  recapWs['!merges'] = [];
  recapWs['!views'] = [{ showGridLines: true }];
  const recapRowHeights: { hpt: number }[] = [];

  const totalColsRecap = 9; // Colonnes A à I (0 à 8)

  // Ligne 0 : Grand Titre Bleu Marine
  mergeAndStyleRange(
    recapWs,
    0, 0, 0, totalColsRecap - 1,
    {
      font: { name: 'Calibri', sz: 15, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '0F2756' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    `RÉTRO-PLANNING STRATÉGIQUE – ${projectName.toUpperCase()}`
  );
  recapRowHeights.push({ hpt: 38 });

  // Ligne 1 : Sous-titre bleu ciel
  mergeAndStyleRange(
    recapWs,
    1, 0, 1, totalColsRecap - 1,
    {
      font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '1E3A8A' } },
      fill: { fgColor: { rgb: 'DBEAFE' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    'VUE D’ENSEMBLE & FEUILLE DE ROUTE OPÉRATIONNELLE (MÉTHODE PRÉVISIONNELLE BUT GEA)'
  );
  recapRowHeights.push({ hpt: 24 });

  // Ligne 2 : Métadonnées et statistiques globales
  let totalProjectTasks = 0;
  let totalProjectCompleted = 0;
  sortedEvents.forEach((evt) => {
    totalProjectTasks += evt.tasks.length;
    totalProjectCompleted += evt.tasks.filter((t) => t.status === 'completed').length;
  });
  const overallPct = totalProjectTasks > 0 ? Math.round((totalProjectCompleted / totalProjectTasks) * 100) : 0;

  mergeAndStyleRange(
    recapWs,
    2, 0, 2, totalColsRecap - 1,
    {
      font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '475569' } },
      fill: { fgColor: { rgb: 'F8FAFC' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    `Export du ${exportDateStr}  |  ${sortedEvents.length} Événements programmés  |  ${totalProjectTasks} Actions au total (${overallPct}% achevé)`
  );
  recapRowHeights.push({ hpt: 20 });

  // Ligne 3 : Séparateur vide
  for (let c = 0; c < totalColsRecap; c++) {
    styleCell(recapWs, 3, c, { fill: { fgColor: { rgb: 'FFFFFF' } } }, '');
  }
  recapRowHeights.push({ hpt: 12 });

  // Ligne 4 : En-têtes du tableau récapitulatif (Ambre Chaud / Or)
  const recapHeaders = [
    'N°',
    'Événement & Étape',
    'Date officielle',
    'Objectif Principal',
    'Contenu & Modalités',
    'Actions Prévues',
    'Actions Terminées',
    'Avancement (%)',
    'Onglet Dédié dans ce Classeur'
  ];

  recapHeaders.forEach((headerText, colIdx) => {
    styleCell(
      recapWs,
      4,
      colIdx,
      {
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'D97706' } }, // Ambre élégant
        alignment: {
          horizontal: colIdx === 1 || colIdx === 3 || colIdx === 4 ? 'left' : 'center',
          vertical: 'center',
          wrapText: true
        },
        border: borderHeader
      },
      headerText
    );
  });
  recapRowHeights.push({ hpt: 30 });

  // Lignes 5+ : Lignes de données des événements
  let currentRecapRow = 5;

  sortedEvents.forEach((evt, idx) => {
    const totalTasks = evt.tasks.length;
    const completedTasks = evt.tasks.filter((t) => t.status === 'completed').length;
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const sheetName = eventSheetNameMap.get(evt.id) || `Événement ${idx + 1}`;

    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFF' : 'F8FAFC'; // Zebra striping

    // Col 0: N°
    styleCell(recapWs, currentRecapRow, 0, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '64748B' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    }, idx + 1);

    // Col 1: Titre de l'événement
    styleCell(recapWs, currentRecapRow, 1, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderThin
    }, evt.title);

    // Col 2: Date officielle (badge sobre)
    styleCell(recapWs, currentRecapRow, 2, {
      font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '1E293B' } },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    }, evt.date);

    // Col 3: Objectif
    styleCell(recapWs, currentRecapRow, 3, {
      font: { name: 'Calibri', sz: 9.5, color: { rgb: '334155' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderThin
    }, evt.objective);

    // Col 4: Contenu & Modalités
    styleCell(recapWs, currentRecapRow, 4, {
      font: { name: 'Calibri', sz: 9.5, color: { rgb: '334155' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderThin
    }, evt.content);

    // Col 5: Actions prévues
    styleCell(recapWs, currentRecapRow, 5, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    }, totalTasks);

    // Col 6: Actions terminées
    styleCell(recapWs, currentRecapRow, 6, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '166534' } },
      fill: { fgColor: { rgb: rowBg } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    }, completedTasks);

    // Col 7: Avancement (%) stylisé selon le niveau
    const pctStyle = pct === 100
      ? { fill: 'DCFCE7', text: '166534', border: '86EFAC' } // Vert menthe
      : pct > 0
      ? { fill: 'DBEAFE', text: '1E40AF', border: '93C5FD' } // Bleu clair
      : { fill: 'F1F5F9', text: '64748B', border: 'CBD5E1' }; // Neutre

    styleCell(recapWs, currentRecapRow, 7, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: pctStyle.text } },
      fill: { fgColor: { rgb: pctStyle.fill } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: pctStyle.border } },
        bottom: { style: 'thin', color: { rgb: pctStyle.border } },
        left: { style: 'thin', color: { rgb: pctStyle.border } },
        right: { style: 'thin', color: { rgb: pctStyle.border } }
      }
    }, `${pct}%`);

    // Col 8: Onglet dédié (Pastille indigo style lien interactif)
    styleCell(recapWs, currentRecapRow, 8, {
      font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '4338CA' } },
      fill: { fgColor: { rgb: 'EEF2FF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'C7D2FE' } },
        bottom: { style: 'thin', color: { rgb: 'C7D2FE' } },
        left: { style: 'thin', color: { rgb: 'C7D2FE' } },
        right: { style: 'thin', color: { rgb: 'C7D2FE' } }
      }
    }, `📄 ${sheetName}`);

    recapRowHeights.push({ hpt: 26 });
    currentRecapRow++;
  });

  // Ligne de totalisation officielle (Marine foncée avec double filet bas)
  styleCell(recapWs, currentRecapRow, 0, {
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F2756' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderTotal
  }, 'TOTAL');

  styleCell(recapWs, currentRecapRow, 1, {
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F2756' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderTotal
  }, `${sortedEvents.length} Événements`);

  for (let c = 2; c <= 4; c++) {
    styleCell(recapWs, currentRecapRow, c, {
      fill: { fgColor: { rgb: '0F2756' } },
      border: borderTotal
    }, '');
  }

  styleCell(recapWs, currentRecapRow, 5, {
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F2756' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderTotal
  }, totalProjectTasks);

  styleCell(recapWs, currentRecapRow, 6, {
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F2756' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderTotal
  }, totalProjectCompleted);

  styleCell(recapWs, currentRecapRow, 7, {
    font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F2756' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderTotal
  }, `${overallPct}%`);

  styleCell(recapWs, currentRecapRow, 8, {
    fill: { fgColor: { rgb: '0F2756' } },
    border: borderTotal
  }, '');

  recapRowHeights.push({ hpt: 28 });
  currentRecapRow++;

  // Espacement avant la légende
  for (let c = 0; c < totalColsRecap; c++) {
    styleCell(recapWs, currentRecapRow, c, { fill: { fgColor: { rgb: 'FFFFFF' } } }, '');
  }
  recapRowHeights.push({ hpt: 16 });
  currentRecapRow++;

  // Section Légende officielle des phases & catégories
  mergeAndStyleRange(
    recapWs,
    currentRecapRow, 0, currentRecapRow, 4,
    {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    'RÉFÉRENTIEL OFFICIEL DES PHASES & CATÉGORIES DU PROJET'
  );
  recapRowHeights.push({ hpt: 26 });
  currentRecapRow++;

  // En-têtes de la légende
  mergeAndStyleRange(
    recapWs,
    currentRecapRow, 0, currentRecapRow, 1,
    {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '334155' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderThin
    },
    'Catégorie / Phase'
  );

  mergeAndStyleRange(
    recapWs,
    currentRecapRow, 2, currentRecapRow, 8,
    {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '334155' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderThin
    },
    'Description & Rôle Opérationnel'
  );
  recapRowHeights.push({ hpt: 22 });
  currentRecapRow++;

  // Lignes de catégories
  RETRO_CATEGORIES.forEach((cat) => {
    const catStyle = getExcelCategoryStyle(cat.label);

    mergeAndStyleRange(
      recapWs,
      currentRecapRow, 0, currentRecapRow, 1,
      {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: catStyle.textDark } },
        fill: { fgColor: { rgb: catStyle.softBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      },
      cat.label
    );

    mergeAndStyleRange(
      recapWs,
      currentRecapRow, 2, currentRecapRow, 8,
      {
        font: { name: 'Calibri', sz: 9.5, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
        border: borderThin
      },
      cat.description
    );

    recapRowHeights.push({ hpt: 24 });
    currentRecapRow++;
  });

  recapWs['!rows'] = recapRowHeights;
  recapWs['!cols'] = [
    { wch: 6 },  // N°
    { wch: 38 }, // Événement
    { wch: 18 }, // Date
    { wch: 46 }, // Objectif
    { wch: 55 }, // Contenu
    { wch: 20 }, // Prévues
    { wch: 20 }, // Terminées
    { wch: 16 }, // %
    { wch: 32 }  // Onglet
  ];
  recapWs['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRecapRow - 1, c: totalColsRecap - 1 }
  });

  XLSX.utils.book_append_sheet(workbook, recapWs, 'Vue d’ensemble');

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

    const eventWs: any = {};
    eventWs['!merges'] = [];
    eventWs['!views'] = [{ showGridLines: true }];
    const eventRowHeights: { hpt: number }[] = [];

    // Structure des colonnes de la feuille :
    // 0: Semaine
    // 1: Catégorie
    // 2: Action / Tâche
    // 3 .. 3 + eventWeeks.length - 1 : Colonnes des semaines de la frise Gantt
    // +1: Responsable
    // +2: Statut
    // +3: Type
    const totalColsEvent = 3 + eventWeeks.length + 3;

    // Ligne 0 : Bannière Titre Événement
    mergeAndStyleRange(
      eventWs,
      0, 0, 0, totalColsEvent - 1,
      {
        font: { name: 'Calibri', sz: 15, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F2756' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      },
      `RÉTRO-PLANNING DÉTAILLÉ – ${evt.title.toUpperCase()}`
    );
    eventRowHeights.push({ hpt: 38 });

    // Ligne 1 : Date & Objectif (Bannière Or / Ambre clair)
    mergeAndStyleRange(
      eventWs,
      1, 0, 1, totalColsEvent - 1,
      {
        font: { name: 'Calibri', sz: 10.5, bold: true, color: { rgb: '92400E' } },
        fill: { fgColor: { rgb: 'FEF3C7' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      },
      `📅 Date de l'événement : ${evt.date}    |    🎯 Objectif principal : ${evt.objective}`
    );
    eventRowHeights.push({ hpt: 24 });

    // Ligne 2 : Modalités & Contenu (Bannière Ardoise douce)
    mergeAndStyleRange(
      eventWs,
      2, 0, 2, totalColsEvent - 1,
      {
        font: { name: 'Calibri', sz: 9.5, italic: true, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      },
      `📝 Contenu & Modalités : ${evt.content || 'Non spécifié'}`
    );
    eventRowHeights.push({ hpt: 22 });

    // Ligne 3 : Séparateur vide
    for (let c = 0; c < totalColsEvent; c++) {
      styleCell(eventWs, 3, c, { fill: { fgColor: { rgb: 'FFFFFF' } } }, '');
    }
    eventRowHeights.push({ hpt: 12 });

    // Ligne 4 : En-têtes du tableau détaillé
    // Colonnes fixes de gauche
    styleCell(eventWs, 4, 0, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHeader
    }, 'Semaine');

    styleCell(eventWs, 4, 1, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHeader
    }, 'Catégorie');

    styleCell(eventWs, 4, 2, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderHeader
    }, 'Action / Tâche préparatoire');

    // Colonnes de la frise chronologique (Gantt)
    eventWeeks.forEach((w, wIdx) => {
      styleCell(eventWs, 4, 3 + wIdx, {
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F2756' } }, // Bleu marine très foncé pour la zone chronologique
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderHeader
      }, w);
    });

    // Colonnes de métadonnées à droite
    const colResp = 3 + eventWeeks.length;
    const colStat = colResp + 1;
    const colType = colStat + 1;

    styleCell(eventWs, 4, colResp, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHeader
    }, 'Responsable');

    styleCell(eventWs, 4, colStat, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHeader
    }, 'Statut');

    styleCell(eventWs, 4, colType, {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderHeader
    }, 'Type');

    eventRowHeights.push({ hpt: 30 });

    // Lignes 5+ : Tâches et actions
    let currentTaskRow = 5;

    sortedTasks.forEach((task, taskIdx) => {
      const isEventRow = task.isEventHighlight || task.status === 'event';
      const isEven = taskIdx % 2 === 0;
      const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';
      const catStyle = getExcelCategoryStyle(task.category);

      if (isEventRow) {
        // Ligne Jour J / Jalon Événement mise en valeur en rouge carmin
        styleCell(eventWs, currentTaskRow, 0, {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '991B1B' } },
          fill: { fgColor: { rgb: 'FEE2E2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'F87171' } },
            bottom: { style: 'thin', color: { rgb: 'F87171' } },
            left: { style: 'thin', color: { rgb: 'F87171' } },
            right: { style: 'thin', color: { rgb: 'F87171' } }
          }
        }, task.weekLabel);

        styleCell(eventWs, currentTaskRow, 1, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '991B1B' } },
          fill: { fgColor: { rgb: 'FEE2E2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'F87171' } },
            bottom: { style: 'thin', color: { rgb: 'F87171' } },
            left: { style: 'thin', color: { rgb: 'F87171' } },
            right: { style: 'thin', color: { rgb: 'F87171' } }
          }
        }, task.category);

        styleCell(eventWs, currentTaskRow, 2, {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '991B1B' } },
          fill: { fgColor: { rgb: 'FEE2E2' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'F87171' } },
            bottom: { style: 'thin', color: { rgb: 'F87171' } },
            left: { style: 'thin', color: { rgb: 'F87171' } },
            right: { style: 'thin', color: { rgb: 'F87171' } }
          }
        }, `★ ${task.action}`);

        // Timeline de l'événement
        eventWeeks.forEach((w, wIdx) => {
          const targetWeekKey = w.split(' ')[0].toUpperCase();
          const taskWeekKey = task.weekLabel.split(' ')[0].toUpperCase();
          const isMatched = task.weekLabel.trim() === w.trim() || taskWeekKey === targetWeekKey;

          if (isMatched) {
            styleCell(eventWs, currentTaskRow, 3 + wIdx, {
              font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: 'DC2626' } }, // Rouge vif
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: 'B91C1C' } },
                bottom: { style: 'thin', color: { rgb: 'B91C1C' } },
                left: { style: 'thin', color: { rgb: 'B91C1C' } },
                right: { style: 'thin', color: { rgb: 'B91C1C' } }
              }
            }, '★ EVENT');
          } else {
            styleCell(eventWs, currentTaskRow, 3 + wIdx, {
              font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'DC2626' } },
              fill: { fgColor: { rgb: 'FEF2F2' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderSubtle
            }, '★');
          }
        });

        // Responsable
        styleCell(eventWs, currentTaskRow, colResp, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '991B1B' } },
          fill: { fgColor: { rgb: 'FEE2E2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'F87171' } },
            bottom: { style: 'thin', color: { rgb: 'F87171' } },
            left: { style: 'thin', color: { rgb: 'F87171' } },
            right: { style: 'thin', color: { rgb: 'F87171' } }
          }
        }, task.assignee);

        // Statut Jour J
        styleCell(eventWs, currentTaskRow, colStat, {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'DC2626' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'B91C1C' } },
            bottom: { style: 'thin', color: { rgb: 'B91C1C' } },
            left: { style: 'thin', color: { rgb: 'B91C1C' } },
            right: { style: 'thin', color: { rgb: 'B91C1C' } }
          }
        }, 'Événement');

        // Type
        styleCell(eventWs, currentTaskRow, colType, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '991B1B' } },
          fill: { fgColor: { rgb: 'FEE2E2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'F87171' } },
            bottom: { style: 'thin', color: { rgb: 'F87171' } },
            left: { style: 'thin', color: { rgb: 'F87171' } },
            right: { style: 'thin', color: { rgb: 'F87171' } }
          }
        }, '★ Jalon Jour J');
      } else {
        // Tâche standard avec pastel et frise chronologique colorée
        // Col 0: Semaine
        styleCell(eventWs, currentTaskRow, 0, {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }, task.weekLabel);

        // Col 1: Catégorie avec pastille dédiée
        styleCell(eventWs, currentTaskRow, 1, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: catStyle.textDark } },
          fill: { fgColor: { rgb: catStyle.softBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }, task.category);

        // Col 2: Action / Description
        styleCell(eventWs, currentTaskRow, 2, {
          font: { name: 'Calibri', sz: 10, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: borderThin
        }, task.action);

        // Timeline des semaines
        eventWeeks.forEach((w, wIdx) => {
          const targetWeekKey = w.split(' ')[0].toUpperCase();
          const taskWeekKey = task.weekLabel.split(' ')[0].toUpperCase();
          const isMatched = task.weekLabel.trim() === w.trim() || taskWeekKey === targetWeekKey;

          if (isMatched) {
            // Bloc actif : rempli avec la couleur vive officielle de sa catégorie
            styleCell(eventWs, currentTaskRow, 3 + wIdx, {
              font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: catStyle.solid } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            }, '■ ACTIF');
          } else {
            // Bloc inactif : discret avec légère délimitation
            styleCell(eventWs, currentTaskRow, 3 + wIdx, {
              font: { name: 'Calibri', sz: 9, color: { rgb: 'CBD5E1' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderSubtle
            }, '·');
          }
        });

        // Responsable
        styleCell(eventWs, currentTaskRow, colResp, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }, task.assignee);

        // Statut stylisé
        let statusText = 'À faire';
        let statusStyle = { fill: 'FEF3C7', text: '92400E', border: 'FDE68A' }; // Ambre doux

        if (task.status === 'completed') {
          statusText = 'Fait';
          statusStyle = { fill: 'DCFCE7', text: '166534', border: '86EFAC' }; // Vert menthe
        } else if (task.status === 'in_progress') {
          statusText = 'En cours';
          statusStyle = { fill: 'DBEAFE', text: '1E40AF', border: '93C5FD' }; // Bleu doux
        }

        styleCell(eventWs, currentTaskRow, colStat, {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: statusStyle.text } },
          fill: { fgColor: { rgb: statusStyle.fill } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: statusStyle.border } },
            bottom: { style: 'thin', color: { rgb: statusStyle.border } },
            left: { style: 'thin', color: { rgb: statusStyle.border } },
            right: { style: 'thin', color: { rgb: statusStyle.border } }
          }
        }, statusText);

        // Type
        styleCell(eventWs, currentTaskRow, colType, {
          font: { name: 'Calibri', sz: 9.5, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        }, 'Action préparatoire');
      }

      eventRowHeights.push({ hpt: 26 });
      currentTaskRow++;
    });

    eventWs['!rows'] = eventRowHeights;

    // Calcul des largeurs de colonnes
    const colWidths: { wch: number }[] = [
      { wch: 16 }, // Semaine
      { wch: 28 }, // Catégorie
      { wch: 64 }  // Action
    ];
    eventWeeks.forEach(() => colWidths.push({ wch: 14 })); // Colonnes semaines timeline
    colWidths.push({ wch: 24 }); // Responsable
    colWidths.push({ wch: 16 }); // Statut
    colWidths.push({ wch: 22 }); // Type

    eventWs['!cols'] = colWidths;
    eventWs['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: currentTaskRow - 1, c: totalColsEvent - 1 }
    });

    XLSX.utils.book_append_sheet(workbook, eventWs, sheetName);
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
    // Fallback navigateur universel avec Blob
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
