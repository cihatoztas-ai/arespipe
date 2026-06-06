# CLAUDE-SON-OTURUM.md — Oturum 163 özeti

## Tek cümle
Plan ve gerçekleşme bu kez ÖRTÜŞTÜ: 162'nin "yapısal eksikler" kararı uygulandı — W-3.11 hükme
bağlanıp üç kusur (D1/D2/D3) yamalandı, W-3.12 ile alanCikar TEK kaynağa indi (B7 bitti, B4
ölçülüp teorikleşti), MK-152.3 ve MK-117'nin 153-155'te zaten kapanmış HAYALET borçlar olduğu
taze SQL'le kanıtlandı, üç formatın ad/kod kimliği yapısala çevrildi (B3, B5'in kökü görünür
oldu), 281 test-kalıntısı onay kaydı iptal edildi ve G2a sinyal hattının v1'i (migration 102 +
uyarilar kutusu) gemiye alındı; OPR (f) canlı kanıtı reçeteyle Cihat'a devredildi.

## Kanıt zinciri (yöntem: her hükümden önce repo-raw kod okuma + canlı SQL — MK-126.8/85.3)
1. **W-3.11:** `kaydet` düzeltme-kipi tablo köprüsü (152) YERİNDE; `_tabloSentezle` yalnız
   `sz.rapor.yesil>0` ise `_satirTipleri` set ediyor ve sentez `CANON_ALL` (tarayıcı/görsel-sıra)
   üzerinde koşuyor → 162 E100 "değişiklik yok" semptomu kırık yol OLMADAN mekanik üretilebilir.
   Bonus kusur: `tamamlaAc` düzelt-kipinde tablo patch'ini JSON'a KOYMUYORDU (önizleme≠yazım) —
   162'nin "modal satir_tipleri gösterdi" izlenimi büyük olasılıkla DB'nin boş listesiydi.
   D3: `_patchedKural` W-3.9 türetilen-alan filtresinden YOKSUNDU (sayan filtre ≠ yazan filtre).
   Patch sonrası 13/13 senaryo (162 semptomu, Y200 hedefi, önizleme==yazım, sızıntı kapısı).
2. **W-3.12:** kopya `_alanCikar`'da whitelist + format_template dalları eksik; `_postProcess`
   bugün eş ama ayrı yaşıyordu. Vercel'in kök-dosya import'unu bundle'ladığı ares-asme/olcu
   emsaliyle kanıtlı → `ares-alan-cikar.js` IIFE çekirdek; l2-parser delege (Python tek-geçiş
   replace assert'i gövdelerin bayt-eş taşındığını ayrıca doğruladı); eşlik 13/13 (git-HEAD
   gövdesi referans) + node'da gerçek l2-parser import edilip delegasyon canlı test edildi.
   F1: 27 kuralda üç özellik de SIFIR kullanım → B4 teorik, tekleştirme tam zamanında ÖNLEM.
3. **Hayalet borçlar:** K1 kompozisyonu (parser×durum) bekliyor=0 gösterdi; K2 boş döndü.
   WIZARD-YOL-HARITASI okuması W-1.1/1.2/1.4 ve W-1.3'ün 153-155 kapanışlarını ortaya çıkardı —
   162 devri eski notlardan sürüklemişti. M117a/b: null'lu 2 doküman final, bağlı bitmemiş iş 0.
   Tek gerçek kalıntı (Donatım Kontrol Formu, BOM-dışı) iz notuyla iptal.
4. **B3/B5:** format haritası SQL'i + `AILE_KAYIT` okuması: yasak küme tam 2 anahtar; a093eaaa
   kodu katalog-dışı → değişim güvenli. Guard'lı UPDATE'ler (id LIKE + eski kod/kod eşitliği) +
   doğrulama SELECT'lerinde `pipeline_kural` değişmemiş teyidi. B5'in kökü: iki format aynı
   spool PDF'inin İKİ ayrı başlığına parmak basıyor; ayrım KAYNAK (MK-119.2 ikiliği).
5. **Onay temizliği:** O2 (COALESCE kimlikli) iki kuşağı ayırdı; dry-run 281 → UPDATE →
   doğrulama 0. Veri silinmedi, `iptal`+iz notu (ilke).
6. **G2a v1:** migration 102 — `security_invoker=true` bilinçli ve ZORUNLU (Postgres view'ları
   sahip yetkisiyle koşar; onsuz taslak_duzeltmeleri RLS'i bypass = çok-tenant sızıntı). Eşik 3+
   (MK-162.2). uyarilar entegrasyonu bindirme yükleyicisinin birebir deseni; self-test 4/4,
   tam koşu 0 hata/102 uyarı (baseline).

## Süreç dersleri (163)
- **MK-163.1:** "Eski borç kaydı ≠ hâlâ borç" (MK-159 dersinin devir-dosyası ikizi) — borç
  kalemi taşınmadan önce tek SQL'lik tazeleme. 163'ün en ucuz, en değerli çıktısı.
- D2 sınıfı kusur ("önizleme ≠ yazım") ile MK-85.3 aynı ailedendir: gösterilen şey ile yazılan
  şeyin AYNI koddan üretilmesi şart — `_tabloYeniMt` tek kaynağı bunun için.
- `gp` yapıştırma kazası: iki komut bloğu birleşince `gparespipe_kopyala` oldu, commit lokalde
  kaldı — kapanışta "push teyidi" maddesi olarak işaretlendi. Komut blokları TEK TEK yapıştır.
- Cihat 162-tipi sapmaya izin vermedi ("oturum çok taze, devam") — A-B-C-D sıralı net ajanda
  ile 6 başlık tek oturumda kapandı; ağır iş öne ilkesi yine doğrulandı.

## Dosyalar/commit'ler (163)
format_tanit.html (954→984, W-3.11 D1-D3) · **ares-alan-cikar.js (YENİ, 78)** · lib/l2-parser.js
(421→407, delege) · uyarilar.html (624→674, G2a kutusu; `d97e4a6` push teyidi) · migrations/
102_g2a_duzeltme_sinyali.sql (YENİ, 50; `70bd41f`). DB: migration 102 COMMIT · 3 format ad/kod ·
282 kuyruk iptal. Doc paketi: BRIEFING (158→163 onarımı) + üçlü + 4 yol-haritası 163 bölümleri +
ATOLYE-162 163-sonuç eki + KARARLAR MK-162.1..3 ve MK-163.1..6. 12/12 ✓ · izometri-oku ✓.
