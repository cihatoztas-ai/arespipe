# AresPipe — Son Durum (Oturum 209 kapanışı)

## Bu oturum: MOBİL §8 SIRA 4→6 (Uygulamalar erişimi + dashboard + MProfil)
MOBIL-STRATEJI §8 kod planında Sıra 4, 5a, 5b ve 6 canlıya alındı. Ayrıca 5b'nin açık debt'i
(`son_giris` damgası) aynı oturumda kapatıldı. 5 kod push, hepsi CI yeşil.

## Yapılanlar (canlı, 5 push)
- **Sıra 4 (11c6eba):** `MIslemler.jsx` — işlem butonları + QR'ın altına **UYGULAMALAR** bölümü + 📚 Uygulamalar
  butonu (`/uygulamalar`). Eski `gruplar.length===0` **🔒 boş durum dalı kaldırıldı** (bloğu olmayan zaten
  router'da MUygulamalar'a gidiyor). Yeni dil anahtarı YOK (`m_uyg_basligi`/`m_uyg_basligi_alt` reuse).
- **Sıra 5a (9c21193):** `MAnasayfaYonetici.jsx` — Son Aktiviteler'in altına yönetici için ikincil
  **Uygulamalar linki** (📚 `/uygulamalar`). Yeni dil anahtarı YOK.
- **Sıra 5b (fba80b6):** `MAnasayfaYonetici.jsx` — **atıl kullanıcı bandı** (MK-207.2). "durdurulmuş spool"
  bandının ikizi: `son_giris < now()-30g` (NULL hariç), `aktif=true`. `istatistik.atil` + `Promise.all`
  kalemi + sarı bant (`> 0` iken görünür). Yeni anahtar `m_uyari_atil_kullanici` (tr/en/ar). Yeni endpoint YOK.
- **Sıra 6 (e01cb46):** `MProfil.jsx` (294 satır, YENİ) + `App.jsx` (`import` + `/profil` route + `MProfilSayfasi`
  wrapper, select'e `firma, foto_url`) + **20 i18n anahtarı × 3 dil**. Avatar (foto_url, client upload),
  bilgiler salt-okunur (ad/email/rol/firma/paket), Şifre Değiştir (resetPasswordForEmail), Hesabı Sil
  (soft-delete `aktif=false` + signOut, inline onay). MDrawer "Profili Düzenle" zaten `/profil`'e bağlıydı
  (route eksikti, şimdi tamam).
- **son_giris damgası (750f09f):** `MGiris.jsx` — başarılı `signInWithPassword` sonrası
  `kullanicilar.son_giris = now()` (fire-and-forget, girişi yavaşlatmaz). **5b debt kapandı** —
  artık atıl sayacı gerçek çalışır.

## Önemli kararlar / yakalamalar
- **Avatar upload client-side ÇALIŞIR (yeni endpoint YOK):** `arespipe-dosyalar` private ama INSERT politikası
  ("Authenticated upload" + tenant_yazma) izinli; path **`{tenant_id}/avatar/{id}.jpg`** SELECT (tenant)
  politikasıyla uyumlu. `supabase.storage.upload()` yeter; görüntüleme `dosyaUrlAl()` (mevcut signed-url
  endpoint'i). 12-fonksiyon tavanı korundu.
- **`kullanicilar.firma` text kolonu DOĞRUDAN var** → firma adı için `tenants` JOIN gerekmez (DATA teşhisi).
- **Üyelik paketi statik:** "Kurumsal" + ekranda uyarı notu. Gerçek aboneliğe bağlı DEĞİL → debt (§11).
- **Hesabı Sil = soft-delete + logout** (market şartı, MK-208.1 uyumlu); veri korunur, hard-delete yok.
- **`gpc` davranışı:** commit'i kendi yapıp "nothing to commit"te zinciri kesiyor → ayrı `git commit` + tek `gp`.

## Açık debt (210)
- **Üyelik paketi abonelik bağı (YENİ):** MProfil statik "Kurumsal" gösteriyor; abonelik altyapısı gelince bağla.
- **Sıra 9 önkoşulu:** `IbSpoolDetay.jsx` `mobile/src/screens/`'da YOK (grep "No such file"). App.jsx
  `/spool/:id` → `MSpoolDetay`. §6 çatalı bu dosya bulunmadan başlamaz — ilk iş yerini bulmak.
- **Avatar canlı teyit:** kod doğru + esbuild geçti; deploy testinde upload + görüntüleme + JWT `tenant_id`
  claim doğrulanacak (dosyaUrlAl zaten canlı çalıştığından claim büyük olasılıkla mevcut).
- **Topbar mark animasyonu iOS (208'den devreden):** 209'da dokunulmadı, hâlâ açık (§11).

## CI / push
- HEAD: bde557e (+ varsa bot ci commit'leri). api/*.js = 12 (tavan korundu, endpoint EKLENMEDİ).
- Kod commit'leri [skip ci] YOK; bu kapanış doc commit'i [skip ci] VAR.
- Push zinciri: 11c6eba → 9c21193 → fba80b6 → e01cb46 (=fc84563 push'ta) → 750f09f (=bde557e push'ta).

## Sonraki oturum (210) — detay CLAUDE-SONRAKI-OTURUM.md
- Sıra 7: MMusteri gerçek ekran — ÖNCE `customers`↔kullanıcı DB bağı kurulmalı (208 teşhisi: bağ YOK).
- Sıra 8: Kayıt/davet akışı (EN BÜYÜK) — §7 kararları kilitli.
- Sıra 9: Spool detay çatalı — önce `IbSpoolDetay.jsx` yerini bul.
- Devreden: topbar animasyon iOS fix, üyelik paketi abonelik bağı.
