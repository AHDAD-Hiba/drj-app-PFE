import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RegionalDomainOption {
  code: string;
  nom_fr?: string;
  nom_ar?: string;
}

export interface RegionalFiltersProps {
  year: number;
  onYearChange: (value: number) => void;
  filterDomain: string;
  onFilterDomainChange: (value: string) => void;
  domains: RegionalDomainOption[];
  yearLabel?: string;
  domainLabel?: string;
}

export function RegionalFilters({
  year,
  onYearChange,
  filterDomain,
  onFilterDomainChange,
  domains,
  yearLabel = "Année",
  domainLabel = "Domaine",
}: RegionalFiltersProps) {
  const { i18n, t } = useTranslation();
  const yearText = t("common.year", "Année");

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {yearLabel}
          </span>
          <input
            id="year-selector"
            title={yearText}
            aria-label={yearText}
            placeholder={yearText}
            type="number"
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value) || 2024)}
            min={2020}
            max={2099}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {domainLabel}
          </span>
          <Select value={filterDomain} onValueChange={onFilterDomainChange}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {domains.map((dom) => (
                <SelectItem key={dom.code} value={dom.code}>
                  {i18n.language === "ar" ? dom.nom_ar : dom.nom_fr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default RegionalFilters;
