# CLAUDE-SONRAKI-OTURUM.md — Oturum 154 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md +
   **docs/WIZARD-YOL-HARITASI.md** (artık tek ilerleme aynası) oku · 5. Ajanda onayı

## ANA İŞ 1: W-3.9 + Y200 satır öğretimi → W-1.6 TAM kapanış
1. **W-3.9 format_tanit panzehiri:** TURETILEN_ALANLAR (cap_mm/et_mm/dn) için kayıtlı regex olsa bile
   _alanlariKos KOŞMAZ, buildParserKural/patch YAZMAZ, çip 🧮 "türetilmiş"e zorlanır. (153'te çöp
   regex'in ekrana kırmızı, üretime 2358 bastığı kanıtlandı; veri onarıldı, kod kapısı hâlâ açık.)
2. **Y200 satır öğretimi:** format_tanit düzeltme kipi → Y200-804-414.S01 aç → AI-oku + tablo köprüsü
   (152) → satir_tipleri'ne ST37/Welded Steel Tube desenleri eklenir (kabul_kriterleri DOKUNULMAZ).
   Dikkat: cache temiz L2 sonucunu tutuyor → AI-oku L3'e gitmeyebilir; satırlar L2'de boşsa sentez
   malzemesiz kalır → cache sha düşürme (MK-152.4 hedefli) veya zorla-L3 kararı gerekebilir.
3. **Kanıt:** cache düşür → S01 kuyruk reset → drenaj → beklenti: PDF malzeme satırları dolu +
   spool et schedule zincirinden Excel 4.5 ile tutarlı + bindirme çelişkisiz. → W-1.6 [x].

## ANA İŞ 2: Faz 2 başlangıcı (wizard akışı)
1. **W-2.11 KARARI (Cihat):** taslak önizleme = A) devre_detay ?taslak=1 kipi / B) ortak render modülü.
   Karar öncesi read-before-write: devre_detay taslak devreyle bugün ne kadar sorunsuz ("hgtrghh"
   zaten canlı test verisi — sayfa onu sorunsuz açtı, A lehine ilk kanıt).
2. **W-2.6/2.7:** devreler durum makinesi (taslak→işleniyor→hazır→aktif; migration MK-98.2 dry-run)
   + wizard İşlenenler sekmesi (drenajı süren kalıcı yüz; "sekmeyi açık tut" zorunluluğunun çözümü).
3. **W-2.13:** wizard iptali taslağı temizler/iptal işaretler; mevcut hayalet sayımı:
   `SELECT count(*) FROM devreler d WHERE NOT EXISTS (SELECT 1 FROM spooller s WHERE s.devre_id=d.id ...)`
   — gerçek sorgu şema doğrulamasından sonra (MK-85.3).

## KÜÇÜKLER (sıra gelirse)
- vercel.json: ares-izometri-drenaj.js no-cache başlığı (önce `git show HEAD:vercel.json`, MK-101.3).
- Excel kuyruğu: 3 IFS xlsm neden bekliyor — excel hattının tetik haritası (MK-152.3 deseni).
- manuel_onay=277 + oneri_hazir=1011 birikimi: onay UI'sı nerede, akıbet ne? (tartışma)
- Hayalet "hgtrghh": W-2.13 gemiye binince sil.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3 şema önce ·
**MK-153.2 SQL onarımı TEK çalıştırma** · MK-152.2 jsonb `->>` · MK-152.4 kanıt=taze/cache-düşmüş ·
MK-113/A server→server YOK (cron önerme!) · görülen-set/tek-deneme drenajda değişmez · zsh yorumsuz ·
arespipe_kopyala 3 argüman (MD5).

> 154 açılışı: ritüel → W-3.9 (kod kapısı) → Y200 öğretimi+kanıt → W-2.11 kararı → durum makinesi.
