# AresPipe Kontrol Sistemi — Kullanıcı Rehberi

## Sistem ne yapar (tek cümleyle)

GitHub'a kod yüklediğinde otomatik olarak çalışan bir **kural kontrolüdür**. Hata varsa Vercel'e deploy olmaz, GitHub sayfasında kırmızı çarpı görürsün.

## Üç seviye: hata / uyarı / temiz

| Seviye | Ne olur | Örnek |
|---|---|---|
| **Hata** | Deploy durur, kırmızı çarpı | Yasak renk `#3b82f6` kullanılmış |
| **Uyarı** | Deploy devam eder, sarı bayrak | `tv('yeni_anahtar')` var ama lang dosyasına eklenmemiş |
| **Temiz** | Deploy olur, yeşil tik | Hiçbir ihlal yok |

Yeni eklenen kurallar **uyarı** olarak başlar. 1-2 oturum gözlem sonrası sağlam çalıştıkları görülürse hataya çevrilir. Bu, "kural koydum tüm deploy kırıldı" senaryosunu önler.

---

## Kim ne yapar

### Kullanıcı (sen)

**Oturum başında 30 saniye:**
```
cd ~/Desktop/arespipe
git pull origin main
git status
```

**Oturum sırasında:** Hiçbir şey. Normal akış.

**Oturum sonunda:**
- GitHub'a dosyaları yükle
- GitHub sayfasında "Actions" sekmesine bak — yeşil tik mi, kırmızı çarpı mı?
- Kırmızı ise Claude'a söyle: "CI kırıldı, bak". Çıktıyı kopyala-yapıştır.

### Claude (ben)

- Yeni kural eklerken: önce `kurallar.json`'a kod yazıyorum, sonra `bozuk-ornekler/` altına kasten bozuk dosya yazıyorum, sonra self-test çalıştırıyorum. Yeşil görmeden "tamam" demiyorum.
- Kural çakışması olursa sana sorup karar birlikte alıyoruz.
- Her 5 oturumda bir "sistem sağlıklı mı?" testi çalıştırıyorum.

---

## Yeni kural ekleme — nasıl olur

Sen bir kural ihtiyacı söylersin:
> "Bundan sonra her toast mesajında cmn_ öneki olsun"

Ben şunu yaparım:

1. `kurallar.json`'a kural ekler
2. `bozuk-ornekler/` altına kasten ihlal eden bir test dosyası yazarım
3. `beklenen-hatalar.json`'a "bu dosya bu kodu vermeli" kaydı eklerim
4. Self-test çalıştırırım: `node .github/kontrol.js --self-test`
5. Yeşil görürsem sana veririm, yüklersin

Tamamı bir mesajda biter.

---

## Komutlar

### Normal tarama (CI otomatik çalıştırır, sen elle yapmana gerek yok)
```
node .github/kontrol.js
```

### Self-test (kurallar gerçekten iş görüyor mu doğrular)
```
node .github/kontrol.js --self-test
```

Self-test'i ne zaman çalıştırmalı:
- Her 5 oturumda bir (Claude hatırlatır)
- Kurallar.json'da büyük değişiklik yaptıktan sonra
- Şüphelendiğinde — "sistem çalışıyor mu gerçekten?"

---

## Dosya yapısı

```
.github/
├── workflows/
│   └── kontrol.yml              CI tanımı (GitHub otomatik çalıştırır)
├── kontrol.js                   Tarama mantığı
├── kurallar.json                Kurallar (desen + mesaj + şiddet)
├── bozuk-ornekler/              Self-test klasörü
│   ├── g03-ham-gosterim.html    Kasten bozuk: G-03 kuralını test eder
│   ├── ares-normalize-eksik.html Kasten bozuk: script yüklemesi eksik
│   ├── i18n-eksik-anahtar.html  Kasten bozuk: tv() anahtarı lang'de yok
│   └── beklenen-hatalar.json    Her bozuk dosyadan hangi kod çıkmalı
└── KONTROL-SISTEMI.md           Bu dosya
```

---

## Aktif kurallar (23. oturum sonu)

### Hata seviyesi (deploy'u durdurur)
- **YASAK_RENK_*** — 5 adet yasak hex renk kodu
- **FLASH_DARK** — flash prevention default'u `'dark'` olamaz
- **THEME_LIGHT** — `data-theme='light'` yanlış, `'light-anthracite'` olmalı
- **ARES_LAYOUT_EKSIK** — `ares-layout.js` yüklenmemiş

### Uyarı seviyesi (deploy devam, sarı bayrak)
- **HISTORY_BACK** — `history.back()` kullanımı
- **YUKLENIYOR_KUMSAAT** — "⏳ Yükleniyor" metni
- **ARES_NORMALIZE_EKSIK** — `ares-normalize.js` yüklenmemiş (YENİ — 23. oturum)
- **G03_HAM_MALZEME** — `esc(x.malzeme)` ham gösterim (YENİ — 23. oturum)
- **G03_HAM_KALITE** — `esc(x.kalite)` ham gösterim (YENİ)
- **G03_HAM_YUZEY** — `esc(x.yuzey)` ham gösterim (YENİ)
- **G03_HAM_MALZEME_TEMPLATE** — `${x.malzeme}` template literal ham (YENİ)
- **G03_HAM_KALITE_TEMPLATE** — `${x.kalite}` template literal ham (YENİ)
- **I18N_EKSIK** — `tv('anahtar')` çağrısı `lang/tr.json`'da yok (YENİ)

Toplam: **5 hata, 9 uyarı kuralı aktif.**

---

## Sık sorulan sorular

**S: Uyarı olan bir şeyi de durdurmasını istiyorum.**
Tekiline "uyari" → "hata" yapmamı söylersin, değiştiririm. Ama önce mevcut kodda kaç kez ihlal edildiğini görelim — 50 ihlal varsa birdenbire hata yapmak deploy'u kilitler, önce temizlik gerekir.

**S: Yanlış yere uyarı veriyor.**
İstisna listesine dosyayı ekleriz. Veya kuralın `satirda_olmamalidir` listesine yeni istisna kelimesi (ör. bir helper fonksiyon adı) ekleriz.

**S: Acil bir hata düzeltmem var, CI kırmızı olsa da yüklenmesi gerek.**
Commit mesajına `[skip ci]` yazarsan kontrol atlanır, yükleme geçer. Ama bu acil durum özelliği — normalde kullanılmaz.

**S: Yeni bir dosya ekledim, "ARES_NORMALIZE_EKSIK" uyarısı aldım ama bu sayfaya gerekmiyor.**
İki seçenek: (1) `istisnalar.dosyalar` listesine sayfayı ekleriz (ör. bir popup sayfası), (2) sayfaya `ares-normalize.js` eklersin. Kural sana hangisini söyler bakmaksızın sormayı tercih ederim.

---

## Sağlık kontrolü nasıl yapılır

Her 5 oturumda bir (Claude hatırlatır):

```
node .github/kontrol.js --self-test
```

Çıktıda "Tüm kurallar sağlıklı çalışıyor" yazıyorsa sistem güvende.
"KURAL SAĞLIĞI BOZUK" yazıyorsa bir kural yanlışlıkla bozulmuş, Claude'a söyle.

---

## Git akışı hatırlatıcısı

**Her oturum başı:**
```
git pull origin main
```

**Her oturum sonu:**
- Normal akış (GitHub web'den upload) değişmiyor
- Upload sonrası Actions sekmesine bir bakış at — yeşil mi kırmızı mı

Bu kadar. Hatırlaması kolay, çalıştırması kolay.
