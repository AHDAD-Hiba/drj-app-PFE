import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ===== 🆕 AUDIT SUPABASE =====
interface AuditRequest {
  type: 'SELECT' | 'ERROR';
  table: string;
  duration: number;
  rowsReturned?: number;
  error?: string;
  timestamp: string;
}
 
interface AuditStats {
  totalRequests: number;
  totalTime: number;
  slowestRequests: AuditRequest[];
  suspiciousPatterns: Array<{
    type: string;
    severity: 'WARNING' | 'CRITICAL';
    message: string;
    count?: number;
  }>;
}
 
export const auditRequests: AuditRequest[] = [];
export const auditStats: AuditStats = {
  totalRequests: 0,
  totalTime: 0,
  slowestRequests: [],
  suspiciousPatterns: [],
};
 
// Intercepter les requêtes Supabase
const originalFrom = supabase.from.bind(supabase);
 
(supabase as any).from = function (tableName: string) {
  const builder = originalFrom(tableName);
  const originalSelect = builder.select.bind(builder);
 
  builder.select = function (...args: any[]) {
    const selectBuilder = originalSelect(...args);
    const startTime = performance.now();
 
    // Wrapper le .then() pour capturer le temps
    const originalThen = selectBuilder.then.bind(selectBuilder);
    selectBuilder.then = function (onFulfilled: any, onRejected: any) {
      return originalThen(
        (result: any) => {
          const duration: number = performance.now() - startTime;
          const rowCount: number = Array.isArray(result?.data) ? result.data.length : 0;
 
          recordAuditRequest({
            type: 'SELECT',
            table: tableName,
            duration: Math.round(duration * 100) / 100,
            rowsReturned: rowCount,
            timestamp: new Date().toISOString(),
          });
 
          return onFulfilled ? onFulfilled(result) : result;
        },
        (error: any) => {
          const duration: number = performance.now() - startTime;
 
          recordAuditRequest({
            type: 'ERROR',
            table: tableName,
            duration: Math.round(duration * 100) / 100,
            error: error?.message,
            timestamp: new Date().toISOString(),
          });
 
          return onRejected ? onRejected(error) : Promise.reject(error);
        }
      );
    };
 
    return selectBuilder;
  };
 
  return builder;
};
 
function recordAuditRequest(requestInfo: AuditRequest) {
  auditRequests.push(requestInfo);
 
  // Mets à jour les stats
  auditStats.totalRequests = auditRequests.length;
  auditStats.totalTime = auditRequests.reduce((sum, r) => sum + r.duration, 0);
 
  // Les 5 plus lentes
  auditStats.slowestRequests = [...auditRequests]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
 
  // Détecte les patterns suspects
  detectSuspiciousPatterns();
 
  // Log en console pour debugging (optionnel)
  if (requestInfo.type === 'ERROR') {
    console.error(`[AUDIT] ❌ ${requestInfo.table} - Error: ${requestInfo.error}`);
  } else if (requestInfo.duration > 500) {
    console.warn(`[AUDIT] 🐢 ${requestInfo.table} - ${requestInfo.duration.toFixed(1)}ms`);
  } else {
    console.log(`[AUDIT] ✅ ${requestInfo.table} - ${requestInfo.duration.toFixed(1)}ms`);
  }
}
 
function detectSuspiciousPatterns() {
  auditStats.suspiciousPatterns = [];
 
  // Groupe par table
  const groupedByTable: Record<string, number> = {};
  auditRequests.forEach((req) => {
    const key = req.table || 'unknown';
    groupedByTable[key] = (groupedByTable[key] || 0) + 1;
  });
 
  // N+1 detection
  for (const [table, count] of Object.entries(groupedByTable)) {
    if (count > 5) {
      auditStats.suspiciousPatterns.push({
        type: 'POSSIBLE_N_PLUS_1',
        severity: count > 20 ? 'CRITICAL' : 'WARNING',
        message: `${count} requêtes sur la table "${table}" — possible N+1 ?`,
        count,
      });
    }
  }
 
  // Slow queries
  auditRequests.forEach((req) => {
    if (req.duration > 1000) {
      auditStats.suspiciousPatterns.push({
        type: 'SLOW_QUERY',
        severity: 'WARNING',
        message: `Requête lente: ${req.table} (${req.duration.toFixed(0)}ms)`,
      });
    }
  });
 
  // Enlever les doublons
  auditStats.suspiciousPatterns = auditStats.suspiciousPatterns.filter(
    (pattern, index, self) =>
      index === self.findIndex((p) => p.message === pattern.message)
  );
}
 
// ===== FIN AUDIT =====