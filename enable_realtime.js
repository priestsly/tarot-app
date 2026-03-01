
const { createClient } = require('@supabase/supabase-js');
// Need service role key to alter publication, but we only have anon key in .env.
// I will write a script to run via postgres if the user has connection string or I will ask the user.

