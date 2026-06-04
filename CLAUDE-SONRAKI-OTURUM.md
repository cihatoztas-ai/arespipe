# CLAUDE-SONRAKI-OTURUM.md — Oturum 152 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: `f38749a` yeşil mi (ci-son-rapor otomatik commit'i kanıt sayılır)
4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md oku · 5. Ajanda onayı

## ANA İŞ: yukleyen_id NULL BORCU (MK-117)
Belirti: kullanıcısız yüklenen dosyalar `api/kuyruk-isle-izometri.js:305` "yukleyen_id boş" ile düşer →
parse/eşleşme/izometri/NOT/alıştırma zinciri hiç başlamaz.
İki aday çözüm (A/B/C ile sunulacak): (a) yükleme noktalarında kullanıcı atamasını garanti et (oturum id'si
zaten ARES.oturumAl()'da), (b) sistem-kaynaklı yüklemeler için gate'i kontrollü gevşet (veri sahipliği/RLS
etkisi tartılmalı). Mevcut null kayıtlar için backfill kararı ayrıca verilecek.

## Read-before-write (koda BAŞLAMADAN)
1. `api/kuyruk-isle-izometri.js` 280-340 (gate'in tam bağlamı + hata yolu)
2. Dosya kayıt noktaları: hangi akışlar yukleyen_id'siz INSERT atıyor (wizard? batch? sistem?)
3. İlgili tablo şeması: `SELECT column_name,is_nullable FROM information_schema.columns WHERE table_name='dosya_isleme_kuyrugu'` + dosya tablosu (adını Cihat'tan/koddan doğrula — MK-85.3)
4. Kaç kayıt etkileniyor: `SELECT count(*) ... WHERE yukleyen_id IS NULL` (tablo adı doğrulandıktan sonra)

## ERTELENEN paket (152'de DOKUNMA, sırası gelince)
Format tanıtma bağlama: içerik-öncelikli fingerprint (dosya-adı sinyal, kimlik değil — MK-151.5 ruhu) →
batch+wizard tetik butonları (?format_id=&alan= hazır) → propagasyon (eslestirme-backfill) → teaching zorla-L3
(izometri-oku DEĞİŞMEDEN). + Windows render bulgusu ayrı oturum.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-51.1 arespipe_kopyala+MD5
· MK-85.3/98.2 şema önce, migration BEGIN/ROLLBACK · zsh komutlar yorumsuz · MK-151.4 kanıtlar gerçek veriyle.

> 152 açılışı: ritüel → "yukleyen_id'ye başlıyoruz, kuyruk-isle 280-340 + dosya INSERT noktalarını okuyorum" — başka soru yok.
