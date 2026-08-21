import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Section6Block } from "./section6/types";

type PrefDomainDashboardSection6Props = {
  /** Blocs déjà construits par le domaine (ex: buildJeunesseSection6Blocks). */
  blocks: Section6Block[];
  t: TFunction;
  openSection: string | null;
  toggleSection: (section: string) => void;
};

type Section6AccordionItemProps = {
  id: string;
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: (section: string) => void;
  children: ReactNode;
};

const Section6AccordionItem = ({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: Section6AccordionItemProps) => (
  <Card className="overflow-hidden border-border/70 shadow-none">
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-center gap-2 font-bold text-sm text-foreground">
        {icon} {title}
      </div>
      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {isOpen && <div className="p-5 bg-card border-t border-border/50">{children}</div>}
  </Card>
);

/**
 * Section6 générique : shell d'accordéon qui affiche des blocs déjà
 * construits par le domaine. Aucune logique métier, aucun calcul et aucun
 * affichage spécifique à un domaine ne vit ici.
 */
export const PrefDomainDashboardSection6 = ({
  blocks,
  t,
  openSection,
  toggleSection,
}: PrefDomainDashboardSection6Props) => {
  return (
    <section className="space-y-2">
      <h2 className="text-base sm:text-lg font-bold text-foreground">
        {t("prefDomainDashboard.details.title", "Lecture détaillée du rapport") as string}
      </h2>

      <div className="space-y-3">
        {blocks.map((block) => (
          <Section6AccordionItem
            key={block.id}
            id={block.id}
            title={block.title}
            icon={block.icon}
            isOpen={openSection === block.id}
            onToggle={toggleSection}
          >
            {block.content}
          </Section6AccordionItem>
        ))}
      </div>
    </section>
  );
};
