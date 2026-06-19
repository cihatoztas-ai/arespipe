# 🔧 KARARLAR + BRIEFING Birleştirme Planı (194. oturum)

> **Durum:** PLAN — henüz uygulanmadı. Kaynak tarama: `docs/DOKUMAN-SAGLIK-TARAMASI-193.md` (commit `2e92243`).
> **Kural:** Kör birleştirme YASAK. Her adım atıf-doğrulamalı. Uygulama ayrı onayla başlar.
> **Karar (194):** Tek otorite = **`docs/KARARLAR.md`** (193 güncel, 250 MK). Kök `./KARARLAR.md` 172'de donmuş çatal.

---

## 0) Özet — ne var, ne yapılacak

İki `KARARLAR.md` ~MK-135.1'e kadar uyumlu, sonra çatallanmış. Üç tür iş var:

| # | İş | Adet | Risk | Numara |
|---|---|---|---|---|
| **A** | Kök-only kuralları docs'a taşı (canlı atıflı, docs'ta eksik) | 7 | 🟢 Düşük | Korunur |
| **B** | Gerçek MK numara çakışmaları | 7 | 🔴 Yüksek | Bir taraf kayar |
| **C** | BRIEFING birleştirme + tek otorite | 2 dosya | 🟠 Orta | — |
| **D** | Otorite MK kuralı (gelecek koruması) | yeni MK | 🟢 Düşük | yeni |

---

## A) Kök-only kurallar — docs'a taşı (numara KORUNUR)

Bu 7 karar `docs/KARARLAR.md`'de tanımlı değil ama **canlı kod/dök numarayla atıf yapıyor**. docs'ta numaraları boş → çakışma yok → **olduğu gibi taşı, numara değişmez, atıf güncellemesi gerekmez.**

| MK | Başlık (kök) | Canlı dış atıf |
|---|---|---|
| MK-132.1 | Teşhis canlı yolak uçtan uca çalıştırılmadan kapatılmaz | `docs/IZO-KANIT-SETI-31PDF.md`, `docs/FORMAT-OGRETIM-ATOLYE-162.md`, `docs/WIZARD-YOL-HARITASI.md` |
| MK-132.2 | glyph-onar band-A VE band-B yapar, tanıma + L2'ye bağlı | `api/izometri-oku.js` |
| MK-133.1 | Çapraz doğrulamada Excel'in referans rolü kaynak güvenine bağlı | `uyarilar.html`, `lib/malzeme-kiyas.js`, `api/kuyruk-isle-izometri.js` |
| MK-133.2 | `spool_malzemeleri.agirlik_kg` satır-toplamı semantiktir | `lib/malzeme-kiyas.js` |
| MK-133.3 | Dirsek için malzeme-korunumu invariantı | `lib/malzeme-kiyas.js` |
| MK-134.1 | `[skip ci]` çok-commit push'ta tüm CI'yi atlar | `CLAUDE-SONRAKI-OTURUM.md` (+docs kopyası) |
| MK-135.1 | v3 İnceleme K2 enjeksiyonu handler katmanında (A2) | (yalnız KARARLAR) |

**Eylem:** Bu 7 bloğu kök `./KARARLAR.md`'den tam metniyle al, `docs/KARARLAR.md`'de uygun kronolojik konuma (132/133/134/135 sırasına) ekle. Numara aynen kalır → tüm canlı atıflar geçerli kalır.

---

## B) Gerçek MK numara çakışmaları (7 vaka)

### B.1 — MK-135.2: ÇAKIŞMA DEĞİL, REVİZYON → docs kazanır

- **Kök:** "S02 dirsek çelişkisi = Excel BOM hatalı (adet×birim çarpılmamış)" → *sonuç sonradan **yanlış** bulundu.*
- **docs:** "REVİZYON (MK-136.1 ışığında): kök sebep açı körlüğü, Excel kendi içinde tutarlı."
- İkisi de **aynı konu** (S02 dirsek bug). docs sürümü kökün sonucunu açıkça çürütüp düzeltiyor.
- **Eylem:** docs sürümü olduğu gibi kalır. Kök sürümü **taşınmaz** (obsolet). Yeniden numaralama YOK.
- Dış atıf: yok → risk yok.

### B.2 — MK-172.1 … 172.6: GERÇEK ÇAKIŞMA (iki ayrı konu kümesi)

Kaynak: 172. oturumda docs'a "172. OTURUM EKİ (MK-172.1..172.10)" bloğu eklenmiş; kök dosya ayrı bir 172.x kümesi yazmış. Aynı numaralar iki farklı konuya atanmış.

| MK | KÖK anlamı (UI/logo kümesi) | DOCS anlamı (devre/wizard kümesi) | Canlı dış atıf |
|---|---|---|---|
| 172.1 | Belge anteti tek kaynak (helper mimarisi) | Devreler tek giriş → wizard v3 | yok |
| 172.2 | Logo renk (print sabit / ekran tema) | "Son güncelleme" damgası | yok |
| 172.3 | Menü daraltma: wordmark display:none | İmalat sıra numarası kaldırıldı | yok |
| 172.4 | Tarama core rengi MAVİ (#4C8DF5) | Native termin takvimi | yok |
| 172.5 | Tenant logo akışı | Büyük `.in()` listelerini DİLİMLE | 🟢 `devre_wizard_v3.html` ×2 → **DOCS anlamı** |
| 172.6 | Upload/`</html>` bütünlük kontrolü | İşlenenler ekranı redesign | 🔴 BRIEFING + 3 handoff → **KÖK anlamı** |

**Politika ilkesi (194 kararı):** *Canlı atıf gerçek tarihi belirler.* Bir numaranın "doğru" anlamı, koda/handoff'a/BRIEFING'e yazılmış canlı atıfların gösterdiği anlamdır. Doğru atıfları fork-kazasına uydurmak için yeniden yazmak tarihi bozar. 172.5=docs ve 172.6=kök ikisi de bu tek kuralın çıktısıdır — istisna değil.

- 172.5'te kod (`devre_wizard_v3.html`), **docs** anlamını (.in dilimle) gösteriyor → 172.5 = docs, **korunur, dokunulmaz.**
- 172.6'da BRIEFING + 3 handoff, **kök** anlamını (upload `</html>`) gösteriyor → 172.6 = kök, **numara KORUNUR, taşınmaz.** Bu atıflar oturum-172'nin gerçek 6. kararının kanıtı.
- docs'taki 172.6 "işlenenler redesign" → **sıfır canlı atfı olan yetim** → 172.16'ya kaydırılır.

#### ✅ SEÇENEK 1.5 — Atıf-doğru (sıfır atıf dokunuşu)

| Kaynak / karar | Numara | İşlem |
|---|---|---|
| docs 172.1 — Devreler tek giriş → wizard v3 | **172.1** | Korunur |
| docs 172.2 — "Son güncelleme" damgası | **172.2** | Korunur |
| docs 172.3 — İmalat sıra numarası kaldırıldı | **172.3** | Korunur |
| docs 172.4 — Native termin takvimi | **172.4** | Korunur |
| docs 172.5 — Büyük `.in()` DİLİMLE | **172.5** | Korunur (kod atfı) |
| **kök 172.6 — Upload/`</html>` bütünlük** | **172.6** | **Korunur — docs'a eklenir** (BRIEFING+3 handoff atfı) |
| kök 172.1 — Belge anteti helper | **172.11** | Kök → docs, yeni no |
| kök 172.2 — Logo renk (print/ekran) | **172.12** | Kök → docs, yeni no |
| kök 172.3 — Menü daraltma wordmark | **172.13** | Kök → docs, yeni no |
| kök 172.4 — Tarama core mavi | **172.14** | Kök → docs, yeni no |
| kök 172.5 — Tenant logo akışı | **172.15** | Kök → docs, yeni no |
| **docs 172.6 — İşlenenler redesign (yetim)** | **172.16** | docs içinde yeniden numaralanır |

**Atıf dokunuşu: SIFIR.**
- 172.6 canlı atıfları (BRIEFING + 3 handoff + varsa CLAUDE.md) = kök anlamı → değişmez. ✓
- 172.5 kod atıfları (`devre_wizard_v3.html`) = docs anlamı → değişmez. ✓
- docs'un yetim "işlenenler redesign"i → 172.16'ya kayar, dış atfı olmadığı için risk yok. ✓

**Artı:** Tek dosya değişir (`docs/KARARLAR.md`); hiçbir handoff/BRIEFING/kod atfına dokunulmaz; tarih korunur. **Eksi:** docs içinde "172.6 → 172.16" yeniden numaralama dikkat ister (yetim olduğu grep ile teyitli).

---

## C) BRIEFING birleştirme + tek otorite

| | Kök `./BRIEFING.md` | `docs/BRIEFING.md` |
|---|---|---|
| Oturum | 187 (16 Haz) | 167 (8 Haz) — **bayat** |
| Benzersiz satır | 36 | 65 |

- CLAUDE.md MK-56.2: "BRIEFING tek aktif bağlam" → **kök** işaret ediliyor. Otorite = **kök `./BRIEFING.md`**.
- **Ek bayatlık:** Kök BRIEFING bile 187'de; handoff'lar 193'te → kök BRIEFING 6 oturum geride. (Bu kopya sorunu değil, ayrı içerik tazeleme işi — bu plan kapsamında "işaretle", asıl güncelleme 194 kapanışında.)
- **Eylem:**
  1. `docs/BRIEFING.md`'de olup kökte olmayan hâlâ geçerli içerik var mı diye 65 benzersiz satırı gözden geçir (çoğu 167 dönemi bayat olabilir; körlemesine taşıma yok).
  2. docs/BRIEFING.md'yi kök ile **özdeş** yap (otorite kökü yansıtsın) VEYA tek otorite politikası gereği docs kopyasını kaldır (D'ye bağlı).
  3. Kök BRIEFING'i 193 gerçeğine güncelleme = 194 kapanış işine bırak (ayrı).

---

## D) Otorite MK kuralı — gelecek koruması (yeni MK önerisi)

Repo şu an çapraz otorite tutuyor (KARARLAR→docs, BRIEFING→kök, handoff üçlüsü→3 yerde senkron). Bu dağınıklık yeniden üremesin diye tek kural:

> **MK-194.x [DISIPLIN] — Doküman tek-otorite + senkron politikası**
> Her çok-kopyalı doküman için **tek otorite dizin** tanımlanır; diğer kopyalar ya kaldırılır ya da otoriteden türetilen birebir ayna olur (özdeş md5 zorunlu).
> - `KARARLAR.md` → otorite **`docs/`**. Kök kopya kaldırılır (veya "bkz docs/KARARLAR.md" stub'ı).
> - `BRIEFING.md` → otorite **kök `./`** (MK-56.2 uyumu). docs kopyası kaldırılır/ayna.
> - Handoff üçlüsü (son-durum / CLAUDE-SON / CLAUDE-SONRAKI) → mevcut çok-yer senkron korunur, kapanış scripti md5 eşitliğini doğrular.
> - Kapanış ritüeline md5-eşitlik kontrolü eklenir; çatal tespitinde uyarı.

> **AÇIK KARAR:** Kök `KARARLAR.md` tamamen mi silinsin, yoksa "otorite docs/'tadır" diyen kısa stub mu kalsın? (Stub, kök dizine bakan birini doğru yere yönlendirir.)

---

## Dokunulacak dosyalar (Seçenek 1.5)

| Dosya | İşlem |
|---|---|
| `docs/KARARLAR.md` | A: 7 kural eklenir (numara korunur) · B: kök 172.6 (upload) **172.6 olarak** eklenir · kökün diğer 5'i 172.11–172.15 olarak eklenir · docs'un yetim 172.6 (redesign) → **172.16** yeniden numaralanır |
| `./KARARLAR.md` | D kararına göre: silinir veya stub'a indirgenir |
| `docs/BRIEFING.md` | D kararına göre kaldırılır/ayna (C) |
| `BRIEFING.md` | **Atıf dokunuşu YOK** (172.6 = kök anlamı korundu). İçerik tazeleme = 194 kapanışı, ayrı iş |
| `CLAUDE-SONRAKI-OTURUM.md` + docs kopyası | **Dokunulmaz** (172.6 atfı doğru) |
| `CLAUDE-SON-OTURUM.md` + docs kopyası | **Dokunulmaz** (172.6 atfı doğru) |
| `CLAUDE.md` | **Dokunulmaz** (172.6 geçerse kök anlamı, doğru) |

> **Atıf dokunuşu: SIFIR.** Sadece `docs/KARARLAR.md` (+ D'ye göre kök KARARLAR / docs BRIEFING) değişir. 172.5 kod atıfları ve tüm 172.6 atıfları olduğu gibi geçerli.

---

## Uygulama sırası (onaydan sonra)

1. **A** (en güvenli): 7 kök-only kuralı docs'a taşı, numara korunur. Doğrula: canlı atıflar artık otoritede karşılık buluyor (`grep`).
2. **B.1** (135.2): kök sürümü düş, docs revizyonu kalır. (Taşıma yok.)
3. **B.2** (172.x): Seçenek 1.5 → (a) docs'un yetim 172.6 "redesign"ini **172.16**'ya yeniden numarala (önce `grep` ile dış atfı=0 teyit), (b) kök 172.6 "upload"u docs'a **172.6** olarak ekle, (c) kökün diğer 5'ini 172.11–172.15 olarak ekle. **Hiçbir atıf güncellenmez.** Doğrula: docs'ta tek 172.6 var ve anlamı=upload; tüm canlı 172.6 atıfları karşılık buluyor.
4. **C/D**: otorite kuralını yaz (KARARLAR.md MK-194.x), kök KARARLAR + docs/BRIEFING için karar (sil/stub/ayna), handoff senkron md5 doğrula.
5. **Kapanış doğrulaması:** `docs/KARARLAR.md` MK heading sayısı = eski + A(7) + B.2(6) ; çift-tanımlı MK numarası = 0 ; tüm canlı MK atıfları otoritede mevcut.

---

## Açık kararlar (uygulamadan önce onay)

1. **172.x politikası:** ✅ **Seçenek 1.5 seçildi** (atıf-doğru, sıfır atıf dokunuşu) — bu raporda numara-haritası onayı bekleniyor.
2. **Kök `KARARLAR.md`:** tam sil vs "bkz docs/" stub'ı.
3. **`docs/BRIEFING.md`:** kaldır vs kökün aynası yap.
4. **Otorite kuralı** yeni MK numarası (MK-194.1 önerilir).

> Bu plan **uygulanmadı**. Yalnızca yol haritası. Onay gelince adım adım, her adımda doğrulamalı uygulanır.
