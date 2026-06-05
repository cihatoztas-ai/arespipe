# CLAUDE-SONRAKI-OTURUM.md — Oturum 158 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md
   + docs/WIZARD-YOL-HARITASI.md oku · 5. Kod okuma: repo raw (156 yöntemi) + gerekirse lokal node
   repro (157 yöntemi: ortam-doğru repro = node@20.11) · 6. Ajanda onayı (Cihat sıralar)

## ANA İŞ ADAYLARI
1. **Onay Kuyruğu sekmesi İMPLEMENTASYONU (önerilen başlangıç — önünde engel yok):**
   Tasarım 156 + read-before-write 157 TAMAM. Bilinen gerçekler:
   - excel oneri_hazir: tüketici VAR (onayModalAc→onayAktar→ARES_KABUK.aktar→tamamlandi) — sekme
     bunu yeniden icat etmez, köprüler.
   - izometri oneri_hazir: veri ZATEN uygulanmış (eslestir/bindir otomatik) → "toplu onay" =
     yalnız durum kapatma geçişi (oneri_hazir→tamamlandi, veri işlemi YOK).
   - izometri manuel_onay: DELİK — uyarılar hiçbir UI'da açılmıyor. Sekmenin asıl yeni işi:
     parse_sonuc.spoollar[].uyarilar (kod+mesaj+agirlik, hazır JSONB) listesi + tekil kapatma.
   - atanmamis: ayrı alt grup, "eşleştir" butonu (onayla değil).
   - devreler.html bekleyen-onay rozeti (DİKKAT 157 dersi: rozet KUYRUK gerçeğini saysın,
     taslak devre sayısını değil).
   - AÇILIŞTA: havuz sayısını SQL ile yeniden say (157'de hhbjşlö 22 manuel→öneri oldu; eski
     230+97=327 sayısı bayat). Test yatağı: g200 + 265-overboard; hhbjşlö = yeşil-yol örneği.
   - Kapatma geçişinin adı/semantiği: 'tamamlandi' mevcut CHECK'te var mı → read-before-write
     (kuyruk durum CHECK kısıtı + tüketicilerin 'tamamlandi' davranışı grep'i) → gerekirse
     MK-98.2 dry-run migration.
2. **W-2.14 tasarımı (kod yazılmayabilir):** ?taslak=1 kipinde spooller yerine taslak veri katmanı
   (ARES_KABUK.grupla + kuyruk önerileri). MK-127.4 bozulmaz; 155'in "render'a sıfır dokunuş"
   disipliniyle gerilim — tasarım kararı.
3. **Format hattı (sıra gelirse):** Y200 ST37 satır öğretimi + W-3.9 panzehiri (adres:
   a093eaaa=DB, e1fb879d=paket — MK-155.1).

## KÜÇÜKLER
- İşlenenler rozet/boş-durum düzeltmesi: "0" taslak devre sayısı; kuyrukta bekleyen iş sayısı da
  görünmeli ("Bekleyenleri işle" global, filtre:{} — 157'de kafa karıştırdı).
- 6 B1124 PDF'ini ORİJİNAL adlarla storage'a yükle ("(1)" Downloads eki temizle, MK-52.1) —
  kanıt setinin ham_satir kaynağı.
- IZO-KANIT-SETI v4 ekini yapıştır + belge adından "31PDF"i düşürme kararı (artık 37).
- ✖ "sessiz kayıp" doğrulaması: tetiksiz satır ham_satir'a düşüyor mu (tek canlı örnek).
- Montaj görünümü göz teyidi: hhbjşlö'de 1 spool aç → montaj_json UI'da görünüyor mu (157 kanıtı
  veri katmanındaydı, göz teyidi yapılmadı).
- KARARLAR.md'ye MK-157.1/2/3/4 işle + "kuyruk=truth, parse_durumu=yedek" notu.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz, doc ayrı ·
MK-126.8 TAM dosya oku (repo raw) · MK-157.1 kabukta_yok teşhisinde İLK kontrol devre durumu ·
MK-157.2 Vercel repro = node@20.11, lokal yükleme kanıt değil · MK-157.3 .SXX'siz Cadmatic =
montaj adayı · MK-157.4 kuyruk durumu ≠ eşleşme durumu · DML sonrası kalıcılık teyidi (dry-run
COMMIT'siz kalabiliyor — 157'de yaşandı) · SQL şablonlarında yer tutucu verme · bitis_at UTC ·
arespipe_kopyala MD5 + _arsiv · test yatağı: g200 + 265-overboard (silme!).

> 158 açılışı: ritüel → havuz SQL sayımı → Cihat ajanda sıralaması (öneri: Onay Kuyruğu
> implementasyonu — saf kod işi, tüm önkoşullar kapalı) → canlı kanıt → kapanış.
