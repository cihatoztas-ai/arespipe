# Sıradaki Oturum (207) — Ajanda: MOBİL KAYIT AKIŞI + İLK KOD

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -3` · `ls api/*.js | wc -l` (≤12) · `gh run list -L 1` · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md` (yaşayan belge — ANA REFERANS) + `CLAUDE-MOBILE.md` oku.

## 1. Ana referans
**`docs/MOBIL-STRATEJI.md` tüm tasarımı taşır.** Ajanda = oradaki **§7 açık kararlar**.
Mimari kapalı: **native React** (taviz yok, §0). Çatal yaklaşımı kapalı: native "Denetim" sekmesi (§6).

## 2. ÖNCE: §7-1 Kayıt akışı (en büyük karar — kodun önünü açar)
- Mevcut web'de kullanıcı ekleme nasıl yapılıyor? `information_schema` + kod kontrolü:
  `kullanicilar` (rol değerleri?), `kullanici_bloklar`, davet/kod kolonu/tablosu var mı.
- Karar: spool kullanıcısı kaydı **A (davet kodu) / B (yönetici ekler) / ikisi**.
- Uygulama kullanıcısı DB modeli: yeni `rol` mü, "tenant+blok yok" durumu mu.
- Müşteri akışı + RLS. Tek hesap çoklu rol?

## 3. İLK GÜVENLİ KOD PUSH (hiçbir karara bağlı değil)
`MOBIL-STRATEJI.md` §8 sıra 1 — mevcut akışı bozmaz, mockup onaylı (`docs/anasayfa-mockup.html`):
- `mobile/src/lib/uygulamalar.js` — sabit liste (id, ad, ikon, açıklama, durum='yakinda').
  Öğeler: Birim Çevirici, Kütüphane, Kesim Optimizasyonu, Parça Tanıma.
- `mobile/src/screens/MUygulamalar.jsx` — liste ekranı; ana sayfa modu + route modu; "yakında" toast.
- `mobile/src/App.jsx` — `/uygulamalar` route.
- `lang/{tr,en,ar}.json` — yeni `m_*` anahtarlar (R-08, üçü birden).

## 4. Sonra (kayıt kararı netleşince)
§8 sıra 2-9: `yetki.js` (`musteriMi` + uygulama kullanıcısı tespiti), 4 dallı router (MAnasayfa),
MIslemler güncelleme (Uygulamalar butonu + 🔒 kaldır), MProfil (avatar, `foto_url`+Storage),
MMusteri (mockup-first), kayıt/davet akışı (en büyük), çatal birleştirme (IbSpoolDetay Denetim sekmesi).

## Disiplin
Native React (taviz yok). R-10 mockup-first · R-08 i18n (`tv()`, tr/en/ar) · R-09 `useTema()` (direct DOM yok).
`ad_soyad` (ad değil) · tenant ayrı sorgu · `kullanici_bloklar` INSERT'te tenant_id · JWT anon key.
"M" ön eki · buton min 72px (eldivenli el) · ≤12 api (MK-129.3, kayıt endpoint'i gerekirse consolidasyon).
Kod commit `[skip ci]` YOK · doc commit `[skip ci]` VAR · canlı test = PUSH şart.
