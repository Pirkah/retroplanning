import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  projectName: string;
  format?: 'a3' | 'a4';
  onProgress?: (message: string) => void;
}

/**
 * Exporte l'intégralité du diagramme de Gantt en document PDF Haute Définition format paysage
 */
export async function exportGanttToPdf(options: ExportPdfOptions): Promise<void> {
  const { projectName, format = 'a3', onProgress } = options;

  onProgress?.('Préparation du diagramme...');
  const element = document.getElementById('gantt-export-canvas-target');
  const container = document.getElementById('export-canvas-container');
  if (!element) {
    throw new Error('Élément d’export introuvable.');
  }

  // Activer temporairement le conteneur en (0, 0) avec opacité 1 sous le rideau de chargement
  // Permet à Safari (WebKit) et Chrome de calculer avec précision les polices et l'antialiasing subpixel
  if (container) {
    container.style.opacity = '1';
    container.style.zIndex = '99998';
  }

  try {
    onProgress?.('Rendu haute définition du diagramme (Gantt complet)...');

    // Délai pour laisser le moteur de rendu et les polices se stabiliser
    await new Promise((resolve) => setTimeout(resolve, 250));

    const canvas = await html2canvas(element, {
      scale: 2.0, // 2x haute résolution ultra-nette (~350 DPI sur A3)
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    onProgress?.('Génération du fichier PDF paysage...');

    // Dimensions exactes de la page calculées selon le ratio réel du diagramme
    // Garantit zéro bande blanche, zéro marges superflues et un rendu 100% plein cadre
    const targetWidthMm = format === 'a3' ? 420 : 297;
    const targetHeightMm = Math.round((targetWidthMm * canvas.height) / canvas.width);

    // Format PNG sans perte : aucun artefact de compression sur les textes et bordures
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [targetWidthMm, targetHeightMm]
    });

    // Le diagramme occupe 100% de la surface pour une lisibilité maximale
    pdf.addImage(imgData, 'PNG', 0, 0, targetWidthMm, targetHeightMm, undefined, 'FAST');

    const cleanName = projectName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    pdf.save(`${cleanName}_gantt_paysage_${format.toUpperCase()}.pdf`);
  } finally {
    if (container) {
      container.style.opacity = '0';
      container.style.zIndex = '-9999';
    }
  }
}

/**
 * Exporte l'intégralité du diagramme de Gantt en image PNG panoramique haute résolution
 */
export async function exportGanttToPng(
  projectName: string,
  onProgress?: (message: string) => void
): Promise<void> {
  onProgress?.('Capture panoramique du diagramme complet...');
  const element = document.getElementById('gantt-export-canvas-target');
  const container = document.getElementById('export-canvas-container');
  if (!element) {
    throw new Error('Élément d’export introuvable.');
  }

  if (container) {
    container.style.opacity = '1';
    container.style.zIndex = '99998';
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const canvas = await html2canvas(element, {
      scale: 2.0,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');

    const cleanName = projectName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    link.href = imgData;
    link.download = `${cleanName}_gantt_panoramique_hd.png`;
    link.click();
  } finally {
    if (container) {
      container.style.opacity = '0';
      container.style.zIndex = '-9999';
    }
  }
}

/**
 * Ouvre la boîte de dialogue d'impression native configurée spécifiquement pour le Diagramme de Gantt
 * Permet à l'utilisateur sur Mac de faire "Enregistrer au format PDF" directement en vectoriel
 */
export function printGantt(): void {
  document.body.classList.remove('print-mode-retroplanning', 'print-retroplanning');
  document.body.classList.add('print-mode-gantt');
  window.print();
}

/**
 * Ouvre la boîte de dialogue d'impression native configurée spécifiquement pour le Rétroplanning Événements (Excel)
 */
export function printRetroplanning(): void {
  document.body.classList.remove('print-mode-gantt');
  document.body.classList.add('print-mode-retroplanning', 'print-retroplanning');
  window.print();
}

export interface ExportRetroOptions {
  projectName: string;
  eventTitle?: string;
  format?: 'a3' | 'a4';
  onProgress?: (message: string) => void;
}

/**
 * Exporte la feuille de rétroplanning actuelle en PDF Paysage Haute Définition
 */
export async function exportRetroplanningToPdf(options: ExportRetroOptions): Promise<void> {
  const { projectName, eventTitle = 'Vue_d_ensemble', format = 'a3', onProgress } = options;
  const element = document.getElementById('retroplanning-sheet-target');
  if (!element) {
    throw new Error('Élément de rétroplanning introuvable (#retroplanning-sheet-target).');
  }

  onProgress?.('Capture haute résolution de la feuille de rétroplanning...');
  await new Promise((resolve) => setTimeout(resolve, 150));

  const canvas = await html2canvas(element, {
    scale: 2.0,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    ignoreElements: (el) => el.classList.contains('no-print')
  });

  onProgress?.('Génération du fichier PDF paysage...');
  const targetWidthMm = format === 'a3' ? 420 : 297;
  const targetHeightMm = Math.round((targetWidthMm * canvas.height) / canvas.width);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [targetWidthMm, targetHeightMm]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, targetWidthMm, targetHeightMm, undefined, 'FAST');
  const cleanTitle = (eventTitle || projectName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  pdf.save(`${cleanTitle}_retroplanning_${format.toUpperCase()}.pdf`);
}

/**
 * Exporte la feuille de rétroplanning actuelle en image PNG HD
 */
export async function exportRetroplanningToPng(
  projectName: string,
  eventTitle?: string,
  onProgress?: (message: string) => void
): Promise<void> {
  const element = document.getElementById('retroplanning-sheet-target');
  if (!element) {
    throw new Error('Élément de rétroplanning introuvable (#retroplanning-sheet-target).');
  }

  onProgress?.('Capture haute résolution du rétroplanning...');
  await new Promise((resolve) => setTimeout(resolve, 150));

  const canvas = await html2canvas(element, {
    scale: 2.0,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    ignoreElements: (el) => el.classList.contains('no-print')
  });

  const imgData = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const cleanTitle = (eventTitle || projectName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  link.href = imgData;
  link.download = `${cleanTitle}_retroplanning_hd.png`;
  link.click();
}
