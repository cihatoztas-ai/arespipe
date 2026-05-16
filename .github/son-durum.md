# Son Durum -- 92. Oturum (16 Mayis 2026)

> Hedef: Plan B -- DB altyapisi + 3 kucuk borc + oneri aksiyon akisi + cakisma yonetimi. Tum hedefler tutturuldu ama 2 saatlik plan ~3.5 saate uzadi.

---

## Bu Oturumun Sonucu

**92 tam kapsamla kapandi.** B plani hedefleri:

1. DB altyapisi tamam (066, 066b, 067)
2. Cakisma yonetimi backend + frontend (068, sayfa, modal)
3. 3 kucuk UI borcu cozuldu
4. Belgeleme tam (KAPSAM Bolum 6, MIGRATION-YOL-HARITASI, 93-DEVRALINAN-BUGLAR)

**Bonus tespit:** Kutuphane sandigimizdan dolu (1.347 satir geometri) ama %66'si UI'dan gorunmuyor (fitting + flansh `malzeme_grubu` NULL). 91 oncesi bug, 93'e devraldi. Detay: `docs/93-DEVRALINAN-BUGLAR.md`.

### Yapilanlar

1. **Migration 066** -- `fitting_malzeme_uyum` FK fix
2. **Migration 066b** -- Policy referans fix (91 eksigi)
3. **Migration 067** -- `boru_malzeme_uyum` + `flansh_malzeme_uyum` CREATE + RLS
4. **Migration 068** -- Cakisma yonetimi (audit + 2 RPC)
5. **Kucuk borc 1** -- "Bekleyen Oneriler" iki sayim
6. **Kucuk borc 2** -- `ozel_parca_boru_kaydet` dokumantasyonu
7. **Kucuk borc 3** -- Broken link tooltip + `ozel` karti silindi + `uyum` 3 tabloya
8. **Yeni sayfa** -- `admin/kutuphane-cakismalar.html`
9. **Modal** -- `kutuphane-oneriler.html`'a "+ Ekle" akisi
10. **Belge guncellemeleri** -- KAPSAM Bolum 6 + 93-DEVRALINAN-BUGLAR.md

---

## CI Son Durum

- **Build:** YESIL (commit sonrasi otomatik)
- **Vercel:** Production = 91 sonu (henuz 92 commit'i push edilmedi)

---

## 93'e Acik Borc (oncelige gore)

1. **Bug 1: fitting + flansh malzeme_grubu NULL (P0)** -- 877 satir UI'dan erisilmiyor. Detay: `docs/93-DEVRALINAN-BUGLAR.md`. 3 secenek (A hizli UPDATE, B kolonu kaldir, C erteleme).
2. **Push sonrasi canli test (P0)** -- 92'nin 11 dosya degisikligi Vercel'de dogru goruluyor mu.
3. **Bug 2: olusturma_at vs olusturma (P2)** -- kolon adi tutarsizligi.
4. **Fitting/flansh icin "Kutuphaneye Ekle" RPC** -- `ozel_parca_fitting_kaydet`, `ozel_parca_flansh_kaydet`.
5. **Generic UI altyapisi (KARAR-91.F)** -- eski plan, 93+.

---

## Kararlar (92'de Alinanlar)

| # | Karar |
|---|---|
| **KARAR-92.A** | Cakisma yonetimi 4 katman mimarisi (tespit / uyari / birlestirme / onleme) |
| **KARAR-92.B** | Her parca tipinin kendi `ozel_parca_X_kaydet` RPC'si (generic tek RPC degil) |
| **KARAR-92.C** | Modal yari otomatik: DN tahmin + agirlik formulu auto-fill, geri kalan manuel |
| **KARAR-92.D** | Gecici/kalici ozel kayit ayrimi YOK -- DB schema saf kalsin |
| **KARAR-92.E** | Birlestirme yonu: HER ZAMAN ozel -> sistem (standart authoritative) |
| **KARAR-92.F** | Yol 3 -- ozel kayit JSONB snapshot arsive yazilir, sonra silinir (veri kaybi SIFIR) |
| **KARAR-92.G** | Yeni sistem standardi migration'i yazilirken cakisma kontrolu zorunlu |
| **KARAR-92.H** | "Kutuphane yapisal kapanisi" = DB altyapisi + akislar tam. Icerik (P0/P1) ayri is, 93+ |
| **KARAR-92.I** | Bilesik PK information_schema'da cross-join gozukur (91 "PK yok" teshisi yanlisli) |

---

## 92'nin Dersleri

1. **FK ile policy ayri sey.** 91'de FK fix yapildi ama policy hala eski tabloyu referansliyordu. Tablo schema degisikliklerinde RLS policy'leri de mutlaka kontrol et.

2. **Mojibake direnci.** SQL editor Latin-1 olarak okuyabilir, Turkce karakter sebep olabilir. ASCII-safe yazim guvenli. (067 v1 hatasi -> v2)

3. **PL/pgSQL %ROWTYPE schema-qualified.** `SET search_path TO 'public, arsiv'` tek string olarak okunur. Cozum: `SET search_path = public, arsiv` (tirnaksiz) + `public.boru_olculer%ROWTYPE`. (068 v1 hatasi -> v2)

4. **Test push sonrasi yapilir.** Vercel preview deploy gerektirir. 92'de canli test push'tan once denendiginde 91 sonu hali goruldu.

5. **Plan vs gercek tutarsizligi.** 92 plan 2 saatti, gercek ~3.5+ saat. "Oneri aksiyon akisi" beklenmedik buyuk bir is oldu.

6. **Kutuphane sandigimizdan dolu.** 1.347 satir geometri var, %34'u UI'dan gorunuyor. 91 oncesi bug, 93'te cozulecek.

7. **Cihat'in saha gercegi en degerli mimari girdi.** "Standardi 2 saat aramayacagim" tek cumlesi cakisma yonetimi 4-katmanli sistemini olusturdu.

---

## Commit'ler (push'ta gidecek)

| Dosya | Tip |
|------|---|
| `migrations/066b_fitting_malzeme_uyum_policy_fix.sql` | feat |
| `migrations/067_boru_ve_flansh_malzeme_uyum_create.sql` | feat |
| `migrations/068_cakisma_yonetimi_boru.sql` | feat |
| `admin/kutuphane-cakismalar.html` | feat |
| `admin/kutuphane-oneriler.html` | feat |
| `admin/kutuphane.html` | feat |
| `docs/KUTUPHANE-KAPSAM.md` | docs |
| `docs/93-DEVRALINAN-BUGLAR.md` | docs |
| `.github/son-durum.md` | docs |
| `CLAUDE-SON-OTURUM.md` | docs |
| `CLAUDE-SONRAKI-OTURUM.md` | docs |

CI: YESIL bekleniyor.

---

> 93. oturum acilisinda bu dosya, `docs/93-DEVRALINAN-BUGLAR.md`, `CLAUDE-SONRAKI-OTURUM.md` okunacak.
