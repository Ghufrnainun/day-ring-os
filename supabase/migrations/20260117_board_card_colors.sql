-- Migration: Add color support to board cards
-- Enables Sticky Rice-style colorful cards

-- Add color column to board_cards
ALTER TABLE board_cards
ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT 'default';

-- Add comment for documentation
COMMENT ON COLUMN board_cards.color IS 'Card background color: default, yellow, green, blue, pink, orange, purple';

-- Create index for potential filtering by color
CREATE INDEX IF NOT EXISTS idx_board_cards_color ON board_cards(color);
