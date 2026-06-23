# AresPipe — BRIEFING (aktif bağlam)

> MK-56.2: oturum devri için **tek** aktif bağlam dosyası. Oturum açılışında önce bunu oku.
> Güncel: Oturum 202 kapanışı.

## Ürün
Çok-kiracılı (multi-tenant) tersane boru spool imalat takip SaaS. Devreler, spool üretim takibi, izometri PDF parse, kalite kontrol, parça kütüphanesi.
- Repo: `cihatoztas-ai/arespipe` · Prod: `arespipe.vercel.app`
- Stack: Supabase/PostgreSQL + PostgREST · Vercel serverless (Hobby, **12-fonksiyon tavanı**) · vanilla JS/HTML web · React Native mobil PWA (`arespipe-mob`)
- Geliştirici: Cihat (tek). Çalışma: terse, A/B/C + net öneri, geçiştirme yok. Tek-dosya tek-executor.

## Mimari sabitler
- 12-endpoint Vercel tavanı (MK-129.3) — yeni `api/*.js` ekleme, client-side çöz.
- `izometri-oku.js` asla doğrudan değişmez (MK-49.1).
- Veri silinmez, status-set edilir (örn. `iptal`, audit notuyla).
- Tema: light-anthracite default. `--ac`#2D8EFF, `--leg`#7c3aed, `--warn`#d97706, `--gr`#16a36e, `--re`#e53e3e. Malzeme: karbon→mavi, paslanmaz→mor, bakır→amber, alüm→yeşil.

## Aktif modül: Kalite Kontrol (KK)
**Durum (Oturum 202):** Sayfa accordion → master-detail sağ drawer **bitti**; Davetiye **Liste PDF** (yatay A4, firma logosu otomatik) **bitti**; ikisi de **canlı**.
- `kalite_kontrol.html` md5: `fc7f469eaf43689808761bb7ab5f9e88`
- Üç sekme: Havuz (`aktif_basamak='on_kontrol'`) / Açık Davetiyeler / Arşiv. Satıra tıkla → sağ drawer.
- Davetiye: tersane-tek guard, KK26 sayaç. Sonuç girme: hepsi onay default, ret tiki kaldır.
- **PDF**: yazdır-tabanlı (yeni pencere + `window.print()`), devreler.html `_tabelaPdf` kalıbı. Logo `window.aresFirmaLogo()/aresLogoPrint()` (localStorage `ares_logo_firma`). Erişim: PDF Önizle (modal) · 📄 (liste satırı, `kkDavetPdf`) · Belgeler popup (`belgeListePdf`). On-demand üretim → arşivde de güncel.

**KK kilitli şema:**
- `kk_davetler.durum` ∈ {bekliyor, tamamlandi}
- `kk_davet_spooller.sonuc` ∈ {gecti, hatali, tamir, bekliyor} (MK-200.1; UI: onay→gecti, ret→tamir). Hata notu `not_` kolonu (MK-200.2).
- `kk_davet_spooller` kolonları: id, davet_id, spool_id, sonuc, not_, sonuc_ts, personel_id, foto_yolu.
- KK26 sayaç: `sayac_tanimlari` tip=kk, prefix=KK, yil_ekle=true, digits=3.
- `spooller.aktif_basamak`: …→on_kontrol→kk→sevkiyat. ET = `spooller.et_kalinligi_mm`.

## Veri/şema disiplini (özet)
- MK-96: dimensional/ağırlık değerleri 2 bağımsız kaynak; LLM üretimi reddedilir.
- MK-158.1: DATA→UI→code sırası; koddan önce şema/veri oku.
- MK-126.8: şema varsayma; `information_schema` ile doğrula.
- MK-98.2: destructive SQL'de BEGIN/ROLLBACK dry-run, sonra COMMIT.
- MK-111.2: backfill yalnız NULL alana yazar.
- MK-134.1: kod commit'i `[skip ci]` YOK; doc commit'i `[skip ci]` VAR.

## Sıradaki öncelikler
1. KK i18n anahtarları → `lang/{tr,en,ar}.json` (şu an `tvv()` TR fallback'iyle çalışıyor, kırılmaz).
2. PDF kalıcılık kararı: on-demand yeter mi, yoksa Storage snapshot mı?
3. Belgeler popup gerçek Storage bağı (galeri/not taslak).
4. spool_detay/devre_detay KK çapraz-linkleri.
5. BUG: spool_detay `aktif_basamak='kk'` sevkte görünüyor.
6. Kütüphane A11 audit (yaricap_mm, ET/A boşlukları); stainless flange FK backfill (B16.5 WN Class150).

## Ritüel
- Açılış: `git pull --rebase`, status/log, `ls api/*.js | wc -l` (12/12), bu BRIEFING + handoff oku.
- Dosya: `arespipe_kopyala <src> <dst> <md5>` (3 arg), `gpc` alias, `node --check` JS öncesi commit.
- Kapanış: 4 dosya `[skip ci]` ile — `.github/son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md`, karar logları.
- Mac: tarayıcı indirme bozuk; claude.ai artifact indirmesi çalışır (`~/Downloads` → `mv -f` → `md5 -q`). zsh interaktifte `#` yorum değil — komutlara inline yorum yapıştırma.
