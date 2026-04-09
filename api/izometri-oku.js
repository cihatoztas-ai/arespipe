// api/izometri-oku.js — Vercel Edge Function
// PDF izometri → Claude API → spool listesi JSON
// API key frontend'e asla gitmez

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Sen bir tersane boru imalat sisteminin veri çıkarma asistanısın.
Sana bir izometri PDF'i verilecek. Bu PDF'den spool (boru demeti) listesini çıkarman gerekiyor.

PIPELINE NO VE SPOOL NO FORMATLAMASI:
Pipeline no şu kurala göre oluşturulur:
1. Pembe/kırmızı çerçeveli proje çizim numarasından son kısmı al (örn: 52900-101540)
2. Zone numarasını al — "Zone 10_001" yazıyorsa sadece "10" kısmını al, "Zone 11_001" → "11" → "Z11". Asla üç haneli yapma.
3. SPOOL bölümünde kaç spool olduğunu say: [1] [2] → 2 spool
4. Pipeline no formatı: [çizim_no]-Z[zone]-[toplam_spool]

Örnek: 52900-101540, Zone 10_001, 2 spool:
→ pipeline_no = "52900-101540-Z10-2" (her iki spool için aynı)
→ Spool 1: spool_no = "S01"
→ Spool 2: spool_no = "S02"

MALZEME LİSTESİ ÇIKARMA:
SADECE FABRICATION MATERIAL LIST bölümündeki kalemleri çıkar.
ERECTION MATERIAL LIST bölümünü TAMAMEN ATLA — bolt, nut, washer, sleeve, u-bolt, plate, gasket gibi montaj malzemeleri dahil edilmez.

FABRICATION listesindeki her kalem için:
- NO: sıra numarası
- kategori: PIPES, FITTINGS, FLANGES grup başlığı
- tanim: MATERIAL DESCRIPTION sütunundaki tam açıklama
- dpn: DPN sütunundaki malzeme kodu
- nbore_dn: N.BORE (DN) sütunundaki değer — sayısal, "200 x 150" ise büyüğünü al
- miktar: QTY sütunundaki değer — "0.7m", "1" gibi tam olarak al

AÇIKLAMADAN BİLGİ ÇIKARMA:
tanim alanındaki açıklamayı parse ederek şu alanları da doldur:
- malzeme_cinsi: ST37→"Karbon Çelik", 316L/304→"Paslanmaz Çelik", CuNi→"Bakır Alaşım"
- kalite_kodu: ST37, A106-B, TP316L vb.
- cap_dn: DN değeri (DN150 → 150)
- et_kalinlik: T: veya WT: sonrasındaki değer (T:4.5 → 4.5)

Örnek: "PIPE SEAMLESS ST37 DIN 2448 DN150 T:4.5 MM"
→ malzeme_cinsi: "Karbon Çelik", kalite_kodu: "ST37", cap_dn: 150, et_kalinlik: 4.5
- Bazı çizimlerde spool numarası köşeli parantez içinde olur: [1], [2], [A], [B]
- Bazılarında S01, S02, S-01, SP1 formatında olur
- SPOOL SAYISI ÇOK ÖNEMLİ:
SPOOL bölümünde köşeli parantezleri say:
- "[1]" = 1 spool
- "[1] [2]" = 2 AYRI spool — ikisini de çıkar
- "[1] [2] [3]" = 3 AYRI spool — hepsini çıkar
Her spool için ayrı bir JSON objesi oluştur. Spool sayısını asla eksik çıkarma!
- PIPE CUT-LENGTHS tablosundaki <1>, <2>, <3> = kesim parçaları, spool sayısı değil
- Pipeline numarası çizim adından, başlık kutusundan veya hat etiketinden alınabilir
- Malzeme listesi "FABRICATION MATERIAL LIST", "ERECTION MATERIAL LIST" veya "MATERIAL LIST" başlığı altında olabilir
- Çap "DN125", "NB125", "4\"", "4 inch" gibi farklı formatlarda gelebilir
- Et kalınlığı "T:8.8", "WT:8.8", "SCH40" gibi yazılabilir
- Kesim uzunluğu "CUT LENGTH", "PIPE CUT-LENGTHS" tablosunda bulunabilir — birden fazla kesim varsa boy_mm olarak toplamı al

YÜZEY İŞLEMİ:
- Çizimin sol alt köşesinde "GALVANIZATION: YES/NO" kutusu var
- YES ise yüzey = "Galvaniz"
- Çizimde "PAINTED", "PAINT" yazıyorsa yüzey = "Boyalı"
- "ACID", "PICKLE" yazıyorsa yüzey = "Asit"
- Belirtilmemişse yüzey = "Siyah"

MALZEME TANIMLAMA:
- ST37, S235, S275, A106, A53, A333 → "Karbon Çelik"
- 316L, 304, 321, TP316L, paslanmaz, stainless → "Paslanmaz Çelik"
- CuNi, Cu-Ni, bakır, copper → "Bakır Alaşım"
- AL, alüminyum, aluminum → "Alüminyum"
- Diğer/bilinmeyen → "Karbon Çelik" (varsayılan)

ÇAP DÖNÜŞÜMÜ (DN → mm dış çap):
DN15→21.3, DN20→26.9, DN25→33.7, DN32→42.4, DN40→48.3, DN50→60.3,
DN65→76.1, DN80→88.9, DN100→114.3, DN125→139.7, DN150→168.3,
DN200→219.1, DN250→273, DN300→323.9, DN350→355.6, DN400→406.4

Her spool için şu bilgileri bul:
- pipeline_no: Pipeline/hat numarası. Bulunamazsa çizim numarasını kullan.
- spool_no: Spool numarası. [1] formatındaysa "S01" olarak yaz.
- cap_mm: Dış çap mm cinsinden (DN dönüşümünü yukarıdan yap)
- malzeme: Yukarıdaki kategorilerden biri
- kalite: Malzeme kalitesi (ST37, A106-B, TP316L vb.)
- et_mm: Et kalınlığı mm (T: veya WT: değeri)
- boy_mm: Kesim uzunluğu mm (CUT LENGTH değeri, yoksa null)
- agirlik_kg: Ağırlık kg (yoksa null)
- adet: Kaç adet (genellikle 1)
- rev: Revizyon kodu (A, B, C1 vb., yoksa null)

Sadece JSON döndür, başka hiçbir şey yazma. Format:
{
  "spooller": [
    {
      "pipeline_no": "52900-101540-Z10-2",
      "spool_no": "S01",
      "cap_mm": 168.3,
      "malzeme": "Karbon Çelik",
      "kalite": "ST37",
      "et_mm": 4.5,
      "boy_mm": 149,
      "agirlik_kg": null,
      "adet": 1,
      "rev": "A",
      "yuzey": "Galvaniz",
      "malzeme_listesi": [
        {"no": 1, "kategori": "PIPES", "tanim": "PIPE SEAMLESS ST37 DIN 2448 DN150 T:4.5 MM", "dpn": "500000157", "nbore_dn": 150, "miktar": "0.7m", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": 4.5},
        {"no": 2, "kategori": "FITTINGS", "tanim": "REDUCER CONCENTRIC SEAMLESS ST37 DIN 2616 DN200XDN150 T:6.3X4.5 MM", "dpn": "500004288", "nbore_dn": 200, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 200, "et_kalinlik": 6.3},
        {"no": 3, "kategori": "FITTINGS", "tanim": "ELBOW SEAMLESS ST37 DIN 2605 1.5D 90° DN150 T:4.5 MM", "dpn": "500001468", "nbore_dn": 150, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": 4.5},
        {"no": 4, "kategori": "FLANGES", "tanim": "FLANGE SLIP-ON ST37 EN 1092-1 TYPE01 DN150 PN16", "dpn": "500020242", "nbore_dn": 150, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": null}
      ]
    },
    {
      "pipeline_no": "52900-101540-Z10-2",
      "spool_no": "S02",
      "cap_mm": 168.3,
      "malzeme": "Karbon Çelik",
      "kalite": "ST37",
      "et_mm": 4.5,
      "boy_mm": 520,
      "agirlik_kg": null,
      "adet": 1,
      "rev": "A",
      "yuzey": "Galvaniz",
      "malzeme_listesi": [
        {"no": 1, "kategori": "PIPES", "tanim": "PIPE SEAMLESS ST37 DIN 2448 DN150 T:4.5 MM", "dpn": "500000157", "nbore_dn": 150, "miktar": "0.7m", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": 4.5},
        {"no": 2, "kategori": "FITTINGS", "tanim": "REDUCER CONCENTRIC SEAMLESS ST37 DIN 2616 DN200XDN150 T:6.3X4.5 MM", "dpn": "500004288", "nbore_dn": 200, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 200, "et_kalinlik": 6.3},
        {"no": 3, "kategori": "FITTINGS", "tanim": "ELBOW SEAMLESS ST37 DIN 2605 1.5D 90° DN150 T:4.5 MM", "dpn": "500001468", "nbore_dn": 150, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": 4.5},
        {"no": 4, "kategori": "FLANGES", "tanim": "FLANGE SLIP-ON ST37 EN 1092-1 TYPE01 DN150 PN16", "dpn": "500020242", "nbore_dn": 150, "miktar": "1", "malzeme_cinsi": "Karbon Çelik", "kalite_kodu": "ST37", "cap_dn": 150, "et_kalinlik": null}
      ]
    }
  ],
  "proje_no": "PAOR",
  "tersane": null,
  "notlar": "Varsa ek notlar"
}

Eğer bir alan bulunamazsa null kullan. Sayısal alanlarda sadece sayı kullan, birim yazma.`;

export default async function handler(req) {
  // CORS
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { pdf_base64, dosya_adi } = body;

    if (!pdf_base64) {
      return new Response(JSON.stringify({ error: 'pdf_base64 gerekli' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key yapılandırılmamış' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Claude API çağrısı
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdf_base64
                }
              },
              {
                type: 'text',
                text: dosya_adi
                  ? `Bu izometri dosyasından spool listesini çıkar: ${dosya_adi}`
                  : 'Bu izometri dosyasından spool listesini çıkar.'
              }
            ]
          }
        ]
      })
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API hatası:', err);
      return new Response(JSON.stringify({ error: 'Claude API hatası: ' + claudeRes.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text || '';

    // JSON'u parse et — kod bloğu varsa temizle, JSON objesi içinde bul
    let parsed;
    try {
      let clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // JSON objesi bulmaya çalış
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) clean = jsonMatch[0];
      parsed = JSON.parse(clean);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Claude JSON üretemedi: ' + text.substring(0, 200),
        raw: text
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, data: parsed }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
