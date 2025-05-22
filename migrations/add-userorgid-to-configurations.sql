-- Add userorgid column to configurations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'configurations'
        AND column_name = 'userorgid'
    ) THEN
        ALTER TABLE configurations ADD COLUMN userorgid TEXT;
        
        -- Create an index on userorgid for faster lookups
        CREATE INDEX idx_configurations_userorgid ON configurations(userorgid);
        
        -- Create a stored procedure to add the userorgid column
        CREATE OR REPLACE FUNCTION add_userorgid_to_configurations()
        RETURNS void AS $$
        BEGIN
            -- Function body is empty since we've already added the column
            RAISE NOTICE 'userorgid column added to configurations table';
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$;
