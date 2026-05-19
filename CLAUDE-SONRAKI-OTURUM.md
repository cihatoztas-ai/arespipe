# 99. Oturum — Devre Wizard UI İskeleti

> **Önce:** 98 migration'ı canlıya aldı (8 tablo, 16 index, 8 policy, 62 seed, 1 ALTER, 7 tenant flag).
> **Şimdi:** 99'un işi `devre_wizard.html` iskeletini yaratmak + sidebar'a feature-flag'li giriş eklemek + drag-drop dosya kabul akışını kurmak. **Parser yok henüz.**

---

## Açılış Ritüeli (CLAUDE.md disiplini)

2 kısa kontrol:

1. **`git pull` temiz mi?**
   ```bash
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
   ```

2. **Bugün ne yapmak istiyorsun?** → Cevap: **97-98'in altyapısı üstünde wizard UI iskeleti.**

---

## 99'un Ana İşi — 4 Adım, ~2-3 saat

### Adım 1 — Pilot tenant aktivasyonu (5 dk)

Wizard'ı sadece pilot tenant'ta açacağız. Cihat hangi tenant'ın pilot olacağına karar versin (büyük ihtimal kendi test/dev tenant'ı).

```sql
-- Önce mevcut tenant listesini gör:
SELECT id, ad FROM tenants ORDER BY ad;

-- Pilot tenant'ın id'sini al, aktif=true yap:
UPDATE tenant_features
SET aktif = true
WHERE feature_kod = 'devre_wizard_v2'
  AND tenant_id = '<PILOT_TENANT_ID>';

-- Doğrula:
SELECT tf.aktif, t.ad
FROM tenant_features tf
JOIN tenants t ON t.id = tf.tenant_id
WHERE tf.feature_kod = 'devre_wizard_v2';
```

Beklenen: pilot tenant'ta `aktif=true`, diğer 6'sında `false`.

### Adım 2 — Sidebar Entegrasyonu (15 dk)

Sidebar şablonunda yeni link:

- **Konum:** "Yeni Devre" linkinin hemen altı (veya alternatif: "Yeni Devre" → "Yeni Devre (Wizard)" alt-menüsü)
- **Görünürlük:** Sadece feature flag aktif tenant'larda. Çoğu sayfa `arespipe.tenant_features` cache'ini sorguluyor — bu mekanizmayı kullan.
- **Etiket:** TR/EN/AR dil anahtarı eklenmeli (`menu_devre_wizard` veya benzeri)

**Dosya:** `dashboard.html` veya merkezi sidebar (`docs/PROJE-HARITASI.md`'ye bak — sidebar nerede)

### Adım 3 — `devre_wizard.html` İskeleti (~2 saat)

**Hedef:** ~300 satırlık iskelet. Henüz parser yok, henüz fuzyon yok — sadece **dosya kabul + listeleme + ilerleme** akışı.

Yapı:

```
┌─ Adım 1: Tenant + Proje + Devre seçimi
│   - Tenant: otomatik (kullanıcı tenant'ı)
│   - Proje: dropdown (mevcut projeler)
│   - Devre no: text input (manuel veya dosyadan inferens — 100+'da)
│   - "İlerle" butonu
│
├─ Adım 2: Dosya Yükleme
│   - Drag-drop alanı (büyük, görsel)
│   - Klasör yükleme desteği (webkitdirectory)
│   - Yüklenen dosyaların tablosu:
│     | Dosya adı | Klasör yolu | Tip (auto-detect) | Boyut | Durum |
│   - Tip auto-detect: `dokuman_tipleri` sözlüğünden uzantı eşleme +
│     `klasor_isim_sozluk` sözlüğünden klasör pattern eşleme
│   - Manuel tip override: tıklanabilir tip kolonu
│   - "Geri" / "İlerle" butonları
│
├─ Adım 3: Onay
│   - Yüklenecek dosyaların özeti (tipe göre gruplu)
│   - "Yükle ve Kuyruğa At" butonu → Storage'a + DB'ye + kuyruğa
│
└─ Adım 4: Yükleme + Durum
   - Progress bar (Storage upload)
   - Kuyruk durumu: bekliyor / işleniyor / tamamlandı (parse yok henüz, sadece 'saklama' parser'ı çalışır)
   - "Devreyi Görüntüle" butonu → mevcut `devre_detay.html`'e gider
```

**Henüz YAPMAYACAĞIMIZ şeyler (100+):**
- Parse çağrıları (izometri-oku, excel-generic, step-parser)
- Füzyon motoru
- Çelişki onay popup'ı
- Pipeline malzemeleri ortak BOM yazımı
- Spool detay klasör hiyerarşisi UI'sı

**Yapacağımız 99'da:**
- Storage'a dosya yazma (`tenants/{tenant}/projeler/{proje}/devreler/{devre}/{klasor}/dosya`)
- `devre_dokumanlari` ve `spool_dokumanlari` INSERT (sadece "saklama" tipinde dosyalar için)
- `dosya_isleme_kuyrugu`'na "saklama" parser'lı satır ekleme (kuyruk işleyicisi 100+'da)
- "Saklama" parser'ı işleyici (basit: durum güncelle, parse_durumu='tamamlandi', metadata yok)

### Adım 4 — Smoke Test (15 dk)

Pilot tenant'la yeni wizard'a gir, basit bir senaryoyu test et:

1. Yeni devre oluştur (X projesi, Y devre no)
2. Bir klasör yapısı sürükle-bırak yap (örn: `test_devre/izometri/123.pdf, test_devre/bom/list.xlsx, test_devre/sertifikalar/mtc.pdf`)
3. Tip auto-detect doğru mu? (izometri → izometri, bom → bom_excel, sertifikalar → sertifika)
4. "Yükle" → Storage'a yazıldı mı? (Supabase Storage UI'dan teyit)
5. `devre_dokumanlari` SELECT: 3 satır
6. `dosya_isleme_kuyrugu` SELECT: 3 satır, hepsi 'tamamlandi' (saklama parser'ı)

---

## Beklenmedik Senaryo

### Tenant_features cache'i

Çoğu sayfa tenant_features'ı bir kez okuyup memory'de tutuyor. Yeni flag eklediğimizde **sayfa yenileme** gerekebilir — kullanıcıya hatırlat.

### Drag-drop klasör API'si

`webkitdirectory` Firefox 50+, Chrome 4+, Safari 11.1+ destekliyor — ama bazı eski sürümlerde davranış farklı. Yedek: tek-tek dosya yükleme akışı bırak.

### Tip auto-detect false positive

Klasör adı "iso" → `izometri` eşlemesi var ama kullanıcı "iso_sertifikalar" diye bir klasör yüklerse yanlış eşleşir. Pattern başında `ILIKE 'iso%'` yerine `ILIKE 'iso'` (tam eşleşme) tercih et. Veya kullanıcıya manuel override kolaylığı bırak.

---

## 100'e Bakış (Spoiler)

100'de:
- İlk gerçek parser: `excel-generic` parser (BOM yükleme + sözlük match + L3 AI fallback)
- `pipeline_malzemeleri` INSERT (multi-spool BOM ortak alan)
- Manuel kolon eşleme UI'sı (sözlük match başarısız olursa)
- Format öğrenme: ilk başarılı eşlemeden sonra `excel_format_tanimlari` satır eklenmesi

101+'da:
- İzometri PDF parser entegrasyonu (mevcut `api/izometri-oku.js` wrapper)
- Çoklu sayfa PDF kuyruk akışı
- STP parser ilk denemesi (B-spline → silindir fit zor, opsiyonel)

102-104:
- Füzyon motoru (çelişki tespit + iki boyutlu skor)
- Yüksek riskli alanlar manuel onay UI
- Karar log entegrasyonu

---

## Açık Borçlar (98 sonu)

- ⚪ Pilot tenant feature flag aktivasyonu (99 Adım 1)
- ⚪ `devre_wizard.html` iskeleti (99 Adım 2-4)
- ⚪ AVEVA AP214 çıkış denemesi (opsiyonel, Cihat zaman bulduğunda tersanedeki adımı sorabilir)
- ⚪ `docs/DATABASE.md` RLS uyumsuzluğu (97.13'te not edildi, belge sweep oturumunda)
- ⚪ 100-104 implementasyon serisi (parser + füzyon)

---

## Hatırlatmalar

- **MK-98.1:** Yeni feature flag eklerken `feature_flags` master kayıt önce, `tenant_features` sonra (FK kuralı).
- **MK-98.2:** Şema migration'larında `BEGIN...ROLLBACK` kuru çalıştırma **zorunlu**.
- **MK-98.3:** Terminal yapıştırmada `\` line continuation yerine `&&` zinciri tercih et.
- **MK-98.4:** SQL'i her zaman "Supabase SQL Editor →" başlığıyla ver, terminal komutlarını `bash` bloğunda.
- **MK-52.2:** `gp` kullan, `git push` değil — son-durum.md otomatik commit'i yakalar.
- **Acele yok** — 99 ~2-3 saatlik iş. UI iskeleti, parser yok. Test edebileceğin minimum yüzey.

---

> **99. oturum açılışında bu dosya + `son-durum.md` + `CLAUDE-SON-OTURUM.md` okunacak.**
