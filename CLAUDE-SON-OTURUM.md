# 99. Oturum — Devre Wizard UI İskeleti (Senaryo A1)

> **Tarih:** 19 Mayıs 2026
> **Tema:** Mevcut aktif devreye klasör/dosya yükleme akışı
> **Süre:** ~5 saat (plan 2-3 saat, gerçek 5 — Downloads temizliği + 2 smoke iterasyon)
> **Sonuç:** ✅ Wizard altyapısı çalışıyor, 24/25 smoke test başarılı (.DS_Store bilerek atlandı)

---

## Yapılan İşler — Adım Adım

### Adım 1 — Pilot Tenant Aktivasyonu (5 dk)

```sql
UPDATE tenant_features SET aktif = true
WHERE feature_kod = 'devre_wizard_v2'
  AND tenant_id IN (
    '00000000-0000-0000-0000-000000000001',  -- A: Demo Atölye
    'aaaaaaaa-0004-0004-0004-000000000004'   -- E: Demo Tersane A.Ş.
  );
```

**Karar (Cihat):** İki tenant — A (Demo Atölye) + E (Demo Tersane A.Ş.) pilot, diğer 5 (B/C/D/F/G) kontrol grubu.

### Adım 2 — Sidebar Entegrasyonu (devreler.html)

Devreler sayfasının sağ üstüne "📁 Klasör Yükle" butonu eklendi, `display:none` ile, feature flag açıkken görünür. Pattern `spool_detay.html:2984` üzerinden kopyalandı.

**Tasarım kararı (Cihat):** Yan yana iki buton (A) — "Yeni Devre" kalır, yanına "Klasör Yükle" eklenir. Pilot dönemde geri dönüş kolay.

**Sadece `devreler.html`'de.** `proje_detay.html`'deki "Yeni Devre" butonuna dokunulmadı (kapsamı dar tutmak için).

**Commit:** `8230e77`

### Adım 3 — Migration 081 + Wizard İskeleti

**Migration 081:** `devre-belgeleri` bucket (private, 50 MB, 11 MIME) + 3 RLS policy (SELECT/INSERT/DELETE).

**Önemli bulgular:**
- **`feature_flags` master tablosu** önceden 5 satırla doluymuş (`ai_izometri`, `musteri_portal`, `raporlar_gelismis`, `hakedis`, `yh_admin_panel_yol_haritasi_sekmesi`). Migration 080'de bu fark edilmemişti, kuru çalıştırma yakaladı.
- **Path pattern uyumsuzluğu** — Migration 081 ilk taslağında `tenants/{tid}/...` kullanmıştım, ama mevcut `izometri-pdfs` bucket'ı `{tid}/...` (tenants/ prefix YOK) kullanıyor. **MK-99.2** olarak kayıt: yeni bucket'lar mevcut pattern'i takip etmeli. Hem migration 081 hem wizard kodu güncellendi.

**Wizard iskeleti (`devre_wizard.html`):** 752 satır, 4 adım:
1. Proje dropdown → Devre dropdown (`silindi != true` filtresi, devreler.html ile tutarlı)
2. Drag-drop klasör/dosya + tip auto-detect (klasor_isim_sozluk öncelik, sonra uzantı) + manuel tip override
3. Yükleme özeti (tipe göre gruplu)
4. Yükleme: Storage upload + `devre_dokumanlari` INSERT + `dosya_isleme_kuyrugu` INSERT (parser='sakla', durum='tamamlandi')

**Upsert kararı:** `upsert: false` (veri kaybı önleme) — aynı dosya iki kez yüklenirse hata. UPDATE policy kasten yazılmadı (izometri-pdfs ile aynı).

**Commit:** `7f5bb80`

### Adım 4 — İlk Smoke Test + Düzeltmeler

**Smoke test #1 (Demo Atölye / A):** 16 dosyalık `AT110-Drencher-Galv` klasörü, 9/16 başarılı.

**Hatalar:**
- **5× "Invalid key"** — Türkçe karakter Storage path'inde: `Donatım Kontrol Formu.xlsx`, `İzometri/AT110-816-026 *.pdf`
- **2× "mime type ... not supported"** — `.xlsm` macro-enabled Excel whitelist'te yoktu: `Resim Teslim Tutanağı.xlsm`, `IFS Malzeme List.xlsm`
- **0× hata, ama sorun:** `.DS_Store` macOS sistem dosyası yüklendi (12 KB)

**3 düzeltme:**

1. **Migration 082** — Whitelist'e 4 yeni MIME: `.xlsm` (macro Excel), `.xltm` (macro Excel template), `.docm` (macro Word), `.pptm` (macro PPT). Toplam MIME: 11 → 15.

2. **`slugifyPath()` fonksiyonu** — Türkçe karakterleri ASCII'ye (İ→I, ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c), non-ASCII'yi `_` yapar. **Önemli:** DB'de `dosya_adi` ve `klasor_yolu` ORIJINAL isim korunur (Türkçe karakter dahil), Storage key sadece slugify. Kullanıcı UI'da Türkçe görür, Storage güvenli ASCII.

3. **`gizliDosyaMi()` fonksiyonu** — `.DS_Store`, `Thumbs.db`, `desktop.ini`, `__MACOSX`, `.` ile başlayan hidden file/folder otomatik atlanır. Console: `[wizard] N gizli/sistem dosyası atlandı`.

**Smoke test #2 (Demo Atölye / A, farklı devre):** Aynı klasör, **15/15 başarılı** (.DS_Store filtrelendi, 16→15). Slugify doğrulandı:

| Orijinal (DB.dosya_adi) | Storage path (sondan) |
|---|---|
| `Donatım Kontrol Formu.xlsx` | `Donatim_Kontrol_Formu.xlsx` ✅ |
| `Resim Teslim Tutanağı.xlsm` | `Resim_Teslim_Tutanag_i.xlsm` ⚠️ |

**Tutanağı** kelimesi `Tutanag_i` oldu — `ğ→g` ve `ı→i` arasına `_` giriyor (ÇOKLU `_` kontrolü yetersiz). Düşük öncelik kozmetik kalıntı, 100+'da.

**Commit:** `ee736c3`

### Adım 4-C — Hata Mesajı Türkçeleştirme

**Smoke test #3 (aynı klasörü 3. kez yükleme):** 15/15 "The resource already exists" — `upsert: false` davranışı doğru, ama mesaj İngilizce ve teknik.

**`hataMesajiTr()` fonksiyonu** — 7 yaygın hata için Türkçe karşılık:
- "already exists" → "Bu dosya bu devreye zaten yüklenmiş."
- "Invalid key" → "Dosya adında geçersiz karakter var."
- "mime type X not supported" → "Bu dosya türü kabul edilmiyor (X). Yöneticiye bildirin."
- "Payload too large" → "Dosya boyutu 50 MB sınırını aşıyor."
- "row-level security" → "Yetkiniz bu tenant'a yazma izni vermiyor."
- "duplicate key" → "Aynı kayıt zaten var (DB tarafında çakışma)."
- "network/timeout" → "Ağ hatası — bağlantınızı kontrol edin."

**Karar (Cihat):** "C — sadece hata mesajı Türkçeleştir, görsel daha havalı 100+'a."

### Adım 5 — Dil Dosyaları (TR/EN/AR)

Wizard'da kullanılan **32 i18n anahtarı** üç dile eklendi (1 önceki `dr_new_circuit_wizard` + 31 yeni):

- 5 yaygın: `cmn_back/cancel/next`, `nav_home/active_circuits`
- 26 wizard-specific: `dw_title`, `dw_page_title`, `dw_step1-4`, `dw_p1-4_title`, `dw_lbl_*`, `dw_info_*`, `dw_btn_*`, `dw_th_*`, `dw_dz_*`

**Naming convention notu:** Mevcut dil dosyalarında aynı metnin 5+ farklı anahtarı var (`cmn_iptal` vs `btn_iptal` vs `dny_cancel` vs `dv_cancel` vs `m_qr_iptal` — hepsi "İptal"). Bu teknik borç, ileride bir "key consolidation" oturumu gerekir. Açık borca eklendi.

---

## Yan Olaylar

### Downloads Klasörü Temizliği (~30 dk)

Oturum ortasında Cihat "Download klasörünü temizleyemiyorum" dedi, 2.6 GB birikmişti. Sistematik temizlik yapıldı:

- 120 klasör (`arespipe-*`, `files - 2026-*`, `arespipe_tema_v2*`) → `_arsiv/2026-05-19-temizlik/`
- 44 SQL migration → `_arsiv/.../sql-migrations/`
- 735 parantezli HTML/JSON yedek → `_arsiv/.../parantezli-yedekler/`
- 133 eski tek HTML/JSON (30+ gün) → `_arsiv/.../eski-tek-dosyalar/`
- 76 `files (N)` klasör + 14 `ares-main*` + 134 JS/PY/MD dosyası → arşive
- Sonuç: 906 → 678 dosya, arşiv 149 MB

**Kalan ~1.5 GB:** Cihat'ın Finder'dan manuel sileceği kişisel/installer dosyalar (Docker.dmg, VSCode.dmg, Figma UI kit, WhatsApp videoları vs.). 99 kapsamı dışı.

### `BEGIN...ROLLBACK` Kafa Karışıklığı

Migration 081'i çalıştırırken Cihat "kuru çalıştırma" ve "gerçek çalıştırma" arasında ayrım yapamadı → migration **bir kez COMMIT** ile çalıştı, ikinci denemede "policy already exists" hatası. Sonuç olarak doğru durumda (bucket var, 3 policy var) ama yöntem temiz değildi. **MK-99.1 olarak kayıt:** İdempotent migration pattern (`DROP IF EXISTS ... CREATE`) sonraki migration'larda zorunlu olsun.

---

## Smoke Test Final Doğrulama (SQL)

```sql
-- Son 1 saatte yazılan dosyalar (2 devreye, 24 toplam)
SELECT devre_id, COUNT(*), MIN(yuklenme), MAX(yuklenme)
FROM devre_dokumanlari
WHERE yuklenme > NOW() - INTERVAL '1 hour'
GROUP BY devre_id;
-- 4c592886: 15 dosya, 09:27 (smoke #2 — temiz)
-- 88ae46e4:  9 dosya, 09:12 (smoke #1 — buglar)

-- Slugify doğrulama
SELECT dosya_adi, storage_yolu
FROM devre_dokumanlari
WHERE dosya_adi ~ '[İığşüöçĞŞÜÖÇı]'
LIMIT 2;
-- Donatım Kontrol Formu.xlsx → Donatim_Kontrol_Formu.xlsx ✅
-- Resim Teslim Tutanağı.xlsm → Resim_Teslim_Tutanag_i.xlsm ⚠️ (kozmetik)
```

---

## Eklenen Mimari Kararlar (MK)

- **MK-99.1**: Migration policy'lerinde `DROP IF EXISTS ... CREATE` idempotent pattern zorunlu
- **MK-99.2**: Storage path patterni = `{tenant_id}/...` (tenants/ prefix YOK), izometri-pdfs ile tutarlı
- **MK-99.3**: Wizard yüklemesinde DB'de orijinal isim, Storage key slugify (kullanıcı UI'da orijinal görür)
- **MK-99.4**: `.DS_Store` ve benzeri sistem/hidden dosyalar otomatik filtrelenir

---

## Oturum Sonu Düşünceleri

**Başarılar:**
- Wizard altyapısı tam çalışıyor — drag-drop, auto-detect, RLS izolasyonu, MIME kontrol, slugify, hidden filter, hata mesajı
- 4 yeni MK ile süreç disiplini güçlendi
- Pilot tenant ayrımı (A/E vs B/C/D/F/G) gerçek dünya testi için hazır

**Eksiklikler:**
- Kontrol grubu testi (B/C/D/F/G'de buton görünmemeli) yapılamadı — şifre bilgisi yok. Pattern güveni var (spool_detay.html'de 5+ aydır aynı pattern çalışıyor) ama gerçek test pilot kullanıcılarla yapılacak.
- Yüklenen belgeler `devre_detay.html`'de görünmüyor — kullanıcı deneyimi yarım kalıyor. 100 acil gündem.
- Görsel polish (Cihat: "daha havalı olmalı") 100+'a kaldı.

**Süreç dersi:**
- Plan 2-3 saatti, gerçek 5 saat. **Smoke test iterasyonu (her birinde 1-2 yeni bulgu)** ve **Downloads temizliği** öngörülemeyen iş yüküydü. Gelecek wizard/UI işlerinde +%50-100 zaman tamponu makul.
- "Aynı klasörü tekrar yüklemek" gibi gerçek kullanım pattern'leri ancak smoke test'te ortaya çıkıyor. Pilot dönemde bu pattern daha çok görülecek, UX iyileştirme listesi büyüyecek.

---

> 100. oturum gündemi: `CLAUDE-SONRAKI-OTURUM.md`
