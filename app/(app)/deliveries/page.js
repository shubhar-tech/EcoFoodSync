'use client';
import { useState } from 'react';
import { useApi, api, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

const STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

export default function DeliveriesPage() {
  const me = useMe();
  const deliveries = useApi('/api/deliveries');
  const donations = useApi('/api/donations');
  const dir = useApi('/api/directory');
  const [msg, setMsg] = useState(null);
  const canUpdate = can(me, ['ADMIN', 'VOLUNTEER']);

  async function changeStatus(id, status) {
    const r = await api(`/api/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setMsg(r.ok ? { type: 'ok', text: 'Delivery updated' } : { type: 'err', text: r.data?.error || 'Failed' });
    deliveries.reload();
    dir.reload();
  }

  return (
    <>
      <h1>Deliveries</h1>
      <Notice msg={msg} />

      {can(me, ['ADMIN']) && (
        <div className="card">
          <h2>Assign a delivery</h2>
          <form
            className="form"
            onSubmit={(e) =>
              submitForm(e, {
                url: '/api/deliveries',
                setMsg,
                okText: 'Delivery assigned',
                onDone: () => { deliveries.reload(); dir.reload(); },
              })
            }
          >
            <Field label="Donation">
              <select name="donation_id" required defaultValue="">
                <option value="" disabled>Select donation</option>
                {donations.data?.rows.map((d) => (
                  <option key={d.donation_id} value={d.donation_id}>{d.food_name} — {d.location}</option>
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
            <Field label="Volunteer (available only)">
              <select name="volunteer_id" required defaultValue="">
                <option value="" disabled>Select volunteer</option>
                {dir.data?.volunteers
                  .filter((v) => v.availability_status)
                  .map((v) => (
                    <option key={v.volunteer_id} value={v.volunteer_id}>{v.name} — {v.current_location || 'n/a'}</option>
                  ))}
              </select>
            </Field>
            <Field label="Vehicle"><input name="vehicle_type" maxLength={100} placeholder="Van" /></Field>
            <Field label="Notes"><input name="delivery_notes" maxLength={500} /></Field>
            <button>Assign</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>All deliveries</h2>
        {deliveries.error && <Notice msg={{ type: 'err', text: deliveries.error }} />}
        <Table
          rows={deliveries.data?.rows}
          rowKey="delivery_id"
          columns={[
            { key: 'food_name', label: 'Food' },
            { key: 'quantity', label: 'Kg' },
            { key: 'donor_name', label: 'Donor' },
            { key: 'volunteer_name', label: 'Volunteer' },
            { key: 'charity_name', label: 'Charity' },
            { key: 'pickup_time', label: 'Pickup' },
            { key: 'delivery_time', label: 'Delivered' },
            {
              key: 'status',
              label: 'Status',
              render: (r) =>
                canUpdate ? (
                  <select value={r.status} onChange={(e) => changeStatus(r.delivery_id, e.target.value)}>
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
