-- OPTIONAL. The sample donations in the main script have September 2026 expiry dates,
-- so the "available food" procedure (expiry_time > NOW()) returns nothing now.
-- This adds two fresh donations that expire later today / tomorrow.
USE ecofoodsync_db;

INSERT INTO food_donation
  (donor_id, food_name, food_type, quantity, preparation_time, expiry_time, food_condition, location, status)
VALUES
  ((SELECT donor_id FROM food_donor WHERE email = 'greenleaf@gmail.com' LIMIT 1),
   'Paneer Fried Rice', 'Cooked', 25.00,
   NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 8 HOUR, 'COOKED', 'Bangalore', 'AVAILABLE'),
  ((SELECT donor_id FROM food_donor WHERE email = 'freshmart@gmail.com' LIMIT 1),
   'Packaged Milk', 'Dairy', 40.00,
   NOW() - INTERVAL 2 HOUR, NOW() + INTERVAL 30 HOUR, 'PACKAGED', 'Mysore', 'AVAILABLE');
