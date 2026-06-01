# Oturum 140 — Malzeme↔kütüphane tanıma kopukluğu teşhisi + (Q2 kararı) + (varsa) G2a başlangıcı

## Açılış ritüeli
Git pull/status/log → CI rengi (139 son kod commit'i = B-çap `862e965`, yeşil teyitli) →
`son-durum.md` (139) + `CLAUDE-SON-OTURUM.md` (139) + bu dosya → KARARLAR **MK-139.1** (mühürlenmediyse işle) →
gündem teyidi. **Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12. 140'ta da yeni endpoint YOK hedefi.

## 139 nerede bıraktı
- **B-çap ÇÖZÜLDÜ** (MK-139.1, `862e965`): taslak modal çapı terfi etmeden gösteriyor. CI yeşil, Vercel Ready.
  Canlı görsel teyit Cihat'a kaldı (bir taslak devre incele → çap dolu mu).
- **PARSER doküman** güncel: Bölüm 13 (operatör düzeltme döngüsü) + 0.0 üç-faz yol haritası + Q5 KARAR +
  13.7 malzeme-kütüphane teşhis borcu.
- **Yol haritası (Cihat):** Faz 1 yapısal tamamlama (İÇİNDEYİZ) → Faz 2 Tersan doygunluk → Faz 3 formatlar.

## 1. İlk iş — Malzeme↔kütüphane tanıma kopukluğu TEŞHİSİ (§13.7, kod yok)
**Belirti (Cihat):** "Kütüphanemiz var ama yüklenen malzemeler hiç tanınmıyor — wizard kopukluğu."
**Kök BİLİNMİYOR. TAHMİN YOK** (139 dersi: koşan koda güven; bu oturumda 3 kez kısmi-kanıttan yanlış çıkarım).
Teşhis planı (sırayla, hepsi okuma/DB):
1. `git ls-files | grep -iE "kutuphane|library|fitting|standart|malzeme"` → lookup kodunu bul.
2. `ares-normalize.js` `malzemeKod`/`yuzeyKod` oku → normalize çıktı formatı.
3. `SELECT COUNT(*)` + örnek satır → `fitting_olculer` anahtar kolonu formatı.
4. Normalize çıktısı × kütüphane anahtarı GERÇEKTEN eşleşiyor mu — bir gerçek malzeme adıyla uçtan uca izle.
5. Hangi katman FK'yı yazmalı ama yazmıyor → "kopukluk şurada" diye KANITLA.
**K2 ile karıştırma:** §7.5 K2 = Excel↔PDF kıyası; bu = malzeme↔KÜTÜPHANE tanıma. Ayrı.
Faz 2 (Tersan doygunluk) öncesi kapanmalı — malzeme tanınmadan doygunluk malzeme tarafını ölçemez.

## 2. Q2 kararı (G2a öncesi gerekli)
Yayılma türü: **ÖNERİ** = türe ayır — Tür A (glyph/tanıma)=kural (format, anonim, $0, KARAR-48.1, =Band-B'nin
operatör-beslemeli hâli, G3b motoru); Tür B (değer)=o spool, yayılmaz. Cihat 139'da kararı erteledi (önce
neredeyiz görmek istedi). G2a'ya geçmeden en az bu netleşmeli. Q1 (yayılma anahtarı) Q2'ye bağlı.

## 3. Faz 1 sıralaması (Q kararları gelince; her biri ayrı oturum)
G2a (popup değer düzeltme, Q5 KARAR=ayrı taslak-düzeltme tablosu) → G3a (manuel yayılma, Q1/Q2) →
G4+G3b (L3 eşiği + dedup, kural deposu olgunlaşınca). Görsel çapa G2b en sonda (ağır).
**Q5 kod öncesi doğrula:** taslak yazmaları client-side supabase mı (inceleBaslat/wizardIptal kanıt) +
yeni tabloya client-write RLS uygun mu. Ters çıkarsa parse_sonuc overlay'e dön.

## Diğer borçlar (öncelik dışı)
- pipeline-içi doğrulama (4.4-1) — bağımsız, istenirse araya girer.
- Band-B glyph lookup (~10 karakter) — G3 Tür A ile birleşir.
- kalite/alıştırma modal whitelist'te yok (render okuyor, boş) — küçük, incelemeTablosu iki dal.
- Bayat-cache (Problem 1) — montajsız cache; acil değil.
- (Faz 2/3) yukleyen_id · fitting kütüphane · mobil React · et/çap çelişki turu (ölçüm-önce).

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-139.1: grupla cap/et türetir + incelemeTablosu iki dal taşır (taslak=terfi).
- MK-138.1/.2/.3: dosya_adi dedup · montaj deterministik + ayrı bölüm · taslak gizle + iptal soft-delete.
- MK-126.8: yeni modül/endpoint öncesi mevcut kod+DB oku (139'da B-çap'ta üç kez kurtardı).
- MK-101.1: arespipe_kopyala = ÜÇ argüman (kaynak hedef md5) + git status. MK-99.5: storage.objects SQL DELETE yasak.

## Hatırlatmalar
- Terminal yapıştırma: `#` yorum + `<placeholder>` + parantez = zsh hatası → çıplak komut, placeholder'sız.
- HTML/JS'de sed yok → atomik str_replace/Python (anchor + assertion; çok-satırlı anchor'da GERÇEK dosya formatı).
- PARSER.md'de UTF-8-olmayan bayt var (¶ benzeri) → Python ile bayt-düzeyi (rb/wb) düzenle, decode atla.
- Doc [skip ci]; kod CI tetikler. Kod ve doc ayrı commit (MK-134.1).
- Test verisi: Y100-St.St (NB1137/Watermist) · NB1099C 582-Sanitary (51 spool) · G200-303S.

---
> 140 ilk somut adım: §13.7 teşhis planını sırayla koş → malzeme↔kütüphane kopukluğunun KÖKÜNÜ kanıtla.
> Kod yok, okuma turu. Kök netleşince fix + Q2 + G2a sıralanır.
