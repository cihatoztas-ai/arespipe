# Oturum 131 — Recognition glyph kök sebebi mühürlendi (K4 çözüldü), kod yok (bilinçli)

130'un K4 ikilemi ("Yol 2 format öğret" vs "Yol 1 L3 montaj") gerçek AT110 PDF'leri canlı kodla
çalıştırılarak **kökten çözüldü** — ikisi de değil. Montaj/spool sorunu öğretme değil **tanıma**:
gömülü-değil ArialMT Identity-H + ToUnicode yok → pdf-parse glyph çözemiyor → fingerprint band-B
çapaları kaçırılıyor → skor 1<2 → L3. Fix deterministik tek tabloya (glyph band-B) indi. Kod 132'ye.

## Bağlam

- Açılış: git temiz, HEAD `bbf0626`, CI yeşil (129 Ready). Function 12/12 (kod değişmedi).
- Cihat coffee-break dengesi kurdu: "bağlamın kopmasın, gerektiğinde ben mola veriyorum." Teşhis
  doğal sınırına gelince bilinçli kapatıldı (130'daki "bağlam dolmadan temiz kapan" disiplini).

## Yapılanlar (sırayla)

1. **Devir + doğrulama kapısı:** 4 gerçek PDF geldi (AT110 montaj+imalat, M100 montaj+imalat). İçerik
   ayrımı kesin: `_1.pdf` = montaj (Continue topoloji, Malzeme Listesi YOK), `_S01_1.pdf` = imalat
   (Malzeme Listesi + W1-W5). K4 hedefi (montaj içeriği) doğrulandı.

2. **format-paketleri.js + l2-parser.js okundu:** Tersan iki ailesi de öğretilmiş —
   `tersan_cadmatic_spool` (e1fb879d, 119) + `tersan_cadmatic_montaj` (39a2c81b, 120, 7 PDF/6 gemi).
   `l2-parser` montaj_modu çalışıyor. **130'un "öğret" çerçevesi geçersiz** (öğretilmiş).

3. **Parser canlı test (pdftotext + l2-parser):**
   - Montaj: AT110 montajını kusursuz okudu (pipe_no=AT110-803-2311-P2, spool=S01, yüzey=Galvaniz,
     blok=B1137, sistem, 8 kg — 6/6) — PLAIN metinde. `-layout`'ta S01 satır başında olmadığı için fail.
   - İmalat: başlık okundu (S01, Galvaniz, cap 76.1, et 4.5) ama malzeme satırları boşluklu varyant →
     5/5 ham. (Bu test pdftotext'le; gerçek pipeline pdf-parse — aşağı bak.)

4. **Tanıma testi (gerçek pdf-parse + gerçek fingerprint):** AT110 montaj+imalat ikisi de:
   Producer=Cadmatic (+1), ama `Continue:`/`Malzeme Listesi`/`Cut & Bending Info` pdf-parse metninde
   YOK → skor 1<2 → **TANINMADI → L3.** **Linchpin:** pdfIpucuCikar (634) + parserKuralIle (882)
   ikisi de pdf-parse; `-layout` değil → metin modu değil, decode sorunu.

5. **Glyph mühür:** `pdffonts` → gömülü-değil ArialMT, Identity-H, **uni:no**. pdf-parse ham glyph-ID'yi
   çözemiyor (pdftotext çözüyor). Çöp→doğru eşleme **38 giriş / 0 çatışma** → deterministik:
   - **Band-A (A-Z + 0-9): tekdüze +29.** glyph-onar zaten yapıyor (MK-120.3).
   - **Band-B (a-z + Türkçe): sabit lookup tablosu** (`ç→o å→n í→t á→i ì→u É→e ~→a ä→l Ö→g Ü→h ó→y
     ë→s ã→m î→v ê→r` ...). Aritmetik değil ama birebir tutarlı. glyph-onar YAPMIYOR → **boşluk bu.**

6. **K4 çözümü + fix yönü:** glyph-onar.js'e band-B tablosu (gated, deterministik). Tek değişiklik
   tanıma + montaj + kaymış spool malzeme tablosu (NB1137 borcu) üçünü birden açar. izometri-oku.js'e
   dokunulmaz (MK-49.1 güvenli). ArialMT standart glyph sırası → gömülü-değil ArialMT Identity-H her
   PDF'e genellenir.

## Yeni MK adayları (132'de KARARLAR'a — güncel dosya doğrulanınca)

- **MK-131.1:** Format tanıma (`pdfIpucuCikar`) ve L2 (`parserKuralIle`) ikisi de **pdf-parse**
  kullanır. Fingerprint çapaları pdf-parse'ın çözebildiği karakter sınıfında seçilmeli; aksi halde
  format tanınmaz, sessizce L3'e düşer (maliyet + montaj kaybı).
- **MK-131.2:** Gömülü-değil ArialMT Identity-H + ToUnicode yok = pdf-parse glyph çözmez. Çöp→doğru
  deterministiktir (band-A +29, band-B sabit tablo). Onarım **glyph-onar.js'te** yapılır (gated, temiz
  metinde no-op), izometri-oku.js'e dokunmadan.
- **MK-131.3:** Bir format "öğretilmiş" olması onun **tanındığı** anlamına gelmez. Tanıma (fingerprint)
  ve parse (paket) ayrı katmanlar; biri çalışırken diğeri sessizce başarısız olabilir. Teşhiste ikisi
  ayrı doğrulanmalı (119/120 parse'ı kanıtladı, tanımayı değil).
- **MK-131.4:** Aynı tersane = tek format değil. Temiz vs glyph-kaymış export iki alt-sınıf; biri
  tanınır diğeri düşer. Bulk doğrulaması alt-sınıf dağılımını ölçmeli.

## PARSER-VE-YUKLEME-AKISI.md — Bölüm 7.3 EKLENDİ (131, bu push'ta) + Bölüm 8 K4 mührü

(Aşağıdaki metin doca işlendi; kayıt için burada da duruyor.)

> ### 7.3 Recognition glyph boşluğu — AT110 neden L3'e düştü (oturum 131)
>
> **Kanıt (canlı, gerçek pdf-parse + gerçek fingerprint):** AT110 montaj+imalat PDF'leri tanınmadı
> → L3. Sebep parse değil **tanıma.** `pdffonts`: gömülü-değil **ArialMT, Identity-H, ToUnicode yok**.
> pdf-parse ham glyph-ID'yi çözemez (pdftotext standart Arial sırasıyla çözer). Fingerprint band-B
> çapaları (`Continue:`/`Malzeme Listesi`/`Cut & Bending Info`) kaymış metinde tutmaz → yalnız
> `pdf_uretici_anahtar` (+1) → skor 1 < eşik 2 → L3.
>
> **Linchpin:** Hem `pdfIpucuCikar` (tanıma) hem `parserKuralIle` (L2) **pdf-parse** kullanır
> (satır 634 + 882) — `-layout` değil. Metin modu değil, decode sorunu.
>
> **Deterministik kanıt:** çöp→doğru 38 eşleme / 0 çatışma. Band-A (A-Z+0-9) tekdüze +29 (glyph-onar
> yapar); band-B (a-z+Türkçe) sabit lookup tablosu (glyph-onar yapmaz — boşluk).
>
> **Fix:** glyph-onar.js'e band-B tablosu (gated, no-op clean). Tanıma + montaj + kaymış spool malzeme
> tablosunu birden açar. izometri-oku.js'e dokunulmaz (MK-49.1). Tersan = temiz + kaymış iki alt-sınıf;
> 119/120 temiz gemileri kanıtladı, kaymışları (AT110/NB1137) değil. Bulk dağılımı doğrulayacak.

## Süreç notu

Sağlam, ilerlemeli teşhis oturumu. Tahmin yerine her adımda canlı kanıt (pdftotext, pdf-parse,
pdffonts, deterministik eşleme kanıtı). 130'un iki yanlış çerçevesi düzeltildi (format öğretme yok;
metin modu değil decode). K4 mühürlendi. Cihat'ın bağlam-steward isteği gereği doğal sınırda kapandı —
band-B tablosunun tamamlanması bilinçli olarak 132'ye (over-fit değil, font-seviyesi, tam kapsamla).

---

> 132 açılışında: bu dosya + son-durum + CLAUDE-SONRAKI-OTURUM + PARSER Bölüm 7 + omurga v3.1.
> İlk iş: glyph band-B decode tablosu (glyph-onar.js) + dry-run AT110, sonra bulk.
