# son-durum.md — AresPipe güncel durum (oturum 122 kapanışı)

**HEAD:** `cb3f432` | **CI:** yeşil | **Pilot:** test/asama1-pilot.mjs 63 test

## Glyph onarımı — CANLI (Katman 0, lib/glyph-onar.js)
Cadmatic NB1137 export'ları gömülü fontta deterministik kayma uyguluyor. İki bant, ikisi de çözüldü:

- **BAND A** (büyük harf/rakam/noktalama): `onar29` = −29 Sezar. Oturum 121'de canlı.
- **BAND B** (küçük harf/Türkçe): `bandBOnar` = 29-karakter ters tablo (MK-96 çapraz doğrulandı, 8 PDF). Oturum 122'de canlı.

Akış (`metinNormalle`, KAPILI — MK-121.1):
- ham'da çapa var → `durum='temiz'`, DOKUNULMAZ (gerçek Türkçe korunur, band-B çalışmaz).
- ham'da yok, −29 sonrası çapa var → `durum='glyph_band_a_onarildi'`, band-A + band-B uygulanır (`glyph_band_a=true`, `glyph_band_b=true`).
- hiçbir yerde çapa yok → `durum='capa_yok'`, DOKUNULMAZ (doğal L3).

Dönüş: `{metin, glyph_band_a, glyph_band_b, durum, band_b_meta:{cakisma, ce_kurtarma, eslenmeyen}}`.

**Çakışmalar (MK-122.2):** Ç→d (kelime-başı kurtarma ile Çelik korunur), ç→o (Açıklama başlığı kozmetik). band_b_meta'da izli.

## NB1137 spool malzeme tablosu — band-B onarımı sonrası okunur
Boru, Çelik (kurtarıldı), Flanş, Düz, Redüksiyon/Redüser, Konsantrik, Bilezik, Paslanmaz, Dikişsiz/Dikişli, Sertifikalı, boyutlar (139.7x4.5), ST37/316L/PN16/SCH10S/DN — hepsi doğru okunuyor. **Metin onarımı kanıtlandı (16 assertion + 8 PDF). UÇTAN UCA L2 doğrulaması (gerçek motor) HENÜZ YAPILMADI — sonraki oturum (MK-51.2).**

## Eksik tablo karakterleri (gözlemlenmedi, eklenmedi — MK-122.4)
`ö`, büyük Türkçe `Ö/Ü/İ/Ğ/Ş`. Bu 8 PDF'te hiç geçmedi. Çıktıklarında tabloya + kelime-başı kurtarmaya eklenir.

## Açık borçlar (oturum 122 kapsamı dışı)
- **117:** yukleyen_id null → sistem yüklemeleri izometri batch'te parse edilemiyor (api/kuyruk-isle-izometri.js:305). Veri sahipliğine dikkat (KARAR-48.1).
- **Aşama 2:** montaj tanıma boşluğu (fingerprint "Continue:" ister, 2/7 montaj taşımaz).
- **MK-120.6:** L3 politikası.
- **Web-side spool status sync:** devre_detay tablo görünümü + spool_detay.html `aktif_basamak`/`ilerleme` DB-truth'tan okumalı.
- **Fitting library:** DIN 86087 (saddle), ASME B16.9 diğer malzeme grupları.

## Stack
Supabase/PostgreSQL (RLS, migration), Vercel serverless, Vanilla JS/HTML, GitHub Actions CI (kontrol.js/kontrol.yml). pdf-parse v1.1.1 ZORUNLU (MK-119.4). Mobil PWA: arespipe-mob (React).
