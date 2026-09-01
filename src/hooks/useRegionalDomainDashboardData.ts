import { useEffect, useRef, useState } from "react";
import {
  getRegionalDashboardService,
  type RegionalDashboardPayload,
  type RegionalDomainCode,
} from "@/services/regional/regionalDashboardServices";

interface RegionalDashboardState {
  data: RegionalDashboardPayload | null;
  contentDomain: RegionalDomainCode | null;
  loading: boolean;
  isRefreshing: boolean;
  error: Error | null;
}

const cache = new Map<string, RegionalDashboardPayload>();

const cacheKey = (domain: RegionalDomainCode, year: number, lang: string) =>
  languageAffectsData(domain) ? `${domain}:${year}:${lang}` : `${domain}:${year}`;

const languageAffectsData = (domain: RegionalDomainCode) =>
  domain === "FEMME" || domain === "PE" || domain === "CRECHES";

const toError = (reason: unknown) =>
  reason instanceof Error
    ? reason
    : new Error("Le chargement du tableau de bord regional a echoue.");

export function useRegionalDomainDashboardData(
  domain: RegionalDomainCode,
  year: number,
  lang: string,
) {
  const [state, setState] = useState<RegionalDashboardState>({
    data: null,
    contentDomain: null,
    loading: true,
    isRefreshing: false,
    error: null,
  });
  const requestId = useRef(0);
  const localeKey = languageAffectsData(domain) ? lang : "";

  useEffect(() => {
    const service = getRegionalDashboardService(domain);
    const id = ++requestId.current;
    const key = cacheKey(domain, year, lang);
    const cached = cache.get(key);

    if (cached) {
      setState({
        data: cached,
        contentDomain: domain,
        loading: false,
        isRefreshing: false,
        error: null,
      });
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: previous.data === null,
      isRefreshing: previous.data !== null,
      error: null,
    }));

    if (!service) {
      setState((previous) => ({
        ...previous,
        loading: false,
        isRefreshing: false,
        error: new Error(`Domaine regional non pris en charge : ${domain}`),
      }));
      return;
    }

    void service(year, lang)
      .then((data) => {
        if (id !== requestId.current) return;
        cache.set(key, data);
        setState({ data, contentDomain: domain, loading: false, isRefreshing: false, error: null });
      })
      .catch((reason: unknown) => {
        if (id !== requestId.current) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          isRefreshing: false,
          error: toError(reason),
        }));
      });
  }, [domain, year, localeKey]);

  return state;
}
