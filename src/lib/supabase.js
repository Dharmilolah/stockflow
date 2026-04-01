import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrctzpevpiqoexbqmrnv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yY3R6cGV2cGlxb2V4YnFtcm52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzI4NjYsImV4cCI6MjA5MDQ0ODg2Nn0.VqqEXZnuXzR-z4Sol8FfIn5RgbIUUi-rUDOQt857U1c'

export const supabase = createClient(supabaseUrl, supabaseKey)
