'use client';
import { useCallback, useEffect, useState } from 'react';

export async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  // Session expired -> back to login (but not for the login/register calls themselves)
  if (res.status === 401 && !url.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return { ok: res.ok, status: res.status, data };
}

export function useApi(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const r = await api(url);
    if (r.ok) {
      setData(r.data);
      setError('');
    } else {
      setError(r.data?.error || 'Request failed');
    }
    setLoading(false);
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load };
}

export function useMe() {
  const { data } = useApi('/api/auth/me');
  return data?.user ?? null;
}
export const can = (me, roles) => !!me && roles.includes(me.role);

export function Notice({ msg }) {
  if (!msg) return null;
  return <div className={`notice ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>;
}

export function Badge({ value }) {
  if (value === null || value === undefined) return '—';
  return <span className={`badge b-${String(value).toLowerCase()}`}>{String(value)}</span>;
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Table({ columns, rows, rowKey }) {
  if (!rows) return <p className="muted">Loading…</p>;
  if (!rows.length) return <p className="muted">No records found.</p>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey ? r[rowKey] : i}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Small helper so every page handles form submit the same way.
export async function submitForm(e, { url, method = 'POST', extra = {}, onDone, setMsg, okText }) {
  e.preventDefault();
  const form = e.currentTarget;
  const body = { ...Object.fromEntries(new FormData(form)), ...extra };
  const r = await api(url, { method, body: JSON.stringify(body) });
  if (r.ok) {
    setMsg({ type: 'ok', text: okText });
    form.reset();
    onDone && onDone();
  } else {
    setMsg({ type: 'err', text: r.data?.error || 'Request failed' });
  }
}
