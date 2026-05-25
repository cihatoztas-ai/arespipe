# CLAUDE-SONRAKI-OTURUM.md — Oturum 123 ajandası

## Açılış ritüeli (her zaman)
1. `git status` (temiz mi, HEAD `cb3f432` mi)
2. CI rengi (`kontrol.js`)
3. son-durum.md oku
4. Ajanda onayı
5. Açık geri-bildirim sayısı

## ÖNCELİK 1 — Band-B uçtan uca L2 doğrulaması (kapanmamış kanıt)
Oturum 122'de band-B METİN onarımı kanıtlandı (16 assertion + 8 PDF), ama **gerçek L2 motoru NB1137 spool PDF'lerine çalıştırılMADI** (l2-parser/paket modülleri o oturumda yoktu). Yap:
- Gerçek motorda (parse + aileBirlestir tersan_cadmatic_spool) NB1137 spool PDF'lerini çalıştır.
- Doğrula: malzeme satırları INSERT'leniyor mu, `cap_mm`/`schedule`/`malzeme`/`agirlik` doluyor mu, L2 açılıyor mu (L3 değil).
- MK-51.2: 5+ gerçek PDF. Temiz PDF'lerde 0 regresyon (band-A oturumundaki gibi).
- Beklenti güçlü ama TEYİT şart (MK-121.2: "tam onarıldı diye varsayma").

## ÖNCELİK 2 — band_b_meta → _l2_meta entegrasyonu (opsiyonel)
izometri-oku.js `metinNormalle().metin`'i zaten kullanıyor (band-B otomatik). `band_b_meta` (cakisma/ce_kurtarma/eslenmeyen) parse sonucunun `_l2_meta`'sına yazılırsa çakışma/eşlenmeyen izlenebilir olur (MK-96 denetim). Gerekirse ekle.

## ÖNCELİK 3 — Çok-dilli parse (KARAR-122.1, yol haritası hazır)
1. Dil-bağımsız demir: boyut/DN/PN/SCH/malzeme kodu/standart/kg + Cadmatic tablo yapısı (kolon düzeni dil-bağımsız).
2. Kapalı çok-dilli kavram sözlüğü: PIPE←boru/rohr/pipe, ELBOW←dirsek/bogen/elbow, REDUCER, FLANGE, TEE... (~30-50 tip). Sıfır-AI determinist lookup.
3. Başlık boilerplate'inden dil tespiti: "No Adet Açıklama"(TR) / "No Qty Description"(EN) / "Nr Menge Beschreibung"(DE).
4. Bilinmeyen terim → satır düşme YOK; yapısal alanlar parse, açıklamayı _l2_meta'da flag + öğrenme havuzu. AI sadece batch fallback.

## Band-B tablo genişletme (veri gelince)
- `ö` ve büyük Türkçe `Ö/Ü/İ/Ğ/Ş` çıkarsa: BANT_B_TABLO'ya ekle + kelime-başı kurtarmayı Ç gibi simetrik uygula (MK-122.4 — measure-first, spekülatif ekleme yok).

## Açık borçlar (birikmiş)
- 117 (yukleyen_id null, kuyruk-isle-izometri.js:305)
- Aşama 2 (montaj tanıma, fingerprint "Continue:")
- MK-120.6 (L3 politikası)
- Web-side spool status sync (devre_detay, spool_detay.html)
- Fitting library: DIN 86087, ASME B16.9 diğer gruplar

## Hatırlatmalar
- pdf-parse **v1.1.1** zorunlu (MK-119.4), lib yolu `./node_modules/pdf-parse/lib/pdf-parse.js`.
- Modül dönüş sözleşmesi değişmez (MK-122.3) — additive alan ekle.
- arespipe_kopyala sonrası `git status` (MK-101.1). Doc commit'leri `[skip ci]`.
