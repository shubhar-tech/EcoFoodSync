import { randomUUID } from 'crypto';
import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { directorySchemas } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async () => {
  const [donors, charities, volunteers] = await Promise.all([
    q(`SELECT donor_id, name, donor_type, phone, email,
              location AS address, NULL AS donor_rating
         FROM food_donor ORDER BY name`),
    q(`SELECT charity_id, name, contact_person, phone, email,
              location, district, food_capacity
         FROM charity_or_ngo ORDER BY name`),
    q(`SELECT volunteer_id, name, phone, email,
              availability AS availability_status, current_location
         FROM volunteer ORDER BY name`),
  ]);

  return json({ donors, charities, volunteers });
});

const INSERTS = {
  donor: {
    table: 'food_donor',
    idCol: 'donor_id',
    cols: ['name', 'donor_type', 'phone', 'email', 'location'],
    inputCols: ['name', 'donor_type', 'phone', 'email', 'address'],
  },
  charity: {
    table: 'charity_or_ngo',
    idCol: 'charity_id',
    cols: ['name', 'contact_person', 'phone', 'email', 'location', 'district', 'food_capacity'],
    inputCols: ['name', 'contact_person', 'phone', 'email', 'location', 'district', 'food_capacity'],
  },
  volunteer: {
    table: 'volunteer',
    idCol: 'volunteer_id',
    cols: ['name', 'phone', 'email', 'current_location'],
    inputCols: ['name', 'phone', 'email', 'current_location'],
  },
};

export const POST = withAuth(['ADMIN'], async (req, session) => {
  const body = await readJson(req);
  const cfg = INSERTS[body?.type];

  if (!cfg) return json({ error: 'type must be donor, charity or volunteer' }, 400);

  const data = directorySchemas[body.type].parse(body);
  const id = randomUUID();
  const cols = [cfg.idCol, ...cfg.cols];
  const values = [id, ...cfg.inputCols.map((c) => data[c])];

  await q(
    `INSERT INTO ${cfg.table} (${cols.join(', ')})
     VALUES (${cols.map(() => '?').join(', ')})`,
    values
  );

  await audit(session, 'CREATE', cfg.table, id, { name: data.name });
  return json({ id }, 201);
});
