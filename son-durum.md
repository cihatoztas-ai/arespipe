# son-durum.md — Oturum 187 sonu

## HEAD
187 kapanışı. Kod commit'leri: B `1afe670` → A1 `87dc444` → A2-dilim1 `c93d66e` → A2-fix `0e50dd3`. Fonksiyon **12/12** (yeni api yok). Migration yok. Çalışma ağacı temiz olmalı.

## 187'de yapılanlar — spool sayım emniyeti (B + A1 + A2), hepsi canlı + commitli

### MK-187.1 (B) — sessiz-fallback emniyet ağı (1afe670)
crop yalnız vision'da kullanılır; yoksa model tam-sayfada [n]'leri kaçırıp eksik sayabilir. izometri-oku `_sayim_kirpimsiz = !spool_kirpim_b64` taşır (cevap_full'a yedirilir, cache'te yaşar). kuyruk-isle-izometri: `_sayim_kirpimsiz && spool_kaynak='pozisyon'` → `manuel_onay` (gözle say) + `parse_sonuc._sayim_uyarisi`. Tek başına manuel_onay'a düşürmez; karar spool_kaynak'a bağlı → Tersan/Excel-listeli ETKİLENMEZ.

### MK-187.2 (A1) — PAOR çizim-başı SPOOL göz-onayı (87dc444)
Dökümanlar sekmesinde her PAOR çizimi için: kırpılan SPOOL kutusu thumbnail + "PDF'ten N spool" + S0n. Thumbnail istemcide `_spoolKirpim` ile YENİDEN üretilir (deterministik = modelin gördüğünün aynısı, $0 depolama, geriye-dönük). `_spoolKirpim` drain public API'ye eklendi. Thumbnail cache. Risk #1/#3 (crop bölgesi yanlış / model crop'la bile yanlış saymış) gözle yakalanır. B ise #2'yi (sessiz fail) kapatır.

### MK-187.3 (A2 dilim-1) — spool sayısı operator override (c93d66e)
A1 panelinde "Gerçek spool sayısı" + Uygula. Sentetik `fazla` (S0k, sebep:'kabukta_yok') üret → MEVCUT `_paorBolShell` (184/A) boş shell enjekte → `inceleGetir`. Terfi-öncesi katman (WIZ._kabukSpoollar); kabuk mutasyonu yok, terfide (aktar) kesinleşir.

### MK-187.4 (A2 fix) — override idempotent + bug (0e50dd3)
SORUN (canlı kanıt): 102769 PDF=2, ama Uygula sonrası kabukta 5-7 (katlanma). Sebep: (1) "N'e kadar EKLE" mantığı, (2) inceleGetir kendi _paorBolShell'ini server fazla'sıyla tekrar çalıştırıyordu, (3) panel guard + sayı PDF-bağlı. ÇÖZÜM: idempotent "N'e AYARLA" (yukarı ekle/aşağı çıkar), `inceleGetir(bolAtla)` re-expansion atlar, panel guard kaldırıldı + panel kabuk-gerçeğini gösterir ("Düzeltildi → kabukta M", giriş=kabuk sayısı).

## Bugün netleşen DATA bulguları (hepsi DATA-first, MK-158.1)
- **PAOR Excel'de spool ayrımı YOK (kesin):** her BOM Excel `farkli_spool=1` (hepsi "S01"), `pipeline_malzemeleri` pipeline-seviyesi. D (Excel↔PDF çapraz-kontrol) bu yüzden ölü — spool sayısı yalnız PDF'ten.
- **Spool sayısı PDF-pozisyon'dan** (devre-inceleme.js:148, idx→S0n).
- **1→N genişleme MEVCUT:** `_paorBolShell` (184/A, MK-182.6) PDF fazla'sını boş shell olarak enjekte ediyor. Override aynı motoru sentetik fazla ile kullanır.
- **crop evrensel çalışıyor:** tüm PAOR parse'larında input_tokens=6582 (crop gitti). Sayımlar tutarlı (102773→3, 102780→3, 102782→3, çoğu 2/1).

## Açık işler (carry — taze SQL ile doğrula, MK-163.1)
- **A2-dilim2 (SIRADAKİ ASIL):** Override ile eklenen spool "Eksik/döküman yok" alıyor — YANLIŞ (PDF o spool için de çizilmiş). Kök sebep: eşleştirme `pipeline|spoolNo`, izometri tarafında eklenen spoolNo yok. ÇÖZÜM: shell kardeş S01'in is_id/dosya_adi'sini DEVRALSIN + devre-inceleme durum/sıralama yansıtsın (S01→S02→S03 ardışık).
- shell malzeme devralma (MK-182.5: S0n malzeme "—" boş; S01 pipeline malzemesini paylaşsın).
- A2 aşağı-düzeltme fazla-render netleştirme. Override kalıcılığı = bellekte, terfide kesinleşir (TASARIM, bug değil).
- `b4af5c2b` cizim_no=null devrelerde override sibling eşleşmezse genişlemez (toast verir).
- 186 carry: crop sertleştirme (çok-spool ucu), format_id=null cache envanteri, NPS→mm (Tersan Faz2).

## Disiplin notu
Tüm 187 müdahaleleri PAOR-scoped (spool_kaynak='pozisyon' / `-PAOR-` deseni). Tersan / Excel-listeli formatlar dokunulmadı. Migration/api/şema YOK → fonksiyon 12/12. Her patch anchor-doğrulamalı Python + .bak + MD5 (MK-172.6); B/A1 izole JS node --check; hepsi MD5 birebir + idempotent ABORT testi geçti. Commit'ler [skip ci]'siz (kod), handoff [skip ci].
