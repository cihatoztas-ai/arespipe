# CLAUDE — 29. Oturum Gündemi

**Tema:** Devredilebilirlik Günü — Hibrit Dokümanlar  
**Tahmini süre:** 3-4 saat  
**Öncelik:** 🔴 Yüksek (altyapı kapanış planının ilk adımı)  
**Durum:** 28. oturum sonunda onaylandı, alternatif sunulmayacak

---

## 🎯 Bu Oturumun Amacı

AresPipe'ı **yazılımcıya devredilebilir** hale getirmek. Şu an sistem çalışıyor ama "nereden başla, ne nerede, niye böyle" sorusunun cevabı 8 farklı dosyaya dağılmış. Yeni gelen biri kod tabanına girmeden 2-3 saat belge okumakta kaybolur.

Ayrıca **2 ay sonra Cihat bile unutur** — kendi yazdığı sistemi yeniden öğrenmek zorunda kalır. Bu belgeler asıl ona hizmet edecek.

---

## 📐 Karar Verilen Yapı — Hibrit (A2)

Her doküman **iki katmanlı** olacak:

```
Manuel bölüm (Claude veya Cihat günceller)
├─ "Nereden başla", "Niye böyle tasarlandı", "Neye dikkat et"
├─ 2 oturumda bir gözden geçirilir
└─ Anlatım, hikâye, nedensellik

Otomatik bölüm (AUTO-START ... AUTO-END yorumları arası)
├─ Sayaçlar: "Şu an 51 tablo, 40 sayfa, 15 kural"
├─ Listeler: Tablo listesi, endpoint listesi
├─ Her push'ta .github/docs-uret.js günceller
└─ Kuru veri, her zaman güncel, hiç eskimeyecek
```

---

## 📋 Oluşturulacak 6 Belge + 2 Motor Dosya

| # | Dosya | Manuel % | Otomatik % | Açıklama |
|---|---|---|---|---|
| 1 | `README.md` (repo kök) | 100 | 0 | Kapak sayfası, kısa tanıtım, linkler |
| 2 | `docs/ONBOARDING.md` | 90 | 10 | "İlk gün" rehberi, sistem özeti |
| 3 | `docs/ARCHITECTURE.md` | 80 | 20 | Mimari, tasarım kararları, katman şeması |
| 4 | `docs/DATABASE.md` | 30 | 70 | Tablo listesi (auto), multi-tenant/RLS (manuel) |
| 5 | `docs/API.md` | 20 | 80 | Endpoint listesi (auto), usage notes (manuel) |
| 6 | `docs/LOCAL-DEV.md` | 100 | 0 | Repo klon, .env, deploy, debug |
| — | `.github/docs-uret.js` | — | — | Auto bölümleri üreten script |
| — | `.github/workflows/docs-uret.yml` | — | — | Script'i her push'ta koşturan workflow |

---

## 🗂️ Oturum Akışı (Tahmini)

### Faz 1 — Hazırlık ve Envanter (~30 dk)
- [ ] Git pull + ritüel + profil oku
- [ ] Mevcut belge envanteri: `ls docs/` + kök dizin + `.github/`
- [ ] Cihat'tan 4 soruya cevap al (aşağıda listelendi)
- [ ] Sabit bir iskelet plan: hangi dosyada ne yazılacak

### Faz 2 — Auto-uret Script Yaz (~45 dk)
- [ ] `.github/docs-uret.js` — Node script
- [ ] Fonksiyonlar:
  - `sayfaSayisi()` — `*.html` dosya sayısı (mobile/ hariç)
  - `mobileSayfaSayisi()` — `mobile/*.html` sayısı
  - `tabloListesi()` — `migrations/000_initial_schema.sql`'dan `CREATE TABLE public.*` çıkar
  - `apiEndpointListesi()` — `api/*.js` dosyalarını tara, dosya adından endpoint çıkar, JSDoc varsa oku
  - `kuralListesi()` — `.github/kurallar.json`'dan kural sayısı ve kategorileri
  - `migrationSayisi()` — `migrations/*.sql` dosya sayısı
- [ ] Her markdown dosyasında `<!-- AUTO-START:bolumadi -->` ... `<!-- AUTO-END:bolumadi -->` arasını yeniden yaz
- [ ] Sandbox testi: Yerel Node'da koştur, görmeden göndermem

### Faz 3 — Workflow Yaz (~15 dk)
- [ ] `.github/workflows/docs-uret.yml`
- [ ] Tetikleme: `push` + belgenin kendisini değiştirmemek için `paths` filtresi
- [ ] Script'i koştur, değişiklik varsa auto-commit + push
- [ ] Commit mesajı: `docs: auto-update [skip ci]` (sonsuz döngüyü önle)

### Faz 4 — 6 Belgeyi Yaz (~90 dk)
- [ ] `README.md` — 10-15 satır, hızlı tanıtım + doc link'leri
- [ ] `docs/LOCAL-DEV.md` — adım adım kurulum (en kolay, manuel)
- [ ] `docs/DATABASE.md` — çerçeve + AUTO tablo listesi
- [ ] `docs/API.md` — çerçeve + AUTO endpoint listesi
- [ ] `docs/ARCHITECTURE.md` — en uzun, mimari kararları dahil
- [ ] `docs/ONBOARDING.md` — diğer 5 belgeyi bağlayan omurga

### Faz 5 — Teyit (~30 dk)
- [ ] Cihat dosyaları GitHub'a yükler
- [ ] CI çalışır, docs-uret auto-commit atar, CI tekrar çalışır (skip ci ile ikinci kırılma olmaz)
- [ ] Yaşam kontrolü: Bir mock değişiklik yap (örn. yeni test dosyası), auto-update tetikleniyor mu
- [ ] Belgeler GitHub'da render ediliyor mu (görsel kontrol)

### Faz 6 — Kapanış (~15 dk)
- [ ] `son-durum.md` güncelle, 30. oturum → Bucket PRIVATE
- [ ] `CLAUDE-SON-OTURUM.md` raporla
- [ ] `CLAUDE-SONRAKI-OTURUM.md` (30. için) yaz

---

## ❓ Cihat'tan İsteyeceğim 4 Soru (Faz 1)

Belgeler yazılmadan cevabı benim bilmediğim 4 şey var. Oturumun başında soracağım:

### Soru 1 — Hedef Kitle
Bu belgeler kim için yazılacak?
- (a) Sadece sen, unutma korkusu — kişisel not
- (b) Yakın gelecekte bir yazılımcı alacaksan o kişi
- (c) Açık kaynak / herkese — GitHub'da public repo

**Neye etki ediyor:** Üslup. (a) konuşma dili, (b) profesyonel, (c) örneklerle dolu.

### Soru 2 — İngilizce mi Türkçe mi
Belgeler Türkçe mi İngilizce mi olsun?

**Profil diyor ki:** Cihat Türk, proje Türkçe. Ama SaaS vizyonu varsa İngilizce daha geniş kitleye açılır.

### Soru 3 — Local Geliştirme Gerçekten Çalışıyor mu
`LOCAL-DEV.md` yazmak için: Sen Mac'inde repo klon + `.env` dosyası + canlı Supabase bağlantısıyla çalıştırabilir misin? Yoksa her şey Vercel üzerinden mi?

**Neye etki ediyor:** Yazılımcı gelse local'de çalıştırabilir mi? Eğer çalıştıramıyorsan bunun da dokümantasyonu lazım — "local çalışmaz, sadece Vercel'e push ile test edersin" bile olsa.

### Soru 4 — API Endpoint JSDoc'u Hangi Formatta
`api/*.js` dosyalarının başında bir yorum bloğu var mı? Yoksa boş mu başlıyor? Varsa format ne?

**Neye etki ediyor:** Script bu yorumları parse edip `API.md`'ye taşıyacak. Format yoksa her dosyanın ilk satırlarına minimum bir başlık yorumu eklenmeli (Claude hazır verir, Cihat yükler).

---

## 📦 Sandbox Testi (Production'dan Önce Zorunlu)

28. oturumun 6. dersi: **"Bu çalışmalı" değil, "çalıştığını gördüm" ile gönder.**

Auto-uret script'ini ve workflow'u göndermeden önce:

1. Lokal sandbox'ta mini bir repo kur (~5 dakika)
2. Script'i koştur, bir markdown dosyasının AUTO bölümü güncelleniyor mu gör
3. Edge case'leri test et: AUTO-START/END yoksa ne oluyor, script crash olursa CI nasıl davranıyor
4. Ancak sonra GitHub'a paylaş

---

## ⚠️ Potansiyel Riskler ve Kaçınma Yolları

### Risk 1 — Sonsuz Döngü
Docs-uret workflow auto-commit atıyor → CI tekrar tetikleniyor → docs-uret tekrar koşuyor → sonsuz loop.  
**Çözüm:** Commit mesajında `[skip ci]` tag'i + workflow `paths` filtresiyle kendi değişikliklerini dışla.

### Risk 2 — Script Hatası CI'ı Kırar
`docs-uret.js` bir hata atarsa tüm CI kırmızı olur.  
**Çözüm:** Workflow'da `continue-on-error: true` veya script içinde try/catch + sessiz fail + log yazma.

### Risk 3 — Auto Bölümü Manuel Metni Siliyor
AUTO-START/END sınırları yanlış yazılırsa manuel yazdığın metin silinir.  
**Çözüm:** Script sadece AUTO işaretleri ARASINDAKİ kısmı değiştirir, başka yere dokunmaz. Unit test: bir örnek dosyada sınırların üstü ve altı sabit kaldı mı kontrol et.

### Risk 4 — 4 Saat Yetmez, Yarım Kalır
Belge yazımı her zaman tahminden uzun sürer.  
**Çözüm:** Faz sıralaması öncelikli. Eğer zaman biterse:
- Öncelik: `README.md` + `ONBOARDING.md` + auto-uret script (bunlar ZORUNLU)
- Ertelenebilir: `DATABASE.md`, `API.md`, `ARCHITECTURE.md` detayları (iskelet yeter, içi 30'da doldurulur)

---

## 📊 Başarı Kriterleri (29 Sonu)

- [ ] 6 belge oluşturuldu ve GitHub'da render ediliyor
- [ ] `docs-uret.js` + workflow çalışıyor, AUTO bölümler otomatik güncelleniyor
- [ ] `README.md` repo ana sayfasında görünüyor, `docs/` link'leri çalışıyor
- [ ] Yeni bir yazılımcı 1 saatte sistemin %80'ini anlayabilir seviyede detay
- [ ] CI hâlâ yeşil, sonsuz loop yok
- [ ] Self-test hâlâ 4/4 (yeni belge eklemek kural sisteminin bozulmasına neden olmasın)

---

## 🔗 30-34 Oturum Bağlantısı (Hatırlatma)

28'de mutabık kalınan altyapı kapanış planı:

| Oturum | Tema |
|---|---|
| **29** | **Devredilebilirlik (bu oturum)** |
| 30 | Bucket PRIVATE geçişi (güvenlik — müşteri öncesi şart) |
| 31 | Sentry entegrasyonu (observability) |
| 32 | Email sistemi (iletişim) |
| 33 | Staging Supabase + migration runner |
| 34 | Tenant izolasyon testleri + feature flag |

35'ten itibaren: Tablo Render Standardı, operasyon sayfaları, mobil, Spool AI döngüsü.

Her oturum sonunda bu planın hâlâ geçerli olup olmadığı Cihat'a teyit ettirilecek. Altyapı biter bitmez ürüne geçmek Cihat'ın motivasyonu için kritik.

---

## 🎯 Oturum İçi Disiplin (Cihat'ın Profiline Göre)

- Her belge yazımında mockup-first: iskelet → onay → içerik
- Komutları birer birer, açıklamalı (PAT/Vercel oturumundaki gibi)
- Sandbox testi olmadan paylaşma (28. oturumun 6. dersi)
- Görsel karşılaştırma: "bu belge böyle görünecek" diye örnek paragraf göster
- Plan değişikliğinde dur, sor, onaylat (27. oturumun dersi)
- 29'da sabit plan var — alternatif opsiyon sunma, direkt işe giriş

---

**28. oturum sonu, 24 Nisan 2026.** 29 için her şey hazır. Cihat yarın bu belgeleri GitHub'a yükleyip, CI yeşil görüp molasına gidecek.
