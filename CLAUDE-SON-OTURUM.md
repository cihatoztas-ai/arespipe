# CLAUDE — Oturum 212 Log

## Özet
Rutinler bozulup yeniden başlatılan oturum. Önceki yarım-212'de yazılan 112 migration'ın canlı oturduğu
`information_schema`/`pg_constraint` ile teyit edildi (208 blokörü kapandı). MDevreler kart tıklama
bug'ı teşhis edilip çözüldü (giriş animasyonu translateY hit-test kayması) ve canlıya alındı (f9d7429).
Sıra 7 (MMusteri) web-first stratejisiyle ertelendi. Kapanışta YENİ öncelik-1 iş tanımlandı: mobil
layout standardizasyonu (tab bar tutarsızlığı + spool detay ölü alan). **Ana ilke (Cihat):** "Baştan
doğru düzgün yapalım, yarım kalmasın."

## Akış
1. **Açılış — bozuk rutin toparlandı.** Cihat yarım kalan bir 212'yi kapatıp yeniden başlattı. git pull
   → HEAD a61979d, tree temiz. Log'da `8789599 schema: kullanicilar.customer_id (112)` görüldü —
   önceki 212'de yazılıp uygulanmış migration. Handoff dörtlüsü + MOBIL-STRATEJI okundu.
2. **112 migration teyidi (MK-200.5).** "CANLI uygulandı" commit mesajı yeterli değil; `cat` ile dosya
   okundu (additive+nullable+idempotent, RLS'e dokunmuyor). Supabase'de `pg_constraint` sorgusu →
   `kullanicilar_customer_id_fkey → customers(id)` teyitli, mevcut FK'lar sağlam. 208 blokörü kapandı.
3. **Sıra 7 mockup (R-10).** Müşteri = dış/salt-okunur/yönetici gözü. Proje başlığı + genel sevkiyat %'si
   + basamak hunisi (on_imalat→...→sevkiyat) + devre rollup (nNRenkler). Footer aksiyon YOK (müşteri
   yazma yetkisi sıfır — dış persona, operatör+sekme değil). 3 tasarım noktası + KRİTİK data açığı
   (`customer_project_access` tablosu henüz yok) soruldu.
4. **Cihat kararı: Sıra 7 ERTELE.** "Müşteri ekranı acil değil, webden yapıp buraya adapte etmek daha
   doğru." → web-first, atlandı.
5. **Yeni bug (Cihat, görsel): MDevreler tap.** Aktif Devreler'de karta tek dokunuş açmıyor, 5-6 ısrarlı
   dokunuşta açılıyor, alt kartlarda beter.
6. **Teşhis (DATA→UI→kod, MK-158.1).** grep'lerle canlı kod okundu: `devreAc` = düz `navigate`, temiz.
   Kart markup (492) `onClick` düz. 283/295 useEffect'ler = keydown + body-scroll-lock (refetch DEĞİL,
   H2 çürüdü). Gerçek neden `devreKart` stili (915): `opacity:0` + `animation: mDvrFadeIn 260ms`,
   keyframe `translateY(4px)→0` (710), inline `animationDelay: (i*45+80)ms` stagger (492). translateY'li
   giriş animasyonu hit-test bölgesini oturana kadar kaydırıyor → tap kayıyor. Alt kartta delay büyük →
   beter. `mDvrFadeIn` yalnız devreKart'ta (grep teyitli).
7. **Fix (Karar A — Cihat).** Animasyon tamamen kaldırıldı. Python anchor patch (2 anchor: devreKart
   opacity+animation satırları; inline animationDelay) + .bak + ABORT-on-mismatch + idempotency guard.
   Patch tuttu (`1 insertion, 3 deletions`). grep ile doğrulandı: `animationDelay` yok,
   `animation: mDvrFadeIn 260ms` yok. (esbuild ayrı kurulum onayı istedi + flag hatası verdi — grep
   doğrulaması + Vercel build yeterli sayıldı.)
8. **Push (f9d7429).** Kod commit [skip ci] YOK. pull --rebase → push. Deploy sırasında kapanışa geçildi.
9. **Yeni öncelik-1 iş belirlendi (Cihat, 3 görsel).** İş Başlat tab bar VAR, Yönetici anasayfa YOK,
   spool detay tab bar YOK + alt kocaman ölü alan. "Genel tasarım problemi, hepsini standarda getirmek
   lazım." → 213 ana işi: mobil layout standardizasyonu. Cihat: "Baştan doğru düzgün, yarım kalmasın."
10. **Kapanış.** 4 handoff dosyası hazırlandı.

## Kararlar / öğrenmeler
- **112 migration = "CANLI uygulandı" iddiası doğrulandı.** MK-200.5 disiplini işledi: commit mesajı
  değil, `pg_constraint`/`information_schema` teyit etti. Yarım kalan oturumdan devralınan işte bu
  kritik — iş kaybı yoktu, ama doğrulamadan üstüne kurmak riskliydi.
- **MDevreler tap bug'ı = giriş animasyonu translateY hit-test kayması.** "Handler temizse sorun
  handler'da değil" — event'in elemana ulaşmasına bak. translateY'li mount animasyonu + stagger delay,
  iOS'ta tap'i düşürüyor. Ders: mount animasyonları transform yerine sadece opacity ile yapılmalı
  (ya da hiç), yoksa tıklanabilir kartlarda hit-test kayması olur. (Aynı aile: 211 auto-open —
  görünen durum ≠ gerçek durum.)
- **Sıra 7 web-first.** Karmaşık yeni persona ekranı önce web'de olgunlaşsın, mobile'a adapte edilsin;
  mobile'da sıfırdan tasarlamak yerine kanıtlanmış web akışını taşımak daha az risk.
- **Layout standardizasyonu bir sonraki oturumun tek ana işi.** Tek tek ekran yamamak yerine ortak
  shell (MLayout). R-10: önce iskelet mockup'ı. Cihat'ın "yarım kalmasın" direktifi = kapsamı tam
  çöz, parça parça bırakma.

## Teslim edilenler
- 1 kod push: f9d7429 (MDevreler kart giriş animasyonu kaldırıldı — tap hit-test fix).
- 112 migration canlı teyidi (kod değişikliği yok, doğrulama).
- MMusteri mockup (onaylanmadı — Sıra 7 ertelendi).

## Disiplin uygulananlar
- MK-200.5 (migration information_schema/pg_constraint teyidi). MK-158.1 (DATA→UI→kod, H1/H2 ayrımı
  kod okuyarak). MK-126.8 (devreKart tanımı + kullanım grep'le okundu, anchor birebir). MK-85.3
  (projeler/customer_project_access tablo adları ezberden değil sorgu ile — Sıra 7 önkoşulunda).
- R-10 (MMusteri mockup — visualizer). Python anchor patch + .bak + ABORT-on-mismatch + idempotency.
- Kod commit [skip ci] YOK; kapanış doc [skip ci] VAR. Push öncesi pull --rebase. api/*.js=12.
