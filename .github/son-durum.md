# AresPipe — Güncel Durum (son güncelleme: Oturum 106, 21 May 2026)

## Bu oturumda yapılanlar (106)

### 1) L2 parser KANITLANDI — "ölçüler eksik" = cache, parser değil
105'te gelen şüphe (İmalat Excel'inde "1Flanş", Adet=0/2/3, boş DN) kök neden incelendi.
Mevcut kural 3 gerçek PDF'in (M100-317-01-P2 S01/S02/S03) production yoluyla (pdf-parse)
çıkarılan metnine karşı çalıştırıldı: **30 malzeme satırı tertemiz** — flanş DN'leri yakalanıyor
(300/200/65/125), adet=1, "1" sızıntısı yok, NOT karışmıyor. Bozuk Excel = 088-öncesi cache'ti.
Fixture suite 10/10, 088 fix gerçekten çalışıyor.

### 2) NOT yakalama + KISMI alıştırma ipucu (CANLI — commit 3e0055e)
- `lib/l2-parser.js`: spool nesnesine `not_metni` + `alistirma_ipucu` (config-driven, motor jenerik).
- `test/l2-tersan-kural.json`: `alanlar.not_metni` regex (boş notu reddeder) + `alistirma_ipucu_kurali`.
  Anahtar kelime ASCII-güvenli `al.{2}t.rma` (SQL Editor Unicode bozma riski yok).
- `test/l2-tersan-fixtures.json` + `test/l2-tersan-test.mjs`: yeni alan beklentileri + 2 kontrol.
- `migrations/089_tersan_parser_kural_not_alistirma.sql`: jsonb_set ile DB'ye 2 alan (İmalat formatı).
- Lokal test 10/10, dry-run doğrulandı, COMMIT canlı, DB teyitli (guncelleme_at 10:15).
- 3 PDF'in üçünde de alistirma_ipucu=KISMI (S01/S02 "ayarlanarak", S03 "alıştırma").

### 3) Wizard gerçek durumu netleşti (103 sonu)
- 4 adım çalışıyor (Devre Seç → Dosya Yükle → Onay → Yükleme).
- **103-A BİTMİŞ:** BOM Excel oto-parse (`dosya_isleme_kuyrugu parser='excel-generic'` → kuyruk-isle-excel).
- **103-B EKSİK (= MK-49.B):** izometri PDF şu an sadece `'sakla'` (arşivleniyor), parse EDİLMİYOR.
  Bu eksik halka; bizim L2+NOT işimiz tam buraya akacak.

### 4) Wizard yeniden tasarım omurgası yazıldı (docs/MK-WIZARD-DEVRE-YUKLEME.md)
Cihat'ın endişesi: "klasörü at, sistem ayıklasın" sessiz eksik/fazla riski (25 yerine 23 spool).
Tasarım kararı: **otorite kabuktur, PDF değil.** Spool listesi resmi kaynaktan (IFS/şablon) doğar,
PDF'ler ona karşı çetelelenir, sessiz tamamlama yok, mutabakat ekranı zorunlu.

## Mimari kararlar (106)
- **MK-106.1** — L2 parser İmalat'ta zaten çalışıyor; "eksik veri" şikayeti cache kaynaklıydı.
  Parser bug'ı sanmadan önce production yoluyla (pdf-parse) gerçek metne karşı test et.
- **MK-106.2** — NOT yakalama config-driven (kelimeler kuralda, motor jenerik). ASCII-güvenli
  regex (SQL Editor Unicode bozar — MK kuralı).
- **MK-WIZARD.1** — Boş şablon üretimi: K2'de wizard "Boş şablon indir" verir (elle Excel = hata).
- **MK-WIZARD.2** — Eksik PDF ≠ eksik spool: spool kabuktan gelir, PDF sonradan eklenir, silinmez.
- **MK-WIZARD.3** — Kabuk kilidi: onaylanınca değişmez; "26 spool varmış" → bilinçli geri-adım.
- **MK-WIZARD.4** — "Doğrulanmadı" damgası: parse zayıf → sarı bayrak, sistem uydurmaz.
- **MK-WIZARD.5** — Eşleştirme = resim_no + spool_no (içerikten bağımsız, image-PDF'te de çalışır);
  ilişki N:N (`spool_dokumanlari` bağ tablosu).

## Doğrulanmış örnekler (alan haritası)
- **Tersan:** `NB1110-M100-262-302-47-S01` — text-PDF (L2), resim no = pipe gövdesi (dosya adı), 1 PDF=1 spool.
- **PAOR:** `NB1110-Z06 52600-102778-A-S01/S02` — image-PDF (L3/Excel zorunlu), resim no = çizim no, 1 PDF=2 spool.
- Proje: PDF "B1110" ↔ devre "NB1110" → N öneki normalize. (Sadece 2 tersane sağlam kurulur.)

## CI Son Durum
- **Build:** son kod commit `3e0055e` (NOT + 089). `[skip ci]` değil → CI koştu.
  (Cihat teyidi bekleniyor — yeşil olmalı, lokal test 10/10.)
- Önceki kapanış docs commit'leri [skip ci].

## AÇIK BORÇLAR (sıra önemli)
1. **Wizard MK-49.B (izometri routing):** `'sakla'` → `dosya_isleme_kuyrugu (parser='izometri')`
   + yeni worker `/api/kuyruk-isle-izometri` (izometri-oku çağırır, MK-49.1 dokunmaz).
   PAOR→L3, Tersan→L2. **Sonraki oturumun ana hedefi.**
2. **Wizard yeniden tasarım (omurga belgesi):** kaynak seçimi (K1/K2/K3), kabuk, format önizleme,
   mutabakat ekranı, spool_dokumanlari N:N tablosu. Açık sorular: belge Madde 10 (kalan 5-9).
3. **Excel DN sütunu** (izometri-batch incele export — flanş DN parse ediliyor ama gösterilmiyor).
4. **Boru OD→DN türetme** (boru_olculer lookup, MK-49.1 sınırı).
5. **Batch geçmişi sekmesi** (izometri-batch — `izometri_batch_kayitlari` zaten DB'de, surface et).
6. **NOT downstream:** izometri-oku passthrough (MK-49.1 minimal) → wizard→devre→QR ekranı.
7. **Tersan Montaj fingerprint ayrımı** (MK-105.4 — şu an İmalat ile aynı kural).

## Önemli öğrenmeler (106)
- **Şüpheyi production yoluyla test et.** "Parser bozuk" sanılan şey cache'ti; pdf-parse ile
  gerçek metne karşı 30 satır test 5 dakikada gerçeği gösterdi.
- **Regex Unicode/newline tuzakları:** `\s*` newline yutar (NOT regex'i alt satıra atladı → `[ \t]*`);
  `[^\n,]` boşluğa izin verir, geri-izleyip " ," yakalar (→ `[^\s,]`). Ampirik test şart.
- **Otorite kabuktur:** wizard'ın en kritik tasarım ilkesi — devre yüklerken hata = tüm programa güvensizlik.
