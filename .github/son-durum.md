# son-durum.md — Oturum 161 (2026-06-06)

## Bu oturumda ne yapıldı
1. **AÇILIŞ TEYİTLERİ:** 160 son paketi (840eabc1) + vendor (31e9848e) zaten pushluymuş ✓ ·
   deploy MD5 = lokal ✓ vendor 200 ✓ · KARARLAR MK-160.3/4/5 heredoc'la işlendi (commit kapanışta).
2. **Excel kipi vakası KAPANDI (3 kök):** (a) ilk "PDF açılamadı" = tarayıcı CACHE'i (eski HTML —
   deploy doğruydu); (b) gerçek hata "Excel açılamadı: undefined.indexOf" = IFS'in BOŞ İLK SAYFASI
   (`!ref` yok) → dolu sayfaya oto-kayma + "Bu sayfa boş" + sheet_to_html lokal try; (c) scroll
   çalışmıyor + sol form scrollbar kaybı = grid/flex `min-height:auto` zinciri → `.dp-split>*` +
   `.dpv-wrap` min-height:0 (160'ın "yüksek zoom scrollbar" raporu da aynı kök). + Excel UX: hücre
   seç → oklarla gez (Enter=aşağı), üstte hücre çubuğu (adres + TAM içerik), td max-width 280px +
   çift tık kolon genişlet/daralt, user-select serbest.
3. **kg/mm TEK ONDALIK standardı:** `f1()` (tr-TR, min/max 1) — 10 gösterim noktası bağlandı
   (tablo kg · kıyas popup mm/kg · kalem boy/ağırlık · BOM miktar · modal kalem satırları · YENİ
   kalem özeti · çelişki bölümü ağırlık). et/çap BİLEREK ham (spec değeri, 3.05 bilgi taşır).
4. **W-2.20 KAPANDI:** "⚠ Çelişen alanlar" modalda — `Et: Kabuk(Excel) 4.5 ↔ PDF 3.05 · kabuk
   korunur` + kaynak dosya adı. K2 enjeksiyon deseni (lib SAF): izometrileriDerle anahtarına
   `bindirme_celiski` → handler haritayla `s.bindirme_celiski`/`s.bindirme_dosya`. **KÖK BULGU:**
   kabukBindirHedef'in "client cap/et göndermiyor" notu BAYATTI (MK-159.3 #3) — null'lanıyordu;
   düzeltildi → et/çap çelişkisi önizlemede İLK KEZ tespit ediliyor (okundu→zayıf düşüşleri gürültü
   değil). Mekanik: test-w220.mjs 6/6 (repoda) + test-isid.mjs 6/6 regresyonsuz.
5. **W-3.9 PANZEHİRİ GEMİDE (Y200 ön şartı):** `_turetZorunlu()` altı kapı — hydrate çöp regex'i
   yüklemez · _alanlariKos koşmaz · markDirty elle dönüşü keser · iki patch yolu yazmaz · çip
   metni uyarlanır. 153 "2358" vakası kod seviyesinde kapalı.
6. **GLYPH CANVAS ÇÖZÜLDÜ (oturumun ağır işi, canlı kanıtlı "glyph: temiz ✓"):** kök neden =
   Cadmatic'in GEÇERSİZ `/ToUnicode /Identity-H` satırı (isim; CMap stream ref değil; ArialMT
   gömülü değil, pdffonts uni=no) — pdf.js glyph→unicode kuramayıp çorba basıyor; Acrobat/Chrome
   sistem Arial'ıyla maskeliyor. Çare: **ares-pdf-tounicode.js** (YENİ, 178 satır) — bellekte
   ARTIMLI identity-ToUnicode (0x20-0x17F); İKİ taban: klasik xref (E120) + **XRef stream**
   (Y200, /W[1 4 2] sıkıştırmasız ek); ObjStm engel değil (son sürüm kazanır). Kapılı: gerçek
   ToUnicode'lu dosyaya DOKUNMAZ; idempotent; storage'a YAZILMAZ (salt görüntü/metin). Kanıt:
   pdf.js 1.10 mekanik 5/5+5/5 çapa + poppler çapraz. Entegrasyon: wizard dpvSec (fetch→onar→
   getDocument({data})) + format_tanit loadPdf.
7. **Köprü + adres SAHA TEYİDİ:** batch Tanıt → `?is=&kaynak=batch` canlı (RLS sorunsuz); E120'de
   otoTespit "tersan deneme"ye eşleşti → MK-158.1 freni → DB teyidi: E120/M ailesi üretimde
   **e1fb879d (paket)**, a093eaaa = **Y-ailesinin DB formatı** (`(Y\d+...)` regex'i DOĞRU, dar
   değil) → yanlış kayda öğretim ÖNLENDİ. Y200'de 6/6 yeşil; satır öğretimi kaydı 162'ye.
8. **MK-85.3 ihlali (Claude, kabul):** `is_kuyrugu.parse_sonuc` kolonu şemadan doğrulanmadan
   yazıldı → hata; şema-önce ile düzeltildi (is_kuyrugu sonuçları ai_api_log'da; format_id/
   parser_seviye DOĞRUDAN KOLON).

## Bulgular (161)
- **otoTespit açığı (W-2.4/K2 belirtisi):** yalnız requires_ai=false tarar → paket-aile PDF'inde
  tek DB formatına "eşleşti ✓" der, MK-155.1 ⚠ banner HİÇ tetiklenmez — yanlış adrese yazım bir
  tık mesafede. Çapraz doğrulama tasarımı açık.
- Y200 Continue satırları FARKLI pipeline'a işaret edebiliyor (Y110-804-414/S02, G200-804-414) —
  pipeline çapası Continue'dan yazılmaz.
- E120-722-1015 ailesi kuyruğu komple `iptal` durumda (taslak iptali kalıntısı, bilgi).
- "tersan deneme" ADI yanıltıcı (üretim Y-formatı) — ad düzeltmesi ucuz kapanış işi.

## Commit'ler (161)
| Hash | İçerik |
|---|---|
| 78bddb3 | feat(161) W-2.20 (wizard UI + api/devre-inceleme + test-w220.mjs) + excel kipi paketi (guard/scroll/gezinme) + f1 |
| 73a3ee3 | feat(161) glyph paketi: ares-pdf-tounicode.js (YENİ) + wizard/format_tanit entegrasyon + W-3.9 panzehiri |
| (push) | fix(161) pdf-tounicode XRef-stream tabanlar (Y200) — son MD5 67bf9263b97e03da204fe1dc38356b2c |
DB değişikliği YOK (migration yok, veri UPDATE yok). 12/12 ✓. izometri-oku DOKUNULMADI ✓.

## ⚠ CI DURUMU — kırmızı ama KURAL İHLALİ DEĞİL
"Kural Kontrolü" adımı YEŞİL geçti; düşen adım bot'un ci-son-rapor.json commit'i — bizim ardışık
push'larımızla yarışıp rebase ÇAKIŞMASI yedi (deneme 1/5, manuel müdahale hatası). Çözüm: Actions
sayfasından son run'a "Re-run failed jobs" (yarış bitti, temiz geçer) VEYA bir sonraki CI'lı push
kendiliğinden tazeler. 162 açılış teyidi #1.

## MK kayıtları (161 — KARARLAR'a işlenecek, metinler hazır)
- **MK-161.1 [DISIPLIN]:** Canlı HTML testinde İLK adım sert yenile (Cmd+Shift+R) — deploy doğru,
  tarayıcı bayattı; aynı oturumda ÜÇ kez yarım saatlik sahte iz bıraktı.
- **MK-161.2 [MIMARI]:** pdf-tounicode katmanı — görüntü onarımı (canvas) ≠ çıkarım onarımı
  (glyph-onar); bellekte, kapılı, idempotent, storage'a yazmaz.
- **MK-161.3 [URUN]:** kg/mm gösterimi her yerde tek ondalık (f1, tr-TR); et/çap ham kalır.
- **MK-161.4 [DISIPLIN]:** Tek-satır anchor'a satır-İÇİ `//` yorum eklenmez (satırın devamını
  yorumlar, parantez dengesi patlar — W-3.9 yamasında yaşandı); blok yorum `/* */` öne konur.
- **MK-161.5 [DISIPLIN]:** Kanıt çıktısı `head` ile kesilmez — E120'de poppler "çorba" sanıldı,
  ilk 8 satır rakamdı; tam çıktı kontrol grubunu değiştirdi.

## 162 ANA ADAYLAR (Cihat sıralar)
CI re-run + KARARLAR commit teyidi → **Y200 ST37 satır öğretimi KAYDI + W-3.4 yayılım** (sha
düşür → kardeş reset → L2/$0 kanıt) → OPR kalem-ekleme (f) SQL kanıtı → otoTespit çapraz doğrulama
tasarımı → devre_detay'a modal taşıma.
