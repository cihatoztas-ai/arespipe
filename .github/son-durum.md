# Son Durum — 91. Oturum (15 Mayıs 2026)

> Hedef: Plan A — Boru kütüphanesi UI temizliği. Ama "Generic UI yazmak" niyetiyle başlayan oturum, **DB mimari teşhis + kapsam revizyonu + 91 disiplin dersleri** ile sonlandı. UI işi 93+'ya ertelendi, çünkü altyapı yanlış kapsama oturmuş çıktı.

---

## Bu Oturumun Sonucu

**91 toparlama ile kapandı. Net kazançlar:**

1. Üretim sistemini sessizce kıran bir bug onarıldı (35 batch'lik kötü etki)
2. Kütüphane kapsamı yeniden tasarlandı (6 standart aile + 23 fitting + 11 flanş)
3. DB mimari çelişkileri tespit edildi, Migration 066 yazıldı
4. Migration disiplinine yeni kural eklendi (91 dersi)
5. 3 kütüphane belgesi yenilendi (KAPSAM v3, YUKLEME-TAKIP v3, MIGRATION-YOL-HARITASI v2 — yeni belge)

### Yapılanlar

1. **`.bak90*` 6 yedek dosya silindi** — 90'dan kalan kütüphane çalışmasının artıkları temizlendi

2. **Migration 065 — Ölü tablo temizliği + endustri_* geri taşıma**
   - `malzeme_standart_ipucu` DROP (18 satır, 0 kod referansı — gerçek ölü tablo)
   - `endustri_malzemeler` + `endustri_form_astm` `arsiv` → `public` geri taşındı
   - **Kritik üretim bug onarımı:** `api/izometri-oku.js` → `malzemeTaninir()` bu tablolara sorgu atıyor. Tablolar bilinmeyen bir zamanda arşivlenmiş, 35 izometri batch boyunca **her spool sessizce "malzeme bilinmeyen" işaretlemiş** (catch block hatayı yutuyordu)
   - **Disiplin ihlali:** Bu migration SQL Editor'da çalıştırıldı, dosyası retroaktif yazıldı (`migrations/065_*.sql`). README.md'nin koyduğu "önce dosya, sonra çalıştırma" kuralı ihlal edildi. **91'in en büyük dersi.**

3. **Migration 066 — fitting_malzeme_uyum tam onarım (yazıldı, 92'de çalışacak)**
   - Tabloda 1 test satırı var, FK'lar iki yanlış tabloya bağlı
   - `fitting_id` → `flansh_olculer` (yanlış, doğrusu `fitting_olculer`)
   - `malzeme_id` → `malzeme_tanimlari` (yanlış, doğrusu `malzeme_kataloglari`)
   - PK eksik
   - Migration disiplinine uyularak **önce dosya yazıldı**, 92'de SQL editor'da çalıştırılacak

4. **KUTUPHANE-KAPSAM.md v3** — kapsamlı revize
   - 3 standart aile → 6 aile (GOST/JIS/GB/T eklendi — gemi tersanesi gerçeği)
   - 11 fitting tipi → 23 tip (manşon, olet, nipel, bilezik tipleri eklendi)
   - 6 flanş tipi → 11 tip (RTJ, Reducing, Spectacle, Orifice, DSAF eklendi)
   - DSAF = Double Studded Adapter Flange, sahada "Dublin flanş" jargon olarak
   - `ozel_parcalar` ayrı tablo iptal → `sistem_preset = false` bayrak yaklaşımı (aynı tablo, farklı kategori)
   - **3 katman mimarisi** netleşti: Kütüphane (`malzeme_kataloglari`, geometri tabloları) vs AI Parser Sözlüğü (`endustri_*`) vs Runtime (`malzeme_tanimlari`)
   - "İskelet + organik içerik" yaklaşımı yazıldı
   - 12.000 satır hedef tahminleri kaldırıldı (organik büyüme felsefesine ters)

5. **KUTUPHANE-YUKLEME-TAKIP.md v3** — canlı durum revize
   - 6 standart aile için durum (GOST/JIS/GB/T iskelet boş)
   - 23 fitting tipi tek tek + mevcut/öncelik
   - 11 flanş tipi B16.5 sınıf × tip matris
   - Çapraz uyum 3 tablo (boru/fitting/flansh)
   - Mevcut sayılar güncel: malzeme 20, boru 450, fitting 569, flansh 308

6. **MIGRATION-YOL-HARITASI.md v2 (yeni belge)**
   - Migration tablosu (065'ten 071'e plan)
   - 91'de yapılanlar dokümante
   - 92+ için planlı işler
   - Migration disiplin kuralları (7 madde)
   - "Önce dosya, sonra çalıştırma" 91 dersi yazılı

7. **Veri keşifleri (91 boyunca)**
   - 4 ayrı malzeme tablosu var (malzeme_kataloglari, malzeme_tanimlari, endustri_malzemeler, endustri_form_astm) — her birinin amacı farklı
   - `malzeme_standart_ipucu` ölü, silindi
   - `fitting_malzeme_uyum` tablosunda FK bugları (Migration 066'da onarılacak)
   - `tenant_spec_seti` + `spec_kural` tabloları var ama boş (ikinci tersane geldiğinde aktive)

---

## CI Son Durum

- **Build:** ✅ YEŞİL
- **Vercel:** Production = 90 sonu (henüz 91 commit'i yok)
- **Son commit (push'tan önce):** `0f5c26e chore(ci): ci-son-rapor.json güncelle [skip ci]`

---

## DB Değişiklikleri

**91'de canlıda yapılan:**
```sql
DROP TABLE IF EXISTS malzeme_standart_ipucu;
ALTER TABLE arsiv.endustri_malzemeler SET SCHEMA public;
ALTER TABLE arsiv.endustri_form_astm SET SCHEMA public;
```

Bu değişikliklerin retroaktif dosyası: `migrations/065_olu_tablo_temizligi_ve_endustri_geri_tasima.sql`

**91'de yazılan ama 92'de çalışacak:**
- Migration 066: `fitting_malzeme_uyum` tam onarım (test satırı sil + FK fix + PK ekle)

---

## 92'ye Açık Borç (önceliğe göre)

1. **Migration 066'yı canlıda çalıştır** (~10 dk)
   - `migrations/066_fitting_malzeme_uyum_onarim.sql` Supabase SQL editor'da çalıştır
   - Doğrulama sorgusu (FK'lar + PK)
   - Sonuç başarılıysa belgede 📝 → ✅

2. **Migration 067 yaz + çalıştır** (~45 dk)
   - `boru_malzeme_uyum` + `flansh_malzeme_uyum` CREATE
   - RLS policy'leri (mevcut `fitting_malzeme_uyum` policy'lerini örnek al)
   - Cihat ile RLS pattern doğrulanmalı

3. **Plan A'dan kalan küçük borçlar** (~45 dk)
   - `kutuphane-oneriler` 2 vs ana sayfa "1 bekliyor" tutarsızlığı (15 dk metin fix)
   - `ozel_parca_boru_kaydet` RPC dokümantasyon kararı (15 dk)
   - `kutuphane.html` 3 broken link temizliği — generic UI'a kadar minimum fix (15 dk)

4. **Generic UI altyapısı planlama** (93'e taşınabilir)
   - `kutuphane-tablo.html` (tek sayfa, URL parametresi)
   - Konfig dosyası tasarımı (4 onaylı karar: A-C-C-B)
   - 91'de mimari kararlar onaylandı ama yazım yapılmadı

---

## Kararlar (91'de Alınanlar)

| # | Karar |
|---|---|
| **KARAR-91.A** | 3 katman mimarisi: Kütüphane vs AI Parser Sözlüğü vs Runtime — ayrı tut, "lazımsa kalsın" (Cihat) |
| **KARAR-91.B** | Özel parça için ayrı tablo YOK, `sistem_preset = false` bayrak yaklaşımı (KARAR-90.D ile uyumlu) |
| **KARAR-91.C** | Standart aileleri 6'ya çıkarıldı: ASME/EN/DIN/GOST/JIS/GB/T — iskelet hazır, içerik organik dolar |
| **KARAR-91.D** | Fitting tip evreni 23 tip — AVEVA-vari sektör listesi referans alındı |
| **KARAR-91.E** | DSAF (Dublin flanş) 11. flanş tipi — sahada "Dublin", standart adı DSAF — kütüphane standart adıyla, saha jargon parser sözlüğünde |
| **KARAR-91.F** | Generic UI altyapısı kararları onaylandı (A-C-C-B), yazım 93+'a |
| **KARAR-91.G** | Migration disiplini — **önce dosya, sonra çalıştırma** (91'in kural ihlali tekrarlanmasın) |
| **KARAR-91.H** | KUTUPHANE-FELSEFE.md ayrı belgesi iptal — içerik KUTUPHANE-KAPSAM.md'ye taşındı |

---

## 91'in Dersleri

1. **"Süper Admin'de görünmüyor diye tablo silmek tehlikeli."** `endustri_*` tablolarının sessiz kırığı (35 batch). Kanıt: `grep -rn` + log kontrolü zorunlu.

2. **Migration dosyası önce, çalıştırma sonra.** README.md'nin koyduğu kural ihlal edildi (065 retroaktif yazıldı). Bir daha olmayacak.

3. **"Felsefe" kelimesi belgelerde abartı.** Cihat'ın "atlas okyanusu" benzetmesi "tasarım yaklaşımı" olarak yeniden adlandırıldı, doctrine'leştirilmedi.

4. **"Aynı oturuma çok iş sığdırmak" karşı dürüstçe geri çekilme.** Plan A → kapsam revizyonu → DB mimari teşhis → migration disiplini, dört kez yön değişti. Her seferinde Cihat doğru sorular sordu, oturum yeniden konumlandı.

5. **Veri-tabanlı karar > sezgi-tabanlı karar.** "Tablolar silelim" sezgisi başlangıçta vardı, ama her tablonun gerçek kullanımı (grep + FK haritası + sample veri) açığa çıktıkça karar değişti. Şu an net: sadece 1 ölü tablo silindi, diğerleri korundu.

---

## Commit'ler

| Dosya | Niye | Tip |
|------|------|---|
| `migrations/065_olu_tablo_temizligi_ve_endustri_geri_tasima.sql` | 91'de yapılan değişikliklerin retroaktif kaydı | feat |
| `migrations/066_fitting_malzeme_uyum_onarim.sql` | 92'de çalışacak migration, dosya önce | feat |
| `docs/KUTUPHANE-KAPSAM.md` | v2 → v3 (kapsam revizyonu) | docs |
| `docs/KUTUPHANE-YUKLEME-TAKIP.md` | v2 → v3 (canlı durum revize) | docs |
| `docs/MIGRATION-YOL-HARITASI.md` | yeni belge | docs |
| `.github/son-durum.md` | 91 sonu | docs |
| `CLAUDE-SON-OTURUM.md` | 91 detay özet | docs |
| `CLAUDE-SONRAKI-OTURUM.md` | 92 gündemi | docs |

CI: ✅ YEŞİL (her commit sonrası otomatik ci-son-rapor.json güncellemesi)

---

## Performans Notları

- **Üretim onarımı (Migration 065):** 35 batch'lik sessiz kırığı temizlendi — ölçülemez ama büyük etki
- **Belge revizyonu:** 3 belge yazıldı, ~1500 satır markdown
- **Mimari kararlar:** 8 KARAR-91.X (yukarıdaki tabloda)
- **DB değişiklikleri:** 1 tablo silindi, 2 tablo schema değişti, 1 migration yazıldı
- **Oturum uzunluğu:** Uzun (8+ saat eşdeğeri) — Cihat yorgun, devam riskli, kapanış doğru karar

---

> 92. oturum açılışında bu dosya, `docs/PROJE-HARITASI.md`, `docs/CLAUDE-CALISMA-MODU.md`, `docs/SPOOL-AI-VIZYON.md` ve `CLAUDE-SONRAKI-OTURUM.md` okunacak.
