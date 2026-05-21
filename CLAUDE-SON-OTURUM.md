# CLAUDE-SON-OTURUM — Oturum 105 (21 May 2026)

## Tema
"Küçük temizlik" açıldı; İş 1 canlıya alındı; B-geometri Faz 1 (Tersan İmalat L2) yazıldı, canlı
teyit edildi ($0) ve iki üretim bug'ı düzeltildi; PAOR ana çizim feasibility kapatıldı (MK-105.6).

## İş 1 — iso_view parse-dışı (CANLI, f45ceae)
Ölçüm: iso_view hiç yüklenmemiş → $0 sızıntı, önleyici. Migration 086 (parse_disi + 'saklama'),
worker filtresi + UI. izometri-oku DOKUNULMADI.

## B-geometri Faz 1 — Tersan İmalat L2 (CANLI, $0)
- pdf-parse jammed metnine göre 7 satır tipi × 6 malzeme ailesi parser_kural. 8 örnek, 0 ham (MK-51.2).
- Migration 087 → her iki Tersan formatı (MK-105.4). Commit f33bbf7. Fixtures f409b1c5, gitignore temizlik a3e81e3.
- **Canlı teyit:** ai_api_log'da 3 çağrı `l2 / L2_deterministic / maliyet=0`. L3 ($0.46) öldü.

## Migration 088 — canlı teyit sonrası 3 fix (CANLI)
Sebep: 3 spool manuel_onay'a düştü. Teşhis (canlı SQL): parse OK + $0, ama `halusinasyonFiltresi`
(izometri-oku, DOKUNULMAZ) Madde 1 `if(!sp.dn)` → KRİTİK. parser_kural'da 3 düzeltme:
1. **dn:** malzeme satırı DN (`DN(\d+)\s+(?:\d|L=|OD:)`), NOT "DN25 Drain" elenir. 8/8 doğru.
2. **BUG1 iki-haneli No:** lazy `^\d+?(\d)` → greedy `^\d+(\d)` (No≥10'da "1Flanş" + adet hatası).
3. **BUG2 NOT satırı:** flans tetikleyici "Flan" → `Flan\S*\s+D` ("flangler" NOT'u elenir).
Doğrulama 10/10 (8 gerçek + montaj + sentetik). Test'e adet + "tanım rakamla başlamaz" guard. Commit 6e49fa2.
DB teyit: dn_var=true, satir_tipi=7. Kalan `malzeme_bos` (orta) zararsız (canlı veride dn'li spool hazir).

> Üretim çıktısının gücü: BUG1/BUG2'yi 8 sentetik örnek yakalamadı; gerçek çok-spoollu çizim (S01/S02/S03,
> No≥10 + içinde "flangler" geçen NOT) açtı. Üretim testi şart (MK-105.8).

## PAOR ana çizim — L2 imkânsız (MK-105.6)
pdf-parse/pdftotext boş, pdffonts 0 font → metin katmanı yok. vision L3 zorunlu, $0.62 kaçınılmaz.

## MK (105)
105.1 (parse_disi) · 105.2 ('saklama') · 105.3 (ölç-sonra/pdf-parse) · 105.4 (fingerprint→kural her iki format) ·
105.5 (montaj=yerleşim, detay=yon_dizilim) · 105.6 (PAOR metinsiz→L3) ·
**105.7** (L2 spool halusinasyonFiltresi şemasını sağlamalı; dn zorunlu) ·
**105.8** (üretim çıktısı kenar durum açar; canlı test + regresyon guard).

## Commit'ler (105)
| Hash | Mesaj |
|------|-------|
| f45ceae | feat(105): iso_view parse-disi saklama (086 + worker + UI) |
| f33bbf7 | feat(105): tersan imalat L2 parser_kural + regresyon testi (087 + test/) |
| 409b1c5 | test(105): tersan L2 regresyon fixture |
| a3e81e3 | chore(105): gitignore'dan fixtures satiri kaldir |
| 6e49fa2 | fix(105): tersan L2 spool dn + iki-haneli No (BUG1) + NOT-disi flans (BUG2) — 088 |
| (kapanis) | docs(105): kapanis guncelleme [skip ci] |

## 106'ya devreden
1. **(Yapıldıysa atla) Tersan İmalat görsel re-test:** cache temizle + 3 PDF yükle → No≥10 baştaki "1" yok,
   NOT satırı yok, spool hazir. (DB 088 canlı; ai_api_log L2/$0 zaten teyitli.)
2. **B-geometri Faz 2/3:** yon_dizilim (detay) + yerleşim/AR (montaj) — lib/l2-parser.js KOD genişletme.
3. pipeline_no dosya adından; düzgün fingerprint ayrımı; çift-parse teyidi; B-öğrenme (MK-48.5).
4. (Ops.) S01/S02/S03 çiziminin PDF'ini gerçek fixture olarak ekle; malzeme_bos'u spool malzeme koduyla sustur.

> 106 açılışında oku: son-durum.md + bu dosya + CLAUDE-SONRAKI-OTURUM.md + docs/MK-B-GEOMETRI.md.
