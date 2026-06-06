# CLAUDE-SONRAKI-OTURUM.md — Oturum 164 açılışı

## Açılış ritüeli
1. `git pull` + `./scripts/oturum-saglik.sh 164` (BRIEFING artık 163 — TEMİZ geçmeli)
2. `ls api/*.js | wc -l` = 12 (MK-129.3)
3. Bu dosya + .github/son-durum.md + CLAUDE-SON-OTURUM.md oku; gerekirse
   docs/FORMAT-OGRETIM-ATOLYE-162.md (163 sonuç ekiyle) + WIZARD-YOL-HARITASI (163 bölümü)
4. Kod okuma: repo raw · 5. Teşhis: VERİ→UI→kod (MK-158.1) · 6. Ajanda onayı (Cihat sıralar)

## AÇILIŞ TEYİTLERİ (5 dk)
1. **CI + push:** `d97e4a6` (uyarilar G2a kutusu) push'landı mı — 163'te `gp` yapıştırma
   kazasıyla yarım kalmıştı; `git log origin/main -1` ile teyit. Kapanış doc commit'i + bot
   raporu yeşil mi.
2. **MK-163.1 uygulaması (yeni standart):** ajandadaki her DEVİR borcu için 1 tazeleme SQL'i —
   "borç hâlâ borç mu?" (163'te MK-117 ve MK-152.3 hayalet çıktı; tekrarı olmasın).
3. **G2a canlı göz:** uyarilar.html SERT YENİLE (MK-161.1) → konsolda `g2a cekme hatasi` YOK;
   3+ birikim yoksa kutu görünmez (NORMAL).
4. **OPR (f):** Cihat ayrı yaptıysa kanıt SELECT çıktısı; yapmadıysa 164 küçük işi.

## 164 ADAYLARI (Cihat sıralar)
1. **OPR (f) canlı kanıt (5 dk, Cihat UI + 1 SELECT):** taslak devre önizleme → spool modal →
   Malzemeler → + Ekle ("OPR test") → terfi → `SELECT * FROM spool_malzemeleri WHERE kod='OPR'
   ORDER BY 1 DESC LIMIT 5;` — satır görünürse borç kapanır (mekanik taraf ares-kabuk:261-274
   kanıtlı).
2. **ATÖLYE HATTI (Cihat tetikler, diğer bilgisayar):** Y200 malzeme tablosu kaydı — reçete
   ATOLYE-162.md + **163 EK ŞARTI: Güncelle'den önce tablo adımında "🧮 N satır tipi sentezlendi
   · X yeşil" kutusu GÖRÜLMEDEN Güncelle'ye basılmaz** (yeşil=0 ise yeni D1 toast'ı zaten
   "tablo YAZILMAZ" diyecek). Sonra yayılım: hedefli pdf_sha256 NULL (155 tuzağı) → kardeş
   reset (.SXX) → drenaj → kanıt JOIN (`is_kuyrugu k LEFT JOIN ai_api_log l ON
   l.id=k.ai_api_log_id`: format_id=a093eaaa + parser_seviye=l2 + maliyet_usd=0).
   Format ÇEŞİTLİLİĞİ (zip atölyesi) bundan sonra.
3. **Taze onay kuşağı (ürün akışı):** ~147 oneri_hazir/manuel_onay (P26-215/216/217 + UUID'li
   devreler, 5-6 Haz) — W-2.15 Onay Kuyruğu sekmesinden eritme turu; takılan yer = ürün bulgusu.
4. **G2a v2 format bağı (keşif → karar):** `SELECT DISTINCT jsonb_object_keys(parse_sonuc)
   FROM dosya_isleme_kuyrugu WHERE parse_sonuc IS NOT NULL;` — format_id/format_kodu varsa
   görünüm parse_sonuc'tan zenginleşir; yoksa düzeltme kaydına format_id kolonu tasarlanır.
5. **parse_durumu kararı (MK-163.6):** kolon emekli mi (yorum + okuyan kalmadığının grep
   kanıtı) trigger mı? Kuyruk durumları CHECK kümesine 1:1 oturmuyor — tahmin backfill YOK.
6. **KÜÇÜKLER:** EN/AR operatör anahtarları (wizard/devre_detay; format_tanit DÜŞTÜ) ·
   IZO-KANIT v4 yapıştırma + AD kararı · ✖ sessiz-kayıp doğrulaması · W-2.20 canlı göz
   (okundu→zayıf dağılımı; 161 et/çap fix'i sonrası) · hhbjşlö 1 excel önerisi ·
   6 B1124 PDF orijinal adlarla (MK-52.1) · K-2 (W-3.3 L3 anahtarı varsayılanı) AÇIK.

## Hatırlatmalar
MK-49.1 izometri-oku DOKUNMA · MK-129.3 12/12 · MK-134.1 kod commit [skip ci]siz · MK-85.3
şema-önce İSTİSNASIZ · MK-158.1 VERİ→UI→kod · MK-161.1 sert yenile · **MK-162.3 kanıt makamı
SUNUCU METNİ — 163 eki: tablo SENTEZİ de tarayıcı metninde koşar (CANON_ALL), tablo öğretiminin
nihai kanıtı da drenaj SQL'idir** · MK-163.1 devir borcu tazelenir · `_tabloYeniMt/_tabloDegistiMi`
tek kaynak — kaydet/tamamlaAc tablo işi BURADAN, kopya açma · **ARES_ALAN_CIKAR tek kaynak** —
alanCikar/postProcess gövdesi bir daha HİÇBİR yere kopyalanmaz (l2-parser+format_tanit delege) ·
a093eaaa = "Tersan Cadmatic Spool — Öğretim", kod `tersan_cadmatic_spool_ogretim_v1` ("tersan
deneme"/"nps_v1" ARTIK YOK — eski adla arama yapma) · format_kodu YASAK kümesi = AILE_KAYIT
anahtarları (`tersan_cadmatic_spool`, `tersan_cadmatic_montaj`) — eşitlenirse DB kuralı yerine
paket koşar (MK-119.2) · `devreler.ad` NULL olabilir → COALESCE(ad,is_emri_no) · g2a görünümü
`security_invoker=true` — view'a dokunan bunu KORUR · komut blokları terminale TEK TEK
yapıştırılır (`gp` kazası) · test yatakları: g200 + aw231 + NB1137 chvvnb + ykjfytjk — SİLME ·
şema: format_id/parser_seviye/maliyet/pdf_sha256 → ai_api_log; is_kuyrugu → ai_api_log_id JOIN ·
dosya_isleme_kuyrugu'nda ai_api_log bağı YOK (parse_sonuc JSONB var).

> 164 açılışı: ritüel → 4 teyit → Cihat sıralamasıyla adaylar (öneri: OPR → atölye/Y200 →
> taze onay turu → G2a v2 keşfi → parse_durumu → küçükler) → kapanış (BRIEFING dahil — MK-55.1).
