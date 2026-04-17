import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://ochvbepfiatzvyknkvsn.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jaHZiZXBmaWF0enZ5a25rdnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzc2MDIsImV4cCI6MjA5MDg1MzYwMn0.K4VQVQEC3V2dXyrFNYB8vi3cqNtwYDCGDWy_sAI_IEU'

export const supabase = createClient(SUPA_URL, SUPA_KEY)
