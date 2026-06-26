# AresPipe — Son Durum (Oturum 207 kapanışı)

## Bu oturum: KARAR + İLK MOBİL KOD PUSH
Mobil kayıt akışı kararları DATA-first verildi (MK-158.1), ardından Sıra-1 güvenli push yapıldı.
Mockup onaylı (`docs/anasayfa-mockup.html`), mevcut akışı bozmayan ilk native React ekran canlıya çıktı.

## Yapılanlar
- **Veri teşhisi (information_schema + canlı dağılım):**
  - `kullanicilar.tenant_id = NOT NULL` → "tenant yok" modeli migration'sız imkânsız.
  - `kendi_personel` tüm satırlarda `false` → ÖLÜ KOLON, iç/dış ayrımı taşımıyor.
  - Web kayıt akışı (`kullanicilar.html`) = saf B: `auth.signInWithOtp` + `kullanicilar.upsert(onConflict:email)`,
    HİÇ `api/*.js` kullanmıyor → mobile'da endpoint'siz tekrarlanabilir.
  - Görünmeyen RBAC katmanı tespit edildi: `yetki_tanimlari`, `kullanici_yetkileri`, `rol_sablonlari`,
    `blok_sayfa_yetkileri`, `firma_moduller`, `feature_flags`, `tenant_features`, `customers` (müşteri için hazır).
  - `lib/yetki.js` zaten kurulu (`yoneticiMi`, `getKullaniciGruplari`); eksik: `musteriMi` + uygulama-kullanıcı tespiti.
- **Sıra-1 push (be3d560, CI yeşil):**
  - `mobile/src/lib/uygulamalar.js` — 4 uygulama sabit liste (gruplar.js deseni).
  - `mobile/src/screens/MUygulamalar.jsx` — iki modlu (route + anaSayfaModu), MIslemler s/b kalıbı, min 72px.
  - `mobile/src/App.jsx` — `/uygulamalar` route + import.
  - `lang/{tr,en,ar}.json` — 16'şar (48 toplam) yeni `m_*` anahtar (root canonical, prebuild mobile/src/lang üretir).
- **Hijyen (658e68f):** kazara commit'lenen `mobile.zip` repodan çıkarıldı + `.gitignore`'a eklendi.

## Kesinleşen kararlar (MOBIL-STRATEJI §7 kilitleri)
- **§7-1 Spool kullanıcısı kaydı = B** (yönetici davet, web OTP+upsert akışı mobile'a birebir). A (davet kodu) = park.
- **§7-2 Uygulama kullanıcısı = yeni `rol='uygulama'` + ortak "uygulama" tenant'ı** (signUp self-servis, endpoint'siz).
  Gerekçe: `tenant_id NOT NULL`'ı nullable yapmak tüm RLS'i riske atar — yeni rol = sıfır migration.
- **§7-4 Çoklu rol = bedava:** `upsert(onConflict:email)` davet gelince mevcut satırın rol+tenant'ını günceller.
- **§7-3 Müşteri:** `customers` tablosu hazır → ayrı tur.

## Yeni kararlar (KARARLAR.md'ye işlenecek)
- **MK-207.1** — 12-fonksiyon tavanı (MK-129.3) bir KISIT'tır, mimari pusula DEĞİL. Doğru tasarım yeni endpoint
  gerektiriyorsa ve konsolidasyonla yer açılamıyorsa Pro'ya geçilir. Tavanı korumak için kötü tasarıma sapılmaz.
- **MK-207.2** — Kullanıcı offboarding kod tarafında ZORLANAMAZ (süreç sorunu). Sistem atıl/pasif kullanıcıyı
  yöneticiye GÖRÜNÜR kılar: `son_giris` dormancy uyarısı + dashboard sayaç (aktif/pasif/atıl).
  Mevcut kaldıraçlar: `aktif=false` (tam kilit), `kullanici_bloklar` satır silme (uygulama kullanıcısına düşür).
  → Kayıt/davet build turuna (Sıra 8) yazıldı.

## Tespit edilen borçlar (yeni)
- Davet upsert'i `kullanicilar.davet_eden`'i YAZMIYOR (şemada var, akış doldurmuyor) — denetim izi eksik.
- `kendi_personel` ölü kolon — DROP adayı (önce kullanım taraması).

## CI / push
- Kod commit'i (be3d560) `[skip ci]` YOK → CI yeşil, bot ci-son-rapor.json (732ee05) + AUTO docs (8b8364c) geldi.
- `api/*.js = 12` (tavan korundu, endpoint eklenmedi). HEAD: 8b71a6e.
- Canlı test: /uygulamalar — ✅ DOĞRULANDI (route modu, 4 YAKINDA kartı, doğru ikon/renk, dil dosyası, geri butonu).
- Bonus tespit: yönetici dashboard'da "durdurulmuş spool var" uyarı bandı zaten kurulu → MK-207.2 dormancy sayacı bu kalıptan türetilir.

## Sonraki oturum (208) — detay CLAUDE-SONRAKI-OTURUM.md
- **Sıra 3: MAnasayfa 4 dallı router** (§4). `MUygulamalar`'ın `anaSayfaModu` prop'unu uygulama kullanıcısına bağla
  → ana-sayfa modu ilk kez canlıya çıkar. `yetki.js`'e `musteriMi` + uygulama-kullanıcı tespiti (Sıra 2) eklenir.
