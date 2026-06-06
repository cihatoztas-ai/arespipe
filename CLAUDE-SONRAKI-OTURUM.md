# CLAUDE-SONRAKI-OTURUM.md — Oturum 162 açılışı

## Açılış ritüeli
1. `git pull` + `git status` temiz · 2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. Bu dosya + son-durum.md + CLAUDE-SON-OTURUM.md + docs/WIZARD-YOL-HARITASI.md (161 bölümü) +
   docs/FORMAT-TANITMA-ILERLEME.md (161) + docs/FORMAT-YONETIM-MIMARI.md oku
4. Kod okuma: repo raw · 5. Teşhis: VERİ→UI→kod (MK-158.1) · 6. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk)
1. **CI:** son run kırmızıydı — sebep bot ci-son-rapor.json rebase yarışı (kural kontrolü YEŞİL).
   Actions → son run → "Re-run failed jobs" VEYA ilk CI'lı push tazeler. Yeşili gör.
2. **KARARLAR.md:** MK-160.3/4/5 işli ama commit edildi mi? + **MK-161.1..161.5** işlenecek
   (metinler son-durum.md'de hazır) → tek doc commit `[skip ci]`.
3. **Son push:** ares-pdf-tounicode.js MD5 **67bf9263b97e03da204fe1dc38356b2c** repoda mı
   (`md5 ares-pdf-tounicode.js`).
4. **W-2.20 canlı göz:** zayıf spoolda "⚠ Çelişen alanlar" bölümü + et/çap çelişkisi açıldığı için
   bazı "okundu" spool'lar zayıfa düşmüş olabilir — gürültü DEĞİL, görünmeyen gerçek çelişki;
   sayı patlarsa tolerans/etiket konuşulur.

## ANA İŞ — Y200 ST37 SATIR ÖĞRETİMİ KAYDI + W-3.4 YAYILIM (161'de 6/6 hazırlandı, kayıt kaldı)
1. Batch → Y200 işi → **Tanıt** (köprü kanıtlı çalışıyor; glyph temiz). Alanlar 6/6 yeşil;
   **malzeme_tablosu** bölgesi → AI-oku → sentez → cap/et/dn çiplerinin 🧮 ZORUNLU geldiğini ve
   elle işaretlemenin toast'la reddedildiğini GÖR (W-3.9 canlı kanıtı) → **Güncelle** (a093eaaa).
2. **Yayılım (155 reçetesi / MIMARI §5):** kural kaydı sonrası `ai_api_log` hedefli `pdf_sha256`
   NULL (kural değişiminden SONRAKİ aynı-gün L2 sha'ları DAHİL — 155 tuzağı) → kardeş Y200 işleri
   kuyruk reset (.SXX filtresi) → drenaj → KANIT: format=a093eaaa + L2 + $0 + et=SCH'den doğru +
   ham_satir düşmesi yok. SQL'ler oturumda şema-önce yazılır (MK-85.3 — 161 ihlali tekrarlanmaz).
3. Kayıt sonrası `satir_tipi_sayisi` 2→N teyidi + "tersan deneme" AD düzeltmesi (UPDATE ad).

## DİĞER ADAYLAR (Cihat sıralar)
- **OPR kalem-ekleme (f) SQL kanıtı:** + Ekle → terfi → `spool_malzemeleri kod='OPR'` SELECT.
- **otoTespit çapraz doğrulama tasarımı** (161 bulgusu): requires_ai=false dışı formatlar yarışa
  girmiyor → paket-aile PDF'inde ⚠ banner atlanıyor; "eşleşti" güveni üretim formatı teyidi
  olmadan verilmesin (fingerprint skoru / kuyruk gerçeği ile).
- W-2.19 dilim 1 (koordinat envanteri → değere-tıkla zoom) · devre_detay'a modal taşıma (ortak
  modül deseni) · zayıf eşiği/etiket gözden geçirme (et-çap çelişkisi açılınca dağılım değişti mi).

## KÜÇÜKLER (birikti)
- EN/AR dil paketi: dv_onayk_*/dv_tab_onay/dv_taslak_spool_yok + 160-161 modal metinleri (İncele,
  + Ekle, YENİ, sebep etiketleri, Çelişen alanlar, hücre çubuğu, "Bu sayfa boş").
- dosya_isleme_kuyrugu 100+ stuck kayıt (22 Mayıs) tetiksiz — drenaj · hhbjşlö 1 excel önerisi ·
  6 B1124 PDF orijinal adlarla · IZO-KANIT v4 + ad kararı · ✖ sessiz-kayıp doğrulaması ·
  E120-722-1015 kuyruğu komple `iptal` (taslak iptali kalıntısı — gerekirse temizlik kararı).
- B2 kartı format_tanit'te uykuda (bilinçli — bağlam taşıyan köprü şartı).

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-126.8 +
MK-161.4 (tek-satır anchor'a satır-içi yorum YOK) + MK-161.5 (kanıt çıktısı head'le kesilmez) ·
MK-85.3 şema-önce (161'de bir kez ihlal edildi) · MK-158.1 VERİ→UI→kod · MK-160.2 Düzelt=değer ↔
Tanıt=kural · MK-161.1 canlı HTML testi = önce SERT YENİLE · arespipe_kopyala MD5 + yeni dosyaya
git add · pipeline çapası Continue satırından YAZILMAZ (Y110/G200 kanıtı) · test yatağı: g200 +
aw231 + NB1137 chvvnb + NB1137 ykjfytjk — SİLME · a093eaaa = Y-ailesi, e1fb879d = paket ailesi
(öğretim adresleri MIMARI §2).

> 162 açılışı: ritüel → 4 teyit (CI re-run dahil) → Y200 öğretim kaydı + yayılım kanıtı →
> OPR (f) → Cihat sıralamasıyla kalanlar → kapanış.
