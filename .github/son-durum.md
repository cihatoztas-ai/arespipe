# AresPipe — Son Durum

**Son güncelleme:** 27 Nisan 2026 Pazartesi, 35. oturum sonu

---

## 35. Oturumda Olanlar (özet)

**Tema:** ASME Lookup tam sistemi — İzometri Batch'in B1 önkoşulu (Karar 5 — A1)

**Tamamlananlar (5):**

1. ✅ **Veri toplama + çapraz doğrulama** — 4 malzeme için ASME/EEMUA standart tabloları toplandı.
   - Karbon: ASME B36.10M (Ferrobend resmi tablo) — 214 satır
   - Paslanmaz: ASME B36.19M (piping-world) — 70 satır
   - Alüminyum: B36.19M dimensions + 2.70 g/cm³ yoğunluk hesabı — 50 satır
   - Cunife: EEMUA-144 (16 bar + 20 bar rating) — 24 satır
   - **Toplam: 358 satır seed**

2. ✅ **Migration dosyası** — `35-oturum-asme-borular.sql` (523 satır)
   - 2 tablo: `asme_borular` (karbon+paslanmaz+alüm) + `cuni_borular` (cunife ayrı, EEMUA-144 farklı sistem)
   - RLS: public read (sektör ortak veri, gelecek hub için), super_admin write
   - CHECK constraint, UNIQUE index, COMMENT'ler
   - Spot check sorguları sonda (manuel doğrulama için)

3. ✅ **Helper modülü** — `js/ares-asme.js` (48 KB, 50/50 birim test başarılı)
   - Statik veri modülün içine gömülü, runtime'da DB'ye gitmiyor
   - API: `etKalinligi`, `disCap`, `icCap`, `agirlikKgM`, `boruAgirligiKg` (ana 3 malzeme)
   - CuNife için ayrı API (`cunifeEtKalinligi(dn, basinc_bar)` vb. — EEMUA-144 schedule kullanmıyor)
   - NPS↔DN dönüşümü, varsayılan schedule fallback, schedule normalize ("Sch 40"/"SCH40"/"40")
   - Malzeme normalize ("316L"→paslanmaz, "6061"→aluminyum, "cuni9010"→cunife)

4. ✅ **Birim test** — `tests/asme-lookup.test.js` (50/50 başarılı)
   - 4 malzeme için kritik DN+SCH kombinasyonları
   - Sektörel bilinen değerlerle karşılaştırma (DN100 SCH40 karbon → 6.02mm/16.08kg)
   - PAOR PDF varyantları test edildi ("Sch 40", whitespace, vb.)

5. ✅ **Veri üretici script** — `scripts/uret-asme-veri.py`
   - Aynı kaynaktan hem SQL hem JS üretir → drift önleme
   - Gelecekte tablo güncellenirse tek seferde her ikisi senkron yenilenir

**Mimari Kararlar (kod yazmadan alındı, 6 karar):**

- **K1 — 4 malzeme:** karbon + paslanmaz + alüminyum + cunife (Cihat onayı)
- **K2 — Tablo yapısı:** İki tablo (asme_borular + cuni_borular). CuNife şeması farklı (DN+basınç_rating, schedule yok), tek tabloda zorlama olur.
- **K3 — Ağırlık politikası:** Karbon/paslanmaz tablodan, alüm/cunife yoğunluktan (DB seed üretiminde, runtime hesap yok). Cihat'ın "ağırlıklar standartlardan çekilecek" kuralına uyum.
- **K4 — Schedule fallback:** DN ≤ 250 → '40', DN > 250 → 'STD'. Sektörel pratik.
- **K5 — Fitting/flanş:** 35'te yok. Pilot süresince manuel onaya gider (PAOR PDF'lerinde genelde yazılı). 37-38'de eklenir.
- **K6 — "Tek Kaynak İki Yüz" mimarisi:** DB tek kaynak. Hub canlı sorgu yapacak (yeni site açılınca), program statik JS okuyor (şimdi). Cihat'ın hub sorusu üzerine: "şimdilik veri katmanı, hub site açılınca eklenir."

**Yarım kalan / 36'ya devir:**

1. 🔴 **Canlı doğrulama** — 4 dosya hazır ama henüz GitHub'a yüklenmedi, Supabase'de migration çalıştırılmadı. Cihat moladan dönünce yapacak. **36. oturumun açılışı bunun kontrolü.**
2. 🟡 **db-backup saat kontrolü** — bugün 27 Nis sabah, hâlâ yapılmadı. `arespipe-backups` repo Commits sekmesi.
3. 🟡 **G-08 yaygınlaştırma** — 21 sayfa, devre_detay pattern hazır
4. 🟡 **Cihat'tan 2-3 örnek PAOR/AVEVA PDF** — 36-37 oturumlarında lazım

---

## ⚠ Aktif Borçlar — 36. Oturum Başında Dikkat

- 🔴 **35. oturum canlı doğrulama** — 4 dosya yükle, migration çalıştır, satır sayısı kontrolü (334 + 24), test 50/50, CI yeşil. **36'nın ilk işi.**
- 🔴 **36. oturum: İzometri Batch backend** — `api/izometri-oku.js` refactor + 502 fix + DB tabloları (`izometri_format_tanimlari`, `izometri_batch_kayitlari`) + Ekran 2 (manuel onay UI). Büyük oturum, belki 2'ye bölünür.
- 🟡 **db-backup saat kontrolü** — 27-30 Nis sabahları izlenecek
- 🟡 **G-08 yaygınlaştırma** — 21 sayfa, pattern hazır
- 🟡 **Vercel ignoreCommand fix** — `vercel.json`
- 🟡 **SBD-01 vs GitHub Issues kararı** — Cihat seçecek

**Önceki dönemlerden devreden:**
- 🟢 `sorgula.js` JWT-bazlı auth refactor (güvenlik açığı)
- 🟢 Audit Log pano sekmesi
- 🟢 Tablo Render Standardı (G-06)
- 🟢 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟢 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟢 G-05 CI lint kuralı
- 🟢 help.html
- 🟢 **G-09 — JS klasör refactor (35'te eklendi):** Tüm `ares-*.js` dosyaları kök dizinde. Sektörel standart `js/` klasörü altında olmaları. Yeni site açılınca uygun zaman olabilir (40+ ürün dönemi başlangıcı). Refactor sırasında: tüm HTML'lerin `<script src="...">` satırları + `admin/`, `portal/` alt-dizinlerin relative path'leri (`../js/...`) güncellenmeli. Risk: bir sayfada güncelleme atlanırsa sessiz bug. Süre: ~1-1.5 saat + test.

**Defter'deki açık SED maddeleri:**
- spool_detay: S3 (AI toolbar gizli — bilinçli), S4 (QR indirme yarım — bilinçli)
- D8 (spool_no formatı KK'da S01 tekrar) — defter
- devre_detay badge class temizleme bug pattern'i diğer sayfalarda taranacak (G-08 yaygınlaştırma sırasında)

---

## Plan / Roadmap

| Oturum | Tema | Durum |
|---|---|---|
| 30 | Bucket PRIVATE Faz 1-2 | ✅ |
| 31 | Bucket PRIVATE Faz 3-6 + SED başlangıç + G-08 envanter | ✅ |
| 32 | Defter temizliği — orphan, v5, S1, D5, D6 + D3/G-08 yarım | ✅ |
| 33 | Vercel-bağımsız işler: self-test, D7, db-backup defter, D4 | ✅ |
| 34 | CI fix + D3 + db-backup + G-08 (devre_detay) + İzometri Batch tasarım + Ekran 1 frontend | ✅ |
| **35** | **ASME Lookup tam sistemi (B1 önkoşulu)** | **✅ KOD HAZIR — Canlı doğrulama 36 açılışında** |
| **36** | **İzometri Batch: 35 doğrulama + DB tabloları + dispatcher + 502 fix + Ekran 2 (manuel onay)** | **Sırada** |
| 37 | İzometri Batch: Ekran 3 (Format Kaydet) — B Adımı + Excel upload | — |
| **38** | **İzometri Batch: C Adımı (görsel işaretleme) + genelleştirme + ZORUNLU SELF-TEST** | — |
| 39 | İzometri Batch: pilot AVEVA-PAOR canlıya + super_admin "AI API Kullanım" sekmesi | — |
| **Yeni site** | **ASME hub sayfası** (`tools/asme-lookup.html` halka açık, aynı DB'den canlı sorgu) | Site kurulduktan sonra |

**40+ ÜRÜN DÖNEMİ.**

---

### Cihat'ın 35'te Sorduğu Stratejik Soru

> "Şimdi biz bu program için yeni bir web sitesi açıp oradan giriş yaparak kullanacaz. Siteden ulaşılabilecek birkaç basit uygulama da düşünmüştük... biz bu iste içerisine standart malzeme tablolarını da yüklesek ve kullanıcılar için bunu da uygulamaya dahil etsek... bir faydası olur mu yoksa ben zaten uygun bir yerden çekerim mi diyorsun"

**Cevap özeti:** Evet, çok faydası var — ama doğru mimariyle. "Tek Kaynak İki Yüz" mimarisi: DB tek kaynak, hub canlı sorgu yapar (yeni site açılınca, halka açık + SEO + lead gen), program statik JS okur (şimdi, hızlı ve offline güvenli). Veri katmanı 35'te (bugün), hub UI yeni site açılınca eklenir. Bu yaklaşım `spool_usta.html` ve `spool_3d_montaj.html` ile birlikte sektörel hub'ın çekirdeğini oluşturur (SPOOL-AI-VIZYON.md Madde 14 — halka açık eğitim oyunu motoru).

**Cihat'ın kararı:** "Bu sayfayı biraz daha ileride yapmayı düşünmüştüm. Şimdi biz normal işimizi yapıyoruz, site kurulduktan sonra fittings'ler de ekleniyor." → 35'te SADECE veri katmanı, hub yazılmıyor. Fittings/flanş 37-38'e.
