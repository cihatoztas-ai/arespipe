// api/devre-eslesme-yenile.js
// Terfi-yeniden-eşle (MK-127.4 / KARAR A1). 129. oturum (27 Mayıs 2026).
//
// SORUN (128 keşfi): devre_wizard_v3 drenajı İnceleme'de (taslak, spool YOK) çalışıyor.
//   Kanonik eşleştirici `spooller`'dan okuduğu için terfiden ÖNCE bağ kuramıyor; terfiden
//   SONRA yeniden-eşle olmadığı için izometri öksüz kalıyor → devre_detay "tam okumuyor".
//
// ÇÖZÜM (A1): terfiden sonra devrenin izometri kuyruk kayıtlarındaki MEVCUT parse_sonuc'tan
//   kanonik eslestir()'i RE-EŞLE modunda çağır. PDF yeniden indirme YOK, izometri-oku YOK,
//   AI YOK → $0. Artık spooller var → spool_id / montaj_json / cizim_durumu bağı yazılır.
//
// MK uyumu:
//   - MK-49.1: izometri-oku.js'e DOKUNULMAZ. PDF indirilmez.
//   - MK-126.8: yeni eşleştirme mantığı SIFIR — mevcut eslestir() import edilip çağrılır.
//   - MK-127.2: v2 (devre_wizard.html) izolasyonu korunur; bu endpoint v3'e bağlanır.
//   - eslestir() idempotent (cizim_durumu yükseltme filtreli) → tekrar çağrı spool bozmaz.
//   - eslestir() montaj/imalat ayrımını KENDİ yapar (okuJson.montaj dalı) → tek çağrı yeter.
//   - 117 (yukleyen_id) borcu A1'i ETKİLEMEZ: re-eşle parse_sonuc okur, PDF indirmez.
//
// Tetik: POST /api/devre-eslesme-yenile
//   Body: { devre_id: 'uuid' }  (zorunlu)
//
// Env (Vercel):
//   SUPABASE_URL            (zaten var)
//   SUPABASE_SERVICE_KEY    (RLS bypass — DB için zorunlu; NOT ROLE_KEY, MK-101.4)
//
// NOT: kuyruk-isle-excel.js / kuyruk-isle-izometri.js ile aynı auth deseni — pilot dönemde
//   public erişim (v3 flag arkasında + yalnız Demo Atölye). 102+ auth TODO (genel borç).

import { createClient } from '@supabase/supabase-js';
import { eslestir } from './kuyruk-isle-izometri.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_KEY;

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS (kuyruk-isle-excel.js deseni)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Yalnız POST' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: 'Sunucu yapılandırması eksik (SUPABASE_URL / SUPABASE_SERVICE_KEY)' });
  }

  const devreId = req.body?.devre_id;
  if (!devreId) {
    return res.status(400).json({ ok: false, error: 'devre_id zorunlu' });
  }

  const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // 1) Devrenin dökümanlarını çek (kuyrukta devre_id kolonu YOK; bağ devre_dokuman_id üzerinden).
    const { data: dokumanlar, error: dokErr } = await supa
      .from('devre_dokumanlari')
      .select('id')
      .eq('devre_id', devreId);

    if (dokErr) {
      return res.status(500).json({ ok: false, error: 'Doküman çekme hatası: ' + dokErr.message });
    }
    if (!dokumanlar || dokumanlar.length === 0) {
      return res.status(200).json({
        ok: true, devre_id: devreId, taranan: 0, eslesen_kayit: 0,
        toplam_spool_eslesen: 0, atlanan: 0, detay: [],
        not: 'Devrede doküman yok'
      });
    }
    const dokIds = dokumanlar.map(d => d.id);

    // 2) Bu dökümanların PARSE BAŞARILI izometri kuyruk kayıtlarını çek.
    //    durum oneri_hazir/manuel_onay = parse başarılı, parse_sonuc dolu (birIsIsle adım 5-6).
    const { data: isler, error: isErr } = await supa
      .from('dosya_isleme_kuyrugu')
      .select('id, devre_dokuman_id, durum, parse_sonuc')
      .in('devre_dokuman_id', dokIds)
      .eq('parser', 'izometri')
      .in('durum', ['oneri_hazir', 'manuel_onay'])
      .not('parse_sonuc', 'is', null);

    if (isErr) {
      return res.status(500).json({ ok: false, error: 'Kuyruk çekme hatası: ' + isErr.message });
    }

    // 3) Her kayıt için mevcut parse_sonuc'tan re-eşle (PDF/AI YOK).
    //    eslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId):
    //      - okuJson.montaj varsa montajEslestir'e yönlenir (kendi içinde)
    //      - değilse imalat: spoollar[] -> kabuk spool bindirme + cizim_durumu yükseltme
    //      - _eslesme özetini parse_sonuc'a kendi yazar
    let eslesenKayit = 0;
    let toplamSpoolEslesen = 0;
    let atlanan = 0;
    const detay = [];

    for (const is of (isler || [])) {
      const okuJson = is.parse_sonuc;
      const islenebilir = okuJson && (Array.isArray(okuJson.spoollar) || !!okuJson.montaj);
      if (!islenebilir) {
        atlanan++;
        detay.push({ kuyruk_id: is.id, durum: 'atlandi', sebep: 'parse_sonuc spoollar/montaj içermiyor' });
        continue;
      }
      try {
        const ozet = await eslestir(supa, devreId, is.id, okuJson, is.devre_dokuman_id);
        eslesenKayit++;
        const spoolEslesen = ozet?.eslesen || 0;   // imalat özeti; montajda undefined olabilir
        toplamSpoolEslesen += spoolEslesen;
        detay.push({
          kuyruk_id: is.id,
          dosya_adi: ozet?.dosya_adi || okuJson.dosya_adi || null,
          tip: okuJson.montaj ? 'montaj' : 'imalat',
          eslesen: ozet?.eslesen ?? null,
          atanmamis: ozet?.atanmamis ?? null,
          yukseltilen: ozet?.yukseltilen ?? null,
          bindirme_flag_sayisi: ozet?.bindirme_flag_sayisi ?? null
        });
      } catch (e) {
        // eslestir hatası veriyi bozmaz (kuyruk-isle'de de yutuluyor). Logla, devam et.
        console.error('[devre-eslesme-yenile] eslestir hatası (yutuldu):', e.message);
        atlanan++;
        detay.push({ kuyruk_id: is.id, durum: 'hata', sebep: e.message });
      }
    }

    return res.status(200).json({
      ok: true,
      devre_id: devreId,
      taranan: (isler || []).length,
      eslesen_kayit: eslesenKayit,
      toplam_spool_eslesen: toplamSpoolEslesen,
      atlanan,
      detay
    });
  } catch (e) {
    console.error('[devre-eslesme-yenile] genel hata:', e.message);
    return res.status(500).json({ ok: false, error: 'Sunucu hatası: ' + e.message });
  }
}
