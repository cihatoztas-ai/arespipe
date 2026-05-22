# CLAUDE — Sonraki Oturum (114) Gündemi

## Açılış ritüeli (52'den beri sade — 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -8`
   (HEAD 113 kod commit'leri + doküman commit'i olmalı; son kod commit'i `9425984` wizard izometri helper).
2. Bugün ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi (son commit), `docs/PROJE-HARITASI.md` + bu 3 dosya oku, gündem onayla.
**114 BEŞİN KATI → self-test günü:** `node .github/kontrol.js --self-test` hatırlat (Faz B lint sağlık kontrolü).
**Mid-cycle scope ekleme yok.**

## Oturum başı doğrulama (Supabase SQL Editor → düz ASCII)
```sql
-- 113 508 fix sonrasi kuyruk durumu (taze hata olmamali)
select durum, count(*) from dosya_isleme_kuyrugu where parser='izometri' group by 1 order by 1;

-- Format ogrenme tanisini tazele: format_id basina L2/L3 dagilimi (D1-D3 hedefleri)
select coalesce(format_id::text,'(YOK)') fmt, parser_seviye, count(*) cagri,
       sum(coalesce(maliyet_usd,0)) usd
from ai_api_log where cagri_tipi in ('L3_vision','L2_deterministic')
group by 1,2 order by 1,2;

-- Ogrenilmis formatlar (gercek tablo adi izometri_format_tanimlari)
select * from izometri_format_tanimlari order by 1 limit 30;
```

---

## ⭐ ANA TEMA — FORMAT ÖĞRENME DÖNGÜSÜ

113 kapanışında tanı kesinleşti: cache (PDF-seviyesi sha256) çalışıyor ama **format öğrenme
(desen-seviyesi) olgunlaşmamış — 3 delik var.** Toplam L3 maliyeti ~$6.21, tamamı bu deliklerden sızıyor.

**STRATEJİ (Cihat kararı):** Çok format eşzamanlı DEĞİL → **tek format derinlemesine.**
Sıra: **D1 yatay (sistem) → Tersan dikey (uçtan uca) → çoğalt.** Tersan en olgun zemin (181 bedava L2,
_tersan_meta kurulu, gerçek PDF'ler elde). Tek formatta tüm boru hattını çalıştır = diğer formatlar için şablon.

### D1 — Fingerprint güçlendir (en pahalı delik, $3.44) — İLK İŞ
- Çağrıların yarısı `format_id YOK` — PDF bir formata eşleşemiyor → L3'e atılıyor.
- 114'te: bu 156 çağrının PDF'leri hangileri? Neden fingerprint tutmuyor? (eşik dar mı, sinyaller zayıf mı?)
- Fingerprint mantığı `izometri-oku.js` satır ~519-612'de (MK-46.3 skorlama). MK-49.1: dokunma derken
  fingerprint okuma/eşleştirme tarafı — düzeltme dikkatli yapılmalı (Cihat ile A/B/C).
- Hedef: bu PDF'ler bilinen formatlara bağlanıp L2'ye düşsün.

### D2 — Tersan L2 kuralını sağlamlaştır + alıştırma/not ekle (kalite + $0.83)
- Tersan formatında alıştırma PDF'te AÇIK ama L2 kaçırıyor:
  - **Alıştırma sinyali 1:** spool adında `-ALS-` eki (örn. M100-323-FM03-AL**S**-S01).
  - **Alıştırma sinyali 2:** "NOT: Alistirma Parcasidir (Kaynatma!!)" satırı.
  - İkisi de `parse_sonuc`'ta null (`alistirma_ipucu`, `not_metni`) — L2 kuralına eklenecek.
- Öğrenilmiş formatlarda L3'e düşen varyasyonları yakala (84c12f61/e1fb879d sızıntısı).
- **Spool detayda gösterilmeyen parse katmanları** (zenginleştirme): malzeme_listesi (boru/dirsek/
  redüser/flanş ayrı satır + boy/ağırlık/kategori), _tersan_meta (çizen/tarih/sertifika). PDF'te VAR
  ama HİÇ çıkarılmayan: kaynak no, kesim no, rotation angle, cut/bending, FR pozisyonları, spool boyları.

### D3 — Öğrenilmemiş 2 formata L2 kuralı ($1.60)
- `15243262...` (16 çağrı $0.33), `995b5514...` (35 çağrı $1.27) — tanınıyor ama kural yok, %100 L3.
- Tersan boru hattı oturunca aynı yöntemle kural çıkarılır (veya D4 UI ile müşteri çıkarır).

### D4 — Müşteri-öğretir format UI (asıl "bize sormadan" çözümü)
- Bugüne dek format öğrenme SEN+BEN ile oluyor (PDF göster → kural yaz → deploy). Müşteri kendi
  tersanesinde, kendi formatıyla, bize sormadan yapamıyor.
- Kavramsal akış: yeni format → manuel_onay → kullanıcı PDF'i ekranda görür + parse alanlarını görür →
  "alıştırma şurada / not şu satırda / spool adı şu desende" işaretler → sistem desen/kural çıkarır →
  izometri_format_tanimlari'na kaydeder → o tersane bir daha otomatik (L2, bedava).
- Vizyondaki **Format Kaydet B Adımı (AI harita önerisi) + C Adımı (görsel/canvas işaretleme)**.
- En büyük parça; Tersan üzerinde prototip, sonra genel. Kendi alt-oturumları olabilir.

---

## İKİNCİL — Refactor temizliği (508 işinin kalanı)

### Aşama 4b — backend ölü kod temizliği
- `kuyruk-isle-izometri.js::drenajTuru` + DRENAJ modu dispatch — artık hiçbir frontend çağırmıyor
  (devre_detay+wizard client-loop'a geçti). Client-loop canlı kanıtlandı → güvenle silinebilir.
- `kuyruk-isle.js` self-chain (satır 148, batch) + frontend MAX_TUR kalıntıları.
- DİKKAT: handler'ın `is_id` (TEK İŞ) modu CANLI — helper bunu çağırıyor, KALMALI. Sadece DRENAJ modu ölü.

### Batch sayfaları client-loop'a geçir (Aşama 3 devamı)
- `izometri-batch.html` + `izometri-batch-incele.html` hâlâ eski fire-and-forget+polling (508 riski).
- Batch farklı bucket (`izometri-pdfs`) + `batch_id` kullanıyor; queue yapısı dosya_isleme_kuyrugu ile
  aynı mı önce doğrula (MK-108.4). Sonra ARES_IZO_DRENAJ'a bağla ({} veya batch filtresi).

---

## Açık borçlar (öncelik sonrası)
1. **Wizard yeni-devre UI redesign.** Fonksiyon çalışıyor; Cihat "fonksiyon önce, mockup/redesign sonra"
   dedi. Toggle + input'lar mockup sonrası elden geçecek.
2. **i18n borcu (G-01).** Wizard 113/B: `dw_mode_mevcut`, `dw_mode_yeni`, `dw_info_yeni`. Eski 112:
   `dv_izo_drenaj_hata/kismi`, `sp_izo_baslik/ac/acilamadi/eslesen`. Fallback'le çalışıyor, lang/*.json'da yok.
3. **Mobil yönetici ekranında izometri PDF teşhisi (112'den devir).** İş Başlat'ta göründü, yönetici
   ekranında görülmedi. IbSpoolDetay.jsx tek dosya — davranış neden farklı? Bu oturumda bakılmadı.
4. **`_N` alt-spool fallback (MK-110.2).** S01_1 PDF → kök S01: önce birebir, yoksa _N at + kök dene.
5. **İkiz kolon temizliği** (agirlik/agirlik_kg, durum/is_durumu — MK-108.2) + web spool durum senkronu
   (devre_detay tablo + spool_detay aktif_basamak/ilerleme DB-truth okusun).
6. **Test verisi temizliği.** Gerçek veri yok; ikiz/test devreleri topluca silinebilir (Cihat istediğinde).
7. **Yön/3D hattı (MK-49.A).** Parse'ta yön/dizilim verisi yok; D2 zenginleştirmesiyle (rotation/FR/cut)
   çıkarılırsa 3D girdisi doğar. Ayrı iş.

## Destekleyen kararlar (akılda tut)
- **MK-49.1:** izometri-oku.js'e DOKUNMA — sadece çağır. (D1 fingerprint düzeltmesi bu sınırda dikkatli olmalı.)
- **MK-108.1:** Wizard kuyruğu = dosya_isleme_kuyrugu + devre-belgeleri + kuyruk-isle-izometri.js (is_id).
- **MK-108.4:** Kolon/tablo adı yazmadan information_schema ile doğrula. (113'te yine işe yaradı:
  olusturma_at, pdf_sha256, izometri_format_tanimlari.)
- **MK-109.1:** Çalışan kodu yeniden yazma — çıkar/çağır. (wizard yeni devre alanları devre_yeni'den çağrıldı.)
- **MK-109.5 / MK-51.1:** cp + md5 gözle teyit. git status dosya sayısı. Yeni dosya → git add.
- **MK-110.4:** Emin değilsen eşleştirme/bindirme ZORLAMA — atanmamış bırak.
- **MK-110.5:** Kuru çalışma + (uygunsa) birim test önce.
- **MK-111.2:** bindirme survivorship — boş→doldur, çelişki→flag, ağırlık %3 tolerans, sessiz ezme yok.
- **MK-113.1:** Vercel 508 = aynı-deployment yoğun fonksiyon-fonksiyon HTTP → client-loop orkestrasyonu.
- **MK-113.2:** tek paylaşılan izometri drenaj altyapısı (ares-izometri-drenaj.js).
- **MK-113.3:** wizard yeni devre — finalize'da INSERT, alanlar devre_yeni'den, kabuk sonrası özet senkronu.

## Önemli hatırlatmalar (disiplinler)
- **Veriyi gör, varsayma.** Kolon/tablo/bucket/JSONB + PDF içeriği — hepsini bakarak doğrula.
  (Alıştırma "yok mu çıkarılamıyor mu" PDF görülünce netleşti: PDF'te VAR, L2 kaçırıyor.)
- **Şüpheyi sorguyla kapat.** ("76 L3 ≠ 12" → sha256 sorgusu → mükerrer yok.)
- **cp + md5 gözle teyit. git status dosya sayısını DOĞRULA.** Yeni dosya → git add.
- **Push sırası: pull --rebase → (migration COMMIT) → commit → push.** CI commit'leri rebase ile gelir.
- **HTML/JS:** cerrahi str_replace + izole node --check (büyük HTML'de). JSX → babel parse.
- **zsh:** çok satırlı/yorumlu yapıştırma `number expected`/`parse error` (zararsız) — tek satır kullan.
- **Şema migration:** BEGIN...ROLLBACK dry-run → COMMIT (MK-98.2). Supabase SQL düz ASCII.
- **Kapsam disiplini.** 113'te format öğrenme çıktı, kapsama eklenmedi — tanı çıkarılıp 114'e bırakıldı.
- Env: SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app; mobil VITE_API_BASE.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

## 114'e tek cümle özet
"113'te izometri parse hattındaki Vercel 508 (server→server self-invocation) client-loop orkestrasyonuyla
kökten çözüldü, devre_detay+wizard tek paylaşılan ares-izometri-drenaj.js'e bağlandı, wizard 'yeni devre
oluşturma' eklendi — hepsi canlı geçti; kapanışta format öğrenme döngüsünün 3 deliği (fingerprint zayıf
$3.44 + kural sızıntısı/eksikliği + müşteri-öğretir UI yokluğu) tanılandı. 114 ANA TEMA: format öğrenme —
önce D1 fingerprint, sonra Tersan'ı uçtan uca (kural + alıştırma/not + müşteri-öğretir UI). Tek format
derinlemesine, çok format değil. İkincil: Aşama 4b backend ölü kod + batch sayfalarını client-loop'a geçir."
