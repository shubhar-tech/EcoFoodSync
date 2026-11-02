'use client';
import { useApi, Table, Badge, Notice } from '@/components/ui';

export default function Dashboard() {
  const { data, error } = useApi('/api/stats');
  const c = data?.counts;

  return (
    <>
      <h1>Dashboard</h1>
      {error && <Notice msg={{ type: 'err', text: error }} />}
      <div className="grid stats">
        <div className="stat"><b>{c?.donations ?? '–'}</b><span>Donations</span></div>
        <div className="stat"><b>{c?.available ?? '–'}</b><span>Available now</span></div>
        <div className="stat"><b>{c?.total_kg ?? '–'}</b><span>Total kg donated</span></div>
        <div className="stat"><b>{c?.charities ?? '–'}</b><span>Charities</span></div>
        <div className="stat"><b>{c?.volunteers ?? '–'}</b><span>Volunteers</span></div>
        <div className="stat"><b>{c?.open_requests ?? '–'}</b><span>Open requests</span></div>
      </div>

      <div className="card">
        <h2>Active deliveries <small className="muted">(MySQL view vw_active_deliveries)</small></h2>
        <Table
          rows={data?.active}
          rowKey="delivery_id"
          columns={[
            { key: 'food_name', label: 'Food' },
            { key: 'quantity', label: 'Kg' },
            { key: 'recipient_charity', label: 'Charity' },
            { key: 'volunteer_name', label: 'Volunteer' },
            { key: 'volunteer_phone', label: 'Phone' },
            { key: 'delivery_status', label: 'Status', render: (r) => <Badge value={r.delivery_status} /> },
            { key: 'pickup_time', label: 'Pickup' },
          ]}
        />
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Top donors <small className="muted">(GROUP BY)</small></h2>
          <Table
            rows={data?.topDonors}
            columns={[
              { key: 'donor_name', label: 'Donor' },
              { key: 'total_quantity', label: 'Total kg' },
            ]}
          />
        </div>
        <div className="card">
          <h2>Delivery events by status <small className="muted">(MongoDB aggregation)</small></h2>
          {data && !data.mongo ? (
            <p className="muted">MongoDB not reachable.</p>
          ) : (
            <Table
              rows={data?.mongo?.eventsByStatus}
              columns={[
                { key: '_id', label: 'Status', render: (r) => <Badge value={r._id} /> },
                { key: 'count', label: 'Events' },
              ]}
            />
          )}
          <h2 style={{ marginTop: 16 }}>Most common allergens <small className="muted">($unwind + $group)</small></h2>
          {data?.mongo && (
            <Table
              rows={data.mongo.topAllergens}
              columns={[
                { key: '_id', label: 'Allergen' },
                { key: 'count', label: 'Donations' },
              ]}
            />
          )}
        </div>
      </div>
    </>
  );
}
