# CLAUDE-SONRAKI-OTURUM.md — Oturum 156 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. CI: kapanış commit'i sonrası oto-rapor kanıt · 4. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md
   + docs/WIZARD-YOL-HARITASI.md + (format işine girilecekse) FORMAT-TANITMA-ILERLEME.md 155 bölümü oku
5. Ajanda onayı (155 üç ana iş + bir sapma kapattı; 156 daha hafif kurgulanabilir)

## ANA İŞ ADAYLARI (Cihat sıralar)
1. **Onay havuzu tasarım SOHBETİ** (~953: oneri_hazir 690+ / manuel_onay 263+): operatör NEREDE
   görür, hangi sırayla onaylar, toplu onay var mı, manuel_onay ile oneri_hazir ayrımı UI'da nasıl?
   Kod yazılmaz — karar çıkarsa 157'ye iş doğar. (155'te iki kez ertelendi, artık vakti.)
2. **İşlenenler→"Önizle" butonu:** satıra ?taslak=1 köprüsü — W-2.11'in tek açık ucu, küçük iş
   (devre_wizard_v3.html'e bir buton + URL).
3. **NB1124 kabuk eşleşmesi:** 22 spool kabukta_yok — bu devrede Excel kabuk yüklü mü, pipeline
   adlandırması mı uyuşmuyor? Önce teşhis sorgusu (MK-126.8), spool_kalite yükseltmesi buna bağlı.
4. **Format kuyruğu** (sıra gelirse): W-3.9 panzehiri (İLK — kod kapısı) → Y200 ST37 öğretimi.
   ADRES NOTU (MK-155.1): a093eaaa AILE_KAYIT'ta YOK → DB parser_kural'a (152 köprüsü geçerli);
   e1fb879d ailesi → format-paketleri.js (kod+deploy). Karıştırma — 155'in ilk turu bu yüzden boşa gitti.

## KÜÇÜKLER
- W-2.4 dışlama test vakası hazır: NB1124 tablosuz çizimler (.SXX'siz: "12Ax12D.1.pdf" tarzı).
- format_tanit ürünleşme sorusu (MK-155.1 doğurdu): paket-katmanlı ailede operatör öğretimi nereye
  yazar? (PR-taslağı mı, bu ailelerde devre dışı mı — tasarım kararı.)
- boy_mm int kaybı (MK-155.2) kabul edildi; motoru AÇMA.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz, doc ayrı ·
MK-85.3 şema önce · MK-126.8 TAM dosya oku (155'te yarım uyum ucuz atlatıldı) · **MK-155.1 kural
kayıt adresi: AILE_KAYIT'lıysa KOD, değilse DB** · cache düşürmede deploy SONRASI sha'lar da
(155 tuzağı) · bitis_at UTC'dir, TR ile karşılaştırma · drenaj sekme açıkken ANINDA koşar (reset
sonrası "bekleyen yok" normaldir) · push reddi → `git pull --rebase` · arespipe_kopyala MD5 + _arsiv.

> 156 açılışı: ritüel → Cihat ajanda sıralaması (öneri: onay havuzu sohbetiyle başla, taze kafa
> tasarım işi) → seçilen iş → canlı kanıt → kapanış.
