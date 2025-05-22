-- Create a function to add the userorgid column
CREATE OR REPLACE FUNCTION add_userorgid_column()
RETURNS void AS $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transports' 
        AND column_name = 'userorgid'
    ) THEN
        -- Add the column
        ALTER TABLE transports ADD COLUMN userorgid TEXT;
        
        -- Set a default value for existing records
        UPDATE transports SET userorgid = '4321' WHERE userorgid IS NULL;
        
        -- Create an index for faster queries
        CREATE INDEX IF NOT EXISTS idx_transports_userorgid ON transports(userorgid);
    END IF;
END;
$$ LANGUAGE plpgsql;
