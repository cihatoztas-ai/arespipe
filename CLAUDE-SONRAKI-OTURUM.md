# CLAUDE — 32. Oturum Gündemi

**Tema:** Birikme Önleme Sistemi Kararı + Bekleyen Temizlik
**Tahmini süre:** 1.5-2 saat (karara bağlı)
**Öncelik:** 🟡 Orta — disiplin kuruluşu + altyapı temizliği
**Durum:** 31'in sonunda iki açık karar var, ilk iş bunları çözmek

---

## 🎯 Bu Oturumun Amacı

31'de Bucket PRIVATE Migration tamamen bitirildi ve yeni bir disiplin (sayfa eksikleri defteri) tartışıldı ama karar 32'ye ertelendi. 32 önce iki kararı çözecek, sonra acil temizlikleri yapacak, kalan zaman kararın uygulamasına ayrılacak.

---

## 🚦 Oturum Başı Kontroller (Ritüelden Sonra)

**1. Üzerinden geçmesi gereken belgeler:**
- `docs/SAYFA-EKSIKLERI.md` — defter, açık 6 madde + G-08 envanteri
- son-durum.md "Borçlar" bölümü
- Cihat'ın 31'de söylediği: *"birikme olmasın diye sistem"* + *"sonra düşünelim"*

**2. Vercel ve CI durumu:**
- 31'de yapılan 3 fix (S2, D1, D2) canlıda mı?
- CI yeşil mi? — son commit yeşil olmalı

**3. Defter doğrulaması:**
Cihat'a sor: "31'de açtığım defter dosyasını okuyup üstünden geçtin mi? Birinin önceliği hâlâ aynı mı?"

---

## ⚖️ İlk Karar — SBD-01 (Sayfa Borç Defteri) Yaklaşımı

Cihat 31'de iki sistem önerdi, bir de Claude bir 3.'sünü sundu (GitHub Issues). 32 başında Cihat seçecek.

### Seçenek A — Mevcut Markdown Defter, Sayfa-Merkezli Yeniden Yapı

**`docs/SAYFA-EKSIKLERI.md`** sayfa-merkezli olarak yeniden yapılandırılır:
```
### spool_detay.html
#### Açık (3)
- [SED] S1: belgeKaydet DB'ye yazmıyor (~15dk, 1 oturumdur açık)
- [G-08] Açılış ritüeli yok (~25dk, 0 oturumdur açık)
- ...
#### Kapatılan
- ✅ S2: egitim_verisi kolon adı (31)
```

Claude sayfa açıldığında bu dosyayı okur, sayfa bölümünü listeler.

**Artılar:** Hızlı kurulum, mevcut dosya, bağımsız (network gerekmez).
**Eksiler:** Şişerse yönetim zor, otomatik filtre yok, mobile bakış zor.

### Seçenek B — GitHub Issues + Tech Debt Sprint

Mevcut defter migration ile **GitHub Issues**'a aktarılır:
- Etiketler: `page:spool_detay`, `category:G-08`, `priority:high`, `effort:25min`
- Milestone: "Pre-Launch Tech Debt", "Spool Detay Cleanup"
- Claude API ile `?labels=page:spool_detay&state=open` filtresiyle çeker

**Artılar:** Profesyonel, ölçeklenebilir, mobile app, otomatik tarih, kapanış commit'le bağlı.
**Eksiler:** Kurulum 30 dk (mevcut 9 madde aktarılacak), GitHub UI öğrenmek (Cihat için yeni), API entegrasyonu (her oturum bir komut).

### Seçenek C — Hybrid

Şu an **markdown defter** (B'ye geçmek için olgunluk yok). Defter sayfa-merkezli yapılır. **35+ ürün döneminde** GitHub Issues'a göç düşünülür (müşteri varsa zaten Issues şart olur).

**Tavsiye:** **C** — geçişi şimdi yapma yükü almazsın, ama olgunlaştığında doğru sisteme geçebileceksin.

### Karar İçin Cihat'a Tek Soru

> "Markdown defter kalsın, sayfa-merkezli yeniden yapılandıralım. GitHub Issues 35+ ürün döneminde düşünelim. **Onaylıyor musun?**"

Onaylarsa: 32'nin ilk yarısı sayfa-merkezli yeniden yapılandırma + SED-01 kuralı `kurallar.json`'a entegrasyon.

---

## ⚖️ İkinci Karar — 32-35 Sıralaması

31'de planı 1 oturum kaydırdık. Şu anki sıra:

| 32 | KARAR + Birikme önleme uygulaması |
| 33 | Sentry entegrasyonu |
| 34 | Email sistemi |
| 35 | Staging Supabase + migration runner |
| 36 | Tenant izolasyon testleri |

**Ama** Cihat G-08 yaygınlaştırma istiyor (22 sayfa). Bu da 1.5 oturum.

### Seçenek A — Sentry öncelikli (mevcut plan)
- 32: Birikme önleme uygulaması
- 33: Sentry
- 34-35-36: Email/Staging/Tenant
- 37+: G-08 yaygınlaştırma (ürün dönemi)

**Mantık:** Hata izleme altyapısı önce, sonra UX iyileştirme. Production-ready öncelikli.

### Seçenek B — G-08 öncelikli
- 32: Birikme önleme uygulaması (yarım gün)
- 32-33: G-08 15 yüksek öncelik sayfa
- 34: Sentry
- 35-36-37: Email/Staging/Tenant

**Mantık:** Görsel standart şimdi yapılırsa yeni sayfalar standart pattern'le ekler. Sentry zaten Cumartesi gece kurulabilir, kritik değil.

### Tavsiye

Cihat'a sor:

> "Lansman tarihin (müşteri demoya hazır olmak istediğin tarih) belli mi? Eğer 1-2 ay sonraysa (A), 3-4 ay sonraysa (B). Çünkü G-08 olmadan müşteriye gösterirsen 'dağınık' algısı yapışır."

---

## 🧹 Acil Temizlik (15 dk)

### Orphan bucket dosyaları
31'de yapılan feedback foto testleri sırasında bucket'a 2 dosya düştü. Şimdi orphan:
- `feedback/1777099713115.jpg`
- `feedback/1777100014537.jpg`

Bunların DB kayıtları:
- `cae5a8ab-c619-41ce-a733-67186d73b1e4` (eski format, kırık)
- `f3d97dc2-54db-4b8d-b369-9725a6ac18d1` (eski format, kırık)

**Adımlar:**
1. SQL: `DELETE FROM feedback_kayitlari WHERE id IN ('cae5a8ab-...', 'f3d97dc2-...');`
2. Supabase Dashboard → Storage → arespipe-dosyalar → feedback/ klasörü → 2 dosyayı sil

### `db-backup.yml` cron düzeltmesi

Şu an `0 3 * * *` — UTC 03:00 = TR 06:00 hedefli ama gerçekleşen ~02:56 UTC = TR 05:55. **Plana göre 3 saat kayma**.

**Düzeltme:**
```yaml
# .github/workflows/db-backup.yml
schedule:
  - cron: '0 0 * * *'  # UTC 00:00 = TR 03:00 (yaz saati)
```

PR ile aç, merge et, sonraki gece TR 03:00'da tetiklenecek.

> Yan not: TR yaz saati (TRT, GMT+3) → UTC 0 = TR 3. Kış saati uygulanırsa (Türkiye 2016'dan beri kullanmıyor ama dikkat) ayarlamak gerekebilir.

---

## 📋 Önerilen 32. Oturum Akışı

```
Saat 1 — Karar Aşaması
  - Ritüel + son-durum okuma
  - SBD-01 yaklaşımı kararı (5 dk Cihat)
  - 32-35 sıralaması kararı (5 dk Cihat)
  - Karar dökümana yazılır (son-durum.md güncellenir)

Saat 2 — Acil Temizlik (15 dk)
  - Orphan dosya silme (DB + bucket)
  - db-backup.yml cron düzeltmesi (1 commit)

Saat 2-3 — Karara Göre Uygulama
  Seçenek A (Sentry öncelikli):
    - SBD-01: defter sayfa-merkezli yeniden yapı (45 dk)
    - kurallar.json'a SED-01 entegrasyonu (15 dk)
    - CLAUDE.md ritüeline yeni soru ekle (5 dk)
    - Sentry kurulum başlangıcı (kalan zaman)

  Seçenek B (G-08 öncelikli):
    - SBD-01: defter sayfa-merkezli yeniden yapı (45 dk)
    - G-08 referans implementasyon (proje_liste.html veya admin/panel.html) (45 dk)
    - Yaygınlaştırma örnek (1 sayfa daha) (30 dk)

Saat son — Kapanış
```

---

## 🎯 Başarı Kriterleri (32 Sonu)

- [ ] SBD-01 yaklaşımı net karar verildi (A/B/C)
- [ ] 32-35 sıralaması net (Sentry'nin yeri kesin)
- [ ] Orphan dosyalar temizlendi (DB + bucket)
- [ ] db-backup cron düzeltildi
- [ ] Defter sayfa-merkezli yapıya kavuştu (mevcut 6 madde + envanter sayfa-bazlı)
- [ ] kurallar.json'a SED-01 eklendi
- [ ] Bir sonraki sayfa açıldığında defter okuma akışı test edildi
- [ ] CI yeşil

---

## ⚠️ Potansiyel Engeller

### Engel 1: Cihat karar veremiyor
Eğer Cihat "ikisi de iyi, hangisi daha iyi söyle" derse:
- Net tavsiye **C** (markdown şimdilik) ve **A** (Sentry öncelikli) — defaultlar
- Karar verilemezse defaultlarla devam, 33'te yeniden değerlendir

### Engel 2: Sayfa-merkezli yeniden yapılandırma 45 dk'yı aşıyor
Defter mevcut yapıdan kategori-merkezli, sayfa-merkezliye dönüşüm beklediğimden uzun sürebilir. Süre aşıyorsa:
- Cihat'a 1 oturum ek ayır teklifi (33'ün ilk yarısı)
- Veya önce sadece spool_detay + devre_detay yeniden yapılandır, kalan sayfalar 33'te

### Engel 3: Cron düzeltme bekleyen test
Cron düzeltildikten sonra **bir gece beklemek lazım** TR 03:00 olduğunu görmek için. 33. oturum başında doğrulama yapılır.

### Engel 4: Sayfa açıldığında defter listeleme entegrasyonu
"Bir sonraki sayfa açıldığında Claude defter okusun" akışı test edilmedi. Bu akış için:
- Cihat sayfa istediğinde Claude `docs/SAYFA-EKSIKLERI.md`'i project_knowledge_search ile bulup okumalı
- Sayfa-merkezli yapıda ilgili bölümü çıkarmalı
- Listelemeli, Cihat'a önceliklendirme sormalı
- **Bu işin bir kez gerçekten test edilmesi 32 sonunda lazım** — bir sayfa açıp prova et

---

## 🔗 32'den Sonra (Güncel Plan)

| Oturum | Tema | Durum |
|---|---|---|
| 31 | Bucket PRIVATE Migration | ✅ |
| **32** | **Karar + Temizlik + SBD-01 uygulama** | **Bu oturum** |
| 33 | Sentry (A) veya G-08 (B) | 32 kararına bağlı |
| 34 | Email sistemi | Sırada |
| 35 | Staging + migration runner | Sırada |
| 36 | Tenant izolasyon testleri | Sırada |

**37+ ürün dönemi.** G-08 yaygınlaştırma B seçilirse 32-33, A seçilirse 37+.

---

## 🎯 Oturum İçi Disiplin (31'in Dersleri)

- **Plan dosyalarına ezbere uyma, gerçek kod tara** — 31'de 90 dk tasarruf
- **Schema değişikliği planlarken information_schema sorgusu zorunlu** — S2 bug yakalandı
- **Deploy zamanlamasını test öncesi doğrula** — feedback foto kafa karışıklığı
- **Eager > lazy mümkünse** — kapsamı küçült, race azalt
- **Görülen yarım akışı sessizce atlama, defter'e yaz** — SED-01 temeli

(+ 1-30'un tüm dersleri `son-durum.md` disiplin bölümünde)

---

## 🔐 Bekleyen Testler (31'den devir)

**Cross-tenant blok kontrolü** — Normal user (super_admin değil) hesabıyla, başka bir tenant'ın yolunu çağırma testi. Endpoint kodu doğru kontrolü yapıyor (`if (!superAdmin && yoldanTenantId !== kullaniciTenantId)`) ama canlı kanıt yok. 32'de yapılması zor (2. test kullanıcısı gerekir), bekleyen test olarak kalır. 35-36 tenant izolasyon testleri oturumunda yapılacak.

---

**31. oturum sonu yazıldı, 25 Nisan 2026 Cumartesi öğle.** 32. oturum açılışında Cihat ilk önce iki karar (SBD-01 yaklaşımı + sıralama) verecek, sonra temizlik yapacağız.
