# Sıradaki Oturum (211) — Ajanda

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -5` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md`. Beklenen HEAD: 210 kapanış doc commit'i [skip ci] (+ bot ci).

## 1. Durum
210'da §8 Sıra 9 **ilk yarısı canlı**: yönetici Denetim görünümü. `/spool/:id` → IbSpoolDetay
mod="denetim" (MSpoolDetay emekli, dosya duruyor). Yönetici operatörle AYNI ekran + Denetim sekmesi;
tek fark yetki (footer aksiyonu yok, heat salt-okunur). Pill "Yönetici". DenetimPanel resmi
nNRenkler kuralında (0/N kırmızı, N/N yeşil, kısmi sarı). api/*.js=12 sabit. HEAD 1f2f641.

## 2. EN ÖNCELİKLİ — Sıra 9 ikinci yarısı: B köprüsü (KİLİTLİ, kod yok)
Yetkili formen (yönetici + uygun blok) Denetim ekranından oracıkta iş başlatabilsin:
- **Denetim footer'ı koşullu:** `aktifBasamakYetkili(spool.aktif_basamak, bloklar)` true ise
  "Devreye Dön" + **"Bu Spool'da İşlem Yap"**; false ise sadece "Devreye Dön".
  → ÖNKOŞUL: denetim wrapper'ı (App.jsx MSpoolDenetimSayfasi) şu an bloklar GEÇMİYOR. Wrapper'da
  `islemBloklariniGetir(kullanici.id, kullanici.tenant_id)` çağrılıp IbSpoolDetay'a `bloklar` geçilmeli.
- **"İşlem Yap" aksiyonu:** spool seed'li operatör akışına gir (QR/rolSec atla). MIsBaslat'a
  router-state seed girişi eklenmeli: location.state.seedSpool → direkt 'spoolDetay' ekranı.
  Aksiyon rolü spool'un aktif_basamak'ından türetilir (kullanıcının o basamakla eşleşen bloğu;
  yetkiliRolAdlari(bloklar) yardımcı olabilir). Operatör akışına SIFIR dokunuş, sadece yeni giriş kapısı.
- İlke: Denetim varsayılan salt-izleyici kalır (bak ≠ çalış). Mockup-first (R-10).

## 3. Temizlik
- **MSpoolDetay emekli dosya → `_arsiv/`:** route'tan koptu (App.jsx artık IbSpoolDetay host).
  `mobile/src/screens/MSpoolDetay.jsx` `_arsiv/`'e taşı (kontrol.js _arsiv/ tarar değil). Import
  artığı kalmadığını teyit et (grep MSpoolDetay).

## 4. Devreden (önceki oturumlardan)
- **Sıra 7:** MMusteri gerçek ekran — ÖNKOŞUL customers↔kullanıcı DB bağı (208 teşhisi: bağ YOK).
- **Sıra 8 (EN BÜYÜK):** Kayıt/davet akışı. §7 kararları kilitli (Spool B akışı; uygulama signUp).
- **Topbar mark animasyonu iOS Safari fix (208'den):** dokunulmadı.
- **Üyelik paketi abonelik bağı (209'dan):** MProfil statik "Kurumsal".
- **Avatar canlı teyit (209'dan):** upload + JWT tenant_id claim deploy testinde doğrulanacak.

## Disiplin (özet)
Native React. R-10 mockup-first · R-08 i18n (root lang/{tr,en,ar} üçü, satır-insert) · DATA→UI→kod
(MK-158.1) · önce mevcut kalıbı oku (MK-126.8) · kolon adı information_schema/canlı kod ile teyit (MK-85.3).
**Hafıza #10 (210 dersi):** yeni panel = mevcut/emekli komponenti oku-taşı (s.gp* + lib/format helper'lar
+ nNRenkler/formatTarih/formatSure), inline/eşik icat etme; rol farkı = "aynı ekran + sekme", ayrım
yalnız yetkide (footer/heat), kozmetik (rozet/bant) ayırma; yetki bloklar'dan gelir, mod'dan değil.
≤12 api (MK-129.3). Kod commit [skip ci] YOK · canlı test = PUSH. **Push öncesi `pull --rebase`**
(bot ci-son-rapor.json fast-forward'u reddeder; rebase çakışmasız, farklı dosya).
**Patch akışı:** Python anchor patch + .bak + ABORT-on-mismatch, esbuild (JSX) + JSON validate (lang),
container'da test → kanıtlanmış script Cihat'a. Büyük blok değişimi → base64-gömülü tek patch.
grep -c 0 dönünce && kırılır → kontrolleri ; ile ayır. `gpc` yerine ayrı commit + tek push.
