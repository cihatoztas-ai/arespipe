# CLAUDE-SONRAKI-OTURUM.md — Oturum 180 hazırlık

## Açılış ritüeli (her zamanki)
`git pull && git status && git log --oneline -3` + fonksiyon sayısı 12/12 + handoff oku.

## Kullanıcı adımı (kod hazır, beklenen)
- Ayarlar → Firma Logosu → **ŞEFFAF** ARESMAK PNG yükle. (Yüklenen dosya RGB/siyah-zemindi → beyaz antette siyah kutu çıkıyor. Şeffaf yükleyince antet düzelir.)

## Logo/marka — kalan işler (öncelik sırası)
1. **mobile/ favicon** — `mobile/index.html` + `mobile/dist/index.html` kendi `/favicon.svg`'sini kullanıyor (eski). Ayrı Vite build: `mobile/public/favicon.svg`'yi yeni amblemle değiştir + rebuild. Ayrı oturum işi.
2. **admin topbar yazı-logosu** — `⚙ AresPipe` / `AresPipe` metni (11 admin + topbar) → gerçek amblem. İkincil; favicon zaten eklendi.
3. **PWA manifest** — yok. `site.webmanifest` (uygulama adı + 192/512 ikon + `theme-color`) + `<link rel="manifest">` + `<meta name="theme-color">`. İkonlar (`icon-512` vb.) sepette hazır. Telefona "ekle"de düzgün isim+ikon, adres çubuğu marka rengi.
4. **og:image** — link önizleme görseli (opsiyonel).

## Karar gerektiren (ürün kararı)
- **White-label print:** Print antetindeki sağ AresPipe logosu her zaman SABİT (platform markası), `ares_logo_ares`'ı dinlemiyor. Belgelerde de white-label (tenant kendi markası) olsun mu, yoksa platform markası kalsın mı? Cihat kararı.

## KARARLAR.md'ye eklenecek MK notları
(Numaraları doğrula — MK-169/170/171 boşluğu da hâlâ açık; uygun numarayı ata.)

- **MK-1XX.1 — Belge anteti tek kaynak:** `aresBelgeBasligi(o)` / `aresLogoPrint(h)` / `aresFirmaLogo(h)` ares-layout.js'te `window`'a expose. Print fonksiyonları (ayrı window, `document.write`) bunları string-concat ile çağırır. Ayrı print window self-contained olmalı → asset YOLU çalışmaz; inline SVG (AresPipe) + base64 (firma logosu) kullan.
- **MK-1XX.2 — Logo renk bağlamı:** Print logosu SABİT renk (tema değişkensiz, beyaz kağıt): ring #16202B, bolts #FFFFFF, Ares #16202B, Pipe #2D6CDF, green #22A35A. Menü/hata-sayfası logosu TEMA-UYUMLU CSS değişkeni (`--sb-tx`/`--tx`, `--sb-bg`/`--bg`, `--ac`).
- **MK-1XX.3 — Menü daraltma:** Gizlenen wordmark `display:none` (opacity:0 DEĞİL). Opacity'de element flex'te yer kaplar → `justify-content:center` amblemi negatif x'e itip ekran dışına atar (amblem "kaybolur").
- **MK-1XX.4 — Tarama core rengi MAVİ (#4C8DF5):** Beyaz core (#EAF2FF) menüde/koyu temada "beyaz çizgi" olarak okunuyor; mavi olmalı.
- **MK-1XX.5 — Tenant firma logosu:** `localStorage.ares_logo_firma` (base64, ayarlar Logo Yönetimi). ŞEFFAF PNG gerekir; RGB/siyah-zemin → beyaz antette siyah kutu. Logo yoksa `ares_firma.ad/kisaAdi` metnine düşer. AresPipe override = `ares_logo_ares` (menü white-label, print'i etkilemiyor).
- **MK-1XX.6 (SÜREÇ/UYARI) — Upload bütünlüğü:** Büyük HTML upload'ları kesik gelebilir. Patch/ship ÖNCESİ `grep -c "</html>"` ile doğrula. Bu oturumda ayarlar.html kesik upload yüzünden INIT+kapanış kaybıyla deploy edildi → sonradan elle tamamlandı. Ders: her HTML çıktısında kapanış etiketi kontrolü.

## Logo-dışı açık borçlar (Cihat "şimdi" demeden açılmaz)
- **MK-117:** `yukleyen_id` null → `kuyruk-isle-izometri.js:305` "kullanici_id zorunlu" abort → izometri/NOT/alıştırma yazılmıyor. Çözüm: dosyalara user ID ata VEYA sistem upload'ları için kontrolü gevşet.
- **Gece cron (03:00 İstanbul)** ispatı — 3+ oturumdur ispatlanmadı (gündüz drenajı kuyruğu boşaltıyor).
- **`migrations/ → schema/+data/`** taşıması "marka" commit'inde bundle olmuştu → KARARLAR.md'ye not düş.
- **KARARLAR.md MK-169/170/171** boşluğu hâlâ açık.
- **IS2** terfi/promosyon animasyonu (wizard, ertelendi); **W-2.5** duplicate progress bars (görsel karar).
