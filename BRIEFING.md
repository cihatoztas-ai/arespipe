# AresPipe BRIEFING — 156. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.
> İlerleme aynası: docs/WIZARD-YOL-HARITASI.md (156 işaretleri işlendi). Format: docs/
> FORMAT-TANITMA-ILERLEME.md 156 bölümü + docs/IZO-KANIT-SETI (v4 ekli, 37 PDF / 5 gemi).

## HEAD
- `df11ac1` feat(156): Önizle butonu. Kapanış doc commit'i üstte.
- **DB:** migration YOK. Endpoint YOK (12/12). Veri: 671 kuyruk işi iptal (test temizliği),
  havuz 998→327 (g200 141+55 · 265-overboard 141 · hhbjşlö/NB1124 45 — TEST YATAĞI, SİLME).

## 156 — yapılanlar
1. **Onay havuzu tasarımı BAĞLANDI (kod yok):** yer = devre_detay "Onay Kuyruğu" sekmesi +
   devreler.html rozet (KANIT: yükün tamamı AKTİF devrelerde — MK-156.2; İşlenenler taslak yüzü).
   Tek liste iki davranış: oneri_hazir yeşil/TOPLU, manuel_onay amber/TEKİL (içerik:
   parse_sonuc.spoollar[].uyarilar — kod+mesaj+agirlik, hazır JSONB), atanmamis="eşleştir".
   Toplu onay yalnız oneri_hazir + devre kapsamı; kritik uyarılı satır girmez.
2. **İşlenenler→Önizle GEMİDE (canlı kanıtlı):** 👁 buton → devre_detay?id=X&taslak=1 YENİ SEKMEDE
   (drenaj loop'u ölmesin). W-2.11 köprü olarak kapandı.
3. **NB1124 teşhisi MÜHÜRLENDİ:** kabuk SAĞLAM (66 satır → 22 temiz anahtar). Kırık = PDF KİMLİĞİ:
   37/44 pipeline NULL. 22 dosya tablosuz çizim (W-2.4 vakası, L3 israfı); e1fb879d'de 20/22
   `10Ax6A 1(2).S01.1.pdf` kalıbı kimlik çıkarımı dışı. SATIR DEĞİL KİMLİK SORUNU.
4. **v4 kanıt eki (B1124, 5. gemi):** Flanş Dablin ⚠ · Tee metrik ? (matriste hiç yoktu!) ·
   kaynak "- Saha" · Lama/Detay A/çift-et/4-segment ek kanıtlar · Continue+sayfa eki ·
   "gemi başına tek adlandırma" varsayımı ÖLDÜ (zone'lu+zone'suz aynı gemide).

## ⚠ KRİTİK BULGULAR — MK-156.1 / 156.3
**MK-156.1:** Taslak önizleme YAPISAL BOŞ GÖVDE gösterir — devre_detay spooller'dan render eder,
taslak spooller'a yazmaz (MK-127.4, spooller=0 kanıtlı). B-4 W-2.14'e devretti (önizleme taslak
veri katmanını okumalı — 157 tasarım).
**MK-156.3:** Format kapsaması ÜÇ katman: KİMLİK + SATIR + BELGE SINIFI (dışlama). 31-PDF belgesi
yalnız satıra bakıyordu; Madde 0 (pipeline kimlik çıkarımı) iş paketinin başına eklendi.

## 157 ANA İŞ
1) **Format Tur 1 (öneri: bununla başla):** kimlik çıkarımı read-before-write (NEREDE? — MK-155.1
   farklı mekanizmaydı, adres doğrulanmadan patch yok) → Madde 0 kalıpları + flange_en + W-2.4
   dışlama kararı + Tee grep → cache düşür (deploy SONRASI dahil) → hhbjşlö reset → KANIT:
   kabukta_yok 22→0.
2) Onay Kuyruğu: "onayla" tüketicisi var mı (read-before-write) → sekme implementasyonu (157-158).
3) W-2.14 tasarımı. 4) Küçükler: parse_durumu senkron teyidi · v4 yapıştır · 6 B1124 PDF'ini
ORİJİNAL adla yükle (Downloads "(1)" eki, MK-52.1) · ✖ sessiz-kayıp doğrulaması.

## NEREDEYIZ — ÖZET
Faz 2 akış omurgası + önizleme köprüsü tamam; sıradaki büyük UI = Onay Kuyruğu (tasarımı bağlı,
verisi temiz, test yatağı hazır). Format hattında üç-katman modeli oturdu; NB1124 ilk tam kimlik
vakası olarak Tur 1'in kanıt sahası. Onay havuzu 327 gerçek işe indi. Repo raw kod okuma yöntemi
156'da doğdu — MK-126.8 artık ucuz.
