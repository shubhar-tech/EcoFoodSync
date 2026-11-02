'use client';
import { useState } from 'react';
import { useApi, api, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

export default function DonationsPage() {
  const me = useMe();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const donations = useApi(`/api/donations?q=${encodeURIComponent(q)}`);
  const dir = useApi('/api/directory');
  const [msg, setMsg] = useState(null);
  const [loc, setLoc] = useState('');
  const [avail, setAvail] = useState(null);

  async function checkLocation(e) {
    e.preventDefault();
    const r = await api(`/api/donations/available?location=${encodeURIComponent(loc)}`);
    if (r.ok) {
      setAvail(r.data.rows);
      setMsg(null);
    } else {
      setAvail(null);
      setMsg({ type: 'err', text: r.data?.error || 'Failed' });
    }
  }

  return (
    <>
      <h1>Donations</h1>
      <Notice msg={msg} />

      {can(me, ['ADMIN', 'DONOR']) && (
        <div className="card">
          <h2>Add a donation</h2>
          <form
            className="form"
            onSubmit={(e) =>
              submitForm(e, { url: '/api/donations', setMsg, okText: 'Donation added', onDone: donations.reload })
            }
          >
            <Field label="Donor">
              <select name="donor_id" required defaultValue="">
                <option value="" disabled>Select donor</option>
                {dir.data?.donors.map((d) => (
                  <option key={d.donor_id} value={d.donor_id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Food name"><input name="food_name" required minLength={2} maxLength={255} /></Field>
            <Field label="Food type"><input name="food_type" required minLength={2} maxLength={100} placeholder="Cooked, Bakery…" /></Field>
            <Field label="Quantity (kg)"><input name="quantity" type="number" step="0.01" min="0.01" required /></Field>
            <Field label="Prepared at"><input name="preparation_time" type="datetime-local" required /></Field>
            <Field label="Expires at"><input name="expiry_time" type="datetime-local" required /></Field>
            <Field label="Condition">
              <select name="food_condition" defaultValue="COOKED">
                <option>FRESH</option><option>PACKAGED</option><option>PERISHABLE_FAST</option><option>COOKED</option>
              </select>
            </Field>
            <Field label="Pickup location"><input name="location" required minLength={2} maxLength={255} placeholder="Bangalore" /></Field>
            <Field label="Allergens (comma separated)"><input name="allergens" maxLength={200} placeholder="nuts, gluten" /></Field>
            <Field label="Storage notes"><input name="storage_notes" maxLength={500} /></Field>
            <button>Add donation</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Available food by location <small className="muted">(stored procedure GetAvailableFoodByLocation)</small></h2>
        <form className="row" onSubmit={checkLocation}>
          <Field label="Location"><input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Bangalore" required minLength={2} /></Field>
          <button>Check</button>
        </form>
        {avail && (
          <Table
            rows={avail}
            rowKey="donation_id"
            columns={[
              { key: 'food_name', label: 'Food' },
              { key: 'food_type', label: 'Type' },
              { key: 'quantity', label: 'Kg' },
              { key: 'food_condition', label: 'Condition' },
              { key: 'expiry_time', label: 'Expires' },
              { key: 'location', label: 'Location' },
            ]}
          />
        )}
      </div>

      <div className="card">
        <h2>All donations</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); setQ(search); }}>
          <Field label="Search food name (full-text)"><input value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} /></Field>
          <button>Search</button>
          {q && <button type="button" onClick={() => { setSearch(''); setQ(''); }}>Clear</button>}
        </form>
        {donations.error && <Notice msg={{ type: 'err', text: donations.error }} />}
        <Table
          rows={donations.data?.rows}
          rowKey="donation_id"
          columns={[
            { key: 'food_name', label: 'Food' },
            { key: 'donor_name', label: 'Donor' },
            { key: 'quantity', label: 'Kg' },
            { key: 'remaining_quantity', label: 'Remaining kg' },
            { key: 'food_condition', label: 'Condition' },
            { key: 'expiry_time', label: 'Expires' },
            { key: 'location', label: 'Location' },
            { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
            { key: 'allergens', label: 'Allergens (Mongo)' },
          ]}
        />
      </div>
    </>
  );
}
