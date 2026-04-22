# AresPipe — 19. Oturum Gündemi

## Oturum Başı Ritüeli
1. CLAUDE.md oku (özellikle 2.13 Enum Normalize → **Kural E-06 Malzeme/Kalite Ayrımı**)
2. CLAUDE-SON-OTURUM.md oku (18. oturum özeti)
3. Deploy durumunu kullanıcıdan sor — 18. oturum çıktıları deploy edildi mi?
4. DB migration çalıştırıldı mı kontrol et (`spool_malzemeleri.kalite = NULL where kalite=malzeme`)

## 🔴 ÖNCELİK 1 — Malzeme/Kalite Veri Bütünlüğü (Sistematik Çözüm)

### Neden bu oturum kritik
18. oturumda **kısmi çözüm** yapıldı. Kullanıcının ana endişesi hâlâ geçerli:
> "Bir yerde ST37 bir yerde karbon yazarsa programın içinde ne neydi kayboluruz. ST37 diye arama yapsak mesela spoolların yarısını bulamayız."

Eksik kalanlar:
- **`pipeline_malzemeleri` tablosuna yazan kaynak dosya bulunmadı** → muhtemelen bozuk veri oradan geliyor
- **Manuel giriş validation yok** — kullanıcı elle "karbon" yazabilir
- **`kesim_kalemleri` yazım noktaları denetlenmedi**
- **DB constraint eklenmedi** — bir daha aynı bug olursa kod seviyesinde engel yok
- **Arama tutarsız** — aynı malzeme için bazı kayıtlar kategori, bazıları kalite üzerinden eşleşiyor

### Kullanıcıdan istenecek dosyalar
- `proje_detay.html` — muhtemelen pipeline_malzemeleri'ne yazan sayfa
- Varsa `pipeline_yeni.html`, `pipeline_detay.html` veya benzer
- `kesim_kalemleri` tablosuna yazan dosyalar (büyük ihtimalle kesim.html + muhtemelen spool_detay aracılığıyla)

### Yapılacaklar Sırası
1. **Tam data flow haritası çıkar:**
   - Hangi tablo (spooller, spool_malzemeleri, pipeline_malzemeleri, kesim_kalemleri, bukum_kalemleri, markalama_kalemleri, is_emri_kalemleri) → malzeme+kalite kolonu var mı?
   - Her tabloya yazan TÜM dosyaları tespit et
2. **Her giriş noktasında altın kurala uyum doğrula** (CLAUDE.md Kural E-06):
   - IFS/PDF/Excel okuma → ham sakla
   - Form kayıt → `ARES_NORM.malzemeKod()` ile kategori ayrı, kalite raw
   - Tablo-tablo aktarım (pipelineAktar gibi) → defensive normalize
3. **Manuel giriş validation** ekle:
   - `spool_detay.html` `newRowKaydet` — kullanıcı kalite alanına kategori kodu yazarsa (karbon/paslanmaz/...) reddet veya uyar
   - Benzer şekilde `newRowAc`/`manzKayit` vs.
4. **DB audit SQL'leri hazırla:**
   ```sql
   -- Her tabloda bozuk kayıt sayısı
   SELECT 'spool_malzemeleri' as tbl, COUNT(*) FROM spool_malzemeleri WHERE LOWER(TRIM(kalite))=LOWER(TRIM(malzeme));
   SELECT 'pipeline_malzemeleri' as tbl, COUNT(*) FROM pipeline_malzemeleri WHERE LOWER(TRIM(kalite))=LOWER(TRIM(malzeme));
   SELECT 'kesim_kalemleri' as tbl, COUNT(*) FROM kesim_kalemleri WHERE LOWER(TRIM(kalite))=LOWER(TRIM(malzeme));
   ```
5. **DB CHECK constraint'leri ekle** (yazılım seviyesi koruma yeterli değil):
   ```sql
   ALTER TABLE spool_malzemeleri
     ADD CONSTRAINT check_kalite_different_from_malzeme
     CHECK (LOWER(TRIM(kalite)) != LOWER(TRIM(malzeme)) OR kalite IS NULL);
   -- Aynısını pipeline_malzemeleri ve kesim_kalemleri için
   ```
6. **Arama stratejisi akıllı hale getir:**
   - Kullanıcı "ST37" arasa → `kalite ILIKE '%ST37%'` **VE** `malzeme='karbon' AND kalite IS NULL` (eğer hiç kalite girilmemişse kategori üzerinden tahmin)
   - Kullanıcı "Karbon Çelik" arasa → `malzeme='karbon'`
   - Veya dropdown filter: iki ayrı sütun (Malzeme kategori / Kalite spesifik) yan yana

## 🟡 ÖNCELİK 2 — Çok Küçük Kalanlar

### Kesim
- "Kesilmiş Borular" global arama tab'ı (kullanıcı talebi, 18. oturumda zaman kalmadı)
  - 4. sekme olarak "Kesilmiş Borular" — tek tek borular, hangi KL'de kesilmiş
  - Ya da mevcut "Kesilen Listeler" sekmesine içerik araması

### Genel
- 18. oturumda yapılmış ama test edilmemiş akışların kontrolü:
  - Bukum cascade filter gerçekten cascade mı, yoksa tüm havuzdan mı seçenek çıkarıyor?
  - Markalama "Markalama Eklendi" logu spool detayda doğru label ile görünüyor mu?

## 🟢 ÖNCELİK 3 — Uzun Vadeli Birikim (Zaman kalırsa)

### G-02 Hero+Pill Uyumu Eksik Sayfalar
anasayfa → kalite_kontrol → sevkiyatlar → tersaneler → uyarilar → kullanicilar

### Export
bukum.html ve markalama.html için Excel + PDF export (kullanıcı 18. oturum gündeminde istemişti, devraldık)

## 🔵 Teknik Borçlar (yeri geldikçe)

- `KL26-023` DB'de takılı kalmış mı? SQL migration çalıştırıldıysa temizlenmiş olmalı
- Dil dosyalarında `kld_*` anahtarları eklendi ama production'da test edilmeli — EN/AR dil değiştirince kesim modalı düzgün mü?

## Oturum Planı Önerisi

**Bu oturumun yapısı farklı olmalı** — 18. oturum çok koda odaklıydı. Bu oturum daha **sistematik + araştırmacı** olmalı:

1. **İlk 30 dk:** Data flow haritası çıkar (dosyaları inceleyerek, kod yazmayarak)
2. **Sonra 30 dk:** Her kritik noktada altın kural kontrolü + eksikleri liste
3. **Sonra 30 dk:** DB audit sorgularını çalıştır, gerçek bozulma boyutunu ölç
4. **Sonra 30-60 dk:** Tüm düzeltmeleri tek seferde uygula
5. **Son 15 dk:** Test + deploy kontrol listesi + CLAUDE.md güncellemesi

**Kritik:** Parça parça deploy etmek yerine, data flow'un TAMAMINI gördükten sonra tek deploy. Yarım çözüm = yanlış güven.
