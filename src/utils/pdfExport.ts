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
    scale: 2, // 2x pour une netteté de rendu optimale (polices lisses, pas de flou)
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  onProgress?.('Mise en page PDF paysage...');

  // Dimensions de la page PDF en format Paysage (en millimètres)
  // A3 paysage = 420 x 297 mm (Recommandé : très large, lisible même avec 40+ semaines)
  // A4 paysage = 297 x 210 mm
  const isA3 = format === 'a3';
  const pageWidth = isA3 ? 420 : 297;
  const pageHeight = isA3 ? 297 : 210;
  const margin = isA3 ? 8 : 6;

  const printableWidth = pageWidth - 2 * margin;
  const printableHeight = pageHeight - 2 * margin;

  const canvasRatio = canvas.width / canvas.height;
  const printableRatio = printableWidth / printableHeight;

  let finalWidth: number;
  let finalHeight: number;

  if (canvasRatio > printableRatio) {
    finalWidth = printableWidth;
    finalHeight = finalWidth / canvasRatio;
  } else {
    finalHeight = printableHeight;
    finalWidth = finalHeight * canvasRatio;
  }

  // Centrage dans la page paysage
  const xOffset = margin + (printableWidth - finalWidth) / 2;
  const yOffset = margin + (printableHeight - finalHeight) / 2;

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: isA3 ? 'a3' : 'a4'
  });

  pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

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
    scale: 2,
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
