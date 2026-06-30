# Sıradaki Oturum (210) — Ajanda

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md` + `CLAUDE-MOBILE.md`.
Beklenen HEAD: 209 kapanış doc commit'i [skip ci] (+ bot ci commit'leri).

## 1. Durum
209'da §8 Sıra 4→6 canlıya çıktı: MIslemler Uygulamalar butonu + 🔒 kalktı (4), MAnasayfaYonetici
Uygulamalar linki (5a) + atıl kullanıcı bandı MK-207.2 (5b), MProfil ekranı — avatar/bilgiler/şifre/hesap-sil (6).
`son_giris` MGiris'te damgalanıyor → 5b sayacı gerçek çalışır. api/*.js=12 sabit (yeni endpoint yok).

## 2. AÇIK DEBT (209'dan taşınan)
- **Üyelik paketi abonelik bağı:** MProfil'de **statik "Kurumsal"** + uyarı notu gösteriliyor. Abonelik
  altyapısı (tenant_features / paket alanı) gelince gerçek alana bağlanmalı. Kayıt akışı (Sıra 8) + ≥1 aktif
  uygulama sonrası para katmanıyla birlikte (§11, MK-208.1).
- **Avatar canlı teyit:** kod doğru + esbuild geçti ama deploy'da upload + görüntüleme + JWT `tenant_id` claim
  henüz canlı doğrulanmadı. dosyaUrlAl zaten canlı çalıştığından claim büyük olasılıkla var; ilk fırsatta teyit.
- **Topbar mark animasyonu iOS Safari fix (208'den):** 209'da dokunulmadı. Kod hazır (`MMarkLogo.jsx` +
  `arespipe-mark-anim-bk.svg`). Seçenek (A) web yöntemi + iOS teşhis, (B) statik kabul. Statiğe DÖNÜLMEDİ.

## 3. Kod planı (MOBIL-STRATEJI §8 sırası) — KALAN
- **Sıra 7:** `MMusteri.jsx` (yeni, placeholder yerine) — **mockup-first**. ÖNKOŞUL: `customers`↔`kullanicilar`
  bağı DB'de YOK (208 teşhisi). Önce o ilişki kurulmalı (customers.kullanici_id mı, kullanicilar.customer_id mı,
  yoksa iletisim_mail eşleştirmesi mi — DATA→UI→kod). musteriMi bugün hiç tetiklenmiyor.
- **Sıra 8 (EN BÜYÜK):** Kayıt/davet akışı (kod + DB). §7 kararları kilitli:
  - Spool: **B akışı** (signInWithOtp + upsert(onConflict:email), web kalıbı). `davet_eden` YAZILMALI (207 borcu).
  - Uygulama: signUp self-servis → `rol='uygulama'` + ortak "uygulama" tenant'ı (önce bu tenant'ı oluştur).
  - Kayıt endpoint'i gerekirse MK-207.1 (konsolide ya da Pro — kötü tasarıma sapma; ≤12 MK-129.3).
- **Sıra 9:** Spool detay çatalı (IbSpoolDetay'a "Denetim" sekmesi + MSpoolDetay emekli) — §6.
  **ÖNKOŞUL:** `IbSpoolDetay.jsx` `mobile/src/screens/`'da YOK (grep "No such file"). App.jsx `/spool/:id` →
  `MSpoolDetay`. İlk iş: dosyanın gerçek yerini bul (is-baslat alt-klasörü? farklı isim?), sonra çatala başla.
  ⏳ Açık alt-karar: Yönetici "Denetim" dışında işlem aksiyonu yapabilir mi (öneri: salt-izleyici başla).

## 4. Açık kararlar (MOBIL-STRATEJI §7 — bekleyen)
- §7-3 Müşteri: `customers` RLS kapsamı + kullanıcı bağı (DB'de yok, kurulmalı) — Sıra 7 önkoşulu.
- §3 Bottom nav QR butonu etiketi ("spool bul" mu?).
- §2 İlk aktif uygulama (öneri: Birim Çevirici — AI maliyeti yok).
- §6 Yönetici "Denetim" dışında işlem aksiyonu yapabilir mi?

## Disiplin
Native React (MK-206.1). R-10 mockup-first · R-08 i18n (root `lang/{tr,en,ar}` üçü birden) · R-09 useTema().
`ad_soyad` · tenant ayrı sorgu (firma kolonu DOĞRUDAN var, JOIN yok) · `kullanici_bloklar` INSERT'te tenant_id ·
JWT anon key · "M" ön eki · buton min 72px. ≤12 api (MK-129.3) — kayıt endpoint'i gerekirse MK-207.1.
DATA→UI→kod (MK-158.1) · önce mevcut kalıbı oku (MK-126.8) · MK-85.3 (kolon adı information_schema ile teyit).
Kod commit [skip ci] YOK · canlı test = PUSH.
**Patch akışı:** Python anchor patch + .bak + ABORT-on-mismatch, esbuild (JSX) + JSON validate (lang),
container'da test → kanıtlanmış script Cihat'a. Büyük dosya (>45KB / >100 satır) → arespipe_kopyala + MD5.
Lang patch'leri metin-bazlı satır-insert (json.dump DEĞİL — format korunur).
**Git:** `gpc` "nothing to commit"te zinciri kesiyor → ayrı `git commit` + tek `gp`.
