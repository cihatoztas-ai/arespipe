import { supabase } from './supabase'

export async function getOturum() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  
  const { data: kullanici } = await supabase
    .from('kullanicilar')
    .select('id, ad_soyad, rol, tenant_id')
    .eq('id', session.user.id)
    .single()
    
  return kullanici
}

export async function getTenantId() {
  const oturum = await getOturum()
  return oturum?.tenant_id ?? null
}

export async function cikisYap() {
  await supabase.auth.signOut()
  window.location.href = '/mobile/'
}
