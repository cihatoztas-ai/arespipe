# AresPipe — Son Durum

**Son güncelleme:** 25 Nisan 2026 Cumartesi, 33. oturum sonu

---

## 33. Oturumda Olanlar (özet)

**Tema:** Vercel-bağımsız işler — D7 + D4 kapatma, defter temizliği, self-test günü

**Tamamlananlar (5):**
1. ✅ **Self-test 4/4 başarılı** (33 = 5'in katı, zorunlu) — Faz B kuralları sağlıklı, sapmama sistemi 5 oturumdur ayakta. Sonraki zorunlu self-test: 38. oturum.
2. ✅ **D7 — `durdurma_tarihi` kolonu** (`devreler` tablosu) — Migration `002_devreler_durdurma_tarihi_ekle.sql`, 7 patch (devre_detay state + 2 write, devreler write + 2 SELECT + state). Canlı test: AT110-Drencher-Galv'de durdur → tarih dolu, kaldır → tarih null. Schema drift dersi (S2/32) uygulandı: insert + read + render + map noktaları uçtan uca tarandı. Commit `ad9fb27`.
3. ✅ **db-backup.yml cron defter güncellemesi** — Dosya zaten 32'de düzeltilmiş (commit bb03127), defter güncel değildi. 25 Nis sabahki yedek hâlâ eski saatte (02:56 UTC) düştü çünkü cron değişikliği bir sonraki tetiklemeden uygulanır (normal davranış). 26 Nis sabahı backups repo'da yedek saati kontrol → TR 03:00-03:30 ise ✅. Commit `d703742`.
4. ✅ **D4 — KK ve Sevkiyat listeleri** (`devre_detay` sayfası) — Yeni `kkSevkYukle()` fonksiyonu: kk_davet_spooller ve sevkiyat_spooller'dan inverse sorgu, master tabloları çekiyor. `_kkRender()` + `_sevkRender()` helper'ları. DOMContentLoaded + pageshow + visibilitychange + gonderKaydet zincirlerinde otomatik yenileme (4 yer). Canlı test: KK-926323 daveti 8 spool ile listelendi. Defterin "ürün dönemi (35+)" tahmininden çok önce kapandı (~45 dk). Commit `7db5979`.
5. ✅ **`.DS_Store` repo'dan temizlendi** — stash + drop ile macOS metadata commitler dışında kaldı.

**Yarım kalan / 34'e devir (3):**
1. 🟡 **db-backup.yml cron canlı doğrulama** — 26 Nis sabahı backups repo commits'inde yedek saatine bakılır. TR 03:00-03:30 ise ✅, hâlâ 05:55 ise farklı sürükleyici aranır.
2. 🟡 **D3 canlı doğrulama** — Vercel açıldığında. Test: tarayıcı console'da `tersaneIsEmriKaydet.toString().includes('supa.from')` → `true` olmalı.
3. 🟡 **G-08 görsel inceleme** — devre_detay vs devreler.html yan yana, somut fark tespiti. 32'den devir.

---

## ⚠ Aktif Borçlar — 34. Oturum Başında Dikkat

- 🟡 **D3 deploy doğrulama** — Vercel açıldığında ilk iş
- 🟡 **db-backup canlı doğrulama** — 26 Nis sabah yedek saati kontrolü (1 dk iş)
- 🟡 **G-08 görsel fark tespiti** (devre_detay vs devreler) — Cihat onayı bekliyor
- 🟡 **Vercel ignoreCommand fix** — `vercel.json`'a `arespipe-mob` için `mobile/` haricinde build engelleyen kural (Vercel Hobby 100 deploy/gün, fiili 50 push/gün — kapsam genişletmeli)
- 🟡 **SBD-01 vs GitHub Issues kararı** — 32'de atlandı, 34+ Cihat seçecek
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa eksik (15 yüksek öncelik), 34-35 oturumlarına dağıtılabilir
- 🟢 **G-09 (filtre çubuğu) ve G-10 (üst aksiyon çubuğu)** — kural numaraları rezerve, teknik spec sonra

**Önceki dönemlerden devreden:**
- 🟡 ✅ `actions/checkout@v4` + `setup-node@v4` deprecation — 32'de v5'e güncellendi
- 🟡 ✅ `arespipe-dev` proje incelemesi — kapatıldı (canlı üretim olduğu doğrulandı)
- 🟢 `sorgula.js` JWT-bazlı auth refactor — body'den tenant_id alıyor (güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06) — 26'dan devir
- 🟢 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟢 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟢 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 help.html son kullanıcı dokümantasyonu

**Defter'deki açık SED maddeleri (`docs/SAYFA-EKSIKLERI.md`):**
- spool_detay: S3 (AI toolbar gizli — bilinçli), S4 (QR indirme yarım — bilinçli)
- devre_detay: ~~D4~~ ✅ (33'te kapandı), ~~D7~~ ✅ (33'te kapandı)
- **Yeni gözlem:** Spool numaraları KK listesinde "S01, S01, S01..." şeklinde tekrar ediyor. `spool_no` field formatı ayrı bir kalem (D8 olarak işaretlenebilir, 34+).

---

## Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| 31 | Bucket PRIVATE Faz 3-6 + SED başlangıç + G-08 envanter | ✅ |
| 32 | Defter temizliği — orphan, v5, S1, D5, D6 + D3/G-08 yarım | ✅ |
| **33** | **Vercel-bağımsız işler: self-test, D7, db-backup defter, D4** | **✅ TAMAMLANDI** |
| **34** | **26 Nis backup doğrulama + D3 Vercel test + G-08 görsel + kullanıcı değerine geçiş** | **Sırada** |
| 35 | Email sistemi (1 kayma) | — |
| 36 | Staging Supabase + migration runner | — |
| 37 | Tenant izolasyon testleri + feature flag | — |

**38'den itibaren ÜRÜN DÖNEMİ.**

### Cihat'ın 33'te Sorduğu Stratejik Soru

> "Altyapı için yapılacak daha neyimiz var, normal sayfalara devam edebilir miyiz?"

**Cevap özeti:** Kritik altyapının ~%70'i hazır. Açık 3 madde (email, tenant izolasyon testi, Sentry) **SaaS satışı öncesi** kritik — yani 2-3 ay sonra. **Bugün aciliyetleri yok.** Önerim: 34'ten itibaren **A yolu (kullanıcı değeri)** — operasyon sayfaları, açık SED'ler, mobil sayfalar, Spool AI prototipleri.

---

### Kural Sağlık Kontrolü
- **Son self-test:** 25 Nisan 2026, 33. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 38. oturum (33→38, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan)

### **`docs/SAYFA-EKSIKLERI.md`** — defter
Sayfa-bazlı eksiklerin defterli takibi. SED-01 (backend) + G-08 (görsel ritüel) kurallarının kayıt yeri. **33'te:** D7, D4 ✅ kapatıldı. D3/G-08 33'ten 34'e devir. spool_detay S3/S4 bilinçli ertelenmiş.

### **`migrations/002_devreler_durdurma_tarihi_ekle.sql`** — yeni
D7 fix migration'ı. Manuel SQL ile uygulandı (canlı), dosya repo'da tarihsel takip için.

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu. **31'de küçük kazanç:** S2 fix ile `egitim_verisi` insert artık çalışıyor.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24-25. oturumda implement edildi.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir.

### Oturum Arşivi: `docs/sessions/archive-01-22.md`
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### **Yedekleme Sistemi** (27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — cron `0 0 * * *` (UTC 00:00 = TR 03:00). 32'de düzeltildi (commit bb03127). 25 Nis sabahki yedek hâlâ eski saatte (02:56 UTC) çünkü cron değişikliği bir sonraki tetiklemeden uygulanır. **26 Nis doğrulaması beklemede.**
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling

### **Migrations** (27-28. oturum)
- **Klasör:** `migrations/`
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Yeni:** `001_devreler_tersane_is_emri_ekle.sql` (32. oturum), `002_devreler_durdurma_tarihi_ekle.sql` (33. oturum)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `kontrol.yml` (28. oturumda entegre)

### **Vercel Env Variables**
- `SUPABASE_URL` (public)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive)
- `ANTHROPIC_API_KEY` (🔒 Sensitive)

### **Vercel Ignored Build Step** (30. oturum)
- **Yöntem:** `vercel.json` `ignoreCommand` alanı
- **Kural:** `.github/`, `docs/`, `*.md` değişiklikleri Vercel build'ini skip eder
- **⚠ 34+ planlanan:** `arespipe-mob` projesi için `mobile/` klasörü değişmedikçe build skip — Hobby plan rate limit yarıya iner

### **Storage Bucket** (✅ 31. oturumda PRIVATE doğrulandı)
- **Bucket:** `arespipe-dosyalar`
- **Durum:** PRIVATE (toggle KAPALI), 6 RLS politikası aktif
- **API endpoint:** `api/dosya-url-al.js` — canlıda
- **Helper:** `ARES.dosyaUrlAl(yol)` — `ares-store.js` v2.4'te
- **Cache:** 1 saatlik signed URL + 5 dakika güvenlik payı

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil
- **Toplu sed öncesi tek dosyada test** — idempotent değil
- **Bug sorulduğunda "aslında ne arıyorsun" sor**
- **Schema değişikliği planlarken information_schema sorgusu zorunlu** (S2 + tur/tip dersi)
- **Schema drift uçtan uca tarama** (insert + read + render + map noktaları) (32+33. oturum dersi — D7'de tekrar uygulandı)
- **Yanıltıcı başarı toast'ı önle** — try/catch'te toast + erken return (D6 dersi)
- **Deploy doğrulama tekniği:** "Yeni kod canlıda mı?"
- **Defter notuna saygı, ama kullanıcı isteği üstün** (33. oturum dersi — D4 "ürün dönemi 35+" notluydu, Cihat istedi, yapıldı, çalıştı)
- **Cron değişikliği bir sonraki tetiklemeden uygulanır** — yapılan değişiklikten hemen sonraki çalıştırmayı eski saatle yakalama (33. oturum dersi)
