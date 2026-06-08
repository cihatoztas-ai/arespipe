# CLAUDE-SONRAKI-OTURUM.md — 168 Açılışı

## AÇILIŞ RİTÜELİ
1. `git pull --rebase && git status && git log --oneline -8` — `0e7108d` (feat 167) ve workflow
   commit'ini (`Create izometri-cron.yml`, WEB'den) + CI botu `ci-son-rapor.json`'u doğrula.
   **ÖNEMLİ:** workflow uzağa WEB'den eklendi → lokal diskte de var → `git pull --rebase` ile senkronla
   (yoksa ayrışma/çakışma). Bir kerelik.
2. Fonksiyon sayımı: `ls api/*.js | wc -l` → **12** (MK-129.3 tavanı; workflow Vercel fonksiyonu değil).
3. `cat BRIEFING.md` (tek aktif bağlam) + bu dosya + docs/WIZARD-YOL-HARITASI.md "167 İŞARETLERİ".
4. Ağır iş öne (context taze).

## 168 — İLK İŞ: 167 UÇTAN UCA DOĞAL-YOL TESTİ TEYİDİ
> 167'de mekanizma kanıtlandı (secret'sız 401 / secret'li 200 + izometri.calisti:true). Eksik olan:
> kuyrukta GERÇEK `bekliyor` izometri işiyle uçtan uca akış. Kullanıcı 167 sonunda doğal yoldan
> (PDF yükle → sayfa kapat → */3 turu) test ediyordu — sonucu açılışta al/teyit et.

**Doğrulama SQL (kullanıcı teste başladıysa):**
```sql
-- İzometri kuyruğu son durum (bekliyor düştü mü, oneri_hazir/manuel_onay arttı mı?)
SELECT parser, durum, COUNT(*), MAX(bitis_at) AS son_bitis
FROM dosya_isleme_kuyrugu WHERE parser='izometri'
GROUP BY parser, durum ORDER BY durum;
-- Cron'un işlediği işte _eslesme yazıldı mı?
SELECT id, durum, bitis_at, (parse_sonuc->'_eslesme'->>'eslesen') AS eslesen
FROM dosya_isleme_kuyrugu
WHERE parser='izometri' AND durum IN ('oneri_hazir','manuel_onay')
ORDER BY bitis_at DESC NULLS LAST LIMIT 5;
```
Beklenen: yüklenen PDF `bekliyor`→`oneri_hazir`/`manuel_onay`, `bitis_at` dolu, `_eslesme` mevcut.
GitHub → Actions → `izometri-kuyruk-drenaj` çalışmaları yeşil (200) olmalı; kırmızıysa secret/log bak.

## 168 — KAPANIŞ BORCU (ÖNCE BUNU BİTİR — 2 oturumdur açık)
- **KARARLAR.md'ye İŞLE (kök dosya, paketlerde DEĞİL):**
  - MK-166.1..6 (166 borcu) + MK-85.3 öz-ihlal (spooller kolon: dis_cap_mm/et_kalinligi_mm).
  - **MK-167.1** atomik claim guard · **MK-167.2** global tetik CRON_SECRET zorunlu (batch_id'li açık) ·
    **MK-167.3** cron izometri drenajı = mevcut worker'a dal (drenajTuru tekrar, yeni endpoint yok).

## AÇIK BORÇLAR (öncelik sırası)
- **MK-165.7/1** OPR dn→dis_cap kabuk düzeltmesi (DN200→200.0, doğrusu 219.1; olcuParse+dnBul).
- **MK-165.7/3** uyarı mükerrerliği (aynı uyarı 2-3 dk arayla çift).
- **Onay kuşağı eritme** — GÜNCEL: oneri_hazir=400 + manuel_onay=70 (eski "162 kayıt" notu güncellendi).
  Not: cron drenajı artık BÜYÜME kaynağını besler değil, eritme ayrı UI/SQL işi.
- **W-2.5** iki ayrı çubuk (yükleme + arka işleme) · **W-2.9** eşzamanlı paralel devre.
- **Y200 öğretimi** (diğer bilgisayar) — reçete FORMAT-OGRETIM-ATOLYE-162.md'de aynen; schedule et kanıtı.
- **W-2.19 hassas bbox** — Y200 tablo öğretiminde gelir.

## CRON — 167'de KURULDU, İZLE
- Dış tetik: GitHub Actions `*/3` → POST /api/kuyruk-isle {} + Bearer CRON_SECRET. Pratikte 5-10 dk.
- Yedek: vercel.json gece cron (03:00). Frekans değiştirmek istersen: workflow cron satırı (dış) veya
  Pro'ya geçiş (Vercel cron dakikalık). Pro ŞART DEĞİL.
- Self-chain (kalan_var iken) best-effort (MK-112.1: response sonrası fire-and-forget güvenilmez) —
  asıl sürücü */3. Backlog büyükse */3 4'er-4'er erir (her iş ~11-25s, maxMs 50s tavan).

## İLKE HATIRLATMALARI
izometri-oku DOKUNULMAZ (MK-49.1) · 12/12 tavan (MK-129.3) · şema-önce (MK-85.3 — 167'de bir kez ihlal
edip düzelttim, dikkat) · arespipe_kopyala MD5 (MK-51.1, sıra: kaynak ÖNCE/hedef SONRA) + git status
(MK-101.1) · migration olursa BEGIN…ROLLBACK dry-run (MK-98.2) · commit'ler ayrı blok (kod vs doc) ·
node --check + birim test ship öncesi · docs/ klasörüne kapanış [skip ci] · zsh `()`/`*`/`!` tuzağı ·
`.github/workflows/` push PAT'ta `workflow` scope ister.

## TEST DEVRELERİ — SİLME
"bn ömn" (77bfbc98) · "b nn" (e0af361d, taslak).
