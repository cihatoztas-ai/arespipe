// =====================================================================
// api/izometri-oku.js -- Vercel Serverless Function (Node.js)
// =====================================================================
// Tarih: 28 Nisan 2026 -- 38. oturum (Pre-A.1 + Pre-A.2 eklendi)
// Mimari kararlar: K1-K6 (36) + K11 (37 -- guvenlik)
//   - K3: 7 maddeli halusinasyon koruması (DB seviyesinde)
//   - K4: Yaklasim Y -- AI sadece yazili olani okur, hesap kod tarafinda
//   - K5: Sifirdan yazildi (eski izometri-oku.js atildi)
//   - K11/37: PDF guvenlik + prompt injection iki katmanli koruma
//     - Pre-A.1: magic byte + boyut + uzanti (Anthropic kredisi yanmadan once erken don)
//     - Pre-A.2: schema validation + suspicious keyword scan (madde 8 olarak halusinasyon filtresine entegre)
//
// Sozlesme:
//   POST /api/izometri-oku
//   Body: { tenant_id, kullanici_id, batch_id|null, pdf_base64,
//           dosya_adi, dosya_sirasi, dosya_toplami }
//   Response: { ok, batch_id, format, spool_sayisi, manuel_onay_sayisi, spoollar[] }
//
// Akis (8 adim):
//   1. Validasyon + auth
//   2. Batch ya yeni acilir (sira=1) ya mevcut bulunur
//   3. Format dispatcher: izometri_format_tanimlari'nda fingerprint ara
//   4. Format bulundu + parser_kural dolu -> L1/L2 parse (bu surumde devre disi, 38'de)
//   5. Format bulunamadi VEYA parser_kural bos -> L3 Vision AI (Yaklasim Y)
//   6. ASME helper (boru_olculer) ile eksik et/cap doldur
//   7. 7 maddeli halusinasyon filtresi
//   8. izometri_batch_kayitlari + ai_api_log INSERT/UPDATE
//
// =====================================================================

export const config = { maxDuration: 60 };

// ARES_BORU helper'i import et (ASME B36.10/B36.19/EEMUA-144 in-memory veri)
// Dosya IIFE pattern'inde ve globalThis.ARES_BORU = api yapiyor.
// Side-effect import (modul calistirilir) + globalThis'ten erisim.
import '../ares-asme.js';
const ARES_BORU = globalThis.ARES_BORU;

if (!ARES_BORU) {
  console.error('[izometri-oku] UYARI: ARES_BORU yuklenemedi -- helper fallback devre disi.');
}

// ---------------------------------------------------------------------
// 1. SETUP & CONSTANTS
// ---------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_KEY;

// Modeller (env ile override edilebilir)
const VISION_MODEL = process.env.ANTHROPIC_VISION_MODEL || 'claude-sonnet-4-5';
const TEXT_MODEL   = process.env.ANTHROPIC_TEXT_MODEL   || 'claude-haiku-4-5-20251001';

// Maliyet hesabi (USD per 1M token, Anthropic pricing 2026)
// Sonnet 4.5: input $3, output $15
// Haiku 4.5:  input $0.80, output $4
const MODEL_PRICING = {
  'claude-sonnet-4-5':         { input: 3.00, output: 15.00 },
  'claude-sonnet-4-6':         { input: 3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-opus-4-7':           { input: 15.00, output: 75.00 },
};

// Halusinasyon filtresi sabitleri
const MIN_GUVEN_SKORU = 0.70;
const MAX_BOY_MM      = 50000;
const MIN_DN          = 6;
const MAX_DN          = 1200;

// Spool durum kodlari (izometri_batch_kayitlari.sonuc_json icinde)
const DURUM_HAZIR        = 'hazir';
const DURUM_MANUEL_ONAY  = 'manuel_onay';
const DURUM_HATA         = 'hata';

// ---------------------------------------------------------------------
// 2. ANA HANDLER
// ---------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const baslangic = Date.now();

  try {
    // --- 2.1 Validasyon ---
    const {
      tenant_id, kullanici_id, batch_id: batchIdGiris,
      pdf_base64, dosya_adi, dosya_sirasi, dosya_toplami,
    } = req.body || {};

    if (!tenant_id)    return res.status(400).json({ error: 'tenant_id zorunlu' });
    if (!kullanici_id) return res.status(400).json({ error: 'kullanici_id zorunlu' });
    if (!pdf_base64)   return res.status(400).json({ error: 'pdf_base64 zorunlu' });
    if (!dosya_adi)    return res.status(400).json({ error: 'dosya_adi zorunlu' });
    if (!dosya_sirasi || dosya_sirasi < 1)
      return res.status(400).json({ error: 'dosya_sirasi 1 veya buyuk olmali' });
    if (!dosya_toplami || dosya_toplami < 1)
      return res.status(400).json({ error: 'dosya_toplami 1 veya buyuk olmali' });

    if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' });
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Supabase env eksik' });

    // --- 2.1.b PDF YAPISAL GUVENLIK (K11/37 -- Pre-A.1) ---
    // Uzanti, boyut ve magic byte kontrolu. Anthropic kredisi yanmadan once erken don.

    // (a) Uzanti kontrolu (case-insensitive)
    if (!/\.pdf$/i.test(dosya_adi)) {
      return res.status(400).json({ error: 'Sadece PDF dosyalari kabul ediliyor (uzanti kontrolu)' });
    }

    // (b) Boyut limiti -- 5MB PDF ~= 6.7MB base64. 7MB sinir guvenli.
    const MAX_BASE64_LEN = 7 * 1024 * 1024;
    if (pdf_base64.length > MAX_BASE64_LEN) {
      const mb = (pdf_base64.length / 1024 / 1024).toFixed(1);
      return res.status(400).json({ error: `PDF cok buyuk (${mb}MB > 7MB base64 limit, ~5MB PDF)` });
    }

    // (c) Magic byte -- base64 decode edilen ilk 4 byte "%PDF" olmali
    try {
      const ilk_4_byte = Buffer.from(pdf_base64.substring(0, 8), 'base64').toString('ascii', 0, 4);
      if (ilk_4_byte !== '%PDF') {
        return res.status(400).json({ error: 'PDF formatinda degil (magic byte uyusmadi)' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'PDF base64 cozumlenemedi: ' + e.message });
    }

    console.log('[izometri-oku] Baslat:', { dosya_adi, dosya_sirasi, dosya_toplami, batch: batchIdGiris });

    // --- 2.2 Batch acma veya bulma ---
    let batch_id = batchIdGiris;
    if (!batch_id) {
      // Yeni batch -- ilk dosya gonderildi
      batch_id = await batchOlustur({ tenant_id, kullanici_id, dosya_adi, dosya_toplami });
      if (!batch_id) return res.status(500).json({ error: 'Batch olusturulamadi' });
      console.log('[izometri-oku] Yeni batch acildi:', batch_id);
    } else {
      // Mevcut batch'e dosya ekle
      await batchDosyaEkle({ batch_id, dosya_adi });
    }

    // --- 2.3 Format dispatcher ---
    const formatBilgisi = await formatTani({ pdf_base64, dosya_adi, tenant_id });
    console.log('[izometri-oku] Format taraması:', formatBilgisi.kaynak, formatBilgisi.format_id || '(yok)');

    // --- 2.4 Parser secimi ---
    let parseSonuc;
    if (formatBilgisi.format_id && formatBilgisi.parser_kural && Object.keys(formatBilgisi.parser_kural).length > 0) {
      // L1/L2 -- format-spesifik parser (38'de aktif)
      // Su an parser_kural'lar bos, bu dal calismayacak
      parseSonuc = await parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi });
    } else {
      // L3 -- Vision AI (Yaklasim Y)
      parseSonuc = await visionAIParse({
        pdf_base64, dosya_adi, formatBilgisi,
        tenant_id, kullanici_id, batch_id,
      });
    }

    if (!parseSonuc.ok) {
      await batchHataYaz({ batch_id, hata: parseSonuc.error });
      return res.status(parseSonuc.http_status || 500).json({ error: parseSonuc.error });
    }

    // --- 2.5 ASME helper -- eksik et/cap doldurma ---
    const zenginlestirilmis = await asmeFallbackDoldur(parseSonuc.spoollar);

    // --- 2.6 Halusinasyon filtresi (7 madde) ---
    const filtreliSpoollar = await halusinasyonFiltresi({
      spoollar: zenginlestirilmis,
      dosya_adi,
    });

    // --- 2.7 DB yazimi -- batch sonuclarini guncelle ---
    await batchSonucBirlestir({
      batch_id,
      yeni_spoollar: filtreliSpoollar,
      format_id: formatBilgisi.format_id,
      dosya_adi,
      dosya_sirasi,
      dosya_toplami,
    });

    // --- 2.8 Yanit ---
    const sure_ms = Date.now() - baslangic;
    const ozet = {
      ok: true,
      batch_id,
      format: formatBilgisi.format_adi || null,
      format_id: formatBilgisi.format_id || null,
      dosya_adi,
      dosya_sirasi,
      dosya_toplami,
      spool_sayisi: filtreliSpoollar.length,
      manuel_onay_sayisi: filtreliSpoollar.filter(s => s.durum === DURUM_MANUEL_ONAY).length,
      hazir_sayisi: filtreliSpoollar.filter(s => s.durum === DURUM_HAZIR).length,
      sure_ms,
      spoollar: filtreliSpoollar,
    };

    console.log('[izometri-oku] Tamamlandi:', dosya_adi, ozet.spool_sayisi, 'spool,', sure_ms, 'ms');
    return res.status(200).json(ozet);

  } catch (e) {
    console.error('[izometri-oku] Beklenmedik hata:', e);
    return res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 500) });
  }
}

// =====================================================================
// 3. SUPABASE HELPERS
// =====================================================================

async function supaFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {}),
  };
  const fetchOpts = { method: options.method || 'GET', headers };
  if (options.body) fetchOpts.body = JSON.stringify(options.body);

  const res = await fetch(url, fetchOpts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = text; }

  if (!res.ok) {
    console.error('[supaFetch] hata:', path, res.status, data);
    throw new Error(`Supabase ${res.status}: ${typeof data === 'string' ? data : data?.message || 'bilinmeyen'}`);
  }
  return data;
}

async function batchOlustur({ tenant_id, kullanici_id, dosya_adi, dosya_toplami }) {
  const data = await supaFetch('izometri_batch_kayitlari', {
    method: 'POST',
    body: {
      tenant_id, kullanici_id,
      dosya_sayisi: dosya_toplami,
      dosyalar: [{ ad: dosya_adi, sira: 1, durum: 'parse_ediliyor' }],
      format_durumu: 'taraniyor',
      durum: 'parse_ediliyor',
      baslangic_at: new Date().toISOString(),
    },
  });
  return data?.[0]?.id || null;
}

async function batchDosyaEkle({ batch_id, dosya_adi }) {
  // Mevcut dosyalar listesini cek, ekle, geri yaz
  const mevcut = await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}&select=dosyalar`);
  const dosyalar = mevcut?.[0]?.dosyalar || [];
  const yeniSira = dosyalar.length + 1;
  dosyalar.push({ ad: dosya_adi, sira: yeniSira, durum: 'parse_ediliyor' });

  await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}`, {
    method: 'PATCH',
    body: { dosyalar, guncelleme_at: new Date().toISOString() },
  });
}

async function batchSonucBirlestir({ batch_id, yeni_spoollar, format_id, dosya_adi, dosya_sirasi, dosya_toplami }) {
  // Mevcut sonuc_json'a yeni spool'lari ekle, sayaclari guncelle
  const mevcut = await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}&select=sonuc_json,sonuc_spool_sayisi,manuel_onay_sayisi,onaylanan_sayisi,format_durumu`);
  const row = mevcut?.[0] || {};

  const eskiSonuc = row.sonuc_json || { spoollar: [], dosya_sonuclari: [] };
  eskiSonuc.spoollar = [...(eskiSonuc.spoollar || []), ...yeni_spoollar];
  eskiSonuc.dosya_sonuclari = [...(eskiSonuc.dosya_sonuclari || []), {
    dosya_adi,
    dosya_sirasi,
    spool_sayisi: yeni_spoollar.length,
    manuel_onay_sayisi: yeni_spoollar.filter(s => s.durum === DURUM_MANUEL_ONAY).length,
  }];

  const yeniManuelOnay = yeni_spoollar.filter(s => s.durum === DURUM_MANUEL_ONAY).length;
  const yeniHazir      = yeni_spoollar.filter(s => s.durum === DURUM_HAZIR).length;

  // Son dosya mi?
  const sonDosyaMi = dosya_sirasi >= dosya_toplami;

  const guncelleme = {
    sonuc_json: eskiSonuc,
    sonuc_spool_sayisi: (row.sonuc_spool_sayisi || 0) + yeni_spoollar.length,
    manuel_onay_sayisi: (row.manuel_onay_sayisi || 0) + yeniManuelOnay,
    onaylanan_sayisi: (row.onaylanan_sayisi || 0) + yeniHazir,
    guncelleme_at: new Date().toISOString(),
  };

  if (format_id && row.format_durumu === 'taraniyor') {
    guncelleme.format_id = format_id;
    guncelleme.format_durumu = 'taninan';
  }

  if (sonDosyaMi) {
    // Toplam manuel onay sayisina gore durum karari
    const toplamManuelOnay = (row.manuel_onay_sayisi || 0) + yeniManuelOnay;
    guncelleme.durum = toplamManuelOnay > 0 ? 'manuel_onay_bekliyor' : 'tamamlandi';
    guncelleme.bitis_at = new Date().toISOString();
    if (row.format_durumu === 'taraniyor' && !format_id) {
      guncelleme.format_durumu = 'bilinmeyen';
    }
  }

  await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}`, {
    method: 'PATCH',
    body: guncelleme,
  });
}

async function batchHataYaz({ batch_id, hata }) {
  await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}`, {
    method: 'PATCH',
    body: {
      durum: 'hata',
      hata_detay: String(hata).substring(0, 1000),
      bitis_at: new Date().toISOString(),
      guncelleme_at: new Date().toISOString(),
    },
  });
}

async function aiApiLogYaz(kayit) {
  // Pre-A.4 (38): return=minimal kullan -- log icin geri donus satira ihtiyacimiz yok.
  // Bu ayni zamanda SELECT policy super_admin only oldugu icin olabilecek
  // "row dondurulemedi" hatasini onler.
  try {
    await supaFetch('ai_api_log', {
      method: 'POST',
      body: kayit,
      prefer: 'return=minimal',
    });
  } catch (e) {
    // Loglama hatasi ana akisi bozmaz, ama Vercel logs'ta tam sebebi gor
    console.error('[aiApiLogYaz] HATA (yutuldu):', {
      mesaj: e.message,
      stack: e.stack?.split('\n').slice(0, 3).join(' | '),
      kayit_alanlari: Object.keys(kayit),
      kaynak: kayit.kaynak,
      cagri_tipi: kayit.cagri_tipi,
      basarili: kayit.basarili,
      http_status: kayit.http_status,
    });
  }
}

async function batchTokenSayaclariArtir({ batch_id, input_tokens, output_tokens, maliyet_usd }) {
  // PostgREST UPDATE su an aritmetik desteklemiyor, mevcut degerleri okuyup +ekleyip yaziyoruz
  const mevcut = await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}&select=ai_cagri_sayisi,toplam_token_input,toplam_token_output,toplam_maliyet_usd`);
  const row = mevcut?.[0] || {};
  await supaFetch(`izometri_batch_kayitlari?id=eq.${batch_id}`, {
    method: 'PATCH',
    body: {
      ai_cagri_sayisi:      (row.ai_cagri_sayisi || 0) + 1,
      toplam_token_input:   (row.toplam_token_input || 0) + input_tokens,
      toplam_token_output:  (row.toplam_token_output || 0) + output_tokens,
      toplam_maliyet_usd:   Number((row.toplam_maliyet_usd || 0)) + maliyet_usd,
      guncelleme_at: new Date().toISOString(),
    },
  });
}

// =====================================================================
// 4. FORMAT DISPATCHER
// =====================================================================

async function formatTani({ pdf_base64, dosya_adi, tenant_id }) {
  // Tenant-scope + global formatlari getir, fingerprint ile esle
  // PDF'in metadata + dosya adi + ilk sayfa (Vision'a gondermeden) -- simdilik sadece dosya adi pattern
  // 38'de PDF ilk sayfa metnini de fingerprint'e ekleyecegiz (pdf-parse ile)

  const formatlar = await supaFetch(
    `izometri_format_tanimlari?aktif=eq.true&or=(tenant_id.is.null,tenant_id.eq.${tenant_id})&select=*`
  );

  for (const fmt of (formatlar || [])) {
    if (fingerprintEsler(fmt.fingerprint, { dosya_adi })) {
      // Kullanim sayisini artir
      try {
        await supaFetch(`izometri_format_tanimlari?id=eq.${fmt.id}`, {
          method: 'PATCH',
          body: {
            kullanim_sayisi: (fmt.kullanim_sayisi || 0) + 1,
            son_kullanim_at: new Date().toISOString(),
          },
        });
      } catch (e) { /* yutuldu */ }

      return {
        format_id: fmt.id,
        format_adi: fmt.ad,
        parser_kural: fmt.parser_kural || {},
        prompt_template: fmt.prompt_template,
        kaynak: 'tanindi',
      };
    }
  }

  return { format_id: null, format_adi: null, parser_kural: {}, prompt_template: null, kaynak: 'tanimsiz' };
}

function fingerprintEsler(fingerprint, ipucu) {
  // fingerprint = { dosya_adi_regex: "...", baslik_regex: "...", ... }
  if (!fingerprint || typeof fingerprint !== 'object') return false;
  if (Object.keys(fingerprint).length === 0) return false;

  // Dosya adi regex kontrol
  if (fingerprint.dosya_adi_regex) {
    try {
      const re = new RegExp(fingerprint.dosya_adi_regex, 'i');
      if (re.test(ipucu.dosya_adi)) return true;
    } catch { /* bozuk regex yutuldu */ }
  }

  return false; // Su an sadece dosya adi -- 38'de baslik/metin de eklenecek
}

// =====================================================================
// 5. VISION AI PARSER (Yaklasim Y)
// =====================================================================

async function visionAIParse({ pdf_base64, dosya_adi, formatBilgisi, tenant_id, kullanici_id, batch_id }) {
  const baslangic = Date.now();
  const sistem_prompt = formatBilgisi.prompt_template || YAKLASIM_Y_PROMPT;

  const istek = {
    model: VISION_MODEL,
    max_tokens: 8192,
    system: sistem_prompt,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 },
        },
        {
          type: 'text',
          text: `Bu izometri PDF'inden spool listesini cikar. Dosya adi: ${dosya_adi}\n\nKURAL: PDF'te yazili olmayan hicbir alani UYDURMA. Yoksa null don.`,
        },
      ],
    }],
  };

  let claudeRes, data, text;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(istek),
    });
    text = await claudeRes.text();
    try { data = JSON.parse(text); } catch { data = null; }
  } catch (e) {
    await aiApiLogYaz({
      tenant_id, kullanici_id, batch_id, format_id: formatBilgisi.format_id,
      kaynak: 'izometri_oku', cagri_tipi: 'L3_vision', model: VISION_MODEL,
      basarili: false, http_status: 0, hata_mesaji: e.message,
      sure_ms: Date.now() - baslangic,
    });
    return { ok: false, error: 'Claude API baglanti hatasi: ' + e.message, http_status: 502 };
  }

  if (!claudeRes.ok) {
    await aiApiLogYaz({
      tenant_id, kullanici_id, batch_id, format_id: formatBilgisi.format_id,
      kaynak: 'izometri_oku', cagri_tipi: 'L3_vision', model: VISION_MODEL,
      basarili: false, http_status: claudeRes.status,
      hata_mesaji: typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : text.substring(0, 500),
      sure_ms: Date.now() - baslangic,
    });
    return { ok: false, error: `Claude API ${claudeRes.status}: ${text.substring(0, 200)}`, http_status: 502 };
  }

  // Token sayilari + maliyet
  const usage = data?.usage || {};
  const input_tokens   = usage.input_tokens || 0;
  const output_tokens  = usage.output_tokens || 0;
  const maliyet_usd    = maliyetHesapla(VISION_MODEL, input_tokens, output_tokens);
  const sure_ms        = Date.now() - baslangic;

  // JSON parse
  const cevap_text = data?.content?.[0]?.text || '';
  let parsed;
  try {
    let temizlik = cevap_text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const m = temizlik.match(/\{[\s\S]*\}/);
    if (m) temizlik = m[0];
    parsed = JSON.parse(temizlik);
  } catch (e) {
    await aiApiLogYaz({
      tenant_id, kullanici_id, batch_id, format_id: formatBilgisi.format_id,
      kaynak: 'izometri_oku', cagri_tipi: 'L3_vision', model: VISION_MODEL,
      input_tokens, output_tokens, maliyet_usd, sure_ms,
      basarili: false, http_status: 200,
      hata_mesaji: 'JSON parse: ' + e.message,
      cevap_kisaltma: cevap_text.substring(0, 500),
    });
    return { ok: false, error: 'Claude JSON donmedi: ' + cevap_text.substring(0, 200), http_status: 422 };
  }

  // --- 5.1 PROMPT INJECTION KORUMASI (K11/37 -- Pre-A.2) ---
  // (a) Schema validation: beklenen kok alanlar disinda alan varsa logla.
  //     Veriyi reddetmeyiz (AI bazen extra alan dondurebilir) ama kayit altina aliriz.
  const BEKLENEN_KOK_ALANLAR = ['spoollar', 'tespit_edilen_format_ipucu', 'genel_notlar'];
  const yabanci_alanlar = Object.keys(parsed).filter(k => !BEKLENEN_KOK_ALANLAR.includes(k));
  if (yabanci_alanlar.length > 0) {
    console.warn('[izometri-oku] Yabanci kok alan(lar) tespit edildi:', yabanci_alanlar, 'dosya:', dosya_adi);
  }

  // (b) Suspicious keyword scan: PDF icindeki gorunmez metin AI'ya talimat enjekte etmis olabilir.
  //     AI ciktisinda hassas terim varsa hem logla hem TUM spool'lari zorla manuel onaya dusur.
  const SUSPICIOUS_KEYWORDS = [
    'auth.users', 'drop table', 'drop database', 'truncate',
    'pg_catalog', 'information_schema', 'pg_user', 'pg_roles',
    'sifreler', 'api_key', 'anthropic_', 'supabase_', 'service_role',
    'process.env', 'system_prompt', 'ignore previous', 'onceki talimatlar',
    'tenant_id =', "tenant_id='", 'select * from kullanicilar',
  ];
  const cevap_tam_metin = JSON.stringify(parsed).toLowerCase();
  const supheli_bulunan = SUSPICIOUS_KEYWORDS.filter(k => cevap_tam_metin.includes(k));
  if (supheli_bulunan.length > 0) {
    console.warn('[izometri-oku] PROMPT INJECTION SUPHESI:', supheli_bulunan, 'dosya:', dosya_adi);
    if (Array.isArray(parsed.spoollar)) {
      parsed.spoollar.forEach(s => {
        s.uyari_prompt_injection = true;
        s.supheli_keywords = supheli_bulunan;
      });
    }
  }

  // (c) Spoollar dizi mi, makul boyutta mi
  if (parsed.spoollar && !Array.isArray(parsed.spoollar)) {
    return { ok: false, error: 'AI cevabinda spoollar dizi formatinda degil', http_status: 422 };
  }
  if (Array.isArray(parsed.spoollar) && parsed.spoollar.length > 200) {
    // Tek izometri PDF'inde 200 spool olmasi imkansiz -- olabildigi en buyuk: ~50
    return { ok: false, error: `Anormal spool sayisi (${parsed.spoollar.length}) -- prompt injection olabilir`, http_status: 422 };
  }

  // Loglama (basarili)
  await aiApiLogYaz({
    tenant_id, kullanici_id, batch_id, format_id: formatBilgisi.format_id,
    kaynak: 'izometri_oku', cagri_tipi: 'L3_vision', model: VISION_MODEL,
    input_tokens, output_tokens, maliyet_usd, sure_ms,
    basarili: true, http_status: 200,
    cevap_kisaltma: JSON.stringify(parsed).substring(0, 500),
  });

  // Batch token sayaclarini artir
  await batchTokenSayaclariArtir({ batch_id, input_tokens, output_tokens, maliyet_usd });

  const spoollar = Array.isArray(parsed.spoollar) ? parsed.spoollar : [];
  return { ok: true, spoollar, ham_cevap: parsed };
}

// Format-spesifik parser (38'de aktif)
async function parserKuralIle({ pdf_base64, dosya_adi, formatBilgisi }) {
  // Su an parser_kural'lar bos -- bu fonksiyon aktif degil
  // 38'de format-spesifik regex/template parse buraya gelecek
  return { ok: false, error: 'parser_kural ile parse henuz aktif degil (38)', http_status: 501 };
}

// =====================================================================
// 6. YAKLASIM Y PROMPT (K4/36)
// =====================================================================

const YAKLASIM_Y_PROMPT = `Sen bir tersane boru imalat sisteminin veri cikarma asistanisin.
Sana bir izometri PDF'i verilecek. Bu PDF'ten spool (boru parcasi) listesini cikarman gerekiyor.

KRİTİK KURALLAR -- Bu kurallari ASLA ihlal etme:

1. SADECE PDF'TE YAZILI OLAN DEGERLERI CIKAR.
   - Bir alan PDF'te aciklik gostermiyorsa: null don.
   - ASLA tahmin etme, ASLA varsayilan deger uydurma, ASLA "muhtemelen" deme.
   - Et kalinligi yazili degilse: et_mm = null + et_kaynagi = "pdf_yok".
   - Sistem hesabi kod tarafinda yapacak (boru_olculer ASME tablosundan).

2. PIPELINE NUMARASI DOSYA ADIYLA UYUSMALI.
   - Dosya adi "PAOR-50600-101540.pdf" ise, pipeline_no formatinda "50600-101540" gecmeli.
   - Eger PDF'teki pipeline numarasi dosya adindan tamamen farkli geliyorsa:
     pipeline_no = null + uyari_dosya_adi = true don.
   - Bu kural Cihat'in 36'da yasadigi halusinasyon sorununu cozer.

3. SPOOL SAYISINI DOGRU SAY.
   - Cizimdeki "[1] [2]" gibi koseli parantezler 2 spool demektir.
   - Her spool icin ayri JSON objesi don.
   - PIPE CUT-LENGTHS tablosundaki <1>, <2> kesim parcalaridir, spool degildir.

4. MALZEME LISTESINDE AYRIM YAP.
   - "FABRICATION MATERIAL LIST" altindakileri AL.
   - "ERECTION MATERIAL LIST" altindakileri TAMAMEN ATLA (bolt, nut, washer, gasket vb.).
   - Eger sadece "MATERIAL LIST" varsa ve ayrim yoksa: hepsini al ama not du.

5. YUZEY ISLEMI:
   - "GALVANIZATION: YES" -> "Galvaniz"
   - "PAINTED" / "PAINT" -> "Boyali"
   - "ACID" / "PICKLE" -> "Asit"
   - Belirtilmemis -> null (varsayilan UYDURMA)

6. AI GUVEN SKORU:
   - Her spool icin guven skoru ekle (0.0-1.0).
   - PDF okunabilirligi dusukse, alanlar bulanikoa: dusuk skor.
   - Bunu DURUSTCE yap -- yuksek skor verirsen sistem manuel onaya dusurmez ama veri yanlissa Cihat sorun yasar.

CIKTI FORMATI (sadece JSON, baska hicbir sey yazma):
{
  "spoollar": [
    {
      "pipeline_no": "50600-101540-Z10-2" | null,
      "spool_no": "S01",
      "dn": 150 | null,
      "cap_mm": 168.3 | null,
      "et_mm": 4.5 | null,
      "et_kaynagi": "pdf" | "pdf_yok",
      "boy_mm": 149 | null,
      "agirlik_kg": null | sayisal,
      "malzeme_en_kodu": "P235GH" | null,
      "malzeme_astm_kodu": "A 106 Grade B" | null,
      "yuzey": "Galvaniz" | "Boyali" | "Asit" | null,
      "rev": "A" | null,
      "guven_skoru": 0.85,
      "uyari_dosya_adi": false,
      "malzeme_listesi": [
        {
          "kategori": "PIPES" | "FITTINGS" | "FLANGES",
          "tanim": "PIPE SEAMLESS A106 GR.B DN150",
          "dn": 150,
          "miktar": "0.7m"
        }
      ],
      "notlar": "AI tarafindan eklenen kisa not (varsa)"
    }
  ],
  "tespit_edilen_format_ipucu": "AVEVA-PAOR" | "Smart 3D" | null,
  "genel_notlar": null
}

UNUTMA: Yazili olmayan alani UYDURMAK, manuel onay icin sebep degildir, kullanici icin tehlikedir. null don.`;

// =====================================================================
// 7. ASME LOOKUP -- boru_olculer fallback (K4/36)
// =====================================================================

async function asmeFallbackDoldur(spoollar) {
  // Eksik et/cap alanlarini once ARES_BORU helper'indan, bulamazsa boru_olculer'dan doldur.
  // Helper hizli (in-memory), DB sadece helper bulamadiginda.
  const sonuc = [];
  for (const sp of spoollar) {
    const yeni = { ...sp };
    yeni.uyarilar = sp.uyarilar || [];
    yeni.dolduruldu = {};

    if (!yeni.dn) {
      sonuc.push(yeni);
      continue;
    }

    // DN'den cap_mm doldurma
    if (!yeni.cap_mm) {
      const olcu = await boruOlcuBul({ dn: yeni.dn, malzeme_en_kodu: yeni.malzeme_en_kodu });
      if (olcu?.dis_cap_mm) {
        yeni.cap_mm = Number(olcu.dis_cap_mm);
        yeni.dolduruldu.cap_mm = olcu.kaynak;
      }
    }

    // Et_mm yoksa veya kaynagi pdf_yok ise -> helper'dan default schedule
    if ((!yeni.et_mm || yeni.et_kaynagi === 'pdf_yok') && yeni.dn) {
      const olcu = await boruOlcuBul({ dn: yeni.dn, malzeme_en_kodu: yeni.malzeme_en_kodu });
      if (olcu?.et_kalinligi_mm) {
        yeni.et_mm = Number(olcu.et_kalinligi_mm);
        yeni.et_kaynagi = `${olcu.kaynak} (SCH ${olcu.schedule_kodu})`;
        yeni.dolduruldu.et_mm = yeni.et_kaynagi;
      }
    }

    sonuc.push(yeni);
  }
  return sonuc;
}

async function boruOlcuBul({ dn, malzeme_en_kodu, schedule }) {
  const dnInt = Number(dn);
  if (!dnInt) return null;

  // 1. Once ARES_BORU helper'a sor (hizli, in-memory) -- helper yuklendiyse
  if (ARES_BORU) {
    const sch = schedule ? String(schedule) : ARES_BORU.varsayilanSchedule(dnInt);
    // Helper malzeme normalize ediyor: 'P235GH' -> 'karbon', '316L' -> 'paslanmaz' vb.
    const malzeme = malzeme_en_kodu || 'karbon';

    const od = ARES_BORU.disCap(dnInt, malzeme);
    const et = ARES_BORU.etKalinligi(dnInt, sch, malzeme);

    if (od && et) {
      return {
        dis_cap_mm: od,
        et_kalinligi_mm: et,
        schedule_kodu: sch,
        kaynak: 'ares_boru',
      };
    }
  }

  // 2. Helper bulamadi -> boru_olculer DB'ye sor (DIN/EN borular helper'da yok)
  try {
    let path = `boru_olculer?dn=eq.${dnInt}&select=dis_cap_mm,et_kalinligi_mm,schedule_kodu,standart&limit=1`;
    if (malzeme_en_kodu && /CrNi|paslanmaz|316|304|321|347|duplex/i.test(malzeme_en_kodu)) {
      path += '&standart=eq.ASME-B36.19M';
    } else {
      path += '&standart=eq.ASME-B36.10M';
    }
    const data = await supaFetch(path);
    if (data?.[0]) {
      return { ...data[0], kaynak: 'boru_olculer' };
    }
  } catch (e) {
    console.error('[boruOlcuBul fallback] hata:', e.message);
  }

  return null;
}

// Et tolerans kontrolu icin et_min/et_max getir (ARES_BORU'da yok, sadece DB'de generated)
async function boruEtTolerans({ dn, malzeme_en_kodu, schedule }) {
  const dnInt = Number(dn);
  if (!dnInt) return null;
  try {
    let path = `boru_olculer?dn=eq.${dnInt}&select=et_kalinligi_mm,et_min,et_max,schedule_kodu&limit=1`;
    if (malzeme_en_kodu && /CrNi|paslanmaz|316|304|321|347|duplex/i.test(malzeme_en_kodu)) {
      path += '&standart=eq.ASME-B36.19M';
    } else {
      path += '&standart=eq.ASME-B36.10M';
    }
    if (schedule) {
      path += `&schedule_kodu=eq.${encodeURIComponent(schedule)}`;
    }
    const data = await supaFetch(path);
    return data?.[0] || null;
  } catch (e) {
    console.error('[boruEtTolerans] hata:', e.message);
    return null;
  }
}

// =====================================================================
// 8. HALUSINASYON FILTRESI (K3/36 -- 7 madde)
// =====================================================================

async function halusinasyonFiltresi({ spoollar, dosya_adi }) {
  const sonuc = [];

  for (const sp of spoollar) {
    const uyarilar = [...(sp.uyarilar || [])];

    // Madde 1: DN bulundu mu
    if (!sp.dn || sp.dn < MIN_DN || sp.dn > MAX_DN) {
      uyarilar.push({ kod: 'dn_bulunamadi', mesaj: `DN bos veya gecersiz (deger: ${sp.dn})`, agirlik: 'kritik' });
    }

    // Madde 2: Cap-DN tutarli mi (helper veya boru_olculer cross-check)
    if (sp.dn && sp.cap_mm) {
      const beklenen = await boruOlcuBul({ dn: sp.dn, malzeme_en_kodu: sp.malzeme_en_kodu });
      if (beklenen?.dis_cap_mm) {
        const fark = Math.abs(Number(beklenen.dis_cap_mm) - Number(sp.cap_mm));
        if (fark > 1.0) {
          uyarilar.push({
            kod: 'cap_dn_tutarsiz',
            mesaj: `DN${sp.dn} icin beklenen cap ${beklenen.dis_cap_mm}mm (kaynak: ${beklenen.kaynak}), gelen ${sp.cap_mm}mm`,
            agirlik: 'orta',
          });
        }
      }
    }

    // Madde 3: Et tolerans disi (sadece boru_olculer'da et_min/et_max generated kolonlar var)
    if (sp.dn && sp.et_mm && sp.et_kaynagi === 'pdf') {
      const tol = await boruEtTolerans({ dn: sp.dn, malzeme_en_kodu: sp.malzeme_en_kodu });
      if (tol?.et_min && tol?.et_max) {
        const et = Number(sp.et_mm);
        if (et < Number(tol.et_min) || et > Number(tol.et_max)) {
          uyarilar.push({
            kod: 'et_tolerans_disi',
            mesaj: `Et ${et}mm, kabul tolerans: ${tol.et_min}-${tol.et_max}mm (SCH ${tol.schedule_kodu})`,
            agirlik: 'orta',
          });
        }
      }
    }

    // Madde 4: Boy negatif veya sacma
    if (sp.boy_mm !== null && sp.boy_mm !== undefined) {
      const boy = Number(sp.boy_mm);
      if (boy <= 0 || boy > MAX_BOY_MM) {
        uyarilar.push({ kod: 'boy_sacma', mesaj: `Boy ${boy}mm makul degil`, agirlik: 'orta' });
      }
    }

    // Madde 5: Pipeline_no dosya adiyla uyusmuyor (KRITIK -- halusinasyon korumasi)
    if (sp.uyari_dosya_adi === true) {
      uyarilar.push({
        kod: 'pipeline_no_uyusmuyor',
        mesaj: `PDF'teki pipeline numarasi dosya adi "${dosya_adi}" ile celisiyor (AI uydurma riski)`,
        agirlik: 'kritik',
      });
    } else if (sp.pipeline_no && dosya_adi) {
      // Dosya adinda pipeline_no'nun ana parcasi geciyor mu (5-haneli + 6-haneli)
      const pipelineMatch = sp.pipeline_no.match(/(\d{5}-\d{6})/);
      if (pipelineMatch) {
        const ana = pipelineMatch[1];
        if (!dosya_adi.includes(ana)) {
          uyarilar.push({
            kod: 'pipeline_no_dosya_adinda_yok',
            mesaj: `Pipeline ana kodu (${ana}) dosya adinda gecmiyor`,
            agirlik: 'kritik',
          });
        }
      }
    }

    // Madde 6: AI guven skoru dusuk
    if (typeof sp.guven_skoru === 'number' && sp.guven_skoru < MIN_GUVEN_SKORU) {
      uyarilar.push({
        kod: 'guven_skoru_dusuk',
        mesaj: `AI guven skoru ${sp.guven_skoru} (esik: ${MIN_GUVEN_SKORU})`,
        agirlik: 'orta',
      });
    }

    // Madde 7: Malzeme bilinmeyen (endustri_form_astm tablosu lookup)
    if (sp.malzeme_en_kodu || sp.malzeme_astm_kodu) {
      const tanindi = await malzemeTaninir({
        en_kodu: sp.malzeme_en_kodu,
        astm_kodu: sp.malzeme_astm_kodu,
      });
      if (!tanindi) {
        uyarilar.push({
          kod: 'malzeme_bilinmeyen',
          mesaj: `Malzeme sozlukte yok: EN=${sp.malzeme_en_kodu || '?'}, ASTM=${sp.malzeme_astm_kodu || '?'}`,
          agirlik: 'orta',
        });
      }
    } else {
      uyarilar.push({ kod: 'malzeme_bos', mesaj: 'Malzeme alani bos', agirlik: 'orta' });
    }

    // Madde 8: Prompt injection supheli kelime tespiti (Pre-A.2 / K11/37)
    if (sp.uyari_prompt_injection === true) {
      uyarilar.push({
        kod: 'prompt_injection_supheli',
        mesaj: `AI ciktisinda hassas kelime tespit edildi: ${(sp.supheli_keywords || []).join(', ')}`,
        agirlik: 'kritik',
      });
    }

    // Durum karari
    const kritikUyariVar = uyarilar.some(u => u.agirlik === 'kritik');
    const ortaUyariSayisi = uyarilar.filter(u => u.agirlik === 'orta').length;
    const durum = kritikUyariVar || ortaUyariSayisi >= 2 ? DURUM_MANUEL_ONAY : DURUM_HAZIR;

    sonuc.push({
      ...sp,
      uyarilar,
      durum,
      kritik_uyari_var: kritikUyariVar,
    });
  }

  return sonuc;
}

async function malzemeTaninir({ en_kodu, astm_kodu }) {
  try {
    if (en_kodu) {
      const en = await supaFetch(`endustri_malzemeler?en_kodu=eq.${encodeURIComponent(en_kodu)}&select=id&limit=1`);
      if (en?.length > 0) return true;
    }
    if (astm_kodu) {
      const astm = await supaFetch(`endustri_form_astm?astm_kodu=eq.${encodeURIComponent(astm_kodu)}&select=id&limit=1`);
      if (astm?.length > 0) return true;
    }
    return false;
  } catch (e) {
    console.error('[malzemeTaninir] hata:', e.message);
    return false; // Hata durumunda 'bilinmeyen' isaretlenir, manuel onay icin guvenli
  }
}

// =====================================================================
// 9. MALIYET HESABI
// =====================================================================

function maliyetHesapla(model, input_tokens, output_tokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-5'];
  const inUSD = (input_tokens / 1_000_000) * pricing.input;
  const outUSD = (output_tokens / 1_000_000) * pricing.output;
  return Number((inUSD + outUSD).toFixed(6));
}

// =====================================================================
// SON
// =====================================================================
