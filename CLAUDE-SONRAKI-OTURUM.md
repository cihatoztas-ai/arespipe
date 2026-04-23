# 26. Oturum — Gündem Seçenekleri

25. oturumda 22 uyarı sıfıra indi. CI altyapısı kurulu, Sistem Sağlığı kartı canlı. Artık altyapı değil, ürüne dönme zamanı. Ama ciddi borç kalemleri de var — hangisini öne alacağımıza Cihat karar verecek.

---

## Seçenek A: Operasyon Sayfalarını Bitirmek ⭐ (ürün odaklı, büyük değer)

**Son-durum'dan:** "Operasyon sayfaları (kesim, büküm, markalama, KK, sevkiyat) %80-90'da duruyor, bitirilmeyi bekliyor"

**Neden bu:** AresPipe'ın tersane sorununu gerçekten çözmesi için operasyon sayfaları kritik. Pano'yu, sistem sağlığını, altyapıyı bitirdik — şimdi **imalat takibi** ana değeri için o %80-90'lık yarımı kapatmak mantıklı. Bir veya iki oturum içinde %100'e çıkabiliriz.

**Ne yapılacak (önce keşif):**
- Her bir sayfanın hangi %'de durduğunu görmek için tek tek açmak
- Supabase tabloları tam mı, eksik FK/RLS var mı
- UI/UX son dokunuşlar
- Mobile responsive testi

**Tahmini süre:** 1-2 oturum (sayfa başına ~1 saat)

---

## Seçenek B: Proje Listesi + Detay Sayfası Supabase'e Bağlamak

**Son-durum'dan:** "Proje listesi + detay sayfası hâlâ Supabase'e bağlanmadı"

**Neden bu:** Eğer operasyon sayfalarından önce proje altyapısı zayıfsa, operasyonlar da eksik veriyle çalışır. Proje → Spool → Operasyon zinciri var; proje bacağı gerçek DB'ye oturmadan diğerleri sağlam durmaz.

**Ne yapılacak:**
- Mevcut proje listesi UI'ı (localStorage veya mock mu?) incele
- Supabase `projeler` tablosu şema kontrol
- CRUD operasyonları: liste + detay + oluştur + sil
- RLS tenant bazlı policy

**Tahmini süre:** 1 oturum

---

## Seçenek C: CLAUDE.md Split (23. oturum borcu)

**Son-durum'dan:** "CLAUDE.md split (2592 satır → 600 + `docs/rules/` + `docs/sessions/`)"

**Neden bu:** Her oturum başında Claude bu dosyayı okuyor. 2592 satır çok — context window'un ciddi bir kısmını tüketiyor, kendi kendini boğuyor. Split yapılırsa:
- Ana `CLAUDE.md` özetler (600 satır) — her oturumda okunur
- `docs/rules/` — her kural ayrı MD, sadece ihtiyaç olduğunda okunur
- `docs/sessions/` — oturum özetleri, Claude "bu oturumda ne yapmıştık" diye bakar

**Neden öne almamak:** Altyapı işi. Gözle görülür ürün değişmez. Ama uzun vadede her oturumu hızlandırır.

**Tahmini süre:** 1 oturum

---

## Seçenek D: Profil In-App Edit (24. oturum borcu)

**Son-durum'dan:** "Profil in-app edit (Pano'dan CIHAT-PROFIL.md düzenleme + GitHub Contents API commit)"

**Neden bu:** Şu an Cihat profilini düzenlemek için GitHub'dan `docs/CIHAT-PROFIL.md`'yi açıp editlemesi gerek. Panodan textarea ile düzenleyip GitHub Contents API üzerinden commit atmak kolaylık.

**Neden öne almamak:** Güzel özellik ama şart değil. GitHub token yönetimi (Vercel env'e koyma) ek altyapı gerektiriyor.

**Tahmini süre:** 2-3 saat

---

## Seçenek E: Mobil React Uygulamasını İlerletmek

**Son-durum'dan:** "Mobil React uygulaması %5'te kaldı (iki ekran yazıldı, geri kalan duruyor)"

**Neden bu:** Tersanede mobil kullanım kritik — imalatçı elinde telefonla çalışır. Web pano yönetim içindir, mobil app operasyon için olacak.

**Neden öne almamak:** Büyük iş. 1 oturumda bitmez, 5-10 oturum olabilir. Web tarafı tam oturmadan açmak riskli.

---

## Claude'un Önerisi

**A → B → C sırası** mantıklı:
1. **A** ürün değeri yaratır, Cihat'ı motive eder (yarım kalan şeyler biter)
2. **B** ürünün temelini sağlamlaştırır (proje bacağı oturmalı)
3. **C** altyapı borcu (bir sonraki 5-10 oturumu hızlandırır)

Ama Cihat'ın tercihi önemli. Son 10 günde ileri-geri vardı, o yüzden "somut bir şeyi bitir" hissi şimdi çok değerli. A ile başlamak bunu verir.

---

## Oturum Başında Yapılacak

1. Git pull + status + CI yeşil kontrolü (zorunlu ritüel)
2. `CIHAT-PROFIL.md` okunur
3. **Son-durum'daki "Öğrenilen Dersler (25. oturum)"u hatırla:**
   - Workflow `.github/workflows/` klasörüne
   - Sed idempotent değil — tekil test + toplu atlamanı ayarla
   - CI kuralları bağlam görmez — yorum/kod ayrımı yapmaz
4. Cihat'a bu dosyadaki seçenekleri sun → "hangisiyle başlayalım?"
5. İş sırasına göre ilerle

**Self-test hatırlatma:** 28. oturumda `node .github/kontrol.js --self-test` çalıştırılacak. 26, 27 geçilecek, 28'de Claude hatırlatır.

---

_Bu dosya her oturum sonu Claude tarafından yazılır. Kullanıcı sadece yükler ve bir sonraki oturumda Claude buradan başlar._
