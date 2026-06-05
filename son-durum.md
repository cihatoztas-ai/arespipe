# son-durum.md — Oturum 159 (2026-06-05)

## Bu oturumda ne yapıldı
1. **İŞ EMRİ NUMARASI TERFİYE TAŞINDI (ana iş 1, canlı kanıtlı KAPANDI):**
   - **Migration 101** (`migrations/101_is_emri_terfide.sql`): `devreler.is_emri_no` DROP NOT NULL +
     `devreler_is_emri_terfi_check` (durum='taslak' OR is_emri_no IS NOT NULL). Dry-run ihlal=0 →
     COMMIT; `is_nullable=YES` SELECT teyitli. Ön-kontrol: aktif 131 / taslak 24 / durduruldu 1,
     numarasız 0; `not_empty` CHECK NULL'u geçirir (çakışma yok); `sonraki_no` RPC atomik
     (UPDATE…RETURNING satır kilidi) — terfiye taşıma yarış-güvenli.
   - **Wizard taslak INSERT:** `sonrakiNo('is_emri')` çağrısı kalktı, `is_emri_no: null`.
   - **onayEt terfi:** mevcut numara SELECT (eski dönem taslakları numarasını KORUR, ekstra yakım
     yok) → boşsa RPC üret → `update({durum:'aktif', is_emri_no}).eq('durum','taslak')` guard'lı;
     0 satır = zaten aktif (console.warn, üretilen yedek numara yanar — nadir, kabul).
   - **KANIT:** taslak açma sayaç 217→217 (yakmadı) · iptal 217 sabit · yeni taslak+terfi 217→218,
     P26-218 = bcmbvö aktif · eski taslak bchmgbcmbn P26-216'sını KORUYARAK terfi, sayaç 218 sabit.
   - **Karar netleşmesi (Cihat):** kural istisnasız — "canlıya çıkan her devre +1, taslakta numara
     yok". Kalan canlı taslakların numarası NULL'lanır (dry-run `sifirlanan=1`; **COMMIT teyidi 160
     açılışında sorulacak**). devre_detay TASLAK_KIP: numarasız taslakta "Terfide üretilecek"
     (`dv_is_emri_terfide`, tr/en/ar üçlüsü eklendi).
2. **PDF NOT OKUMA KANIT TURU (ana iş 2 KAPANDI):** format-bazlı dağılım SQL'i (kolon gerçeği:
   `parser='izometri'`; NOT alanları top-level değil **spool-başına** `parse_sonuc.spoollar[]`;
   format adı `parse_sonuc->>'format'` — ilk şablon `is_tipi` varsayımıyla patladı, MK-126.8
   ihlal itirafı). Sonuç: **Tersan M110 İmalat Resmi 515/555 not_var + 73 alıştırma + 1 KISMI**;
   Montaj/PAOR/format-yok 0 = YAPISAL (kurallarında not_metni alanı tanımsız — "koptu" değil
   "hiç bağlanmadı"; ihtiyaç doğarsa format kuralına alan eklenir, acil değil). **Ekran kanıtı
   (bcmbvö S01):** ALIŞTIRMA: KISMI rozeti + QR personel uyarıları ("ALAŞTIRMA KISMI — bazı
   parçalar sahada" + "Dablin Flange KAYNATILMAYACAK" imalat_not) — 158 küçüğü "KISMI canlı örnek"
   ve "imalat_not UI teyidi" birlikte kapandı.
3. **HİKAYE + PROFESYONEL KIYAS (Cihat istedi):** Spoolgen/Isogen/PCF dünyasıyla karşılaştırma —
   yapısal çelişki YOK, bilinçli ters istikamet (onlarda veri 3D modelden yapısal doğar, bizde PDF
   ham madde). Dört boşluk tartışıldı, Cihat cevaplarıyla kapandı/konumlandı:
   (a) veri kaynağı çoğullaşacak — Rhino/STEP/PCF ileride aynı kabuğa inen alternatif kapılar
   (mimari hazır: yeni kaynak = yeni katman); (b) iş bitiminde **devre bazlı kalite dosyası**
   verilecek (kaynak izlenebilirliğinin bizdeki karşılığı); (c) spec-doğrulama bilinçli kapsam
   dışı; (d) revizyon sütunu VAR, çizimlerin rev numarası tabloya işlenecek.
   **Cihat teşhisi (oturumun pusulası):** en büyük yapısal eksik = zayıf satırların düzenlenmesi +
   format yönetim mantığının doğru kurulması.
4. **SPOOL DÜZELT MODALI ZENGİNLEŞTİRİLDİ (`feat(159)`, 159b):** (a) **📄 PDF'i aç** — İzometri
   bölümünde; `devre_dokumanlari.storage_yolu` tıklama anında çekilir (dokAc-102 lazy deseni) →
   `ARES.dosyaUrlAl(yol,'devre-belgeleri')` → yeni sekme. (b) **Malzemeler (N kalem)** bölümü —
   kabuk BOM kalemleri overlay değerleri + "düzelt" rozetiyle listelenir; ✏️ → mevcut 146/B kalem
   modalı (`kalemDuzeltAc` 3. param `donusIdx`, **"← Spool'a dön"**); köprü anahtarı inceleme =
   kabuk (`pipeline|spoolNo`, 1231 formülü birebir); `_kalemDuzeltmeleriYukle` lazy + modal
   tazeleme. Render'a ve mevcut kalem altyapısına sıfır müdahale. **Canlı görünüm kanıtı** (ekran:
   MALZEMELER 3 KALEM + PDF'i aç, NB1137 M130-817-008-S01); ✏️/dön/PDF **tıklama testleri 160
   açılışına**.
5. **ÇAPA STUB KALDIRILDI (`fix(159)`, 159c):** Cihat kararı — format tanıma AYRI MODÜL olunca
   modal-içi görsel çapa ölü doğdu. "Sol bilgi + sağ izometri + büyüt-oku-yaz + genele yay" ekranı
   = format_tanit anatomisi; wizard'a ikinci PDF görüntüleyici GÖMÜLMEZ (çift bakım). Doğru yol:
   format_tanit'e **DEĞER KİPİ** (B2'nin ürünleşmesi) + `?is_id=` dosya-taşımalı köprü → 160 ana
   işi. (omurga 8/18.d çapa maddesi düştü.)
6. **HAFIZA DÜZELTMESİ (MK-159.3):** 146/B kalem rötuşu uçtan uca TAMMIŞ — wizard UI + upsert +
   `ARES_KABUK.aktar(kalemDuzeltmeler)` overlay dahil. 145 devrindeki "B kalanı" kaydı eskimişti;
   read-before-write yakaladı, gereksiz yeniden-yazım önlendi.

## Bulgular (159)
- Format yönetim mimarisi soruları netleşti (160 tasarım girdisi): tek otorite kim (DB
  parser_kural vs format-paketleri.js, MK-155.1 ikiliği) · öğretilen kural nereye yazılır ·
  aileye nasıl yayılır (W-3.4) · eskiyen kural nasıl emekli edilir · DEĞER düzeltme (B2 →
  taslak_duzeltmeleri) ile KURAL düzeltme (B1 → parser_kural/paket) tek ekranda nasıl ayrışır.
- Montaj/PAOR formatlarında not_metni alanı tanımsız — SAYFA-EKSIKLERI adayı (acil değil).

## Commit'ler (159)
| Commit | Mesaj |
|---|---|
| kod | `feat(159): is emri numarasi terfiye tasindi — ... (migration 101)` |
| kod | `feat(159): spool duzelt modali — PDF'i ac + Malzemeler bolumu (146/B koprusu, Spool'a don)` |
| kod | `fix(159): capa stub kaldirildi ...` (**159c — transfer+commit 160 açılışında teyit**) |
| doc | kapanış dosyaları |
DB: **Migration 101 UYGULANDI** (kalıcılık SELECT teyitli) + taslak NULL temizliği dry-run'lı
(COMMIT teyidi açık). 12/12 ✓. izometri-oku DOKUNULMADI ✓.

## MK kayıtları (KARARLAR.md'ye işlenecek — MK-157.x/158.x ile birlikte birikti)
- **MK-159.1:** İş emri numarası YALNIZ terfide üretilir (`sonraki_no` RPC atomik;
  `eq('durum','taslak')` guard; eski numaralı taslak numarasını korur — geçiş bitti, artık hepsi
  NULL). Taslak/iptal numara yakmaz. Migration 101 + `dv_is_emri_terfide` üç dil.
- **MK-159.2:** Format tanıtma AYRI MODÜLDÜR (izometri batch gibi); görsel okuma (sol bilgi + sağ
  PDF) format_tanit'te yaşar, wizard/batch'ten `?is_id=` dosya-taşımalı köprüyle girilir; modal-içi
  çapa İPTAL. format_tanit'e DEĞER KİPİ (B2: taslak_duzeltmeleri'ne işaretli) + KURAL KİPİ (B1)
  tek ekranda ayrışır; W-3.4 kardeş yayılımı tamamlar.
- **MK-159.3 (süreç):** Devir hafızası eskiyebilir — kod gerçeği > devir kaydı. 146/B "kalan iş"
  sanılan paket uçtan uca tammış; read-before-write çift-yazımı önledi.

## 160 ANA İŞ
**FORMAT YÖNETİM MİMARİSİ** (Cihat 2 no'lu teşhisi): tasarım dokümanı + W-3.1/3.2 köprüleri
(?is_id=) + format_tanit değer kipi + W-3.4 kardeş yayılımı. Tasarım soruları yukarıda (Bulgular).
Küçükler: 159c transfer/commit teyidi · modal tıklama testleri (✏️/dön/PDF + Malzeme sekmesi
regresyonu: köprüsüz kalem modalında "Spool'a dön" GÖRÜNMEMELİ) · taslak NULL COMMIT teyidi ·
KARARLAR.md MK-157/158/159 işleme · EN/AR (dv_tab_onay, dv_onayk_*, dv_taslak_spool_yok) ·
hhbjşlö 1 excel · 6 B1124 PDF orijinal adlarla · IZO-KANIT v4 yapıştır + ad kararı · ✖ sessiz-kayıp
doğrulaması · W-2.18 (önizlemede izometri overlay) sırası geldiğinde.
