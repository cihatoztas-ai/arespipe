# Sıradaki Oturum (208) — Ajanda: 4 DALLI ROUTER + UYGULAMA KULLANICI MODELİ

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -3` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md` (ANA REFERANS) + `CLAUDE-MOBILE.md` oku.

## 1. Durum
207'de Sıra-1 (uygulamalar ekranı) canlıya çıktı, CI yeşil. `/uygulamalar` route modu çalışıyor.
`MUygulamalar`'ın **anaSayfaModu** prop'u kodda var ama HENÜZ hiçbir yerden çağrılmıyor — onu 208 bağlar.

## 2. ÖNCE: Sıra 2 — yetki.js genişlet (kodun önünü açar)
`lib/yetki.js` zaten `yoneticiMi` + `getKullaniciGruplari` taşıyor. Eklenecek:
- `musteriMi(kullanici)` — `customers` tablosuyla bağ (önce information_schema: kullanıcı↔customer ilişkisi nasıl?).
- **Uygulama kullanıcısı tespiti** — §7-2 kararı: `rol==='uygulama'` mi, yoksa "bloğu yok + müşteri değil" türetmesi mi?
  Karar 207'de "yeni rol='uygulama'" idi → `uygulamaKullanicisiMi(k) = k.rol==='uygulama'`. Ama DB'de henüz
  böyle rol YOK (canlı dağılım: operatör/super_admin/kk_uzmani/yonetici/firma_admin). Router'da güvenli varsayılan:
  bloğu yok + müşteri değil + yönetici değil → uygulama kullanıcısı (rol kolonu boş olsa bile çalışır).

## 3. Sıra 3 — MAnasayfa 4 dallı router (§4, ana iş)
Mevcut `MAnasayfa.jsx` tek dallı (herkes aynı yere). MOBIL-STRATEJI §1 router sırası:
```
yönetici  → dashboard (MAnasayfaYonetici — zaten var)
müşteri   → MMusteri (henüz yok → Sıra 7, mockup-first; şimdilik placeholder)
bloğu var → MIslemler (+ Uygulamalar butonu)
diğer     → <MUygulamalar anaSayfaModu /> (uygulama kullanıcısı, ara buton yok)
```
- `MUygulamalar` route modu zaten çalışıyor; burada **anaSayfaModu=true** ile kullanıcı prop'u geçilecek.
- Eski "🔒 yetki tanımlanmamış" ekranı KALKAR (bloğu olmayan = uygulama kullanıcısı, hata değil).
- `App.jsx` MIslemlerSayfasi gibi MAnasayfa'ya kullanıcı çekme deseni gerekebilir (session.user.id → kullanicilar).

## 4. Sonra (sıra)
- Sıra 4: `MIslemler` — "Uygulamalar" butonu ekle (spool kullanıcısı için ikincil), 🔒 boş durum kalkar.
- Sıra 5: `MAnasayfaYonetici` — Uygulamalar linki + (MK-207.2) atıl kullanıcı sayacı adayı.
- Sıra 6: `MProfil` (avatar, foto_url + Storage bucket arespipe-dosyalar) — mockup-first.
- Sıra 7: `MMusteri` (yeni) — mockup-first, customers RLS.
- Sıra 8: **Kayıt/davet akışı (EN BÜYÜK)** — §7 kararları kilitli, kod+DB:
  - Spool: B akışı (signInWithOtp+upsert, web kalıbı). davet_eden YAZILMALI (207 borcu).
  - Uygulama: signUp self-servis → rol='uygulama' + ortak "uygulama" tenant'ı (önce bu tenant'ı oluştur).
  - MK-207.2 offboarding görünürlüğü (son_giris dormancy + dashboard sayaç).
- Sıra 9: Spool detay çatalı (IbSpoolDetay'a "Denetim" sekmesi + MSpoolDetay emekli) — §6.

## 5. Açık kararlar (MOBIL-STRATEJI §7 — hâlâ bekleyen)
- §7-5 Yönetici dashboard içeriği (Cihat: netleşmedi) — MK-207.2 sayacı buraya oturabilir.
  NOT (207 canlı tespit): dashboard'da "durdurulmuş spool var — detayları inceleyin" uyarı bandı ZATEN kurulu.
  Atıl kullanıcı (son_giris dormancy) sayacı sıfırdan değil, bu uyarı bandının kalıbından türetilir.
- §3 Bottom nav QR butonu etiketi ("spool bul" mu?).
- §6 Yönetici "Denetim" dışında işlem aksiyonu yapabilir mi?

## Disiplin
Native React (taviz yok, MK-206.1). R-10 mockup-first · R-08 i18n (`useT().tv`, root lang üçü birden) · R-09 `useTema()`.
`ad_soyad` · tenant ayrı sorgu · `kullanici_bloklar` INSERT'te tenant_id · JWT anon key · "M" ön eki · buton min 72px.
≤12 api (MK-129.3) — kayıt endpoint'i gerekirse **MK-207.1**: konsolide et ya da Pro'ya geç, kötü tasarıma sapma.
DATA→UI→kod (MK-158.1) · önce mevcut kalıbı oku (MK-126.8). Kod commit `[skip ci]` YOK · doc commit VAR · canlı test = PUSH şart.
