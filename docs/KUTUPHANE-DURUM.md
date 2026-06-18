# AresPipe — Kütüphane: Durum, Mimari & Yöntem

> **Bu belge `KUTUPHANE-DURUM.md` (Oturum 178) içeriğini KORUR + Oturum 189 sayfa mimarisiyle ZENGİNLEŞTİRİR.**
> İki bölüm: **A — Veri durumu** (ne yüklü, nasıl yüklenir) · **B — Sayfa mimarisi** (kütüphane.html nasıl çalışır).
> Son güncelleme: **Oturum 189 (18 Haziran 2026)**.
> Bu oturumda boru/flanş standart×malzeme kırılımı **canlı DB'den birebir tazelendi** (178'de "sonraki oturum" denmişti — artık burada).

---
---

# A BÖLÜMÜ — VERİ DURUMU

## A1. Özet (modül seviyesi — 189 canlı)

| Modül | Kapsam tavanı | Canlı (189) | Durum |
|---|---:|---:|---|
| `malzeme_kataloglari` | ~120 spec | 20 | başlangıç |
| `boru_olculer` | ~280 | **547** (karbon 297 / paslanmaz 132 / alüminyum 50 / cunife 68) | iyi |
| `fitting_olculer` | ~2.500 | **935** (cunife 328 / karbon 569 / paslanmaz 38) | büyüyor |
| `flansh_olculer` | ~800 | **375** (karbon 308 / cunife 67) | orta |
| `fitting_malzeme_uyum` | ~8.000 | 0 | script-üretimi (sonra) |
| `tenant_spec_seti` + `spec_kural` | ~500-1.000 | 0 | 2. tersane gelince |

> Tavan = üst sınır, %100 hedef değil. `.is('tenant_id', null)` → 547/547 boru NULL (1 "Ozel" tenant'lı istisna). Tüm preset `tenant_id IS NULL` + `sistem_preset=true`.

## A2. Standart × Malzeme kırılımı (189 canlı GROUP BY — birebir)

### boru_olculer (547)
| Standart | Malzeme | n |
|---|---|---:|
| ASME-B36.10M | karbon | 238 |
| ASME-B36.10M | paslanmaz | 43 |
| ASME-B36.19M | paslanmaz | 89 |
| ASTM-B241 | alüminyum | 50 |
| DIN-2448 | karbon | 29 |
| DIN-86019 | cunife | 44 |
| EEMUA-144 | cunife | 24 |
| EN-10216-1 | karbon | 29 |
| Ozel | karbon | 1 (tenant) |

### fitting_olculer (935) — parça tipi bazında
| Standart | Parça tipleri | Malzeme |
|---|---|---|
| ASME-B16.9 | 45_3D(32) 45LR(52) 90_3D(32) 90LR(52) cap(33) reducer_conc(193) reducer_ecc(193) stub_end(40) tee_eq(52) tee_red(63) | karbon + paslanmaz(38: 45LR/90LR) |
| ASME-B16.11 | 45SW 90SW cap_sw coupling_full coupling_half cross_sw tee_eq_sw (15'er) | karbon |
| DIN-86088 | tee_eq(82) tee_red | cunife |
| DIN-86089 | reducer_conc(158) | cunife |
| DIN-86090 | elbow_45lr(23) elbow_45sr(21) elbow_90lr(23) elbow_90sr(21) | cunife |

### flansh_olculer (375) — `geometri_std` + `flansh_tipi`
| geometri_std | flansh_tipi | n | Anlam |
|---|---|---:|---|
| B16.5 | WN | 132 | Welding Neck (boyunlu) |
| B16.5 | SO | 42 | Slip-On (düz) |
| B16.5 | BL | 42 | Blind (kör) |
| DIN-86037-2 | LJ | 29 | Lap Joint (cunife) |
| EN-1092-1 | EN-T01 | 23 | Düz / Slip-on (Type 01) |
| EN-1092-1 | EN-T05 | 23 | Kör (Type 05) |
| EN-1092-1 | EN-T11 | 23 | Boyunlu WN (Type 11) |
| EN-1092-1 | EN-T12 | 23 | Lap Joint (Type 12) |
| EN-1092-3 | EN-T05 | 19 | Kör (cunife) |

> **EN tip numaraları kavramdır** (Type 01≈Slip-on, 05=Blind, 11=Weld neck, 12=Lap). UI numara değil anlamı gösterir.

## A3. Öncelik (gemi tersanesi)
- **P0** 🔴: A105 WN/SO 150-300, CuNi deniz suyu (B466/467, DIN 86019), B16.9 90LR+Tee+Reducer DN50-200, B36.10 Sch40, paslanmaz 316L (A403/A312)
- **P1** 🟠: F316L 150-300, A234 WPB, B16.11 socket, A335 P11/P22
- **P2** 🟡: Class 600+, F11/F22, Duplex 2205/2507, Alüminyum 5083
- **P3** ⚪: Nikel (Inconel/Hastelloy), Class 2500

## A4. Yöntem (referans-çekme)
1. Sıradaki grubu **DB GROUP BY**'dan belirle (belgeye değil — belge bayatlar).
2. Referans katalogtan çek (Claude yapar; kullanıcı dosya yüklemez) — ölçü + ağırlık.
3. **≥2 bağımsız kaynak çapraz-doğrula** (MK-96).
4. JSON üret — şemaya birebir; `notlar` nested; her satır `kaynak`+`dogrulandi`+`_db_aksiyonu`.
5. Doğrula — JSON + fiziksel monotonluk + 5-satır spot-check.
6. Seed — `node scripts/seed-from-json.mjs <dosya>` (dry-run) → `--yaz` → COUNT teyit.

## A5. Kurallar (sert)
- **%100 referanstan.** Türetme/formül/yoğunluk-faktörü YASAK (ağırlık dahil).
- **Ağırlık atlanmaz**, başka kaynaktan çekilir.
- **Doğrulama zorunlu** (≥2 kaynak). `notlar`'a `kaynak`+`sapma_pct`+`dogrulandi`.
- **Ölçü malzemeden bağımsız** ama mevcut DB geometrisiyle teyit.
- **Veri silinmez** — şüpheli `_db_aksiyonu: FLAG_SUPHELI` → yazılmaz.
- **Preset**: `tenant_id IS NULL`, `sistem_preset=true`.

## A6. Kaynak hiyerarşisi
| Malzeme | Birincil | Doğrulama | 3. |
|---|---|---|---|
| paslanmaz fitting | dynamicforge A403/A815 | buyfittingsonline | Sandvik/Alleima |
| cunife | KME OSNA-10/30 | Wieland Eucaro | Stirlings |
| paslanmaz boru | Sandvik (B36.19M) | — | — |
| karbon fitting | Wermac / Bonney Forge | pipingpipeline | — |

## A7. Seed kapısı (AÇILDI — MK-178.2)
`fitting_olculer_dogal_uk` = UNIQUE NULLS NOT DISTINCT `(standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn, schedule_kod, class_no)`.
`scripts/seed-from-json.mjs` fitting'e uyarlı (7-alan, `notlar` stringify, `YENI`/`FLAG_SUPHELI`).
> `flansh_olculer` için unique constraint HENÜZ yok — flanşa geçince aynı dry-run (MK-98.2).

## A8. Açık veri borçları
- **`yaricap_mm` tutarsızlığı:** karbon 1.5×OD (DN100=171.4, muhtemel hata); paslanmaz 1.5×NPS (doğru). Okuma kodu görülünce hizalanacak.
- **45° uç-uca:** karbon `ucu_uca_b_mm`; şema yorumu `ucu_uca_c_mm`. Teyit sonrası hizalanır.
- **`standart` vs `geometri_std`** → **189'da ÇÖZÜLDÜ** (bkz. B4): boru/fitting `standart`, flanş `geometri_std`.
- paslanmaz 45LR + ≥DN300 90LR tek-kaynak → 2. kaynak nokta-kontrolü.
- Eksik P0 boşluklar: cunife cap (0), paslanmaz B16.11 socket (0), DIN flanş eksikleri.

## A9. Grup↔Standart tutarlılığı — matcher'ın hayati bağımlılığı (191 keşfi)

**Tespit edilen problem (191):** `spool_detay` boru matcher'ı (`boruEslestir`) OD/et ile aday buluyordu ama **malzeme grubunu sormuyordu.** Canlı veride karbon `ASME-B36.10M` ile paslanmaz `ASME-B36.19M` **neredeyse her OD+et'te çakışıyor** (P2 ile doğrulandı; dahası `B36.10M` aynı ölçüde HEM karbon HEM paslanmaz satır içeriyor — standart adı grubu ayırmaz). Sonuç: bir **316L boru karbon `B36.10M`'e** bağlanıyordu (modalda yanlış standart). İki kayma yolu vardı: (a) çakışmada tier-2 "ASME" substring'i grubu ayıramıyor; (b) o ölçüde **tek aday yanlış grupsa**, `length===1` erken-dönüşü onu körlemesine veriyordu.

**Fix (191 / 191b):** matcher'a **Tier-0 grup ekseni** eklendi — `_boruGrupBelirle(kalite, malzeme)` ile grup türetilir (`316L/paslanmaz/1.4571`→paslanmaz, `St 37`→karbon …), aday `malzeme_grubu`'na daraltılır, **grup belli + o ölçüde aynı-grup yok → null** (yanlış-grup bağlamaz, seed bekler). Grup-narrow `length===1` dönüşünden ÖNCE çalışır. Paslanmazda dimensyonel `B36.19M` tercih edilir. FK backfill **aynı mantığın SQL aynası** (join'de `bl.malzeme_grubu = grup` guard'ı) — boru ~1674 satır, dry-run grup-tutarlı doğrulandı, sıfır yanlış-grup. (Kaynak: `spool_detay.html::boruEslestir` + `boru` FK backfill SQL.)

**Kritik bağımlılık:** matcher'ın grup ekseni **her satırda doğru `malzeme_grubu`'na** güveniyor. Yeni bir JSON yanlış/eksik grupla gelirse kayma geri döner. Bu yüzden engelleme **seed kapısında**, veri tazeyken yapılır:

**Seed-gate lint (MK-191.1) — `scripts/seed-from-json.mjs` satır başına 3 denetim:**
1. **`malzeme_grubu` zorunlu + enum:** `{karbon, paslanmaz, cunife, aluminyum}` dışı/boş → `FLAG_SUPHELI`, yazma.
2. **standart↔grup whitelist:** `DIN-2448/EN-10216-1→karbon` · `ASME-B36.19M→paslanmaz` · `ASME-B36.10M→karbon|paslanmaz` · `ASTM-B241→aluminyum` · `DIN-86019/EEMUA-144→cunife`. Bilinen standart + uymayan grup → flag. **Yeni/bilinmeyen standart → yaz ama uyar** (haritayı bilinçli genişlet).
3. **Kanonik standart kodu:** `ASME-B36.19M` formatı (`B36.19`/`ASME B36.19M` değil) — matcher `indexOf('B36.19')` + `stdEtiket` sözlüğü buna bağlı.

> **Çakışma silinmez:** 60.3×2.77'de hem karbon hem paslanmaz satırın OLMASI gerekir (ikisi de gerçek boru). Çakışma fiziksel gerçektir; matcher **grup ekseninde** çözer, seed **grup doğruluğunu** garanti eder. Veri tarafında yapılacak iş yok, sadece etiket tutarlılığı.

---
---

# B BÖLÜMÜ — SAYFA MİMARİSİ (kutuphane.html, Oturum 189)

## B1. Vizyon — tek sayfa, dört bölge

Kütüphane **salt-okunur boyutsal referans**. Üç niyete hizmet eder: *parçaya ulaş / tabloya ulaş / karşılaştır*. Tek sayfa, dört dikey bölge, sekme/ayrı sayfa yok:

```
ZONE 1  Üst ana seçim (açılır kutu, overlay)  ── "neyi arıyorum"
ZONE 2  Seçili satır detayı (sabit yükseklik) ── kesit + ölçüler + medya
ZONE 3  Standart tablosu (Excel)              ── satır seç → detay güncellenir
ZONE 4  Otomatik karşılaştırma (sağa kaydır)  ── kullanıcı seçmeden, benzer parçalar
```

**Sayfa zıplamaz:** ZONE 2 sabit yükseklik (`min-height:228px`), açılır menüler overlay (içeriği itmez). Filtre yaptıkça/satır seçtikçe hiçbir şey kaymaz — bu bilinçli bir UX kararı (önceki "ucuz görünüm" şikâyetini kökten çözer).

## B2. Teknik temel
- **Salt-okunur**, doğrudan `ARES.supabase()` + RLS, **YENİ ENDPOINT YOK** (12/12 Vercel Hobby tavanı korunur).
- Tüm sorgular `.is('tenant_id', null)` (preset). `.eq('tenant_id', …)` KULLANILMAZ — preset'leri elerdi.
- Script sırası: `store → lang → layout → normalize` (ana uygulama kabuğu).
- Yetki: yonetici / firma_admin / super_admin / **operator** (tüm roller).
- Erişim: Uygulamalar dashboard → Kütüphane kartı (aktif). `getActiveKey`: kutuphane → 'uygulamalar'.

## B3. Filtre modeli (NİHAİ — Oturum 189 sonu)

İki katman:

### Üst — ana seçim (bağımlı/çapraz açılır kutular, overlay)
- **Parça · Tip · Malzeme · Standart** — dört açılır kutu + arama (+ ileride **fotoğrafla arama**, kamera ikonu placeholder).
- **Cross-filter:** her kutu diğer seçimlere göre daralır. CuNi seç → Standart sadece CuNi'leri gösterir; ASME B16.9 seç → Malzeme sadece karbona iner. Geçersiz seçenek **soluk** (gizlenmez → yer sabit). Sıra dayatması yok.
- **Tip kutusu ikonlu açılır** (konsantrik/eksantrik, 90lr/45, WN/SO/BL/LJ şekilleri). Boru/Cap'te tip yok → kutu gizlenir.
- Panel **overlay** (`position:absolute`, butonun altına hizalı), sayfa itmez, dışına tıkla → kapanır.
- **Veri kaynağı:** açılışta 1 kez 3 tablodan `(parca_tipi/flansh_tipi, standart/geometri_std, malzeme_grubu)` çekilir → `st.combos` → cross-filter istemci tarafında (her kutu açılışında ayrı sorgu yok).

### Tablo — detay süzgeçleri (Excel kolon menüsü)
- **Her kolon başlığı** tıklanabilir → o kolonun üstünde menü: **↑ artan / ↓ azalan sırala** + **çoklu-seçim değer süzgeci** (var olan değerler, boş seçenek yok).
- DN, Sch (flanşta **Class/PN**), et, çap, kg — hepsi süzülür+sıralanır.
- Seçim başlıkta görünür (`↑`, `[2]`), sağda "süzgeç/sıralama temizle".
- Menü tablo üstüne biner (overlay), sayfa itmez.

> **Neden iki katman:** ana kimlik (parça/tip/malzeme/standart) yukarıda; tablo-içi daraltıcılar (DN/Sch/Class — çok seçenekli) kolon başlığında. Excel hissi, kullanıcı çalışma tarzına uygun.

## B4. Facet → kolon haritası (DB gerçeği — 189 doğrulandı)
| Parça | Tablo | Standart kolonu | DN kolonu | Tip kolonu |
|---|---|---|---|---|
| Boru | `boru_olculer` | `standart` | `dn` | — |
| Fitting (dirsek/tee/redük/cap/bağlantı) | `fitting_olculer` | `standart` | `cap_buyuk_dn` (+`cap_kucuk_dn`) | `parca_tipi` |
| Flanş | `flansh_olculer` | **`geometri_std`** (standart NULL!) | `cap_dn` (+`basinc_sinifi`) | `flansh_tipi` |
- Malzeme her tabloda `malzeme_grubu`: **karbon · paslanmaz · cunife · aluminyum** (DB'de "cunife", "cuni" DEĞİL).
- Schedule: `schedule_deger` || `schedule_kod`.

## B5. parca_tipi normalizasyonu (kod ikiliği)
Aynı kavram iki kodla yazılı → tek görsel tipe indirgenir:
- `90LR` (ASME) ↔ `elbow_90lr` (DIN cunife) → norm `90lr` → "90° Dirsek (LR)"
- `45LR`↔`elbow_45lr`, `90_3D`, `45_3D`, `90SW`, `45SW`, `elbow_90sr`→`90sr`, `elbow_45sr`→`45sr`
- `reducer_conc`/`reducer_ecc`, `tee_eq`/`tee_red`/`tee_eq_sw`/`cross_sw`, `cap`/`cap_sw`, `coupling_full`/`coupling_half`/`stub_end`
- `TIPNORM` map + `rawCodesFor(part, norm)`: tablo sorgusunda norm → ham kod listesi (standart filtresi doğru ham kodu seçer).

## B6. Flanş tip etiketleri + ikon eşlemesi (189)
- **Etiket = anlam önde, numara referansta:** `EN-T01`→"Düz / Slip-on — EN Type 01", `EN-T05`→"Kör — EN Type 05", `EN-T11`→"Boyunlu (WN) — EN Type 11", `EN-T12`→"Lap Joint — EN Type 12". ASME: WN/SO/BL/LJ Türkçe açıklamalı.
- **İkon = 4 temel form:** `tipIcon` içinde EN tipleri forma eşlenir: EN-T11→WN, EN-T01→SO, EN-T05→BL, EN-T12→LJ. Boyunlu≠kör görsel ayrımı var.
- **AÇIK İŞ:** ikon çizim kalitesi zayıf → gerçek flanş kesit-şemaları (boyunlu/kör/düz/lap profilleri) çizilecek.

## B7. Standart normalizasyon sözlüğü
DB kodları tutarsız → `stdEtiket()` temizler: `B16.5`→"ASME B16.5" (öneksiz!), `ASME-B16.9`→"ASME B16.9", `DIN-86089`→"DIN 86089", `DIN-86037-2`→"DIN 86037-2", `EN-1092-1`→"EN 1092-1". Eşleşmeyen kod → tire boşluğa.

## B8. Otomatik karşılaştırma (ZONE 4)
**Kural:** aynı parça kimliği sabit, malzeme/standart eksen. Kullanıcı seçmez — satır seçilince otomatik çıkar, sağa kaydırılır (sütun sınırı yok). İlk sütun = seçili (mavi), farklı değerler amber.
- **Boru (190'da düzeltildi):** peer = aynı `dn` + **aynı `dis_cap_mm` + aynı `et_mm` (±0.05 tam eşleşme)**; her (malzeme,standart) grubundan tek satır. Eski "en yakın et" schedule kaydırıyordu (alu SCH10 ↔ çelik SCH40). Dış çap anahtarda olduğu için CuNi metrik serisi (OD 57/108) otomatik ayrışır — yalnız kendiyle karşılaşır (eşdeğer cidarlı çelik yok = boş, doğru).
- **Fitting (190'da düzeltildi):** peer = `.in('parca_tipi', rawCodesFor(p, normTip(...)))` + `cap_buyuk_dn` + `cap_kucuk_dn`. Eski ham `.eq('parca_tipi')` çapraz-standart eşi kaçırıyordu (`90LR` ASME ↔ `elbow_90lr` DIN aynı norm). Ortak-kodlu tipler (`reducer_conc`, `tee_eq`) bozulmadan çalışır.
- **Flanş (190'da düzeltildi):** peer = `flansh_tipi` + `cap_dn` + `basinc_sinifi` **her zaman** anahtarda (boşsa `.is(...,null)`). Eski koşullu `if(r.basinc_sinifi)` boş-sınıfta PN10↔PN40 karıştırabilirdi (canlıda boş yok → önleyici fix).
- **✅ ÇÖZÜLDÜ (190):** "benzer parça" mantık hatası kapatıldı. Veri-doğrulamalı (PROBE-1: et malzemeler arası birebir çakışıyor; OD nominal oynuyor). Commit `e93860f`.

## B9. Detay (ZONE 2)
- **Boru:** kesit SVG (iç içe daire, OD/ID/et callout; halka et/çap oranına göre ölçeklenir).
- **Fitting/flanş:** "şema yakında" + büyük parça ikonu (gerçek SVG şema yok → AÇIK İŞ).
- Ölçüler paneli + **FOTO/3D/DXF yer tutucu** (görsel yok → doldurulacak). `cizim_path` + `model_3d_path` kolonları DB'de hazır.

## B10. İki yüz (mimari ilke)
1. **Kullanıcı kütüphanesi** (bu sayfa): temiz boyutsal referans, sadece dolu veri, kalite gürültüsü YOK.
2. **Süper admin küratör görünümü** (`admin/kutuphane-detay.html` tohum): veri kalitesi (kaynak/sapma/doğrulandı), **eksik-veri kuyruğu** (cunife cap=0…), "önden ekle" planlaması. Kalite verisi iç bilgi.

## B11. Kapsam sınırları (AYRI modüller — kütüphane DEĞİL)
- **Malzeme modülü** (zengin, gezilebilir) — `malzeme_kataloglari` eksen; kütüphanede malzeme sadece facet.
- **Kimyasal·Malzeme Uyumluluk** (deniz suyu × CuNi = A, koşullu+gerekçeli) — üçüncü eksen, ileride. Doküman: `KIMYASAL-MALZEME-UYUM-FIKIR.md`. "Kolay ekran, zor veri."
- **Spek sistemi** (`tenant_spec_seti`+`spec_kural`) = proje konfigürasyonu, referans değil. Kapsam dışı.
- `malzeme_kataloglari` üçünün ortak zemini.

## B12. Geometri motoru bağı
`ares-boru-hesap.js` (deterministik, $0, endpoint yok) = AYRI gelecek iş (doküman: `VIZYON-GEOMETRI-MOTORU.md`). Kütüphane arama çubuğu ileride geometri/foto arama kancası için genişletilebilir; 3D placeholder motoru bekler.

## B13. Faz planı
| Faz | İçerik | Durum |
|---|---|---|
| 1 | Launchpad + adımlı seçim + tablo | ✅ 189 |
| 1.5 | Sabit detay + tablo + otomatik karşılaştırma | ✅ 189 |
| 2 | Çapraz-filtre açılır kutular + Excel kolon süz/sırala | ✅ 189 |
| 2.1 | Flanş tip etiketleri (anlam önde) + ikon eşleme + kozmetik | ✅ 189 |
| 3 | Karşılaştırma peer mantığı düzeltme (B8) | ✅ 190 |
| 4 | Fitting/flanş gerçek kesit-şema SVG seti (~15-20) + ikon güzelleştirme | ⏸ ertelendi (Cihat: program bitince) |
| 5 | Görsel/3D/DXF + foto-arama doldurma | ⏸ ertelendi |
| 6 | Geometri motoru entegrasyonu | ⬜ |

## B14. Açık UI / veri borçları (190 sonu)
- ✅ Karşılaştırma mantık hatası (B8) — **çözüldü 190**.
- **FK backfill (191'de YAPILDI — boru):** spool_detay matcher önce ekranda eşliyor, FK'yı DB'ye yazmıyordu (boru 67/2230). Sonuç: (a) modal standart gösteriyor ama tablo `geom_standart` boş → "—"; (b) süper admin "eksik" listesi FK-null → 30+ yanlış-pozitif. **191:** matcher Tier-0 grup ekseniyle düzeltildi (bkz. A9), aynı mantığın SQL aynasıyla boru FK backfill yapıldı (OD±1/et±0.06 + grup guard). 316L→`ASME-B36.19M`, St37→DIN/B36.10M/Ozel/EN — hepsi grup-tutarlı. **Kalan:** flanş + fitting FK backfill — bunlarda spool_detay'de runtime matcher YOK (flanş sadece dolu FK'yı okur, fitting hiç eşleştirmez) → %100 FK'ya bağımlı, grup-bilinçli backfill gerekiyor. Mevcut flanş/fitting FK'larında grup çelişkisi denetlendi → temiz.
- **Renkli durum noktası (görsel, backfill sonrası):** `#` kolonuna nokta (🔵 standart / 🟡 ara ölçü `malz-arasolc` / ⚪ kütüphanede yok `malz-tanimsiz`). Mevcut sol-kenar çizgisi tablo kenarıyla karışıyor. Mantık (3-dallı KARAR-86.A) duruyor, sadece çizgi→nokta. Satır tıklama + modal aynen kalır. Backfill sonrası yapılmalı (renkler değişecek).
- **Gerçekten eksik 9 boru ölçüsü:** PROBE'da kütüphanede karşılığı olmayanlar (60.3×4.5 paslanmaz, 65×2/125×2.5/200×3 1.4571 = EN ince-cidar paslanmaz, 48.3×4.5/6.3 St37, 139.7×4.5 St37). Standart mı ara ölçü mü ayrımı → JSON/süper-admin.
- **`boru_olculer` ASME çift-etiket (görsel birleştirme, ertelendi):** 43 grup, STD≡SCH40 / XS≡SCH80 gibi aynı et iki schedule adıyla. Veri DOĞRU (silinmez), arama iki adı da bulsun diye bilinçli. Tabloda "STD / 40" diye birleştirme = saf kozmetik, program bitince.
- İkon çizim kalitesi, boru dışı kesit, FOTO/3D/DXF, sayısal aralık süzgeci — Faz 4/5 ile ertelendi.

---

## Dosya & komut referansı
- **Sayfa:** `kutuphane.html` (tek dosya, app-shell). Faz 2 + tip etiketleri uygulanmış.
- **Erişim:** `uygulamalar.html` Kütüphane kartı aktif · `ares-layout.js` getActiveKey · `lang/{tr,en,ar}.json` nav_kutuphane + kt_*.
- **Süper admin tohum:** `admin/kutuphane-detay.html` (823 satır, light/admin tema — kesit+ölçü+medya deseni buradan devralındı).
- **Seed:** `node scripts/seed-from-json.mjs <dosya>` (dry-run) → `--yaz`.
- **Kırılım tazeleme sorgusu:**
  ```sql
  SELECT 'boru' t, COALESCE(standart,'?') s, malzeme_grubu m, COUNT(*) FROM boru_olculer WHERE tenant_id IS NULL GROUP BY 2,3
  UNION ALL SELECT 'fitting', standart, malzeme_grubu, COUNT(*) FROM fitting_olculer WHERE tenant_id IS NULL GROUP BY 2,3
  UNION ALL SELECT 'flansh', COALESCE(geometri_std,'?'), malzeme_grubu, COUNT(*) FROM flansh_olculer WHERE tenant_id IS NULL GROUP BY 2,3
  ORDER BY 1,3,2;
  ```
