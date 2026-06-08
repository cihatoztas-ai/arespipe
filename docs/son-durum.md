# son-durum.md — 167. Oturum (2026-06-08)

## TEMA
CRON / SAYFA-KAPALI İZOMETRİ İŞLEME: 166'nın "ANA TASARIM" maddesi (MK-166.1) uçtan uca kuruldu.
Format öğretimi yine ATLANDI (Cihat kararı). Tema yalnız buydu.

## DURUM
- Commit: `0e7108d` (kod — feat 167). Workflow GitHub WEB'den eklendi (PAT'ta `workflow` scope yok).
- 12/12 fonksiyon (yeni endpoint YOK — import lib-içi). Migration YOK. izometri-oku DOKUNULMADI.
- Değişen dosyalar SUNUCU tarafı → tarayıcı sert-yenile GEREKMEZ.
- ⚠ 168 açılışı: lokal diskte izometri-cron.yml var ama uzağa WEB'den eklendi → `git pull --rebase`.

## YAPILANLAR (4 + secret kurulumu)
1. **MK-167.3 — CRON izometri drenaj dalı:** kuyruk-isle.js, is_kuyrugu (PDF) SONRASI KALAN zaman
   bütçesiyle dosya_isleme_kuyrugu/izometri'yi sürer. Yeni mantık YOK — drenajTuru (kuyruk-isle-izometri.js,
   MK-112.1) çağrılır. Bütçe 60s−geçen−8s; maxMs tavanı 50s = tarayıcı drenajıyla AYNI. Erken+ana return;
   YALNIZ batch_id YOK iken (global) → tarayıcı PDF batch dokunulmaz. Kalan iş varsa secret'li self-chain.
2. **MK-167.1 — Atomik claim guard:** birIsIsle lock → `.in('durum',['bekliyor','hata']).select('id')`;
   boş dönüş = başka worker kaptı → `sonuc:'atlandi'`. Cron↔tarayıcı çift-izometri-oku önlendi.
   'hata' dahil → wizard manuel-retry korunur.
3. **MK-167.2 — CRON_SECRET gate (sert):** /api/kuyruk-isle global yol (batch_id YOK) Bearer secret
   ZORUNLU (env yoksa 500, yanlış/eksik 401). batch_id'li (izometri-batch.html:514, body'de batch_id)
   AÇIK → 0 regresyon (grep'le doğrulandı).
4. **Dış tetik:** .github/workflows/izometri-cron.yml (*/3 + workflow_dispatch + concurrency) →
   POST /api/kuyruk-isle {} + Bearer. GitHub 5-10 dk oturabilir (sayfa-kapalı backlog eritici).
   YEDEK: vercel.json gece cron (03:00) DEĞİŞMEDİ.
5. **Secret:** CRON_SECRET → Vercel (Production+Preview) + GitHub Actions secret, birebir aynı.

## KANIT (mekanizma)
- secret'sız curl → **401** (gate çalışıyor) · secret'li → **200** + izometri.calisti:true.
- Kuyruk anlık: izometri bekliyor=0 (iptal=1336·manuel_onay=70·oneri_hazir=400·tamamlandi=183) →
  0 işlemesi BEKLENEN. Uçtan uca doğal-yol testi KULLANICI'da (PDF yükle→sayfa kapat→*/3→SQL teyit).

## AÇIK (168)
- **Uçtan uca doğal-yol testi sonucu** (kullanıcıdan).
- **KARARLAR.md'ye İŞLE (kök dosya, pakette DEĞİL):** MK-166.1..6 + MK-85.3 + MK-167.1/2/3.
- MK-165.7/1 OPR dn→dis_cap (DN200→200.0 vs 219.1) · MK-165.7/3 uyarı mükerrerliği.
- Onay kuşağı eritme (GÜNCEL: oneri_hazir=400 + manuel_onay=70) · Y200 öğretimi (diğer bilgisayar).
- W-2.5 (iki ayrı çubuk) · W-2.9 (eşzamanlı paralel devre).

## MK (167 — KARARLAR.md'ye işlenecek)
MK-167.1 (atomik claim guard) · MK-167.2 (global tetik CRON_SECRET zorunlu, batch_id'li açık) ·
MK-167.3 (cron izometri drenajı = mevcut worker'a dal, drenajTuru tekrar, yeni endpoint yok).

## OPERASYONEL DERSLER (167 — MK değil, hatırlatma)
- `arespipe_kopyala <kaynak> <hedef> <md5>` — sıra: indirilen ÖNCE, repo hedefi SONRA.
- zsh yorum/komutta `()`, `*` (glob), `!` parse eder → tek-tırnak heredoc veya yorumsuz komut.
- `.github/workflows/` push'u PAT'ta `workflow` scope ister; yoksa `git reset --soft HEAD~1` + WEB'den ekle.

## TEST DEVRELERİ — SİLME
"bn ömn" (77bfbc98) · "b nn" (e0af361d, taslak).
