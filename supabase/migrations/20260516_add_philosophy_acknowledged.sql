-- Direct bookings via riaddisiena.com require guests to acknowledge both the
-- Philosophy page and the Disclaimer before submitting. We persist those
-- signals so that, if a guest later expresses disappointment about the
-- house's character or practical realities, we can see whether they
-- checked the boxes.
--
-- Note: the active bookings table in this project is `master_guests`.
ALTER TABLE master_guests
  ADD COLUMN IF NOT EXISTS philosophy_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS disclaimer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
