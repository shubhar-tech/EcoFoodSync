'use client';
import { useState } from 'react';
import { useApi, Table, Badge, Field, Notice, useMe, can, submitForm } from '@/components/ui';

export default function TrackingPage() {
  const me = useMe();
  const deliveries = useApi('/api/deliveries');
  const [deliveryId, setDeliveryId] = useState('');
  const events = useApi(deliveryId ? `/api/tracking?delivery_id=${deliveryId}` : '/api/auth/me');
  const [msg, setMsg] = useState(null);

  const list = deliveryId ? events.data?.events : null;

  return (
    <>
      <h1>Delivery tracking</h1>
      <p className="muted">Event timelines are stored as documents in MongoDB (collection delivery_events).</p>
      <Notice msg={msg} />

      <div className="card">
        <div className="row">
          <Field label="Delivery">
            <select value={deliveryId} onChange={(e) => setDeliveryId(e.target.value)}>
              <option value="">Select a delivery</option>
              {deliveries.data?.rows.map((d) => (
                <option key={d.delivery_id} value={d.delivery_id}>
                  {d.food_name} → {d.charity_name} ({d.status})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {deliveryId && can(me, ['ADMIN', 'VOLUNTEER']) && (
          <form
            className="form"
            style={{ marginBottom: 16 }}
            onSubmit={(e) =>
              submitForm(e, {
                url: '/api/tracking',
                extra: { delivery_id: deliveryId },
                setMsg,
                okText: 'Event logged',
                onDone: events.reload,
              })
            }
          >
            <Field label="Event">
              <select name="status" defaultValue="LOCATION_UPDATE">
                <option>LOCATION_UPDATE</option><option>PICKED_UP</option><option>IN_TRANSIT</option>
                <option>DELIVERED</option><option>DELAYED</option><option>ISSUE_REPORTED</option>
              </select>
            </Field>
            <Field label="Current location"><input name="location" required minLength={2} maxLength={255} /></Field>
            <Field label="Note"><input name="note" maxLength={500} /></Field>
            <button>Log event</button>
          </form>
        )}

        {deliveryId && events.error && <Notice msg={{ type: 'err', text: events.error }} />}
        {deliveryId && list && (list.length ? (
          <ul className="timeline">
            {list.map((ev) => (
              <li key={ev._id}>
                <Badge value={ev.status} /> <b>{ev.location}</b>
                {ev.note && <> — {ev.note}</>}
                <br />
                <small>{new Date(ev.ts).toLocaleString()} · {ev.recorded_by}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No events yet for this delivery.</p>
        ))}
      </div>
    </>
  );
}
