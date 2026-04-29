# AresPipe — Son Durum

> **Son guncelleme:** 29 Nisan 2026 — 45. oturum kapandı
> **CI:** YESIL
> **Aktif oturum sayisi:** 45

---

## 45. Oturum Özeti

**Tema:** Schema temeli + Format dispatcher altyapısı (parser yazımı 46'ya).

44 sonu CIHAT-PROFIL "atlama, listele, dolu cevap ver" disiplini doğrulandı: parser yazımına körlemesine atlamak yerine önce DB temelini oturttuk + 44 raporundaki iki kritik yanlış tespit edildi:

1. **tersan = Cadmatic, AVEVA E3D değil.** PDF metadata Producer alanı kanıtladı. Mevcut DB'deki "AVEVA E3D" tek kayıt PAOR'a aitti, doğru. tersan ayrı yeni kayıt olarak eklendi.
2. **izometri-oku.js zaten 38'den beri var (985 satır).** "K5/36'da sıfırdan yazılacak" notu 41-44 arası dokunulmadığı için stale kalmış. Strateji değişti: sıfırdan değil, mevcut akışa **deterministik parser branch'i** eklenecek (AI fallback korunur).

İki PDF örneği (tersan M110 spool + PAOR 11D-PAOR-54102-101626-A) detaylı analiz edildi. Parser tasarım kararları netleşti. Cihat'tan gelen pragmatik bilgi: tersan farklı CAD program da kullanabilir, farklı tersaneler farklı format verebilir → fingerprint dar olmalı, yeni format = yeni kayıt (Karar 9 mimarisi).

**Yapılanlar:**
- `017_3d_motor_schema.sql` — `spool_malzemeleri`'ne `sira`, `rotation_angle`, `yonelim_kod` kolonları + 2 CHECK + composite index. Mevcut `x1_mm/y1_mm/z1_mm/x2_mm/y2_mm/z2_mm` doğrulandı (PAOR koordinatları için kullanılacak, dokunulmadı).
- `018_format_tanimlari_sistem_preset.sql` — `izometri_format_tanimlari`'na `sistem_preset BOOLEAN` + CHECK (`sistem_preset=true ⟹ tenant_id IS NULL`) + partial unique `(ad) WHERE sistem_preset=true` + mevcut PAOR kaydı `sistem_preset=true` UPDATE. RLS policy'leri dokunulmadı (riskli, 020+ açık).
- `019_format_tanimlari_tersan_kayit.sql` — "Cadmatic — Tersan Shipyard M110 Şablonu" kaydı eklendi (UUID `c8755d46-...`). `parser_kural` boş, fingerprint dolu.
- tersan + PAOR PDF analizi → parser tasarım haritası (CLAUDE-SON-OTURUM.md detayında).
- 44 raporundaki Cadmatic/AVEVA hatası ve izometri-oku.js mevcut durumu CLAUDE-SON-OTURUM.md'de belgelenmiştir (45 öğrenmesi).

---

## Mimari Kararlar (45)

**MK-45.1 — Parser stratejisi: yamal, sıfırdan değil.**
Mevcut `api/izometri-oku.js` (985 satır, 38-42'de yazılmış AI L3 Vision akışı) korunur. Akışın 4. adımına (`Format bulundu + parser_kural dolu → L1/L2 parse — bu sürümde devre dışı, 38'de`) deterministik parser branch'i eklenecek. AI fallback (5. adım) bozulmaz, eşleşme varsa hiç çağrılmaz. **Saf kazanç stratejisi.**

**MK-45.2 — Format kayıt granülerliği: dar fingerprint, çoklu kayıt.**
"tersan" tek bir kayıt değil. M110 örneğine özel bir kayıt + her farklı tersane/CAD program kombinasyonu için ayrı kayıt. Cihat: *"tersan başka CAD da kullanıyor olabilir, diğer tersaneler farklı dosyalar verebilir."* → Karar 9 (36) mimarisi pratiğe geçti.

**MK-45.3 — Rotation Angle opsiyonel.**
tersan'ın bu örneğinde Cut & Bending Info tablosunda Rotation Angle sütunu var ama BOŞ. Cadmatic dirsek dönüşünü görsel olarak iletiyor (yön okları, izometri çizgisi). Parser opsiyonel olarak okuyacak, NULL kabul. 3D motor Aşama 4.2 (Rotation Angle okuma) ve Aşama 4.3 (manuel düzeltme UI) zaten bu durumla uyumlu.

**MK-45.4 — Migration disiplini iki adımdır.**
45'te iki kez aynı tuzağa düşüldü (018 önce GitHub'a, sonra Supabase atlandı). Doğru sıra: (1) önce Supabase SQL Editor'da çalıştır + doğrula, (2) sonra GitHub'a upload + CI yeşil. Bu sıra kalıcı kural — sonraki oturum açılışına ekle.

---

## Açık Borçlar

### Tamamlandı (45'te)
- ✅ 017 — 3D motor schema kolonları
- ✅ 018 — sistem_preset kolonu + PAOR güncelleme
- ✅ 019 — tersan format kaydı
- ✅ tersan + PAOR PDF örnek analizi → parser regex haritası

### KIRMIZI 46 ana teması — Parser branch'i
- `api/izometri-oku.js` Cihat tarafından bütün halinde yüklenecek (985 satır, sürükle bırak)
- Deterministik parser branch tasarımı (mevcut akışa str_replace patch'leri)
- `parseTersanCadmaticM110(text, dosya_adi)` ve `parsePAORAvevaSTM(text, dosya_adi)` fonksiyonları
- AI fallback korunur, eşleşme varsa devre dışı

### KIRMIZI 46 ikinci ana teması — `020_format_tanimlari_parser_kural.sql`
- tersan + PAOR `parser_kural` JSONB'leri doldur
- `format_kodu` üzerinden kod branch'i tetiklenir

### KIRMIZI 46 üçüncü ana teması — Pilot test
- 1 tersan + 1 PAOR PDF parse → spool_malzemeleri JSON çıktısı
- Manuel onay UI'da görünür (zaten 36'da yapılmıştı)

### SARI Diger acik isler (46+)
- 016 numaralı flanş cizim_path migration disk'te yok (44'te Supabase manuel çalıştırıldı). İleride dökülmesi düzgün migration disiplini için faydalı.
- KK + Sevkiyat sayfa revizyonu (5. oturumdur açık)
- Büküm modal açıklama alanı eksik
- boru_olculer şema güncellenmeli (`tenant_id` + `sistem_preset` — multi-tenant için)
- CuNi P0 grupları
- Eğitim havuzu (Cihat paralel topluyor — anonim eski PAOR/tersan PDF'leri)
- 3D motor Aşama 4.1/4.2/4.3 (parser bittikten sonra)
- devre_yeni.html PDF upload akışı parser'a bağlanması (Cihat paralel: *"buradaki ilerleyişe göre devre yükleme sayfasını güncelleyecem"*)

---

## Vizyon Disiplini

45'te yeni istisna **yapılmadı** ✓. Sadece mevcut altyapıyı (izometri_format_tanimlari + spool_malzemeleri schema) genişlettik. AI maliyet sıfır hedefi tutuyor (henüz parser çalışmadı, ama kod tarafında AI fallback var, deterministik eşleşme varsa AI çağrılmaz).

44'te 4 istisna kapsama alınmıştı. 45 sıfır istisna ile bitti. 5. istisna riski şimdilik yok.

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama pipeline — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır
❌ Klasör yükleme + format tanıma — vizyonda kalır (Cihat'ın bugün gönderdiği zip yapısı esin verdi ama 45 işi değil)
❌ Çapraz validasyon (3 katman) — vizyonda kalır
❌ AI yön çıkarımı — 45'te gerek olmadı (rotation_angle opsiyonel kabulü ile yetindi)

---

> Migration disiplini hatırlatması (her DB değişikliği iki adımdır):
> 1. Önce Supabase SQL Editor → DB'ye uygula + doğrula
> 2. Sonra GitHub'a upload → CI yeşil → versiyonlama
> İkisi de yapılmadan migration "tamamlandı" sayılmaz.
