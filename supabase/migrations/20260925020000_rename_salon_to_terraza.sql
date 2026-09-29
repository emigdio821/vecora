-- The common area is an event terrace, not a hall. Table/column names keep
-- "hall" (internal only); this fixes the one place the word reaches users.
update public.transaction_categories
   set name = 'Renta de terraza'
 where kind = 'income' and name = 'Renta de salón';

comment on table public.hall_reservations is 'Bookings of the event terrace ("terraza"), one house per day.';
