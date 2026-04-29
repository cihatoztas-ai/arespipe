# Claude — 46. Oturum Gündemi

> **Bu dosya 45 kapanışında oluşturuldu. 46 başında ilk okunacak.**

---

## 46 Açılış Mottosu

45'te schema temeli + format dispatcher altyapısı oturdu (3 migration). 46'nın iki kelimelik özeti: **parser branch**.

`api/izometri-oku.js` (985 satır) zaten 38-42'de yazılmış AI L3 Vision akışı içeriyor. 4. adıma (`Format bulundu + parser_kural dolu → L1/L2 parse`) deterministik branch ekleyeceğiz. **AI fallback korunur, deterministik eşleşme varsa AI hiç çağrılmaz.**

Cihat'ın 45 son turundaki net kararı (devre yükleme akışı):
> *"yeni devre yükleme sayfasından bu dosyaları yüklediğimizde bunların aktif olması lazım. buradaki ilerleyişe göre devre yükleme sayfasını güncelleyecem."*

46 üç paralel ana temaya sahip:
- **Parser branch'i** (kod, izometri-oku.js patch)
- **020 migration** (parser_kural JSONB doldurma)
- **Pilot test** (1 tersan + 1 PAOR PDF üzerinden)

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli — 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi dosyayla çalışılacak? (cevap: api/izometri-oku.js + yeni 020 migration)
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 45 sonu detayını oku
- docs/CIHAT-PROFIL.md, docs/SPOOL-AI-VIZYON.md hatırla
- CLAUDE-SON-OTURUM.md (45 detayı) — sadece geriye dönüp aranacak, baştan okunmaz
- **Migration disiplini hatırlat:** her DB değişikliği iki adımdır (önce Supabase, sonra GitHub)

---

## 2. Açılış İlk İş — `izometri-oku.js`'i Bütün Olarak Yükleme

Cihat sohbete `~/Desktop/arespipe/api/izometri-oku.js`'i sürükle bırak. 985 satır, ~40 KB. Ben okuyacağım, akışı anlayacağım.

**Bu yapılmadan parser branch yazımı başlamaz.** 45'te bu adım atılmadı çünkü dürüst karar: körlemesine yama yapmaktansa yarına ertelemek.

---

## 3. Ana Tema A — Parser Branch Tasarımı (~2 oturum)

### 3.1 Dosyada parser branch'i nereye eklenecek

45'te dosyanın header'ı görüldü (1-80. satır). Akış:
```
1. Validasyon + auth
2. Batch açma/bulma
3. Format dispatcher (izometri_format_tanimlari fingerprint eşleşmesi)
4. Format bulundu + parser_kural dolu → L1/L2 parse  ← ŞU AN BOŞ, BURAYA YAMA
5. Format bulunamadı VEYA parser_kural boş → L3 Vision AI
6. ASME helper (boru_olculer) — eksik et/cap doldur
7. 7 maddeli halüsinasyon filtresi
8. izometri_batch_kayitlari + ai_api_log INSERT/UPDATE
```

46'da yapılacak: 4. adım canlanacak. `parser_kural.tip === 'deterministik'` ise:
- `format_kodu` okunur
- `format_kodu` switch → `parseTersanCadmaticM110()` veya `parsePAORAvevaSTM()`
- Çıktı `spool_malzemeleri` formatında JSON
- 6-7-8. adımlar normal akışla devam (halüsinasyon filtresi deterministik veriye de yarar — DN tutarlılığı, boy aralığı, malzeme sözlüğü)

### 3.2 İki yeni fonksiyon

**`parseTersanCadmaticM110(text, dosyaAdi, pdfBuffer)`:**
- pdfplumber gibi tablo çıkarımı (Node.js eşdeğeri: `pdf-parse` + manuel kolon tespiti, veya `pdfjs-dist` text positioning)
- Cut & Bending Info tablosu → rotation_angle (varsa)
- Malzeme Listesi tablosu → spool_malzemeleri JSON
- Footer regex → pipe_no, spool_no, total_weight, surface_treatment
- "Boru Ucuna Victaulic için Groove acılacak" satırları → notlar (talimat, parça değil)

**`parsePAORAvevaSTM(text, dosyaAdi, pdfBuffer)`:**
- Title block parse → MODEL REFERENCE PIPE NO, DESIGN DRAWING NO, DRAWING NAME
- FORE/PS/HEI koordinat çıkarımı → x1_mm/y1_mm/z1_mm direkt yazılır
- Fabrication Material List → spool_malzemeleri (her tip için ayrı regex: PIPE/ELBOW/FLANGE/REDUCER/DOUBLER)
- Erection Material List → **atlanır** (cıvata/somun/conta — saha montaj BOM'u, spool imalatı değil) — Cihat 46 başında onaylasın
- Pipe Cut-Lengths → spool_malzemeleri'ne boy_mm doldurma
- "CONTINUATION OF PIPE" → notlar (devamı başka çizim)
- "SPOOL [1] [2]" → spool dilimleme

### 3.3 Halüsinasyon filtresi deterministik veriye de uygulanır

K3/36'nın 7 maddesi deterministik veriye de uygulanır (sadece AI'a değil):
1. DN bulunamadı → şüpheli
2. Çap-DN tutarsız → şüpheli
3. Et tolerans dışı → şüpheli
4. Boy negatif/>50000mm → şüpheli
5. Pipeline_no formatı dosya adıyla uyuşmuyor → şüpheli (deterministik veride bile parser bug olabilir)
6. AI güven skoru — deterministik veride NULL (uygulanmaz)
7. Malzeme bilinmeyen → şüpheli

### 3.4 Test Pipeline

1. Cihat 1 tersan PDF (45'te yüklediği M110 örneği) + 1 PAOR PDF yeniden yükler
2. Format dispatcher fingerprint eşleştirir → tersan ya da PAOR formatı bulunur
3. parser_kural.tip="deterministik" → kod branch'i tetiklenir (AI çağrısı YOK)
4. Çıktı manuel onay UI'da görünür
5. Cihat doğrulama yapar, hata varsa düzeltir
6. Doğru çıkıyorsa parser sağlam, yanlış çıkıyorsa regex iyileştirme

---

## 4. Ana Tema B — `020_format_tanimlari_parser_kural.sql` (~30 dk)

`parser_kural` JSONB'si şu yapıda olacak:

```json
{
  "tip": "deterministik",
  "format_kodu": "tersan_cadmatic_m110",
  "extract_pipe_no": {
    "regex": "PIPE NO:\\s*-?(?<pipe>[A-Z0-9-]+)",
    "yer": "footer"
  },
  "extract_spool_no": {
    "regex": "SPOOL NO:\\s*-?(?<spool>S\\d+)",
    "yer": "footer"
  },
  "tablolar": {
    "malzeme_listesi": {
      "baslik_regex": "Malzeme Listesi",
      "kolonlar": ["No", "Adet", "Açıklama", "Boyut", "Boy", "Malzeme", "Ağırlık"]
    },
    "cut_bending_info": {
      "baslik_regex": "Cut & Bending Info",
      "kolonlar": ["Spool-Cut", "Cut Length", "Set Length/Transport", "Rotation Angle", "Cut Away"],
      "rotation_angle_opsiyonel": true
    }
  },
  "boyut_parse_regex": {
    "dxh": "^(?<dis>\\d+\\.?\\d*)x(?<et>\\d+\\.?\\d*)$",
    "dn": "^DN(?<dn>\\d+)$"
  },
  "tip_eslesme": {
    "boru": "^(Boru Dikişsiz|PIPE)",
    "dirsek": "^(Dirsek|ELBOW)",
    "flans": "^(Flans|FLANGE)",
    "redusoel": "^(Redüksoel|REDUCER)",
    "doubler": "^(Doubler|DOUBLER)",
    "islem_atla": "(Groove|olunacak)"
  }
}
```

PAOR için benzer ama `extract_coordinates`, `extract_continuation`, ve material_description regex set'i farklı (CLAUDE-SON-OTURUM.md'de detayı var).

**Migration yapısı:**
- 2 UPDATE: tersan ve PAOR kayıtlarına `parser_kural` JSONB ata
- Idempotent: önceki UPDATE çalıştıysa fark eder mi diye `WHERE parser_kural::text = '{}'` koşulu
- Doğrulama sorgusu: `parser_kural::text != '{}'` kontrolü

---

## 5. Ana Tema C — Pilot Test (~1 oturum, 46 sonu veya 47)

1. Cihat aynı 2 PDF'i yeniden yükler (M110 spool + 11D-PAOR-54102-101626-A)
2. Backend tetiklenir, izometri-oku.js çalışır
3. Format dispatcher eşleştirir
4. Deterministik parser çalışır, AI çağrılmaz
5. izometri-batch.html manuel onay sekmesinde sonuç görünür
6. Cihat doğrulama yapar
7. Hatalı alan varsa parser regex iyileştirme

**Başarı kriteri:**
- [ ] tersan PDF parse edildi, 3 boru/dirsek satırı `spool_malzemeleri` formatında
- [ ] PAOR PDF parse edildi, 5 fabrication satırı + koordinatlar
- [ ] AI çağrı sayısı **sıfır** (ai_api_log boş satır)
- [ ] Halüsinasyon filtresi her iki çıktıda da temiz (şüpheli yok veya açıklanabilir)
- [ ] Manuel onay UI'da sonuçlar görünüyor

---

## 6. Cihat'ın Paralel İşleri (Oturum Aralarında)

### 6.1 devre_yeni.html PDF Upload Akışı (Cihat'ın söylediği iş)

Cihat 45'te dedi: *"buradaki ilerleyişe göre devre yükleme sayfasını güncelleyecem."*

46'da parser hazır olduğunda Cihat:
- devre_yeni.html'e PDF upload alanı ekler/günceller (zaten izometri-batch.html'de var, devre_yeni'den de tetiklenebilir mi?)
- Yüklenen PDF'leri /api/izometri-oku endpoint'ine gönderir
- Manuel onay sonucu spool_malzemeleri'ne yazılır

Bu Claude'un işi değil, Cihat paralel ilerletecek. Claude sadece API contract'ı net tutar.

### 6.2 Eğitim Havuzu (Süregelen)

Eski PAOR ve tersan PDF'lerini topla, anonimleştir. Hedef: 100-300 set. 47+ oturumlarda altyapı.

### 6.3 Kütüphane Veri Doldurma (Süregelen)

44'te boru/flanş/fitting/malzeme katalog hedeflerine ulaşılmamıştı. Cihat paralel sürdürüyor.

---

## 7. Açık Kararlar (46 başında netleşecek)

1. **İmalat işleri (Victaulic Groove vb.) nereye yazılır?** spool_malzemeleri'ne mi (tip="islem"), spooller.notlar'a mı, yeni tablo mu? Cihat karar verecek.
2. **PAOR'da Erection Material List atlanır mı?** Önerim: evet (saha montaj BOM'u, spool imalatı değil). Cihat onaylasın.
3. **PAOR fingerprint'inin "+" karakteri.** Sayfada "PORTUGUESE NAVY AOR+", DB regex'inde + yok. Pratik düzeltme: opsiyonel.
4. **`1(2)` parser tarafından alınmaya değer mi?** Cihat hâlâ bilmiyor → şu anlık parser opsiyonel atlar.
5. **Multi-tenant boru_olculer:** Şema güncellemesi (`tenant_id` + `sistem_preset`) 46'da mı 47'de mi? Parser çalışırken çakışmamalı.
6. **3D motor sırası:** Parser bittikten sonra Aşama 4.1 (default zincir) → 4.2 (Rotation Angle) → 4.3 (manuel UI). 47-48'e kalır.

---

## 8. Ne YAPILMAYACAK (Vizyon Disiplini)

44'te 4 istisna kapsama alındı, 45 sıfır istisna ile bitti, 46'da yine **sıfır istisna** hedefi.

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'li servis modeli — vizyonda kalır
❌ Lazer tarama — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır (parser mimarisi STEP'e hazır olacak ama implementasyon 50+'a)
❌ Klasör yükleme + format tanıma — vizyonda kalır (Cihat'ın zip yapısı ilham verdi ama 46 işi değil)
❌ Çapraz validasyon (3 katman) — vizyonda kalır
❌ AI yön çıkarımı — 46'da gerek yok (deterministik branch + opsiyonel rotation_angle)
❌ Yeni format eklemek — 46'da sadece tersan + PAOR. Üçüncü format gelirse 47+'a.

Cihat *"şu sistem can damarı"* derse: cevap *"45'te 4 kapanış istisnası temizlendi, 46'da sıfır istisna kuralı. 50. oturumdan sonra konuşalım. Şimdi parser + pilot test."*

---

## 9. Başarı Kriteri (46 Sonu)

- [ ] `api/izometri-oku.js` 4. adımda deterministik branch canlı
- [ ] `parseTersanCadmaticM110()` ve `parsePAORAvevaSTM()` fonksiyonları yazıldı
- [ ] `020_format_tanimlari_parser_kural.sql` migration uygulandı, parser_kural'lar dolu
- [ ] En az 1 tersan + 1 PAOR PDF başarıyla parse edildi (canlı veya test ortamı)
- [ ] AI maliyeti **sıfır** (deterministik branch çalışıyor, fallback'e düşmedi)
- [ ] Halüsinasyon filtresi her iki çıktıda temiz
- [ ] CI yeşil
- [ ] son-durum.md güncellendi

**Stretch goal:** devre_yeni.html'in upload akışı parser'a bağlandı (Cihat paralel iş).

---

## 10. 46 Açılış Mantosu (Cihat'a hatırlatma)

> 45'te yapılan iş: 3 migration + parser tasarım haritası + 44 yanlışlıkları düzeltildi.
> 46'nın iki kelimelik özeti: **parser branch**.
> Mevcut 985 satırlık izometri-oku.js korunur, 4. adımına yama yapılır.
> AI fallback korunur, deterministik eşleşme varsa AI hiç çağrılmaz.
> tersan + PAOR pilot için yeterli, üçüncü format 50+'a.

---

## 11. Migration Disiplini Hatırlatması (KALICI KURAL)

45'te 018'de bu kural ihlal edilince 30 dakika kayboldu. Kalıcı sıra:

> Her DB değişikliği iki adımdır:
> 1. **Önce Supabase SQL Editor** → DB'ye uygula → doğrulama sorgularını çalıştır
> 2. **Sonra GitHub'a upload** → CI yeşil → versiyonlama
>
> Tek sıra. Atlamak yok. İkisi de yapılmadan migration "tamamlandı" sayılmaz.

---

> 45 kapanışında yazıldı. 46 başında ilk okunacak.
