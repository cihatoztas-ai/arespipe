# CLAUDE-SON-OTURUM.md — Oturum 155 özeti

## Tek cümle
W-2.11/A taslak önizleme kipi 19 yazma noktası kilidiyle gemiye bindi (W-2.12 görsel diliyle,
canlı kanıtlı); MK-153.3 yukleyen_id NULL kökeni iki wizard'daki sessiz getUser fallback'i çıkıp
sert iptale çevrildi; NB1124 "faciası" planlı sapmayla redüksiyon satır öğretimine dönüştü ve
oturumun en değerli dersini verdi — MK-155.1: paket-katmanlı ailelerde kural KODDA yaşar, DB'ye
öğretmek ölü mektuptur.

## Kilitli kararlar
1. **W-2.11 köprü ayrımı (Cihat):** İncele → Adım 2 (düzeltme/onay) KALDI; ?taslak=1 ayrı "Önizle"
   kapısı olacak (buton 156). İki kapı iki amaç.
2. **123.C devri = A (Cihat):** reduksiyon_sch silindi, genel 'reduksiyon' devraldı. Gerekçe
   zinciri: nps_inc/nps_kucuk tüketicisiz (grep) + motor ilk-tetikleyen kısıtında örtüşen tipler
   tuzak + sökemezse ham_satir görünür düşer (B-6). MK-155.3.
3. **DB'deki ölü tip (parser_kural 8.) bilinçli BIRAKILDI:** fallback senaryosuna tutarlı, zararsız.

## Süreç dersleri (155)
- **MK-155.1 nasıl kaçtı:** kural ekleme turunda izometri-oku akışını "L2'yi cache'le ilişkisi"
  için okudum ama 902'deki aileBirlestir önceliğini İLK turda görmedim — DB güncellemesi RETURNING
  kanıtlı olduğu halde etkisizdi. Ders: read-before-write'ta yazılacak VERİNİN OKUNDUĞU satırı da
  doğrula ("bu kuralı kim, hangi öncelikle okuyor?"), sadece şemayı değil.
- **Cache tuzağı:** L2 sonuçları da pdf_sha256'lı loglanıyor → deploy öncesi NULL'lama yetmez,
  deploy SONRASI o günün sha'ları da düşürülür. İlk reset bu yüzden eski sonucu yeniden üretti.
- **UTC tuzağı yine (51 dersi):** bitis_at 08:18 UTC = 11:18 TR — "reset ısırmadı" yanılgısını
  saat dilimi çevirisi çözdü; drenaj sekme açıkken bekleyenleri ANINDA kapıyor (tasarım gereği).
- **"Facia" üç bilinen borcun bileşkesiydi:** satır öğretimi + tablosuz çizim (W-2.4) + kabuk
  eşleşmesi. Panik yerine teşhis sırası: önce hangi patch'in DOKUNMADIĞINI söyle, sonra kanıt sorgusu.
- **154 dersi iki kez işledi:** stat sayacı şüphesi yeniden ölçüldü → temiz çıktı (138/A zaten
  filtreliyordu); "eski oturum bulgusu da yeniden ölçülür" artık refleks.
- **MK-126.8 yarım uyumum:** format-paketleri.js'e tip eklerken dosyanın tamamını okumamıştım —
  mevcut reduksiyon_sch'i etkin listede ('reduksiyon_sch' adını görünce) yakaladım. Tam dosya
  okuması patch'ten ÖNCE gelmeliydi; bu sefer ucuz atlatıldı.

## Canlı kanıt envanteri (155)
- Taslak kipi: normal kip regresyon ✓ + ?taslak=1 bant/rozet/kilit ✓ (Cihat turu).
- Redüksiyon: 10Ax6A → ham=false, boy=177, kalite=316L, kg=14.8, sure_ms 2217, güven 1,
  "L2 deterministik parse". Önceki tur: 22340 ms L3, malzeme_listesi boş. $0.
- Lokal: gerçek aileBirlestir ile 9/9 (8 redüksiyon + boru_sch regresyonu); node --check ×3 dosya;
  dil dosyaları anahtar-anahtar kıyas (kayıp 0 / yabancı 0 / değişen 0).

## Dosyalar (155)
devre_detay.html (3028→3054: TASLAK_KIP+_tkKilit+_tkBanner+19 guard) · lang/tr,en,ar.json
(1917→1920) · devre_wizard_v3.html + devre_wizard.html (MK-153.3 sert iptal) ·
lib/format-paketleri.js (→268: 'reduksiyon' eklendi, 'reduksiyon_sch' devroldu).
Commit: bca6a01 + 50ef94b. DB: veri UPDATE'leri, migration YOK.

## Kapanış durumu
HEAD `50ef94b` + kapanış doc commit'i. 12/12 ✓. izometri-oku DOKUNULMADI ✓. NB1124 devresi taslakta
duruyor (kabuk eşleşmesi 0 — 156 konusu). Onay havuzu ~953 iş, tasarımı hâlâ bekliyor.
