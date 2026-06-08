# CLAUDE-SONRAKI-OTURUM.md — 167 Açılışı

## AÇILIŞ RİTÜELİ
1. `git pull && git status && git log --oneline -8` — 166 commit'lerini (d5b8c9e → 595c435 ve arası)
   ve CI botunun `ci-son-rapor.json`'unu doğrula.
2. Fonksiyon sayımı: `ls api/*.js | wc -l` → **12/12** olmalı (MK-129.3 tavanı).
3. `cat BRIEFING.md` (tek aktif bağlam) + bu dosya + docs/WIZARD-YOL-HARITASI.md "166 İŞARETLERİ".
4. Ağır iş öne (context taze).

## 167 ANA İŞ — CRON / SAYFA-KAPALI İZOMETRİ İŞLEME (MK-166.1)
> Bu oturumun ASIL tasarımı. 166'da araştırıldı, karar verildi; 167'de uygulanacak.

**Sorun:** izometri parse İSTEMCİ drenajı (`ARES_IZO_DRENAJ` tarayıcıda). Sayfa kapanınca durur.
"Çok devre yükle → sonra topla işle" için sayfa-kapalı işleme gerek → Vercel'de bu = CRON.

**Mevcut parçalar (hazır):**
- `vercel.json` crons: `/api/kuyruk-isle` (03:00 günlük — Hobby tek-cron hakkı).
- `api/kuyruk-isle.js`: cron + **self-chain** (`fetch(/api/kuyruk-isle)`) + atomik claim + stuck-reset
  + `maxDuration:60`. AMA `is_kuyrugu`'yu süpürüyor (bucket izometri-pdfs), wizard kuyruğunu DEĞİL.
- `api/kuyruk-isle-izometri.js`: izometri tek-iş işleyici (tarayıcı drenajının çağırdığı).
- `CRON_SECRET`: Vercel otomatik sağlar (Authorization: Bearer ile gelir, route doğrulamalı).

**Yapılacak (plan):**
1. `kuyruk-isle.js`'e İKİNCİ DAL: `dosya_isleme_kuyrugu`'ndan `parser='izometri' durum='bekliyor'`
   işleri çek, `devre-belgeleri` bucket'ından oku, `kuyruk-isle-izometri` mantığıyla işle.
   **YENİ ENDPOINT YOK** (lib/** paylaşımlı, includeFiles açık → 12/12 KORU).
2. **Atomik claim guard:** `UPDATE ... durum='isleniyor' WHERE id=? AND durum='bekliyor'` döndürdüğü
   satırla sahiplen — cron ↔ (hâlâ açık olabilen) tarayıcı drenajı çift-işlemesin. Tarayıcı drenajı
   da aynı guard'ı kullansın.
3. **Frekans kararı:** Hobby cron günde 1 (gece self-chain ile backlog'u boşaltır). "Yüklerken
   dakikalar içinde" istiyorsak → Pro (dakikada 1) VEYA dış zamanlayıcı (cron-job.org / GitHub Actions
   endpoint'i CRON_SECRET ile dürter). **Pro ŞART DEĞİL.**
4. Retry yok (cron) ama self-chain + `deneme_sayisi` telafi ediyor; idempotent kalmalı.
- Karar tarzı: terse binary / A-B-C. Migration olursa BEGIN…ROLLBACK dry-run (MK-98.2).

## AÇIK BORÇLAR (öncelik sırası)
- **MK-165.7/1** OPR dn→dis_cap kabuk düzeltmesi (DN200→200.0, doğrusu 219.1; olcuParse+dnBul).
- **MK-165.7/3** uyarı mükerrerliği (aynı uyarı 2-3 dk arayla çift).
- **Onay kuşağı eritme** (162 kayıt; P26-217 tek başına 76).
- **W-2.5** ilerleme iki ayrı çubuk (yükleme + arka işleme) · **W-2.9** eşzamanlı paralel devre.
- **Y200 öğretimi** (diğer bilgisayar) — schedule et kanıtı (W-1.6 kalanı).
- **W-2.19 hassas bbox** — Y200 tablo öğretiminde gelir (kalem-zoom değer-arama şimdi çalışıyor).
- **Küçükler:** kalem-zoom yanlış-yere-gitme aday-listesi inceltme · karar ekranı küçük-devre canlı doğrulama.

## CANLI TEYİT BORCU (166'nın — açılışta 5 dk)
Deploy + sert yenile (ares-kabuk + ares-normalize tarayıcıda) sonrası:
1. **Görünüm:** G200 inceleme ekranı → fitting spool'larda Çap/Et dolu, Kalite **316L**, Yüzey **Asit**.
2. **Terfi yazımı:** bir taslağı onayla →
   `SELECT spool_no, dis_cap_mm, et_kalinligi_mm, kalite, yuzey, alistirma FROM spooller WHERE devre_id='...';`
   → kalite=316L, yuzey=asit, dis_cap_mm/et_kalinligi_mm dolu.

## KAPANIŞ BORCU (167 sonunda HATIRLA)
- **KARARLAR.md'ye MK-166.1..6 + MK-85.3 öz-ihlal işle** (kök dosya — 166 paketinde DEĞİLDİ).

## TEST DEVRELERİ — SİLME
"bn ömn" (77bfbc98) · "b nn" (e0af361d, taslak).

## İLKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · şema-önce (MK-85.3) · arespipe_kopyala
MD5 (MK-51.1) + git status (MK-101.1) · tarayıcı JS deploy sonrası sert yenile (MK-161.1) · commit'ler
ayrı blok · node --check + birim test ship öncesi · docs/ klasörüne kapanış [skip ci].
