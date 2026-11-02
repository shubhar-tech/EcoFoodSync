'use client';
import { useState } from 'react';
import { useApi, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

const FORMS = {
  donor: [
    ['name', 'Name'],
    ['donor_type', 'Type', 'select', ['RESTAURANT', 'SUPERMARKET', 'INDIVIDUAL', 'CATERER']],
    ['phone', 'Phone'],
    ['email', 'Email', 'email'],
    ['address', 'Address'],
  ],
  charity: [
    ['name', 'Name'],
    ['contact_person', 'Contact person'],
    ['phone', 'Phone'],
    ['email', 'Email', 'email'],
    ['location', 'Location'],
    ['district', 'District'],
    ['food_capacity', 'Food capacity (kg)', 'number'],
  ],
  volunteer: [
    ['name', 'Name'],
    ['phone', 'Phone'],
    ['email', 'Email', 'email'],
    ['current_location', 'Current location'],
  ],
};

export default function DirectoryPage() {
  const me = useMe();
  const dir = useApi('/api/directory');
  const [msg, setMsg] = useState(null);
  const [type, setType] = useState('donor');

  return (
    <>
      <h1>Directory</h1>
      <Notice msg={msg} />
      {dir.error && <Notice msg={{ type: 'err', text: dir.error }} />}

      {can(me, ['ADMIN']) && (
        <div className="card">
          <h2>Add a record</h2>
          <div className="row">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="donor">Donor</option>
                <option value="charity">Charity / NGO</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </Field>
          </div>
          <form
            key={type}
            className="form"
            onSubmit={(e) =>
              submitForm(e, { url: '/api/directory', extra: { type }, setMsg, okText: `${type} added`, onDone: dir.reload })
            }
          >
            {FORMS[type].map(([name, label, kind, options]) => (
              <Field key={name} label={label}>
                {kind === 'select' ? (
                  <select name={name} defaultValue={options[0]}>
                    {options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    name={name}
                    type={kind || 'text'}
                    required={name !== 'current_location'}
                    maxLength={kind === 'number' ? undefined : 500}
                    min={kind === 'number' ? 1 : undefined}
                  />
                )}
              </Field>
            ))}
            <button>Add</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Donors</h2>
        <Table
          rows={dir.data?.donors}
          rowKey="donor_id"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'donor_type', label: 'Type', render: (r) => <Badge value={r.donor_type} /> },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'address', label: 'Address' },
            { key: 'donor_rating', label: 'Rating' },
          ]}
        />
      </div>
      <div className="card">
        <h2>Charities / NGOs</h2>
        <Table
          rows={dir.data?.charities}
          rowKey="charity_id"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'contact_person', label: 'Contact' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'location', label: 'Location' },
            { key: 'district', label: 'District' },
            { key: 'food_capacity', label: 'Capacity (kg)' },
          ]}
        />
      </div>
      <div className="card">
        <h2>Volunteers</h2>
        <Table
          rows={dir.data?.volunteers}
          rowKey="volunteer_id"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'current_location', label: 'Location' },
            {
              key: 'availability_status',
              label: 'Available',
              render: (r) => <Badge value={r.availability_status ? 'Yes' : 'No'} />,
            },
          ]}
        />
      </div>
    </>
  );
}
