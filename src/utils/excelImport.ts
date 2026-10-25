import * as XLSXModule from 'xlsx-js-style';
import { RetroplanningEvent, RetroplanningTask, Task } from '../types/planning';
import { sortRetroEventsChronologically } from './scheduler';

const XLSX = (XLSXModule as any).default || XLSXModule;

export interface ExcelImportResult {
  success: boolean;
  message: string;
  events: RetroplanningEvent[];
  tasks: Task[];
  importedCount: number;
}

/**
 * Analyse et extrait les données de rétroplanning depuis un classeur Excel (.xlsx)
 * Compatible avec les exports de l'application (format multi-onglets stylisé).
 */
export async function parseExcelPlanning(file: File): Promise<ExcelImportResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        message: 'Le fichier Excel ne contient aucune feuille de calcul.',
        events: [],
        tasks: [],
        importedCount: 0
      };
    }

    const events: RetroplanningEvent[] = [];
    let totalImportedTasks = 0;

    workbook.SheetNames.forEach((sheetName: string, sIdx: number) => {
      // Ignorer la feuille de synthèse "Vue d’ensemble" pour extraire directement les événements détaillés
      const lower = sheetName.toLowerCase();
      if (lower.includes('vue d’ensemble') || lower.includes('vue densemble') || lower.includes('sommaire')) {
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!rows || rows.length < 4) return;

      // 1. Extraction des métadonnées d'en-tête (Titres, Date, Objectif, Contenu)
      const r0 = String(rows[0]?.[0] || '');
      const r1 = String(rows[1]?.[0] || '');
      const r2 = String(rows[2]?.[0] || '');

      let title = sheetName;
      if (r0.includes('–')) {
        title = r0.split('–')[1].trim();
      } else if (r0.includes('-')) {
        title = r0.split('-')[1].trim();
      }

      let date = 'Non spécifiée';
      let objective = '';
      if (r1.includes("Date de l'événement :")) {
        const parts = r1.split('|');
        date = parts[0].replace("📅 Date de l'événement :", '').trim();
        if (parts[1]) {
          objective = parts[1].replace('🎯 Objectif principal :', '').trim();
        }
      }

      let content = '';
      if (r2.includes('Contenu & Modalités :')) {
        content = r2.replace('📝 Contenu & Modalités :', '').trim();
      }

      // 2. Recherche de la ligne d'en-tête du tableau (commençant par "Semaine")
      const headerIdx = rows.findIndex((r) => r && String(r[0]).trim().toLowerCase() === 'semaine');
      if (headerIdx === -1) return;

      const dataRows = rows.slice(headerIdx + 1);
      const eventTasks: RetroplanningTask[] = [];

      dataRows.forEach((row, rIdx) => {
        if (!row || !row[0] || !row[2]) return;
        const weekLabel = String(row[0]).trim();
        const category = String(row[1] || 'Communication').trim();
        const action = String(row[2]).trim();

        // Dans le format d'export, les dernières colonnes sont : Responsable, Statut, Type
        const assignee = String(row[row.length - 3] || 'Toute l’équipe').trim();
        const statusRaw = String(row[row.length - 2] || 'À faire').trim().toLowerCase();
        const typeRaw = String(row[row.length - 1] || '').trim().toLowerCase();

        let status: 'todo' | 'in_progress' | 'completed' | 'event' = 'todo';
        if (statusRaw.includes('fait') || statusRaw.includes('termin')) {
          status = 'completed';
        } else if (statusRaw.includes('cours')) {
          status = 'in_progress';
        } else if (statusRaw.includes('événement') || statusRaw.includes('evenement') || typeRaw.includes('jalon')) {
          status = 'event';
        }

        const isEventHighlight = status === 'event' || typeRaw.includes('jalon');

        eventTasks.push({
          id: `imp-${Date.now()}-${sIdx}-${rIdx}`,
          weekLabel,
          category,
          action,
          assignee,
          status,
          isEventHighlight
        });
        totalImportedTasks++;
      });

      if (eventTasks.length > 0) {
        events.push({
          id: `imp-event-${Date.now()}-${sIdx}`,
          title,
          date,
          objective,
          content,
          tasks: eventTasks
        });
      }
    });

    if (events.length === 0) {
      return {
        success: false,
        message: "Aucun tableau de tâches ou d'événements reconnu dans ce fichier Excel.",
        events: [],
        tasks: [],
        importedCount: 0
      };
    }

    return {
      success: true,
      message: `${events.length} événement(s) et ${totalImportedTasks} tâche(s) importés avec succès !`,
      events: sortRetroEventsChronologically(events),
      tasks: [],
      importedCount: totalImportedTasks
    };
  } catch (error: any) {
    console.error('[ExcelImport] Erreur lors de l’analyse du classeur :', error);
    return {
      success: false,
      message: `Erreur d'analyse Excel : ${error?.message || 'Fichier non reconnu'}`,
      events: [],
      tasks: [],
      importedCount: 0
    };
  }
}
