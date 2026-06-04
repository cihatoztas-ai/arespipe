# son-durum.md — Oturum 151 (2026-06-04)

## Bu oturumda ne yapıldı
1. **Increment 2 — TABLO MOTORU GEMİDE (`593c51b`):** `ares-tablo-sentez.js` (YENİ, UMD, client+Node tek
   kaynak): değer-çapalı satır bulma → span-ikame desen sentezi → satır-bazlı doğrulama (kural çıktısı == AI
   değeri). l2-parser: ares-asme/ares-olcu yan-etki import + `olcuZenginlestir` (boyut ham→olcuParse, MK-111.2)
   + `spoolOlcuTuret` (dominant boru→cap/dn/schedule; et yalnız metin-kaynaklı, asme-türetilen et pdf_yok kalır
   → asmeFallback zinciri). format_tanit: AI-oku sonrası otomatik sentez, 🧮 türetilmiş çipler (cap/et/dn kural
   YAZILMAZ), sentez raporu UI, buildParserKural gerçek satir_tipleri yazar (_toplu_ai_bekliyor kalktı).
2. **3-PDF mekanik test YEŞİL (§4.2.3):** Y100-817-012 (NPS+Sch, sondaki-sıfır ağırlık) + M230-306-SP20
   (ODxet yapışık 60.3x4.53200 doğru kırpıldı; İç Bilezik DN50 → spool.dn NULL = dn sızıntısı yapısal öldü) +
   G400-817-015 (SA/A105, Manşon, kaynak satırı). test-tablo-motoru.mjs repo'da (--dump + kıyas kipleri).
3. **Kenar vakaları (canlıda bulundu, kapatıldı):** kalite lastIndexOf · genSeg ondalık · KALITE_CORE SA/A105
   · tetik aday-doğrulama (ManşonDN40 vakası) · degerSpan bitişik-span + sondaki-sıfır genişleme.
4. **a093eaaa BULAŞMA VAKASI:** oto-tespit eski formatın dosya desenini fingerprint inputuna yazıyor, kip
   dönüşü geri almıyordu → dedup M-ailesi satırını bulup Y100 verisiyle EZDİ. SQL onarımı yapıldı (et_mm ODxet'e
   geri, malzeme_tablosu kaldırıldı, min_malzeme_satir=0 — veri UPDATE, migration DEĞİL). Kod fix `f38749a`:
   `_fpAuto` panzehiri (yeni kipe her dönüşte fingerprint açık PDF'ten) + dedup onayına desen/uyum uyarısı.
   Canlı kanıt: _fpAuto doğru doluyor, _yeniKipeDon sonrası desen ^Y'ye dönüyor (konsoldan doğrulandı).
5. **AI buton/maliyet teyidi (ai_api_log):** buton çalışıyor — tek gerçek L3 (claude-sonnet-4-5, $0.0204,
   06-02); gerisi L2 $0 + cache. Kesinti görünmemesi: Anthropic ön yüklü krediden düşüyor (Console→Credits).
   BULGU: bugünkü Y100-007 okumaları L2'ydi → teaching'de "taze L3 ground-truth" garantisi yok (kuyruk).

## KARAR (Cihat): format tanıtma ERTELENDİ
Yapısal kısım tamam ve kanıtlı; kural tanıtmak veri girişi, kod değil. Batch/wizard'a tetik bağlanınca çok
kişiyle, çok örnekle yapılacak. Bağlamadan önce: **fingerprint içerik-öncelikli olmalı** — Y100/M230 sistem
kodudur, format değildir; dosya-adı deseni kimlik değil yalnız hızlandırıcı sinyal olmalı (Cihat tespiti).

## Commit'ler (151)
| Hash | Mesaj |
|------|-------|
| `593c51b` | feat(151): tablo motoru — deterministik satir_tipleri sentezi + olcuParse spool türetimi |
| `f38749a` | fix(format_tanit): fingerprint bulaşması panzehiri + dedup onayına desen/uyum uyarısı |
CI: 593c51b yeşil (bfddc8b oto-rapor kanıtı); f38749a yeşil teyidi 152 açılışında. DB: migration YOK
(a093eaaa onarımı tek seferlik veri UPDATE). 12/12 fonksiyon ✓. izometri-oku DOKUNULMADI ✓.

## MK kayıtları (KARARLAR.md'ye işlenecek)
- **MK-151.1:** Tablo motoru sözleşmesi — satir_tipleri sentezi ares-tablo-sentez.js'te (UMD tek kaynak,
  client=test). Doğrulama satır-bazlı: runtime tetik sırası + desen + olcuParse, kanıt = kural çıktısı == AI değeri.
- **MK-151.2:** dn/cap/schedule HEP dominant boru satırından türer; asme-türetilmiş et spool'a YAZILMAZ
  (pdf_yok + schedule → asmeFallback doldurur, kaynak etiketi dürüst kalır).
- **MK-151.3:** Yeni kipe her dönüşte fingerprint açık PDF'ten yeniden üretilir (_fpAuto); hidrasyon kalıntısı
  kaydedilemez. Dedup onayı hedefin adı+desenini gösterir, uyumsuzlukta açık uyarı.
- **MK-151.4:** Container kanıtları GERÇEK AI/saha çıktısıyla beslenir — fabrike tanımlar tetik_karisti sınıfı
  hataları gizledi (ManşonDN40 dersi).
- **MK-151.5:** Format adlandırma — ad=kullanıcı etiketi, format_kodu=sistematik (cad+tip+notasyon+sürüm).
  Sistem kodu (Y100/M230) format kimliğine GİRMEZ.

## 152 ANA İŞ: yukleyen_id null borcu (MK-117)
Kullanıcısız yüklenen dosyalar `api/kuyruk-isle-izometri.js:305`'te 'yukleyen_id boş' ile düşüyor → parse yok →
eşleşme yok → izometri/NOT/alıştırma yazılmıyor. Çözüm yönü: dosyalara kullanıcı ata VEYA sistem yüklemeleri
için gate'i gevşet (veri sahipliğine dikkat). Read-before-write: kuyruk-isle:300-320 + dosya kayıt noktaları +
ilgili tablo şemaları.

## Açık kuyruk (öncelik sırası korunarak)
Format tanıtma bağlama paketi (içerik-öncelikli fingerprint → batch+wizard tetik → propagasyon → zorla-L3
teaching) · Windows render bulgusu (glyph onarıldı ✓ ama görüntü bozuk — pilot operatörleri Windows'ta, ayrı
oturum) · kaydet modal UX (kayıtta otomatik kapan+toast) · format_kodu otomatik öneri · pekiştirme bağlama ·
requires_ai dürüstlüğü · bbox normalize · Band-B · dirsek 323.9 · E120 prefix · folder tree.
