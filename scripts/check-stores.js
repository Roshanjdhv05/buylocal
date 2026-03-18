import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStores() {
    try {
        const { data, error } = await supabase.from('stores').select('*').limit(5);
        if (error) {
            console.error('Error fetching stores:', error);
        } else {
            console.log('Stores found:', data.length);
            data.forEach(s => console.log(`- ${s.name} (${s.lat}, ${s.lng})`));
        }
    } catch (e) {
        console.error('Exception:', e.message);
    }
}

checkStores();
