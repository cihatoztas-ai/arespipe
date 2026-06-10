# CLAUDE-SON-OTURUM.md — Oturum 175 özeti

## Yapılanlar
1. **Faz 1b kapsam = B (böl)** — alan başına tek yazıcı. Karar A/B/C olarak sunuldu; A (tek kanal) reddedildi: backfill HEM wizard HEM devre_detay'ı besler (MK-49.B), birlesikler yalnız wizard → A çift-yazım borcu olur. B kanıtlandı (MK-175.1).
2. **Kaynak rozeti türetildi (MK-175.2, PUSH eb12c0c)** — wizard cap/et/yüzey dinamik L2/Excel; inceleme endpoint `_kaynak='izometri'` izi. Türetilmiş (şema yok), kalite (174) deseninin eşi.
3. **NPS→mm sızıntısı kapatıldı (MK-175.3)** — 58 spool. Kök eski veri (kod sağlam, kanıtlı). Dry-run'lı UPDATE.

## Yöntem / disiplin (bu oturumda işe yarayanlar)
- **MK-158.1 (DATA→UI→code) bu oturumu kurtardı:** Faz 2 koduna girmeden çelişki örneklerine bakınca 46/76'nın sahte (NPS sızıntısı) olduğu çıktı. Kör otomasyon `dis_cap_mm=4`'ü otoriter yapardı = felaket. Veriyle yön doğrulanmadan kod yazılmadı.
- **Kök ayırma zinciri:** çelişki örneği → NPS şüphesi → olcuParse lokal repro → ARES_BORU.disCap doğru → olcuParse 14 format doğru → tarih analizi (son 6 gün temiz) → "kod değil veri" sonucu. Her adım veriyle.
- **MK-98.2:** tüm DB düzeltmeleri BEGIN...ROLLBACK dry-run, kontrol SELECT'leri, sonra COMMIT. Hiç kör UPDATE yok.
- **Fiziksel kural ayracı:** `dis_cap_mm < 30` tek başına sızıntı DEĞİL (21.3 gerçek ½"). Gerçek imza `cap <= et` (fiziksel imkansız). Bu ayrım 21.30'ları korudu.
- HTML/JS yamaları: Python str_replace + abort-on-mismatch (anchor 1/1) + .bak + node --check (wizard inline JS extract, raw HTML değil).

## Cihat'ın iki kritik müdahalesi
1. "1 1/4" 114.3 okuyor" gözlemi → ayrı bir boşluklu-kesir bug'ı ortaya çıkardı (kaydedildi, düşük öncelik).
2. "çap ve et birlikte oluyor ya, doğru mu bu karar" → benim "eti backfill'e bırak" önerimi sorguladı; HAKLIYDI — aynı deterministik kaynağı bölmek "iki ıraksak yol" hatasının tekrarıydı. cap+et birlikte yazıldı.

## Karar günlüğü
KARARLAR.md'ye MK-175.1/2/3 + açık notlar (1 1/4 bug, MK-169/170/171 boşluğu hâlâ açık).
