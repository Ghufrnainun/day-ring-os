-- Create generic entity_links table for scalable cross-entity relationships
CREATE TABLE IF NOT EXISTS entity_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('task', 'note', 'transaction')),
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('task', 'note', 'transaction')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_entity_links_source ON entity_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_target ON entity_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_user ON entity_links(user_id);

-- Enable RLS
ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own entity links"
  ON entity_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entity links"
  ON entity_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entity links"
  ON entity_links FOR DELETE
  USING (auth.uid() = user_id);

-- Migrate existing notes_task_links if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notes_task_links') THEN
    INSERT INTO entity_links (source_type, source_id, target_type, target_id, user_id, created_at)
    SELECT 'note', note_id, 'task', task_id, 
           (SELECT user_id FROM notes WHERE id = note_id LIMIT 1),
           created_at
    FROM notes_task_links
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
