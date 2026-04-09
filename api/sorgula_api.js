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

    // exec_sql [{exec_sql: [...]}] formatında dönüyor — içini çıkar
    let kolonlar = data;
    if (Array.isArray(data) && data[0] && data[0].exec_sql) {
      kolonlar = data[0].exec_sql;
    }
    return semaFormatla(kolonlar);
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
devreler: id, tenant_id, proje_id, devre_no, ad, zone, zone_no, is_emri_no, durum, aktif_basamak, termin (tarih), agirlik (numeric), malzeme, yuzey, notlar, ilerleme (integer 0-100), silindi, olusturma, guncelleme
[NOT: devreler tablosunda silindi=true olanları hariç tut]

spooller: id, tenant_id, devre_id, spool_no, spool_id, pipeline_no, rev, dis_cap_mm, et_kalinligi_mm, agirlik_kg, malzeme, kalite_standart, yuzey_islemi, aktif_basamak, durduruldu, alistirma, imalat_kg, imalat_di, argon_di, gazalti_di, olusturma
[NOT: spooller tablosunda silindi kolonu YOK]
[NOT: ağırlık için agirlik_kg kullan]
[NOT: kalite için kalite_standart kullan]
[NOT: yüzey için yuzey_islemi kullan]

projeler: id, tenant_id, tersane_id, proje_no, gemi_adi, proje_tipi, ana_yuklenici, teslim_tarihi, aktif, olusturma
[NOT: projeler tablosunda silindi kolonu YOK]

tersaneler: id, tenant_id, ad, ulke, sehir, aktif
[NOT: tersaneler tablosunda silindi kolonu YOK]

kesim_kalemleri: id, tenant_id, spool_id, malzeme_id, olcu_mm, uc_a, uc_b, bukum_borusu, kesildi, kesim_listesi_no, olusturma
bukum_kalemleri: id, tenant_id, spool_id, malzeme_id, kesim_id, olcu_mm, bukuldu, olusturma
islem_log: id, tenant_id, katman, katman_id, islem, yapan_id, aciklama, meta, spool_id, devre_id, proje_id, olusturma
sevkiyatlar: id, tenant_id, tersane_id, sevk_no, tip, tarih, arac_plaka, irsaliye_no, teslim_alan, not_, olusturma
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
9. spooller: ağırlık='agirlik_kg', kalite='kalite_standart', yüzey='yuzey_islemi' (başka isim kullanma)
10. devreler: termin tarihi='termin', zone='zone', silindi=true olanları hariç tut
11. projeler ve tersaneler tablolarında 'silindi' kolonu YOK — bu filtreyi kullanma
12. spooller tablosunda 'silindi' kolonu YOK
13. 'olusturma' bir kolon adıdır, tablo adı değildir
14. Alias kullanırken tablo adlarıyla karıştırma

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

    const data = await res.json();

    // exec_sql [{exec_sql: [...]}] formatında dönüyor — içini çıkar
    let rows = data;
    if (Array.isArray(data) && data[0] && data[0].exec_sql !== undefined) {
      rows = data[0].exec_sql;
    }
    return { rows: Array.isArray(rows) ? rows : (rows ? [rows] : []) };
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
