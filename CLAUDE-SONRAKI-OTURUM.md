# Sıradaki Oturum (213) — Ajanda

## 0. Açılış ritüeli
`git pull origin main` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md` + `docs/CLAUDE-MOBILE.md` §9 (layout kuralları).
Beklenen HEAD: 212 kapanış doc commit'i [skip ci] (+ bot ci). Öncesi f9d7429 (MDevreler tap fix).

## 1. Durum (212 kapanışı)
- **112 migration canlı** — `kullanicilar.customer_id` FK → customers(id) teyitli. 208 blokörü kapandı.
  Sıra 7 önkoşulunun DB tarafı hazır; ama `customer_project_access` tablosu HENÜZ YOK (2. yarı).
- **MDevreler tap bug ÇÖZÜLDÜ (f9d7429)** — kart giriş animasyonu (translateY) hit-test kaydırıyordu,
  animasyon tamamen kaldırıldı. Deploy testi Cihat'ta (tek dokunuşta açılıyor mu — teyit et).
- **Sıra 7 (MMusteri) ERTELENDİ** — web-first (Cihat kararı).
- api/*.js=12 sabit.

## 2. EN ÖNCELİKLİ — Mobil layout standardizasyonu (Cihat: "baştan doğru, yarım kalmasın")
**Problem (212'de 3 görselle tespit):** Ekranlar ortak bir layout iskeletini paylaşmıyor.
- **MIsBaslat:** altta tab bar (Ana Sayfa / Ara / Bildirim / Menü) VAR.
- **MAnasayfaYonetici:** aynı tab bar YOK.
- **Spool detay (IbSpoolDetay / spool ekranı):** tab bar YOK + altta **kocaman ölü boşluk** (içerik
  100dvh flex iskeletine oturmamış).

**Adım adım (DATA→UI→kod, MK-158.1 — körlemesine dokunma):**
1. **HARİTALA (kod oku, tahmin etme):** Hangi ekran tab bar'ı nereden alıyor? grep ile bul:
   - `grep -rln "Ana Sayfa\|Bildirim\|tabBar\|TabBar\|navBar\|BottomNav\|Menü" mobile/src/`
   - Tab bar ayrı komponent mi (örn. `MTabBar`/`MAltMenu`) yoksa her ekranda inline mi?
   - Hangi ekranlar onu render ediyor, hangileri etmiyor? Router (App.jsx) shell/layout wrapper var mı?
   - Spool detay ölü alan: `100dvh` flex iskeleti (`flex:1 + overflow-y:auto` scroll alan) uygulanmış mı,
     yoksa içerik sabit yükseklikte kalıp altı boş mu? (CLAUDE-MOBILE §9 kalıbı ile kıyasla.)
2. **KARAR KURALI (Cihat'a A/B):** Tab bar hangi ekranlarda görünsün?
   - Ana ekranlar (Anasayfa, İş Başlat/İşlemler, Ara, Bildirim, Menü) → tab bar VAR.
   - Detay/wizard ekranları (spool detay, devre detay, İş Başlat wizard adımı) → tab bar GİZLİ, geri
     butonu yeterli. (Kesin kararı Cihat verir.)
3. **R-10 MOCKUP:** Standart iskelet mockup'ı — (a) topbar, (b) scroll içerik (flex:1, overflow-y:auto),
   (c) tab bar (koşullu). Ölü-alan çözümü: içerik alanı flex:1 ile tüm boşluğu doldurur; kısa içerikte
   alt boşluk normal, ama tab bar/safe-area doğru oturur. Cihat onaylamadan kod YOK.
4. **TEK ORTAK MLayout:** Onaylı iskeletten `MLayout` (veya mevcut shell'i düzelt). Prop: `tabBarGoster`
   (bool) veya route-temelli otomatik. Tüm ekranlar buna geçirilir — tek tek yamamak yerine tek kaynak.
   Hafıza #10: mevcut stil objelerini/helper'ları oku-taşı, inline/yeni iskelet icat etme; CLAUDE-MOBILE
   §9 kalıbını (100dvh flex, scrollbar gizle, safe-area padding) referans al.
5. **Migrasyon:** Ekranları teker teker MLayout'a geçir; her birinde teslim listesi (§10) kontrol.
   Büyük iş olabilir — kapsamı Cihat ile böl ama "yarım kalmasın" ilkesiyle mantıklı bir bütün bitir.

**Not:** Bu iş IbSpoolDetay'ı da etkiler (211'de bifurcate edilmişti). Ölü alan orada; layout'u
düzeltince footer/tab bar davranışı da netleşir. IbSpoolDetay footer'daki "İşlem Yap" köprüsü (9b) korunur.

## 3. Alternatif / sonra
- **Sıra 8 — Kayıt/davet akışı (EN BÜYÜK):** §7 kilitli (§7-1 OTP+upsert, §7-2 rol='uygulama'+ortak
  tenant, §7-4 çoklu rol serbest). Kod+DB birlikte. Layout işinden bağımsız.
- **Sıra 7 — MMusteri (web-first):** DB önkoşulu 2. yarısı `customer_project_access` (113 migration) +
  web ekranı olgunlaşınca mobile'a adapte. Ertelendi.

## 4. Devreden (küçük)
- Ölü keyframe `mDvrFadeIn` (MDevreler:710) temizliği.
- Topbar mark animasyonu iOS Safari (208'den): SMIL beginElement() tutmuyor; kod duruyor.
- Üyelik paketi abonelik bağı (209'dan): MProfil statik "Kurumsal".
- Avatar canlı teyit (209'dan): upload + JWT tenant_id claim deploy testinde.

## Disiplin (özet)
Native React. R-10 mockup-first · R-08 i18n (root lang/{tr,en,ar}, tv(), satır-insert) · DATA→UI→kod
(MK-158.1, iki-adım teşhis: hipotezi kod okuyarak doğrula) · önce mevcut kalıbı oku (MK-126.8) · kolon/
tablo adı information_schema/canlı kod ile teyit (MK-85.3) · migration BEGIN/ROLLBACK dry-run →
information_schema teyit → COMMIT (MK-200.5). **Hafıza #10:** yeni panel/layout = mevcut komponenti
oku-taşı (s.* stil objeleri + lib/format helper'lar + CLAUDE-MOBILE §9 layout kalıbı), inline/iskelet
icat etme. ≤12 api (MK-129.3). **Kod commit [skip ci] YOK** · canlı test = PUSH · **push öncesi
pull --rebase** (bot ci-son-rapor.json fast-forward'u reddeder). **Patch akışı:** Python anchor patch +
.bak + ABORT-on-mismatch + MARKER-idempotency (yeni ⊃ anchor tuzağı), JSX doğrulama (mobile/node_modules
içi esbuild transformSync — ayrı `npx esbuild` KURMA, onay ister + flag hatası verir) + JSON validate
(lang), container'da test → kanıtlanmış script Cihat'a. `gpc` yerine ayrı commit + tek push.
