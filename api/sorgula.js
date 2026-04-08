// api/sorgula.js — Vercel Edge Function
// Doğal dil → SQL → Supabase → Türkçe cevap
// Güvenlik: sadece SELECT, tenant_id zorunlu

export const config = { runtime: 'edge' };

// Sorgulanmasına izin verilen tablolar
const IZINLI_TABLOLAR = [
  'devreler', 'spooller', 'projeler', 'tersaneler',
  'testler', 'test_spooller', 'sevkiyatlar', 'sevkiyat_spooller',
  'personel', 'kesim_kalemleri', 'bukum_kalemleri',
  'markalama_kalemleri', 'islem_log'
];

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { soru, tenant_id } = body;

    if (!soru || !tenant_id) {
      return json({ error: 'soru ve tenant_id gerekli' }, 400);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY yapılandırılmamış' }, 500);
    if (!supabaseUrl || !supabaseKey) return json({ error: 'SUPABASE_URL veya SUPABASE_SERVICE_KEY yapılandırılmamış' }, 500);

    // 1. Supabase'den şemayı çek
    const schema = await semaYukle(supabaseUrl, supabaseKey, tenant_id);

    // 2. Claude'a SQL ürettir
    const sqlSonuc = await sqlUret(apiKey, soru, schema, tenant_id);
    if (sqlSonuc.error) return json({ error: sqlSonuc.error }, 422);

    const { sql, aciklama } = sqlSonuc;

    // 3. Güvenlik kontrolü
    const guvensiz = guvenlikKontrol(sql, tenant_id);
    if (guvensiz) return json({ error: guvensiz }, 403);

    // 4. SQL çalıştır
    const veri = await sqlCalistir(supabaseUrl, supabaseKey, sql);
    if (veri.error) return json({ error: 'Sorgu hatası: ' + veri.error }, 422);

    // 5. Claude'a Türkçe cevap ürettir
    const cevap = await cevapUret(apiKey, soru, veri.rows, aciklama);

    return json({
      ok: true,
      cevap,
      sql,
      satir_sayisi: veri.rows.length,
      veriler: veri.rows.slice(0, 50) // max 50 satır frontend'e
    });

  } catch (e) {
    console.error('sorgula hatası:', e);
    return json({ error: e.message }, 500);
  }
}

// ── ŞEMA YÜKLEME ────────────────────────────────────────────
async function semaYukle(url, key, tenantId) {
  try {
    // information_schema'dan izinli tabloların kolonlarını çek
    const tabloListesi = IZINLI_TABLOLAR.map(t => `'${t}'`).join(',');
    const sorgu = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN (${tabloListesi})
      ORDER BY table_name, ordinal_position
    `;

    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({ query: sorgu })
    });

    // exec_sql RPC yoksa direkt bilinen şemayı dön
    if (!res.ok) return semaFallback();

    const data = await res.json();
    return semaFormatla(data);
  } catch(e) {
    return semaFallback();
  }
}

function semaFormatla(kolonlar) {
  if (!Array.isArray(kolonlar) || !kolonlar.length) return semaFallback();

  const tablolar = {};
  kolonlar.forEach(k => {
    if (!tablolar[k.table_name]) tablolar[k.table_name] = [];
    tablolar[k.table_name].push(`${k.column_name} (${k.data_type})`);
  });

  return Object.entries(tablolar)
    .map(([tablo, kolonlar]) => `${tablo}: ${kolonlar.join(', ')}`)
    .join('\n');
}

function semaFallback() {
  return `
devreler: id, tenant_id, proje_id, devre_no, ad, zone, is_emri_no, durum, termin_tarihi, silindi, olusturma
spooller: id, tenant_id, devre_id, spool_no, spool_id, pipeline_no, rev, aktif_basamak, agirlik (ağırlık kg - agirlik_kg değil), malzeme, kalite, dis_cap_mm, et_kalinligi_mm, yuzey, durduruldu, silindi, olusturma
projeler: id, tenant_id, tersane_id, proje_no, gemi_adi, baslangic_tarihi, bitis_tarihi, durum, olusturma [NOT: silindi kolonu YOK]
tersaneler: id, tenant_id, ad, ulke, sehir, aktif [NOT: silindi kolonu YOK]
testler: id, tenant_id, devre_id, test_no, tip, tip_ad, firma, durum, tarih, sonuc_genel, olusturma
sevkiyatlar: id, tenant_id, tersane_id, sevk_no, tip, tarih, arac_plaka, irsaliye_no, teslim_alan, olusturma
personel: id, tenant_id, ad_soyad, brans, ise_giris_tarihi, aktif
kesim_kalemleri: id, tenant_id, spool_id, olcu_mm, kesildi, olusturma
bukum_kalemleri: id, tenant_id, spool_id, olcu_mm, bukuldu, olusturma
islem_log: id, tenant_id, spool_id, islem, aciklama, yapan_id, ad_soyad, olusturma
  `.trim();
}

// ── SQL ÜRETME ───────────────────────────────────────────────
async function sqlUret(apiKey, soru, schema, tenantId) {
  const systemPrompt = `Sen bir tersane boru imalat yönetim sisteminin SQL asistanısın.
Kullanıcının Türkçe sorusunu PostgreSQL SELECT sorgusuna çevir.

VERİTABANI ŞEMASI:
${schema}

KURALLAR:
1. SADECE SELECT sorgusu yaz, başka hiçbir şey yazma
2. Her sorguda mutlaka WHERE tenant_id = '${tenantId}' koşulu olsun
3. silindi = true olan kayıtları hariç tut (silindi = false veya silindi IS NULL)
4. Tarihleri Türkçe formatla: TO_CHAR(tarih, 'DD.MM.YYYY')
5. Sayısal değerleri yuvarla: ROUND(deger, 2)
6. Maksimum 100 satır dön: LIMIT 100
7. Tablo adlarını doğru kullan, şemada olmayan tablo kullanma
8. JOIN kullanırken tenant_id kontrolü yap
9. spooller tablosunda ağırlık için 'agirlik' kolonunu kullan (agirlik_kg değil)
10. spooller tablosunda kalite için 'kalite' kolonunu kullan (kalite_standart değil)
11. spooller tablosunda yüzey için 'yuzey' kolonunu kullan (yuzey_islemi değil)
12. projeler tablosunda 'silindi' kolonu YOK — bu filtreyi projeler için kullanma
13. tersaneler tablosunda 'silindi' kolonu YOK — bu filtreyi tersaneler için kullanma

CEVAP FORMATI (sadece JSON, başka hiçbir şey yazma):
{
  "sql": "SELECT ...",
  "aciklama": "Bu sorgu ne yapıyor (1 cümle Türkçe)"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // Hızlı ve ucuz — SQL üretmek için yeterli
      max_tokens: 1024,
      messages: [
        { role: 'user', content: soru }
      ],
      system: systemPrompt
    })
  });

  if (!res.ok) return { error: 'Claude API hatası: ' + res.status };

  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch(e) {
    return { error: 'SQL üretilemedi: ' + text.substring(0, 100) };
  }
}

// ── GÜVENLİK KONTROLÜ ───────────────────────────────────────
function guvenlikKontrol(sql, tenantId) {
  const upper = sql.toUpperCase().trim();

  // Sadece SELECT
  if (!upper.startsWith('SELECT')) {
    return 'Sadece SELECT sorgusu çalıştırılabilir';
  }

  // Tehlikeli komutlar
  const tehlikeli = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE',
                     'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXECUTE', 'EXEC'];
  for (const k of tehlikeli) {
    if (upper.includes(k)) return `Güvenlik: ${k} komutu kullanılamaz`;
  }

  // tenant_id kontrolü
  if (!sql.includes(tenantId)) {
    return 'Güvenlik: tenant_id filtresi eksik';
  }

  // İzinli tablolar kontrolü
  const tabloPattern = /FROM\s+(\w+)|JOIN\s+(\w+)/gi;
  let match;
  while ((match = tabloPattern.exec(sql)) !== null) {
    const tablo = (match[1] || match[2]).toLowerCase();
    if (!IZINLI_TABLOLAR.includes(tablo) && tablo !== 'information_schema') {
      return `Güvenlik: '${tablo}' tablosuna erişim izni yok`;
    }
  }

  return null; // Güvenli
}

// ── SQL ÇALIŞTIRMA ───────────────────────────────────────────
async function sqlCalistir(url, key, sql) {
  try {
    // Supabase'de raw SQL çalıştırmak için exec_sql RPC kullan
    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({ query: sql })
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: err };
    }

    const rows = await res.json();
    return { rows: Array.isArray(rows) ? rows : [rows] };
  } catch(e) {
    return { error: e.message };
  }
}

// ── TÜRKÇE CEVAP ÜRETME ─────────────────────────────────────
async function cevapUret(apiKey, soru, veriler, aciklama) {
  if (!veriler.length) {
    return 'Sorgunuza uygun kayıt bulunamadı.';
  }

  const veriText = veriler.length <= 10
    ? JSON.stringify(veriler, null, 2)
    : JSON.stringify(veriler.slice(0, 10), null, 2) + `\n... ve ${veriler.length - 10} kayıt daha`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `Sen bir tersane yönetim sisteminin asistanısın. 
Sana bir soru ve veritabanı sorgu sonucu verilecek. 
Sonuçları kısa ve anlaşılır Türkçe ile özetle.
Sayıları ve önemli bilgileri vurgula.
Maksimum 3-4 cümle yaz.`,
      messages: [{
        role: 'user',
        content: `Soru: ${soru}\n\nSorgu açıklaması: ${aciklama}\n\nSonuçlar:\n${veriText}`
      }]
    })
  });

  if (!res.ok) return `${veriler.length} kayıt bulundu.`;

  const data = await res.json();
  return data.content?.[0]?.text || `${veriler.length} kayıt bulundu.`;
}

// ── YARDIMCI ─────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
