# AresPipe — Kütüphane Durum, Takip & Yöntem

> **Bu belge `docs/KUTUPHANE-YUKLEME-TAKIP.md`'yi (43. oturum, BAYAT) EMEKLİYE AYIRIR.**
> Eski belge `fitting_olculer = 0` diyordu; gerçek **897 → 935** (178). Eskiyi arşive al/sil, canlı referans budur.
> **Kapsam belgesi** `docs/KUTUPHANE-KAPSAM.md` hâlâ geçerli (neyi yapacağız). Bu belge: neresini yaptık + nasıl + sıradaki.
>
> Son güncelleme: **Oturum 178 (Haziran 2026)**
> Granül sayım kaynağı: fitting_olculer = bu oturum DB GROUP BY (birebir). boru/flanş = totaller bilinir, standart-kırılımı **sonraki oturum tazelenecek** (§9'daki sorgu).

---

## 1. Özet (modül seviyesi)

| Modül | Beklenen (kapsam tavanı) | Canlıda (178) | Durum |
|---|---:|---:|---|
| `malzeme_kataloglari` | ~120 spec | 20 | başlangıç |
| `boru_olculer` | ~280 | ~547 (karbon 297 / pasl. 132 / alм. 50 / cuni 68) | iyi |
| `fitting_olculer` | ~2.500 | **935** (cuni 328 / karbon 569 / **pasl. 38**) | büyüyor |
| `flansh_olculer` | ~800 | ~356 (cuni 48 / karbon 308) | orta |
| `fitting_malzeme_uyum` | ~8.000 | 0 | script-üretimi (sonra) |
| `ozel_parcalar` | 200-500 | 0 | pilot ile organik |
| `tenant_spec_seti` + `spec_kural` | ~500-1.000 | 0 | 2. tersane gelince |

> Tavan = kapsam üst sınırı; %100 hedef değil, ihtiyaca göre uzun kuyruk eklenir.

---

## 2. Öncelik mantığı (gemi tersanesi — Cihat'ın işi)

| Öncelik | Açıklama | Örnek |
|---|---|---|
| **P0** 🔴 | Her gemi spool'unda kritik | A105 WN/SO 150-300, **CuNi B466/B467 (deniz suyu)**, B16.9 90LR+Tee+Reducer DN50-200, B36.10 Sch40, **paslanmaz A403/A312 316L** |
| **P1** 🟠 | Sık görülen | F316L 150-300, A234 WPB, B16.11 socket, A335 P11/P22 |
| **P2** 🟡 | Belirli projelerde | Class 600+, F11/F22, Duplex 2205/2507, Alüminyum 5083 |
| **P3** ⚪ | Özel proje gelirse | Nikel (Inconel/Hastelloy), Class 2500 |

---

## 3. Yöntem (atölye / referans-çekme akışı)

Kütüphane gruplara ayrılmış listeyle (öncelik sırası), parça tipi tipi doldurulur:

1. **Sıradaki grubu DB'den belirle** — bu belgeye/eski belgeye değil, `GROUP BY standart, malzeme_grubu, parca_tipi` sorgusuna bak (belge bayatlayabilir).
2. **Referans katalogtan çek** (Claude yapar; kullanıcı dosya yüklemez) — ölçü + ağırlık.
3. **≥2 bağımsız kaynak çapraz-doğrula** (MK-96). Aykırı kaynağı ele (örn. ZIZI karbon-bazı çizelge → elendi).
4. **JSON üret** — `fitting_olculer` şemasına birebir; `notlar` nested obje (seed stringify eder); her satır `kaynak` + `dogrulandi` + `_db_aksiyonu`.
5. **Doğrula** — JSON geçerlilik + fiziksel monotonluk + 5-satır kaynak spot-check (kullanıcı).
6. **Seed** — `node scripts/seed-from-json.mjs <dosya> ` (dry-run) → `--yaz` → `SELECT COUNT(*)` teyit.

---

## 4. KURALLAR (sert — istisna yok)

- **%100 referanstan.** Türetme / yoğunluk-faktörü / formül-hesabı YASAK (ağırlık dahil). Karbon-bazlı ağırlık paslanmaz için kabul DEĞİL.
- **Ağırlık atlanmaz.** Bir kaynakta yoksa başka referanstan çekilir.
- **Doğrulama zorunlu.** Tablo ≥2. bağımsız kaynakla teyit. `notlar`'a `kaynak` + `sapma_pct` + `dogrulandi`.
- **Ölçü malzemeden bağımsız** (B16.9/MSS-SP-43) — yine de mevcut DB geometrisiyle teyit, körü körüne kopyalama yok.
- **Veri silinmez.** Şüpheli satır `_db_aksiyonu: FLAG_SUPHELI` → yazılmaz, 2. kaynak gelince çözülür.
- **Sistem preset**: `tenant_id IS NULL`, `sistem_preset: true`.

---

## 5. Kaynak Hiyerarşisi (kanıtlanmış)

| Malzeme | Birincil | Doğrulama | Otorite/3. |
|---|---|---|---|
| paslanmaz fitting | dynamicforge A403/A815 çizelge | buyfittingsonline (gerçek SS ürün kg) | Sandvik/Alleima (5S–Sch160, 304/316+dupleks) |
| cunife | KME OSNA-10/30 (doc 1220.000.0508) | Wieland Eucaro | Stirlings |
| paslanmaz boru | Sandvik (B36.19M) | — | — |
| karbon fitting (mevcut) | Wermac / Bonney Forge | pipingpipeline (kısmi) | — |

---

## 6. TAKİP ÇİZELGELERİ (parça tipi bazında)

Statü: ✅ DB'de · 🟡 178'de seed'lendi · ⏳ veri elimde, JSON bekliyor · ❌ eksik · ⬜ kapsamda, başlanmadı

### 6.1 `malzeme_kataloglari` (7 grup, ~120 spec) — 20/120 yüklü
| Grup | Örnek spec | Öncelik | Durum |
|---|---|---|---|
| Karbon çelik | A106, A53, A234 WPB, A105, EN 10216/10253 | P0/P1 | ⬜ kısmi (20 satır toplam, spec-kırılımı teyit gerek) |
| Paslanmaz (austenitik) | A312, A403, A182 F316/L, EN 10216-5 | P0 | ⬜ kısmi |
| Duplex/Super | A790, A815, A182 F51/53/55 | P2 | ⬜ |
| **CuNi** (deniz suyu) | B466/B467, DIN 86019, B151 | **P0** | ⬜ kısmi |
| Alüminyum | B241 5083/5086, B361 | P2 | ⬜ |
| Alaşımlı | A335 P11/P22, A234 WP11/22 | P1 | ⬜ |
| Nikel | B161/167/423/729 (Inconel/Hastelloy) | P3 | ⬜ |
> İş: 20 satırın hangi spec'ler olduğunu DB'den çıkar, bu çizelgeye işle.

### 6.2 `boru_olculer` (~547 satır) — standart kırılımı SONRAKI OTURUM tazelenecek
| Standart | Malzeme | Öncelik | Durum (total bilinir, kırılım teyit) |
|---|---|---|---|
| ASME B36.10M | karbon/alaşım | P0 | ✅ (karbon 297 içinde) |
| ASME B36.19M | paslanmaz | P0 | ✅ paslanmaz 132 (Sandvik +52, 177) |
| EN 10216-1 | karbon dikişsiz | P0 | ✅ kısmi |
| EN 10216-5 | paslanmaz | P1 | ⬜/kısmi |
| DIN 2448 | karbon | P0 | ✅ kısmi |
| DIN 86019 | **cunife** | **P0** | ✅ cunife 68 |
| EN 10220 | EN altyapı | P2 | ⬜ |
> Toplam: karbon 297 / paslanmaz 132 / alüminyum 50 / cunife 68. Standart×schedule kırılımı §9 sorgusuyla doldurulacak.

### 6.3 `fitting_olculer` (935 satır) — DB GROUP BY birebir (178)
**cunife — 328 ✅**
| Standart | Parça | Satır | Durum |
|---|---|---:|---|
| DIN-86088 | tee_eq | 19 | ✅ |
| DIN-86088 | tee_red | 63 | ✅ |
| DIN-86089 | reducer_conc | 79 | ✅ |
| DIN-86089 | reducer_ecc | 79 | ✅ |
| DIN-86090 | elbow_45lr / 45sr / 90lr / 90sr | 23/21/23/21 | ✅ |
| (cunife) | **cap** | 0 | ❌ eksik |

**karbon — 569 ✅**
| Standart | Parça | Satır | Durum |
|---|---|---:|---|
| ASME-B16.9 | 45LR / 45_3D / 90LR / 90_3D | 33/32/33/32 | ✅ |
| ASME-B16.9 | cap | 33 | ✅ |
| ASME-B16.9 | reducer_conc / reducer_ecc | 114/114 | ✅ |
| ASME-B16.9 | stub_end | 40 | ✅ |
| ASME-B16.9 | tee_eq | 33 | ✅ |
| ASME-B16.9 | 90SR | 0 | ❌ (B16.28 short radius — eksik) |
| ASME-B16.11 | 45SW/90SW/cap_sw/coupling_full/coupling_half/cross_sw/tee_eq_sw | 15 ×7 | ✅ |

**paslanmaz — 38 (178'de seed)**
| Standart | Parça | Satır | Durum |
|---|---|---:|---|
| ASME-B16.9 | 90LR | 19 | 🟡 seed 178 (DN90 FLAG_SUPHELI hariç) |
| ASME-B16.9 | 45LR | 19 | 🟡 seed 178 |
| ASME-B16.9 | 90SR | — | ⏳ veri elimde (dynamicforge) |
| ASME-B16.9 | tee_eq | — | ⏳ veri elimde |
| ASME-B16.9 | reducer_conc | — | ⏳ veri elimde (kısmi) |
| ASME-B16.9 | reducer_ecc | — | ⬜ ek çekim |
| ASME-B16.9 | cap (end cap) | — | ⏳ veri elimde |
| ASME-B16.9 | stub_end | — | ⬜ ek çekim |
| ASME-B16.11 | socket (45/90/tee/coupling/cap/cross) | — | ❌ ek çekim gerek |

**paslanmaz B16.9 90LR — schedule × DN doluluk (179'da kontrol için)**
DN15-300: 10S/40S/80S/160 · DN350-400: 10S/STD · DN450-600: 10S · DN90 FLAG (2. kaynak bekliyor).

### 6.4 `flansh_olculer` (~356) — kırılım SONRAKI OTURUM tazelenecek
| Standart | Tip | Öncelik | Durum |
|---|---|---|---|
| ASME B16.5 | WN/SO/SW/BL/LJ/TH × Class 150-2500 | P0/P1 | ✅ karbon 308 içinde (kırılım teyit) |
| ASME B16.47 | büyük çap | P2 | ⬜ |
| EN 1092-1 | DIN/EN flanş | P1 | ⬜/kısmi |
| DIN 86087 | **cunife flanş** | **P0** | ✅ cunife 48 (kısmi olabilir) |
| DIN 86088 | cunife büyük çap | P1 | ⬜ |
> Not: "DIN 86087 saddle/cap" (177 handoff) aslında cunife FLANŞ — bu tabloya ait, fitting değil.

### 6.5 Büyük modüller
| Modül | Durum | Tetik |
|---|---|---|
| `fitting_malzeme_uyum` (~8.000) | ❌ 0 | pipeline kurulunca script-üretimi (geometri × malzeme çarpımı) |
| `ozel_parcalar` | ❌ 0 | pilot ilk spool'da "kütüphaneye ekle" akışı |
| `tenant_spec_seti` + `spec_kural` | ❌ 0 | 2. tersane sözleşmesi |

---

## 7. Seed Kapısı (AÇILDI — MK-178.2)

`fitting_olculer` artık unique constraint'e sahip:
`fitting_olculer_dogal_uk` = **UNIQUE NULLS NOT DISTINCT** `(standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn, schedule_kod, class_no)`.
`scripts/seed-from-json.mjs` fitting'e uyarlandı (UNIQUE_KEY 7-alan, `notlar` stringify, `YENI`/`FLAG_SUPHELI`).
Seed: `node scripts/seed-from-json.mjs <dosya>` (dry-run) → `--yaz`.
> `flansh_olculer` için unique constraint HENÜZ yok — flanşa geçince aynı dry-run prosedürü (MK-98.2).

---

## 8. Açık Teknik Borç / Quirk

- **`yaricap_mm` tutarsızlığı:** karbon 1.5×OD (DN100=171.4, muhtemel hata); paslanmaz 1.5×NPS (doğru). Okuma kodu (devre_detay / 3D MK-49.A) görülünce hizalanacak.
- **45° uç-uca alanı:** karbon `ucu_uca_b_mm`; şema yorumu `ucu_uca_c_mm`. Paslanmaz uyumluluk için `b` kullandı. Okuma kodu teyidi sonrası hepsi hizalanır.
- **`standart` vs `geometri_std`** ikiliği — kod hangisini otorite alıyor netleşmeli.
- **paslanmaz 45LR + ≥DN300 90LR** tek-kaynak (dynamicforge); 2. kaynak nokta-kontrolü (DN50/100) önerilir.

---

## 9. Sıradaki Sıra

1. **Paslanmaz B16.9 devamı:** 90SR → end cap → reducer (conc+ecc) → tee_eq → stub_end. (Veri büyük kısmı dynamicforge çekiminde elimde.)
2. **Paslanmaz B16.11 socket** (ek çekim).
3. **45LR / büyük DN 2. kaynak teyidi.**
4. **cunife cap** + **DIN flanş eksikleri** (P0 boşluklar).
5. **boru/flanş kırılım tazeleme** — şu sorguyla bu belgeyi güncelle:
   ```sql
   SELECT 'boru' t, COALESCE(standart,'?') s, malzeme_grubu m, COUNT(*) FROM boru_olculer GROUP BY 2,3
   UNION ALL
   SELECT 'flansh', COALESCE(geometri_std,'?'), malzeme_grubu, COUNT(*) FROM flansh_olculer GROUP BY 2,3
   ORDER BY 1,3,2;
   ```
6. quirk temizliği (§8) — okuma kodu görülünce tek seferde.
