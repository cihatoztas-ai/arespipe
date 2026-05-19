# AresPipe — Son Durum

> **100. oturum kapanışı — 19 Mayıs 2026** 🎊
> Bu dosya her oturum başında ilk okunan kayıttır. Güncel CI durumu + açık borçlar + sonraki oturum gündemi burada.

---

## CI Son Durum

- **Build:** ✅ YEŞİL
- **Lint:** 0 hata, 22 uyarı (Faz B baseline'ı korundu)
- **Vercel:** ✅ Production aktif (son commit: `6579c2e` revert sonrası temiz hâl)
- **Migration sayısı:** 82 (99'dan değişiklik yok — 100 sadece UI işi)
- **100 sonrası:** Devre detay'da iki kaynaklı belge listesi + tree + arama canlıda

---

## 100. Oturum Özeti

**Ana tema:** Devre detay'da belge listesi UI — wizard ile yüklenen klasör hiyerarşisinin Finder gibi görüntülenmesi + arama.

**Süre:** ~5 saat (plan 1.5-3 saatti, görsel iyileştirme + önizleme denemesi + revert ile uzadı). Net 6 commit + 1 revert.

### Yapılanlar (Kronolojik)

1. **İki kaynaklı belge listesi** (`90df065`):
   - `belgelerYukle()` artık paralel SELECT: `belgeler` (eski modal) + `devre_dokumanlari` (wizard)
   - Her kayda `_kaynak` etiketi: `'belgeler'` veya `'devre_dokumanlari'`
   - Gruplu render: 📎 Doküman Ekle / 📁 Klasör Yükle
   - `DOK_TURLER` 7 yeni tip (bom_excel, spool_imalat, 3d_pdf, sartname, akis_semasi, stp, rhino)
   - `dokSil()` `_kaynak`-aware — doğru tabloya UPDATE
2. **Skeleton çakışması fix:** `_skList('dokListesi', 3)` kaldırıldı (2 grup yapısını eziyordu)
3. **Klasör tree** (Finder hiyerarşisi):
   - `klasor_yolu`'na göre recursive ağaç
   - Aç/kapa toggle (`▾` / `▸`), state oturum boyunca korunur
   - Sayım badge: `3 (·15)` formatı (direkt + toplam)
4. **Arama kutusu** (`d06756f` öncesi):
   - ≥8 dosyada otomatik görünür
   - Dosya adı, klasör yolu, tip alanlarında filtre
   - Match olan klasörler otomatik açık
   - Debounce 150ms, temizle butonu, "X eşleşme bulundu" sonuç metni
5. **Önizleme modal denemesi** → 2 kez syntax bug → **revert** (`6579c2e`)
   - PDF + IMG + TXT + Excel preview planlandı
   - Python heredoc → JS string escape sorunu yenildi
   - 101'e ertelendi, taze yaklaşımla yapılacak

### Yazılan/değişen dosyalar
- `devre_detay.html` (2776 satır, +~80 net — net büyüme arama + tree + iki kaynak nedeniyle)

### DB değişikliği yapıldı mı?
**Hayır** — 100 sadece UI işi. `belgeler` ve `devre_dokumanlari` tabloları olduğu gibi.

### Smoke test sonuçları
- ✅ Eski modal kaydı (Sevk_Fisi_ITS26-063) `📎 grubu`'nda görünüyor
- ✅ Wizard ile 15 dosya yüklendi → `📁 grubu`'nda tree olarak görünüyor (klasör hiyerarşisi: AT110-Drencher-Galv → İzometri/Spool alt klasörleri)
- ✅ Arama: "izom" → 4 İzometri PDF görünüyor, gerisi gizli
- ✅ Klasör tıklama: aç/kapa çalışıyor
- ✅ Sil: doğru tabloya UPDATE atıyor

---

## Açık Borçlar (100 sonu)

### Acil (101 gündemi)
- ⚪ **Doküman önizleme modal** — PDF/IMG/TXT/Excel preview. 100'de iki kez denendi (patch-100e, patch-100f), her ikisi syntax bug verdi → revert. 101'de **farklı yaklaşımla** (ayrı `.js` dosyası, build script yerine direkt yazım) tekrar denenecek.
- ⚪ **Excel generic parser** — orijinal 100B planı. `bom_excel` tipi için L1 sözlük + L2 pattern (L3 Haiku 102+). `pipeline_malzemeleri` INSERT. Yeni endpoint `api/kuyruk-isle-excel.js`.
- ⚪ **İzometri parser entegrasyonu (wizard + batch ortak kuyruk)** — KARAR: hem wizard hem `izometri-batch.html` aynı `dosya_isleme_kuyrugu`'na yazsın, tek `api/kuyruk-isle-izometri.js` wrapper çalışsın. Detay: `CLAUDE-SONRAKI-OTURUM.md`.

### Önemli (101+)
- ⚪ **`izometri-oku.js` → dispatcher + parsers/ klasörü** — 101'de wrapper yazılırken doğal zaman. Mevcut PAOR kodu `parsers/aveva-paor.js`'e taşınır. **MK-49.1 ihlali değil — iç davranış aynı, sadece dosya organizasyonu.**
- ⚪ **Wizard UX iyileştirme** — "Klasör Yükle" butonu görsel olarak zayıf, wizard akışı tamamlanınca komple bir görsel iyileştirme oturumu (Cihat dedi: "çok havalı bir özellik olacak"). 101+ tek bir oturum bu işe ayrılabilir.
- ⚪ **Slugify kozmetik** — `Tutanağı.xlsm` → `Tutanagi.xlsm` (şu an `Tutanag_i.xlsm`). 10 dk işi.
- ⚪ **Re-açma senaryosu** — pasif devreye yeni spool. Düşük frekans.

### Mimari Borçlar (105+)
- ⚪ **`devre_detay.html` parçalama** — 100 sonu 2776 satır. ≥3500 satıra ulaştığında Yöntem 1 (script src ile JS'i ayır) ile parçala. Hedef yapı: `js/devre-detay/{belgeler, spool, malzeme, notlar, excel}.js`. **Önizleme modal'ı 101'de yazılırken ayrı `js/dok-onizle.js` olarak başlasın** — devre_detay.html'i şişirmemek için.
- ⚪ **`devre-belgeleri` storage'da Türkçe karakter** — MK-99.3 ile slugify yapılıyor ama wizard kodunda kontrol et (`Tutanag_i` sorunu).
- ⚪ Ortak helper'ları `js/ares-ui.js`'e çıkar (`esc`, `tv`, `setText`, `showToast`, skeleton)

### Opsiyonel / Uzun Vade
- ⚪ AVEVA AP214 çıkış denemesi
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu
- ⚪ i18n anahtar consolidation refactor
- ⚪ Soft delete cron işi (30 gün sonra kalıcı silme)
- ⚪ Format envanter UI (super_admin)

### Roadmap (Mimari Sırası — Konuşulduğu Hâliyle)
- **101**: Önizleme modal + Excel generic parser + İzometri wrapper (parsers/ klasörü)
- **102**: Füzyon motoru + çelişki ekranı + manuel onay
- **103**: STP tek-spool parser (B-spline → silindir fitting)
- **104**: Rhino parser + Windows Gezgini UI
- **105**: AVEVA AP214 + opsiyonel parça temizliği

---

## Aktif Süreç Disiplinleri

- **MK-48.6:** Supabase SQL Editor Unicode hassasiyeti
- **MK-49.1:** `izometri-oku.js`'e dokunma — minimum değişiklik (101'de dispatcher refactor istisnası: iç davranış aynı, dosya organizasyonu değişir)
- **MK-50.1:** Hassas anahtar Claude'a verme
- **MK-50.3:** Yeni parser için 3+ başarılı AI örneği önce
- **MK-50.4:** Dotfile oluşturduktan sonra `ls -la` kontrol
- **MK-51.1:** Dosya kopyalamadan önce `~/Downloads`'da MD5 + satır sayısı doğrula
- **MK-51.2:** Parser_kural regex'lerini en az 5 farklı gerçek dosya örneğiyle test et
- **MK-52.1:** `arespipe_kopyala` MD5 doğrulamalı dosya kopyalama
- **MK-52.2:** `gp` otomatik rebase + push
- **MK-98.1:** Yeni feature flag eklerken `feature_flags` master kayıt önce, DB keşif sorgusu zorunlu
- **MK-98.2:** Şema migration'larında `BEGIN...ROLLBACK` kuru çalıştırma zorunlu
- **MK-98.3:** Terminal yapıştırmada `\` line continuation yerine `&&` zinciri
- **MK-98.4:** SQL'i "Supabase SQL Editor →" başlığıyla ver, terminal komutları `bash` bloğunda
- **MK-99.1:** Migration policy'lerinde `DROP IF EXISTS ... CREATE` idempotent pattern zorunlu
- **MK-99.2:** Storage path patterni `{tenant_id}/...` (tenants/ prefix YOK), izometri-pdfs ile tutarlı
- **MK-99.3:** Wizard yüklemesinde DB'de orijinal isim, Storage key slugify
- **MK-99.4:** `.DS_Store` ve benzeri sistem/hidden dosyalar otomatik filtrelenir
- **MK-100.1 (yeni):** **İki kaynaklı UI deseni** — eski sistem (belgeler) ve yeni sistem (devre_dokumanlari) paralel yaşayabilir. Listede `_kaynak` etiketi ile birleştirilir, sil-akışı `_kaynak`-aware. Pilot dönemde her iki yol da kullanılabilir. Pilot kararı sonrası taşıma yapılır.
- **MK-100.2 (yeni):** **Python heredoc ile büyük JS patch yazma anti-pattern'i.** Python string'i içinde JS template oluşturmak escape karmaşası getirir (`\\'`, `\u{}`). 100'de iki kez denendi, ikisinde de syntax bug çıktı. Alternatif: (a) küçük str_replace patch'leri, (b) ayrı `.js` dosyası yazıp `<script src=...>` ile yükle, (c) DOM API (createElement) ile inline string concat yerine.
- **MK-100.3 (yeni):** **Tree render state oturum-içi sakla** — `window.DOK_TREE_ACIK` global obje. Sayfa yenilenince sıfırlanır (default açık). DB'ye yazma gereği yok, kullanıcı yenilemede de aynı state'i bulmuyorsa sorun değil.
- **KARAR-97.0:** Yeni tablolar mevcut sisteme dokunmaz (geri alma garantisi)
- **KARAR-100.A (yeni):** **Wizard + İzometri Batch ortak kuyruk mimarisi.** Her iki UI da `dosya_isleme_kuyrugu`'na yazar, tek parser endpoint (`api/kuyruk-isle-*.js`) tüketir. İzometri batch sayfası kuyruğun **UI penceresi** olur, ayrı işleme katmanı değil. Format öğrenme tablosu (`izometri_format_tanimlari`) iki kaynaktan da beslenir.

---

## Performans (Değişiklik Yok)

- **L2 parse (lokal):** 1-2 ms/PDF
- **L3 vision parse (canlı):** 11-25 sn/PDF
- **Format tanıma:** <100 ms/PDF
- **Wizard yükleme:** ~15 dosya / 7 saniye
- **Tree render (16 dosya):** <50 ms
- **Arama filtre (16 dosya, 150ms debounce):** <30 ms hesap

---

## 101 Hazırlık Notu

**101 ~4-5 saat öngörü.** Üç ana iş:

1. **Önizleme modal v3** (~1 saat) — `js/dok-onizle.js` ayrı dosya olarak. Python heredoc kullanma. PDF / IMG / TXT / Excel + "Önizleme yok" branchları.
2. **Excel generic parser** (~2 saat) — L1 sözlük + L2 pattern, L3 Haiku 102+'a. Yeni `api/kuyruk-isle-excel.js`.
3. **İzometri parser wrapper** (~1.5 saat) — `api/kuyruk-isle-izometri.js`. Mevcut `izometri-oku.js`'i wrapper'dan çağır. `izometri-oku.js` minimum değişiklik (MK-49.1). Eğer zaman elveriyorsa `parsers/aveva-paor.js`'e taşıma da başlasın.

Sıralama: önce **önizleme** (kullanıcı değeri yüksek, küçük iş), sonra **parser'lar** (asıl uzun iş, yoğunluk gerektirir).

Detay: `CLAUDE-SONRAKI-OTURUM.md`.

---

## 100. Oturum Anlamlı Anlar

🎊 **100. oturum milestone'u** — 22. oturumda kurulan disiplin (numaralı oturumlar, açılış ritüeli, MK takibi) buraya kadar getirdi. 80+ oturumdur tek bir oturum bile bu disiplini çiğnemedi.

**Yeni mimari kararlar (100'de pekişen):**
- Vanilla seçimi **stratejik olarak doğruydu** (Cihat'la konuşuldu). 5 yıl sonra da çalışacak, eski olmuyor — risk framework'lerde, vanilla zaten standart.
- Wizard + Batch ortak kuyruk pattern'i (KARAR-100.A).
- "Python heredoc anti-pattern'i" — 100'de iki kez yenildik, artık biliyoruz (MK-100.2).

**Süreç dersi:** Patch script'i `node --check` ile JS syntax'ı doğrulamak yeterli değil — HTML/JS sınırı bağlamı validate edilmiyor. 101'de **`html-validate` veya manuel browser console testi** patch sonrası mecburi.

---

> 101. oturum açılışında bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` okunur.
