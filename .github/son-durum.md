# Son Durum — 139. Oturum (1 Haziran 2026)

> İki iş kapandı + bir tasarım turu. (1) **B-çap sürprizi ÇÖZÜLDÜ (MK-139.1):** taslak inceleme modalı
> artık çapı terfi etmeden gösteriyor — `grupla()` spool başlığına cap/et türetir + `incelemeTablosu`
> whitelist'i iki dalda taşır. (2) **PARSER dokümanı** Bölüm 13 (operatör düzeltme döngüsü vizyonu) +
> 0.0 üç-faz yol haritası ile güncellendi. (3) Tasarım: Q5 karara bağlandı (ayrı taslak-düzeltme tablosu);
> malzeme↔kütüphane tanıma kopukluğu teşhis borcu olarak yazıldı (140 ilk iş). Yeni endpoint yok (12/12).

## Yapılanlar (sıra)

### 1. B-çap sürprizi — ares-kabuk.js + lib/izo-eslesme.js (fix 139, MK-139.1)
- **Kök iki parçaymış (koşan kodla doğrulandı, üç tur):** (a) `grupla()` spool başlığına cap/et yazmıyor
  (türetme yalnız `aktar()`/terfide); (b) `incelemeTablosu` çıktı spool'unu **spread değil whitelist**
  ediyor → grupla cap/et üretse bile endpoint atıyor.
- **Fix:** `grupla()`'ya `aktar()` (174-175) ile birebir `anaBoru→boyutParse` türetmesi (`cap:bp.dis_cap,
  et:bp.et`). `incelemeTablosu` whitelist'i **iki return dalında da** (eşleşen + eksik) cap/et taşır.
- **Doğrulama:** node --check ×2, orijinal self-test ✅ (regresyon yok), uçtan uca grupla→incelemeTablosu
  cap/et dolu (boru yoksa null → modal "—", doğru). commit `862e965`. CI yeşil (Kod Kalite #975 + Auto-Update
  #473), Vercel Ready. Canlı görsel teyit kullanıcıya kaldı.
- **Süreç dersi:** Bu fix'te üç kez kısmi kanıttan tam sonuç çıkarıldı (endpoint "geçiriyor", satır 42 "çıktı
  çapı", whitelist), her biri bir sonraki dosyayla düzeltildi. Asıl whitelist izo-eslesme.js'deydi — MK-126.8
  (görmeden yazma) tam burada işe yaradı.

### 2. PARSER-VE-YUKLEME-AKISI.md güncellendi (docs)
- **0.0 Yol haritası (Cihat 139):** üç faz — Faz 1 yapısal tamamlama (İÇİNDEYİZ) → Faz 2 Tersan doygunluk
  testi → Faz 3 farklı formatlar. Sıra bağlayıcı.
- **Bölüm 13:** operatör düzeltme döngüsü vizyonu. 13.1 B-çap kapanışı; 13.2 tam akış; 13.3 vizyon×gerçek
  var/yok tablosu (G2a popup / G3 yayılma / G4 L3 eşiği = YOK, kod kanıtıyla); 13.4 kısıtlar; 13.5 KARAR
  BEKLEYEN sorular; 13.6 sıralama; 13.7 malzeme↔kütüphane teşhis borcu; 13.8 mühür.
- **§12.2 → ÇÖZÜLDÜ (139)**, üst banner → 139.
- İlk commit `4a5798f` (Bölüm 13 + banner + §12.2). Bu oturumun ek düzenlemeleri (0.0 + Q5 KARAR + 13.7)
  YENİ docs commit gerektiriyor (aşağıda).

### 3. Tasarım kararları (kod yok)
- **Q5 KARAR:** popup düzeltmesi → **ayrı taslak-düzeltme tablosu** `(devre_id,pipeline_no,spool_no,alan)`.
  Gerekçe: döngü (yayılma + L3-öncesi-dedup) kalıcı+sorgulanabilir düzeltme ister. parse_sonuc (worker'ın,
  ezilir) ve client-state (kaybolur) elendi. Taslak=terfi: tek noktada overlay (önizleme + aktar öncesi).
  Client-side supabase+RLS yazma (mevcut taslak-yazma deseni) → yeni endpoint yok. **Kod öncesi doğrulanacak:**
  taslak yazmaları gerçekten client-side mı + yeni tabloya client-write RLS uygun mu.
- **Q2 ÖNERİ (KARAR DEĞİL):** yayılmayı türe göre ayır — Tür A (glyph/tanıma)=kural (format, anonim, $0,
  KARAR-48.1) = G3b motoru + Band-B'nin operatör-beslemeli hâli; Tür B (değer)=o spool, yayılmaz. 140'ta karar.

## CI / commit (bugün)
- `862e965` B-çap fix (kod, CI yeşil, Vercel Ready) · `4a5798f` PARSER Bölüm 13 [skip ci].
- **Bu kapanışta gidecek (docs [skip ci]):** PARSER güncel (0.0+Q5+13.7) + bu üç kapanış dosyası.

## Mühürlenecek MK (KARARLAR.md)
- **MK-139.1:** B-çap — `grupla()` spool başlığına cap/et türetir (`aktar` ile birebir, tek kaynak) +
  `incelemeTablosu` whitelist iki dalda cap/et taşır. Taslak=terfi. Kabuk spool'unun ÇIKTIYA taşınan alanları
  tek noktada (`incelemeTablosu` iki return dalı) belirlenir — yeni başlık alanı ikisini de günceller.

## 140'a Açık Borç (öncelik)
1. **Malzeme↔kütüphane tanıma kopukluğu (TEŞHİS, ilk iş):** kütüphane var ama yüklenen malzeme tanınmıyor.
   Kök BİLİNMİYOR — tahmin yok. Teşhis planı §13.7. Faz 2 (Tersan doygunluk) öncesi kapanmalı.
2. **Faz 1 operatör döngüsü:** G2a (popup değer düzeltme, Q5 kararıyla) → G3a (yayılma, Q1/Q2 kararıyla) →
   G4/G3b (L3 eşiği + dedup). Sıralı, her biri ayrı oturum.
3. Q1-Q4/Q6 tasarım kararları (§13.5) — G2a öncesi en azından Q2 netleşmeli.
4. (Bağımsız) pipeline-içi doğrulama (4.4-1) · Band-B glyph (=G3 Tür A) · kalite/alıştırma modal whitelist.
5. (Faz 2/3) yukleyen_id · fitting kütüphane (DIN 86087/ASME B16.9) · mobil React · et/çap çelişki turu.
