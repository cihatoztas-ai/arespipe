# Sıradaki Oturum (215) — Ajanda

## 0. Açılış ritüeli
`git pull origin main` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l`
(≤12) · handoff oku. Beklenen HEAD: 214 kapanış doc [skip ci] (+ bot ci). **DİKKAT:**
proje_liste.html patch'i Cihat tarafından push edildiyse HEAD'de o commit de olmalı —
git log'da `proje_liste` gerçek-veri commit'ini teyit et. Edilmediyse ilk iş o.

## 1. Durum (214 kapanışı)
ACİL iş oturumu: gerçek firma ARESMAK kuruldu (tenant `9f6fe657-d339-4904-b659-17db422fc085`,
kod A, production, Demo Atölye config klonu, test verisi YOK), 2 kullanıcı (Cihat=firma_admin
giriş doğrulandı, Kıvanç=yonetici şifre 123456). proje_liste.html sahte hardcoded veriden
gerçek DB'ye bağlandı (READ+DELETE), patch teslim edildi (MD5 d484e9e0...). Estetik cila
(213+214 planı) HÂLÂ başlanmadı.

## 2. İlk iş — proje_liste push doğrulaması (edilmediyse)
- `arespipe_kopyala /Users/cihatoztas/Downloads/proje_liste.html
  ~/Desktop/arespipe/proje_liste.html d484e9e0345ca66fe1ab866a5944be1c` (ELLE yaz, yapıştırma
  — bracketed-paste ^[[200~ kirini önle).
- `gpc` (kod, [skip ci] YOK, pull --rebase). Vercel deploy.
- Test: gizli sekme, ARESMAK admin (cihatoztas@aresmak.com.tr) → proje_liste.html → boş
  liste + "bulunamadı". Demo hesap → 5 gerçek proje (DB'den, agregatlı). Bozuksa .bak geri.

## 3. En öncelikli aday — Estetik cila (213'ten devir, iki oturumdur bekliyor)
Geri tuşu + geri-başlık topbar + IbSpoolDetay ustBant. R-10 mockup-first. Detay:
docs/MOBIL-STRATEJI.md + 213 handoff. "Fonksiyonel yeterli ama beğenmedim." (Cihat)

## 4. Proje ekleme/düzenleme + tersane bug'ı (proje_liste'de açık bırakıldı)
- proje_liste ekleme/düzenleme HÂLÂ DB'ye yazmıyor (bilinçli). Ekleme formunun tersane/firma
  SEÇİCİSİ bozuk ("tersane kaydedemedim"). İkisi birlikte:
  1. tersane kaydı bug'ını bul (nereye/nasıl yazıyor, neden kaydetmiyor — DATA→UI→kod).
  2. proje ekle/düzenle → projeler tablosuna insert/update (ana_yuklenici veya düzeltilmiş
     tersane_id ile). projeKaydet zaten var (DOM); DB yazımı ekle + data-proje-id ata.
- Not: `pl_delete_fail` i18n anahtarını lang/{tr,en,ar}.json'a ekle.

## 5. Sıra 8 — Kayıt/davet akışı (EN BÜYÜK, artık iki somut kanıtı var)
Davet 401 İKİ yerde: admin/yeni-firma.html Adım4 + admin/firma-detay.html "Kullanıcı Davet
Et". Kök: inviteUserByEmail service_role ister, tarayıcıda anon var → 401. §7 kilitli
(OTP+upsert, rol='uygulama'+ortak tenant). Bu düzelene kadar kullanıcı ekleme = panel+SQL.

## 6. son_giris fix (küçük ama etkili)
Login akışı kullanicilar.son_giris'i güncellemiyor (auth last_sign_in_at doluyor). Sonuç:
firma-detay "davet bekliyor" etiketi yanılıyor + MK-207.2 dormant tespiti çalışmıyor.
Login sonrası `update kullanicilar set son_giris=now() where id=...` (veya giriş kodunda).

## 7. Devreden (küçük)
- ARESMAK/Kıvanç geçici şifreleri değiştirilsin (production).
- Ölü keyframe mDvrFadeIn (MDevreler) temizliği (213 devri).
- Yeni tenant açma "reçetesi" script olarak scripts/ altına kayıt (tekrar lazım olacak).

## Yeniden kullanılabilir: "yeni gerçek firma açma" reçetesi (214'te kanıtlandı)
1. Yeni tenant UUID üret (gerçek v4). tenants insert (kod, production, demo_bitis=null).
2. Config klonla (SADECE config, veri DEĞİL): basamak_tanimlari, firma_moduller,
   tenant_features, rol_sablonlari, sayac_tanimlari — tenant_id remap + yeni id (default) +
   **sayac son_no=0**. (Config tabloları yalnız tenants'a bağlı → remap zinciri yok.)
3. Dry-run BEGIN/ROLLBACK → sayı doğrula → kalıcı apply (BEGIN/COMMIT'siz).
4. Kullanıcı: Supabase Auth panel > Add user (Auto Confirm) → UID. Şifre panelden olmazsa
   SQL: `update auth.users set encrypted_password=crypt('sifre',gen_salt('bf')),
   email_confirmed_at=coalesce(email_confirmed_at,now()) where id='UID'` (pgcrypto).
5. `kullanicilar` insert (id=UID, tenant_id, ad_soyad NOT NULL, rol, aktif) on conflict do update.
6. giris.html'den email+şifre test.

## Disiplin (özet)
DATA→UI→kod (MK-158.1) · önce oku (MK-126.8) · kolon information_schema (MK-85.3) · migration
BEGIN/ROLLBACK dry-run→doğrula→COMMIT (MK-200.5) · ≤12 api (MK-129.3). Kod commit [skip ci]
YOK; canlı test=PUSH; push öncesi pull --rebase. Patch: Python anchor + .bak + ABORT +
MARKER-idempotency + node --check/esbuild + container test → MD5. zsh: komutları YAPIŞTIRMA,
elle yaz (bracketed-paste ^[[200~ kiri); tek satır; tırnak/parantez tuzağı; SQL'i SQL Editor'e
yapıştır, terminale değil.
