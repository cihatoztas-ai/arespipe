# Son Durum — 90. Oturum (15 Mayıs 2026)

> Hedef: 89.A + 89.B borçlarını kapatmak, kütüphane fitting/flansh tarafını çalışır hâle getirmek. Sonuç: Boru kütüphanesi 4 katman tam çalışıyor, 89.A çalışıyor, 89.B **bilinçli iptal** (manuel ekleme prensibe aykırı). Fitting/flansh 91'e mimari kararla taşındı.

---

## Bu Oturumun Sonucu

**90 başarıyla kapandı — boru kütüphanesi tüm 4 katmanı uçtan uca çalışıyor + 89.A borç temiz.**

### Yapılanlar

1. **DB doğrulaması (10 dk)** — boru_olculer / fitting_olculer / flansh_olculer şemaları + içerik haritalandı
   - boru_olculer: 450 satır, `malzeme_grubu` + `standart` dolu (karbon 296, paslanmaz 80, aluminyum 50, cunife 24)
   - fitting_olculer: 569 satır, sadece `geometri_std` dolu (ASME B16.9: 464, ASME B16.11: 105)
   - flansh_olculer: 308 satır, sadece `geometri_std` dolu (B16.5: 216, EN-1092-1: 92)

2. **Boru için 3 dosya patch (commit `d0fea4a`)** — kütüphane sayfalarını DB ile uyumlu hâle getirme
   - `malzeme_grubu_kod` → `malzeme_grubu` rename (9 nokta, 3 dosya)
   - KATALOG'ta `cuni:` → `cunife:` (4 satır, DB ile uyum)
   - `normStd()` helper + `normalizeDagilim()` + `dbAnahtariBul()` — DB `ASME-B36.10M` vs KATALOG `ASME B36.10M` format farkı için normalize
   - Client-side standart filter (detay sayfasında `.eq('standart', STD)` kaldırıldı, normalize üzerinden filter)

3. **Auth yarış koşulu fix (commit `2f61f49`)** — 3 yeni sayfada IIFE açılışı
   - `_getSupa()` bekleyişsiz çağrılıyordu → null dönerse direkt giris.html'e atıyordu
   - kutuphane.html pattern'i uygulandı: 80 iter poll (max 8 sn) + URL hash auth handle (OAuth redirect)
   - 3 dosya: kutuphane-malzemeler.html, kutuphane-standartlar.html, kutuphane-detay.html

4. **dagN scope bug fix (commit `c770ec4`)** — standartlar.html
   - `toplamMevcut += dagN[normStd(h.kod)]` satır 385'te kullanılıyordu, dagN satır 414'te tanımlıydı (TypeError)
   - dagN tanımı satır 383'e çekildi (`var dag` ile birlikte), tekrar tanım silindi

5. **sch_kod → schedule_kod rename (commit `2f61f49`'dan sonra)** — kutuphane-detay.html
   - DB kolonu `schedule_kod`, kod `sch_kod` arıyordu → "column does not exist" hatası
   - 4 noktada rename (siralama config, kolonlar config, lejant config, panel hücresi)
   - **Sonuç: boru detay sayfası tam çalışıyor**, 238 ASME-B36.10M karbon kayıt görünüyor

6. **Migration 065 — fitting/flansh minimal kolon ekleme**
   - `fitting_olculer.malzeme_grubu` + `fitting_olculer.standart` eklendi
   - `flansh_olculer.malzeme_grubu` + `flansh_olculer.standart` eklendi
   - Backfill: `standart = geometri_std` kopyalandı (569 + 308 satır), `malzeme_grubu` **bilinçli boş bırakıldı**
   - Sebep: fitting/flansh için malzeme grubu üst kategori değil, **filtre** olmalı (91'in işi)

7. **89.A — kutuphane-oneriler.html sıfırdan yazıldı (commit `078fa9d`)**
   - 88'den kalmış sayfa AresPipe pattern'iyle uyumsuzdu (`ARES not defined`, script 404, sidebar yok)
   - 372 satır temiz dosya, `v_tanimsiz_havuz_listele` RPC çağrısı korundu
   - Canlı test geçti: 2 tanımsız kayıt (139.7×4.5 St37 + 60.3×6.3 St37), 31 etkilenen spool görünüyor

8. **89.B özel parça formu — BİLİNÇLİ İPTAL (KARAR-90.D)**
   - `ozel_parca_boru_kaydet()` RPC mevcut ve teknik olarak çalışıyor
   - Ama mental modeli yanlış: `standart='Ozel'` yazıyor, kullanıcı "ASME-B36.10M'e satır ekledim" sanır
   - Cihat'ın doğru tespiti: "Standartta varsa zaten tabloda. Eksikse migration ile yüklenir, manuel riskli. Standartta yok sahada varsa bekleyen öneriler akışıyla gelir."
   - Sonuç: manuel ekleme prensibe aykırı. Form yazılmadı, RPC durur (silinmesin, 91'de senaryo C için referans)

---

## CI Son Durum

- **Build:** ✅ YEŞİL
- **Lint:** 0 hata, 38 uyarı (88'den kalan, izometri-batch + spool_detay i18n)
- **Vercel:** Production = `078fa9d` (Current) — 89.A canlıda
- **Son 5 commit:** `078fa9d` (89.A) ← `b921adb` (CI auto) ← `c770ec4` (90 dagN fix) ← `b7be821` (CI auto) ← `2f61f49` (90 auth fix)

---

## DB Değişiklikleri

**Migration 065 (canlıda):**
```sql
ALTER TABLE fitting_olculer ADD COLUMN IF NOT EXISTS malzeme_grubu TEXT;
ALTER TABLE fitting_olculer ADD COLUMN IF NOT EXISTS standart TEXT;
ALTER TABLE flansh_olculer  ADD COLUMN IF NOT EXISTS malzeme_grubu TEXT;
ALTER TABLE flansh_olculer  ADD COLUMN IF NOT EXISTS standart TEXT;
UPDATE fitting_olculer SET standart = geometri_std WHERE standart IS NULL;
UPDATE flansh_olculer  SET standart = geometri_std WHERE standart IS NULL;
-- malzeme_grubu bilinçli boş (91'de filtre modeli + fitting_malzeme_uyum tablosu)
```

---

## 91'e Açık Borç (önceliğe göre)

1. **Fitting/Flansh filtre modeli** (~3-4 saat) — Cihat'ın doğru sezgisi: aynı geometri tablosu, malzeme filtresine göre ağırlık yeniden hesaplanır
   - Yeni hiyerarşi: Fitting → ASME B16.9/B16.11 → Detay (üstte malzeme filtresi)
   - `fitting_malzeme_uyum` tablosunu doldur (~30 satır manuel)
   - Katman 4 sayfasında ağırlık hesabı malzeme yoğunluğuna göre dinamik

2. **Tutarsızlık çöz** (~15 dk) — `kutuphane-oneriler` 2 vs ana sayfa kartı "1 bekliyor"
   - Yeni sayfa: `v_tanimsiz_havuz_listele` (benzersiz ölçü×kalite gruplaması)
   - Ana sayfa: `tanimsiz_kayitlar` durum='bekliyor' COUNT (onay süreci)
   - İki ayrı şey sayıyorlar — birini diğerine eşitle ya da metin değiştir

3. **Bekleyen öneriler aksiyon akışı** (~2 saat) — sahada görülen ölçüleri kütüphaneye dahil etme
   - Her satıra "Kütüphaneye ekle" + "Yoksay" + "Detay" butonları
   - RPC: `oneri_kutuphaneye_ekle(hash, hedef_standart)`
   - Karar: hangi standardın altına ekleneceği seçtirilebilir

4. **`ozel_parca_boru_kaydet` RPC kararı** — silinsin mi, dokümante mi kalsın
   - Şu an kullanılmıyor, frontend yok
   - Senaryo C (projeye özgü parça takibi) için referans olabilir
   - Karar: dokümantasyona ekle, kullanım kuralı netleşene kadar dokunma

5. **kutuphane.html link temizliği** (~10 dk) — 3 broken tablo linki var
   - `malzeme_kataloglari`, `fitting_malzeme_uyum`, `ozel_parcalar` — Katman 2 sayfasında "Geçersiz tablo" diyor
   - Ya Katman 2'ye bu 3 tabloyu da ekle (TABLO_KONFIG genişlet), ya da kartları kaldır

6. **kutuphane_medya tablosu** (91 veya 92) — vizyon belgesi Bölüm 5
   - Foto/3D/DXF/SVG polymorphic tablo
   - Aksiyon butonları aktif olur (foto yükle, 3D yükle)

---

## Kararlar (90'da Alınanlar)

| # | Karar |
|---|---|
| **KARAR-90.A** | Cuni/cunife normalize stratejisi: DB değerine (`cunife`) uy, KATALOG'u (`cuni`) değiştir — sıfır migration |
| **KARAR-90.B** | Standart kod format farkı (DB `ASME-B36.10M` vs KATALOG `ASME B36.10M`): normalize fonksiyonu ile çöz, ne DB ne KATALOG değişir |
| **KARAR-90.C** | fitting/flansh için malzeme_grubu kolonu eklendi ama **boş bırakıldı** — filtre modeli 91'de |
| **KARAR-90.D** | 89.B özel parça formu YAPILMADI — manuel veri girişi kütüphane prensibine aykırı (Cihat'ın tespiti) |
| **KARAR-90.E** | fitting/flansh sayfa modeli yanlış varsayımla yapılmış (89'da) — DB modeli "geometri malzeme-agnostik" diyor, sayfa "her satır bir malzeme grubuna ait" varsayıyor. 91'de filtre tabanlı yeniden tasarım |
| **MK-90.A** | macOS base64 syntax: `base64 -D < file` (lowercase -d bazı sürümlerde yok, -D her zaman çalışır) |
| **MK-90.B** | Patch script üretiminden önce **MUTLAKA** `py_compile` syntax kontrolü yap (f-string `{` literal'i `{{` olmalı — bu oturumda 1 kez hata verdi) |
| **MK-90.C** | Mockup tasarımı sırasında **DB modeliyle uyumu mutlaka sorgula** — 89'da fitting/flansh sayfası DB modeliyle uyumsuz tasarlandı, 90'da iptal edildi |
| **MK-90.D** | Kütüphane sayfalarında manuel veri girişi **istenmez** — standart kataloğa eksik satır = migration işi, sahada görülen ölçü = bekleyen öneriler akışı |
| **MK-90.E** | RPC adı niyeti yansıtmıyorsa (örn. `ozel_parca_boru_kaydet` ama tasarlanan senaryo manuel ekleme için değil) kullanılmadan önce **`pg_get_functiondef` ile gövdesini kontrol et** |
| **MK-90.F** | Mac indirme bozulması için base64+heredoc fallback yöntemi çalışıyor — Cihat'ın `arespipe_kopyala` MD5 doğrulamasıyla kombinli |

---

## Performans Notu (boru sayfası)

- **Katman 2 (malzeme grupları)** açılış: ~600ms (4 paralel COUNT sorgusu)
- **Katman 3 (standartlar)** açılış: ~400ms (tek SELECT standart, normalize edip gruplama)
- **Katman 4 (detay tablo)** açılış: ~300ms (238 satır karbon ASME, client-side filter)
- **80-iter poll** overhead: 0-100ms (ares-store hazırsa anında geçer)

---

## Kritik Hatırlatmalar (90 + öncesi)

- **MK-90.B (YENİ):** Python script üretiminde py_compile zorunlu
- **MK-90.C (YENİ):** Mockup ↔ DB uyumu sorgu
- **MK-90.D (YENİ):** Kütüphanede manuel ekleme istenmez
- **MK-90.E (YENİ):** RPC adı yanıltıcı olabilir, gövdesini kontrol et
- **MK-89.D:** Vizyon parçaları yazılı belge
- **MK-89.B:** DB kolonu varsayan UI → hata dayanıklılığı (404/column-not-exist)
- **MK-89.A:** Admin sayfa pattern: inline getSession → select rol → appShell
- **MK-88.D:** Yeni admin sayfası → referans sayfaya bak
- **MK-52.x:** ~/Downloads/_arsiv/ disiplin, MD5 doğrulama, terminal git akışı

---

## Yedek Dosyalar (90 sonu — temizlenmeli mi 91'de?)

```
admin/kutuphane-detay.html.bak90      (sch_kod öncesi)
admin/kutuphane-detay.html.bak90a     (auth fix öncesi)
admin/kutuphane-standartlar.html.bak90    (normStd öncesi)
admin/kutuphane-standartlar.html.bak90a   (auth fix öncesi)
admin/kutuphane-malzemeler.html.bak90a    (auth fix öncesi)
admin/kutuphane-oneriler.html.bak90c      (89.A öncesi)
```

91 başında canlı test bir kez daha geçtikten sonra `rm admin/*.bak90*` ile temizlenir.

---

> 91. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
