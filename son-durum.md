# AresPipe — Güncel Durum (son güncelleme: Oturum 105, 21 May 2026)

## Bu oturumda yapılanlar (105)

"Küçük temizlik" açıldı; B-geometri Faz 1 (Tersan İmalat L2) tamamlandı + canlı teyit edilip
iki üretim bug'ı düzeltildi; PAOR ana çizim feasibility kapatıldı (MK-105.6).

### İş 1 — PAOR isometric_view parse-dışı, saklama (CANLI, f45ceae)
Ölçümle iso_view'in hiç yüklenmediği ($0 sızıntı) görüldü → önleyici. Migration 086 (parse_disi +
'saklama' durum), kuyruk-isle/durum + batch UI. izometri-oku.js'e DOKUNULMADI (MK-49.1).

### B-geometri Faz 1 — Tersan İmalat L2 parser_kural (CANLI, $0, doğrulandı)
- **Motor:** lib/l2-parser.js jenerik config-parser; server **pdf-parse** (jammed metin). Kod değişmedi.
- **Kapsam:** 7 satır tipi (boru-mm, boru-SCH, groove, kaynak, Ic Bilezik, Dirsek, Flanş) ×
  ST37/316L/AISI 316L/CuNi10Fe1./St.St/St*. Alanlar: spool_no, agirlik_kg, yuzey, tarih, cap_mm,
  et_mm, **dn**. Türkçe karakter yok (tetikleyici ASCII, tanım `.+?`).
- **Migration 087:** parser_kural HER İKİ Tersan formatına (MK-105.4 = A; tie-break-proof). Commit f33bbf7.
- **Canlı teyit (ai_api_log):** 3 PDF → `parser_seviye='l2'`, `cagri_tipi='L2_deterministic'`,
  `maliyet=0`. **L3 ($0.46) öldü.** Faz 1 kazancı canlıda kanıtlı.

### Migration 088 — canlı teyit sonrası 3 düzeltme (CANLI, dn_var=true)
İlk yüklemede 3 spool manuel_onay'a düştü → teşhis: parse sonrası `halusinasyonFiltresi`
(izometri-oku.js, DOKUNULMAZ) spool'a uygulanıyor. Üç sorun parser_kural'da giderildi:
1. **Spool DN (kritik):** Madde 1 `if(!sp.dn)` → KRİTİK → manuel_onay. mm boru OD veriyor, DN değil.
   Fix: `alanlar.dn` = malzeme satırı DN (`DN(\d+)\s+(?:\d|L=|OD:)`); NOT'taki "DN25 Drain" elenir. 8/8.
2. **İki-haneli No (BUG1):** fitting/op pattern leading'i lazy idi → No≥10'da tanım başına fazladan
   rakam ("1Flanş") + adet yanlış. Greedy yapıldı (`^\d+(\d)`). G200 çok-spoollu çizim çıktısında tespit.
3. **NOT satırı (BUG2):** flans tetikleyici "Flan" NOT içindeki "flangler"ı ham satır yapıyordu.
   Sıkılaştırıldı: `Flan\S*\s+D` (gerçek "Flanş Düz" tutar).
- Doğrulama: 8 gerçek + montaj + sentetik (iki-haneli No + NOT) = **10/10**; test'e adet + "tanım
  rakamla başlamaz" regresyon guard'ı eklendi. Commit 6e49fa2. **DB: dn_var=true, satir_tipi=7.**
- Kalan zararsız: `malzeme_bos` (orta, tek başına manuel_onay yapmıyor — canlı veri kanıtladı).

### PAOR ana çizim — L2 imkânsız (MK-105.6)
6 ana çizim: pdf-parse ~boş, pdftotext 1 char, pdffonts 0 font → metin katmanı yok (vektör/raster).
Deterministik L2 mümkün değil; vision L3 zorunlu. $0.62 kaçınılmaz. iso_view = saklama (İş 1).

## Mimari kararlar (105)
- **MK-105.1** parse_disi bayrağı · **MK-105.2** 'saklama' terminal · **MK-105.3** ölç-sonra/pdf-parse gerçeği
- **MK-105.4** Tersan fingerprint ayrışmaz → kural her iki formata · **MK-105.5** montaj=yerleşim, detay=yon_dizilim
- **MK-105.6** PAOR ana çizim metinsiz → L2 imkânsız, L3 zorunlu
- **MK-105.7** L2 spool, halusinasyonFiltresi'nin (izometri-oku) beklediği şemayı sağlamalı (spool dn yoksa
  kritik → manuel_onay). parser_kural alanlarıyla karşılanır; filtreye dokunulmaz.
- **MK-105.8** Üretim çıktısı, sentetik örneklerin yakalamadığı kenar durumları açar (iki-haneli No leading
  split; içinde malzeme kelimesi geçen NOT). Canlı test + regresyon guard zorunlu.
- (MK-51.2 uygulandı.)

## Maliyet tablosu (105 sonrası)
- Tersan İmalat detay → **$0** (L2, yeni yüklemeler) · Tersan Montaj → L3 (geometri 106)
- PAOR iso_view → saklama · PAOR ana çizim → **L3 kalıcı ($0.62)**, vision zorunlu

## Önemli kalıcı hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1). · **İzometri batch = SADECE Excel** (MK-104.1).
- parser_kural değişirse **DB + test/l2-tersan-kural.json İKİSİ** güncellenir; cache'li PDF eski parse'ı
  döndürür → fix sonrası cache temizle ya da yeni dosya.
- Kuralın yeri: DB (`izometri_format_tanimlari.parser_kural`, runtime); migration = tohum kaydı;
  lib/l2-parser.js = jenerik motor. "Her format ayrı tutulur" = her formatın kendi DB satırı.
