# CLAUDE-SONRAKI-OTURUM.md — Oturum 155 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md +
   docs/WIZARD-YOL-HARITASI.md oku · 5. Ajanda onayı
6. 155 = 5'in katı → ritüel oturum kontrolü (sayfa envanteri / borç defteri taraması).

## ANA İŞ 1: W-2.11/A uygulaması — devre_detay ?taslak=1 kipi
1. **Read-before-write (zorunlu ilk adım):** devre_detay.html'in YAZMA noktaları envanteri —
   `grep -n "\.update(\|\.insert(\|\.delete(" devre_detay.html`. Kip bu noktaları kilitleyecek;
   listeyi görmeden tasarım yok. Render koduna DOKUNULMAZ (A kararının özü).
2. **Taslak görsel dili (W-2.12 birlikte):** filigran/rozet ("ÖNİZLEME — taslak") + preview-band
   deseni wizard'dan ödünç. Yazma butonları disabled + tooltip ("taslakta kilitli").
3. **Köprüler:** İşlenenler "İncele" → ileride bu kipe mi, Adım 2'ye mi? (Karar: ikisi de kalabilir —
   Adım 2 = düzeltme/onay, ?taslak=1 = "gerçek görünümde kontrol". Cihat'la netleştir.)
4. **Canlı kanıt:** bir taslak devre ?taslak=1 ile açılır, yazma denemesi kilitli, görsel dil net.

## ANA İŞ 2: MK-153.3 av turu (yukleyen_id NULL INSERT)
- `grep -rn "devre_dokumanlari" --include="*.html" --include="*.js" | grep -i "insert"` →
  yukleyen_id geçmeyen INSERT'ler şüpheli. Muhtemel tek satır fix. Yeni vaka görülmedi — acil değil,
  ama 117 ailesinin tekrarını kökten keser.

## KÜÇÜKLER (sıra gelirse)
- devreler.html ~1294: stat sayacı `select('id',{count:'exact'})` filtresiz ŞÜPHESİ — taslak+silinmiş
  kayıtlar stat pill'i şişiriyor olabilir. Önce kodu oku (şüphe, kanıt değil).
- Onay havuzu tasarım tartışması: oneri_hazir=690 + manuel_onay=263 — operatör bunları NEREDE,
  NASIL onaylar? (kod yok, konuşma — oturum sonu ideal)
- Ertelenmiş format paketi (yapısal işler bitince): W-3.9 format_tanit panzehiri → Y200 satır
  öğretimi → W-1.6 tam kanıt (cache düşürme MK-152.4 + kabul_kriterleri DOKUNULMAZ).
- W-2.9 paralel yükleme + W-2.1/2.5 UI maddeleri (İşlenenler altyapısı hazır, artık ucuz).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3 şema önce
(154'te created_at yine yakalandı!) · MK-153.2 SQL onarımı TEK çalıştırma · MK-154.1 durum türetilir,
kolon ekleme · MK-154.2 iptal çekirdeği _taslakIptalEt, kopyalama · 153 bulgularını yeniden doğrula
(aktif-hayalet örneği) · push reddedilirse `git pull --rebase` (CI raporu) · zsh yorumsuz ·
arespipe_kopyala 3 argüman (MD5).

> 155 açılışı: ritüel → devre_detay yazma envanteri → ?taslak=1 kipi tasarım+uygulama → canlı kanıt
> → MK-153.3 av → küçükler.
