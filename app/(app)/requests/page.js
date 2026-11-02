'use client';
import { useState } from 'react';
import { useApi, api, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

const STATUSES = ['OPEN', 'FULFILLED', 'CANCELLED'];

export default function RequestsPage() {
  const me = useMe();
  const requests = useApi('/api/requests');
  const dir = useApi('/api/directory');
  const [msg, setMsg] = useState(null);
  const canEdit = can(me, ['ADMIN', 'CHARITY']);

  async function changeStatus(id, status) {
    const r = await api(`/api/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setMsg(r.ok ? { type: 'ok', text: 'Request updated' } : { type: 'err', text: r.data?.error || 'Failed' });
    requests.reload();
  }

  return (
    <>
      <h1>Food requests</h1>
      <Notice msg={msg} />

      {canEdit && (
        <div className="card">
          <h2>Raise a request</h2>
          <form
            className="form"
            onSubmit={(e) =>
              submitForm(e, { url: '/api/requests', setMsg, okText: 'Request created', onDone: requests.reload })
            }
          >
            <Field label="Charity">
              <select name="charity_id" required defaultValue="">
                <option value="" disabled>Select charity</option>
                {dir.data?.charities.map((c) => (
                  <option key={c.charity_id} value={c.charity_id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Food type needed"><input name="required_food_type" required minLength={2} maxLength={100} placeholder="Cooked Food" /></Field>
            <Field label="Quantity (kg)"><input name="required_quantity" type="number" step="0.01" min="0.01" required /></Field>
            <Field label="Urgency">
              <select name="urgency_level" defaultValue="MEDIUM">
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
              </select>
            </Field>
            <button>Create request</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Requests (most urgent first)</h2>
        {requests.error && <Notice msg={{ type: 'err', text: requests.error }} />}
        <Table
          rows={requests.data?.rows}
          rowKey="request_id"
          columns={[
            { key: 'charity_name', label: 'Charity' },
            { key: 'required_food_type', label: 'Food needed' },
            { key: 'required_quantity', label: 'Kg' },
            { key: 'urgency_level', label: 'Urgency', render: (r) => <Badge value={r.urgency_level} /> },
            { key: 'request_time', label: 'Raised' },
            {
              key: 'status',
              label: 'Status',
              render: (r) =>
                canEdit ? (
                  <select value={r.status} onChange={(e) => changeStatus(r.request_id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <Badge value={r.status} />
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
