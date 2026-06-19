# CLAUDE — Son Oturum (192)

> **Tarih:** 19 Haziran 2026 · **Oturum:** 192
> Ana tema: **flanş + fitting FK backfill**. Boru'dan (191) farklı: bunlarda spool_detay'de runtime matcher YOK → tablo %100 FK'ya bağımlı. Grup-bilinçli birebir eşleştirmeyle dolduruldu. **Tamamen DB işi, kod commit'i yok.** Tam teknik kayıt: `docs/KUTUPHANE-DURUM.md` **A10** (bu oturumda eklendi).

---

## Yöntem (her ailede aynı ritim)
DATA→UI→kod (MK-158.1) · her adım `BEGIN/ROLLBACK` dry-run (MK-98.2) · sadece `IS NULL` doldur, mevcuda dokunma (MK-111.2) · grup-çelişki sayacı=0 teyit · sonra COMMIT. Kolon adı tahmin yok, `information_schema` (MK-85.3).

## Ne yapıldı (4 aile, +690 bağ)

### 1. ✅ Flanş FK backfill — +262 (467 toplam / 349 boş)
- **Hedef:** karbon EN-1092-1 (lib'de paslanmaz flanş YOK → paslanmaz scope dışı).
- **DN:** `boyut` kolonundan (`DN300`→300). `dis_cap_mm` GÜVENİLMEZ (karbon'da OD, paslanmaz'da DN, ANSI'de inç).
- **Tip haritası (notlar-teyitli):** Slip-On→**EN-T12** (Hubbed Slip-On; T01=Plate, Slip-On DEĞİL — spool "TYPE01" yazsa bile T12), WN→T11, Blind→T05 (hub+bore=0), Set-On→null.
- **PN (KARAR-1/A):** EN PN deseni DN-bağımlı (DN≤150 PN16, DN200/250 ikisi, DN300+ PN10). Spool PN o DN'de yoksa tek-PN'e düş. 258 exact + 4 fallback, 0 belirsizlik.

### 2. ✅ Elbow FK backfill — +358 (427 toplam / 1 boş)
- Hepsi 90° 1.5D → `90LR`(karbon/paslanmaz) / `elbow_90lr`(cunife). Lib'de paslanmaz 90LR VAR.
- **DN 3 yol:** `DN125` / `139.7x4.5`(OD→DN) / `4" Sch 10S`(NPS→DN, kesirli inç dahil).
- `dis_cap_mm` paslanmazda BOZUK (`4" → 4.00`) → sadece `boyut` string'inden türet.
- Schedule anahtarda değil (lib `schedule_deger=null`). 1D dirsek (1 satır) lib'de yok → **atlanmadı, seed sayıldı**.

### 3. ✅ Reducer FK backfill — +67
- Hepsi konsantrik → `reducer_conc`. Paslanmaz reducer lib'de YOK → seed (33). Hedef karbon.
- **Çift çap (sol=büyük, sağ=küçük):** `139.7x4.5 / 114.3x4.5` OD-çifti VEYA tanim'da `DN80XDN50` (boyut eksik vakası). Anahtar `cap_buyuk_dn + cap_kucuk_dn` ikisi de.

### 4. ✅ Tee FK backfill — +3 cunife
- **MK-192.1:** tip GEOMETRİDEN (`dn_b=dn_k→tee_eq`, else `tee_red`), tanim'dan DEĞİL (cunife tanim "reducing" demiyor ama 324x219 redüksiyonlu). Tanim'a güvenmek 324x219'u tee_eq'e yanlış bağlardı (dry-run yakaladı).
- Lib: tee_eq karbon+cunife, tee_red cunife. **karbon tee_red YOK, paslanmaz tee YOK** → karbon/paslanmaz tee tamamen seed. Sadece 3 cunife bağlandı.

## Yanlış-bağ önleme dersleri (192)
- **Grup çelişkisi LİTERAL `=` ile değil, GRUP EKSENİNDE denetlenir.** `karbon çelik`≠`karbon`, `bakir`≠`cunife` (literal) ama aynı grup → literal denetim yanlış-pozitif verir (A105 flanşı sahte alarm verdi, gerçekte doğruydu).
- **`tip='fitting'` çöp kutusu:** 2280'in ~660'ı gerçek parça. `~* '\mtee\M'` kelime-sınırı ŞART (`ILIKE '%tee%'` "S**tee**l"i yakalar → 848 sahte tee).
- **`dis_cap_mm` formata göre anlam değiştiriyor + bazen bozuk** → eşleştirmede asla kullanma, DN'i `boyut` string'inden parse et.

## Eksik-rapor (A10.6 — seed yol haritası, 192'nin en değerli çıktısı)
Backfill = ölçme aracı. Lib'de karşılığı olmayan parça sessizce atlanmaz, sayılır. Backfill toplamsal (`IS NULL`), kütüphane büyüyünce tekrar çalışır, eski bağ bozulmaz.
1. 🔴 Paslanmaz tee (~75) · 2. 🔴 Karbon tee_red (~21) · 3. 🟡 Paslanmaz reducer (33) · 4. 🟡 Paslanmaz flanş seti · 5. ⚪ 1D dirsek (1) · 6. 556 boru ölçüsü (devir).
**Scope-dışı (parça değil, seed edilemez):** butt-weld 644, imalat-detay 523, olet 194, bağlantı-elemanı 139, özel ürün.

## Commit'ler (192)
| Tür | İçerik |
|---|---|
| (DB) | flanş FK backfill — +262 COMMIT |
| (DB) | elbow FK backfill — +358 COMMIT |
| (DB) | reducer FK backfill — +67 COMMIT |
| (DB) | cunife tee FK backfill — +3 COMMIT |
| doc | handoff 3 + KUTUPHANE-DURUM A10/B14 `[skip ci]` |

**Kod commit'i YOK** — repo'ya gidecek JS/SQL dosyası üretilmedi.

## KARARLAR.md'ye eklenecek
**MK-192.1 — Tee eşit/redüksiyonlu ayrımı geometriden:** Tee'nin `tee_eq` mi `tee_red` mi olduğu `tanim` metnindeki kelimeden ("reducing") DEĞİL, iki çapın eşitliğinden türetilir (`cap_buyuk=cap_kucuk → eq`, değilse `red`). Tanim güvenilmez (cunife tee "reducing" demez ama çapları redüksiyonlu olabilir). Genel ilke: parça tip-alt-sınıfı yapısal ölçüden çıkarılabiliyorsa, serbest-metin etiketine güvenme.

**MK-192.2 — Backfill bir ölçme aracıdır:** FK backfill "bitirme işi" değil. Kütüphanede karşılığı olmayan spool parçası sessizce atlanmaz, **görünür eksik (seed adayı) olarak sayılır**. Backfill toplamsaldır (`IS NULL` doldurur, mevcudu ezmez) → kütüphane zenginleştikçe `IS NULL` ile tekrar çalıştırılır, eski doğru bağlar bozulmaz. "Önce kütüphaneyi tamamla" ile "önce bağla" yanlış ikilem; doğru döngü: bağla → eksiği ölç → o ölçüye göre seed → tekrar bağla.

**MK-192.3 — Grup çelişkisi grup ekseninde denetlenir:** Spool↔kütüphane grup tutarlılığı literal string eşitliğiyle (`sm.malzeme = f.malzeme_grubu`) denetlenmez — `karbon çelik`/`A105`→karbon, `bakir`→cunife gibi varyantlar yanlış-pozitif üretir. Denetim `_grupBelirle` ekseniyle normalize edilerek yapılır.
