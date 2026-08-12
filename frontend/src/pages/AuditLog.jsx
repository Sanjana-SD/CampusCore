import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Database, ShieldCheck, ShieldAlert, RefreshCw, FileText } from 'lucide-react';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [integrityValid, setIntegrityValid] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/admin/audit-log');
      setLogs(data.audit_logs);
      setIntegrityValid(data.integrity_valid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Immutable Audit Trail</h2>
          <p className="text-sm text-slate-400">Append-only, hash-chained logs verifying system state integrity</p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Verify Integrity</span>
        </button>
      </div>

      {/* Integrity Badge Header */}
      <div className={`p-5 rounded-2xl flex items-center justify-between border ${
        integrityValid 
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
          : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
      }`}>
        <div className="flex items-center space-x-3">
          {integrityValid ? (
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-rose-400" />
          )}
          <div>
            <h3 className="font-bold text-base">
              {integrityValid ? 'Hash Chain Verified' : 'INTEGRITY VERIFICATION FAILED'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {integrityValid 
                ? 'Every row SHA-256 matches the mathematical chain linkage back to the system genesis block.' 
                : 'Warning! The hash chain has been severed or a row has been tampered with offline!'}
            </p>
          </div>
        </div>

        <div className="text-xs px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 font-bold tracking-wider">
          {integrityValid ? 'SECURE' : 'COMPROMISED'}
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Row ID</th>
                <th className="pb-3 font-semibold">Action Event</th>
                <th className="pb-3 font-semibold">Data Payload</th>
                <th className="pb-3 font-semibold">Previous Hash Link</th>
                <th className="pb-3 font-semibold text-right">Row SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-slate-500">
                    No audit logs logged in database.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-850 hover:bg-slate-900/20 text-xs">
                    <td className="py-4 font-mono font-bold text-slate-400">#{log.id}</td>
                    <td className="py-4 font-semibold text-slate-300">{log.action_type}</td>
                    <td className="py-4 max-w-xs truncate text-slate-400 font-mono" title={JSON.stringify(log.payload)}>
                      {JSON.stringify(log.payload)}
                    </td>
                    <td className="py-4 font-mono text-slate-500 text-[10px]" title={log.previous_hash}>
                      {log.previous_hash.substring(0, 12)}...
                    </td>
                    <td className="py-4 text-right font-mono text-blue-400 text-[10px]" title={log.row_hash}>
                      {log.row_hash.substring(0, 12)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
