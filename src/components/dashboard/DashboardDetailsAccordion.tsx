import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardDetailsSectionProps {
  className: string;
  headingClassName: string;
  title: ReactNode;
  children: ReactNode;
}

export const DashboardDetailsSection = ({ className, headingClassName, title, children }: DashboardDetailsSectionProps) => (
  <section className={className}>
    <h2 className={headingClassName}>{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

interface DashboardAccordionItemProps {
  isOpen: boolean;
  onToggle: () => void;
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
}

export const DashboardAccordionItem = ({ isOpen, onToggle, icon, title, children }: DashboardAccordionItemProps) => (
  <Card className="overflow-hidden border-border/70 shadow-none">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 font-bold text-sm text-foreground">
        {icon} {title}
      </div>
      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {isOpen && children}
  </Card>
);
