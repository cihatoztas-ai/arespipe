# Cihat Hakkında — Claude İçin Not

> **Bu dosya kişisel bir nottur.** Sadece Claude'un seni tanıması ve her oturumda seni baştan anlamak zorunda kalmaması için var. Herkesle paylaşılmak üzere değil.
>
> Yaşayan bir not — Cihat "şunu ekle" dediğinde Claude günceller.

---

## Özet

Cihat AresPipe'ın sahibi ve tek geliştiricisi. Yazılımcı değil — projeyi kurmaya, büyütmeye, yönetmeye odaklanıyor; teknik işi Claude'la birlikte yapıyor. Bir tersane sorununu çözen gerçek bir ürün çıkarıyor: boru imalat takip sistemi. Uzun vadede SaaS olarak satacak, şu an temel kurgusu oturuyor.

---

## Nasıl Çalışıyoruz

- **Ben kodu yazarım, Cihat gözden geçirir + GitHub'a yükler.** Akış GitHub web arayüzü üzerinden — sürükle-bırak, "Commit changes" tık.
- **Terminal komutları birer birer, açıklamalı.** Üst üste yığılınca gözden kaçıyor. Sıralı ve neden çalıştığı yanında yazılı olsun.
- **"Şunu şuraya push et, oradan sorgula" tarzı çoklu komut zincirlerinden uzak dur.** Yerine: "İşte dosya, GitHub'a yükle, yüklediğini söyle, ben devamını söyleyeceğim" gibi adım adım.
- **Büyük değişikliklerde patch yerine tam dosya ver.** "Şu satırı değiştir" yerine "işte tam CLAUDE.md, üstüne yaz". Uygulama kolay, hata riski az.

---

## Neye Tahammülü Az

- Uzun teknik açıklamalar arasında sıkışmış "yap" talimatı (talimatı bulamıyor)
- Aynı anda 3+ şeyi sorgulamak (hangi cevabı hangiye? kafası karışıyor)
- Belirsizlik — "şu ihtimal olabilir, bu da olabilir, bak gör" tarzı. Net karar, net yön tercih ediyor.
- İlerleme olmadan geçen zaman. 10 günlük ileri-geri çalışma onu çok yordu.

---

## Neyi Seviyor

- Somut ilerleme. "Şunu yaptık, şu hazır, şimdi buna geçiyoruz" tipi geri bildirim.
- Görsel karşılaştırma. "A yoksa B mi?" metni yerine iki tasarımı yan yana gösteren mockup.
- Dürüstlük. "Bilmiyorum", "hata yaptım", "riskli olabilir" — örtmek yerine söylemek.
- Kendi kararını verme alanı. Çoktan seçmeli, net seçenekli sorular.
- **Stratejik soru sorma alışkanlığı** (36'da pekişti) — "bu can damarı olacak, eksik var mı?" gibi sorularla mimariye yön veriyor. Bunu cesaretlendir.

---

## Stratejik Karakter

Cihat hızlanmayı bırakıp **doğru kurmayı** istiyor. 36'da en kritik müdahale: standart sistemi için 8 madde tespit ettiğimde "evet 8 maddeyi de içersin" demesi. İlk SQL'im 6 alan eksikti — bunu kabul etmedi, sağlam yapıyı seçti.

**Pattern:** Cihat sezgisel olarak yapısal sorunları görür ama teknik dili bilmediği için "eksik var mı?" gibi açık uçlu soru sorar. Bu sorulara **dolu cevap ver** — listele, açıkla, karar sorusu sor. Atlama, "yeter" deme.

---

## Şu An Projede Durum (Nisan 2026)

**Oturumlar:** 36 oturum tamamlandı. Web tarafı oturmuş — 40 HTML sayfa, multi-tenant, yetki sistemi, Supabase + Vercel.

**Yarım Kalanlar:**
- Operasyon sayfaları (kesim, büküm, markalama, KK, sevkiyat) %80-90'da duruyor
- Mobil React uygulaması %5'te kaldı
- Proje listesi + detay sayfası hâlâ Supabase'e bağlanmadı

**Aktif İş:**
- 35'te ASME Lookup tam sistemi kuruldu (4 dosya, 358 ölçü kaydı)
- 36'da boru standart sistemi 8 maddeli sağlam mimariye geçirildi (3 yeni tablo) + İzometri Batch DB altyapısı kuruldu (3 yeni tablo)
- 37'de İzometri Batch backend (yeni `izometri-oku.js` sıfırdan) + Ekran 2 (manuel onay UI) + Ekran 1 demo kapatma

**Uzun Vade Vizyon:**
- Spool AI (izometri okuma AI'ı, parça kütüphanesi, 3D montaj, eğitim döngüsü)
- Çok-standartlı boru hub'ı (yeni site açılınca, halka açık + SEO + lead gen)
- Detay: `docs/SPOOL-AI-VIZYON.md`

---

## Kod Konvansiyonu (36'da öğrenildi)

Cihat'ın kendi DB tabloları belirli bir pattern'e uyuyor. **Yeni tablo açmadan önce mevcut tabloları kontrol et:**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'mevcut_tablo' ORDER BY ordinal_position;
```

### Kolon Adları

- **Türkçe-İngilizce karışık:** `dis_cap_mm`, `et_mm`, `agirlik_kg_m`, `ic_cap_mm`, `malzeme`, `kalite_kodu`, `alasim`, `kategori_kod`
- **NOT** `od_mm`, `wall_mm`, `weight_kg_m` — bu yanlış (ben 36'da bu hatayı yaptım, fark ettik düzelttik)

### Timestamp Kolonları

- **`_at` suffix'li** — `olusturma_at`, `guncelleme_at`, `son_kullanim_at`, `bitis_at`, `baslangic_at`
- **NOT** sadece `olusturma`, `guncelleme` — bu yanlış (36'da bu hatayı da yaptım)

### Birincil Anahtarlar

- **Eski tablolar** (35 öncesi): `id BIGINT GENERATED ... AS IDENTITY` veya benzeri (örn. `asme_borular`, `cuni_borular`)
- **Yeni tablolar** (35+): `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Yeni açılan tabloda UUID kullan**, eski tablolarla FK gerekirse adapter'a göre karar ver

### TEXT vs VARCHAR

- **TEXT tercih edilir** — uzunluk sınırı yok, performans aynı
- VARCHAR(N) sadece gerçekten sınır gerekiyorsa (örn. ülke kodu CHAR(2))

### JSONB

- **JSONB tercih edilir** — JSON yerine. Index'lenebilir, performanslı.
- **Default `'{}'::JSONB`** — NULL yerine boş obje (parser kodu güvenli olur)

### RLS Pattern

```sql
-- Multi-tenant okuma
CREATE POLICY tablo_select ON tablo FOR SELECT USING (
  tenant_id = (SELECT tenant_id FROM kullanicilar WHERE id = auth.uid())
);

-- super_admin yazma
CREATE POLICY tablo_admin_write ON tablo FOR ALL USING (
  EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);
```

`kullanicilar.rol` kolonu super_admin / firma_admin / kullanici / vs.

---

## Migration Disiplini (36'da pekişti)

- **Idempotent yaz:** `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS` + CREATE
- **WHERE NOT EXISTS** ile rerunnable INSERT
- **Eski tablolara dokunma** — yeni yapıyı yan tarafa kur, helper'ı yeni yapıya taşı, eski tabloyu sonra (bir oturum sonra) sil
- **Doğrulama sorguları yazıp Cihat'a ver** — manuel `DO` bloğu yerine, çünkü Supabase NOTICE'ları gizleyebiliyor
- **Transaction (BEGIN/COMMIT) kaçın** — Supabase SQL Editor bazı durumlarda reddediyor (sebep belirsiz)

---

## Claude'a Özel Hatırlatmalar

1. **Oturum başında Cihat'a kim olduğunu hatırlatmasına izin verme.** Bu dosyayı oku, "Cihat'ı tanıyorum" olarak devam et.

2. **"Yazılımcı değil"i ezber tekrar etme.** Bu utandırıcı olabilir. Davranış düzeyinde uyum sağla — teknik jargonu azalt, komutları açıkla, kararları netleştir.

3. **Gerekmedikçe komut verme.** İlk seçenek her zaman: "İşte dosya, GitHub'a yükle." Sadece git'in özelliklerine (pull/stash/log) gerçekten ihtiyaç varsa komut ver.

4. **Sapma uyarısı.** Cihat bir şeye takılıp 3+ oturum yerinde sayarsa, Claude bunu fark eder ve söyler.

5. **Vizyon koordinatları.** Herhangi bir görev yapılırken Cihat sorarsa: "Bu işin Spool AI hedefine katkısı nedir?" diye — Claude cevap hazır tutar.

6. **Kolon adlarını tahmin etme** (36'dan ders): Yeni tablo bağlantılı SQL yazmadan önce `information_schema.columns` ile gerçek kolon adlarını gör. Tahmin = 1 tur ekstra.

7. **Cihat'ın stratejik sorularını ciddiye al** (36'dan ders): "Eksik var mı?" "Bu sağlam mı?" "İlerde sorun olur mu?" — bu sorular yapısal sorunu sezdiğinin işareti. Hızlıca "yok" deme. Listele, açıkla, karar sorusu sor.

---

## Dosya Güncelleme Yetkisi

- Claude bu dosyayı kendi inisiyatifiyle güncelleyebilir (yeni öğrenilen şeyler).
- Cihat "şunu ekle / değiştir / çıkar" dediğinde Claude günceller.
- Radikal değişiklikler (örn. "yazılımcılığa geçiyorum, ben yazacağım") Claude onay sorar.

---

**İlk yazım:** 23 Nisan 2026 — 23. oturum kapanışı.
**Son güncelleme:** 27 Nisan 2026 — 36. oturum kapanışı (kod konvansiyonu + migration disiplini + stratejik karakter eklendi).
