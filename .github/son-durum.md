# AresPipe — Son Durum

> **99. oturum kapanışı — 19 Mayıs 2026**
> Bu dosya her oturum başında ilk okunan kayıttır. Güncel CI durumu + açık borçlar + sonraki oturum gündemi burada.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit'ler: `8230e77` adım 2 → `7f5bb80` adım 3 → `ee736c3` adım 4 fix → 99 kapanış commit'i)
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production aktif
- **Migration sayısı:** 82 (son: `082_devre_belgeleri_mime_genisletme.sql`, canlıda 19 May 12:05)
- **99 sonrası:** Devre wizard v2 pilot tenantlarda canlı (Demo Atölye/A + Demo Tersane A.Ş./E). Smoke test 24/25 (1 .DS_Store bilerek atlandı).

---

## 99. Oturum Özeti

**Ana tema:** Devre wizard UI iskeleti — mevcut aktif devreye klasör yükleme akışı (Senaryo A1).

**Süreç:** Plan ~2-3 saatlik tahmin etmişti, gerçek süre ~5 saat (Downloads klasör temizliği + 2 smoke test iterasyonu + i18n eklemesi dahil). 4 adım:

1. **Sidebar entegrasyonu** (devreler.html + 3 dil dosyası, commit `8230e77`)
2. **Bucket migration + wizard iskeleti** (migration 081 + devre_wizard.html, commit `7f5bb80`)
3. **İlk smoke test** — 9/16 başarılı, 3 sorun tespit
4. **Düzeltmeler + ikinci smoke test** — 24/25 başarılı (sadece .DS_Store filtrelendi)

**Yazılan/değişen dosyalar:**
- `devreler.html` (+22 satır, wizard giriş butonu + feature flag check)
- `devre_wizard.html` (yeni, 752 satır) — 4 adımlı wizard UI
- `migrations/081_devre_belgeleri_storage_bucket.sql` (153 satır) — bucket + 3 RLS policy
- `migrations/082_devre_belgeleri_mime_genisletme.sql` (71 satır) — macro-Office MIME genişletme
- `lang/tr.json`, `lang/en.json`, `lang/ar.json` — 32 yeni i18n anahtarı (dr_new_circuit_wizard + 31 dw_*/cmn_*/nav_*)

**DB değişikliği yapıldı mı?** Evet:
- **`tenant_features`** — `devre_wizard_v2` flag 2 pilot tenantta `aktif=true` (A: Demo Atölye, E: Demo Tersane A.Ş.)
- **`storage.buckets`** — 1 yeni bucket: `devre-belgeleri` (private, 50 MB, 15 MIME)
- **`storage.policies`** — 3 yeni policy (SELECT/INSERT/DELETE) — izometri-pdfs pattern'iyle tutarlı
- **`devre_dokumanlari`** — smoke test sırasında 24 satır (2 farklı devreye), parse_durumu='tamamlandi'
- **`dosya_isleme_kuyrugu`** — 24 kuyruk satırı, parser='sakla', durum='tamamlandi'

**Smoke test sonucu (2 iterasyon):**

| Iterasyon | Devre | Dosya | Başarılı | Hata | Sebep |
|---|---|---|---|---|---|
| #1 | 88ae46e4 | 16 | 9 | 7 | 5× Türkçe karakter (İ/ı/ş/ğ), 2× .xlsm MIME yok, 1× .DS_Store yüklendi (cosmetic) |
| #2 | 4c592886 | 15 | 15 | 0 | .DS_Store bilerek filtrelendi (16 → 15) — TAM BAŞARI |

**Smoke test #2 doğrulama:** Storage'da slugify ASCII (`Donatim_Kontrol_Formu.xlsx`), DB'de orijinal isim (`Donatım Kontrol Formu.xlsx`) korundu. Türkçe → ASCII çevrim sorunsuz.

**Üçüncü smoke test:** Aynı klasörü aynı devreye 3. kez yüklemeye çalıştı → 15/15 "The resource already exists" (upsert=false bilerek). Bu **istenen davranış** (veri kaybı önleme), sadece hata mesajı Türkçeleştirildi (`hataMesajiTr()` helper).

---

## Açık Borçlar (99 sonu)

### Acil (100 gündemi)
- ⚪ **Devre detay'da belge listesi UI yok** — wizard yüklediği dosyalar `devre_dokumanlari` tablosunda duruyor ama `devre_detay.html`'de görünmüyor. Kullanıcı yüklediğini göremez. Memory'de 104'tü ama 100 başına çekilebilir.
- ⚪ **100. oturum ana iş:** Excel generic parser (`bom_excel` tipi için, L1 sözlük + L2 pattern, L3 Haiku ileride) + `pipeline_malzemeleri` INSERT (multi-spool BOM).

### Önemli (100+)
- ⚪ **Wizard UX iyileştirme** — Adım 2'de "zaten yüklendi" badge'i (önceden DB query), Adım 4'te görsel polish ("daha havalı" — Cihat dedi). Cihat 100+'a bıraktı.
- ⚪ **Slugify kozmetik:** `Tutanağı.xlsm` → `Tutanag_i.xlsm` (ğ+ı arasına _ giriyor). Beklenen `Tutanagi.xlsm`. Düşük öncelik.
- ⚪ **Re-açma senaryosu** — Pasif devreye yeni spool geldiğinde wizard'da görünmüyor (A1 filtresi `silindi!=true` ama "pasif" tanımı kodda hesaplanan). Düşük frekans iş senaryosu, A2'ye geçmek gereksiz. Üç seçenek (a) "yeniden aç" butonu, (b) "pasif devreleri göster" toggle, (c) otomatik re-aktif. Pilot kullanım gözlemlenince karar.
- ⚪ **101**: İzometri batch entegrasyonu + Faz 1/Faz 2 kuyruğu (mevcut `api/izometri-oku.js` wrapper)
- ⚪ **102**: Füzyon motoru + çelişki ekranı + manuel onay
- ⚪ **103**: STP tek-spool parser (B-spline → silindir fitting)
- ⚪ **104**: Rhino parser + Windows Gezgini UI

### Opsiyonel
- ⚪ AVEVA AP214 çıkış denemesi
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu
- ⚪ i18n anahtar consolidation refactor (`cmn_iptal` vs `btn_iptal` vs `dny_cancel` — aynı metin 5+ yerde)
- ⚪ Soft delete cron işi (30 gün sonra kalıcı silme)
- ⚪ Format envanter UI (super_admin)
- ⚪ Etkileşimli format öğretme modal
- ⚪ Hatalı kayıt aksiyonları (kuyruk-yeniden-dene, kuyruk-sil, kuyruk-pdf-indir)

---

## Aktif Süreç Disiplinleri

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti
- **MK-49.1:** `izometri-oku.js`'e dokunma — minimum değişiklik
- **MK-50.1:** Hassas anahtar Claude'a verme
- **MK-50.3:** Yeni format için parser_kural yazmadan önce 3+ başarılı AI örneği
- **MK-50.4:** Dotfile oluşturduktan sonra `ls -la` kontrol
- **MK-51.1:** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula
- **MK-51.2:** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et
- **MK-52.1:** `arespipe_kopyala` MD5 doğrulamalı dosya kopyalama
- **MK-52.2:** `gp` otomatik rebase + push
- **MK-98.1:** Yeni feature flag eklerken `feature_flags` master kayıt önce, master tablo için DB keşif sorgusu zorunlu
- **MK-98.2:** Şema migration'larında `BEGIN...ROLLBACK` kuru çalıştırma zorunlu
- **MK-98.3:** Terminal yapıştırmada `\` line continuation yerine `&&` zinciri
- **MK-98.4:** SQL'i "Supabase SQL Editor →" başlığıyla ver, terminal komutları `bash` bloğunda
- **MK-99.1 (yeni):** Migration policy'lerinde `DROP IF EXISTS ... CREATE` idempotent pattern zorunlu. "policy already exists" hatası önlenir.
- **MK-99.2 (yeni):** Storage path patterni izometri-pdfs ile tutarlı, **`{tenant_id}/...`** (tenants/ prefix YOK), RLS: `(storage.foldername(name))[1] = tenant_id::text`.
- **MK-99.3 (yeni):** Wizard dosya yüklemesinde DB'de orijinal isim (Türkçe karakter dahil) korunur, Storage key slugify ile ASCII'ye çevrilir. `dosya_adi` vs `storage_yolu` ayrımı kullanıcıya görünmez.
- **MK-99.4 (yeni):** `.DS_Store`, `Thumbs.db`, `desktop.ini`, `__MACOSX`, `.` ile başlayan hidden file/folder'lar yüklemede otomatik atlanır. Console log: kaç dosya atlandı.
- **KARAR-97.0:** Yeni tablolar mevcut sisteme dokunmaz (geri alma garantisi)

---

## Performans

- **L2 parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **Format tanıma:** <100 ms/PDF
- **Wizard yükleme:** ~15 dosya / 7 saniye (storage upload + DB insert + queue insert)

---

## 100 Hazırlık Notu

100 ~3-4 saatlik iş. **İki ana hedef:**

1. **Excel generic parser** (`bom_excel` tipi için) — L1 sözlük match + L2 pattern + L3 Haiku fallback (sonraya)
2. **Devre detay'da belge listesi UI** (acil — kullanıcı yüklediğini göremiyor)

Sıralama: önce **UI** (yüklenen dosyalar görünür hale gelmeli), sonra **parser** (gerçek BOM'lar otomatik dolar). 100'ün gündemi `CLAUDE-SONRAKI-OTURUM.md`'de detaylı.

Detay: `CLAUDE-SONRAKI-OTURUM.md`.

---

> 100. oturum açılışında bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` okunur.
