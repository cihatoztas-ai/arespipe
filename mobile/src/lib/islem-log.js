// mobile/src/lib/islem-log.js
// AresPipe — islem_log yazım helper'ı (SED-72-09, 73. oturum)
//
// Saha akışındaki olayları islem_log tablosuna yazar.
// Web spool_detay.html zaman çizelgesi (İşlemler sekmesi) bu tablodan okur.
//
// Fire-and-forget: log yazımı başarısız olsa bile asıl iş akışı durmaz.
// Sadece console.warn ile not düşülür.

import { supabase } from './supabase'

/**
 * islem_log tablosuna kayıt at.
 * @param {object} params
 * @param {string} params.tenantId - tenant uuid
 * @param {string} params.spoolId  - spooller.id (uuid; NOT spool_id text!)
 * @param {string} [params.devreId] - devreler.id (opsiyonel, önerilir)
 * @param {string} [params.projeId] - projeler.id (opsiyonel)
 * @param {string} params.islem    - slug: is_basla | is_kapat | basamak_gec | not_ekle | foto_ekle
 * @param {string} [params.aciklama] - web zaman çizelgesinde gösterilen metin
 * @param {string} params.yapanId  - kullanicilar.id (operatör uuid)
 * @param {object} [params.meta]   - jsonb ek bilgi (rol, basamak, vs)
 */
export async function islemLogYaz(params) {
  const {
    tenantId, spoolId, devreId, projeId,
    islem, aciklama, yapanId, meta,
  } = params

  if (!tenantId || !spoolId || !islem || !yapanId) {
    console.warn('[islemLogYaz] eksik parametre, log yazılmadı:', { tenantId, spoolId, islem, yapanId })
    return
  }

  try {
    const { error } = await supabase
      .from('islem_log')
      .insert({
        tenant_id: tenantId,
        katman:    'spool',
        katman_id: spoolId,
        spool_id:  spoolId,
        devre_id:  devreId || null,
        proje_id:  projeId || null,
        islem,
        aciklama:  aciklama || null,
        yapan_id:  yapanId,
        meta:      meta || null,
      })

    if (error) {
      console.warn('[islemLogYaz] DB hatası (akış devam):', error)
    }
  } catch (e) {
    console.warn('[islemLogYaz] beklenmeyen hata (akış devam):', e)
  }
}
