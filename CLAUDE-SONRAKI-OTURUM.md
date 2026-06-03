# CLAUDE-SONRAKI-OTURUM.md — Oturum 149 açılışı

## Açılış ritüeli
1. `git pull`, `git status` temiz mi
2. Fonksiyon sayısı 12/12 mi (`ls api/*.js | wc -l`) — MK-129.3
3. Bu dosya + son-durum.md + docs/FORMAT-TANITMA-148-ILERLEME.md oku
4. Ajanda onayı

## İLK İŞ: temizlik
Test sırasında oluşan çift/bozuk format satırlarını temizle:
```sql
select id, ad, parser_kural->'alanlar'->'pipeline_no'->>'regex' as pl, olusturma_at
from izometri_format_tanimlari where egitim_kaynagi='cizim_capa' order by olusturma_at;
```
Bozuk pipeline'lı (içinde "PIPE NO" geçen) varsa sil; temiz olan(lar) kalsın.

## ANA İŞ: Adım B — iki ayrı parça (sıra: B1 → B2)

### B1 — Hedefli tek-alan çapa (KURAL düzeltme)
Tanınan formatta hepsini değil sadece sorunlu alanı sor/düzelt ("yüzey nerede / bunu yanlış okudu burası").
- format_tanit'in hedefli kipi: mevcut formatı yükle → alan seç → yeniden işaretle → o alanın regex'ini UPDATE.
- Read-before-write: format UPDATE deseni (parser_kural jsonb partial update). INSERT→UPDATE borcunu da burada kapat.
- = paylaşılan çekirdek; reuse: wizard inceleme + spool_detay "çizimden düzelt".

### B2 — Tekil DEĞER düzeltme (Paslanmaz→Asit, anlam/eşleme)
Okuma hatası değil; tersane Paslanmaz yazıp Asit kastediyor.
- İlke: kaynağı sessizce EZME (MK-111.2). Tekil + İŞARETLİ.
- Mevcut `taslak_duzeltmeleri`'ne yaz (wizard zaten kullanıyor; onConflict tenant_id,devre_id,pipeline_no,spool_no,alan,kalem_idx). YENİ DEPO KURMA.
- Read-before-write: taslak_duzeltmeleri şeması + wizard'ın düzeltmeyi nasıl okuduğu.
- Format-geneli deger_haritasi (l2-parser post-processing) = EN SON, yalnız "hep böyle" kesinse.

## Sonraki (B sonrası)
- Tetik butonu: uyarılar/wizard'da "Bu formatı tanıt" → format_tanit.
- Kaydet sonrası backfill propagasyon (eslestirme-backfill.js zaten var) → eski L3 PDF'ler yeni L2 ile.
- Malzeme tablosu toplu AI; bbox PDF-point normalize.

## Hatırlatma
- Prototip/üretim ekranını repo kökünden servis et + giriş yapılı + flag aktif olmalı.
- node testleri uploads'taki l2-parser/glyph-onar/izometri-oku ile yapılabilir.

## EK NETLEŞTİRME (Cihat, oturum 148 sonrası) — B1 tetiği
**Sorun**: zayıf/güvensiz satır çıkınca kullanıcı PDF'i elle arayıp açıp okunamayan yeri bulmak zorunda — "olacak iş değil".
**Çözüm**: wizard inceleme'de zayıf satıra tıkla → **aynı ekranda o PDF render** (vendor pdfjs) → okunamayan alanı işaretle → düzelt → kapat. Akışı bölmeden, PDF avına çıkmadan.
**Asıl kazanç (teach-once-fix-all)**: bu işaretleme formatı öğretir (kuralı düzeltir) → kapsam "formatın tümüne" ise o formatın TÜM zayıf PDF'leri tek hamlede düzelir (re-parse / G3). Tekil değer fix'i ise sadece o spool (taslak_duzeltmeleri, işaretli).
**Tetik mantığı**: format hiç tanınmadı → tam tanıtma (format_tanit, bugünkü). Tanındı ama 1 alan zayıf → hedefli mini-çapa (B1).
**Giriş noktaları**: wizard inceleme zayıf-satır + (sonra) spool_detay "çizimden düzelt".
