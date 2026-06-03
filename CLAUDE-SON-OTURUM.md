# CLAUDE-SON-OTURUM.md — Oturum 150 özeti

## Tek cümle
Format tanıtma AI-öncelikli oldu: AI-oku (Increment 1) gemiye bindi, schedule türetme zinciri uçtan uca döşendi
(MK-49.1'e kanıtlı tek istisna dahil), çap/et/dn soruları "tablo + olcuParse" tasarımına indirgenip Increment 2
tam spec'iyle 151'e devredildi — izometri-oku okundu ama (istisna dışında) değişmedi, 12/12 korundu.

## Kararlar (kilitli)
1. **AI önce okur (Cihat):** "her format tanıtımında bir AI mantıklı; orayı anlat burayı anlat pratik olmaz."
   Elle işaretleme onboarding sınavı değil, AI'ın kırmızı bıraktığının TAMİRİ (B1). Pekiştirme = operatör tetikli
   2. AI (taslak satır + prompt_template üzerinden, izometri-oku değişmeden) — henüz bağlanmadı, kuyrukta.
2. **AI değer bulur, kural yazmaz.** Kural sentezi bizde (cozumle). Ground-truth: kural çıktısı == AI değeri.
   Maliyet tezi: onboarding format başına 1-2 çağrı; üretim $0/tek-L3. %5-10 üretim hacmiyle ölçülür.
3. **Sızıntı kuralı:** AI null + cozumle dolu → mühürleme. (M230 dn vakası: cozumle tüm metinden DN50 yakaladı,
   AI null dedi → yanlış mühür engellendi. AI değeri guard görevi gördü.)
4. **Türetilmiş alan = çevirme, çıkarma değil:** "2\" Sch 10S"tan 60.3'ü regex üretemez. Çevirme TEK merkezde:
   ARES_OLCU.olcuParse (NPS+Sch / ODxet / DN / OD: / tek sayı; MK-111.1 dahili) → ARES_BORU. Format kuralı
   YAZILI olanı ham yakalar ("okurken ham, işlerken normalize" — Cihat). npsToDn('1-1/2')→40 doğrulandı.
5. **Teaching tek soru (Cihat finali):** "malzeme tablosu nerede" — o da AI satır değerleriyle çoğu zaman otomatik.
   cap/et/dn çipleri "türetilmiş ✓" olacak (Increment 2).
6. **MK-49.1 kontrollü istisna (Cihat onayı, A şıkkı):** asmeFallbackDoldur 2 çağrıya schedule paramı. Kanıt
   zinciri: (a) boruOlcuBul guard falsy→varsayılan (simülasyonla gösterildi), (b) l2-parser spool'da schedule
   anahtarı yoktu, (c) L3 şemasında yok → tüm mevcut akışlar undefined → davranış birebir. Ayrı commit, yorumlu.

## Teknik notlar
- **aiOku akışı:** fileInput.files[0] → _fileBase64 (readAsDataURL; loadPdf'e DOKUNULMADI — canlı-kritik) →
  POST /api/izometri-oku {tenant_id, kullanici_id:ARES.oturumAl().id, pdf_base64, dosya_adi, 1, 1} → spoollar[0]
  → _aiSentezle. ARES.oturumAl() public API'de (ares-store.js s.1002).
- **_aiSentezle:** alan başına cozumle(ad,CANON_ALL) × AI kıyas (_esitDeger: sayısal parseFloat, metin trim).
  Yeşil: regex/flag/deger/_dirty/_okudu/tani='auto'. Kırmızı: _okudu=false + _aiDeger ipucu ("AI gördü: X").
  Tablo: _aiSatirlar SAKLANIR (Increment 2 girdisi). renderDots regex'siz kırmızıyı da boyar; _initAlan AI durumlarını sıfırlar.
- **izometri-oku yan etkileri (okundu, s.260-340):** parse sonucu yalnız batchSonucBirlestir ile batch satırına;
  spooller/izometri'ye yazım YOK, yukleyen_id geçmiyor → MK-117 güvenli. + ai_api_log (istenen maliyet izi) + cache.
- **boruOlcuBul iki dal:** helper (ARES_BORU) schedule'ı kullanır; DB fallback dalı schedule-KÖRÜ (limit=1,
  bugün de öyle) — gerekirse boruEtTolerans'taki schedule_kod=eq. filtre deseni eklenir (kuyrukta, ayrı iş).
- **ares-olcu Node-uyumlu** (module.exports; ares-asme require globalThis'e ARES_BORU yazar) → l2-parser
  runtime'da AYNI motoru çağırabilir; client=server tek parser, kopya yok (MK-126.8).

## Süreç dersleri (150)
- **Verilen dosyayı baştan oku:** izometri-oku'nun yan etkilerini Cihat'tan istemeye kalktım, dosya zaten eldeydi.
- **Mekanik kanıt ağdan önce:** AI-oku'nun deterministik çekirdeği node testiyle (M230, 8/9) kanıtlandıktan SONRA
  network yazıldı — canlı ilk denemede çalıştı.
- **İstisna = ayrı commit + kanıt + yorum:** MK-49.1 dokunuşu tek başına, mesajında "no-op kanitli" ibaresiyle.
- **"Değişmedi" = başarı olabilir:** schedule zinciri bilinçli no-op; kural yokken davranış değişseydi sorun olurdu.

## Dosyalar
- format_tanit.html 640→701 (AI-oku, additif) · lib/l2-parser.js 378→379 · api/izometri-oku.js 1419→1422 (istisna)
- docs: FORMAT-TANITMA-TABLO-TASARIM.md (YENİ — 151 tek kaynağı), 148-ILERLEME + URETIM-SPEC 150 bölümleri, 3 devir dosyası.

## Kapanışta durum
AI-oku canlıda 2 PDF'le doğrulandı; schedule zinciri gemide/uykuda; CI yeşil teyidi + M230 regresyonu 151 açılışına;
Increment 2 spec'i eksiksiz yazıldı (tartışma tekrarı yok).
