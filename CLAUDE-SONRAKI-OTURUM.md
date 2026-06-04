# CLAUDE-SONRAKI-OTURUM.md — Oturum 153 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: `0bac952` sonrası oto-rapor commit'i kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku
5. Ajanda onayı

## ANA İŞ 1: TAZE Y100 FİNAL KANITI (schedule zinciri kapanışı)
Cihat sisteme hiç girilmemiş bir Y100 spool PDF'i tedarik eder (S05+ / 007-012 ailesinden kullanılmamış
varyant). İzometri Batch'ten yükle → beklenti: `ai_api_log.format_id=a093eaaa` (fn +5 tie-breaker) +
spool **et=2.77, et_kaynagi schedule/asme** + malzeme satırları (satir_tipleri=2 koşar).
Taze dosya YOKSA: cache-bypass tasarımı (izometri-oku DEĞİŞMEDEN — zorla-L3 teaching ile aynı küme;
aday: kuyruk-isle-izometri'nin izometri-oku çağrısına opsiyonel bypass parametresi YA DA cache satırını
hedefli SQL ile düşürme — karar A/B/C ile Cihat'a).

## ANA İŞ 2: Faz 2 — tetikler + MK-117 + tahliye
1. **dosya_isleme_kuyrugu tetiği:** kuyruk-isle-izometri drenaj modu (`{}` body) hazır; eksik olan ÇAĞIRAN.
   Aday: wizard inceleme açılışında client-loop (MK-113/A deseni, devre-bazlı) + elle "kuyruğu işle" butonu.
   Cron'a İKİNCİ path eklemek Hobby'de tartışılır (tek cron hakkı `kuyruk-isle`'de — birleştirme düşün).
2. **MK-117 yukleyen_id:** read-before-write listesi 152 açılış dosyasında duruyor (gate 305-308 OKUNDU:
   `dok.yukleyen_id` yoksa isiHataylaKapat). Kalan: hangi akış null INSERT atıyor + kaç kayıt + çözüm A/B
   (yükleme noktasında kullanıcı garanti / sistem yüklemelerine kontrollü gevşetme).
3. **Tahliye:** tetik bağlanınca 100+ bekleyen drenajdan geçer; yukleyen_id null'lar MK-117 çözümünü bekler.
4. **Wizard "Formatı düzelt" butonu:** Zayıf/çelişki/L3 rozetli satıra buton → format_tanit
   `?format_id=&alan=` (149'dan hazır). B2 (Düzelt modalı) ↔ B1 (format_tanit) ayrımı UI metnine işlensin.

## SONRA (sırası gelince)
Faz 3 propagasyon: eslestirme-backfill ile e1fb879d'ye yanlış düşmüş Y-ailesi + eski L3'ler yeniden parse
(alias deseni MK'da: `dok_id:devre_dokuman_id`). · et_mm UX ("runtime'da ASME'den dolar") · kaydet modal UX ·
format_kodu öneri · bbox normalize · Windows render · Band-B.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3 + **MK-152.2**
(jsonb `->>` ile doluluk; `?` tuzak) · MK-152.4 kanıt = taze dosya · MK-151.2 et yalnız metin/asme-dürüst ·
zsh komutlar yorumsuz · arespipe_kopyala 3 argüman (MD5 zorunlu).

> 153 açılışı: ritüel → "taze Y100 var mı?" sorusu → varsa ANA İŞ 1, yoksa cache-bypass A/B/C → Faz 2.
