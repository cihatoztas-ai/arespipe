# İlk Gün — Yazılımcı Rehberi

> Bu belge seni ilk günün sonunda **"sistemi anladım, karar verecek noktadaysam kime danışırım"** durumuna getirmek için yazıldı. Sırayla oku — atlamak geri dönmekten yavaş. Projenin **ne** olduğunu `docs/ARCHITECTURE.md` Bölüm 1'de okuyacaksın; burada sadece **nereden başla** anlatıyorum.

---

## 1. Hoş Geldin — 60 Saniye Özet

**AresPipe** bir tersane boru imalat takip sistemi. Gemilerde yüzlerce spool (boru demeti) üretilir; her birinin kesim → büküm → markalama → kalite kontrol → sevkiyat zinciri tablette dijital olarak takip edilir. Şu an bir tersanede kullanılıyor, ileride SaaS olarak birden fazla tersaneye satılacak (multi-tenant mimari hazır).

**Teknoloji:** statik HTML + küçük serverless API (Vercel) + PostgreSQL (Supabase). Mobil kısım React (Vite), henüz %5'te. Detay `docs/ARCHITECTURE.md`'de.

**Ekip:** **Cihat** proje sahibi (yazılımcı değil, ürün ve iş kararları onda). **Sen** teknik uygulamadan sorumlusun. İşbirliği genelde Cihat'ın Claude ile geliştirdiği oturumlar üzerinden büyümüş — CLAUDE.md ve `docs/CIHAT-PROFIL.md` bu geçmişin notları. Senin için zorunlu okuma değil ama proje kültürünü anlamak istersen faydalı.

**Bu belgenin kalanı:** sistem haritası, erişim listesi, 5 günlük rehber, kritik kurallar.

---

## 2. 30 Dakikada Sistem Haritası

Şu sıra ile oku, ortalama 30-40 dakika sürer. Atlama — sonraki belge öncekine referans veriyor.

| Sıra | Belge | Süre | Ne Öğreneceksin |
|---|---|---|---|
| 1 | `docs/ARCHITECTURE.md` | 15 dk | Sistem katmanları, tasarım kararları, Spool AI vizyonu |
| 2 | `docs/DATABASE.md` | 10 dk | Multi-tenant mantığı, RLS şablonu, migration sistemi |
| 3 | `docs/API.md` | 8 dk | 2 endpoint'in ne yaptığı, yeni endpoint nasıl eklenir |
| 4 | `docs/LOCAL-DEV.md` | 5 dk | Lokal dev yok, push-to-deploy akışı, debug nereden bakılır |

Okurken not tut: "Bunu niye böyle yapmışlar, ben olsam nasıl yapardım?" Bu sorular **hemen harekete geçmek için değil**, 2 hafta sonra proje bağlamıyla birlikte konuşulmak için.

---

## 3. Erişim Checklist

İlk gün bitmeden bu 7 hesaba erişimin olmalı. Cihat sana ekleyecek — her biri için gerekli adresi sana iletecek.

- [ ] **GitHub** → `cihatoztas-ai/arespipe` repo'sunda **collaborator** (push yetkili)
- [ ] **GitHub** → `cihatoztas-ai/arespipe-backups` repo'sunda **read** (yedekleri görebilmek için)
- [ ] **Vercel** → `arespipe` projesinde **member** (deploy log okuma, env variable görme)
- [ ] **Supabase** → production projesinde **developer** rolü (Table Editor, SQL Editor, Logs)
- [ ] **Anthropic Console** → API key var mı kontrol et (izometri-oku endpoint'i için gerekli; Cihat paylaşacak)
- [ ] **Mac'te kurulum** → Git, Node.js 20+, VS Code (bkz. `docs/LOCAL-DEV.md` Bölüm 2)
- [ ] **Repo'yu klonla** → `git clone`, `node .github/kontrol.js --self-test` koştur → yeşil olduğunu gör

Self-test yeşil olmazsa durma, Cihat'a haber ver — büyük ihtimal `.github/package.json` veya Node sürümü.

---

## 4. İlk Hafta — Ne Öğren, Ne Yapma

İlk hafta **read-only moddasın.** Production'a commit atma, migration ekleme, büyük refactor önerme. Önce sistemi okuyacaksın, sonra karar vereceksin.

| Gün | Yap | Yapma |
|---|---|---|
| **1** | Belgeleri oku (Bölüm 2). ARCHITECTURE + DATABASE + API + LOCAL-DEV | Production'a commit atma |
| **2** | Repo'yu klonla, self-test koştur. `docs-uret.js` lokal çalıştır. Repo yapısını gez (`ls -R` ile değil, VS Code ile dosyaları aç oku). | Migration ekleme, DB'de SQL çalıştırma |
| **3** | Canlı siteyi (`arespipe.vercel.app`) gez. Bir test hesabıyla giriş yap (Cihat sana bir test tenant'ı verecek). Bir-iki sayfada browser console'u aç, network sekmesini izle. | CI kural kuralını çiğneme (CI kırmızı olur) |
| **4** | Bir endpoint'in (`api/sorgula.js` önerilen) kodunu satır satır oku. curl ile çağrı yap (preview URL'de). Başarısız case'leri de dene. | Yeni endpoint eklemek |
| **5** | Küçük bir görev seç — süper admin panosundaki feedback'lerden biri, küçük bir UI iyileştirmesi. **PR aç** (main'e direkt push etme). Preview URL'de test et. Code review bekle. | Büyük değişiklik, yeni tablo ekleme, auth akışına dokunma |

**Çerçeve kuralı:** Bu hafta boyunca "bu niye böyle yapılmış?" sorularını not et, Cihat'a sorma. Cevabın %80'i belgelerde var, kalanını 2. hafta beraber konuşursunuz.

---

## 5. Günlük Akış

AresPipe'ın gündelik geliştirme döngüsü **push-to-deploy**:

1. **Dosyayı düzenle** — VS Code (veya editor'ün). Lokal web sunucu yok, browser'da test edemezsin.
2. **Commit et** — bir PR aç. Direct main push yetkili olsan bile **PR ile çalış** (code review + preview deploy için).
3. **2 yeşil tik bekle:**
   - GitHub Actions → **Kural Kontrolü** (yeşil)
   - GitHub Actions → **Dokümantasyon Auto-Update** (yeşil)
   - Vercel → **Preview Deploy** (yeşil + link)
4. **Preview URL'de test et** — Vercel PR yorumuna düşürür.
5. **Code review** — Cihat bakar, onay verir.
6. **Merge** — main'e geçer, prod deploy tetiklenir, `docs-uret` AUTO bölümleri (varsa) günceller.

### CI Kırmızı Olursa

1. Actions sekmesinden ilgili run'a tıkla.
2. Summary'de kural kodu (`YAP_03`, `I18N_02`, `MIG_ISIM_BOZUK` vb.) ve dosya yolu yazar.
3. Kuralın anlamı için: `.github/kurallar.json` ve `docs/ARCHITECTURE.md` Bölüm 6.
4. Lokalde düzelt, push et.

### Vercel Kırmızı Olursa

1. Vercel Dashboard → Deployments → kırmızı deploy → "Build Logs".
2. Çoğunlukla syntax hatası veya import sorunu.
3. **İstisna:** "Deployment rate limited — retry in 24 hours" → free tier günlük limit. Beklemeye geç, kendiliğinden açılır.

### Sunucu Hatası (500) Olursa

`api/*.js` endpoint'i hata atıyorsa Vercel Dashboard → Deployments → ilgili deploy → **Functions** sekmesi. Stack trace orada.

---

## 6. Kritik Kurallar — Unutma

Bu 10 kural tüm belgelerde dağınık halde var. Burada özet — **ihlali CI yakalar ama bazıları yakalayamaz**, kendin dikkat etmen lazım.

### CI Yakalar (kırmızı olursun)

1. **Migration adlandırma:** `NNN_aciklama.sql` zorunlu. Bozuksa `MIG_ISIM_BOZUK`.
2. **Migration numarası benzersiz:** Aynı 3 haneli numara iki dosyada olamaz. `MIG_NUMARA_TEKRAR`.
3. **Migration header:** İlk 10 satırda `--` yorumu. `MIG_HEADER_EKSIK` (uyarı).
4. **Hardcode renk yasak:** `#ff0000`, `rgba(...)` yasak — CSS değişkeni (`var(--ac)`) kullan. `G03_HAM_HEX`.
5. **Hardcode string yasak:** Kullanıcıya görünen her metin `tv('anahtar', 'fallback')` ile. `I18N_*`.
6. **Sayfa yetki kontrolü:** Her HTML sayfada `ARES.sayfaYetkiKontrol([roller])` çağrısı. `YAP_*`.

### CI Yakalamaz (kendin dikkat)

7. **`tenant_id` her sorguda:** Backend endpoint'lerde service key kullanılıyor, RLS bypass edilir. Her DB sorgusuna `.eq('tenant_id', tenant_id)` **manuel** eklemezsen veri sızıntısı.
8. **CHECK değişiminde sıra:** DROP → UPDATE → ADD. Yanlış sırada policy kilidi.
9. **FK eklerken embed disambiguate:** `select('*, tablo!fk_kolonu(*)')` — çoklu FK varsa Supabase hangisini kullanacağını bilmez.
10. **Atomik commit:** İlişkili dosyaları tek commit'e topla. Aşamalı commit ara durumlarda kırık sistem bırakır.

### Sapmama Sistemi Felsefesi

Bu kural sistemi 23. oturum öncesi Claude'un "hatırlıyorum, kontrol etmeme gerek yok" davranışının Cihat'a 10 gün kaybettirmesi sonrası kuruldu. **Makineye güveniyoruz, hafızaya değil.** Bir kural sana "fazla titiz" gelse bile önce nedenine bak (`kurallar.json` + ilgili belge) — vardır bir geçmişi.

---

## 7. Kime Ne Sorulur

Proje bilgisi üç yerde:

### Cihat — İş kararları, öncelik, ürün yönü

- "Hangi özellik önce?"
- "Bu müşteri için özel istisna yapalım mı?"
- "Spool AI döngüsüyle uyumlu mu?"
- "Para/kaynak kararı" (Vercel plan yükseltme, Supabase Pro geçiş vb.)

**Nasıl sor:** Çoktan seçmeli, net. "A yapsak mı B mi?" iyi; "Ne düşünüyorsun?" çok açık, onu yorar. Cihat'ın çalışma tarzı: kısa net mesaj, somut ilerleme, görsel karşılaştırma.

### Belgeler — "Niye böyle yapmışlar?"

- `docs/ARCHITECTURE.md` Bölüm 9 → tasarım kararları + nedenleri
- `docs/DATABASE.md` → schema, RLS, migration disiplini
- `docs/API.md` → endpoint ayrıntı ve ekleme rehberi
- `docs/LOCAL-DEV.md` → lokal akış ve debug
- `docs/SPOOL-AI-VIZYON.md` → uzun vade ürün yönü
- `.github/kurallar.json` → CI kural kataloğu
- Bu belgede cevap yoksa git commit geçmişine bak — özellikle `docs/` klasörü commit'leri bağlam verir.

### Claude — Karmaşık kod sorusu, brainstorm

Cihat Claude ile düzenli oturumlar yapıyor (oturum numaralı kayıtlar projede). Eğer bir özellik için "nasıl yapsak?" sorusu varsa Cihat seninle birlikte Claude oturumu açabilir — tasarım tartışması, alternatif karşılaştırma için verimli.

**Kendin için Claude kullanıyorsan:** bağlamı belirli tut. "AresPipe'ta `api/sorgula.js` şöyle çalışıyor, şu bug için öneri?" iyi. "Node.js'te serverless fonksiyon yaz" bağlamsız.

---

## 8. Hızlı İstatistikler

<!-- AUTO-START:istatistikler -->
> Son güncelleme: 2026-05-01 (otomatik)

- **Web sayfa:** 40
- **Mobil ekran (React):** 11
- **Tablo:** 52
- **API endpoint:** 8
- **CI kural:** 170 (7 kategori)
- **Migration dosyası:** 18
<!-- AUTO-END:istatistikler -->

---

## Ekler

### Faydalı İlk Komutlar

```bash
# Repo klonla
cd ~/Desktop
git clone https://github.com/cihatoztas-ai/arespipe.git
cd arespipe

# CI self-test
node .github/kontrol.js --self-test
# Beklenen: "4/4 başarılı ✅"

# Dokümantasyon üretici (zararsız, AUTO bölümleri yerel'de günceller)
node .github/docs-uret.js

# Git sağlık kontrolü
git status
git log --oneline -10
```

### Oturum Kültürü

Projede "oturum" denilen şey Cihat'ın Claude ile teknik konuşmaları — 29'a kadar gelindi, her biri `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` + `.github/son-durum.md` dosyalarında özetleniyor. Bunları okumak zorunda değilsin; bağlam merak edersen göz atabilirsin. Oturum özetleri proje geçmişinin "niye" kısmını taşır.

### Bu Belgenin Kendisi

ONBOARDING.md bir omurga — diğer belgelere yönlendirir. Çok ayrıntıya girmez kasıtlı. Bir konu burada eksik gelirse hedef belgeye git:

- Sistem kararları → `ARCHITECTURE.md`
- Şema/RLS detay → `DATABASE.md`
- Endpoint nasıl yazılır → `API.md`
- Lokal kurulum / debug → `LOCAL-DEV.md`

Eksik gördüğün bir şey varsa **bu belgeye PR aç.** Sonraki yazılımcı senin kaybettiğin 15 dakikayı yaşamasın.

---

_Bölüm 8 (İstatistikler) otomatik. Diğer bölümler manuel — onboarding akışı değiştikçe yazılımcı günceller (önerilen: her yeni kişi için ilk hafta sonunda retrospektif)._
