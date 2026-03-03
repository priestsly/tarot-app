const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
    const sql = `
        CREATE TABLE IF NOT EXISTS public.dilek_ozel_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        ALTER TABLE public.dilek_ozel_messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can read their own dilek messages" ON public.dilek_ozel_messages;
        CREATE POLICY "Users can read their own dilek messages" ON public.dilek_ozel_messages FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert their own dilek messages" ON public.dilek_ozel_messages;
        CREATE POLICY "Users can insert their own dilek messages" ON public.dilek_ozel_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    `;
    const { error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error('Error executing SQL:', error);
    } else {
        console.log('SQL executed successfully');
    }
}

setup();
