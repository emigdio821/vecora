-- The common area is an event terrace, not a hall. Table/column names keep
-- "hall" (internal only). Its category is seeded as "Tarifa de terraza" in
-- 20260924210000_treasury.sql.
comment on table public.hall_reservations is 'Bookings of the event terrace ("terraza"), one house per day.';
