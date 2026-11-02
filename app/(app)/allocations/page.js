'use client';
import { useState } from 'react';
import { useApi, api, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

export default function AllocationsPage() {
  const me = useMe();
  const alloc = useApi('/api/allocations');
  const donations = useApi('/api/donations');
  const dir = useApi('/api/directory');
  const [msg, setMsg] = useState(null);
  const isAdmin = can(me, ['ADMIN']);

  async function changeStatus(id, status) {
    const r = await api(`/api/allocations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setMsg(r.ok ? { type: 'ok', text: 'Status updated' } : { type: 'err', text: r.data?.error || 'Failed' });
    alloc.reload();
  }

  return (
    <>
      <h1>Allocations</h1>
      <Notice msg={msg} />

      {isAdmin && (
        <div className="card">
          <h2>Allocate food to a charity</h2>
          <p className="muted">Trying to allocate more than the remaining quantity is rejected by the database trigger.</p>
          <form
            className="form"
            onSubmit={(e) =>
              submitForm(e, {
                url: '/api/allocations',
                setMsg,
                okText: 'Allocation created',
                onDone: () => { alloc.reload(); donations.reload(); },
              })
            }
          >
            <Field label="Donation">
              <select name="donation_id" required defaultValue="">
                <option value="" disabled>Select donation</option>
                {donations.data?.rows.map((d) => (
                  <option key={d.donation_id} value={d.donation_id}>
                    {d.food_name} ({d.remaining_quantity} kg left)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Charity">
              <select name="charity_id" required defaultValue="">
                <option value="" disabled>Select charity</option>
                {dir.data?.charities.map((c) => (
                  <option key={c.charity_id} value={c.charity_id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity (kg)"><input name="allocated_quantity" type="number" step="0.01" min="0.01" required /></Field>
            <button>Allocate</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Allocations</h2>
        {alloc.error && <Notice msg={{ type: 'err', text: alloc.error }} />}
        <Table
          rows={alloc.data?.rows}
          rowKey="allocation_id"
          columns={[
            { key: 'food_name', label: 'Food' },
            { key: 'charity_name', label: 'Charity' },
            { key: 'allocated_quantity', label: 'Kg' },
            { key: 'allocation_time', label: 'Time' },
            {
              key: 'status',
              label: 'Status',
              render: (r) =>
                isAdmin ? (
                  <select value={r.status} onChange={(e) => changeStatus(r.allocation_id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <Badge value={r.status} />
                ),
            },
          ]}
        />
      </div>

      <div className="card">
        <h2>Donation allocation summary <small className="muted">(stored procedure GetDonationAllocationSummary)</small></h2>
        <Table
          rows={alloc.data?.summary}
          rowKey="donation_id"
          columns={[
            { key: 'food_name', label: 'Food' },
            { key: 'donated_quantity', label: 'Donated kg' },
            { key: 'allocated_quantity', label: 'Allocated kg' },
            { key: 'remaining_quantity', label: 'Remaining kg' },
          ]}
        />
      </div>
    </>
  );
}
