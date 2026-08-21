import type { ReactNode } from "react";

/**
 * Un bloc générique affiché par PrefDomainDashboardSection6.
 * Toute la logique métier (calculs, JSX détaillé) est déjà résolue par le
 * domaine (ex: JeunesseSection6Blocks) — Section6 ne fait qu'afficher
 * `content` dans un accordéon identifié par `id`, `title` et `icon`.
 */
export interface Section6Block {
  /** Identifiant unique du bloc, utilisé pour l'état d'ouverture de l'accordéon */
  id: string;
  /** Titre affiché dans l'en-tête du bloc */
  title: string;
  /** Icône affichée dans l'en-tête du bloc, fournie par le domaine */
  icon: ReactNode;
  /** Contenu déjà construit (JSX) du bloc */
  content: ReactNode;
}
