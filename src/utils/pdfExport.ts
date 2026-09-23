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
  if (!element) {
    throw new Error('Élément d’export introuvable.');
  }

  onProgress?.('Rendu haute définition du diagramme (Gantt complet)...');

  // Petit délai pour assurer que les polices et largeurs sont calculées
  await new Promise((resolve) => setTimeout(resolve, 200));

  const canvas = await html2canvas(element, {
    scale: 2.2, // Rendu haute résolution ultra-net
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  onProgress?.('Mise en page PDF paysage 100% plein cadre...');

  // Dimensions exactes de la page calculées à partir du ratio du diagramme
  // Ainsi le diagramme remplit 100% de la page sans marges vides superflues
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
  if (!element) {
    throw new Error('Élément d’export introuvable.');
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  const canvas = await html2canvas(element, {
    scale: 2.2,
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
}

/**
 * Ouvre la boîte de dialogue d'impression native du navigateur
 * Permet à l'utilisateur sur Mac de faire "Enregistrer au format PDF" directement en vectoriel
 */
export function printGantt(): void {
  window.print();
}
