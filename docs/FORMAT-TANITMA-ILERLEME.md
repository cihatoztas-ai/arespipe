# Format Tanıtma — İlerleme Günlüğü (oturum 148'den itibaren)

> Kronolojik ilerleme kaydı: 148 → 149 → 150 → … Her oturum sonuna kendi bölümünü ekler.
> Eski adı FORMAT-TANITMA-148-ILERLEME.md idi; 150 kapanışında oturum-bağımsız ada çevrildi.

## ✅ TAMAMLANAN (oturum 148) — döngü uçtan uca çalışıyor
- **format_tanit.html** üretimde: ARES bootstrap + `tenant_features` flag (`format_tanit`) + `/vendor/pdfjs-1.10.100/` + gerçek Supabase insert.
- **pdfjs v1.10.100 vendor'landı** (`vendor/pdfjs-1.10.100/{pdf.js,pdf.worker.js}`). Tarayıcıda sunucu ile birebir temiz metin.
- **Migration A uygulandı**: `egitim_kaynagi` CHECK'e `'cizim_capa'` eklendi.
- **feature_flags**'a `format_tanit` katalog satırı + Demo Atölye `tenant_features` aktif.
- **cozumle()** bölge→değer+boşluk-dayanıklı regex; pipeline deseni çok-segmentli koda genellendi (ALS + SP## + …). 9 alan + pipeline iki formatta doğrulandı.
- **KANIT**: kaydedilen kural `test-l2-format.mjs` ile GERÇEK l2-parser'da çalıştırıldı → `parser_seviye: l2`, 7/8 (8. = pipeline, çapraz-format olduğu için beklenen), **AI yok, $0**.
- Kaydet sonrası buton "Kapat"a döner. Tema-duyarlı (light/dark).
- İlk gerçek $0 L2 format kaydı: `egitim_kaynagi='cizim_capa'`, `requires_ai=false`.

## Açık küçük borçlar (format_tanit)
- **INSERT→UPDATE**: aynı format tekrar tanıtılınca yeni satır yerine fingerprint'e göre güncelle (şu an elle siliyoruz). Test sırasında çift satır oluşabilir. ✅ 149'da kapandı
- **bbox → PDF-point** normalize (şu an render-px, scale'e bağlı; konum_ipucu opsiyonel/l2 yoksayıyor). ⏳ açık
- **Malzeme tablosu**: bölge işaretle → satır desenleri toplu AI (henüz stub). ⏳ açık → 150: tasarım DEĞİŞTİ, deterministik sentez (TABLO-TASARIM.md)
- ares-layout nav entegrasyonu (şu an kendi çerçevesi). ⏳ 149'da atlama listesine alındı (bilinçli tam-ekran çerçeve)

## ADIM B — iki AYRI şey (oturum 149 başlangıcı)
Cihat'ın isteği iki farklı kategori:

### B1 — Hedefli tek-alan ÇAPA (kural düzeltme)
Tanınan formatta (parser_kural var) tüm akış değil, **sadece sorunlu alan**: "yüzey nerede?" / "bunu yanlış okudu, burası". 
- Aynı ekranın **hedefli kipi**: mevcut formatı yükle → alan listesini göster → operatör bir alanı seçip yeniden işaretle → o alanın regex'ini güncelle.
- Gerektirir: **format UPDATE** (parser_kural.alanlar[alan] güncelle). = paylaşılan çekirdek (cozumle + mini-çapa).
- Reuse: wizard inceleme tek-alan + spool_detay "çizimden düzelt".

### B2 — Tekil DEĞER düzeltme (anlam/eşleme — Paslanmaz→Asit)
**Okuma hatası DEĞİL** — parser doğru okuyor ("Paslanmaz"), ama tersane o alanda Paslanmaz yazınca "Asit"i kastediyor.
- **İLKE**: kaynağı sessizce EZME (bindir MK-111.2). Düzeltme **işaretli/izlenebilir** olmalı ("düzeltildi: PDF 'Paslanmaz' diyordu").
- **Varsayılan = tekil, güvenli**: o spool'un değerini düzelt → mevcut **`taslak_duzeltmeleri`** tablosuna yaz (wizard inceleme zaten kullanıyor; onConflict: tenant_id,devre_id,pipeline_no,spool_no,alan,kalem_idx). YENİ DEPO KURMA.
- **Format-geneli eşleme = riskli**: `deger_haritasi {Paslanmaz:Asit}` parser_kural'a; runtime l2-parser post-processing'de uygular. SADECE "bu formatta hep böyle" kesinse + işaretli. Aksi halde gerçekten paslanmaz olan spool'u da yanlış çevirir → kullanma.

## Read-before-write (Adım B'ye başlamadan)
- `taslak_duzeltmeleri` tam şema (kolonlar, NOT NULL) — B2 için.
- Wizard inceleme'nin düzeltmeyi nasıl OKUDUĞU/uyguladığı (B2 entegrasyon).
- format UPDATE deseni (parser_kural jsonb güncelle) — B1 için. ✅ 149

## Sıra önerisi
Önce **B1** (kural tek-alan düzeltme — temiz uzantı), sonra **B2** (değer düzeltme, taslak_duzeltmeleri'ne işaretli). l2-parser deger_haritasi en sona, yalnız gerekirse.

---

## OTURUM 149 — TAMAMLANAN (B1 + A + B + prompt_template + CI)

### B1 ✅ — düzeltme kipi
- format_tanit.html'in **düzeltme kipi** (`_mode='duzelt'`) kuruldu. Format yükle (URL `?format_id=&alan=` veya picker dropdown) → kayıtlı regex'ler hidratlanır → sorunlu alanı yeniden işaretle → **yalnız o alan** PATCH'lenir.
- **Patch, rebuild DEĞİL:** `_mevcutKural` derin kopyalanır, sadece `_dirty` alanlar üzerine yazılır → malzeme_tablosu / kabul_kriterleri / AI satır desenleri korunur. UPDATE `.eq('id')` + `guncelleme_at`.
- INSERT→UPDATE borcu kapandı (fingerprint.dosya_adi_regex + tenant dedup, onaylı UPDATE/INSERT).

### A ✅ — içerik-bazlı oto-tespit (spec'te yoktu, Cihat itirazıyla eklendi)
- Cihat'ın gözlemi: "bu format" demeden sistem en uygun formatı kendi bulmalı; Tersan diyoruz ama Cadmatic'in farklı sürümü olabilir, kural tutuyorsa büyük çoğunluğu tanınır.
- `otoTespit()`: PDF açılınca tenant L2 formatlarının (`requires_ai=false`) kuralları CANON_ALL'a koşulur, en çok alan okuyan kazanır (eşik skor>=3 || skor>=2 & >=%50). Otomatik düzeltme kipine girer.
- **Canlı kanıt:** M110-306-SP13.S02 picker'a dokunmadan açıldı → "tersan test" otomatik eşleşti, **8/8 alan okundu**.

### B ✅ — alan yeşil/kırmızı
- `_alanlariKos()`: her kayıtlı regex bu PDF'e karşı koşulur → yeşil (okudu) / kırmızı (okuyamadı) / nötr (formatta tanımsız). İlk kırmızı alana otomatik atlar. "PDF avlamadan sorunu gör" derdinin çözümü.

### prompt_template ✅
- Cihat sorusu: AI'a sözlü tarif yazılabilsin mi → evet. Tamamla ekranına "AI'a sözlü tarif" textarea. Insert/dedup-update/düzeltme üç yola da bağlı. Yalnız L3 fallback, deterministik kuralın yerine geçmez.

### CI
- format_tanit.html → ares-layout.js + atlama listesi (`format_tanit`). Eski _arsiv md'leri untrack. CI yeşil.

## ADIM B2 — HÂLÂ AÇIK (sonraki)
B1 bitti; B2 (Paslanmaz→Asit, taslak_duzeltmeleri'ne işaretli değer düzeltme) henüz yapılmadı. Read-before-write: taslak_duzeltmeleri şeması + wizard'ın düzeltmeyi okuması.

## 150 ANA TEMA — SORU AĞACI
"Elle ayarla" panelini yönlendirmeli akışa çevir. Tek deterministik motor, iki yerde: AI öncesi (ufak düzeltme) + AI sonrası (stragglar). Sonra AI merdiveni (operatör tetikli 2. çağrı + mühür). Detay: CLAUDE-SONRAKI-OTURUM.md.

---

## OTURUM 150 — TAMAMLANAN (AI-oku + schedule zinciri + tablo tasarımı)

### Mimari dönüş (Cihat kararı) ✅
Soru ağacı beyaz tahtası → "her format tanıtımında bir AI mantıklı, orayı anlat burayı anlat pratik olmaz."
**AI önce okur**, elle işaretleme AI'ın kırmızı bıraktığının TAMİRİ (B1) oldu. İlke: AI değer BULUR, kural yazmaz —
kuralı cozumle sentezler, **kural çıktısı == AI değeri** ground-truth (MK-51.2 çözümü). Sızıntı kuralı: AI null +
cozumle dolu → mühürleme (M230 dn vakası node kanıtıyla yakalandı, 8/9 yeşil).

### AI-oku (Increment 1) ✅ GEMİDE — `3393eb6`
🟣 buton → mevcut /api/izometri-oku (MK-129.3 12/12 ✓, MK-49.1 dokunulmadı; yan etki analizi: batch+ai_api_log+cache,
spooller/izometri YAZILMAZ, MK-117 güvenli) → spoollar[0] → _aiSentezle: yeşil mühür / kırmızı + "🟣 AI gördü: X"
ipucu / sızıntı atla. malzeme_listesi `_aiSatirlar`'da saklanır (Increment 2 girdisi). Canlı: Y100-817-013 + 018.

### Schedule türetme zinciri ✅ GEMİDE (uyuyor) — `6359555` + `30e995c`
Y100 ailesi boyutu "2\" Sch 10S" yazar (60.3 metinde YOK) → çıkarma değil ÇEVİRME. Zincir: l2-parser spool.schedule
geçişi + izometri-oku asmeFallbackDoldur→boruOlcuBul schedule paramı (**MK-49.1 kontrollü istisna**, undefined=no-op
kanıtlı, ayrı commit). İlk schedule'lı kural kaydında canlanır. Çevirme TEK merkez: ARES_OLCU.olcuParse→ARES_BORU
(Node-uyumlu; npsToDn('1-1/2')→40 doğrulandı).

### Tablo motoru tasarımı kilitlendi (Cihat finali) → 151 ANA İŞ
"Teaching'in tek sorusu: malzeme tablosu nerede" — çap/et/dn soruları öldü, Boyut sütunundan türerler.
**TAM SPEC: docs/FORMAT-TANITMA-TABLO-TASARIM.md** — _tabloSentezle + l2-parser olcuParse/dominant-Boru +
3-PDF mekanik test + kenar vakaları + sonrası kuyruğu. 151'de tartışma tekrarlanmaz.
