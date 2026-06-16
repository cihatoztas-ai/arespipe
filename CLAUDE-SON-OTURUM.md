# CLAUDE — Son Oturum Özeti (187)

## Spool sayım emniyeti kuruldu: B + A1 + A2 (override), hepsi canlı + commitli

### MK-187.1 (B) — sessiz-fallback emniyet ağı
Crop (SPOOL kutusu zoom kırpımı, 186.3) yalnız vision'da kullanılır; render patlarsa SESSİZCE crop'suz tam-sayfaya düşer → model eksik sayabilir, alarm yoktu. Çözüm: izometri-oku vision yolunda `_sayim_kirpimsiz = !spool_kirpim_b64` üretip cevap_full'a yedirir (cache'te yaşar) + yanıt özetine taşır. kuyruk-isle-izometri durum kararında `okuJson._sayim_kirpimsiz && dosyaAdiParse(dok.dosya_adi)?.spool_kaynak === 'pozisyon'` → `manuel_onay`. KİLİT: spool_kaynak='pozisyon' = PAOR (Excel'de spool listesi YOK, sayı PDF'ten). Excel-listeli (kaynak≠pozisyon) → liste otoriter, gözle-say gereksiz → yoksayılır. Tersan'a sıfır temas.

### MK-187.2 (A1) — görsel çetele (gözle teyit)
B otomatik #2'yi kapatır; A1 ise crop GİTSE bile model yanlış saydığında (#1/#3) operatörün gözle yakalamasını sağlar. Dökümanlar sekmesinde çizim-başı: kırpılan SPOOL kutusu + "PDF'ten N spool" + S0n. Kilit karar: crop'u parse anında DEPOLAMA — istemcide `_spoolKirpim` ile YENİDEN üret (deterministik → modelin gördüğünün aynısı). $0 depolama, migration yok, parse/drain yoluna (186 cache + Tersan) dokunmadan, GERİYE-DÖNÜK (tüm PAOR devreleri re-parse'siz). `_spoolKirpim` drain'de expose (MK-109.1, kopyalama yok). Thumbnail cache (override re-render hızlı).

### MK-187.3 + MK-187.4 (A2) — operator override + idempotent fix
Cihat'ın senaryosu: "PDF 3 var ama 1 saydı → S02/S03 ekle, PDF okumuş gibi devam et." Mekanizma ZATEN vardı (`_paorBolShell`, 184/A) — PDF fazla'sını shell olarak enjekte ediyor. A2 = operatörün sentetik fazla'yı elle söylemesi. dilim-1 (c93d66e) çalıştı ama BUG: katlanma (7 yazınca kabuk şişti). Sebep ÜÇLÜ: "N'e kadar EKLE" mantığı + inceleGetir'in kendi _paorBolShell re-call'u + panel guard/PDF-bağlı sayı. Fix (0e50dd3): idempotent "N'e AYARLA" (yukarı/aşağı), `inceleGetir(bolAtla)` re-expansion atlar, panel kabuk-gerçeğini gösterir.

## En önemli dersler
- **DATA-first her şeyi değiştirdi:** "PAOR Excel'de spool var mı" sorusunu tek tek SQL'le kovaladık. Sırasıyla: pipeline_malzemeleri'nde yok → parse_sonuc satırlarında spool_no VAR sandık → ama `farkli_spool=1` (hepsi S01) → spool YOK kesinleşti. Varsayımla gitseydik A2 yanlış kurulurdu.
- **Mekanizma çoğu zaman zaten vardır:** A2 için 1→N genişletmeyi sıfırdan kurmaya hazırlanmıştık; `_paorBolShell` (184/A) zaten yapıyordu. Önce kodu okumak (MK-126.8) yarım günü kurtardı.
- **Override idempotent OLMALI:** "N'e kadar ekle" mantığı, geri-bildirim eksikliğiyle birleşince felakete döndü (operatör tekrar bastıkça katladı). "N'e AYARLA" (set) + net geri-bildirim doğru tasarım.
- **Geri-bildirim mantık kadar önemli:** A2 mantıksal olarak çalışıyordu ama panel eski sayıyı gösterince Cihat "değişti mi anlamadım" dedi — ve testi bug'ı ortaya çıkardı. Sessiz başarı = başarısızlık gibi görünür.
- **Crop'u depolamak yerine yeniden-üretmek:** deterministik fonksiyon (aynı PDF→aynı kırpım) sayesinde A1 sıfır depolama + geriye-dönük çalıştı. Modelin gördüğünün AYNISI.

## Yarım kalan (dürüst)
A2 "eklenen spool Eksik damgası alıyor + sıralama karışık" sorunu ÇÖZÜLMEDİ — server eşleştirmeye (devre-inceleme `pipeline|spoolNo`) dokunuyor, gece yarısı dokunmamak için A2-dilim2'ye bırakıldı. Tanı net (→ Sonraki Oturum). Override kalıcılığı bellekte (terfide kesinleşir) = TASARIM.

## Disiplin
Tüm patch'ler anchor-doğrulamalı Python + .bak + MD5 birebir + idempotent ABORT testi. B/A1/A2 izole JS node --check temiz. PAOR-scoped (spool_kaynak='pozisyon'). Tersan dokunulmadı. Migration/api yok → 12/12. Kod commit'leri [skip ci]'siz; handoff [skip ci].
