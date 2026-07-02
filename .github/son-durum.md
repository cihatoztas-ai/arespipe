# AresPipe — Son Durum (Oturum 214 kapanışı)

## Bu oturum: ACİL — Gerçek firma (ARESMAK) provizyonu + proje liste gerçek-veri bağlama
Estetik cila (214'ün planı) araya giren acil işle ertelendi — HÂLÂ ÖNCELİK, başlanmadı.
Bunun yerine: süper admin'den gerçek firma açma denendi, wizard yarım/belirsiz çıktı;
onun yerine Demo Atölye config'i cerrahi klonlanarak ARESMAK tenant'ı kuruldu, 2 kullanıcı
tanımlandı, proje liste sayfası sahte hardcoded veriden temizlenip gerçek DB'ye bağlandı.

## Yapılanlar

### 1. ARESMAK tenant provizyonu (DB, SQL Editor — canlı)
- **Yeni tenant:** `9f6fe657-d339-4904-b659-17db422fc085`, kod **A**, ad "ARESMAK MAKİNA
  MÜH. İNŞ. SAN. TİC. LTD. ŞTİ.", firma_tipi=imalat, hesap_tipi=production, plan=pro,
  demo_bitis=NULL, aktif=true.
- **Config klonu — kaynak Demo Atölye** (`00000000-0000-0000-0000-000000000001`):
  basamak_tanimlari(6), firma_moduller(5), tenant_features(10), rol_sablonlari(69),
  sayac_tanimlari(7 — **son_no=0 sıfırlandı**, spool prefix/digits yapısı korundu).
  **Test verisi (spool/devre/proje) TAŞINMADI** — temiz gerçek firma.
- Klon güvenli çıktı çünkü: config tabloları **yalnızca tenants(id)**'ye bağlı (aralarında
  FK yok → id remap zinciri gerekmedi); rol_sablonlari.yetki_kodu **düz metin** (basamak
  UUID değil → gizli referans yok); yetki_bloklari demo'da zaten 0.
- Dry-run (BEGIN/ROLLBACK) → sayılar 1·6·5·10·69·7 → kalıcı apply (BEGIN/COMMIT'siz,
  otokomit) → doğrulama aynı. MK-200.5 uygulandı.

### 2. Kullanıcılar (2 kişi — Auth panel + kullanicilar insert)
- Auth kullanıcıları Supabase Dashboard > Authentication > Add user (Auto Confirm) ile
  MANUEL oluşturuldu (davet akışı DEĞİL — bilinçli, aşağıdaki 401 bug'ı yüzünden).
- **Cihat ÖZTAŞ** — cihatoztas@aresmak.com.tr — rol=firma_admin — id
  `f692c3b5-da0e-4387-b683-f26cd3fd38ab` — giriş DOĞRULANDI (canlı login başarılı).
- **Kıvanç ŞENTÜRK** — kivancsenturk@aresmak.com.tr — rol=yonetici — id
  `63cec050-3d60-44bf-9945-570d05bbc87c`. Şifresi panelden atanmadı, SQL ile atandı:
  `update auth.users set encrypted_password=crypt('123456',gen_salt('bf')),
  email_confirmed_at=coalesce(...) where id=...`. Geçici şifre 123456 — DEĞİŞTİRİLMELİ.
- kullanicilar insert deseni: `on conflict (id) do update` (trigger çakışmasına karşı).
  ad_soyad NOT NULL, tenant_id=ARESMAK, aktif=true.
- yetki_bloklari boş olduğundan blok ataması gerekmedi; firma_admin rol şablonları
  klonlandığı için admin ilk girişte tam panelle açıldı (doğrulandı).

### 3. proje_liste.html — sahte veriden gerçek DB'ye (KOD, push bekliyor)
- Teşhis: sayfanın DB bağı SIFIRDI; ~850 satır **hardcoded <tr>** (SEDEF/GEMAK/DESAN…),
  filtre/sıralama/sayfalama/export hepsi DOM üzerinde. Ekran kolonları tabloyla
  örtüşmüyordu (Başlangıç/Durum kolonu projeler'de YOK).
- Patch (Python anchor, .bak + ABORT + MARKER idempotency + node --check):
  - Hardcoded tbody boşaltıldı.
  - `projeleriYukle()`: oturum→tenant çöz → projeler (tenant filtreli) → devreler/spooller'dan
    agregat (devre sayısı, spool sayısı, ağırlık=Σdevreler.agirlik, ilerleme=avg devreler.ilerleme)
    → satırları BİREBİR AYNI 12-hücre yapıda üret → downstream makine (plFiltrele/fix*) çalışır.
  - Durum türetildi (0/yok=Başlamadı, 100=Tamamlandı, arası=Devam); projeler'de durum kolonu yok.
  - Başlangıç=olusturma, Bitiş=teslim_tarihi, Tersane=ana_yuklenici (tersane_id DEĞİL — o bozuk).
  - `silRow` → gerçek DB delete (data-proje-id). `projeyeGit` → gerçek proje id localStorage'a.
  - Boş durum (#plBos) zaten vardı, artık gerçek (ARESMAK 0 proje → "bulunamadı").
- **MD5: d484e9e0345ca66fe1ab866a5944be1c** — kopyala + gpc + Vercel + ARESMAK'ta test.

## Açık debt (215+)
- **[ÖNCELİK — devralındı] Estetik cila:** geri tuşu + geri-başlık topbar + IbSpoolDetay
  ustBant. 213'ten beri bekliyor.
- **proje ekleme/düzenleme DB yazımı:** proje_liste'de bilinçli DIŞARIDA bırakıldı (ghost
  satır riski). Ekleme formunun tersane/firma seçicisi BOZUK ("tersane kaydedemedim").
  → tersane kaydı bug'ı + proje ekle/düzenle persist birlikte ele alınacak.
- **Davet 401 (İKİ yerde):** admin/yeni-firma.html Adım4 + admin/firma-detay.html "Kullanıcı
  Davet Et" — `auth.admin.inviteUserByEmail` tarayıcıdan (anon anahtar) 401. Kök çözüm =
  **Sıra 8 (kayıt/davet akışı)**, "en büyük kalan iş". Bu iki 401 onun somut kanıtı.
- **kullanicilar.son_giris HİÇ güncellenmiyor:** auth.users.last_sign_in_at doluyor ama
  kullanicilar.son_giris NULL kalıyor → firma-detay "davet bekliyor" etiketi bundan
  yanılıyor + MK-207.2 dormant tespiti çalışmıyor. Login akışı son_giris yazmalı.
- **Yeni tenant açma reçetesi:** yeniden lazım olacak → script hazır (bu oturum). Not:
  config beyaz-liste klonu + sayaç sıfırlama + auth panel + kullanicilar insert.
- Geçici şifreler (Cihat/Kıvanç) production'da değiştirilmeli.
- Yeni i18n anahtarı `pl_delete_fail` lang/{tr,en,ar}.json'a eklenmeli (fallback çalışıyor).
- ARESMAK henüz iş akışı yetki_bloklari yok — Cihat iş akışını tanımlayınca oluşacak.

## CI / push
- Oturum başı HEAD: **b1f2b63** (213 kapanış doc [skip ci], öncesi f314465). Tree temiz,
  api/*.js=12.
- Bu oturum: **kod push'u YOK** (tüm iş DB + panel + hazırlanan patch). proje_liste.html
  patch'i Cihat'ın makinesinde kopyalanıp push edilecek (gpc, [skip ci] YOK, pull --rebase).
- api/*.js=12 korundu — yeni endpoint yok.

## Sonraki oturum (215) — detay CLAUDE-SONRAKI-OTURUM.md
- **Öncelik: estetik cila** (213'ten devir) VE/VEYA proje_liste push testi + ekleme/tersane
  bug'ı. Sonra Sıra 8 (davet 401 kök çözümü) ve son_giris fix.
