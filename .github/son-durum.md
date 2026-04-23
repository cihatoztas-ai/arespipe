# AresPipe — Son Durum (her oturum sonunda güncellenir)

> Bu dosya her oturum açıldığında Claude tarafından **zorunlu olarak okunur.**
> İçeriği hafıza değil kayıt. Unutma imkansız — dosya burada.

---

## Son Oturum: 23 (23 Nisan 2026) — Faz B ✅

### CI Durumu
- **Son build:** YEŞİL ✅ (23/04/2026 09:40, commit #453)
- **Sonuç:** 0 hata, 22 uyarı
- **Taranan dosya:** 74

### Aktif Kural Sayısı
- **Hata seviyesi:** 5 (yasak renkler 3 + flash prev 1 + theme 1)
- **Uyarı seviyesi:** 9 (history.back, kumsaat, ARES_NORMALIZE_EKSIK, G03_HAM_MALZEME, G03_HAM_KALITE, G03_HAM_YUZEY, G03_HAM_MALZEME_TEMPLATE, G03_HAM_KALITE_TEMPLATE, I18N_EKSIK)
- **Zorunlu her HTML:** 2 (ARES_LAYOUT_EKSIK hata, ARES_NORMALIZE_EKSIK uyarı)
- **TOPLAM:** 14 ayrı kural aktif

### Açık Borç (24+ oturumlar temizleyecek)
- **22 adet ARES_NORMALIZE_EKSIK uyarısı** — 11 sayfada `ares-normalize.js` script satırı eksik
  - Sayfalar: sorgula, tersaneler, testler, tezgahlar, uyarilar, ...
  - **Karar (23. oturum):** A seçeneği — fırsatta temizlenir, özel seans yok
  - Her sayfaya dokunulduğunda o sayfanın uyarıları birlikte kapanır

### Bu Oturumda Yapılanlar
- `.github/kontrol.js` genişletildi: regex desteği + self-test modu + ham gösterim/i18n kontrolleri
- `.github/kurallar.json` genişletildi: 9 → 14 kural
- `.github/bozuk-ornekler/` kuruldu: her yeni kural için kanıt dosyası
- `.github/KONTROL-SISTEMI.md` yazıldı: kullanıcı rehberi
- GitHub'a yüklendi, CI yeşil, baseline çıkarıldı

### Kural Sağlık Kontrolü
- **Son self-test:** 23 Nisan 2026, 08:47 (yerelde) — 3/3 başarılı ✅
- **Sonraki self-test:** 28. oturum (5 oturum sonra) — Claude hatırlatacak

### Bekleyen Faz B Kalemleri (23. oturum kapandı, bunlar gelecek oturumlarda)
- 🟡 CLAUDE.md split (2592 satır → 600 + docs/rules/ + docs/sessions/) — 26. oturum veya sonraya
- 🟡 Şablonlar (docs/templates/yeni-sayfa-iskelet.html vs.) — 26. oturum
- 🟡 Husky + package.json (yerel pre-commit) — opsiyonel, kullanıcı web'den yüklüyor
- 🟡 `hedef_dosyalar` kural tipi (belirli sayfalarda olmalı kontrolü) — kullanıcı talebi geldi, ilk fırsatta eklenecek

---

## Bir Sonraki Oturumda Claude Bunları Yapacak (kritik)

**1. Oturum açılır açılmaz, ilk tool call'dan ÖNCE şunu söyle:**

> "Oturum başlangıç ritüeli. Şunu çalıştır ve çıktıyı yapıştır:
> ```
> cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
> ```
> Ayrıca GitHub Actions sekmesinde son build yeşil mi kontrol et."

**2. Ritüel tamamlanmadan hiçbir teknik iş başlama.**

**3. Eğer kullanıcı "atla, hemen başlayalım" derse:** 30 saniye sürer de, ısrarla ritüeli yaptır. Yetkin var — kendi söyledi: "bu sistemden sapmayalım".

**4. Ritüelden sonra:** Kullanıcı hangi sayfayı açmak istediğini söylediğinde, O SAYFANIN açık uyarılarını göster. Bu uyarıları **bugün temizleyelim mi** sor, cevaba göre hareket et.

**5. Her 5 oturumda bir self-test hatırlat:** 28, 33, 38. oturumlar. Komut: `node .github/kontrol.js --self-test`

---

## Oturumun kendisinde uyulacak disiplin

- **Kural çakışması varsa dur, sor.** Önceki kuralla yeni dediğin ters düşüyorsa kullanıcıya söyle, A/B/C seçeneği sun.
- **"Hatırlıyorum" deme.** Dosyaya bak. Bu dosya var, kurallar.json var, ARES_NORM kaynağı var.
- **Yeni kural söylendiğinde** üç iş yap: kurallar.json'a ekle + bozuk-ornekler/'e kanıt yaz + self-test koştur. "Sonra bakarım" yok.

---

_Bu dosyayı her oturum sonu Claude günceller. Kullanıcı sadece yükler._
