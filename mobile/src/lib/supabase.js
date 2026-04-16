import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://ochvbepfiatzvyknkvsn.supabase.co'
const SUPA_KEY = 'sb_publishable_82EjJYZH9phnFC1MlIxnwQ_92Ic-4eb'

export const supabase = createClient(SUPA_URL, SUPA_KEY)
