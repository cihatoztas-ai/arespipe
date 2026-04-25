# AresPipe — Son Durum

**Son güncelleme:** 25 Nisan 2026 Cumartesi, 32. oturum sonu

---

## 32. Oturumda Olanlar (özet)

**Tema:** Defter temizliği — bekleyen SED maddelerini sırayla kapatma + Vercel rate limit dersi

**Tamamlananlar (6):**
1. ✅ **Orphan 2 feedback kaydı silindi** (DB + Storage) — 31'in test artıkları
2. ✅ **GitHub Actions v4 → v5** (`actions/checkout` + `actions/setup-node`) — 29'dan beri açık deprecation borç
3. ✅ **S1** spool_detay belge yükleme/silme DB'ye yazıyor — bucket upload + DB insert + soft delete + optimistic UI rollback. Yan tespit: `tur/tip` schema drift bug'ı (S2'nin kardeşi) kapatıldı. F5 + sayfadan çıkıp gelme testi geçti.
4. ✅ **D5** devre_detay belge yükleme bucket'a yazıyor + aç butonu (↗) — signed URL helper, "pending:" eski kayıtlar için backward-compat. F5 testi geçti.
5. ✅ **D6** devre_detay 10 sessiz `console.warn` toast bildirimine dönüştü — kullanıcı action'larında yanıltıcı başarı toast'ı önlendi (try/catch'te toast + erken return)
6. ✅ **D3 kod hazırlığı** tersane_is_emri DB kolonu (001 migration eklendi, manuel SQL atıldı) + kod fix (`devreYukle` DB'den okur, `tersaneIsEmriKaydet` DB'ye yazar). **Vercel rate limit nedeniyle deploy 33. oturuma ertelendi**, kanıtlanmış: `tersaneIsEmriKaydet.toString().includes('supa.from')` → `false` (eski kod hâlâ canlıda).

**Yarım kalan / 33'e devir (2):**
1. 🟡 **D3 canlı doğrulama** — Vercel deploy bekliyor. Test komutu: tarayıcı console'da `tersaneIsEmriKaydet.toString().includes('supa.from')` → `true` olmalı, sonra "tersane iş emri gir → kaydet → F5 → durur mu" testi yapılır.
2. 🟡 **G-08 görsel inceleme** — devre_detay'a skeleton+cascade pattern uyarlandı (devreler.html birebir referans alındı), Cihat "tam aynı değil" dedi ama somut fark belirtilmedi. 33. oturumda iki sayfayı yan yana açıp fark bulunacak.

**Atlananlar / sonraya:**
- `db-backup.yml` cron düzeltmesi (TR 03:00 hedef) — bu oturumda erteledik, defterde duruyor

---

## ⚠ Aktif Borçlar — 33. Oturum Başında Dikkat

- 🟡 **D3 deploy doğrulama** + canlı test — Vercel açıldığında ilk iş
- 🟡 **G-08 görsel fark tespiti** (devre_detay vs devreler) — Cihat onayı bekliyor
- 🟡 **Vercel ignoreCommand fix** — `vercel.json`'a `arespipe-mob` için `mobile/` haricinde build engelleyen kural (Vercel Hobby 100 deploy/gün, fiili 50 push/gün — kapsam genişletmeli)
- 🟡 **SBD-01 vs GitHub Issues kararı** — 32. oturumda atlandı, 33+ Cihat seçecek
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa eksik (15 yüksek öncelik), 33-34 oturumlarına dağıtılabilir
- 🟢 **G-09 (filtre çubuğu) ve G-10 (üst aksiyon çubuğu)** — kural numaraları rezerve, teknik spec sonra
- 🟡 **db-backup.yml cron düzeltmesi** — TR 05:55 yerine TR 03:00, tek satır iş, sonraki oturumda

**Önceki dönemlerden devreden:**
- 🟡 ✅ `actions/checkout@v4` + `setup-node@v4` deprecation — **32'de v5'e güncellendi**
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
- devre_detay: D4 (KK/Sevk listeleri dolmuyor — okuma yok), **D7 (durdurma_tarihi kolonu yok — 33. oturumda yapılabilir, Vercel-bağımsız)**

---

## Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| 31 | Bucket PRIVATE Faz 3-6 + SED başlangıç + G-08 envanter | ✅ |
| **32** | **Defter temizliği — orphan, v5, S1, D5, D6 + D3/G-08 yarım** | **✅ TAMAMLANDI** |
| **33** | **Vercel-bağımsız işler önde: D7, defter, kurallar.json + Vercel açıldığında D3/G-08 doğrulama + Sentry vs G-08 kararı** | **Sırada** |
| 34 | Email sistemi | 1 kayma (32 dolu) |
| 35 | Staging Supabase + migration runner | 1 kayma |
| 36 | Tenant izolasyon testleri + feature flag | 1 kayma |

**37'den itibaren ÜRÜN DÖNEMİ.**

### Kural Sağlık Kontrolü
- **Son self-test:** 24 Nisan 2026, 28. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 33. oturum (28→33, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan)

### **`docs/SAYFA-EKSIKLERI.md`** — defter
Sayfa-bazlı eksiklerin defterli takibi. SED-01 (backend) + G-08 (görsel ritüel) kurallarının kayıt yeri. **32'de:** S1, D5, D6 ✅ kapatıldı. D3/G-08 deferred. D7 sıradaki açık D maddesi.

### **`migrations/001_devreler_tersane_is_emri_ekle.sql`** — yeni
D3 fix migration'ı. Manuel SQL ile uygulandı (canlı), dosya repo'da tarihsel takip için.

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
- **Workflow:** `.github/workflows/db-backup.yml` — her gece UTC ~02:55 (TR 05:55) — **plana göre 3 saat geç**, 33+ düzeltilecek (`0 0 * * *` UTC = TR 03:00)
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling

### **Migrations** (27-28. oturum)
- **Klasör:** `migrations/`
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Yeni:** `001_devreler_tersane_is_emri_ekle.sql` (32. oturum)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `kontrol.yml` (28. oturumda entegre)

### **Vercel Env Variables**
- `SUPABASE_URL` (public)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive)
- `ANTHROPIC_API_KEY` (🔒 Sensitive)

### **Vercel Ignored Build Step** (30. oturum)
- **Yöntem:** `vercel.json` `ignoreCommand` alanı
- **Kural:** `.github/`, `docs/`, `*.md` değişiklikleri Vercel build'ini skip eder
- **⚠ 33+ planlanan:** `arespipe-mob` projesi için `mobile/` klasörü değişmedikçe build skip — Hobby plan rate limit yarıya iner

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
- **Schema drift uçtan uca tarama** (insert + read + render + map noktaları) (32. oturum dersi)
- **Yanıltıcı başarı toast'ı önle** — try/catch'te toast + erken return (D6 dersi)
- **Deploy doğrulama tekniği:** "Yeni kod canlıda mı?" sorusunun cevabı `fnAdı.toString().includes('yeniSatır')` (32. oturum dersi)
- **Vercel push tasarrufu** — gereksiz commit'i toplu yap, mob projesi için ignoreCommand genişlet
