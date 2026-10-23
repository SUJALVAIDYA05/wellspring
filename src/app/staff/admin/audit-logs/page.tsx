"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../../staff.module.css";

interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function StaffAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    params.set("limit", "25");
    if (actionFilter) params.set("action", actionFilter);
    if (entityTypeFilter) params.set("entityType", entityTypeFilter);

    try {
      const res = await fetch(`/api/staff/audit-logs?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          setError("Forbidden: Audit logging access requires Administrator privileges.");
          return;
        }
        throw new Error("Failed to load audit logs");
      }

      const json = await res.json();
      setLogs(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch {
      setError("Unable to retrieve audit logs.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, actionFilter, entityTypeFilter]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>System Audit Trail</h1>
          <p className={styles.pageSubtitle}>
            Immutable audit logging with automated patient PII and credential redaction.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGrid} style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <div className={styles.filterGroup}>
            <label htmlFor="audit-action" className={styles.filterLabel}>
              Filter by Action
            </label>
            <input
              type="text"
              id="audit-action"
              placeholder="e.g. UPDATE_APPOINTMENT"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.input}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="audit-entity" className={styles.filterLabel}>
              Filter by Entity Type
            </label>
            <input
              type="text"
              id="audit-entity"
              placeholder="e.g. Appointment, Doctor"
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.input}
            />
          </div>

          <div className={styles.filterActions}>
            <button
              type="button"
              onClick={() => {
                setActionFilter("");
                setEntityTypeFilter("");
                setCurrentPage(1);
              }}
              className={styles.btnSecondary}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingBox}>
          <p>Loading audit trail entries…</p>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No audit log events recorded yet matching your filter.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Timestamp</th>
                <th className={styles.th}>Actor</th>
                <th className={styles.th}>Action</th>
                <th className={styles.th}>Entity Target</th>
                <th className={styles.th}>Redacted Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className={styles.tr}>
                  <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className={styles.td}>
                    {log.actor ? (
                      <div>
                        <strong>{log.actor.name}</strong>
                        <div className={styles.patientMeta}>
                          {log.actor.email} ({log.actor.role})
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>System / Anonymous</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${styles.badgeCompleted}`}>{log.action}</span>
                  </td>
                  <td className={styles.td}>
                    <strong>{log.entityType}</strong>
                    <div className={styles.patientMeta} style={{ fontFamily: "monospace" }}>
                      {log.entityId}
                    </div>
                  </td>
                  <td className={styles.td}>
                    {log.metadata ? (
                      <code
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#f1f5f9",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          display: "inline-block",
                          maxWidth: "340px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={JSON.stringify(log.metadata, null, 2)}
                      >
                        {JSON.stringify(log.metadata)}
                      </code>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total
              audit entries)
            </div>
            <div className={styles.pageNav}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={styles.btnSecondary}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className={styles.btnSecondary}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
