# son-durum.md — Oturum 165 (2026-06-07)

## Bu oturumda ne yapıldı (tema: 42.2/3.56 ATÖLYESİ + parse zinciri onarımı + teyit üçlüsü)
1. **42.2/3.56 vakası KAPANDI (164 borcu):** parse_sonuc tam dökümü hükmü verdi — dn=32
   (alan-regex KAYNAK satırına çapalı), cap 42.2 + et 3.56 asmeFallbackDoldur'dan
   (`dolduruldu: "ares_boru (SCH 40)"`). 164'ün "satirlar=0" okuması yanılgıydı (3 satır
   temizdi). Üç kök, iki commit:
   - `5edbba1` — emperyal boru NPS sentezi (boyut alanı yoksa nps_inc+schedule_kod'dan YEREL
     boyutStr; m.boyut'a yazılmaz — MK-165.1) + **dn HEP dominant borudan** (kenar §5
     kodlandı — MK-165.2).
   - `1596481` — ikinci drenaj turu et=1.65 "boru_olculer (SCH SCH5)" verdi → **fallback
     ÇİFT KÖRLÜĞÜ kanıtlandı** (helper malzeme-kör: malzeme_en_kodu null→karbon→10S yok;
     DB yolu schedule-kör: sorguda schedule_kod filtresi YOK, limit=1→SCH5). 151 varsayımı
     revize (MK-165.3): satır kalitesi+basılı schedule ile hesaplanan asme et spool'a
     yazılır, etiket fallback'in birebir eşi. 153'ün 3.68/3.91 kökü kurudu.
   - **Drenaj kanıtı:** S01+S02 → dn=50 · 60.3 · **2.77 · ares_boru (SCH 10S)**, cache_hit
     yok; yeni bindirme uyarılarında (A-001211/12) et/çap kalemi YOK (yalnız ağırlık
     yuvarlaması 12.082↔13 — beklenen).
2. **tersan.zip atölyesi (MK-162.1 modelinin ilk TAM uygulaması):** 6 gemi / 15 PDF —
   sunucu hattıyla koşum: **15/15 L2 · fail 0 · ham 0** (fix'ler sonrası). Bağımsız fix
   kanıtı: G400-817-015 + E100-817-005 → 2.77 SCH 10S; **E100 (162'nin hiç işlenmemiş
   E-vakası) İLK KEZ söküldü.** Montaj 7/7 temiz.
3. **bilezik_detay satır tipi (`af90f85`):** 'Bilezik Detay A' varyantı — 7 HAM (İç) +
   3 SESSİZ (Dış; tetik 'Ic Bilezik' uymuyordu, MK-123.C sınıfı). spesifiklik 6, tetik
   'Bilezik Detay'; 10/10 gerçek satır + tetik ayrımı. Araç kalıcılaştı:
   **`scripts/atolye-kosum.mjs <pdf_klasoru>`** (MK-165.5).
4. **dnBul (`f86ff81`):** ARES_BORU.dnBul(od, malzeme, ±0.15) — OD→DN ters eşleme,
   TEK-eşleşme şartı, cunife dahil; spoolOlcuTuret dominant dn yoksa türetir. AT110-804
   (DN hiç basmayan çizim) → dn=50; 76.1 null kalır (uydurma yok). 13/13 test.
5. **Açılış teyit üçlüsü MÜHÜRLENDİ:**
   - izometri-kaynak ✓: alistirma=YOK + yuzey=asit → `deger_kaynagi='izometri'` +
     **format_id=e1fb879d DOLU** (MK-164.3'ün üç dalı tamam).
   - **OPR TERFİ ✓ — f borcu KAPANDI:** satır spool_malzemeleri'ne indi (boy/ağırlık/
     malzeme/miktar=boy/1000 doğru; adet=null boru için TASARIM). Nüans: kalite='paslanmaz'
     regresyon DEĞİL — operatör kalite girmedi, fallback çalıştı; dz.kalite tercihi canlıda
     nötr (164 6/6 testiyle kanıtlı sayıldı).
   - G2a kart ✓: eşik (3+) doğru — 1'er izometri sinyali dal doğurmadı (NORMAL), NULL kova
     7 kart doğru metinle.
6. **Cache/drenaj mekaniği dersleri (MK-165.4):** cevap_full kuyruk alanlarını taşımıyor →
   sha temizliği `_cache_meta.original_log_id` üzerinden; Supabase UPDATE "No rows returned"
   maskeler → etki SELECT teyidiyle; drenaj FİLTRELİ → reset edilen satır devresi açılmadan
   işlenmez (M130 devresi MK-136 URL'iyle açılarak akıtıldı).

## Bulgular (165)
- **MK-165.7 borçları:** OPR kalem "dn" alanı kabukta fakir boyutParse ile **dis_cap_mm'e OD
  sanılarak** yazılıyor (DN200 → 200.0; doğrusu 219.1) — çözüm adayı ARES_OLCU.olcuParse +
  dnBul · devre_detay taslak görünümünden wizard'a "düzenle" köprüsü YOK (MK-136 ?devre_id=
  URL'i var ama görünmez; kullanıcı kilitli sayfada kayboluyor) · uyarı MÜKERRERLİĞİ (aynı
  uyarı 2-3 dk arayla çift, örn. A-000954).
- M130-817-006 eski et uyarısı (2.77↔3.91) duruyor — drenaj kapsamı dışıydı; doğal parse'ta
  düzelir ya da sha+reset reçetesi (düşük öncelik).
- Test devresi kimliği: "bn ömn" (devre_id 77bfbc98, is_emri_no=null) — M130 dosyaları +
  OPR kalemi burada.

## Commit'ler (165 — 4 kod)
| Hash | İçerik |
|---|---|
| 5edbba1 | fix(165): emperyal boru nps sentezi + dn dominant borudan - 42.2/3.56 vakasi |
| 1596481 | fix(165): asme et spool'a satir kalitesi+schedule ile yazilir - kor fallback bypass |
| af90f85 | feat(165): bilezik_detay satir tipi + atolye kosum araci - tersan.zip 15 PDF kaniti |
| f86ff81 | feat(165): ARES_BORU.dnBul OD-DN ters esleme + spool dn turetimi - AT110-804 vakasi |
Değişen: lib/l2-parser.js (3 dalga) · lib/format-paketleri.js · ares-asme.js ·
scripts/atolye-kosum.mjs (YENİ). DB: migration YOK; ai_api_log iki pdf_sha256 NULL (cache
temizliği — veri silinmedi). 12/12 ✓ · izometri-oku DOKUNULMADI (okundu, değişmedi).

## MK kayıtları (165 — KARARLAR.md'ye işlendi, bu pakette)
MK-165.1 (emperyal boyut sentezi) · MK-165.2 (dn HEP dominant + dnBul) · MK-165.3 (fallback
çift kör; 151 revizyonu) · MK-165.4 (log hedefleme + UPDATE teyidi + drenaj filtresi) ·
MK-165.5 (atölye koşum standardı) · MK-165.6 (commit'ler ayrı bloklar) · MK-165.7 (borçlar).

## 166 ADAYLARI
Y200 tablo öğretimi (Cihat, diğer bilgisayar — reçete aynen + 🔍 canlanır) · onay kuşağı
eritme (162 kayıt; P26-217=76) · OPR dn→dis_cap kabuk düzeltmesi (MK-165.7/1) ·
devre_detay→wizard "düzenle" köprüsü (MK-165.7/2) · uyarı mükerrerliği teşhisi (MK-165.7/3) ·
yeni zip paketleri (~10 hedefi, atolye-kosum ile) · W-2.19 tam dilim TASARIMI ·
KÜÇÜKLER (EN/AR anahtarları · 6 B1124 orijinal ad · ✖ sessiz-kayıp · W-2.20 canlı göz ·
IZO-KANIT v4/AD kararı — yapıştırma ihtiyacı düştü · hhbjşlö excel · K-2 W-3.3).
