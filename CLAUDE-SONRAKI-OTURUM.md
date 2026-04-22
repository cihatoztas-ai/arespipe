# AresPipe — 20. Oturum Gündemi

## Oturum Başı Ritüeli
1. **CLAUDE.md oku** (özellikle **Bölüm 2.13 → E-06 Malzeme Master Tablo**)
2. **CLAUDE-SON-OTURUM.md oku** (19. oturum özeti — Faz 1 tamamlandı)
3. **Canlı test durumunu sor:**
   - 19. oturum dosyaları deploy edildi mi? (ares-normalize.js, api/sorgula.js, devre_detay, spool_detay, CLAUDE.md)
   - `devre_yeni.html` üzerinden test spool + malzeme eklendi mi? Trigger gerçek UI'dan çalışıyor mu?
4. **DB durumunu teyit et:**
   ```sql
   SELECT sistem_preset, COUNT(*) FROM malzeme_tanimlari GROUP BY sistem_preset;
   -- Beklenen: sistem_preset=true → 12, sistem_preset=false → 0 (henüz tenant özel yok)
   ```

## 🎯 ÖNCELİK 1 — Faz 2: Admin UI (`tanimlar.html`)

### Amaç
Operatör/admin'in master tabloya yeni kalite ekleyebilmesi, mevcut sistem preset'leri görüntüleyebilmesi, kendi tenant'ına özel kaliteleri yönetebilmesi.

### Neden Öncelik
- Şu anda bir kullanıcı `ZZ99-EXOTIC` gibi tanınmayan bir kalite girse, trigger NULL döner → `malzeme_ref_id = NULL` kalır. Admin UI'dan bu kaliteler manuel olarak master'a eklenebilir olmalı.
- Sistem preset listesi (12 kalite) şeffaf gösterilmeli — hangi standartların hazır olduğu operatör görsün.

### Mockup-First (Kural R-10 uygulanacak)
Yeni admin ekran → **önce artifact mockup**, kullanıcı onayı, sonra kod. İki sekme önerisi:
- **Sekme 1: Sistem Kaliteleri** (read-only, 12 preset listesi + standart referansı)
- **Sekme 2: Firma Kaliteleri** (CRUD — yeni ekle, düzenle, pasif yap)

### DB İşleri (Faz 2)
- Büyük ihtimal yeni tablo/kolon gerekmez (Faz 1'de hepsi kuruldu)
- Yeni kalite eklemek için RLS INSERT policy zaten hazır
- Silme: `sistem_preset=false AND tenant_id IS NOT NULL` şartı RLS'de
- UI tarafında: "bu kalite X kayıtta kullanılıyor, silme" uyarısı (FK violation'ı önceden yakala)

### Form Alanları (tahmini)
- Kategori (dropdown: karbon, paslanmaz, bakir, alum, diger)
- Kalite kodu (text, canonical — ör: `TP304H`)
- Kalite gösterim (text, ör: `TP304H`, `1.4571`)
- Standart (text, opsiyonel — ör: `ASME SA-312`)
- Açıklama TR/EN/AR (text, opsiyonel)
- Aktif (checkbox, default true)

### Kod Yerleşimi
- Yeni sekme: `tanimlar.html` — mevcut tanımlar sayfasına entegre (tersaneler, projeler, basamak_tanimlari gibi sekmelerle yan yana)
- JS fonksiyonları: aynı dosyada, `malzemeKaliteYonetimi` namespace'i altında
- Yetki: `super_admin` ve `firma_admin` yazabilir; diğerleri sadece okur

## 🟡 ÖNCELİK 2 — Faz 3 Hazırlık: Kod Tabanında Escape Noktalarını Tespit

Faz 3 formları refactor edecek (autocomplete dropdown). Öncesinde tüm yazma noktalarının haritası temiz olsun:

### Mevcut Yazma Noktaları (19. oturumda tespit edildi)
| Dosya | Satır | Tablo | Durum |
|---|---|---|---|
| `devre_detay.html` | 1652 | `pipeline_malzemeleri` | Manuel tek satır — trigger bastırıyor |
| `devre_detay.html` | 1700 | `pipeline_malzemeleri` | Excel toplu — trigger bastırıyor |
| `devre_yeni.html` | 1846 | `spool_malzemeleri` | IFS — trigger bastırıyor |
| `devre_yeni.html` | 1893 | `spool_malzemeleri` | İzometri PDF — trigger bastırıyor |
| `devre_yeni.html` | 1713 | `spooller` | Spool oluşturma — FK yok, denormalize |
| `spool_detay.html` | 2096 | `spool_malzemeleri` | pipelineAktar — trigger bastırıyor |
| `spool_detay.html` | 2181 | `spool_malzemeleri` | Manuel — trigger bastırıyor |

**Faz 3'te** bu noktalarda form'lara **autocomplete dropdown** gelecek. Free text alanları kaldırılacak. Kullanıcı sadece master'dan seçebilecek (veya admin panelinden yeni ekleyebilecek).

## 🟢 ÖNCELİK 3 — Faz 4 Taslak: IFS/Excel Import Fuzzy Match

### Senaryo
Kullanıcı yeni bir IFS Excel yüklüyor. Dosyada hiç görülmemiş bir kalite var (ör: `TP347H`). Ne olacak?

### 3 Opsiyon
1. **Şu anki davranış (Faz 1 sonrası):** Trigger NULL döndürür, `malzeme_ref_id` boş kalır. Kullanıcı daha sonra elle master'a ekler.
2. **Fuzzy match:** Import sırasında "Bu kalite tanımsız — eklemek ister misiniz?" diye operatör onayı istenir.
3. **Otomatik tenant ekleme:** Her yeni kalite otomatik tenant kaydı olur (riskli — çöp üretebilir, Faz 1'de kaldırdığımız davranış).

**Tercih:** Opsiyon 2 — Faz 4'te implement edilecek.

## 🔵 Teknik Borçlar (yeri geldikçe)

### G-02 Hero+Pill Uyumu Eksik Sayfalar (18. oturumdan devraldık)
anasayfa → kalite_kontrol → sevkiyatlar → tersaneler → uyarilar → kullanicilar

### Export
`bukum.html` ve `markalama.html` için Excel + PDF export

### Kesilmiş Borular Global Arama (18. oturumdan devraldık)
`kesim.html`'e "Kesilmiş Borular" tab'ı (4. sekme veya mevcut "Kesilen Listeler"e arama)

### 3 Sayfada Ham Kod Gösterimi
`portal/index.html`, `admin/index.html`, `izometri-batch.html` → `esc(s.malzeme)` ile "karbon" ham kodu gösteriyor. Faz 2 ile birlikte `ARES_NORM.malzemeEtiket()`e çevirilecek.

## Oturum Planı Önerisi

**Faz 2 odaklı oturum yapısı:**

1. **İlk 10 dk:** Ritüel + deploy/test durumu
2. **Sonra 20-30 dk:** Mockup'lar (artifact olarak 2 tab + form) — kullanıcı onayı
3. **Sonra 30-45 dk:** `tanimlar.html` içine yeni sekme + CRUD işlemleri
4. **Sonra 15 dk:** Test — yeni kalite ekle, listele, düzenle, sil (FK'li durumu dahil)
5. **Son 10 dk:** CLAUDE.md güncellemesi + CLAUDE-SON-OTURUM + 21. oturum gündemi

**Kritik:** Bu oturum **UI odaklı** olacak, Faz 1'in "sadece backend" disiplininin aksine. Mockup-first disiplinini koru.

## Senaryo Notu

Eğer 20. oturuma başlarken canlı testlerde **başarısız sonuç** varsa (örn: `devre_yeni.html`'den girilen malzeme master'a bağlanmıyor):

- Muhtemel sebep: `devre_yeni.html:644` hâlâ `normalizeMalzeme(row[idx.mat])` çağırıyor. Trigger geldiğinde `malzeme='karbon'`, `kalite='karbon'` olur — guard çalışır, master'a bağlanmaz.
- Hızlı fix: O satırı `String(row[idx.mat] || '').trim()` yap (ham sakla)
- Aynı şey satır 1206 ve 1495 için de geçerli
- Bu fix'i ritüel sonrası ilk iş olarak yap, sonra Faz 2'ye geç

## Hazır DB Objeleri (Referans)

```sql
-- Tablolar
malzeme_tanimlari                -- 12 preset (sistem_preset=true), tenant kayıtları henüz yok

-- FK Kolonları
spool_malzemeleri.malzeme_ref_id
pipeline_malzemeleri.malzeme_ref_id

-- Fonksiyonlar
kategori_kod_normalize(text) → text
kalite_kod_normalize(text) → text
malzeme_ref_bul(uuid, text, text) → uuid

-- Trigger'lar
tg_spool_malzemeleri_ref_sync     ON spool_malzemeleri      BEFORE INSERT OR UPDATE
tg_pipeline_malzemeleri_ref_sync  ON pipeline_malzemeleri   BEFORE INSERT OR UPDATE

-- RLS Policies (4 adet)
malzeme_tanimlari_select, _insert, _update, _delete

-- CHECK Constraint
check_sistem_preset_tenant       -- sistem_preset=true ⟹ tenant_id IS NULL
malzeme_tanimlari_kategori_kod_check  -- kategori ∈ {karbon,paslanmaz,bakir,alum,diger}

-- Unique/Index
malzeme_tanimlari_tenant_id_kategori_kod_kalite_kod_key  -- UNIQUE (3-tuple)
malzeme_tanimlari_preset_unique_idx                       -- PARTIAL UNIQUE (tenant_id IS NULL)
malzeme_tanimlari_tenant_idx                              -- performans
malzeme_tanimlari_kategori_idx                            -- performans
```

## JS API (Referans)

```js
ARES_NORM.kaliteKod(raw)         // → canonical kod veya null
ARES_NORM.kaliteGoster(kodOrRaw) // → UI gösterimi ("St 37", "CuNi 90/10")
ARES_NORM.malzemeEtiket(kod)     // → lokalize ("Karbon Çelik"/"Carbon Steel"/...)
ARES_NORM.malzemeKod(raw)        // → kategori kodu ("karbon", "paslanmaz"...)
```
