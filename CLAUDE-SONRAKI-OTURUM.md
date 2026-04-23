# AresPipe — 24. Oturum Gündemi

## 🗺️ Oturum Öncesi Not — Sistemi İlk Kez Kullanacak Oturum

**23. oturum sapmama sistemini kurdu (Faz B).** 24. oturum **ilk gerçek test.** Bu oturumda CLAUDE.md'deki "ZORUNLU BAŞLANGIÇ RİTÜELİ" Claude tarafından uygulanacak. Kullanıcı ritüelden geçecek, sonra asıl işe geçilecek.

**Eğer ritüel atlanırsa kullanıcının hakkı var:** "Ritüeli atladın, başlama" demek. Claude bunu ciddiye alacak, baştan başlayacak.

---

## 🔒 Oturum Başı — Claude'un İlk Mesajı Şu Olacak

Kullanıcının ilk mesajına verilecek cevabın **ilk 4 satırı** şu olmalı:

```
24. oturum başlangıç ritüeli. 4 kısa kontrol:

1. Şunu çalıştırır mısın ve çıktıyı yapıştırır mısın:
   cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. GitHub Actions sekmesinde son build rengi? (yeşil / sarı / kırmızı)

3. .github/son-durum.md dosyasını yükler misin veya içeriğini yapıştırır mısın?

4. Bugün hangi sayfa üzerinde çalışacağız?
```

Cevaplar gelmeden Claude başka bir şeye geçmeyecek. Kullanıcı "atla" derse Claude şöyle diyecek:

> "Ritüel 30 saniyelik iş. 23. oturumda bu sistemi birlikte sapmama için kurduk — kendin söyledin 'bu sistemden sapmayalım'. Atlamayalım, başlayalım temiz."

---

## 🎯 ANA TEMA — Kullanıcı Seçer

Kullanıcının önündeki 4 seçenek (4. soruda "bugün hangi sayfa?" cevabı kararı belirler):

### Seçenek 1 — Bitmemiş operasyon sayfaları (güçlü aday)
Kullanıcı 22. oturumda şunu demişti: *"kesim, büküm, markalama, kalite kontrol ve sevkiyat sayfaları %80-90 bitmişti bunlar bozuldu"*. Bu sayfalardan birini aç, bitir. Fırsatta o sayfadaki `ARES_NORMALIZE_EKSIK` uyarısı + varsa G-03 hitleri de kapatılır.

**İyi başlangıç sayfası:** `kesim.html` veya `bukum.html` — ikisi de 14. oturumda G-02 Hero+Pill standardına dönüştürüldü, yapı oturmuş, eksikleri 24. oturumda kapatmak mantıklı.

### Seçenek 2 — Faz A Faz 3 (25. oturum planıydı)
`devre_yeni.html` manuel kalite input → `<select>` (master + "Yeni ekle" opsiyonu). Autocomplete dropdown. Bkz. önceki CLAUDE-SONRAKI-OTURUM.md'deki plan.

### Seçenek 3 — Mobil ilerlemesi
MProfil.jsx (avatar upload), MIsBaslat.jsx (operatör iş akışı), veya MDevreler.jsx. Kullanıcı "mobil %5'te kaldı, çok üzüldüm" demişti (23. oturum). Web biraz oturduğuna göre mobile dönmek değerli.

### Seçenek 4 — Faz B kapanışı
CLAUDE.md split (2592 → 600 satır + docs/rules/), `hedef_dosyalar` kural tipi (kullanıcı talebi — "bu kural şu sayfalarda olmalı"), şablonlar. 2-3 saat.

**Öneri:** Seçenek 1 — asıl iş, uzun süredir bekliyordu. Faz B kapanışı (Seçenek 4) oturumun son 30 dakikasına bırakılabilir eğer vakit kalırsa.

---

## Claude'un Oturum Boyunca Uygulayacağı Kurallar

### 1. "Açılan sayfa" kuralı
Kullanıcı bir sayfa söyler söylemez, Claude şunu yapar:

```
# Açık uyarıları gör
node .github/kontrol.js 2>&1 | grep -A 5 "<sayfa-adi>.html"
```

Çıktıyı kullanıcıya gösterir ve şunu sorar:

> "Bu sayfada [N] açık uyarı var: [liste]. Bugünkü asıl işimiz [X]. Açılmışken bu [N] uyarıyı da düzeltirsem [~M] dakika ekler. Yap / Başka zaman?"

### 2. Yeni kural konuşması
Kullanıcı "bundan sonra hep şöyle olsun" derse Claude üç iş yapar (CLAUDE.md'de yazılı protokol):
1. `.github/kurallar.json`'a ekler (uyari seviyesinde)
2. `.github/bozuk-ornekler/` altına kanıt dosyası yazar
3. Self-test koşturur, yeşil görmeden "tamam" demez

### 3. Kural çakışması
Yeni istek eski kuralla çelişiyorsa **dur, A/B/C seçeneği sun** (CLAUDE.md protokolü).

### 4. Oturum sonu kapanışı (kritik)
Oturum kapanırken Claude bu 3 dosyayı yazar ve `present_files` ile verir:
- `.github/son-durum.md` (güncellenmiş — yeni CI durumu, aktif kural sayısı, kalan borçlar)
- `CLAUDE-SON-OTURUM.md` (24. oturum özeti)
- `CLAUDE-SONRAKI-OTURUM.md` (25. oturum gündemi)

Kullanıcıya şunu der:

> "Bu 3 dosyayı GitHub'a yükle, CI çalışsın, yeşil göresin. Sonra molana gidebilirsin."

---

## Kontrol Edilecekler

Oturum başında Claude şunları teyit eder (ritüel cevaplarından):
- [ ] `git status` temiz mi? (commitlenmemiş değişiklik yok)
- [ ] `git log` son commit 23. oturum kapanışı mı? (yoksa kullanıcı arada başka oturum yapmış olabilir — sürpriz)
- [ ] CI son build yeşil mi? (yoksa 22 uyarı + yeni hata olasılığı var)
- [ ] `son-durum.md` içinde "açık borç: 22 ARES_NORMALIZE_EKSIK" yazıyor mu? (sayının değişmesi normal — gelecek oturumlarda azalacak)

---

## 24. Oturum Başarı Kriteri

**Minimum (mutlaka olsun):**
- Ritüel çalıştı, kullanıcı atlamadı, Claude sapmadı
- En az 1 sayfada iş ilerledi (Seçenek 1-2-3'ten biri)
- CI yeşil kaldı (yeni hata eklenmedi)
- `son-durum.md` oturum sonu güncellendi

**İdeal (bonus):**
- 2-3 ARES_NORMALIZE_EKSIK uyarısı fırsatta kapandı (22 → 19-20)
- Yeni kural varsa kurallar.json'a eklendi + kanıt + self-test
- Yan not: yeni bulunan borçlar `son-durum.md`'ye yazıldı

---

## Risk Notları

### Risk 1 — Kullanıcı ritüeli gereksiz görürse
Yanıt: 23. oturumun son mesajı. Kullanıcı "bu sistemden sapmayalım" dedi. Ritüel sapmama mekanizmasıdır. Saygı ile ısrar.

### Risk 2 — Yerel klon hâlâ eski
Muhtemelen 23. oturumda git pull attıktan sonra sen güncelsin. Ama kontrol ritüelinde tekrar `git pull` var — yeni bir şey varsa iner.

### Risk 3 — CI kırmızı dönerse
23. oturum yüklemesinden sonra olmadı ama yeni bir dosya eklenirken yeni bir hata çıkabilir. Kırmızı görürse Claude önce onu çözer, sonra asıl işe geçer.

### Risk 4 — Kullanıcının CLAUDE.md'si güncel değil
Ritüel'in 1. komutu `git pull` — bu CLAUDE.md'yi de günceller. Eğer kullanıcı yeni sekmede çalışırsa (Claude.ai'da), bir önceki oturumda tartışılan sapmama protokolünden habersiz olabilir. Çözüm: Claude ritüeli uygularken sadece "bu ritüel 23. oturumda kuruldu" der, detay CLAUDE.md'de.

---

## Hazır DB Objeleri (referans — değişmedi)

```sql
malzeme_tanimlari (12 sistem + N tenant özel)
spool_malzemeleri.malzeme_ref_id FK
pipeline_malzemeleri.malzeme_ref_id FK

kategori_kod_normalize(text) → text
kalite_kod_normalize(text) → text
malzeme_ref_bul(uuid, text, text) → uuid   -- Guard 1 kaldırıldı (22. oturum)

tg_spool_malzemeleri_ref_sync
tg_pipeline_malzemeleri_ref_sync

malzeme_tanimlari_select, _insert, _update, _delete
```

## JS API (referans — değişmedi)

```js
ARES_NORM.malzemeEtiket(kod)
ARES_NORM.kaliteGoster(kodOrRaw)
ARES_NORM.yuzeyEtiket(kod)
ARES_NORM.durumEtiket(kod)
ARES_NORM.malzemeKod(raw)
ARES_NORM.kaliteKod(raw)
ARES_NORM.yuzeyKod(raw)
ARES_NORM.uyumlu(mal, yuz)
ARES_NORM.uyumluYuzeyler(mal)
ARES_NORM.marka(proje, pipeline, spool, ARES_NORM.revFmt(rev))
```

## Aktif Lint Kuralları (23. oturum sonu — referans)

**Hata (deploy durdurur):** YASAK_RENK_3B82F6, YASAK_RENK_22C55E, YASAK_RENK_0A0B0E, YASAK_RENK_10B981, YASAK_RENK_0D0F1A, FLASH_DARK, THEME_LIGHT, ARES_LAYOUT_EKSIK

**Uyarı (deploy geçer):** HISTORY_BACK, YUKLENIYOR_KUMSAAT, ARES_NORMALIZE_EKSIK, G03_HAM_MALZEME, G03_HAM_KALITE, G03_HAM_YUZEY, G03_HAM_MALZEME_TEMPLATE, G03_HAM_KALITE_TEMPLATE, I18N_EKSIK

---

## Kapanış Beklentisi (24. oturum sonu)

- CI yeşil (hata sayısı 0'da, uyarı sayısı 22'den ≤ 22)
- En az 1 sayfada somut ilerleme
- `.github/son-durum.md` güncel
- Sapmama sistemi gerçekten kullanıldı (ritüel uygulandı, açık uyarılar sorgulandı)
- 25. oturum gündemi yazıldı

Bu olursa Faz B **sadece kurulmuş değil işliyor** demektir. 10 günlük yerinde sayma gerçekten bitti.
