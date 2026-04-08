// api/izometri-oku.js — Vercel Edge Function
// PDF izometri → Claude API → spool listesi JSON
// API key frontend'e asla gitmez

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Sen bir tersane boru imalat sisteminin veri çıkarma asistanısın.
Sana bir izometri PDF'i verilecek. Bu PDF'den spool (boru demeti) listesini çıkarman gerekiyor.

Her spool için şu bilgileri bul:
- pipeline_no: Pipeline/hat numarası (örn: K110-721, F300-809)
- spool_no: Spool numarası (örn: S01, S02, S-01)
- cap_mm: Dış çap milimetre cinsinden (örn: 114.3, 88.9, 60.3). DN veya inch verilmişse mm'ye çevir.
- malzeme: Malzeme kategorisi — sadece şunlardan biri: "Karbon Çelik", "Paslanmaz Çelik", "Alüminyum", "Bakır Alaşım"
- kalite: Malzeme kalitesi/standardı (örn: A106-B, A312-TP316L, St37)
- et_mm: Et kalınlığı mm cinsinden (sayı, yoksa null)
- boy_mm: Yaklaşık boy/uzunluk mm cinsinden (sayı, yoksa null)
- agirlik_kg: Ağırlık kg cinsinden (sayı, yoksa null)
- adet: Kaç adet (genellikle 1, yoksa 1 varsay)
- rev: Revizyon kodu (örn: A, B, C1, yoksa null)

Sadece JSON döndür, başka hiçbir şey yazma. Format:
{
  "spooller": [
    {
      "pipeline_no": "K110-721",
      "spool_no": "S01",
      "cap_mm": 114.3,
      "malzeme": "Karbon Çelik",
      "kalite": "A106-B",
      "et_mm": 8.56,
      "boy_mm": 2450,
      "agirlik_kg": 42.3,
      "adet": 1,
      "rev": null
    }
  ],
  "proje_no": "NB1099C",
  "tersane": "Tersan",
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
        model: 'claude-sonnet-4-5',
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

    // JSON'u parse et — kod bloğu varsa temizle
    let parsed;
    try {
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'JSON parse hatası',
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
