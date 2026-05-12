# 77. Oturum — Kapanış (12 Mayıs 2026)

> **Tema:** B0 omurga (`malzeme_kataloglari`) + PN 10 paketi (omurganın ilk kullanımı)
> **Süre/Yoğunluk:** Yüksek — mimari karar + iki canlı migration + 7 MK kararı
> **Devir alındığı yer:** 76 (kütüphane yükleme, +25 satır, takip v3 senkron)

---

## Yapılanlar

### A) B0 — `malzeme_kataloglari` Omurgası (Migration 040)

Vizyon belgesinin "parça kimliği prensibi" (Bölüm 2.A) için ana tablo. Boru/fitting/flansh tabloları artık buraya FK ile bağlanır.

**Tablo yapısı:**
- `spec_standart` + `spec_grade` (örn `ASTM A106` + `B`) → generated `spec_kodu`
- `malzeme_grubu` (karbon/paslanmaz/duplex/cuni/alum/nikel/titan/diger) + `aile` (ASTM/EN/DIN/JIS/API/EEMUA/...)
- 4 uygunluk bool (boru/buttweld/forged/flansh) + **en az 1 true** constraint
- `yogunluk_kg_m3` NOT NULL (ağırlık hesabı kritik)
- Mukavemet + sıcaklık + korozyon JSONB (opsiyonel zenginleştirme)
- Multi-tenant: `tenant_id IS NULL` = sistem geneli

**Index'ler:** Partial UNIQUE (NULL-aware) sistem + tenant, grup aktif lookup, spec_kodu lookup

**RLS:** 4 policy — sistem okuma, tenant okuma, super_admin tüm, firma_admin kendi tenant

**FK eklendi:** `boru_olculer.malzeme_id`, `fitting_olculer.malzeme_id`, `flansh_olculer.malzeme_id` (`ozel_parcalar` tablosu yok, atlandı)

**P0 seed (10 spec):**
| spec_kodu | grup | yogunluk | uygunluk |
|---|---|---|---|
| ASTM A106 B | karbon | 7850 | boru |
| ASTM A53 B | karbon | 7850 | boru |
| ASTM A234 WPB | karbon | 7850 | fitting_buttweld |
| ASTM A105 | karbon | 7850 | forged + flansh |
| ASTM A312 TP316L | paslanmaz | 7980 | boru |
| ASTM A403 WP316L | paslanmaz | 7980 | fitting_buttweld |
| ASTM A182 F316L | paslanmaz | 7980 | forged + flansh |
| **ASTM B466 C70600** (CuNi 90/10) | cuni | 8940 | boru — 🔴 gemi kritik |
| **ASTM B466 C71500** (CuNi 70/30) | cuni | 8940 | boru |
| EN 10216-1 P235GH | karbon | 7850 | boru |

**Köprü doğrulandı:** `malzeme_standart_ipucu` (PDF parser pattern→standart) ↔ `malzeme_kataloglari` (standart→spec_id) JOIN testi 5/12 eşleşme (316L, A106, A53, P235GH, TP316L). Diğer 7 ipucu pattern'i (TP304L, TP321, 5083, P265GH, S235, ST37) katalog B1+ paketlerinde dolacak.

**İpucu format fix:** İki satırlık UPDATE — `A106 → ASTM A106 B`, `A53 → ASTM A53 B`. Köprü 3/12 → 5/12 eşleşmeye çıktı.

### B) PN 10 Paketi (Migration 042)

B0 omurgasının **ilk gerçek kullanımı** — yeni 16 satır `malzeme_id` A105 FK ile dolu doğdu.

| Tip | DN aralığı | Satır | Kaynak |
|---|---|---|---|
| EN-T11 (Weld Neck) | 200-600 | 8 | Wermac + ProjectMaterials çift kaynak |
| EN-T05 (Blind) | 200-600 | 8 | ProjectMaterials ana, Wermac T11 K cross-check DN 200-500 |
| **Toplam** | | **16** | |

**Kritik teknik gözlem:** DN 600 T05 b=34 ≠ T11 b=30 — standart bilgi, Blind full-face pressure aldığı için daha kalın. DN 200-500'de T05=T11.

**DN 600 T05 tek-kaynak notu:** Wermac PN 10 Blind sayfası yok. PM tek kaynak, JSONB notlar içinde `kaynak_crosscheck: "YOK"` ile audit trail bırakıldı.

**Genel kütüphane ilerlemesi (`flansh_olculer`):**
- 76 sonu: 276 satır
- 77 sonu: **292 satır** (B16.5: 216, EN-1092-1: 76 → PN 16: 60, PN 10: 16)

### C) Numara Çakışması Kazası (Ders Olarak Değerli)

Migration 041 önerdim → 76'da Cihat zaten 041 kullanmış (B36.19M DN 350-600 paketi). 040 slot'u boştu, B0 oraya gitti — sorun yok. Ama 041 PN 10 paketi yarattım, son anda yakalandı. Düzeltme: 042'ye taşındı.

**Çıkardığım ders → MK-77.3:** Yeni migration numarası önermeden önce **tam liste** istenir, sadece son commit mesajı yetmez.

---

## MK-77 Karar Kayıtları (7 adet)

**MK-77.1 — Kapanış protokolüne `CLAUDE-SONRAKI-OTURUM.md` yenileme zorunluluğu eklendi.**
76'da bu dosya unutulmuştu, 2. oturumdan kalma "MDrawer / Dil sistemi" gündemi 77'ye taşmıştı. Bundan sonra her oturum kapanışında bu dosya **mecburen** yenilenir. Sonraki oturum gündemi orada açık ve güncel olmalı.

**MK-77.2 — Format uyumu kontrolü: yeni katalog spec'i ↔ ipucu tablosu.**
`malzeme_standart_ipucu.tipik_malzeme_standardi` ile `malzeme_kataloglari.spec_kodu` birebir uyumlu yazılır. Yeni spec eklerken karşılaştırma sorgusu çalıştırılır:
```sql
SELECT i.kalite_kodu_pattern, i.tipik_malzeme_standardi, k.spec_kodu
FROM malzeme_standart_ipucu i
LEFT JOIN malzeme_kataloglari k ON k.spec_kodu = i.tipik_malzeme_standardi;
```
NULL kalan satırlar ya katalog eksiği (geç dolacak) ya format hatası (hemen düzeltilir).

**MK-77.3 — Migration numara disiplini.**
Yeni migration önermeden önce **tam liste** istenir:
```bash
ls ~/Desktop/arespipe/migrations/ | sort | tail -10
```
Atlanmış slot tespit edilirse nedeni dokümante edilir; rastgele atlamak yasak. Çakışma riski sıfıra indirilir.

**MK-77.4 — Bilinmeyen tabloya sorgu disiplini.**
Bilinmeyen veya yeni tabloya `SELECT *` veya `LIMIT N` dışı sorgu çekmeden önce şema bekle:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='X' ORDER BY ordinal_position;
```
Kolon adı tahminiyle hata harcamak yerine pre-flight şema kontrolü zorunlu.

**MK-77.5 — B0 sonrası `malzeme_id` zorunluluğu.**
Yeni eklenen her geometri satırı (`boru_olculer`, `fitting_olculer`, `flansh_olculer`) `malzeme_id` **dolu** doğar. NULL FK kabul edilmez. Mevcut NULL satırlar (276 PN 16 + 216 B16.5 + 450 boru + 424 fitting = 1.366 satır) toplu UPDATE ile dolacak (Borç-3, 4, 5).

**MK-77.6 — Tek-kaynak satırlarda audit trail.**
Bir satır çift kaynak doğrulamadan geçemiyorsa (örn. DN 600 T05), JSONB notlar içinde:
```json
"kaynak_geometri": "Kaynak adı (tek kaynak)",
"kaynak_crosscheck": "YOK — sebep",
"tek_kaynak_notu": "Post-validation Cihat onayı gerek"
```
Bu sayede ileride hangi satırlar tek-kaynaklı tespit edilebilir (`WHERE notlar->>'kaynak_crosscheck' = 'YOK'`).

**MK-77.7 — Direct-COMMIT workflow kabul.**
Cihat'ın workflow'u dry-run ROLLBACK adımını atlıyor. Migration BEGIN/COMMIT atomik olduğu için pratikte güvenli — kabul edildi. Disiplin: "dry-run zorunlu değil, ama **tek-atomik BEGIN/COMMIT migration zorunlu**". DDL + DML aynı transaction'da, hata olursa hiçbiri kalmaz.

**MK-77.8 — Migration dosya adı pattern.**
`^\d{3}_[a-z0-9_]+\.sql$` — 3 rakam + underscore + lowercase. **Tire (`-`) YASAK**. CI `[MIG_ISIM_BOZUK]` ile yakalar, deploy'u engeller. 76'da `dn350-600` tire içeriyordu, CI kırmızı verdi, 77 kapanışında rename ile düzeltildi.

---

## Açık Borçlar (78+ için)

| # | İş | Tahmini boyut | Notlar |
|---|---|---|---|
| Borç-1 | EN 1092-1 PN 10 DN 10-150 T05+T11 | ~24 satır | RoyMech BS4504_10 alternatif kaynak araştırması |
| Borç-2 | EN 1092-1 PN 10 T01 + T12 (tüm DN) | ~30 satır | Kaynak araştırması (DIN 2632 eski / EN 1092-1 PDF) |
| Borç-3 | PN 16 + PN 10 mevcut satırlar `malzeme_id` toplu UPDATE | 76 satır | A105 (T01/T05/T12) + A105 (T11) eşleştirme |
| Borç-4 | B16.5 216 satır `malzeme_id` toplu UPDATE | 216 satır | A105 (ASTM forged flansh için doğal) |
| Borç-5 | `boru_olculer` 450 + `fitting_olculer` 424 satır `malzeme_id` UPDATE | 874 satır | Spec başına UPDATE (A106/A53/A312/A234/A403 vs) |
| Borç-6 | EN 1092-1 PN 25 + PN 40 paketleri | ~120 satır | 79+ |
| Borç-7 | B16.9 eksik parça tipleri (90SR + 180LR/SR + tee_red + stub) | ~150 satır | 80+ |

---

## Strateji Özeti (Üzerinde Anlaşıldı)

**Parça kimliği prensibi artık canlı.** Yeni satırlar `malzeme_id` dolu doğar, mevcut satırlar borç olarak takip edilir, toplu UPDATE'lerle kapatılır.

**Çift-kaynak doğrulama disiplini.** Geometri tablolarına yeni satır eklenirken iki kaynaktan veri okunur, %100 tutarlılık olmazsa tek-kaynak notu JSONB'ye işlenir. Bu Cihat'ın 12. öğrenme prensibinin (halüsinasyon koruması) sistematik uygulanmasıdır.

**Kütüphane yükleme momentum'u kütle bazlı değil temel bazlı.** B0 omurgası 16 satır PN 10 paketinden daha değerli — çünkü 1.366 mevcut satırın FK ile bağlanmasının yolunu açtı. 77 satır sayısı olarak (16) mütevazi, mimari etki olarak büyük.

---

## Son Söz

77 bir geçiş oturumuydu: kütüphane yüklemenin "çiğ data" fazından "yapısal kimlik" fazına. B0 öncesi her satır izole, B0 sonrası her satır kataloglu. PN 10 paketinin 16 satırının her birinin `malzeme_id` ile dolu doğması — bu yapının somut kanıtı.

78'de borçların azaltılmasına başlanır. Toplu UPDATE'ler en hızlı %ilerleme sağlar (Borç-4: 216 B16.5 satırı tek UPDATE ile A105 FK alır).

İyi deploy'lar, iyi dinlenmeler. 🚀
