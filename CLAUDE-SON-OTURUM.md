# CLAUDE — Oturum 209 Log

## Özet
MOBIL-STRATEJI §8 kod planı Sıra 4→6 canlıya alındı (Uygulamalar erişimi operatör+yönetici, yönetici
dashboard atıl sayacı, MProfil ekranı). 5b'nin `son_giris` debt'i aynı oturumda kapatıldı. 5 kod push,
hepsi CI yeşil. Yeni endpoint yok (api/*.js=12 sabit).

## Akış
1. Açılış ritüeli — git temiz, HEAD a6c9e16 (208 kapanış), api/*.js=12. Handoff üçlüsü + MOBIL-STRATEJI okundu.
   Yakalama: handoff "MK-208.1 MOBIL-STRATEJI'ye işlenmedi" diyordu ama §11'de zaten doluydu → tekrar yazılmadı.
2. **Sıra 4 (MIslemler):** DATA okundu — `/uygulamalar` route hazır, `m_uyg_basligi`/`_alt` anahtarları mevcut.
   🔒 boş-durum dalı kaldırıldı (router zaten bloğu olmayanı MUygulamalar'a yolluyor), QR'ın altına Uygulamalar
   bölümü. Yeni anahtar gerekmedi. esbuild + Python anchor patch.
3. **Sıra 5a (MAnasayfaYonetici):** Son Aktiviteler'in altına Uygulamalar linki. `uygLink` stilleri (uygIkon
   arka planı `var(--sur2)` — `${renk}22` template'i düz string'de geçersiz olurdu). esbuild geçti.
4. **Sıra 5b (atıl bandı):** DATA→ `kullanicilar.son_giris` (timestamptz) VAR; `silindi` YOK → `aktif` kullan
   (MK-85.3). Canlı sorgu: tenant'ta atil_30g=0, hic_girmemis=8 (hepsi NULL — son_giris hiç damgalanmamış).
   Karar A (30g, NULL hariç). Promise.all kalemi + bant (`var(--warn)`). m_uyari_atil_kullanici 3 dil.
5. **Sıra 6 (MProfil) — mockup-first:** 2 mockup turu. Kapsam Cihat ile netleşti: ad_soyad da salt-okunur
   (Kaydet kalktı), Şifre Değiştir + Hesabı Sil (market şartı) eklendi, Üyelik Paketi (statik). DATA: avatar
   upload RLS politikaları okundu → client upload çalışır, yeni endpoint yok. `firma` kolonu doğrudan var.
   MProfil.jsx (294) + App.jsx (route+wrapper) + 20×3 i18n. arespipe_kopyala (MD5) + esbuild + JSON validate.
6. **son_giris damgası (MGiris):** Cihat "5b sayacı son_giris yazılmadan hep 0 kalır" debt'ini kapatmak istedi.
   signInWithPassword başarılı dalına fire-and-forget update. 5b debt kapandı.
7. **Atıl sayacı tartışması:** Cihat "30 gün giren tekrar mı kayıt olacak?" diye sordu → kavram netleşti
   (atıl ≠ tekrar kayıt; sadece yöneticiye görünürlük sinyali). Kalsın kararı.

## Kararlar / öğrenmeler
- Avatar upload client-side (path `{tenant_id}/avatar/{id}.jpg`) → RLS geçer, endpoint yok (12-tavan korundu).
- `kullanicilar.firma` doğrudan var → tenants JOIN gerekmez.
- Hesabı Sil = soft-delete (`aktif=false`) + signOut; veri korunur (market şartı + veri-asla-silinmez kuralı).
- Üyelik paketi statik "Kurumsal" + uyarı notu → abonelik debt (§11).
- `gpc` ayrı commit yapıp "nothing to commit"te zinciri kesiyor → ayrı commit + tek `gp`.
- Çift-uygulanan Python anchor patch 0 bulup ABORT eder (zararsız, dosya bozulmaz — MK-111.2).
- Lang patch'leri metin-bazlı satır-insert (json.dump değil) → format korunur, +N satır temiz diff.

## Teslim edilenler
- 5 push: 11c6eba (Sıra 4), 9c21193 (5a), fba80b6 (5b), e01cb46 (Sıra 6 — MProfil), 750f09f (son_giris).
- MProfil.jsx YENİ. App.jsx route+wrapper. lang tr/en/ar: +1 (atıl) +20 (profil) = 21 anahtar/dil.
- Kapanış üçlüsü + MOBIL-STRATEJI güncellemesi (kesintisiz, sadece 209 değişiklikleri).

## Disiplin uygulananlar
- MK-158.1 (DATA→UI→kod: her ekranda önce şema/RLS/kalıp okundu). MK-85.3 (silindi yok→aktif).
- MK-126.8 (MIslemler/MAnasayfaYonetici/MDrawer/App.jsx/dosya.js okundu yazmadan önce).
- MK-129.3 (api=12 korundu, yeni endpoint yok). MK-51.1 (MProfil MD5'li kopya).
- R-08 (i18n 3 dil), R-10 (MProfil mockup-first 2 tur). Python anchor patch + .bak + esbuild + JSON validate.
- Kod commit [skip ci] YOK; kapanış doc commit [skip ci] VAR.
