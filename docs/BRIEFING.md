# AresPipe BRIEFING — 167. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (167 İŞARETLERİ eklendi).

## HEAD
- **Tema:** CRON / SAYFA-KAPALI İZOMETRİ İŞLEME — 166'nın "ANA TASARIM" maddesi (MK-166.1) uçtan uca
  kuruldu. Format öğretimi yine ATLANDI (Cihat kararı). Tema yalnız buydu.
- **Commit:** `0e7108d` (kod — feat 167: cron izometri drenaj dalı + atomik claim guard + CRON_SECRET
  gate). Workflow `.github/workflows/izometri-cron.yml` GitHub WEB'den eklendi (PAT'ta `workflow` scope
  yok → push reddi → `git reset --soft HEAD~1` ile kod ayrıldı). Üzerine CI botu `ci-son-rapor.json`.
- **DB:** migration YOK. Endpoint YOK (12/12 — MK-129.3; import lib-içi, sayıma girmez). izometri-oku
  DOKUNULMADI.
- **Değişen dosyalar:** api/kuyruk-isle.js · api/kuyruk-isle-izometri.js · .github/workflows/izometri-cron.yml (YENİ).
  **Bu dosyalar SUNUCU tarafı — tarayıcı sert-yenile gerekmez.**
- **⚠ 168 AÇILIŞ:** lokal diskte `izometri-cron.yml` var ama uzağa WEB'den eklendi → `git pull --rebase`
  ile senkronla (yoksa lokal-uzak ayrışır).

## 167 — yapılanlar (kararlar Cihat'ın)
1. **MK-167.3 — CRON izometri drenaj dalı:** `kuyruk-isle.js`, `is_kuyrugu` (PDF) yolundan SONRA KALAN
   zaman bütçesiyle `dosya_isleme_kuyrugu`/izometri'yi sürer. Yeni mantık YOK — `kuyruk-isle-izometri.js`
   zaten export eden `drenajTuru` (MK-112.1 iç-döngü) çağrılır. Bütçe: 60s − geçen − 8s pay; `maxMs`
   tavanı 50s = tarayıcı drenajıyla AYNI. Erken-return + ana-return; **yalnız `batch_id` YOK iken**
   (global) → tarayıcı PDF batch akışı dokunulmaz. Kalan iş varsa CRON_SECRET'li self-chain (best-effort;
   asıl sürücü */3 dış tetik).
2. **MK-167.1 — Atomik claim guard:** `birIsIsle` lock'u
   `UPDATE ... .eq('id').in('durum',['bekliyor','hata']).select('id')`. Satır dönerse iş bizim; boş →
   `sonuc:'atlandi'` sessiz geç. Cron↔(hâlâ açık) tarayıcı drenajı çift-işlemesi (çift batch+çift maliyet)
   önlendi. `'hata'` dahil → wizard manuel-retry korunur.
3. **MK-167.2 — CRON_SECRET gate (sert mod):** `/api/kuyruk-isle` global yol (batch_id YOK) → Bearer
   CRON_SECRET ZORUNLU (env yoksa 500, yanlış/eksik token 401). batch_id'li çağrı AÇIK kaldı →
   tek frontend çağrısı `izometri-batch.html:514` body'de batch_id taşıyor (grep'le doğrulandı) → 0 regresyon.
4. **Dış tetik:** `.github/workflows/izometri-cron.yml` — `*/3` + workflow_dispatch + concurrency;
   POST `/api/kuyruk-isle {}` + Bearer secret. GitHub pratikte 5-10 dk oturabilir (saniye hassasiyeti
   DEĞİL — sayfa-kapalı backlog eritici). **Yedek:** vercel.json gece cron (03:00) DEĞİŞMEDİ.
5. **Secret kurulumu:** CRON_SECRET hem Vercel (Production+Preview) hem GitHub Actions repo secret —
   birebir aynı (openssl rand -hex 32).

## 167 — KANIT (mekanizma)
- secret'sız `curl POST /api/kuyruk-isle {}` → **401** (gate çalışıyor).
- secret'lı → **200** + `{"ok":true,...,"izometri":{"calisti":true,"islenen":0,"kalan_var":false}}`.
- Kuyruk anlık (167): izometri **bekliyor=0** (iptal=1336·manuel_onay=70·oneri_hazir=400·tamamlandi=183).
  → 0 işlemesi BEKLENEN. **Uçtan uca doğal-yol testi KULLANICI'da:** PDF yükle → sayfa kapat → */3 turu →
  SQL teyit. (Sonuç gelince bu satır güncellenecek.)

## ⚠ 168'e işaretler
- **Uçtan uca doğal-yol testi sonucu** (kullanıcıdan) — beklenen: yüklenen izometri PDF cron'la
  `oneri_hazir`/`manuel_onay`a geçer + `_eslesme` yazılır.
- **KARARLAR.md'ye İŞLE (kök dosya — pakette DEĞİL):** MK-166.1..6 + MK-85.3 (166 borcu) +
  **MK-167.1/2/3** (167). Bu hâlâ açık kapanış borcu.
- **MK-165.7/1 OPR dn→dis_cap** (DN200→200.0, doğrusu 219.1; olcuParse+dnBul) — AÇIK.
- **MK-165.7/3 uyarı mükerrerliği** (aynı uyarı 2-3 dk arayla çift) — AÇIK.
- **Onay kuşağı eritme** — GÜNCEL: oneri_hazir=400 + manuel_onay=70 (eski "162 kayıt" notu güncellendi).
- **Y200 öğretimi** (diğer bilgisayar; reçete FORMAT-OGRETIM-ATOLYE-162.md'de aynen) — AÇIK.
- **W-2.5** (iki ayrı çubuk değil) · **W-2.9** (eşzamanlı paralel devre değil) — AÇIK.
- Test devresi: **"bn ömn"** (77bfbc98) + **"b nn"** (e0af361d, taslak) — SİLME.

## MK kayıtları (167 — KARARLAR.md'ye İŞLENECEK, bu pakette değil)
- **MK-167.1:** atomik claim guard — `UPDATE...in('durum',['bekliyor','hata']).select`; boş dönüş = başka
  worker kaptı → atla. Cron↔tarayıcı çift-işleme önlenir; idempotent.
- **MK-167.2:** global tetik (batch_id YOK) CRON_SECRET ZORUNLU (sert); batch_id'li (frontend PDF batch)
  açık — gate'i scope'a göre ayır, mevcut açık çağrıyı kırma.
- **MK-167.3:** cron izometri drenajı = mevcut worker'a dal (drenajTuru tekrar); yeni endpoint yok
  (12/12 koru). Kalan-zaman bütçesi + maxMs tavanı tarayıcı drenajıyla eşit (cron daha agresif olamaz).

## NEREDEYIZ — ÖZET
167, 166'nın bıraktığı tek büyük mimari soruyu kapattı: izometri parse artık sayfa kapalıyken de
ilerliyor. Çözüm minimal-risk yoldan kuruldu — mevcut kanıtlı `drenajTuru` cron worker'ından da
çağrıldı (yeni endpoint/yeni mantık yok), çift-işleme atomik guard'la önlendi, dış tetik (GitHub
Actions */3) + gece Vercel cron yedeğiyle beslendi, ve global tetik CRON_SECRET'le korunurken tarayıcının
mevcut açık akışları (batch_id'li) hiç dokunulmadan bırakıldı. Mekanizma 401/200 ile kanıtlandı; uçtan
uca doğal-yol testi kullanıcıda. 12/12, izometri-oku dokunulmadı, migration yok.
