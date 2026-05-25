# CLAUDE-SONRAKI-OTURUM.md — Oturum 124 ajandası

## Açılış ritüeli (her zaman)
1. `git status` (temiz mi, HEAD `8f39de8` mi)
2. CI rengi (`kontrol.js`)
3. son-durum.md oku
4. Ajanda onayı
5. Açık geri-bildirim sayısı

## ÖNCELİK 1 — Montaj toplu re-parse (MK-123.D çözümü)
Kök neden 123'te mühürlendi: ~289 montaj `parse_sonuc`'u BAYAT (`montaj_var=false`), bu yüzden `montajEslestir` çağrılmamış, `montaj_json` boş, spool detayda 🔧 Montaj Resmi gelmiyor. Yeni devre (Y100-817-012) yeni kodla DOĞRU eşleşti → mekanizma sağlam, sadece eski sonuçlar bayat.

**Önce TEK montajla canlı kanıt (körlemesine 289'a dokunma):**
- Aday: `E120-722-1021-ALS.1.pdf`, kuyruk_id `4d6a3607-e98d-45e6-9837-c021f1fc8d5c`, devre `e07ba2db-47d9-49e7-9d2b-35aa0d297cfa`. O devrede 2 spool (A-001010/S01, A-001011/S02), ikisinde montaj_json boş (123'te doğrulandı).
- Adım 1: `UPDATE dosya_isleme_kuyrugu SET durum='bekliyor' WHERE id='4d6a3607-...';` (Supabase SQL Editor — TERMINALE DEĞİL).
- Adım 2: drenajı tetikle (devre_detay "Bekleyenleri işle" butonu, devre-özgü MK-112.3; yoksa curl endpoint).
- Doğrula: başlangıç sorgusu tekrar → `montaj_json_dolu=true` (A-001010, A-001011)?
- Çalışırsa: 289 bayat montajı toplu re-parse. Worker satır 126 sadece `bekliyor`/`hata` işler → durumu `bekliyor`'a çekmek gerek. `eslestirme-backfill.js` endpoint bu iş için değerlendirilebilir.

Başlangıç doğrulama sorgusu (Supabase SQL Editor):
`SELECT spool_id, spool_no, pipeline_no, (montaj_json IS NOT NULL) AS montaj_json_dolu FROM spooller WHERE devre_id = 'e07ba2db-47d9-49e7-9d2b-35aa0d297cfa' AND pipeline_no = 'E120-722-1021-ALS' AND silindi IS NOT TRUE ORDER BY spool_no;`

## ÖNCELİK 2 — A-NOT parse kaynak düzeltmesi
`izometri-oku`/L2 parser boş NOT alanını `","` (tek noktalama) ile yazıyor → `spooller.imalat_not`'a çöp birikiyor. 123/B render'da gizledi ama kaynak duruyor. "Anlamlı NOT yoksa null yaz" düzeltmesi (parse motoru — risk, dikkatli). İstersen mevcut çöp kayıtları için tek seferlik temizlik UPDATE (`imalat_not` sadece-noktalama olanları null'a çek).

## ÖNCELİK 3 — boy_mm int yuvarlama borcu
Motorda `_tipCevir` 95.25→95 yuvarlıyor; fitting kesim boyunda mm-altı kayıp. Motor değişikliği riskli — ayrı, dikkatli iş.

## Demo tenant hazırlığı (Cihat'ın planı, henüz değil)
Pilot tersaneye demo kullanıcı verip kendi ~50 gemilik arşivini wizard'dan girmelerini sağlamak (Cadmatic 40+ çeşit gelir, format öğrenme pasif zenginleşir). Davet ÖNCESİ: RLS/tenant izolasyon doğrulaması + 117 kontrolü. Spekülatif örnek toplama YOK.

## Açık borçlar (birikmiş)
- 117 (yukleyen_id null, kuyruk-isle-izometri.js:305) — ~11 montaj/sistem yüklemesi etkiliyor.
- MK-120.6 (L3 politikası tasarımı, uygulama bekliyor).
- Montaj aşama tanıma (fingerprint "Continue:", 2/7 montaj taşımaz).
- Fitting library: DIN 86087 (saddle), ASME B16.9 diğer malzeme grupları.
- Çok-dilli parse (KARAR-122.1) — gerçek format çeşitliliği gelene kadar ertelendi.
- ÖNCELİK 2 (band_b_meta → _l2_meta entegrasyonu, opsiyonel) — başlanmadı.
