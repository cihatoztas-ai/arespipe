# CLAUDE-SONRAKI-OTURUM — Oturum 107 gündemi

## Açılış ritüeli (CLAUDE.md = 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -6`
2. Bugünkü hedef onayı.
> 106 son kod commit'i: 3e0055e (NOT + 089). CI yeşil mi teyit et.
> Oku: docs/MK-WIZARD-DEVRE-YUKLEME.md (wizard omurga — bu oturumun temeli).

## 107 ANA HEDEF — Wizard MK-49.B: izometri PDF routing
103-A BOM Excel'i oto-parse ediyor; izometri PDF şu an `'sakla'` (arşiv), parse YOK. Bunu
BOM deseninin aynısıyla bağla:
- `devre_wizard.html` adim3_yukle: izometri tip_kodu → `'sakla'` yerine
  `dosya_isleme_kuyrugu (parser='izometri', durum='bekliyor')` + tetikle.
- Yeni worker `/api/kuyruk-isle-izometri.js` (kuyruk-isle-excel desenini birebir izle):
  is_id al → devre_dokumanlari'ndan PDF storage yolu → indir → **izometri-oku çağır**
  (fingerprint→L2→L3, MK-49.1 DOKUNMA sadece çağır) → parse_sonuc'a yaz → durum oneri_hazir/manuel_onay/hata.
- Tersan text-PDF → L2 (NOT + alistirma_ipucu dahil). PAOR image-PDF → L3 zorunlu (MK-105.6).

**Başlamadan iste:** `api/kuyruk-isle-excel.js` (desen), `api/izometri-oku.js` (sadece girdi/çıktı
arayüzü — değiştirmek için değil), `dokuman_tipleri` izometri satırı + `dosya_isleme_kuyrugu` şeması.

## 107 — Wizard yeniden tasarım (omurga belgesindeki kalan açık sorular, Madde 10)
Kod öncesi netleşmeli (Cihat'a sor, A/B):
5. Kaynak modeli K1/K2/K3 onayı / sadeleştirme.
6. `spool_no_sablonu` depolama: ayrı tablo mı, izometri_format_tanimlari kardeşi mi?
7. Kabuk → spool kaydı: onayda hemen mi spooller'a, mutabakat sonrası mı?
8. resim_no çıkarma deseni: Tersan (pipe gövdesi) + PAOR (çizim no) dosya adı regex'leri.
9. `spool_dokumanlari` N:N bağ tablosu şeması (spool_id ↔ devre_dokuman_id + resim_no).

> NOT: Sadece Tersan + PAOR sağlam kurulur. 3. tersane gelince 1 satır eklenir (genelleme yok).

## 107 — orta öncelik (zaman kalırsa / Cihat seçerse)
- **Excel DN sütunu** (izometri-batch incele export — flanş DN parse ediliyor, gösterilmiyor). Küçük.
- **Batch geçmişi sekmesi** (izometri-batch — izometri_batch_kayitlari listele, "İncele"ye dönüş).
- **NOT downstream:** izometri-oku çıktısına not_metni + alistirma_ipucu geçir (MK-49.1 minimal),
  wizard spool kaydında DB'ye taşı → QR/usta ekranı.

## 107 sonrası / açık borçlar
- Boru OD→DN türetme (boru_olculer, MK-49.1 sınırı) — "neden DN soruyor" kökten çözer.
- Tersan Montaj fingerprint ayrımı (MK-105.4 — şu an İmalat ile aynı kural).
- Standart + kategori zenginleştirme (kütüphane).

## Önemli hatırlatmalar
- **izometri-oku.js'e DOKUNMA** (MK-49.1) — çağır, değiştirme. Worker tarafı yeni kod.
- **PAOR image-PDF L2 imkânsız** (MK-105.6) — L3 zorunlu, tekrar L2 deneme.
- **Otorite kabuktur, PDF değil** (MK-WIZARD) — wizard sessiz eksik/fazla üretmemeli.
- **Eşleştirme = resim_no + spool_no** (içerikten bağımsız), ilişki N:N (MK-WIZARD.5).
- **Şüpheyi production yoluyla test et** (MK-106.1) — parser bug'ı sanmadan pdf-parse ile gerçek metin.
- **Regex Unicode/newline** (MK-106.2): SQL Editor için ASCII regex; `\s*` newline yutar, `[^\n,]` boşluk yutar.
- Disiplin: >45KB MD5'li transfer; arespipe_kopyala sonrası git status (MK-101.1).
  Şema-dokunur → MK-98.2 dry-run + MK-101.5. SQL Editor düz ASCII. Sadece terminal git. gp ile push.
