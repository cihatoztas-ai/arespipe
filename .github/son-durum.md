# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 29 (24 Nisan 2026) — Devredilebilirlik Günü ✅

### CI Durumu
- **Son build:** YEŞİL ✅ (kontrol.yml + docs-uret.yml, ikisi de yeşil)
- **Aktif kural sayısı:** 15 (değişmedi)
- **Self-test:** Koşturulmadı — sonraki zorunlu 33. oturum
- **Yeni workflow:** `docs-uret.yml` — AUTO bölüm güncelleme motoru, race condition korumalı (rebase + retry 3x)

### Bu Oturumda Yapılanlar (~4 saat)

**İş 0 — Fantom Borç Temizliği** ✅
- `.github/package.json` 28'de lokal oluşmuştu ama push edilmemiş — son-durum.md yanlış raporluyordu
- GitHub'a yüklendi, commit'lendi, lokal/remote tutarlı

**İş 1 — Hibrit Doküman Motoru** ✅ (~1.5 saat)
- `.github/docs-uret.js` (~290 satır, CommonJS) — 6 üretici fonksiyon (sayfa/mobil/tablo/endpoint/kural/migration)
- AUTO-START / AUTO-END sınırları arasını yeniden yazar, dışındaki manuel metne dokunmaz
- Her fonksiyon try/catch'li, script `exit 0` garantisi — CI asla kırılmaz
- `.github/workflows/docs-uret.yml` — push tetiklemeli, `[skip ci]` ile sonsuz döngü önleme
- Sandbox'ta 7 edge case test geçti (mutlu yol, AUTO yok, bozuk sınır, dosya yok, idempotent, yorumsuz endpoint, sayım doğruluğu)
- **Production'da race condition yakalandı** — kontrol.yml ile paralel auto-commit çakışması → `git pull --rebase` + 3x retry eklendi, canlıda yeşil

**İş 2 — 6 Belge Yazıldı ve Yüklendi** ✅ (~2 saat)
Toplam 1515 satır, hibrit dokümantasyon yapısı:

| Dosya | Satır | Manuel/AUTO | İçerik |
|---|---:|---|---|
| `README.md` | 92 | %100 manuel | Repo kapak, docs linkleri, teknoloji özeti |
| `docs/ONBOARDING.md` | 210 | %95 / %5 | Yeni yazılımcı rehberi, 30dk sistem haritası, 5 günlük plan, 10 kritik kural |
| `docs/ARCHITECTURE.md` | 395 | %80 / %20 | ASCII sistem diyagramı, 10 bölüm, 7 tasarım kararı "niye"si, Spool AI özeti |
| `docs/DATABASE.md` | 293 | %30 / %70 | Multi-tenant, RLS şablonu SQL, migration disiplini, AUTO tablo listesi |
| `docs/API.md` | 329 | %20 / %80 | Endpoint ekleme rehberi, güvenlik, tenant_id uyarıları, AUTO endpoint listesi |
| `docs/LOCAL-DEV.md` | 196 | %100 manuel | "Lokal yok, push-to-deploy" dürüst akış |

### 29. Oturumda Bitenler (borçtan düşenler)
- ✅ Devredilebilirlik Günü (28'den devir) — 6 belge + 2 motor dosyası
- ✅ `.github/package.json` fantom borç kapatıldı
- ✅ Docs-uret.yml race condition bugfix canlıda

### Bugünkü Önemli Öğrenmeler (29. Oturum)

1. **Sandbox tek process; production'da paralel workflow race condition çıkar.** docs-uret.yml ilk sürümü push öncesi rebase yapmıyordu — kontrol.yml ile aynı anda tetiklenince "non-fast-forward" reject. Sandbox'ta tek process çalıştığı için test edilemez. **Ders:** CI workflow'larına `git pull --rebase origin main && git push` retry'lı pattern'i baştan koy.

2. **Atomik commit dersi bir kez daha doğrulandı.** 6 belge tek upload'da gitti, hepsi birbirine referanslı — aşamalı atsak ara durumlarda kırık linkler olurdu. 28'in dersi 29'da uygulama buldu.

3. **"Dürüst dokümantasyon" daha faydalı.** LOCAL-DEV.md "lokal çalışmaz" diyor, yazılımcıya dürüst; varsayımsal "lokal kurulum adımları" yazsaydık yanıltıcı olurdu.

4. **AUTO sınır regex'i kendi örneğinin kurbanı olur.** ARCHITECTURE.md'deki `<!-- AUTO-START:bolumadi -->` örneği script tarafından gerçek sınır sanıldı — Türkçe karakter (`BÖLÜM_ADI`) trick'i ile çözüldü. **Ders:** Script'in kendi kurallarını dokümante ederken örneklerin parser'a yakalanmaması için eskape et.

5. **Vercel free tier günlük deploy kotası var.** Bugün sırayla 4-5 push attık, "Deployment rate limited — retry in 24 hours" yedik. CI yeşil ama Vercel kırmızı. Kod/doküman sorunu değil, plan sınırı. **Ders:** Yoğun push günü öncesi Vercel Pro'yu düşün (30+ oturum notu).

### Bekleyen Borçlar

**29'da keşfedilen yeni borçlar (yarına/30'a):**
- 🟡 **Vercel rate limit + ci-son-rapor.json auto-commit** — Vercel'i tetiklemesin diye "ignored build step" eklenmeli (30 dk)
- 🟡 **`actions/checkout@v4` + `setup-node@v4` deprecation warning** — v5'e geçiş (Node 20 deprecated), düşük öncelik
- 🟡 **Supabase `arespipe-dev` projesi** — production ayrı, bu eski deneme gibi duruyor — gözden geçir, sil veya belgelendir
- 🟢 **Fotoğraf/belge yaşam döngüsü** — Cihat'ın kaydını istediği iş: "Aktif devrede fotoğraflar/belgeler gerçek boyutta; devre tamamlanıp proje arşivine geçerken sıkıştırılıp saklanacak." **Şu an implementasyon YOK, mekanizma tasarlanmamış.** Fotoğraflar güvende (`fotograflar` tablosu + `arespipe-dosyalar` bucket'ında), sadece arşivleme-sıkıştırma kuralı henüz kodlanmamış. 30-34 aralığının birinde ele alınacak (muhtemelen 30 veya 33 ile birlikte çünkü Storage + lifecycle bağlantılı).

**Acil (30. oturum için):**
- 🔴 **Bucket PRIVATE Geçişi** (onaylı plan) — `arespipe-dosyalar` şu an PUBLIC, müşteri öncesi ŞART

**Orta vade (30-34. oturum — ALTYAPI KAPANIŞ PLANI ✅ ONAYLANDI):**
- 🔴 **30. oturum — Bucket PRIVATE geçişi + signed URL altyapısı**
- 🔴 **31. oturum — Sentry entegrasyonu** — Runtime hata toplama
- 🔴 **32. oturum — Email sistemi** — Şifre sıfırlama, Resend/SendGrid
- 🟡 **33. oturum — Staging Supabase projesi + migration runner**
- 🟡 **34. oturum — Tenant izolasyon testleri + feature flag**

**35'ten sonra ÜRÜN DÖNEMİ:**
- 🟡 Tablo Render Standardı (G-06) — 26'dan devir
- 🟡 Operasyon sayfaları %100 — Kesim/Büküm/Markalama bitirme
- 🟡 Mobil sayfalar — MProfil, MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara
- 🟡 G-05 CI lint kuralı — `.mb-*` hardcode rgba/hex yasağı
- 🟢 Audit Log pano sekmesi
- 🟢 help.html son kullanıcı dokümantasyonu
- 🟢 docs/rules/ kural ayrıştırması

### Kural Sağlık Kontrolü
- **Son self-test:** 24 Nisan 2026, 28. oturum — **4/4 başarılı** ✅
- **⚠️ Sonraki zorunlu self-test:** 33. oturum (28→33, 5 oturum)
- **Komut:** `node .github/kontrol.js --self-test`

---

## 📖 Aktif Belgeler (Yaşayan — Her Oturumda Gündemde)

### **🆕 Dokümantasyon Sistemi** (29. oturum)
Repo kökünde `README.md` + `docs/` altında 6 belge (ONBOARDING, ARCHITECTURE, DATABASE, API, LOCAL-DEV + mevcut SPOOL-AI-VIZYON, PANO-TASARIM, CIHAT-PROFIL, ROADMAP). Hibrit: manuel + AUTO sınırları.

- **Motor:** `.github/docs-uret.js`
- **Workflow:** `.github/workflows/docs-uret.yml`
- **AUTO bölümler:** `istatistikler`, `tablolar`, `endpointler`, `kurallar`
- **Kullanım:** Yeni yazılımcı `docs/ONBOARDING.md` ile başlar

### Vizyon: `docs/SPOOL-AI-VIZYON.md`
Spool AI ürün vizyonu: 7 katman, 5 faz, prototipler, AI döngüsü.
**28. oturum teyidi:** 1. katman (izometri okuma) API endpoint'i (`api/izometri-oku.js`) canlıda, Anthropic key ile çalışıyor.

### Pano Tasarımı: `docs/PANO-TASARIM.md`
Süper Admin Yönetim Panosu. 24-25. oturumda implement edildi.

### Kullanıcı Profili: `docs/CIHAT-PROFIL.md` ⚠ ZORUNLU
Her oturum başı Claude bu dosyayı okur. Cihat'a "kimsin" diye sormaz.

### Pano (canlı): `admin/panel.html`
Süper admin çalışma merkezi. Tek yerden: görev, geri bildirim, CI durumu, Sistem Sağlığı, profil, oturum geçmişi.

### CI Rapor: `.github/ci-son-rapor.json`
CI her main push'ta JSON rapor üretir. Pano Sistem Sağlığı kartı bu dosyayı okur.

### Oturum Arşivi: `docs/sessions/archive-01-22.md`
1-22. oturumların CLAUDE.md'den ayıklanmış özetleri.

### Şablonlar: `docs/templates/`
Yeni HTML sayfası ve SQL migration için başlangıç iskeletleri.

### **Yedekleme Sistemi** (27. oturum)
- **Repo:** `cihatoztas-ai/arespipe-backups` (private)
- **Workflow:** `.github/workflows/db-backup.yml` — her gece 03:00 TR, DB + Storage
- **Secrets:** `SUPABASE_DB_URL`, `SUPABASE_SERVICE_KEY`
- **Yedek yapısı:** `backups/TIMESTAMP/database.sql.gz` + `storage.tar.gz`
- **Retention:** 30 gün rolling
- **Manuel tetikleme:** Actions → Supabase Full Backup → Run workflow

### **Migrations** (27-28. oturum)
- **Klasör:** `migrations/` (arespipe ana repo)
- **Baseline:** `000_initial_schema.sql` (6029 satır, 51 tablo)
- **Kural:** `NNN_aciklama.sql` adlandırma, BEGIN/COMMIT, header yorumu
- **CI:** `kontrol.yml` (28. oturumda entegre — ayrı workflow yok)
- **Şablon:** `docs/templates/yeni-migration-sablonu.sql`
- **Kural kodları:** `MIG_ISIM_BOZUK`, `MIG_NUMARA_TEKRAR`, `MIG_HEADER_EKSIK`

### **Vercel Env Variables** (28. oturum teyit)
- `SUPABASE_URL` (public, plaintext — URL zaten public bilgi)
- `SUPABASE_SERVICE_KEY` (🔒 Sensitive — `sb_secret_*` yeni format)
- `ANTHROPIC_API_KEY` (🔒 Sensitive — `sk-ant-*`, `api/izometri-oku.js`'de kullanılıyor)
- Development ortamı Sensitive variable'larda kilitli — lokal CLI kullanılmadığı için sorun değil

### **Storage Bucket** (⚠️ 30. oturumda PRIVATE olacak)
- **Bucket:** `arespipe-dosyalar`
- **Şu anki durum:** PUBLIC — URL bilen herkes erişir
- **Kullanım:** İzometri PDF'leri, spool fotoğrafları
- **Müşteri öncesi şart:** PRIVATE + signed URL sistemi (30. oturumun konusu)

---

## Bir Sonraki Oturumda Claude Bunları Yapacak

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE ritüel:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et.
> `arespipe-backups` repo'sunda son 24 saat içinde yeni yedek düşmüş mü (03:00 TR otomatik)."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Ritüel biter bitmez `docs/CIHAT-PROFIL.md`'yi oku.**

**4. 30. OTURUMUN GÜNDEMİ — ONAYLANDI:** Bucket PRIVATE Geçişi
- Detaylı içerik: `CLAUDE-SONRAKI-OTURUM.md`
- Müşteri öncesi en kritik güvenlik adımı
- Beklenen süre: 3-4 saat

**5. Self-test bu oturumda koşturulmayacak.** Sonraki zorunlu kontrol 33. oturum.

---

## Oturum İçinde Uyulacak Disiplin

- **Kural çakışması varsa dur, sor** (A/B/C seçeneği)
- **"Hatırlıyorum" deme** — dosyaya bak
- **Yeni kural söylendiğinde 3 iş:** `kurallar.json` + kanıt + self-test
- **Komutları üst üste verme** — birer birer, açıklamalı
- **Büyük değişikliklerde tam dosya** — patch değil
- **CHECK değişiminde:** DROP → UPDATE → ADD sırası
- **FK eklerken:** Mevcut embed sorgularını `table!fk_kolonu` ile disambiguate et
- **Workflow dosyaları `.github/workflows/` altına** — kök seviyeye değil (25. oturum dersi)
- **Toplu sed öncesi tek dosyada test** — idempotent değil (25. oturum dersi)
- **Bug sorulduğunda "aslında ne arıyorsun" sor** — özellikle önceki oturumdan not varsa (26. oturum dersi)
- **Bir bug gördüğünde "kaç yerde tekrarlanabilir?" sor** — tek-düzeltme yerine denetim + sistemik çözüm (26. oturum dersi)
- **Plan değişikliği anında söyle** — seçenekleri baştan karşılaştır, uygulamadan önce onaylat (27. oturum dersi)
- **Failure anında log'u oku, iyi haberi bul** — paniğe katılma, başarıyı göster (27. oturum dersi)
- **Uzun markdown için Upload files kullan** — Create file/paste formatı bozabilir (27. oturum dersi)
- **Yeni DB değişikliği = migrations dosyası** — Supabase SQL editor'de yazıp run yeterli değil, artık dosya da oluşur (27. oturum disiplini)
- **Devralınan borcu doğrulamadan iş planlama** — 27'nin fantom README borcu gibi (28. oturum dersi)
- **Atomik commit aşamalı commit'ten güvenli** — ilişkili dosyaları tek seferde yolla (28. oturum dersi)
- **Karmaşık refactor öncesi sandbox testi zorunlu** — production push öncesi lokal simülasyon (28. oturum dersi)
- **CI auto-commit pattern'i: commit → pull --rebase → push (3x retry)** — paralel workflow race condition için (29. oturum dersi)

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
