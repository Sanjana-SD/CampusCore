import React, { useState } from 'react';
import StudentDashboard from './StudentDashboard';

export default function ParentDashboard({ profile, activeTab }) {
  const children = profile?.children || [];
  const [selectedChildId, setSelectedChildId] = useState(
    children.length > 0 ? children[0].id : ''
  );

  if (children.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-slate-500">
        No students currently linked to this parent account. Please contact administrative office.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child selector header if multiple children exist */}
      {children.length > 1 && (
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border border-blue-900/20">
          <span className="text-sm font-semibold text-slate-350">Select Child Portal:</span>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.first_name} {child.last_name} ({child.class_name || 'Class Unassigned'})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedChildId && (
        <StudentDashboard studentId={selectedChildId} activeTab={activeTab} />
      )}
    </div>
  );
}
