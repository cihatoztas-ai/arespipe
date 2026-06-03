# Format Tanıtma — Oturum 148 İlerleme & Adım B Tasarımı

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
- **INSERT→UPDATE**: aynı format tekrar tanıtılınca yeni satır yerine fingerprint'e göre güncelle (şu an elle siliyoruz). Test sırasında çift satır oluşabilir.
- **bbox → PDF-point** normalize (şu an render-px, scale'e bağlı; konum_ipucu opsiyonel/l2 yoksayıyor).
- **Malzeme tablosu**: bölge işaretle → satır desenleri toplu AI (henüz stub).
- ares-layout nav entegrasyonu (şu an kendi çerçevesi).

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
- format UPDATE deseni (parser_kural jsonb güncelle) — B1 için.

## Sıra önerisi
Önce **B1** (kural tek-alan düzeltme — temiz uzantı), sonra **B2** (değer düzeltme, taslak_duzeltmeleri'ne işaretli). l2-parser deger_haritasi en sona, yalnız gerekirse.
