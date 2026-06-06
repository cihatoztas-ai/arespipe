# son-durum.md — Oturum 163 (2026-06-06)

## Bu oturumda ne yapıldı (tema: YAPISAL EKSİKLER — 162 kararı)
1. **MK-55.1 ihlali tespit + onarım:** açılış sağlık scripti BRIEFING'i 158'de buldu (159-162
   kapanışlarında güncellenmemiş). Onarım kapanış paketine katlandı; BRIEFING artık 163.
2. **W-3.11/B6 HÜKMÜ + PATCH:** tablo yazım yolu SAĞLAM (152 köprüsü `kaydet` içinde duruyor);
   gerçek kapı `_tabloSentezle`'nin `yesil>0` şartı + sentezin TARAYICI metnine koşması (B1'in
   tablo izdüşümü) → 162 "değişiklik yok" semptomu kırık yol olmadan üretilebiliyor. Patch
   (format_tanit 954→984): **D1** toast tablo durumunu ayrıştırır ("yeşil kanıt 0 — YAZILMAZ" /
   "kayıtlıyla AYNI" / "AI oku") · **D2** `_tabloYeniMt()`+`_tabloDegistiMi()` tek kaynak →
   tamamlaAc JSON önizlemesi = kaydet yazımı (162'nin "modal gösterdi ama yazılmadı" yanılgısının
   kökü buydu) · **D3** `_patchedKural`'a W-3.9 kapısı (türetilen alan elle dirty + başka alan
   dirty → çöp regex patch'e SIZIYORDU; 153/2358'in açık kapısı kapandı). 13/13 mekanik test.
3. **MK-152.3 DENETİMİ → HAYALET BORÇ:** K1/K2 kompozisyon SQL'i: kuyrukta **bekliyor=0**
   ("100+ stuck" 152 tarihliydi; 153-154 zaten çözmüş: W-1.1 client-loop kararı + W-1.4 tahliye
   + W-2.7 UI yüzü). Tek kalıntı: 19 May excel `hata` = "Donatım Kontrol Formu.xlsx" (BOM değil,
   parser'ın fail demesi DOĞRU) → iz notuyla `iptal`.
4. **MK-117 YENİDEN-DENETİM → 153/155 kapanışı TEYİT:** null'lu doküman 2 (23 May, ikisi de
   final), bağlı bitmemiş iş 0; wizard'lar `yukleyen_id:userId` yazıyor; client-loop `||uid`
   bağışık. Satır-306 kontrolü emekli server yolunda doğru bekçi olarak KALIR (sistem-kullanıcı
   icat edilmedi).
5. **W-3.12 KAPANDI — B7 bitti:** kopyada whitelist'e ek **format_template dalı da eksikti**
   (yeni bulgu). Çekirdek `ares-alan-cikar.js`'e (kök, IIFE, ares-tablo-sentez deseni) taşındı;
   l2-parser ince delege (yan-etki import zaten desendi: ares-asme/olcu; export imzaları AYNEN —
   izometri-oku dinamik import'u etkilenmez); format_tanit kopyaları `const` delegeye indi
   (3 çağrı noktası dokunulmadan). Kanıt: git-HEAD eski gövde == çekirdek 13/13 vaka +
   l2-parser canlı delegasyon testi. **F1 taraması:** 6 format / 27 alan kuralında fallback /
   whitelist / format_template kullanımı **SIFIR** → B4 sessiz-fallback bugün TEORİK; görünürlük
   ihtiyacı doğarsa artık TEK yerden eklenir.
6. **B3 ad/kod düzeltmeleri (3 format):** a093eaaa → ad "Tersan Cadmatic Spool — Öğretim
   (çok-notasyon)", kod `tersan_cadmatic_spool_ogretim_v1` ("nps" düştü: format hem NPS+Sch hem
   ODxet satırına hizmet ediyor; yeni kod AILE_KAYIT anahtarlarıyla ÇAKIŞMIYOR — MK-119.2
   güvenli; pipeline_no kuralı doğrulama SELECT'iyle DOKUNULMAMIŞ teyitli). e1fb879d →
   "Tersan Cadmatic İmalat (Spool) — Katalog" · 39a2c81b → "Tersan Cadmatic Montaj — Katalog"
   (yalnız ad; kodlar katalog anahtarı, dokunulmadı). **B5 kökü görünür:** a093eaaa ile e1fb879d
   AYNI yapısal aile — spool PDF'inde hem "Malzeme Listesi" (e1fb879d parmağı) hem "Cut &
   Bending Info" (a093eaaa parmağı) var; ayrım ŞABLON değil KAYNAK (katalog-paket vs DB-öğretim).
7. **Onay birikimi temizliği:** O1/O2 dağılımı → 428 bekleyenin 281'i 22 May test kalıntısı
   (P26-039: 141 · P26-149: 86+54) → Cihat kararıyla toplu `iptal` (dry-run 281 ✓ → UPDATE →
   doğrulama 0 ✓). 5-6 Haz taze kuşağı (P26-215/216/217 + UUID'li devreler) DOKUNULMADI.
8. **G2a sinyal hattı v1 (MK-162.2 yakın işi):** migration 102 `g2a_duzeltme_sinyali` görünümü
   (alan+seviye+değer yönünde 3+ birikim; `security_invoker=true` ZORUNLU — yoksa view RLS'i
   bypass ederdi; format bağı bilinçli v2'ye: taslak_duzeltmeleri format taşımıyor) + uyarilar
   `g2aSinyalYukle()` 📐 "Format Kuralı Şüphesi" kutusu (bindirme deseninin izinde, idempotent)
   + serbest onarım: `malzeme` kategorisinin eksik etiketi eklendi (ekran ham anahtar basıyordu).
9. **OPR (f):** mekanik kanıt tamam (ares-kabuk 261-274: kalem_idx≥bom.length → kod='OPR');
   canlı tur Cihat'a devredildi (ekran erişimi yoktu) — reçete CLAUDE-SONRAKI'da.

## Bulgular (163)
- **MK-163.1 dersi:** devir dosyalarındaki borç kalemleri taşınırken TAZELENMİYOR — MK-117 ve
  MK-152.3 birer hayalet borçtu. Açılış teyitlerine "borç hâlâ borç mu" SQL denetimi girer.
- **parse_durumu BAYAT (MK-163.6 borcu):** `devre_dokumanlari.parse_durumu` 1611 'bekliyor' ama
  kuyrukta 0 — insert'te yazılıyor, yalnız terfi yolu (ares-kabuk:307) güncelliyor. UI zaten
  kuyruk gerçeğini çekiyor (devre_detay:2635, 102. oturum fix'i) → canlı bug DEĞİL; kolon ya
  emekli edilir ya trigger'lanır (kuyruk durumları kolon CHECK kümesine 1:1 oturmuyor — tahminle
  backfill YAPILMADI).
- `devreler.ad` bu veride NULL — kimlik `is_emri_no`; sorgular `COALESCE(ad,is_emri_no,id8)`.
- Sentez kanıt makamı tablo hattında da TARAYICI metni (CANON_ALL) — MK-162.3'ün izdüşümü;
  atölyede drenaj kanıtı bunu telafi ediyor, UI hizalaması C yolunda.

## Commit'ler (163)
| Hash | İçerik |
|---|---|
| (sabah) | fix(163): W-3.11 tablo patch tek kaynak + degisiklik-yok ayristirma D1-D2-D3 (CI'lı) |
| 70bd41f | feat(163): migration 102 g2a duzeltme sinyal gorunumu MK-162.2 (CI'lı) |
| d97e4a6 | feat(163): uyarilar g2a kutusu + malzeme etiketi — **push teyidi: `gp`** |
| (kapanış) | docs(163): BRIEFING onarımı + 8 dosya devir paketi + KARARLAR MK-162/163 [skip ci] |
DB: migration 102 COMMIT ✓ · ad/kod UPDATE×3 (guard'lı+doğrulamalı) · kuyruk iptal 1+281.
Migration dosyası: 102. 12/12 ✓. izometri-oku DOKUNULMADI ✓.

## MK kayıtları (163 — KARARLAR.md'ye İŞLENDİ, kapanış paketinde)
MK-162.1/162.2/162.3 (162'den bekleyen) + MK-163.1 (hayalet borç/devir tazeleme) + MK-163.2
(W-3.11 hükmü, D1-D3) + MK-163.3 (alanCikar tek kaynak) + MK-163.4 (format ad/kod + AILE_KAYIT
yasak kümesi) + MK-163.5 (G2a sinyal hattı v1) + MK-163.6 (parse_durumu bayat kolon borcu).

## 164 ADAYLARI
OPR (f) canlı kanıt (Cihat UI turu + SELECT) · Atölye: Y200 malzeme kaydı + W-3.4 yayılım
(diğer bilgisayar; 163 ek şartı: Güncelle öncesi yeşil sentez kutusu) · taze onay kuşağının
ürün akışıyla eritilmesi (W-2.15 Onay Kuyruğu) · G2a v2 format bağı (parse_sonuc anahtar keşfi)
· parse_durumu kararı (emekli/trigger) · KÜÇÜKLER: EN/AR operatör anahtarları · IZO-KANIT v4 ·
✖ sessiz-kayıp · W-2.20 canlı göz · hhbjşlö 1 excel önerisi · 6 B1124 orijinal ad.
