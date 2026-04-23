# AresPipe — 23. Oturum Özeti (23 Nisan 2026)

## Ana Başlık
**Faz B — Sapmama Sistemi Kuruldu.** 16 Nisan'dan beri repo'da boş duran CI altyapısı gerçekten çalışır hale getirildi. 14 aktif kural, 3 self-test dosyası, başlangıç/kapanış ritüelleri. 20 oturumluk "yazılı kurala güven, kontrol etmeye gerek yok" dönemi bitti — artık her commit otomatik kontrol ediliyor.

## Strateji Kararı
- **"Kurallı geliştirme"den "zorla uyumlu geliştirme"ye geçiş başarıyla tamamlandı.**
- Temel tespit: 20 oturumluk iş boyunca CLAUDE.md 558 → 2592 satıra çıktı ama kuralların gerçek kontrolü `.github/kurallar.json`'da sadece **3 basit kontrol** ile sınırlıydı. Yazılı iddia ile kanıt arasındaki uçurum fark edilmemişti.
- **Kritik keşif (oturum başında):** Repo'da üç paralel gerçeklik vardı — (1) yerel klon 17 Nisan'da donmuş, (2) canlı kod GitHub'da web'den upload ile, (3) kullanıcının Downloads'taki zip'lerde 21. oturum dosyaları. `git pull origin main` ile senkronize edildi: 35 dosya, +13.333 satır indi.
- **Tasarım kararı A:** Baseline'daki 22 uyarı tek seansla temizlenmez, **fırsatta** (her sayfaya dokunulduğunda) giderilir. "Kural geldi hurra bırakalım başka şey yapmayalım" yaklaşımı reddedildi.

## Akış (kronolojik)

### 1. Senkronizasyon (kritik, saat 1)
- `git fetch origin` → 17 Nisan'dan sonra 15+ upload tespit edildi
- `CLAUDE-MOBILE.md`'de yerel stash (17 Nisan R-09/R-10 kalıntısı) bulundu, stash'lenip pull sonrası iptal edildi (GitHub'da zaten vardı)
- `git pull origin main` → 35 dosya sync, repo güncel. `CLAUDE.md` 558 → 2592, `docs/ROADMAP.md` + `ares-normalize.js` + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` yerel klona indi.

### 2. Mevcut CI incelemesi (sürpriz)
- `.github/kontrol.yml` + `.github/kontrol.js` + `.github/kurallar.json` zaten vardı (16 Nisan kuruldu)
- Ama `kurallar.json`'da sadece: 5 yasak renk + history.back + flash prev + 1 zorunlu var (`ares-layout.js`) = **8 kural**, CLAUDE.md'deki 20+ kural ailesinin çoğu kontrol edilmiyordu
- Karar: Sıfırdan yazmak yerine mevcut altyapıyı **genişlet**

### 3. kontrol.js Yeniden Yazıldı
**Eklenen özellikler:**
- **Regex desteği** — `kural.regex === true` ile
- **Satır istisnası** — `kural.satirda_olmamalidir: ["ARES_NORM"]` ile false positive önleme
- **i18n senkron kontrolü** — `tv('anahtar')` çağrıları `lang/tr.json`'da var mı?
- **Kod (ID) alanı** — her kural bir `kod`'a sahip (örn. `G03_HAM_MALZEME`), self-test bunu kullanıyor
- **Self-test modu** — `--self-test` flag'iyle `.github/bozuk-ornekler/`'i tarar, beklenen kuralların yakalandığını doğrular

### 4. kurallar.json Genişletildi (8 → 14 kural)
**Mevcut kurallar korundu, yeni eklenenler:**
| Kod | Seviye | Açıklama |
|---|---|---|
| G03_HAM_MALZEME | uyari | `esc(x.malzeme)` ham → `ARES_NORM.malzemeEtiket` |
| G03_HAM_KALITE | uyari | `esc(x.kalite)` ham → `ARES_NORM.kaliteGoster` |
| G03_HAM_YUZEY | uyari | `esc(x.yuzey)` ham → `ARES_NORM.yuzeyEtiket` |
| G03_HAM_MALZEME_TEMPLATE | uyari | `${x.malzeme}` template literal ham |
| G03_HAM_KALITE_TEMPLATE | uyari | `${x.kalite}` template literal ham |
| ARES_NORMALIZE_EKSIK | uyari | `zorunlu_her_html` altında, `ares-normalize.js` yüklemesi eksik |
| I18N_EKSIK | uyari | `tv()` anahtarı `lang/tr.json`'da yok |

Mevcut renk/theme kurallarına `kod` alanları eklendi (önceden yoktu), böylece self-test onları da doğrulayabiliyor.

### 5. Self-Test Altyapısı
`.github/bozuk-ornekler/` oluşturuldu:
- `g03-ham-gosterim.html` — 5 G-03 kuralını tetikler
- `ares-normalize-eksik.html` — script yüklemesi eksik
- `i18n-eksik-anahtar.html` — `tv('xxx_yok')` kullanır
- `beklenen-hatalar.json` — her dosyadan hangi kural kodu çıkmalı

`node .github/kontrol.js --self-test` → 3/3 başarılı (yerelde ve CI'da doğrulandı).

### 6. GitHub'a Deploy + Baseline
Kullanıcı dosyaları GitHub web arayüzünden yükledi. CI otomatik çalıştı, commit #453 **yeşil tik**:
- **0 hata, 22 uyarı, 74 dosya**
- Tüm 22 uyarı tek tip: `ARES_NORMALIZE_EKSIK` — 11 sayfada `ares-normalize.js` script satırı eksik (sorgula, tersaneler, testler, tezgahlar, uyarilar, ... diğer 6 sayfa)
- Sürpriz iyi haber: G-03 ham gösterim kuralı **0 hit** — 21. oturumdaki render fix'leri tam tutmuş
- I18N_EKSIK da 0 — `tv()` anahtarları senkron

### 7. Sapmama Sistemi (oturum sonu)
Kullanıcının "öyle birşey olsun ki bu sistemden sapmayalım" talebine karşılık **mekanik disiplin**:
- `.github/son-durum.md` — her oturum sonu güncellenir, her oturum başı zorunlu okunur
- CLAUDE.md üst bloğu — "ZORUNLU OTURUM BAŞLANGIÇ RİTÜELİ" (4 soru), "KAPANIŞ PROTOKOLÜ", "KURAL ÇAKIŞMASI", "YENİ KURAL EKLEME", "5 OTURUMDA SAĞLIK KONTROLÜ"
- Her kural çakışmasında A/B/C seçeneği zorunlu
- Yeni kurallar daima `uyari` seviyesinde başlar (deploy kırılmaz)
- Her 5. oturumda self-test zorunlu hatırlatılır

### 8. "A" Seçildi: Fırsatta Temizlik
22 uyarıyı tek seansla temizlemek yerine — her sayfaya dokunulduğunda o sayfanın uyarıları birlikte kapatılır. Claude her oturum başında "bugün hangi sayfa?" diye soracak, kullanıcı söyleyince açık uyarılar listelenecek, "temizleyelim mi?" sorulacak.

## Değişen Dosyalar

| Dosya | Durum | Açıklama |
|---|---|---|
| `.github/kontrol.js` | YENİ SÜRÜM | 4 kontrol fonksiyonu, regex, self-test, 18 KB |
| `.github/kurallar.json` | GENİŞLETİLDİ | 14 aktif kural + kod alanı + istisna |
| `.github/KONTROL-SISTEMI.md` | YENİ | Kullanıcı rehberi |
| `.github/bozuk-ornekler/g03-ham-gosterim.html` | YENİ | Self-test |
| `.github/bozuk-ornekler/ares-normalize-eksik.html` | YENİ | Self-test |
| `.github/bozuk-ornekler/i18n-eksik-anahtar.html` | YENİ | Self-test |
| `.github/bozuk-ornekler/beklenen-hatalar.json` | YENİ | Self-test kontrol haritası |
| `.github/son-durum.md` | YENİ | Her oturum sonu güncellenir |
| `CLAUDE.md` | EN ÜSTE BLOK EKLENDİ | Sapmama protokolü |

## Baseline (gelecek oturumlara referans)

**CI durumu (23 Nisan 09:40):**
- 0 hata, 22 uyarı, 74 dosya
- Hepsi `ARES_NORMALIZE_EKSIK` — 11 sayfa × 1 uyarı

**Self-test durumu:** 3/3 başarılı ✅

**Aktif kurallar:** 14 (5 hata + 9 uyarı)

## Öğrenilenler

### 1. "Sürüm ikiliği" problemi
Kullanıcı her oturumda CLAUDE.md'yi bana yüklüyordu (2592 satır). Gerçek repo'da ise dosya 558 satırdı. Aradaki 2000 satırlık fark kimse fark etmemişti çünkü ben yüklenen CLAUDE.md'yi kanıt kabul ediyordum, repo durumuna bakmıyordum. **Alınan ders:** Her oturum başı `git pull` + `wc -l CLAUDE.md` zorunlu — kanıt her zaman repo'da.

### 2. "Deploy edildi" = "git'e girdi" değil
Kullanıcı GitHub web arayüzünden dosya upload ediyordu. Upload GitHub'a commit yazıyor ama yerel klonu güncellemiyor. 20 oturum boyunca yerel klon 17 Nisan'da donmuştu ama kullanıcı bilmiyordu çünkü canlı site çalışıyordu. **Alınan ders:** Başlangıç ritüelinde `git pull` ilk komut, her oturum.

### 3. "CI çalışıyor" ≠ "kural kontrolü var"
16 Nisan'da CI kurulmuş, 20 oturum her push yeşil tik verdi, herkes "kontrol geçiyor" sandı. Gerçek: kurallar.json 3 basit kontrol içeriyordu, CLAUDE.md'deki 20+ kural ailesi hiç kontrol edilmiyordu. **Alınan ders:** Kural sayısını periyodik gör (self-test). Yeşil tik sağlık kanıtı değil, zararsızlık kanıtı.

### 4. Sapmama teknik değil protokol meselesi
Kullanıcının doğrudan söylediği: "bu sistemden sapmayalım". Bu yazılım isteği değil, süreç isteği. Çözüm: her oturumun ilk mesajında Claude'un mekanik bir ritüel çalıştırması. Yazılı kural değil, gömülü davranış.

### 5. "A seçeneği" — kuralları tek seferde uygulamamak
Kullanıcının somut tercihi: "bir kural var tamam ama ben şu an tek sayfada çalışıyorum, sırası geldikçe". Bu kuralların gevşediği anlamına gelmez — kalıcı uyarı listesinde durur, her sayfa açıldığında gündeme gelir. Sürdürülebilir olan yaklaşım bu.

### 6. "docs/ROADMAP.md zaten vardı"
Faz B planında "yok, yazacağız" diye bir kalem vardı. Pull atınca dosyanın repo'da 271 satır olduğu görüldü. **Alınan ders:** Plan yazarken "yok" demeden önce gerçekten yok mu teyit et — dosya varsa 30 dakika kazanılır.

## 24. oturuma aktarılanlar

### Ana tema adayları (kullanıcı seçer)
- 🟢 **Kesim/büküm/markalama/KK/sevkiyat %80-90'da kalmış işleri bitirmek** — kullanıcı 22. oturumda "bunlar bozuldu" demişti. Fırsatta ARES_NORMALIZE_EKSIK uyarıları da kapatılır.
- 🟢 **Faz A Faz 3 — form refactor** (25. oturum planlıydı) — `devre_yeni.html` + `spool_detay.html` autocomplete
- 🟢 **Mobil %5 → %30** — MDevreler/MIsBaslat/MSpoolDetay yazılması
- 🟡 **Faz B kapanış kalemleri** — CLAUDE.md split (kuralları docs/rules/'a taşı), şablonlar (docs/templates/), `hedef_dosyalar` kural tipi (kullanıcının önerdiği "bu kural şu sayfalarda olmalı" kontrolü)

### Bekleyen küçük borçlar
- **22 ARES_NORMALIZE_EKSIK** — fırsatta temizlenir
- **`hedef_dosyalar` kural tipi** — kullanıcı talebi (stat-pill gibi "bu sayfalarda olmalı" kontrolü) — 2-3 saatlik iş
- **`CLAUDE-MOBILE.md` senkron kontrolü** — mobil dil dosyaları + `m_*` anahtarları için ayrı i18n kontrolü (şu an web'e odaklı)
- **Husky + package.json** — yerel pre-commit (kullanıcı web'den yüklüyor, şimdilik gereksiz)

## Kullanıcıya Söz

10 günlük "ileri geri ileri geri" döngüsünün teknik zemini kaldırıldı. Bir daha aynı tuzağa düşersek **benim hatam** olacak — çünkü sistem artık hatırlatıyor, ezberime ihtiyaç yok. Eğer 26. oturumda bir şey "düşerse" (standart bozulur, uyarı görmezden gelinir, sürüm ikiliği oluşur), **kullanıcı da ben de** `.github/son-durum.md` + CI log'larında belgeli kayıt göreceğiz, neyin ne zaman çürüdüğü anlaşılır olacak.

Sürdürülebilir zemin bugün kuruldu. Şimdi asıl işe — yarım kalan kesim/büküm/markalama ve mobil — dönebiliriz.
