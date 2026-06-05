# FORMAT YÖNETİM MİMARİSİ — karar tablosu (oturum 160)

> 159 Cihat teşhisinin ("altyapı olarak tanımlanan formatların yönetim mantığını doğru kurabilirsek
> oldu bu iş") cevabı. Kaynak dersler: MK-155.1 (ikili otorite), MK-156.3 (üç katman),
> MK-157 (kimlik adresleri), MK-159.2 (ürün kimliği + kip ayrımı). Bu doküman "neyi nereye
> yazdığımızın" tek sayfası — format_tanit ürünleşmesi ve öğretim turları buradan okunur.

---

## 1. KAPSAMA MODELİ — dört katman (MK-156.3 + değer katmanı)

Bir PDF'in doğru işlenmesi DÖRT ayrı katmanın sağlam olmasına bağlıdır; her biri AYRI kırılır,
AYRI adreste yaşar, AYRI mekanizmayla düzeltilir:

| Katman | Soru | Kırıldığında belirti |
|---|---|---|
| **K1 — BELGE SINIFI** | Bu dosya işlenmeli mi? | Tablosuz çizim/iso_view L3'e gidip para yakar, manuel_onay şişer |
| **K2 — KİMLİK** | Hangi format? Hangi spool? | Yanlış format kuralı koşar / kabukta_yok / pipeline_kok_cikarilamadi |
| **K3 — SATIR/ALAN** | Alanlar ve malzeme satırları nasıl okunur? | Zayıf parse, boş alanlar, ham_satir düşmeleri, L3 fallback |
| **K4 — DEĞER** | Okunan değer bu tesiste ne ANLAMA gelir? | Doğru okuma, yanlış anlam (Paslanmaz→Asit vakası) |

**format_tanit YALNIZ K3'ü öğretir** (MK-156.3). K1/K2 sorunları format öğretimiyle ÇÖZÜLMEZ;
UI bu sınırı kullanıcıya söylemeli ("tanıttım ama hâlâ kabukta_yok" → kimlik/eşleşme yönlendirmesi,
zemini devre_detay Onay Kuyruğu atanmamışlı grubu, 158).

## 2. ÖĞRETİM ADRESİ TABLOSU — katman × hedef (bu dokümanın çekirdeği)

| Katman | Yazma hedefi | Mekanizma | Etkinleşme |
|---|---|---|---|
| K1 dışlama | `izometri_format_tanimlari.parse_disi=true` + fingerprint.dosya_adi_regex | SQL / (ileride W-2.4 UI) | anında (worker her turda okur) |
| K2 tanıma (format seçimi) | `izometri_format_tanimlari.fingerprint` (4 sinyal; içerik-öncelikli MK-152.1, dosya adı tie-breaker; içerik-fakir sınıflarda dosya_adi_regex ŞART MK-157.3) | format_tanit fingerprint alanları / SQL | anında |
| K2 eşleştirme (pipeline+spool) | `kuyruk-isle-izometri.dosyaAdiParse` / `montajDosyaKok` (KOD) | kod değişikliği + deploy | deploy |
| K3 — **DB-kurallı format** | `izometri_format_tanimlari.parser_kural` (jsonb) | format_tanit B1 patch (MK-111.2: rebuild değil) | anında* |
| K3 — **AILE_KAYIT'lı format** | `lib/format-paketleri.js` facet katmanları | KOD değişikliği + deploy (MK-155.1) | deploy* |
| K3 — L3 sözlü tarif | `izometri_format_tanimlari.prompt_template` | format_tanit textarea | anında (yalnız L3 fallback'te) |
| K4 tekil değer | `taslak_duzeltmeleri` (işaretli upsert, onConflict altılısı; kaynak EZİLMEZ MK-111.2) | wizard Düzelt modalı (bugün) / format_tanit B2 kipi (ileride) | anında, yalnız o spool |
| K4 format-geneli eşleme | `parser_kural.deger_haritasi` | SON ÇARE — "bu formatta hep böyle" kesinse; gerçekten Paslanmaz olan spool'u da çevirir riski | anında |

\* *her iki K3 yolunda da etkinleşme cache'e tabidir: ai_api_log.pdf_sha256 isabetinde eski sonuç
döner. Tam etkinleşme = §5 yayılım reçetesi.*

**AILE_KAYIT (160 itibarıyla):** `tersan_cadmatic_spool`, `tersan_cadmatic_montaj`. Etkin kural
izometri-oku:~900 `aileBirlestir(format_kodu) || DB_parser_kural` — bu ailelerde DB patch'i yazılır
ama OKUNMAZ. format_tanit 160'tan beri bu durumu ekranda ⚠ banner ile söylüyor.

## 3. TEK OTORİTE KARARI (MK-155.1 ikiliğinin çözümü)

**Karar (160): kısa vadede ikilik KABUL, format_tanit ADRES-BİLİNÇLİ.**
- DB-kurallı formatlar (a093eaaa vb.): öğretim doğrudan DB'ye — bugünkü akış, değişiklik yok.
- AILE_KAYIT'lı formatlar: öğretim = kod+deploy (Cihat eliyle); format_tanit operatöre ⚠ uyarı
  gösterir, sessiz başarısızlık yok. Gerekçe: e1fb879d üretim yükünü taşıyor; aileyi tek oturumda
  DB'ye taşımak + aileBirlestir okuma kaynağını değiştirmek (MK-49.1 sınırında) orantısız risk.
- **Uzun vade YÖN: tek otorite = DB.** Üç aday yolun kıyası:
  - (a) *paket→DB senkron:* paket kaynak kalır, DB'ye kopyalanır → operatör öğretimi yine deploy
    bekler, senkron borcu doğar. ZAYIF.
  - (b) *format_tanit paket-taslağı üretir (PR akışı):* otorite kodda kalır, Cihat onaylar →
    operatör self-servis DEĞİL; tek-geliştirici darboğazı. ARA ÇÖZÜM.
  - (c) *facet katmanları DB'ye taşınır (format_paket_katmanlari tablosu), aileBirlestir DB'den
    derler:* operatör öğretimi her formatta anında; deploy yalnız motor değişikliklerinde.
    HEDEF — ama ayrı, planlı paket: şema + MK-49.1 kontrollü istisna analizi + 155 reçetesiyle
    çift-kaynak kanıt turu ister. Pilot öncesi yapılmak zorunda değil; öğretim hacmi paket
    ailelerinde artınca tetiklenir.
- Ara kural: **yeni format aileleri AILE_KAYIT'a EKLENMEZ** (DB-kurallı doğar) — ikilik büyümez,
  (c) geldiğinde taşınacak küme iki ailede sabit kalır.

## 4. KİP AYRIMI — operatör sözlüğü (159/160 kararı)

| Belirti | Operatör işlemi | Yazma hedefi |
|---|---|---|
| "Sadece bu spool yanlış/boş" | wizard inceleme **Düzelt** (yerinde modal) | taslak_duzeltmeleri (K4 tekil) |
| "Bu formatın hepsi zayıf/L3/okunmuyor" | **Tanıt** → format_tanit (sol panel + sağ PDF) | parser_kural / paket (K3) |

format_tanit bugün SAF KURAL kipidir — değer yazma yoktur, iki iş karışamaz. B2'nin format_tanit'e
taşınması (operatör öğretim ekranındayken kurallanamayan alana istisna değeri yazabilsin) W-3.5
dil/rozet tasarımıyla BİRLİKTE gelir: "okuma yerini düzelt" ↔ "değeri düzelt" etiketleri ekranda
ayrışmadan kip eklenmez.

## 5. KÖPRÜ + YAYILIM SÖZLEŞMELERİ

**Köprü (gemide, 160):** `format_tanit?is=<id>&kaynak=devre|batch`
- kaynak=devre → dosya_isleme_kuyrugu → devre_dokumanlari.storage_yolu (bucket devre-belgeleri)
- kaynak=batch → is_kuyrugu.storage_path (bucket izometri-pdfs)
- Sayfa dosyayı kendisi açar, formatı oto-tespitle bulur; operatör dosya ARAMAZ (MK-159.2).
- Giriş noktaları: wizard inceleme zayıf/L3 satırı "Tanıt" (W-3.1) · batch bilinmeyen satırı
  "Tanıt" (W-3.2) · nav "Format Tanıt" (işsiz picker kipi). Mevcut `?format_id=&alan=` korunur.
- Aday genişleme: inceleme `fazla[]` satırları is_id taşıyor (160 enjeksiyonu) — buton ihtiyaç
  doğunca bağlanır.

**W-3.4 kardeş yayılımı (kural kaydı sonrası, 155 reçetesinin ürünleşmesi):**
1. (yalnız paket ailesi) deploy;
2. ai_api_log hedefli `pdf_sha256` NULL — kural değişiminden SONRAKİ aynı-gün L2 sha'ları DAHİL
   (155 tuzağı);
3. kardeş işler kuyruğa reset (.SXX filtresi — K1 dışlananlar bilerek dışarıda);
4. drenaj + kanıt (format/L2/$0 + ham_satir kontrolü).
Ürün hali: format_tanit "Kaydet" sonrası "kardeş dosyaları yeniden işle" adımı — uygulama sırası
köprü canlı kanıtından SONRA (161+).

## 6. AÇIK UÇLAR (sıra Cihat'ta)

- (c) yolunun planlı paketi (facet→DB taşıma) — tetik: paket ailelerinde öğretim talebi.
- B2'nin format_tanit'e taşınması + W-3.5 dil paketi.
- W-3.9 panzehiri (TURETILEN_ALANLAR çöp regex kapısı) — Y200 öğretim turundan ÖNCE.
- W-2.4 K1 dışlama UI'ı (bugün SQL ile yapılabiliyor, tablo §2'de).
- "Tanıttım ama düzelmedi" yönlendirme dili (K2 sorunlarında format öğretimi suçlamasını kesen
  mesaj — Onay Kuyruğu atanmamışlı grubuna köprü).
