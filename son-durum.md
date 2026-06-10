# son-durum.md — Oturum 175 kapanışı (HEAD eb12c0c)

## Özet
Excel↔PDF katman birleştirmenin **kalite-sonrası kalanı** ele alındı + beklenmedik bir veri-bütünlüğü hatası kovalandı/kapatıldı. Faz 2 (gerçek çelişki kazananı) zemini temizlenip sonraki oturuma bırakıldı.

## Yapılanlar (sırayla)
1. **Faz 1b kapsam kararı = B (böl):** alan başına tek yazıcı. kalite→birlesikler, cap/et/yüzey/not→backfill/eslestir/bindir. A (tek kanal) reddedildi çünkü backfill devre_detay yolunu da besliyor (MK-49.B); birlesikler'e taşımak çift-yazım borcu yaratırdı. Canlı SQL ile uçtan uca kanıtlandı (MK-175.1).
2. **Wizard kaynak rozeti (MK-175.2, PUSH eb12c0c):** önizlemede cap/et/yüzey artık dinamik L2/Excel rozeti gösteriyor (sabit 'xl' boşluğu kapandı). Türetilmiş — şema dokunulmadı. 2 dosya: api/devre-inceleme.js + devre_wizard_v3.html.
3. **NPS→mm sızıntısı (MK-175.3):** Faz 2'ye geçerken çelişki örneklerine bakınca 46/76 çap çelişkisinin SAHTE olduğu görüldü (Excel'de NPS, mm değil). Kök = eski "fakir boyutParse" verisi (kod sağlam, olcuParse 14 format birebir doğru). 58 spool düzeltildi (46 cap + 12 cap/et), 21.30 gerçek mm'lere dokunulmadı. BEGIN...COMMIT dry-run'lı, hepsi onaylandı.

## Canlı durum
- HEAD = eb12c0c, origin/main senkron, working tree temiz. Fonksiyon: 12/12.
- DB: spooller `dis_cap_mm` sızıntısı 0 (kalan 23 satır gerçek 21.30). 58 spool onarıldı.
- Wizard önizleme: kalite + cap + et + yüzey hepsi kaynak rozetli (L2/Excel).

## Faz 2 için bırakılan zemin (sonraki oturum)
- Çap çelişkisi gürültüsü temizlendi: 76→~30 gerçek çelişki. et 57, yüzey 5.
- **Kritik bulgu:** referans/manuel provenance sinyali (`excel-parser` `seviye`/`guven`) `spooller`'da KALICI KOLON OLARAK YOK. SQL doğruladı. Sinyal dosya-bazında (L1 & guven≥70 = referans). bindir'e bu sinyali taşıma tasarımı gerekli (devreler kolonu mu, akış-içi bayrak mı). Yeni soru/bayrak gerekmez ama taşıma kanalı tasarlanmalı.

## Dosya md5 (bu oturum, push edilmiş)
- api/devre-inceleme.js = ceeab43e8d741ce5040a6baff02f141b
- devre_wizard_v3.html = ca4c7722c163ba70000bab5c6994a470
