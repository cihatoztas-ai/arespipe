# CLAUDE — Oturum 207 Log

## Özet
Mobil kayıt akışı **KARAR** turu (DATA-first) + **ilk güvenli kod push**. Oturum 206 tasarım turuydu;
207 o tasarımı veriyle test edip Sıra-1'i (uygulamalar ekranı) canlıya aldı. İlk native React ekran,
mevcut akışa dokunmadan, CI yeşil push edildi.

## Akış
1. Açılış ritüeli — git temiz, `api/*.js=12` (tavanda), handoff + MOBIL-STRATEJI.md okundu.
2. **§7-1/7-2 için information_schema teşhisi** (MK-158.1 — karar öncesi veri):
   - `kullanicilar` şeması: `tenant_id NOT NULL`, `davet_eden` (var ama akış doldurmuyor), `kendi_personel` (ölü).
   - rol dağılımı: operatör 4, super_admin/kk_uzmani/yonetici/firma_admin 1'er.
   - davet altyapısı: kod tablosu/kolonu YOK; `kk_davetler` alakasız (kalite kontrol).
   - `kendi_personel × rol × email` dağılımı → hepsi false, kolon kullanılmıyor.
3. **Web kayıt akışı okundu** (`kullanicilar.html` davetGonder): `signInWithOtp(shouldCreateUser, data:{ad_soyad,rol,tenant_id})`
   + `kullanicilar.upsert(onConflict:email)`. Saf client-side, anon key, endpoint yok.
4. **Mobil envanteri** (zip): 9 ekran + olgun isbaslat seti + `lib/yetki.js` (yoneticiMi kurulu) + `lib/gruplar.js`
   (veri-modülü deseni) + `i18n.jsx` (hook = `useT()`, `tv` ondan; root lang'den build-time import).
5. **Sıra-1 üretildi** — gruplar.js + MIslemler.jsx kalıbına sadık, esbuild syntax doğrulamalı, MD5'li.
6. **Deploy:** dil script (48 anahtar) → 2 yeni dosya → App.jsx patch → `npm run build` yeşil → gpc.
7. **Hijyen fix:** mobile.zip kazara commit'e girmişti → git rm --cached + .gitignore + push.

## Kararlar (bu oturum)
- **MK-207.1** — 12-fonksiyon tavanı kısıt, mimari pusula değil. Doğru tasarım endpoint isterse Pro'ya geçilir.
  (Cihat uyarısı: "tasarruf diye yanlış yola girmeyelim" — kabul, kaydedildi.)
- **MK-207.2** — Offboarding kod tarafında zorlanamaz; sistem atıl kullanıcıyı yöneticiye görünür kılar
  (son_giris dormancy + dashboard sayaç). aktif=false + blok-silme mevcut kaldıraçlar.
- **§7-1 = B**, **§7-2 = rol='uygulama'+ortak tenant**, **§7-4 = onConflict:email bedava geçiş**, **§7-3 = customers ayrı tur**.

## Önemli yakalamalar
- `i18n.jsx` hook adı `useT()` (strateji belgesi "tv()" diyordu — doğru ama erişim `const {tv}=useT()`).
- Dil: root `lang/` canonical, `mobile/src/lang` prebuild ile üretiliyor (`rm -rf src/lang && cp ../lang/*.json`).
  → anahtarlar ROOT'a yazıldı, mobile/src/lang elle düzenlenmedi.
- `m_gunaydin/iyi_gunler/iyi_aksamlar` mobile/src/lang'de yoktu ama MIslemler fallback'le çalışıyordu → root'a eklendi.
- Cihat'ın offboarding endişesi kayıt YÖNTEMİ değil, yaşam DÖNGÜSÜ meselesi → ayrı katman olarak çerçevelendi.

## Teslim edilenler
- 4 kod/araç dosyası (uygulamalar.js, MUygulamalar.jsx, App.jsx, oturum207-dil-ekle.mjs — sonuncusu push'ta silindi).
- Commit be3d560 (kod, CI yeşil) + 658e68f (zip hijyen).
- handoff üçlüsü (bu dosya + son-durum.md + CLAUDE-SONRAKI-OTURUM.md).

## Disiplin uygulananlar
- MK-158.1 (DATA→UI→kod), MK-126.8 (önce mevcut kalıbı oku — gruplar.js/MIslemler.jsx kopyalandı, icat edilmedi).
- MK-129.3 (12 tavan korundu, Sıra-1 endpoint gerektirmedi).
- esbuild/node --check syntax doğrulama, arespipe_kopyala MD5, dil için JSON-merge (anchor'sız, idempotent).
- Kod commit `[skip ci]` YOK; doc commit `[skip ci]` VAR.
