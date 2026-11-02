'use client';
import { useApi, Table, Notice } from '@/components/ui';

export default function AuditPage() {
  const { data, error } = useApi('/api/audit');
  return (
    <>
      <h1>Audit log</h1>
      <p className="muted">Admin only. Stored in MongoDB (collection audit_logs).</p>
      {error && <Notice msg={{ type: 'err', text: error }} />}
      <div className="card">
        <Table
          rows={data?.logs}
          rowKey="_id"
          columns={[
            { key: 'ts', label: 'Time', render: (r) => new Date(r.ts).toLocaleString() },
            { key: 'user', label: 'User' },
            { key: 'role', label: 'Role' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
            { key: 'details', label: 'Details', render: (r) => JSON.stringify(r.details) },
          ]}
        />
      </div>
    </>
  );
}
