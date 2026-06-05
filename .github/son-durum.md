# son-durum.md — Oturum 155 (2026-06-05)

## Bu oturumda ne yapıldı
1. **W-2.11/A + W-2.12 GEMİDE — `bca6a01`:** devre_detay ?taslak=1 önizleme kipi. TASLAK_KIP flag +
   `_tkKilit()` çekirdeği — 19/19 yazma fonksiyonu (13 doğrudan supa + inlineEdit/spoolDurdur/
   spoolKaldir/spoolSil/spoolIptal/onayAktar) tek satır guard (MK-154.2 deseni: çağrılır, kopyalanmaz).
   Amber bant + TASLAK rozeti + kilit toast'ları; 3 dil anahtarı ×3 dosya (1917→1920). Render'a sıfır
   dokunuş. Canlı: normal kip regresyon ✓, taslak kip kilit ✓.
2. **MK-153.3 KAPANDI — `50ef94b` içinde:** yukleyen_id NULL kökeni bulundu — iki wizard'da
   `getUser` düşünce sessiz null'la DEVAM ediliyordu (117 ailesinin doğum yeri). Fix: session
   fallback + sert iptal (taslak devre dahil hiçbir şey oluşturulmadan durur, status box + toast).
3. **PLANSIZ FORMAT SAPMASI (Cihat onayı, NB1124 "faciası"):** redüksiyon satır tipi öğretildi —
   ama İLK TUR DB'ye yapıldı ve OKUNMADI → **MK-155.1 kritik ders:** AILE_KAYIT'lı formatlarda
   (e1fb879d!) etkin kural format-paketleri.js'ten derlenir (izometri-oku:902 aileBirlestir||DB),
   DB parser_kural yalnız fallback. Doğru tur: 'reduksiyon' tipi MALZEME_PASLANMAZ facet'ine
   (`50ef94b`), 20 ham satır / 8 benzersiz örnek, gerçek aileBirlestir ile 9/9 lokal + saha mührü:
   10Ax6A ham=false boy=177 kalite=316L kg=14.8, L2 güven 1, $0 (eski: 22.3sn L3 + boş tablo).
4. **123.C 'reduksiyon_sch' DEVROLUNDU (A kararı):** nps_inc/nps_kucuk tüketicisiz (grep kanıt);
   motor ilk-tetikleyen kısıtında örtüşen tipler tuzak → tek genel tip. MK-155.3.
5. **Cache düşürme tuzağı öğrenildi:** L2 sonuçları da sha'lı loglanıyor — kural deploy'undan SONRA
   o günün sha'ları da NULL'lanmalı (ilk reset eski sonucu yeniden üretti, ikinci tur temiz).
6. **devreler.html stat sayacı şüphesi KAPANDI (kod kanıtı):** count 1299 applyFilters'tan geçiyor
   (silindi≠true + durum≠taslak ZATEN var, 138/A); 2696 rozet sayacı bilerek taslak sayıyor (154).
   Yapılacak iş yok — 154 dersi tekrar: eski şüphe yeniden ölçülür.

## Bulgular (155)
- NB1124 tablosuz çizim sayfaları (.SXX'siz) işlemeye girmiş → W-2.4 dışlamasının somut test vakası.
- NB1124 kabuk eşleşmesi 0 (kabukta_yok) → spool_kalite yükseltmesi koşmuyor; parser değil kabuk konusu.
- Motor boy_mm'i int'e çevirir (177.8→177) — MK-155.2, istisna açılmadı (MK-118.3).
- Cihat İşlenenler'den bir test devresini sildi — 154 hijyeni (W-2.13) sayesinde güvenli.

## Commit'ler (155)
| Hash | Mesaj |
|------|-------|
| `bca6a01` | feat(155): W-2.11/A devre_detay ?taslak=1 onizleme kipi — 19 yazma noktasi _tkKilit + bant/rozet (W-2.12), 3 dil anahtari |
| `50ef94b` | fix(155): redüksiyon satir tipi PASLANMAZ facet'ine (NB1124, 8 ornek kanitli; 123.C devralindi/A) + MK-153.3 yukleyen_id sert iptal (iki wizard) |
DB (veri UPDATE, migration YOK): e1fb879d parser_kural tip 7→8 (ölü ama fallback'e tutarlı, bilinçli
bırakıldı) · ai_api_log format+bugün sha NULL ×2 tur · NB1124 kuyruk reset (.SXX, ~22 iş).
CI yeşil. 12/12 ✓. izometri-oku DOKUNULMADI ✓ (902 satırı sadece OKUNDU).

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-155.1:** AILE_KAYIT'lı formatlarda satır öğretimi DB parser_kural'a DEĞİL
  lib/format-paketleri.js katmanına yapılır (= kod + deploy); aileBirlestir DB'yi okumaz, DB kural
  yalnız fallback. format_tanit ürünleşmesi bu ikiliği hesaba katmalı (156+ tasarım sorusu).
- **MK-155.2:** l2 motoru boy_mm'i int'e çevirir; motora tip istisnası açılmaz (MK-118.3),
  tek-ondalık boy kaybı (≤0.9mm) kabul edilen tolerans.
- **MK-155.3:** Motor "ilk tetikleyen tipte kalır, pattern tutmazsa ham düşer" — örtüşen
  tetikleyicili satır tipleri tuzaktır; genel tip + görünür ham_satir düşüşü (B-6) tercih edilir.
  123.C bu gerekçeyle 155 genel 'reduksiyon' tipine devroldu.

## 156 ANA İŞ
1) İşlenenler→"Önizle" köprüsü (?taslak=1'e buton — W-2.11'in açık ucu, küçük).
2) Onay havuzu tasarım sohbeti (~953 iş: oneri_hazir 690+ / manuel_onay 263+) — kod yok, konuşma.
3) Format kuyruğu: W-3.9 panzehiri (hâlâ İLK) → Y200 ST37 öğretimi (adres artık belli: a093eaaa=DB,
   e1fb879d ailesi=paket) → W-1.6 tam kanıt.
4) Küçükler: NB1124 kabuk eşleşmesi (kabukta_yok ×22) · W-2.4 dışlama (NB1124 test vakası hazır).
