# CLAUDE-SONRAKI-OTURUM.md — Oturum 159 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md
   + docs/WIZARD-YOL-HARITASI.md oku · 5. Kod okuma: repo raw (working tree temizse dosya isteme;
   kirli ise Cihat'tan iste) · 6. Teşhis sırası: VERİ (SQL) → UI → kod (MK-158.1) · 7. Ajanda
   onayı (Cihat sıralar)

## ANA İŞ ADAYLARI
1. **İş emri numarası terfiye taşınması (önerilen başlangıç — canlıda görünür borç):**
   Karar (taslak/terfi dönemi): iptal edilen taslaklara numara ATANMAZ, numara TERFİDE üretilir,
   taslakta "terfide üretilecek" gösterilir. Gerçek: numara taslak INSERT'inde üretiliyor —
   taslak önizlemede P26-216 göründü, aktif listede 199→201→204→207→215→217 sıçramalı (iptal
   taslaklar numara yakmış). Read-before-write: wizard v3 taslak devre INSERT'i (is_emri_no
   nerede üretiliyor — client mi DB default/trigger mı?) + onayEt terfi akışı + numara üretim
   mekanizması (sayaç tablosu? max+1?). Fix: üretimi terfiye taşı; taslakta NULL → wizard zaten
   "terfide üretilecek" gösteriyor; devre_detay taslak kipinde de aynı metin. Mevcut taslakların
   yakılmış numaraları geri alınmaz (sadece ileriye dönük). Yarış koşulu: iki eşzamanlı terfi
   aynı numarayı almasın.
2. **PDF NOT okuma kanıt turu:** Mekanizma SAĞLAM ÇIKTI (158: ALS terfisinde alıştırma doldu).
   Cihat'ın "koptu" gözlemi için: (a) format-bazlı tarama — hangi format ailelerinde
   `parse_sonuc.not_metni` / `alistirma_ipucu` üretilmiyor (SQL: parse_sonuc ? 'not_metni'
   dağılımı format'a göre); (b) `imalat_not` spool detayda görünüyor mu (UI teyidi — "bu spoolda
   imalat öncesi dizayndan kontrol ettir" tipi notlar personele ulaşmalı); (c) KISMI kuralı
   ("sadece flanşı kaynatma") canlı bir örnekle. Adresler: lib/l2-parser.js
   `alistirma_ipucu_kurali` (format override edebilir) + kuyruk-isle-izometri eslestir
   ~satır 587-596 (PDF BAZ kararı: _alistirma VAR ise imalat_not yazılmaz).
3. **Format hattı (sıra gelirse):** Sefine Material/Spool List şablon haritası (IFS köprüsü
   hazır — en ucuz kazanım, YENI-VERI-KAYNAKLARI-ANALIZ.md) · Y200 ST37 satır öğretimi + W-3.9
   panzehiri (a093eaaa=DB, e1fb879d=paket — MK-155.1) · W-2.4'ü sınıflandırma+yönlendirme olarak
   tasarla (ZWCAD/derleme-kitabı sınıfları).

## KÜÇÜKLER
- KARARLAR.md'ye MK-157.1/2/3/4 + MK-158.1/2/3 + "kuyruk=truth, parse_durumu=yedek" işle.
- EN/AR dil anahtarları: dv_tab_onay, dv_onayk_* ailesi, dv_taslak_spool_yok (TR fallback
  çalışıyor, çeviri kozmetik).
- hhbjşlö 1 excel önerisi: onay modalından aktar (veya Cihat bilinçli bekletiyor — sor).
- 6 B1124 PDF'ini ORİJİNAL adlarla yükle (MK-52.1) · IZO-KANIT-SETI v4 yapıştır + ad kararı ·
  ✖ sessiz-kayıp doğrulaması (tetiksiz satır ham_satir'a düşüyor mu).
- W-3.4 (öğretilen kural kardeşlere otomatik yayılır) — Cihat 158'de sordu, FAZ 3'te açık;
  format hattına dönünce W-3.1/3.2 ile birlikte.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz, doc ayrı ·
MK-126.8 TAM dosya oku (repo raw) · MK-157.1 kabukta_yok teşhisinde İLK kontrol devre durumu ·
MK-157.2 Vercel repro = node@20.11 · MK-157.4 kuyruk durumu ≠ eşleşme durumu · MK-158.1 teşhis
sırası VERİ→UI→kod + benzer adlı devre ≠ aynı devre · MK-158.2 toplu kapatma kapsamı ·
MK-158.3 taslak önizleme = terfi · SQL şablonlarında YER TUTUCU VERME (158'de bir kez daha
yaşandı) · DML sonrası kalıcılık teyidi · bitis_at UTC · arespipe_kopyala MD5 + _arsiv ·
test yatağı: g200 (54m+86ö) + aw231 atanmamışlı örnekler (silme!).

> 159 açılışı: ritüel → Cihat ajanda sıralaması (öneri: iş emri numarası — görünür borç, dar
> kapsam) → read-before-write → canlı kanıt → kapanış.
