# Son Durum -- 93. Oturum (16-17 Mayis 2026)

> Hedef: 92'den devralinan bug raporu (`docs/93-DEVRALINAN-BUGLAR.md`) cozumu. Plan 1.5 saatti, tum bonuslarla birlikte ~7 saate uzadi. Kutuphane sayfasi 92'de "boş gibi" görünen halinden 93 sonunda "tam çalışır, filtreli, kullanışlı" haline geldi.

---

## Bu Oturumun Sonucu

**93 büyük başarıyla kapandı.** Hedeflenen Bug 1 + Bug 2'nin yanı sıra 4 ek katman/bulgu daha çözüldü, üstüne 2 UX iyileştirmesi eklendi.

### Bug 1 — Kütüphane görünmezliği (4 katman, hepsi çözüldü)

1. **DB katmanı:** `fitting_olculer` ve `flansh_olculer` `malzeme_grubu` NULL → `'karbon'` ile dolduruldu (Migration 070, 877 satır)
2. **UI konfig:** `kutuphane-detay.html` `TABLO_KONFIG` sözlüğünde fitting + flansh için **22 + 22 kolon** tanımı eklendi (A1 — tüm kolonlar, Excel export eksiksiz olsun diye)
3. **RLS katmanı:** `fitting_olculer` SELECT policy hiç yokmuş, eklendi (Migration 071, flansh policy'sinin tıpatıp eşi)
4. **Boru kolon adı:** `boru_olculer`'ın TABLO_KONFIG'inde `nps_inch` (DB'de YOK kolon) ve `yuzey_m2_m` (gerçek ad `yuzey_alan_dis_m2_m`) yanlış — düzeltildi. Bug 88+ oturumdan beri gizli, hep boş NPS gösteriyordu.

### Bug 2 — Kolon adı tutarsızlığı (kısmi)

`boru_malzeme_uyum` + `flansh_malzeme_uyum` tablolarında `olusturma_at → olusturma` rename (Migration 072). Ama büyük tablo haritası çıkarıldı: **18 tablo `olusturma_at`, 51 tablo `olusturma` kullanıyor.** Tam rename 94'e devredildi (kuyruk-isle, izometri-oku, kuyruk-durum gibi kritik API'leri etkiliyor, dikkatli refactor gerekli).

### Modal akışı (4 alt-bulgu)

`kutuphane-oneriler.html` modal'ı 88'den beri **hiç başarıyla çalışmamış** demek — birkaç gizli bug birlikte çıktı:

1. **SCH zorunluluğu** (Migration 073): Standart dışı ölçü için (139.7×4.5 mm) `OZEL_SCH40` gibi Sch uydurmak mantıksız. Opsiyonel yapıldı, NULL ise sentetik üretim (`OZEL_DC<cap>_ET<et>`)
2. **Frontend validasyon:** Sch koşulları çıkarıldı, RPC çağrısında boş string null'a çevriliyor
3. **Tenant constraint** (Migration 074): `boru_olculer_tenant_consistency` ihlali, RPC INSERT'ine `tenant_id` eklendi
4. **Console doğrulaması:** 1 kayıt başarıyla eklendi, 30 spool bağlandı, havuz 2'den 1'e düştü

### Standart adı normalizasyonu (Migration 075)

DB'de 3 farklı ASME yazımı tek formata: `ASME B16.9` → `ASME-B16.9`, `ASME B16.11` → `ASME-B16.11`, `B16.5` → `ASME-B16.5` (785 kayıt etkilendi). Format kuralı: `<KURUM>-<KOD>`, tek tire.

### kutuphane-detay.html UX iyileştirmeleri

1. **Satır tıklama fix:** `panel_lejant[0].kol` NULL kolon olduğunda selector eşleşmiyordu, satır tıklama sessizce çalışmıyordu. Robust selector ile düzeltildi (ilk dolu attribute'u bulan döngü)
2. **Aksiyon barı temizliği:** "Yeni ölçü", "Foto yükle", "Excel içe aktar" butonları kaldırıldı (standart tablolara manuel kayıt eklenmez). "Excel dışa aktar" kaldı
3. **Filtre dropdown (Varyant B):** Boru → Schedule, Fitting → Parça Tipi, Flansh → Class. Client-side filter, "X / Y gösteriliyor" chip, Sıfırla butonu, aksiyon sayımı dinamik güncelleniyor

### Yapılanlar Listesi (kronolojik)

1. **CI hatası fix** -- 066b → 069 migration adı rename (MIG_ISIM_BOZUK kuralı)
2. **Migration 070** -- fitting+flansh malzeme_grubu UPDATE
3. **kutuphane-detay TABLO_KONFIG** -- fitting (22 kolon) + flansh (22 kolon)
4. **Migration 071** -- fitting_olculer SELECT policy
5. **Migration 072** -- boru/flansh_malzeme_uyum olusturma_at rename
6. **Migration 073** -- ozel_parca_boru_kaydet Sch opsiyonel
7. **Modal frontend** -- Sch validasyon + reset + RPC çağrısı + placeholder
8. **Migration 074** -- RPC tenant_id INSERT'e eklendi
9. **Migration 075** -- ASME standart adı normalizasyonu
10. **Satır tıklama bug fix** -- panel_lejant[0] robust selector
11. **Boru TABLO_KONFIG fix** -- nps_inch + yuzey_m2_m yanlış kolon adları
12. **Aksiyon barı temizliği** -- 3 buton kaldırıldı
13. **Filtre dropdown** -- 3 tablo için, client-side filtering

---

## CI Son Durum

- **Build:** SARI (1 hata 070-075 öncesi yeşillendi, 34 i18n+G-03 uyarısı kaldı, 93'te kapsam dışı)
- **Vercel:** Production = 93 sonu, son commit `b235f79` (filtre + aksiyon temizliği)
- **Migration sayısı:** 075'e kadar gidiyor, hepsi DB'de + repo'da senkron

---

## 94'e Açık Borç (önceliğe göre)

### P0 — Anlamlı/acil
1. **olusturma_at tam rename (Migration 076)** -- 18 tablo + 9+ kod dosyası (api/kuyruk-isle, api/kuyruk-durum, api/izometri-oku, admin/kutuphane-cakismalar). Kritik API path'lerini etkiliyor, dikkatli refactor + test gerekli. ~1 saat.

### P1 — Önemli (kullanıcı görür)
2. **İnceleme listesi sayfası** -- Ana sayfada "1 inceleme" gösteriliyor ama tıklanamaz, `kutuphane-inceleme.html` yok. ~45 dk.
3. **Ek dosyalar paneli "satır geneli"** -- Şu an kutuphane-detay.html'de "(standart geneli) — medya tablosu 90+" diyor placeholder. Cihat'ın isteği: satıra tıklayınca o satırın dosyaları görünsün. Medya tablosu da yok (90+ borç). ~1.5 saat (tablo + UI).

### P2 — Mimari/temizlik
4. **Bug 1 Seçenek B** -- `malzeme_grubu` kolonunu fitting + flansh tablolarından `DROP COLUMN`, KARAR-43'e tam uyum. Çapraz uyum widget'ı (`fitting_malzeme_uyum`, `flansh_malzeme_uyum` ile "hangi malzemelerden üretilebilir"). 070'in geri alımı. ~2-3 saat.
5. **i18n + G-03 borçları** -- 33 i18n key (devre_detay 6 + izometri-batch 18 + spool_detay 9) + 1 G-03 ham yüzey. CI sarı → yeşil. 51'den beri açık. ~45 dk.

### P3 — Sonra
6. **Boru için NPS kolonu** -- DB'de yok, DN'den türetilebilir bir bilgi. Kolon eklenip seed mi yapılsın, yoksa UI'da DN→NPS lookup tablosu mu? Mimari karar gerekli.
7. **Fitting'e ikinci filtre dropdown** -- Şu an sadece parça_tipi. Schedule de eklenebilir.
8. **Standart bazlı medya tablosu** -- 90+ borç, "medya tablosu" placeholder'lar yerine gerçek tablo.

---

## Kararlar (93'te Alınanlar)

- **KARAR-93.1 (Seçenek A pragmatik):** Bug 1 için DROP COLUMN yerine `UPDATE 'karbon'` ile geçici çözüm. KARAR-43 (geometri ≠ malzeme) mimari olarak hâlâ doğru, B seçeneği 94+'ya not düşüldü. Sebep: pilot "varmış gibi" oynanıyor, sayfayı görünür yapmak öncelik, mimari temizlik 94'e.
- **KARAR-93.2 (A1 tüm kolonlar):** Fitting (22) + flansh (22) detay sayfasında **bütün kolonlar gösterilsin**, yatay scroll OK. Sebep: Excel dışa aktar eksiksiz olsun, ayrıca panel detay görünümünde her ölçü incelenebilsin.
- **KARAR-93.3 (Sentetik Sch):** Özel parça için Sch parametreleri NULL kabul, sentetik üretim `'OZEL'` / `'-'` / `'OZEL_DC<cap>_ET<et>'`. `boru_olculer` NOT NULL constraint'i korunsun, kullanıcı uydurmak zorunda kalmasın.
- **KARAR-93.4 (Standart format):** ASME ailesi dahil tüm standartlar `<KURUM>-<KOD>` formatında (tek tire, boşluk yok). 75'te uygulandı. Yeni eklenen standartlar da bu kurala uymalı.
- **KARAR-93.5 (Filtre Varyant B):** Detay sayfasında filtre ayrı çubukta (aksiyon barına gömülü değil), "X / Y gösteriliyor" chip + Sıfırla butonu ile. Sebep: filtre olduğu görsel olarak net, kullanıcı kaybolmaz.
- **KARAR-93.6 (olusturma_at rename ertelendi):** 18 tablo + 9+ kod dosyasına dokunmak tek oturumda risk yüksek, 94'e ertelendi. 072 sadece `*_malzeme_uyum` 2 tablosunu kapsadı (yeni eklenmişlerdi, etkisi sıfır).

---

## İstatistikler

- **Migration:** 070, 071, 072, 073, 074, 075 (6 yeni)
- **Push:** ~10 commit (her iş kendi commit'i)
- **Etkilenen kayıt:** 877 + 785 = 1.662 satır UPDATE
- **Yeni kod:** ~200 satır JS (TABLO_KONFIG fitting+flansh + filtre dropdown + handler)
- **DB nesnesi:** 1 RPC iki kez güncellendi (073 + 074), 1 RLS policy eklendi (071)
- **Süre:** ~7 saat (1.5 saat plandı)
