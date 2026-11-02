import { z } from 'zod';

const id = z.string().length(36, 'Invalid id');
const dt = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/, 'Invalid date-time')
  .transform((s) => {
    const v = s.replace('T', ' ');
    return v.length === 16 ? `${v}:00` : v;
  });
const qty = z.coerce
  .number({ invalid_type_error: 'Must be a number' })
  .positive('Must be greater than 0')
  .max(100000, 'Too large');
const text = (min, max) =>
  z.string().trim().min(min, `At least ${min} characters`).max(max, `At most ${max} characters`);
const optionalText = (max) =>
  z.string().trim().max(max, `At most ${max} characters`).optional().transform((v) => v || null);
const phone = z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, 'Invalid phone number');
const email = z.string().trim().toLowerCase().email('Invalid email').max(255);

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username required').max(50),
  password: z.string().min(1, 'Password required').max(72),
});

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, digits, . _ - only'),
  email,
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .max(72, 'At most 72 characters')
    .regex(/[A-Za-z]/, 'Must contain a letter')
    .regex(/[0-9]/, 'Must contain a digit'),
  role: z.enum(['DONOR', 'CHARITY', 'VOLUNTEER']),
});

export const donationSchema = z
  .object({
    donor_id: id,
    food_name: text(2, 255),
    food_type: text(2, 100),
    quantity: qty,
    preparation_time: dt,
    expiry_time: dt,
    food_condition: z.enum(['FRESH', 'PACKAGED', 'PERISHABLE_FAST', 'COOKED']),
    location: text(2, 255),
    allergens: optionalText(200),
    storage_notes: optionalText(500),
  })
  .refine((d) => d.expiry_time > d.preparation_time, {
    message: 'Expiry time must be after preparation time',
    path: ['expiry_time'],
  });

export const allocationSchema = z.object({
  donation_id: id,
  charity_id: id,
  allocated_quantity: qty,
});
export const allocationStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
});

export const requestSchema = z.object({
  charity_id: id,
  required_food_type: text(2, 100),
  required_quantity: qty,
  urgency_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
export const requestStatusSchema = z.object({
  status: z.enum(['OPEN', 'FULFILLED', 'CANCELLED']),
});

export const deliverySchema = z.object({
  donation_id: id,
  volunteer_id: id,
  charity_id: id,
  vehicle_type: optionalText(100),
  delivery_notes: optionalText(500),
});
export const deliveryStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  note: optionalText(500),
});

export const eventSchema = z.object({
  delivery_id: id,
  status: z.enum(['LOCATION_UPDATE', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'ISSUE_REPORTED']),
  location: text(2, 255),
  note: optionalText(500),
});

export const directorySchemas = {
  donor: z.object({
    name: text(2, 255),
    donor_type: z.enum(['RESTAURANT', 'SUPERMARKET', 'INDIVIDUAL', 'CATERER', 'OTHER']),
    phone,
    email,
    address: text(2, 500),
  }),
  charity: z.object({
    name: text(2, 255),
    contact_person: text(2, 150),
    phone,
    email,
    location: text(2, 255),
    district: text(2, 150),
    food_capacity: z.coerce.number().int('Whole number').positive('Must be greater than 0').max(1000000),
  }),
  volunteer: z.object({
    name: text(2, 255),
    phone,
    email,
    current_location: optionalText(255),
  }),
};
