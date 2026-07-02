// Préparation du texte arabe pour rendu PDF/Canvas non-RTL :
// 1) Reshape (formes contextuelles initial/médian/final/isolé)
// 2) Application de l'algorithme bidi pour reverser visuellement (RTL → LTR visuel)
// jsPDF n'a pas de support RTL natif : on fournit donc une string déjà
// "visuellement ordonnée" prête à être dessinée gauche→droite.

import ArabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

// Plage Unicode arabe (incluant supplément arabe + formes de présentation)
const AR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const containsArabic = (s: unknown): boolean =>
  typeof s === 'string' && AR_RE.test(s);

/**
 * Convertit un texte logique arabe en sa forme "visuelle" gauche→droite
 * pour rendu jsPDF.
 */
export const shapeArabic = (text: string): string => {
  if (!containsArabic(text)) return text;
  // Reshape : applique les formes contextuelles
  const reshaped = ArabicReshaper.convertArabic(text);
  // Bidi : retourne le texte dans l'ordre visuel ligne par ligne
  try {
    const lines = reshaped.split('\n').map(line => {
      const embeddingLevels = bidi.getEmbeddingLevels(line, 'rtl');
      const reorderSegments = bidi.getReorderSegments(line, embeddingLevels);
      let out = line;
      // Appliquer reorderSegments : chaque segment [start, end] doit être inversé
      for (const [start, end] of reorderSegments) {
        const before = out.slice(0, start);
        const middle = out.slice(start, end + 1).split('').reverse().join('');
        const after = out.slice(end + 1);
        out = before + middle + after;
      }
      return out;
    });
    return lines.join('\n');
  } catch {
    return reshaped.split('').reverse().join('');
  }
};

/** Applique le shaping à toutes les chaînes contenant de l'arabe dans une matrice. */
export const shapeRows = <T extends (string | number | null | undefined)[][]>(rows: T): T =>
  rows.map(r => r.map(c => (typeof c === 'string' ? shapeArabic(c) : c))) as T;
