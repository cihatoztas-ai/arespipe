# Son Durum — 128. Oturum (27 Mayıs 2026)

> 127 → 128 geçişi. Devre Wizard "İnceleme & Onay" **frontend iskelesi** (`devre_wizard_v3.html`)
> yazıldı, push edildi, **canlıda Demo Atölye'de test edildi**: İnceleme + B canlı dolum + terfi
> üçü de kanıtlandı. Bir mimari boşluk yüzeye çıktı (terfi-yeniden-eşle), 129'a.

---

## Bu Oturumun Sonucu

**128 başarıyla kapatıldı.** FAZ-1 iskelesi (`devre_wizard_v3.html`, 1038 satır / 73178 byte) yazıldı,
flag arkasında pilot Demo Atölye'ye deploy edildi, gerçek IFS .xlsm + izometri PDF'lerle test edildi.
Mevcut `devre_wizard.html` (v2) **bir karaktere dokunulmadı** (MK-127.2 izolasyon).

### Yapılanlar (sırasıyla)

1. **Karar A kilitlendi (kod-öncesi, MK-127.1 çakışma kapısı taranarak):** Omurga ideal "terfiye
   kadar devreler yok" hâli taslak modu fazını gerektiriyor (omurga 18.d, sonraki faz). FAZ-1 için
   canlı-kod yolu seçildi: "İncele"de devre `durum='taslak'` oluşur; "Onayla" (terfi) ile spool/QR +
   `durum='aktif'`. Şemaya minimum dokunuş (sadece durum CHECK).

2. **`devre_wizard_v3.html` yazıldı** (mockup v5 görsel + v2 modül yüzeyi birebir):
   - **Adım 1 — Devre & Belgeler:** tek akış (mevcut/yeni toggle yok, MK-125.4), tersane seçilebilir
     (MK-126.1), proje + devre adı zorunlu, drag-drop + dosya tablosu (v2 handler'ları aynen),
     Excel-gate (MK-125.3), L3 aç/kapa, Beklemeye Al, İncele→.
   - **İncele→:** taslak devre + Storage upload + kuyruk (bom/izometri/sakla, `yukleyen_id` dolu) +
     BOM parse (`/api/kuyruk-isle-excel`) + kabuk `ARES_KABUK.grupla` → Adım 2.
   - **Adım 2 — İnceleme & Onay:** mockup v5 (stat-grid + Özet + 4 sekme + 14-sütun `.dt`).
     `POST /api/devre-inceleme {devre_id, kabuk_spoollar}` render; marka client'ta `ARES_NORM.marka`.
   - **B canlı dolum:** `ARES_IZO_DRENAJ.izometriDreneEt({filtre:{devreId},onIlerleme})` → her PDF
     bitince endpoint yeniden çağrı (🔴→🟢), "N PDF işleniyor" şeridi.
   - **Onayla → terfi:** `ARES_KABUK.grupla` + `ARES_KABUK.aktar` + `durum` 'taslak'→'aktif' +
     `_devreOzetSenkron`.

3. **Migration 094** (`094_devreler_durum_taslak.sql`): `devreler.durum` CHECK kümesine `'taslak'`
   eklendi (idempotent, MK-99.1). Dry-run (MK-98.2) + canlı ALTER uygulandı.

4. **DB ön-koşul:** `feature_flags` master'a `devre_wizard_v3` (master-önce, MK-98.1; FK
   `tenant_features.feature_kod → feature_flags.kod`) + `tenant_features` flag aktif **yalnız Demo
   Atölye** (`00000000-...0001`, kod A). Demo Tersane (E) dahil DEĞİL (MK-127.2).

5. **Statik doğrulama (canlı modüllerden, test öncesi):** `ARES_KABUK.grupla().spoollar` alanları
   `{pipeline, spoolNo, rev, anaMalzeme, toplamKg, yuzeyHam, bom}` → endpoint `kabuk_spoollar` ile
   **birebir**, client'ta map gerekmez. `ARES_NORM.marka/revFmt/malzemeEtiket`, `izometriDreneEt`
   (`onIlerleme.faz` = 'bitti'/'tamam'), `aktar` imzaları tuttu. Tek kozmetik fix: Malzeme sekmesi
   `grupla().bom`'dan render.

6. **Canlı test (Demo Atölye, gerçek IFS .xlsm + izometri PDF):**
   - İncele açıldı; dosyalar auto-detect (bom_excel / izometri / diger), gizli dosya atlandı.
   - Taslak devre + kabuk doğru türetildi; terfi çalıştı (iki devre, 8'er spool, çap/et/ağırlık/
     malzeme/kalite/spool ID/marka hepsi doğru).
   - **İnceleme tablosu doldu** (🟢 4 okundu, 🔴 4 eksik), **B drenaj "8 PDF işleniyor" döndü**,
     izometri eşleşme `L2 %100` tuttu (dosya adı + seviye geldi). → 2 + 3 + 5 doğrulandı.

---

## Yeni MK Kararları (128)

| MK | Karar |
|----|-------|
| MK-128.1 | Taslak devre statüsü: wizard "İncele"de devre `durum='taslak'` oluşur (belge için devre_id şart, FK); terfide `'aktif'`. Migration 094 (CHECK'e 'taslak'). Onay bekleyen = `durum='taslak'` filtresi |
| MK-128.2 | Feature flag eklerken master-önce: `tenant_features.feature_kod → feature_flags.kod` FK; yeni flag önce `feature_flags` (idempotent NOT EXISTS), sonra `tenant_features` (MK-98.1 uygulaması) |
| MK-128.3 | `kabuk_spoollar = ARES_KABUK.grupla().spoollar` birebir (pipeline/spoolNo/rev/anaMalzeme/toplamKg/yuzeyHam) → endpoint ile uyumlu, client map yok. Statik doğrulandı |

---

## KEŞİF — Terfi-yeniden-eşle boşluğu (129'un baş maddesi)

devre_detay'da (terfi sonrası canlı) spool DURUM "Bekliyor", İZOMETRİ bağı yok ("yenisi tam okumuyor").
Kök sebep **mimari, regresyon değil:** v3'te drenaj **İnceleme'de** (taslak, spool henüz YOK) çalışıyor;
kanonik eşleştirici `spooller`'dan okuduğu için terfiden önce bağ kuramıyor. Terfiden sonra spool var
ama **yeniden-eşle yok** → izometri öksüz. (v2'de spool erken oluşup drenaj sonra çalıştığı için bağ
kuruluyordu — fark tam bu.) Omurga bunu MK-127.4 alt-sorusu olarak açık bırakmıştı.

**İnceleme tablosu (taslak) izometriyi DOĞRU okuyor** (test kanıtladı); eksik olan terfi sonrası bağ.

---

## CI Son Durum

- Push'ta KOD var (`devre_wizard_v3.html` + `migrations/094...`) → CI çalışır (`[skip ci]` YOK).
- Yeni sayfa + yeni migration, mevcut hiçbir dosyaya dokunulmadı → yeşil beklenir.
- Doc commit (bu 3 dosya) ayrı; `[skip ci]` ile gidebilir.

---

## 129'a Açık Borç (önceliğe göre)

1. **Terfi-yeniden-eşle (MK-127.4) — ÖNERİ A:** terfiden sonra devrenin izometri `parse_sonuc`'undan
   kanonik eşleştiriciyi re-eşle modunda çağır (PDF re-parse YOK, AI YOK, $0). Yeni
   `/api/devre-eslesme-yenile {devre_id}` veya mevcut matcher'a re-eşle girişi. "Tam okuma"nın kökü.
2. **Adım 1 klasör ağacı + işaretleme** (bilgi amaçlı / revizyon-öncesi → eşleştirme dışı) —
   mockup + omurga Bölüm 5 / MK-97.6. (Şu an Adım 1 düz tablo; ağaç Adım 2 Dökümanlar'da.)
3. **Onayla-drenaj guard:** drenaj sürerken "Onayla" uyarır/bekler (yoksa eksik izometriyle terfi).
   + İzometri dosya adı tooltip (truncation kozmetik).
4. **Devreler girişi** "Devre Yükle" + onay-bekleyen liste (MK-126.4, `durum='taslak'`) +
   `devreler.html`/`proje_detay.html` canlı listelerine `durum<>'taslak'` filtresi (KORUMA-2 dikkatli).

**Sonraki fazlar (omurga 18.d):** çapa görsel arayüzü + değer düzeltme **yazma** + `taslak_haric`/
`taslak_not`; A2 et/çap çelişkisi (client `grupla` çıktısına çap).

---

## Push Paketi

| Dosya | Repo yolu | Tür | Durum |
|-------|-----------|-----|-------|
| devre_wizard_v3.html | `devre_wizard_v3.html` (kök) | **kod (yeni)** | push edildi |
| 094_devreler_durum_taslak.sql | `migrations/094_devreler_durum_taslak.sql` | **migration (yeni)** | push edildi |
| son-durum.md | `.github/son-durum.md` | doc | bu commit |
| CLAUDE-SON-OTURUM.md | `CLAUDE-SON-OTURUM.md` | doc | bu commit |
| CLAUDE-SONRAKI-OTURUM.md | `CLAUDE-SONRAKI-OTURUM.md` | doc | bu commit |

---

> 129 açılışında bu dosya + `docs/DEVRE-WIZARD-OMURGA.md` (v3.1) + `CLAUDE-SONRAKI-OTURUM.md` okunur.
> İlk iş önerisi: terfi-yeniden-eşle (MK-127.4 = A onayı sonrası). "Tam okuma"yı bu çözer.
