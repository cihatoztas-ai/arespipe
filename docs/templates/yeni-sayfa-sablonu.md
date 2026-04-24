# Yeni Sayfa Şablonu — `yeni-sayfa.html`

> HTML sayfası açarken başlanacak minimum iskelet.
> CI'nin tuttuğu zorunlu script'ler (ARES_LAYOUT_EKSIK + ARES_NORMALIZE_EKSIK) dahil.
>
> Kullanım: Aşağıdaki kod bloğunu **tamamen kopyala**, yeni `.html` dosyana yapıştır, `SAYFA_BAŞLIĞI` ve `sayfa-icerik-buraya` yer tutucularını doldur.

## HTML İskelet

```html
<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AresPipe — SAYFA_BAŞLIĞI</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- Supabase JS -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <!-- AresPipe çekirdek (SIRA ÖNEMLİ: config → ares → normalize → layout) -->
  <script src="config.js"></script>
  <script src="ares.js"></script>
  <script src="ares-normalize.js"></script>
  <script src="ares-layout.js"></script>

  <style>
    /* Sayfa özel CSS — global tema değişkenlerini KULLAN (CSS var), hardcode renk YAZMA */
    .sayfa-wrap { padding: 16px; max-width: 1400px; margin: 0 auto; }
    .sayfa-baslik { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; color: var(--tx); margin: 0 0 16px; }
  </style>
</head>
<body>
  <!-- ares-layout.js otomatik topbar + sidebar render eder -->

  <main class="sayfa-wrap" id="anaIcerik">
    <h1 class="sayfa-baslik" data-i18n="sayfa_baslik">SAYFA_BAŞLIĞI</h1>

    <!-- sayfa-icerik-buraya -->

  </main>

  <script>
    // ── SAYFA BAŞLANGIÇ ──
    document.addEventListener('DOMContentLoaded', async function() {
      try {
        // Yetki kontrolü — hangi rol(ler) bu sayfayı görebilir?
        // ARES.sayfaYetkiKontrol(['yonetici','firma_admin','super_admin']);

        // Tema + dil yüklensin
        if (typeof ARES !== 'undefined' && ARES.init) {
          await ARES.init();
        }

        // Layout topbar + sidebar yerleştirsin
        if (typeof mInit === 'function') { mInit('sayfa-anahtar'); }

        // Sayfa-özel başlatma
        await sayfaYukle();
      } catch(e) {
        console.error('[sayfa init]', e);
      }
    });

    async function sayfaYukle() {
      // Supabase sorguları burada
      const supa = ARES.supabase();
      if (!supa || ARES.mod !== 'supabase') return;

      // Örnek tenant-scoped sorgu:
      // const res = await supa.from('ornek_tablo')
      //   .select('*')
      //   .eq('tenant_id', ARES.tenantId());
      // if (res.error) { console.warn(res.error); return; }
      // render(res.data);
    }

    // ── RENDER ──
    // G-03 kuralı: ham kod değil, ARES_NORM helper'ları ile lokalize göster
    //   malzeme → ARES_NORM.malzemeEtiket(kod)
    //   kalite  → ARES_NORM.kaliteGoster(kodOrRaw)
    //   yuzey   → ARES_NORM.yuzeyEtiket(kod)
    //   durum   → ARES_NORM.durumEtiket(kod)

    // ── TOAST (layout'tan geliyorsa gereksiz) ──
    // let toastT = null;
    // function toast(msg, tip='ok') { ... }
  </script>
</body>
</html>
```

## Kontrol Listesi (sayfa teslim öncesi)

- [ ] `ares-layout.js` ve `ares-normalize.js` script etiketleri var (CI bunları arar)
- [ ] `<html data-theme="dark">` attribute'u var (tema için)
- [ ] Tüm kullanıcıya görünür metinler `data-i18n="anahtar"` veya `tv('anahtar', 'fallback')` ile
- [ ] Yeni i18n anahtarları `lang/tr.json`, `lang/en.json`, `lang/ar.json` üçüne de eklendi
- [ ] Hardcode renk yok (sadece `var(--tx)`, `var(--sur)`, `var(--ac)`, `var(--re)`, `var(--gr)` vb.)
- [ ] Malzeme/kalite/yüzey/durum render'ında `ARES_NORM` helper'ı kullanıldı (G-03)
- [ ] Yetki kontrolü sayfa başında yapıldı (`ARES.sayfaYetkiKontrol([...])`)
- [ ] Tenant-scoped sorgularda `.eq('tenant_id', ARES.tenantId())` var
- [ ] `history.back()` kullanılmıyor (alternatif: yönlendirme)
- [ ] `setTimeout/setInterval` ile sonsuz döngü yok ("kumsaat" uyarısı)

## Test Akışı

1. Dosyayı `<sayfa-adi>.html` olarak kaydet
2. Alt-dizin sayfasıysa (örn. `admin/`, `portal/`) script yollarına `../` ekle
3. GitHub'a yükle → CI yeşil mi kontrol et
4. Vercel deploy tamamlanınca manuel test (yetki kontrol, tema değişimi, dil değişimi)

## Genişletme

Daha karmaşık sayfalar için (örn. sekme yapısı, modal, form, datalist) şu referanslara bak:
- **Sekme + alt-sekme:** `tanimlar.html`
- **Modal + form:** `spool_detay.html` (Büküm Ekle modal'ı)
- **Datalist autocomplete:** `devre_yeni.html` veya `spool_detay.html` `kaliteleriDoldur()`
- **Tablo + inlineEdit:** `devre_detay.html`
