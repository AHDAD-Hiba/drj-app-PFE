/**
 * Domain Dashboard shared types.
 *
 * This file historically hosted the initial data-fetching layer for the
 * domain dashboards (fetchDomainSnapshot + aggregation helpers), used before
 * the architecture moved to the specialized per-domain services
 * (src/services/PrefDomainDashboard*DataService.ts and
 * src/services/regional/*.ts).
 *
 * That legacy code has been removed as unused. `Domain` is kept because it
 * is still imported by:
 *   - src/hooks/usePrefDomainDashboardData.ts
 *   - src/pages/PrefDomainDashboard.tsx
 *   - src/pages/DirectionDetail.tsx
 */

export type Domain = string;
