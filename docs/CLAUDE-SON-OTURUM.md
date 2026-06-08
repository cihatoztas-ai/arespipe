# CLAUDE-SON-OTURUM.md — 166 (2026-06-08)

## NE YAPTIK
**DÜZEN TURU.** Wizard ve devre_detay'ın aynı işin farklı kapıları olduğu tutarsızlıkları giderdik,
yükleme akışını seri-yükleme dostu hâle getirdik, ve "okundu ama yüzeye çıkmadı" sınıfı üç kusuru
kapattık. Format öğretimi bilinçli atlandı (Cihat: önce düzen, sonra bol veri).

## KARARLAR (Cihat onaylı)
- Yükle akışı: kullanıcı dosyalar alınana kadar bekler → sonra KARAR EKRANI (Yeni Devre / İncele &
  Onayla / İşlenenler). Belirsizlik bitsin diye her ekranda çıkış görünür, hiçbir seçim tek yönlü değil.
  Yeni Devre = sıfırdan (proje taşınmaz). Küçük devrede uyarı yok (butonlar zaten altta).
- Kalem-zoom: ✏️ → değeri PDF/Excel'de bul → oraya götür (format öğretimi gerektirmeyen "tam dilim").
- Okunan-değer: A çap/et izometriden · B kalite kalemden (316L terfide yazılsın — evet) · C yüzey
  "paslanmaz" yazıyorsa → asit (SADECE yüzeyde yazıyorsa; boş+malzeme paslanmaz dahil DEĞİL).

## TEKNİK ÖZ
- **Paralel havuz** (`_havuzKos`, 6 eşzamanlı) — 356 dosya sıralı yarım saat → dakikalar. 4/4 test.
- **izometri parse İSTEMCİ drenajı** keşfedildi (sunucu cron'u yok) → "Yükle" izometriyi SIRAYA koyar,
  İŞLEMEZ; işleme İncele&Onayla'da (o devre) ya da İşlenenler'de (toplu, sayfa açık). MK-166.1.
- **A:** devre-inceleme — kabuk cap/et boşsa izometri dal cap_mm/et_mm yüzeye (fitting-only spool;
  MK-166.3). **B:** ares-kabuk grupla `anaKalite` + spool `kalite` + aktar zinciri (dz>kalem>anaMalzeme);
  izo-eslesme iki return'e passthrough. **C:** ares-normalize yuzeyKod stainless→asit + wizard
  yuzeyBadge kanonik etiket. 7/7 test.
- 12/12 (yeni endpoint yok) · migration yok · izometri-oku dokunulmadı.

## ÖZ-İHLAL
- **MK-85.3:** spooller kolon adını tahmin ettim (cap_mm) — doğrusu `dis_cap_mm` / `et_kalinligi_mm`.
  aktar insert'inden teyit ettim, düzelttim. Şema-önce istisnasız.

## CRON (167'ye devredilen ana tasarım)
Vercel sunucusuz — Pro'da bile always-on worker yok; sayfa-kapalı işleme CRON gerektirir. Mevcut
`vercel.json` cron'u (`/api/kuyruk-isle`, 03:00) `is_kuyrugu`'yu süpürüyor; wizard kuyruğu
(`dosya_isleme_kuyrugu`) tarayıcıyla boşalıyor. Çözüm: o worker'a izometri dalı + claim guard + frekans
(Hobby gece-1 / Pro dakika / dış zamanlayıcı). Pro şart değil (self-chain Hobby'de yürür). Detay
WIZARD-YOL-HARITASI 166 İŞARETLERİ + BRIEFING'de.

## COMMIT'LER
Bookend: `d5b8c9e` → `595c435`. Aradakiler topic bazlı (+N rozet · kalem-zoom v1/v2 · taslak rol+köprü ·
excel hücre-git · yükle/paralel/karar ekranı) — `git log --oneline` ile sırala.
