import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, AlertTriangle, Play, RefreshCw, Database } from 'lucide-react';
import { api } from '../utils/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDashboard({ liveScans, onNewScan }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState('');
  
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchAnalytics = async () => {
    try {
      const data = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // When a live scan happens, reload analytics to update counts
  useEffect(() => {
    if (liveScans.length > 0) {
      fetchAnalytics();
    }
  }, [liveScans]);

  const handleDispatch = async () => {
    setDispatching(true);
    setDispatchMsg('');
    try {
      const data = await api.post('/notifications/dispatch', {});
      setDispatchMsg(`Notifications completed. Emailed parents for ${data.dispatched_absentees.length} absentees.`);
      fetchAnalytics();
    } catch (err) {
      setDispatchMsg(`Error: ${err.message}`);
    } finally {
      setDispatching(false);
    }
  };

  const handleSyncSheet = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const data = await api.post('/admin/sync-sheet', {});
      setSyncMsg(data.message);
      fetchAnalytics();
    } catch (err) {
      setSyncMsg(`Sync Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const chartData = {
    labels: ['Present Today', 'Absent Today'],
    datasets: [
      {
        data: [analytics?.present_today || 0, analytics?.absent_today || 0],
        backgroundColor: ['rgba(34, 197, 94, 0.2)', 'rgba(239, 68, 68, 0.2)'],
        borderColor: ['#22c55e', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Institution-Wide Analytics</h2>
          <p className="text-sm text-slate-400">Real-time attendance rate metrics and stakeholder alerts</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={handleSyncSheet}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Database className="h-4 w-4 text-emerald-400" />
            <span>{syncing ? 'Syncing...' : 'Sync Google Sheet'}</span>
          </button>
          <button
            onClick={handleDispatch}
            disabled={dispatching}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{dispatching ? 'Running...' : 'Trigger Alerts'}</span>
          </button>
        </div>
      </div>

      {dispatchMsg && (
        <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-xl text-sm text-blue-400">
          {dispatchMsg}
        </div>
      )}

      {syncMsg && (
        <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl text-sm text-emerald-400">
          {syncMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ACTIVE STUDENTS</p>
            <p className="text-2xl font-bold mt-1">{analytics?.total_students}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">PRESENT TODAY</p>
            <p className="text-2xl font-bold mt-1">{analytics?.present_today}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">ABSENT TODAY</p>
            <p className="text-2xl font-bold mt-1">{analytics?.absent_today}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">MINIMUM REQUIRED %</p>
            <p className="text-2xl font-bold mt-1">{analytics?.absenteeism_threshold}%</p>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Alerts & Live Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Attendance Alerts */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span>Absenteeism Warnings (Below {analytics?.absenteeism_threshold}%)</span>
            </h3>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Class</th>
                    <th className="pb-3 font-semibold">Days Logged</th>
                    <th className="pb-3 font-semibold text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.alert_students?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500">
                        No students currently below threshold. Great!
                      </td>
                    </tr>
                  ) : (
                    analytics?.alert_students?.map((student) => (
                      <tr key={student.id} className="border-b border-slate-850 hover:bg-slate-900/20">
                        <td className="py-3 font-medium">{student.first_name} {student.last_name}</td>
                        <td className="py-3 text-slate-400">{student.class_name || 'Unassigned'}</td>
                        <td className="py-3 text-slate-400">{student.days_present} / {student.total_days}</td>
                        <td className="py-3 text-right font-bold text-rose-400">{student.attendance_pct}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Scan History */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4">
              Live Scanner Logs (Dual Gate Entry)
            </h3>
            <div className="overflow-y-auto max-h-80 space-y-3 pr-2">
              {liveScans.length === 0 && analytics?.recent_scans?.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No scans recorded today yet.</p>
              ) : (
                [...liveScans, ...(analytics?.recent_scans || [])].slice(0, 10).map((scan, idx) => {
                  const isIN = scan.type === 'IN' || scan.result === 'IN';
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isIN 
                          ? 'bg-emerald-950/10 border-emerald-900/30' 
                          : 'bg-indigo-950/10 border-indigo-900/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isIN ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {isIN ? 'IN' : 'OUT'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{scan.student_name || `${scan.first_name} ${scan.last_name}`}</p>
                          <p className="text-xs text-slate-400">{scan.class_name || 'Gate Terminal'}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Chart Summary */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
            <h3 className="text-base font-bold text-slate-200 mb-6 self-start">Today's Check-ins Ratio</h3>
            <div className="w-56 h-56">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            <div className="mt-6 flex space-x-8 text-center text-xs">
              <div>
                <p className="text-emerald-400 font-bold text-lg">{analytics?.present_today}</p>
                <p className="text-slate-400">Checked IN</p>
              </div>
              <div>
                <p className="text-rose-400 font-bold text-lg">{analytics?.absent_today}</p>
                <p className="text-slate-400">Absent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
