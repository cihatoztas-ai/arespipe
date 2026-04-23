# Spool AI — Vizyon & Yol Haritası

> **AresPipe · Vizyon Belgesi · Nisan 2026**
>
> İzometri okuma, parça kütüphanesi, 3D montaj ve yapay zeka eğitiminin birleştiği döngü.
>
> Bu belge konuşmalardan derlenmiştir — yaşayan bir belge, düzenli güncellenir.

---

## 📚 Belge Hakkında

- **Tür:** Ürün vizyonu + uzun vadeli strateji
- **Hedef kitle:** Cihat Öztaş, Claude, gelecek ekip
- **İlişkili belgeler:**
  - `docs/ROADMAP.md` — 29 oturumluk yakın vade plan
  - `docs/PANO-TASARIM.md` — Süper Admin Yönetim Panosu (24. oturumda implement edilecek, bu vizyonu görsel olarak takip eder)
  - `docs/CIHAT-PROFIL.md` — Claude'un Cihat'ı tanıması için kişisel not
  - `CLAUDE.md` — geliştirme kuralları
- **HTML görsel sürümü:** (önceki konuşmada üretildi, repo'da tutulmayacak — bu MD kaynak)
- **Güncelleme politikası:** Bir oturumda karara bağlanan her yeni fikir/karar/prototip burada yaşar. Claude bu dosyayı her oturum gündeminde "değişiklik var mı?" diye sorgular. Pano (24. oturumdan itibaren) bu belgeyi otomatik okuyup katman haritasını render eder.

---

## 01 — Temel Fikir: Kendi Kendini Geliştiren Döngü

Standart parça kütüphanesinden başlıyoruz. Kullanıcılar oyun formatında spool montajı yapıyor — tel büker gibi parça parça. Bu montajlar 3D görsel üretiyor, görseller AI eğitim verisi oluyor. AI gerçek fotoğraflarda parça tanımayı öğreniyor. Kütüphane büyüdükçe AI iyileşiyor, AI iyileştikçe süreç hızlanıyor.

### Döngü

```
1. Standart Parça Kütüphanesi
   (DN25–DN300 · Boru, Dirsek, Flanş · ASME ölçüleri)
                    ↓
2. 3D Montaj Oyunu
   (Tel büker gibi parça parça · uç noktasına bağla · döndür)
                    ↓
3. Sentetik Eğitim Verisi
   (Farklı açılardan otomatik screenshot · YOLO formatı · etiketli)
                    ↓
4. AI Modeli Eğitimi
   (Domain-specific · DN100 A106 Gr.B SCH40 · ASME B36.10)
                    ↓
5. Gerçek Fotoğraf Tespiti
   (Saha fotoğrafı → parça tanıma → malzeme listesi)
                    ↓
6. Kalite Kontrol Otomasyonu
   (İzometri ≠ Saha → Uyarı · Hata tespiti)
                    ↓
   ↺ Kütüphane Büyür → AI İyileşir
   (Döngü başa döner · her geçişte daha güçlü)
```

### Rekabet avantajımız

> Genel AI araçları "bu bir boru" diyor. Bizim AI'ımız "DN100 A106 Gr.B SCH40 seamless boru, ASME B36.10, 3200mm" diyor. Bu fark bizim rekabet avantajımız.

---

## 02 — Sistem Katmanları (7 Katman)

### Katman 1 — Eğitim Oyunu: İzometri Okuma
**Durum:** ✅ Prototip hazır (`spool_usta.html`)

İzometri görseli gelir. Kullanıcı segmentlere tıklar. Her segment için 4 malzeme seçeneği gelir. Doğru seçimde puan, açıklama ve kombo. Yanlışta ikinci şans ve ipucu. Yeni çalışanlar izometri okumayı öğrenir, her oturum etiketli veri üretir.

**Etiketler:** `spool_usta.html`, Kombo sistemi, Puan tablosu, Açıklamalı geri bildirim

---

### Katman 2 — 3D Montaj Aracı: Tel Bükmek Yerine
**Durum:** ✅ Prototip hazır (`spool_3d_montaj.html`)

Kütüphaneden parça seç, sahneye ekle. Mavi uç noktalarına tıkla → popup → parça seç → otomatik yapışır, hizalanır. Y/Z ekseninde döndür. Zincir büyür. DN uyumsuzluğunda uyarı verir.

**Gerçek ASME ölçüleri:** DN100 Ø114.3mm, SCH40 et 6.02mm, LR dirsek R=171.5mm, WN flanş Ø229mm.

**Etiketler:** `spool_3d_montaj.html`, Three.js, Uç bazlı bağlantı, YOLO export

---

### Katman 3 — Parça Kütüphanesi
**Durum:** 🔵 Yapılıyor

Her doğrulanan parça kütüphaneye girer. Tekrar geldiğinde otomatik tanınır. İlk 20 parça işin %80'ini karşılar.

**Her parça için saklanan bilgiler:**
- Standart kodu, tip, çap, baskı sınıfı
- Tüm boyutlar (standart tablodan)
- 3D geometri parametreleri
- Kaç kez kullanıldığı
- Kim onayladı

**DXF'ten otomatik:** DXF içindeki notlar parser ile okunur, kullanıcı onaylar, kütüphane kaydı oluşur.

**Etiketler:** `parca_kutuphanesi` tablosu, tenant_id, onay_durumu, DXF parser

---

### Katman 4 — Etiketleme Aracı: Koordinatlı Veri
**Durum:** 🟠 Sonraki

Fotoğraf yüklenir, canvas üzerine dikdörtgen çizilir, kutunun içindeki nesne etiketlenir. Koordinatlar otomatik hesaplanır. YOLO formatında kaydedilir.

DXF için koordinat gerekmez — yapısal veri direkt çıkarılır.

**Etiketler:** `etiketleme.html`, Canvas draw, YOLO format, koordinat kolonu

---

### Katman 5 — QR Referans Ölçek Sistemi
**Durum:** 🟠 Sonraki

QR kodun fiziksel boyutu `ayarlar.html`'de tanımlı. Fotoğrafta QR kaç piksel? Oran hesaplanır. Parçanın piksel boyutu gerçek mm'ye çevrilir. Standart tabloyla eşleştirilir.

**Etiketler:** `ayarlar.html` QR boyutu, Pixel/mm oranı, Standart eşleştirme

---

### Katman 6 — Crowdsourced Kütüphane: Web
**Durum:** ⚪ İleride

Harici kullanıcılar web sitesinden kayıt olur. DXF veya izometri yükler, etiketler, kendi kütüphanesine kaydeder. 3 farklı kullanıcı aynı parçayı onayladıysa "public candidate" olur. Ekip final onayı verir, merkezi kütüphaneye alınır.

Wikipedia mantığı — ama tersane mühendisliği için.

**Etiketler:** Multi-tenant, Private/Public, Çoklu onay, Web kayıt

---

### Katman 7 — AI Model Eğitimi
**Durum:** ⚪ 500+ Veri Sonrası

500+ koordinatlı etiketli veri birikince YOLO veya benzeri model eğitimi. Hedef: saha fotoğrafında parça tespiti, izometri sembol okuma, izometri-saha karşılaştırması.

Kendi görüntüden 3D üreten model yapmak hedef değil — TRELLIS gibi araçlar bunu yapıyor, biz entegre ederiz.

**Etiketler:** YOLO, Claude Vision, TRELLIS entegrasyon, Sentetik veri

---

## 03 — Alınan Teknik Kararlar

| Konu | Karar |
|---|---|
| **3D Motor** | **Three.js** — CAD hassasiyeti gerekmez. Kalite kontrol ve eğitim için yeterli. 1mm = 1 birim ölçek. Gerçek ASME boyutları direkt mesh'e geçiyor. |
| **Veri Stratejisi** | **Sentetik veri önce.** Fotoğraftan 3D değil, 3D'den fotoğraf. 50 montaj × 8 açı = 400 etiketli görsel. Temiz veriden kirli fotoğrafları öğrenmek. |
| **Standart Tablolar** | **Kütüphane büyüyünce.** Parça tespiti için gerekmez. Kütüphane kaydı için gerekir. Önce elle büyüsün, sonra otomasyon. |
| **TRELLIS Rolü** | **Form tespiti için araç.** Ham model çıkarır, kirli. Kütüphanedeki ölçüler temizler. İkisi birlikte teknik doğruluk sağlar. |
| **Bağlantı Sistemi** | **Uç bazlı.** Her parçanın uç noktaları var. Uca tıkla → popup → parça seç → otomatik yapışır. Kullanıcı sadece döndürmeyi ayarlar. |
| **Veri Formatı** | **YOLO uyumlu JSON.** spool_id, parcalar[], tip, dn, malzeme, standart, boyutlar, pozisyon, rotasyon, parent. Herhangi bir vision modeline gider. |

### Export Formatı Örneği

```json
{
  "spool_id": "SYN_1715000000",
  "kaynak": "synthetic_3d_montaj",
  "parcalar": [
    {
      "tip": "pipe",
      "dn": 100,
      "malzeme": "A106 Gr.B",
      "standart": "ASME B36.10",
      "boyutlar": { "od": 114.3, "wt": 6.02, "len": 500 },
      "pozisyon": { "x": 0, "y": 250, "z": 0 },
      "rotasyon": { "rx": 0, "ry": 0, "rz": 0 },
      "parent": null
    }
  ]
}
```

---

## 04 — Uygulama Yol Haritası

### Faz 1 — Şimdi Yapılabilir (Aktif)

- [x] **Eğitim oyunu prototipi** — `spool_usta.html` çalışıyor
- [x] **3D montaj prototipi** — uç bazlı bağlantı çalışıyor
- [ ] **etiketleme.html** → canvas üzerine kutu çizme özelliği ekle
- [ ] **egitim_verisi tablosu** → koordinat + etiket_detay kolonları ekle
- [ ] **parca_kutuphanesi tablosu** → tenant_id, onay_durumu (private/public)
- [ ] **DXF parser** → ilk 20 parça için temel okuma

### Faz 2 — Kütüphane Oluşturma (Sonraki)

- [ ] Mevcut tamamlanmış spoolların malzeme listelerinden **manuel kütüphane girişi**
- [ ] DXF dosyalarından **otomatik parça listesi** çıkarma
- [ ] `ayarlar.html` → **QR etiket fiziksel boyutu** tanımı
- [ ] **QR ölçek hesaplama** modülü
- [ ] Admin panelinden **kütüphane onay arayüzü**

### Faz 3 — Web Entegrasyonu (İleride)

- [ ] Web kayıt sistemi (**tenant_type: web**)
- [ ] Kullanıcı **kütüphane sayfası** (private görünüm)
- [ ] 3D montaj aracını web sitesine entegre et
- [ ] **Crowdsourced onay** mekanizması (3 onay → public candidate)

### Faz 4 — AI Pipeline (500+ Veri Sonrası)

- [ ] **Claude Vision testi** — gerçek izometri yükle, ne kadar okur gör
- [ ] **Sentetik veri otomasyonu** — montajdan otomatik çok açılı screenshot
- [ ] **TRELLIS entegrasyonu** — form tespiti için pipeline
- [ ] 500+ veri birikince **model kararı** (YOLO / CLIP / fine-tune)

### Faz 5 — Kalite Kontrol AI (Uzun Vade)

- [ ] Saha fotoğrafı + izometri **karşılaştırma**
- [ ] "İzometride DN80 flanş var ama fotoğrafta DN65 görünüyor" **uyarısı**
- [ ] Sahada anlık hata tespiti ve **operatör uyarısı**

---

## 05 — Dürüst Değerlendirme: Gerçekçi Sınırlar

### ✓ Yapabileceklerimiz

- İzometri okuma eğitimi — **kesinlikle**
- Parça kütüphanesi oluşturma — **kesinlikle**
- QR'dan ölçek + parça tespiti — **orta vadede**
- Claude Vision ile izometri okuma — **şimdi denenebilir**
- Domain-specific AI modeli — **veri birikince**
- Crowdsourced kütüphane büyümesi — **web sonrası**

### ✗ Yapamayacaklarımız / Gerekmeyenler

- Kendi görüntüden 3D üreten model (**TRELLIS yapıyor**)
- CAD hassasiyetinde 3D (**Three.js yeterli**)
- Deneyimli ustanın yerini alma (AI destekler, **karar insan verir**)
- YOLO alternatifi geliştirme (**mevcut modelleri kullanırız**)
- Sıfırdan LLM eğitimi (**Claude API kullanırız**)

---

## 06 — Mevcut Prototipler

### 🎮 SPOOL USTASI (`spool_usta.html`)

İzometri okuma eğitim oyunu. 5 segment, malzeme seçimi, puan sistemi.

- Kombo sistemi (x1–x5)
- Açıklamalı geri bildirim
- Sıfır hata bonusu
- Eğitim verisi üretir

### 🔩 3D MONTAJ (`spool_3d_montaj.html`)

Uç bazlı bağlantı sistemi. Parça seç, uca tıkla, otomatik bağla.

- Gerçek ASME ölçüleri
- DN uyumsuzluğu kontrolü
- Y/Z ekseninde döndür
- YOLO formatında export

---

## 07 — Referans: Standart Parça Tablosu (ilk 5)

| Parça | DN | Dış Çap | Et | Standart |
|---|---|---|---|---|
| Seamless Boru | DN100 | 114.3 mm | 6.02 mm (SCH40) | ASME B36.10 · A106 Gr.B |
| Seamless Boru | DN80 | 88.9 mm | 5.49 mm (SCH40) | ASME B36.10 · A106 Gr.B |
| 90° LR Dirsek | DN100 | 114.3 mm | R=171.5mm (1.5D) | ASME B16.9 · A234 WPB |
| WN Flanş PN16 | DN100 | 229 mm | h=76.2 mm | ASME B16.5 · A105 |
| Blind Flanş PN16 | DN100 | 229 mm | h=31.8 mm | ASME B16.5 · A105 |

_İlk 20 parça bittiğinde buraya tam liste eklenir._

---

## 08 — Değişiklik Kayıtları

| Tarih | Oturum | Değişiklik |
|---|---|---|
| 23 Nisan 2026 | 23 | Belge Markdown formatında repo'ya girdi (`docs/SPOOL-AI-VIZYON.md`). |
| 23 Nisan 2026 | 23 | Süper Admin Yönetim Panosu tasarım belgesi oluşturuldu (`docs/PANO-TASARIM.md`). Pano bu vizyon dosyasını otomatik okuyup katman haritasını render edecek. İmplementasyon 24. oturumda. |

_Her oturumda bu belgeye yeni karar / prototip / faz değişikliği eklendiğinde Claude bu tabloya satır ekler._

---

**Önceki sürüm:** Yalnızca HTML olarak vardı, oturum içinde konuşuluyordu, kalıcı yeri yoktu — kaybolma riski yüksekti.
**Yeni sürüm:** Repo'da versiyonlu, her oturumda gündeme gelen, güncellenebilir.
