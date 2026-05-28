import React, { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import {
  getAuditLogs,
  getAuditMetrics,
  getAuditEnums,
  exportAuditCSV,
} from "../services/api";
import { saveAs } from "file-saver";

const PAGE_SIZE = 25;

const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    user_id: "",
    action: "",
    resource_type: "",
    date_from: "",
    date_to: "",
  });
  const [enums, setEnums] = useState({ actions: [], resourceTypes: [] });
  const [metrics, setMetrics] = useState({});
  const [exporting, setExporting] = useState(false);

  // Load enum choices (actions & resource types) once
  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const { data } = await getAuditEnums();
        setEnums(data);
      } catch (e) {
        console.error("Failed to load audit enums", e);
      }
    };
    fetchEnums();
  }, []);

  // Fetch logs whenever filters or page change
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, page_size: PAGE_SIZE, ...filters };
        const { data } = await getAuditLogs(params);
        setLogs(data.results);
        setTotal(data.count);
      } catch (e) {
        console.error("Failed to load audit logs", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    // Also fetch aggregate metrics for the same filter set
    const fetchMetrics = async () => {
      try {
        const { data } = await getAuditMetrics(filters);
        setMetrics(data);
      } catch (e) {
        console.error("Failed to load audit metrics", e);
      }
    };
    fetchMetrics();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ q: "", user_id: "", action: "", resource_type: "", date_from: "", date_to: "" });
    setPage(1);
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params = { ...filters };
      const response = await exportAuditCSV(params);
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
      const filename = `audit_log_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
      saveAs(blob, filename);
    } catch (e) {
      console.error("CSV export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { label: "Time (UTC)", accessor: (r) => new Date(r.timestamp).toLocaleString(undefined, { timeZone: "UTC", hour12: true }) + " UTC" },
    { label: "Actor", accessor: (r) => r.actor_username || "System" },
    { label: "Role", accessor: (r) => r.actor_role || "—" },
    { label: "Action", accessor: (r) => r.action },
    { label: "Resource", accessor: (r) => `${r.resource_type}/${r.resource_id}` },
    { label: "Details", accessor: (r) => (r.resource_repr?.length > 80 ? r.resource_repr.slice(0, 77) + "…" : r.resource_repr) },
    { label: "IP", accessor: (r) => r.ip_address || "—" },
    { label: "User Agent", accessor: (r) => (r.user_agent?.length > 30 ? r.user_agent.slice(0, 27) + "…" : r.user_agent) },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h1 className="title">Audit Log</h1>
        <p className="subtitle">
          Immutable, append‑only activity log. All actions are recorded with full attribution and JSON state diffs.
        </p>
      </div>

      {/* Filter Bar */}
      <section className="filter-bar glassmorphism">
        <div className="filter-row">
          <input
            type="text"
            name="q"
            placeholder="Search… (user, action, resource…)"
            value={filters.q}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <select name="action" value={filters.action} onChange={handleFilterChange} className="filter-select">
            <option value="">All Actions</option>
            {enums.actions?.map((a) => (
              <option key={a[0]} value={a[0]}>
                {a[1]}
              </option>
            ))}
          </select>
          <select name="resource_type" value={filters.resource_type} onChange={handleFilterChange} className="filter-select">
            <option value="">All Resources</option>
            {enums.resourceTypes?.map((r) => (
              <option key={r[0]} value={r[0]}>
                {r[1]}
              </option>
            ))}
          </select>
          <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="filter-input" />
          <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className="filter-input" />
          <button className="btn-primary" onClick={clearFilters}>
            Reset
          </button>
          <button className="btn-secondary" onClick={exportCSV} disabled={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </section>

      {/* Metrics */}
      {Object.keys(metrics).length > 0 && (
        <section className="metrics glassmorphism">
          <h2>Metrics</h2>
          <div className="metrics-grid">
            {Object.entries(metrics).map(([k, v]) => (
              <div key={k} className="metric-card">
                <strong>{k.replace(/_/g, " ")}</strong>
                <span>{typeof v === 'object' ? JSON.stringify(v) : v}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Table */}
      <section className="audit-table glassmorphism">
        {loading ? (
          <div className="loader">Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.label}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.label}>{c.accessor(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            ◀ Prev
          </button>
          <span>
            Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}
          </span>
          <button disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>
            Next ▶
          </button>
        </div>
      </section>

      {/* Scoped Styles – keep UI premium */}
      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        .title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, hsl(210, 70%, 60%), hsl(260, 70%, 65%));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle { color: var(--text-muted); font-size: 1rem; }
        .filter-bar,
        .metrics,
        .audit-table { background: rgba(255,255,255,0.07); backdrop-filter: blur(12px); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.12); }
        .filter-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
        .filter-input, .filter-select { padding: 0.6rem 0.9rem; border: none; border-radius: 0.5rem; background: rgba(255,255,255,0.1); color: #fff; min-width: 120px; }
        .filter-input::placeholder { color: #bbb; }
        .btn-primary, .btn-secondary { background: hsl(210,70%,55%); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: background 0.2s; }
        .btn-primary:hover { background: hsl(210,70%,45%); }
        .btn-secondary { background: hsl(260,45%,45%); }
        .btn-secondary:hover { background: hsl(260,45%,35%); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 1rem; }
        .metric-card { background: rgba(255,255,255,0.12); border-radius: 0.75rem; padding: 0.75rem; text-align: center; color: #fff; }
        .metric-card strong { display: block; font-size: 0.85rem; color: var(--text-muted); }
        table { width: 100%; border-collapse: separate; border-spacing: 0 0.5rem; }
        th { text-align: left; color: var(--text-muted); font-weight: 500; padding: 0.4rem 0.8rem; font-size: 0.9rem; }
        td { background: rgba(255,255,255,0.09); padding: 0.6rem 0.8rem; border-radius: 0.5rem; color: #fff; }
        tr:hover td { background: rgba(255,255,255,0.15); }
        .pagination { margin-top: 1rem; display: flex; justify-content: center; align-items: center; gap: 1rem; }
        .pagination button { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 0.3rem 0.8rem; border-radius: 0.4rem; cursor: pointer; }
        .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
        .loader { text-align: center; padding: 2rem; color: var(--text-muted); }
      `}</style>
    </Layout>
  );
};

export default AuditLogPage;