-- A folio is the number printed on one paper receipt, and the receipt book
-- never repeats it. Every line of that receipt shares it (a fee and its
-- recargo, several months paid together), so it can't be a plain unique.
--
-- Lines of one receipt are always written together in a single database
-- transaction (record_fee_payment, or one insert), and now() is fixed per
-- transaction, so they share created_at. That makes created_at the receipt's
-- identity here: a folio may repeat only among rows with the same created_at.
-- Soft-deleted rows free their folio; undoing the delete fails if it was
-- reused meanwhile.

create extension if not exists btree_gist with schema extensions;

alter table public.transactions
  add constraint transactions_folio_one_receipt
  exclude using gist (folio with =, created_at with <>)
  where (folio is not null and deleted_at is null);

comment on column public.transactions.folio is
  'Number of the paper receipt given to the resident. Shared by every line on that receipt, never by two receipts (transactions_folio_one_receipt).';
