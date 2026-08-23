import React, { useState, useEffect, useRef } from 'react'

/**
 * Hook personnalisé pour tracker les requêtes Supabase
 * À utiliser avec ton client Supabase
 */
export const useSupabaseAudit = (supabaseClient) => {
  const [auditData, setAuditData] = useState({
    totalRequests: 0,
    totalTime: 0,
    requests: [],
    slowestRequests: [],
    suspiciousPatterns: [], // N+1 detection
  })

  const originalFrom = useRef(null)

  useEffect(() => {
    if (!supabaseClient) return

    // Sauvegarder la fonction originale
    originalFrom.current = supabaseClient.from.bind(supabaseClient)

    // Intercepter les appels .from()
    supabaseClient.from = function (tableName) {
      const builder = originalFrom.current(tableName)

      // Wrapper les méthodes de sélection
      const originalSelect = builder.select.bind(builder)
      const originalRpc = supabaseClient.rpc?.bind(supabaseClient)

      builder.select = function (...args) {
        const selectBuilder = originalSelect(...args)
        return wrapQueryBuilder(selectBuilder, `SELECT from ${tableName}`, supabaseClient)
      }

      return builder
    }

    // Aussi tracker les RPC calls
    if (supabaseClient.rpc) {
      supabaseClient.rpc = function (fnName, ...args) {
        const rpcCall = originalFrom.current // Fallback
        const startTime = performance.now()

        // Note: RPC est plus complexe à intercepter, on peut le faire en post-processing
        return originalRpc(fnName, ...args).then(result => {
          const duration = performance.now() - startTime
          recordRequest({
            type: 'RPC',
            function: fnName,
            duration,
            timestamp: new Date().toISOString(),
          })
          return result
        })
      }
    }

    function wrapQueryBuilder(builder, description, client) {
      const originalThen = builder.then?.bind(builder)

      // Intercepter le .then() pour mesurer le temps d'exécution
      if (originalThen) {
        builder.then = function (onFulfilled, onRejected) {
          const startTime = performance.now()

          return originalThen(
            (result) => {
              const duration = performance.now() - startTime
              recordRequest({
                type: 'SELECT',
                table: description,
                duration,
                rowsReturned: result?.data?.length || 0,
                timestamp: new Date().toISOString(),
              })

              if (onFulfilled) return onFulfilled(result)
              return result
            },
            (error) => {
              const duration = performance.now() - startTime
              recordRequest({
                type: 'ERROR',
                table: description,
                duration,
                error: error?.message,
                timestamp: new Date().toISOString(),
              })

              if (onRejected) return onRejected(error)
              throw error
            }
          )
        }
      }

      return builder
    }

    function recordRequest(requestInfo) {
      setAuditData((prev) => {
        const newRequests = [...prev.requests, requestInfo]
        const totalTime = newRequests.reduce((sum, r) => sum + r.duration, 0)

        // Détecter les patterns suspects (N+1)
        const suspiciousPatterns = detectSuspiciousPatterns(newRequests)

        // Requests les plus lentes
        const slowestRequests = [...newRequests]
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)

        return {
          totalRequests: newRequests.length,
          totalTime,
          requests: newRequests,
          slowestRequests,
          suspiciousPatterns,
        }
      })
    }

    return () => {
      // Restaurer l'état initial si besoin
    }
  }, [supabaseClient])

  return auditData
}

/**
 * Détecter les patterns N+1 et autres problèmes
 */
function detectSuspiciousPatterns(requests) {
  const patterns = []

  // Pattern 1 : Beaucoup de requêtes similaires en peu de temps
  const groupedByTable = {}
  requests.forEach((req) => {
    const key = req.table || 'unknown'
    groupedByTable[key] = (groupedByTable[key] || 0) + 1
  })

  for (const [table, count] of Object.entries(groupedByTable)) {
    if (count > 5) {
      patterns.push({
        type: 'POSSIBLE_N_PLUS_1',
        severity: count > 20 ? 'CRITICAL' : 'WARNING',
        message: `${count} requêtes sur la table "${table}" — possible N+1 ?`,
        count,
      })
    }
  }

  // Pattern 2 : Requête très lente
  requests.forEach((req) => {
    if (req.duration > 1000) {
      patterns.push({
        type: 'SLOW_QUERY',
        severity: 'WARNING',
        message: `Requête lente: ${req.table} (${req.duration.toFixed(0)}ms)`,
        duration: req.duration,
      })
    }
  })

  return patterns
}

/**
 * Composant d'affichage du Dashboard d'Audit
 */
export const AuditDashboard = ({ auditData, isVisible = true }) => {
  const [expandedRequest, setExpandedRequest] = useState(null)

  if (!isVisible) return null

  const avgDuration = auditData.totalRequests > 0 
    ? (auditData.totalTime / auditData.totalRequests).toFixed(2)
    : 0

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '500px',
        maxHeight: '600px',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        border: '2px solid #00d4ff',
        borderRadius: '8px 8px 0 0',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 12px rgba(0, 212, 255, 0.2)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #00d4ff',
          backgroundColor: '#0a0a0a',
          fontWeight: 'bold',
          color: '#00d4ff',
        }}
      >
        📊 Supabase Audit Dashboard
      </div>

      {/* Stats Summary */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #333',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ color: '#00d4ff', marginBottom: '4px' }}>Total Requêtes</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {auditData.totalRequests}
          </div>
        </div>
        <div>
          <div style={{ color: '#00d4ff', marginBottom: '4px' }}>Temps Total</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {auditData.totalTime.toFixed(0)}ms
          </div>
        </div>
        <div>
          <div style={{ color: '#00d4ff', marginBottom: '4px' }}>Temps Moyen</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {avgDuration}ms
          </div>
        </div>
        <div>
          <div style={{ color: '#00d4ff', marginBottom: '4px' }}>Problèmes</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {auditData.suspiciousPatterns.length}
          </div>
        </div>
      </div>

      {/* Suspicious Patterns */}
      {auditData.suspiciousPatterns.length > 0 && (
        <div
          style={{
            padding: '12px',
            borderBottom: '1px solid #333',
            backgroundColor: '#2a1a1a',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          <div style={{ color: '#ff6b6b', marginBottom: '8px', fontWeight: 'bold' }}>
            ⚠️ Problèmes Détectés
          </div>
          {auditData.suspiciousPatterns.map((pattern, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: '#1a0a0a',
                borderLeft: '3px solid #ff6b6b',
                color: pattern.severity === 'CRITICAL' ? '#ff4444' : '#ffaa44',
              }}
            >
              {pattern.type === 'POSSIBLE_N_PLUS_1' && `🔴 N+1: ${pattern.message}`}
              {pattern.type === 'SLOW_QUERY' && `🐢 ${pattern.message}`}
            </div>
          ))}
        </div>
      )}

      {/* Slowest Requests */}
      <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#00d4ff', marginBottom: '8px', fontWeight: 'bold' }}>
          🐢 Requêtes Les Plus Lentes
        </div>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {auditData.slowestRequests.map((req, idx) => (
            <div
              key={idx}
              onClick={() => setExpandedRequest(expandedRequest === idx ? null : idx)}
              style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: '#222',
                borderRadius: '4px',
                cursor: 'pointer',
                border: expandedRequest === idx ? '1px solid #00d4ff' : '1px solid #333',
                color: req.duration > 500 ? '#ff6b6b' : '#e0e0e0',
              }}
            >
              <div>
                <strong>{req.table}</strong> - {req.duration.toFixed(0)}ms{' '}
                {req.rowsReturned && `(${req.rowsReturned} rows)`}
              </div>
              {expandedRequest === idx && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#999',
                    backgroundColor: '#1a1a1a',
                    padding: '8px',
                    borderRadius: '3px',
                  }}
                >
                  <div>Type: {req.type}</div>
                  <div>Time: {new Date(req.timestamp).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* All Requests */}
      <div
        style={{
          padding: '12px',
          flex: 1,
          overflowY: 'auto',
          borderTop: '1px solid #333',
        }}
      >
        <div style={{ color: '#00d4ff', marginBottom: '8px', fontWeight: 'bold' }}>
          📋 Toutes les Requêtes ({auditData.requests.length})
        </div>
        <div style={{ fontSize: '11px', maxHeight: '200px', overflowY: 'auto' }}>
          {auditData.requests.slice(-20).map((req, idx) => (
            <div
              key={idx}
              style={{
                padding: '4px 8px',
                marginBottom: '4px',
                backgroundColor: req.type === 'ERROR' ? '#2a1a1a' : '#111',
                borderLeft: `3px solid ${
                  req.type === 'ERROR'
                    ? '#ff6b6b'
                    : req.duration > 500
                    ? '#ffaa44'
                    : '#44aa44'
                }`,
                color: req.type === 'ERROR' ? '#ff6b6b' : '#999',
              }}
            >
              {req.table || req.function} — {req.duration.toFixed(1)}ms
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour afficher/masquer le dashboard
 */
export const useAuditToggle = () => {
  const [isVisible, setIsVisible] = useState(false)

  // Toggle avec Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault()
        setIsVisible((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isVisible, setIsVisible }
}
