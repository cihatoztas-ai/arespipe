# Sıradaki Oturum (212) — Ajanda

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md`. Beklenen HEAD: 211 kapanış doc commit'i [skip ci] (+ bot ci).

## 1. Durum
§8 Sıra 1–6 + 9 + **9b CANLI (211)**. Spool detay çatalı tam bitti:
- `/spool/:id` → IbSpoolDetay `mod="denetim"` (yönetici, operatörle aynı ekran + Denetim sekmesi + "Yönetici" pill).
- **B köprüsü:** Denetim footer'da `yetkili && "Bu Spool'da İşlem Yap"` → düz `/islemler` (operatör işlem
  seçer + QR okutur; **seed-spool İPTAL**, MIsBaslat'a dokunulmadı). Gate `aktifBasamakYetkili(aktif_basamak, bloklar)`.
- Auto-open timing fix (peek drawer açılışta açık — useRef, id başına 1 kez). MSpoolDetay → `_arsiv/`.
HEAD 402eafd civarı (8b930a3 + bot ci). api/*.js=12 sabit.

## 2. EN ÖNCELİKLİ — Sıra 7: MMusteri.jsx (mockup-first)
Placeholder yerine gerçek müşteri ekranı. **ÖNKOŞUL (208 teşhisi): `customers`↔`kullanicilar` DB bağı YOK.**
- Önce DATA: `information_schema` ile `customers` ve `kullanicilar` şemasını + aradaki FK/join yolunu teşhis et
  (MK-85.3 — kolon adı tahmin etme). Bağ yoksa migration gerekir (BEGIN/ROLLBACK dry-run → information_schema
  teyit → COMMIT; sıralı numara ~110+).
- Bağ kurulunca R-10 mockup → müşteri ne görecek (proje takip, salt-okunur spool durumu — §7-3).
- İlke: müşteri hem web hem mobilden girer, kimlik platform-bağımsız (MK-208.1).

## 3. Alternatif — Sıra 8: Kayıt/davet akışı (EN BÜYÜK)
§7 kararları kilitli: §7-1 admin davet OTP+upsert · §7-2 rol='uygulama' + ortak tenant · §7-4 çoklu rol serbest.
Kod + DB birlikte. Sıra 7'den bağımsız başlanabilir; hangisi önce → Cihat seçer (A/B).

## 4. Devreden (önceki oturumlardan)
- **Topbar mark animasyonu iOS Safari fix (208'den):** SMIL beginElement() iOS'ta tutmuyor; kod duruyor, dokunulmadı.
- **Üyelik paketi abonelik bağı (209'dan):** MProfil statik "Kurumsal".
- **Avatar canlı teyit (209'dan):** upload + JWT tenant_id claim deploy testinde doğrulanacak.

## Disiplin (özet)
Native React. R-10 mockup-first · R-08 i18n (root lang/{tr,en,ar} üçü, satır-insert) · DATA→UI→kod
(MK-158.1, iki-adım teşhis: hipotezi kod okuyarak doğrula) · önce mevcut kalıbı oku (MK-126.8) · kolon adı
information_schema/canlı kod ile teyit (MK-85.3). **Hafıza #10:** yeni panel = mevcut/emekli komponenti
oku-taşı (s.gp* + lib/format helper'lar), inline/eşik icat etme; rol farkı = "aynı ekran + sekme", ayrım
yalnız yetkide; yetki bloklar'dan gelir, mod'dan değil. ≤12 api (MK-129.3). Kod commit [skip ci] YOK ·
canlı test = PUSH. **Push öncesi `pull --rebase`** (bot ci-son-rapor.json fast-forward'u reddeder).
**Patch akışı:** Python anchor patch + .bak + ABORT-on-mismatch + **MARKER-idempotency** (yeni ⊃ anchor
tuzağına dikkat), esbuild (JSX) + JSON validate (lang), container'da test → kanıtlanmış script Cihat'a.
`gpc` yerine ayrı commit + tek push. grep -c 0 dönünce && kırılır → ; ile ayır.
