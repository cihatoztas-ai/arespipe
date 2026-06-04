# son-durum.md — Oturum 153 (2026-06-04)

## Bu oturumda ne yapıldı
1. **WIZARD-YOL-HARITASI.md doğdu (docs/):** 5 fazlı, işaretlenebilir uçtan uca harita (başarı tanımı +
   Faz 0 tamamlananlar + Faz 1 kuyruk + Faz 2 wizard akışı + Faz 3 çift-taraflı format tanıtma +
   Faz 4 veri sağlığı + Faz 5 canlı kanıt turu). Cihat'ın 153 geri bildirimleri W-2.x maddelerine işlendi.
2. **MK-153.1 GEMİDE — `b919512`:** ares-izometri-drenaj.js çok-tur koşu. Dış while: liste bitince
   yeniden çekilir, işlenecek YENİ iş kalmayınca durur; görülen-set ile iş başına TEK deneme korunur
   (113'ün "AI'a çifte ödeme yok" garantisi). "Bekleyenleri işle'ye tekrar tekrar basma" derdi bitti.
3. **TAHLİYE TAMAMLANDI (canlı, konsol global drenaj):** 257 iş tek basışta (tur2'ye geçiş konsolda
   kanıtlı) + onarım sonrası 12 iş = **269 iş**. Sonuç: L2=206 / L3=41 → **L2 %83, toplam $1.15.**
   bekliyor 233→3 (kalan 3 = IFS xlsm, excel kuyruğu — izometri drenajı doğru şekilde dokunmadı).
4. **MK-117 KAPANDI:** "kullanici_id zorunlu" hatalarının tamamı tek küme — M110-722-21xx ailesi
   (11 dosya, devre_dokumanlari.yukleyen_id NULL). Veri onarımı: UPDATE ile sahiplendirme →
   ikinci drenaj turu 12/12 hatasız. Bekleyen 233'te null YOKTU (null'lar 'hata'da saklanıyormuş).
5. **a093eaaa çöp regex onarımı:** cap_mm/et_mm'de jenerik `\n(\d+)\n` kuralı (eski tanıtma turu
   kalıntısı) → `#-` ile düşürüldü. İlk deneme ROLLBACK yedi (MK-153.2), tek-statement tekrarı oturdu.
   Canlı kanıt: S01 yeniden parse → 2358'li `celiski_et_cap_farkli` flag'leri kayboldu, bindirme_flag=false.
6. **Y200 kanıt turu (kısmi W-1.6):** Y200-804-414.S01 → format a093eaaa + L2 + $0 (fn tie-breaker
   canlı ✓); S'siz dosya 39a2c81b montaj formatına doğru ayrıştı (kardeş ayrımı canlı ✓). MK-111.2
   sahada: PDF çöp et/cap=2358 üretti, bindir EZMEDİ, kabuğu seçip flag bastı. Schedule et kanıtı
   AÇIK: satir_tipleri Y200'ün ST37 satırlarını tutmadı → PDF malzeme listesi boş → et üretilmedi.

## Bulgular (153)
- **Hayalet devre:** wizard iptal edilse de Adım 1 taslağı DB'de durum='aktif' kalıyor ("hgtrghh",
  aktif listede görünüyor) → W-2.13 yeni madde. 233 birikiminin bir kısmının kaynağı muhtemelen bu.
- **MK-113/A blanket'tir:** Claude'un cron→drenaj zinciri önerisi 508 kanıtıyla GERİ ÇEKİLDİ
  (18× "izometri-oku HTTP 508" = eski self-chain dönemi). Tetik = client-loop; cron eklenmedi.
  (Not: Vercel cron limiti artık 100/proje — "tek cron hakkı" varsayımı eskimiş; yine de kullanılmadı.)
- **format_tanit kırmızı tutarsızlığı:** TURETILEN_ALANLAR'da kayıtlı (eski) regex varsa _alanlariKos
  koşup kırmızı basıyor; kaynak = çöp kural. Kalıcı panzehir W-3.9 (koşma + yazma + çip türetilmiş).
- ares-izometri-drenaj.js vercel.json no-cache listesinde DEĞİL → patch sonrası hard-reload gerekti.

## Commit'ler (153)
| Hash | Mesaj |
|------|-------|
| `b919512` | fix(153): drenaj cok-tur kosu — tek basista tum bekleyenler, is basina tek deneme korunur (MK-153.1) |
DB (veri UPDATE, migration YOK): a093eaaa parser_kural #- cap_mm/et_mm · ai_api_log pdf_sha256 hedefli
düşürme (a093eaaa, 6 saat) · S01 kuyruk reset · devre_dokumanlari 11 yetim yukleyen_id ataması.
CI yeşil. 12/12 ✓. izometri-oku DOKUNULMADI ✓.

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-153.1:** Drenaj çok-tur koşar (liste bitince yeniden çek); iş başına tek deneme (görülen-set)
  değişmez kuraldır. Global drenaj UI'sızdır (konsol) — kalıcı yüzü W-2.7 İşlenenler sekmesi.
- **MK-153.2:** Supabase SQL editöründe BEGIN ve COMMIT ayrı çalıştırmalara bölünürse oturum kapanışı
  ROLLBACK eder. Veri onarımı TEK çalıştırmada: tek-statement UPDATE + ardından SELECT doğrulama.
- **MK-153.3:** "kullanici_id zorunlu" sınıfı hataların kökü devre_dokumanlari.yukleyen_id NULL;
  onarım veri UPDATE ile sahiplendirme. Hangi akışın null INSERT attığı hâlâ tespit edilmedi (kuyrukta).

## 154 ANA İŞ
1) **W-3.9 format_tanit panzehiri** (türetilmiş alanlara kayıtlı regex koşulmaz/yazılmaz) +
   **Y200 satır öğretimi** → schedule et kanıtı kapanır (W-1.6 tam ✓).
2) **Faz 2 başlangıcı:** W-2.11 kararı (taslak önizleme A/B) + W-2.6/2.7 durum makinesi + İşlenenler
   sekmesi (hayalet devre W-2.13 bununla çözülür).
3) Küçükler: drenaj JS no-cache başlığı (vercel.json, MK-101.3 ile) · Excel kuyruğu tetiği (3 IFS xlsm
   neden bekliyor) · manuel_onay 277 + oneri_hazir 1011 birikiminin onay UI akıbeti (tartışılacak).

## Açık kuyruk (öncelik korunarak)
W-3.9 + Y200 satır öğretimi · Faz 2 (durum makinesi/İşlenenler/klasör ağacı W-2.3-4/W-2.13) ·
B2↔B1 köprü UI · cache-bypass/zorla-L3 teaching · et_mm UX · kaydet modal UX · format_kodu öneri ·
bbox normalize · Windows render · Band-B · dirsek 323.9 · E120 prefix · Excel kuyruk tetiği ·
drenaj JS no-cache · hayalet devre temizliği ("hgtrghh" + sayım).
