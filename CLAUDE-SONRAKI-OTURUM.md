# Claude — 45. Oturum Gündemi

> **Bu dosya 44 kapanışında oluşturuldu. 45 başında ilk okunacak.**

---

## 45 Açılış Mottosu

44'te kütüphane cascade UI bittiği gün, Cihat 3D vizyonunu açtı. Üç farklı tersane formatı (G200/tersan, PAOR, SR027) yan yana incelendi, mimari prensip kanıtlandı: **parser değişir, motor sabit kalır.**

Cihat'ın 44 son turunda net kararı:
> *"tersan ve PAOR şu an aktif bu ikisini referans alalım, diğer formatları üzerine ekleriz."*

45 iki paralel ana teması var:
- **Format parser'ları** (tersan + PAOR — deterministik, AI'sız)
- **3D motor entegrasyonu** (kademeli olgunlaşma — Aşama 4.1 → 4.2 → 4.3)

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli — 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi sayfayla çalışılacak? (cevap: izometri-batch.html + spool_detay.html + yeni parser dosyaları)
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 44 sonu detayını oku
- docs/CIHAT-PROFIL.md, docs/SPOOL-AI-VIZYON.md, docs/IZOMETRI-BATCH-KARAR.md hatırla
- Cihat'ın "tersan ve PAOR aktif" kararını teyit et — pilot tersane sözleşmesi imzalandı mı, hâlâ "aktif" mi?

---

## 2. Açık Karar (45 başında netleştirilecek)

**Karar 45.1 — Hangi parser önce?**

| Seçenek | Avantaj | Dezavantaj |
|---|---|---|
| (a) tersan önce, PAOR sonra | Cut Length tablosu daha kolay parse, Rotation Angle eksplisit | Türk pilot ise faydalı |
| (b) PAOR önce, tersan sonra | FORE/PS/HEI koordinat sistemi 3D motoru daha hızlı besler | Portekiz pilot ise faydalı |
| (c) İkisi paralel | Aynı oturumda dispatcher + iki parser | Fazla iş, oturum dağılır |

**Önerim:** (a) tersan önce. Sebep:
- Cihat Türkiye merkezli, tersan dosyaları daha kolay erişim
- Cut Length tablosu deterministik parse (regex bazlı)
- PAOR koordinat sistemi 3D motorun daha sonra tüketeceği şey, **paralel test edilebilir**

Cihat farklı düşünürse onun seçimi.

**Karar 45.2 — Schema güncellemeleri tek migration mı, parça parça mı?**

3D motor için gerekli yeni kolonlar:
- `spool_malzemeleri.sira` (INTEGER) — parça sırası
- `spool_malzemeleri.rotation_angle` (INTEGER, derece) — tersan formatından
- `spool_malzemeleri.yonelim_kod` (TEXT) — manuel düzeltme için
- (mevcut `x1/y1/z1, x2/y2/z2` PAOR koordinatları için kullanılabilir, dokunmaya gerek yok)

Tek migration `017_3d_motor_schema.sql` olarak yazılır, idempotent (`ADD COLUMN IF NOT EXISTS`).

---

## 3. Ana Tema A — tersan Parser (~3-4 oturum)

### 3.1 Parser Hedefi

`api/izometri-oku.js` (sıfırdan, K5/36'da kararlaştırıldı). tersan formatı için:

| PDF Alanı | Çıkarılacak değer |
|---|---|
| `60.3x4.5` regex | DN50 (`boru_olculer` lookup) + et 4.5mm |
| `R=130.0` regex | Dirsek yarıçapı (LR/SR ayrımı) |
| Cut Length tablosu | Sıralı parça listesi |
| **Rotation Angle sütunu** | Her parçanın dönüş açısı (deterministik!) |
| `4789`, `6360` (sayfa kenarındaki sayılar) | Boy ölçüleri |
| `MAIN DECK-11300/11000` | Yükseklik referansı |
| `FR79`, `FR81` | Frame referansı |
| Üst tablo (boru/flanş/dirsek listesi) | BOM doğrulama |

### 3.2 izometri_format_tanimlari Kaydı

```sql
INSERT INTO izometri_format_tanimlari (
  ad, cad_program, fingerprint, parser_kural,
  egitim_kaynagi, tenant_id, aktif, sistem_preset
) VALUES (
  'tersan — Kuk Tersane Şablonu',
  'AVEVA E3D',
  '{"baslik_regex": "303-Bilge System", "dosya_adi_regex": "G\\d+-\\d+-BS\\d+"}',
  '{...parse kuralları JSONB...}',
  'pdf_excel',
  NULL,  -- sistem geneli (Karar 2)
  true,
  true
);
```

### 3.3 Test Pipeline

1. Cihat 1 örnek tersan PDF + IFS yükler
2. Parser AI'sız çalışır (deterministik)
3. Çıktı `spool_malzemeleri` formatında JSON
4. Manuel onay (UI'da gösterilir, hata varsa düzeltilir)
5. Doğru çıkarsa `parser_kural` JSONB'sine kaydedilir
6. Sonraki tersan PDF otomatik tanınır

---

## 4. Ana Tema B — PAOR Parser (~2-3 oturum, A'ya paralel)

### 4.1 Parser Hedefi

PAOR formatı için:

| PDF Alanı | Çıkarılacak değer |
|---|---|
| `FORE 1279, PS 1294, HEI +2` | Spool noktasının 3D koordinatları |
| `CONTINUATION OF PIPE` notu | Çoklu spool zinciri |
| Fabrication Material List tablosu | Parça listesi (boru/dirsek/flanş/redüktör + DN/DPN) |
| Erection Material List tablosu | Cıvata/conta/somun listesi (BOM detayı) |
| `[1] [2]` spool dilimi | Uzun hatın imalat parçalarına bölünmesi |
| `FR133` referansı | Gemi yapısal koordinat |

### 4.2 Eksik Alanlar

PAOR'da Rotation Angle yok ama **direkt 3D koordinat var** — daha bile iyi. Spool 3D'si için PAOR:
- Başlangıç noktası (FORE_a, PS_a, HEI_a)
- Bitiş noktası (FORE_b, PS_b, HEI_b)
- İki nokta arasında parçalar otomatik dizilir

### 4.3 izometri_format_tanimlari Kaydı

Benzer şekilde, ayrı satır:
```
ad: 'PAOR — Portuguese Navy AOR Şablonu'
cad_program: 'AVEVA E3D'
fingerprint: {"baslik_regex": "PORTUGUESE NAVY AOR", "dosya_adi_regex": "11D-PAOR-\\d+"}
```

---

## 5. Ana Tema C — 3D Motor Entegrasyonu (~3-4 oturum)

### 5.1 Schema Migration (017_3d_motor_schema.sql)

```sql
ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS sira INTEGER,
  ADD COLUMN IF NOT EXISTS rotation_angle INTEGER,
  ADD COLUMN IF NOT EXISTS yonelim_kod TEXT;

-- mevcut: x1/y1/z1, x2/y2/z2 zaten var (PAOR koordinatları için kullanılır)

CREATE INDEX IF NOT EXISTS idx_spool_malzeme_sira ON spool_malzemeleri(spool_id, sira);
```

### 5.2 Aşama 4.1 — Default Zincir Kurulumu (1-2 oturum)

- Parser çıktısı `spool_malzemeleri.sira` ile sıralı yazılır
- `buildChain()` her parçayı uç uca ekler, default yön (+X)
- Dirsekler hep yukarı döner (varsayılan)
- Boy ölçüleri gerçek (kütüphaneden veya parser'dan)
- Pilot kullanıcı için: "spool şekli görünür, yönler kabaca doğru"

### 5.3 Aşama 4.2 — Rotation Angle Okuma (1 oturum)

- tersan parser `rotation_angle` kolonunu doldurur
- `buildChain()` bu değere göre dirseği döndürür
- PAOR için x1/y1/z1 → x2/y2/z2 koordinatları zaten direkt yön verir
- Sonuç: %85-95 doğru 3D, AI'a hiç gerek yok

### 5.4 Aşama 4.3 — Manuel Düzeltme UI (1-2 oturum)

- spool_detay.html'de 3D sekmesinde dirseğe tıkla → "rotation: 0/90/180/270" veya "yönelim: yukarı/aşağı/sola/sağa"
- DB güncellenir (`yonelim_kod`), 3D yeniden render
- spool_3d_montaj.html'deki mantık zaten var, oraya entegre

---

## 6. Cihat'ın Paralel İşleri (Oturum Aralarında)

### 6.1 Eğitim Havuzu (Opsiyonel ama Değerli)

Eski PAOR ve tersan PDF'lerini topla, anonimleştir:
- Proje numaralarını sil
- Tersane adını sil
- Müşteri adını sil
- Sadece teknik desen + boyut + yön bilgisi kalsın

Hedef: 100-300 set. Sonra `egitim_havuzu_*` tablolarına yüklenir (45 sonraki oturumda altyapı kurulur).

### 6.2 Kütüphane Veri Doldurma (Süregelen)

44'te kütüphane satır sayısı 90'da kaldı. Cihat paralel sürdürüyor:
- Boru: ~280 hedef, şu an 58
- Flanş: ~800 hedef, şu an 20
- Fitting: ~2,500 hedef, şu an 0
- Malzeme katalog: ~120 hedef, şu an 12

Tamamlanan kısımlar 45 başında canlı sayım için raporlanır.

---

## 7. Açık Kararlar (45'te netleşecek)

1. **Pilot tersane sözleşmesi:** tersan ve PAOR hâlâ aktif mi? Sözleşme imzalandı mı, deneme aşamasında mı?
2. **Eğitim havuzu yaklaşımı:** Cihat anonim eski PAOR'ları topladı mı? Kaç adet? `egitim_havuzu_*` tablolarını 45'te mi kuralım, 46'ya mı?
3. **AI fallback eşiği:** Yeni format gelirse hangi noktada AI devreye girer? (Önerim: format dispatcher eşleşmezse + manuel onay sonrası "Format Kaydet" butonu ile öğrenir)
4. **Multi-tenant boru_olculer:** Şema güncellemesi (`tenant_id` + `sistem_preset`) 45'te mi 46'da mı? 3D motor entegrasyonuyla çakışmamalı.
5. **3D motor sırası:** Önce schema mı, önce parser mı? Önerim: schema → tersan parser → 3D Aşama 4.1 → Aşama 4.2 → manuel UI sırası.

---

## 8. Ne YAPILMAYACAK (Vizyon Disiplini)

44'te 4. istisna yapıldı (cascade UI). 45'te yeni istisna yok. Vizyondan kalan:

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır (parser mimarisi STEP'e hazır olacak ama implementasyon 50+'a)
❌ Klasör yükleme — vizyonda kalır
❌ Çapraz validasyon — vizyonda kalır
❌ AI yön çıkarımı — 45'te **gerek yok** (tersan + PAOR deterministik)

Cihat *"şunu da ekleyelim sistem can damarı"* derse: cevap *"44'te 4. istisna oldu, 5.si presedan. 50. oturumdan sonra konuşalım. Şimdi parser + 3D motor."*

---

## 9. Başarı Kriteri (45 Sonu)

- [ ] tersan parser canlıda, en az 1 spool başarıyla parse ediliyor
- [ ] PAOR parser yazıldı (paralel veya sıralı), en az 1 spool başarıyla parse ediliyor
- [ ] `017_3d_motor_schema.sql` migration çalıştı
- [ ] 3D motor Aşama 4.1 (default zincir) canlıda, pilot spool'unda görünür
- [ ] CI yeşil
- [ ] son-durum.md güncellendi
- [ ] AI maliyeti **sıfır** (deterministik parse'lar çalışıyor)

**Stretch goal:** 3D motor Aşama 4.2 (Rotation Angle) + manuel düzeltme UI başlangıcı.

---

## 10. 45 Açılış Mantosu (Cihat'a hatırlatma)

> 44'te yapılan iş: kütüphane gözle görünür hale geldi + mimari standart oturdu + 3D yol haritası netleşti.
> 45'in iki kelimelik özeti: **parser + motor**.
> tersan ve PAOR deterministik veri veriyor → AI yok, maliyet sıfır → pilot için yeterli.
> Bilinmeyen format gelirse 50+'da konuşulur.

---

> 44 kapanışında yazıldı. 45 başında ilk okunacak.
