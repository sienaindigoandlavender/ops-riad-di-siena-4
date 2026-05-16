-- Direct bookings via riaddisiena.com require guests to acknowledge the
-- Philosophy page before submitting. We persist that signal so that, if a
-- guest later expresses disappointment about the house's character, we
-- can see whether they checked the box.
--
-- Note: the active bookings table in this project is `master_guests`.
ALTER TABLE master_guests
  ADD COLUMN IF NOT EXISTS philosophy_acknowledged BOOLEAN NOT NULL DEFAULT FALSE;
