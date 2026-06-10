# CLAUDE-SONRAKI-OTURUM.md — Oturum 175 giriş planı

## Ritüel (önce)
`git pull && git status && git log --oneline -5` + fonksiyon sayısı 12/12 + handoff oku.

## Bağlam: nerede kaldık
Excel↔PDF **alan-seviyesi katman birleştirme** kurguyu tamamlama işindeyiz. Kurgu: bir spool'un bilgisini farklı dokümanlardan toplayıp tek ortama getir (gerçek imalat: Excel'de yoksa PDF'ten al). **Faz 1 (kalite) BİTTİ** (önizleme + terfi + etiket, kanıtlı). Kök sorun ("iki ıraksak merge yolu") kalite için kapandı; **gerisi açık.**

## SIRADAKİ İŞ (öncelik sırası)

### 1) Faz 1b kapsam genişletme — TEK MERGE KANALI (kök çözümün kalanı) ⭐
**Sorun:** Şu an iki merge yolu var. Kalite `birlesikler` kanalıyla terfiye taşındı. Ama **cap/et/yüzey/not/alıştırma** terfi tarafında AYRI bir yolda (`/api/eslestirme-backfill` — terfi sonrası izometri parse_sonuc'tan re-yazım). Bu yüzden Faz 1b'de bilerek SADECE kalite alındı (çift-yazım riski).
**Yapılacak:**
- `api/eslestirme-backfill.js` YÜKLE + OKU (bende yok). Hangi alanları yazıyor net gör.
- Karar: ya (a) tüm gap-fill alanlarını `birlesikler` kanalına topla (aktar tek merge yazsın, backfill'i o alanlardan çek) → İKİ YOL TEKE İNER; ya da (b) backfill'in doğru/yeterli yazdığını kanıtla, böl. 
- `birlesikler` kanalı generik kuruldu (`{kalite}` şu an, `{kalite,yuzey,cap,et,not,alistirma}`'ya genişler). aktar'da öncelik deseni hazır (operatör _dz > _bl > taban).
- Endpoint zaten s.cap/s.et/s.yuzeyHam/s.not/s.alistirma üretiyor → wizard `_birlesikHarita`'ya eklemek kolay; aktar satırlarına `_bl.X` önceliği eklenir.

### 2) Faz 2 — çelişki kazananı
İki kaynak DOLU ve farklıysa: **referans Excel → Excel; manuel Excel → PDF.** Çelişki rozeti korunur (zaten gösteriliyor "kabuk korunur").
- Sinyal HAZIR: `lib/excel-parser.js` dönüşü `seviye`(L1/L2) + `guven`. Kural: **L1 & guven≥70 → referans Excel** (sözlük başlığı tanındı = IFS/Cadmatic export); aksi → manuel.
- Bu sinyali kabuk_spoollar'a/devreye taşı → `/api/devre-inceleme`'de `bindir` "kabuk korunur" yerine provenance-koşullu kazanan seç. Yeni soru/bayrak GEREKMEZ.
- excel-parser bende var (yüklendi).

### 3) Üçüncü belge katmanı (ileride)
Kurgu "Excel→PDF→diğer belgeler". Şu an Excel + izometri PDF var. Sertifika/başka doküman katmanı tasarlanmadı. Düşük öncelik.

## ESKİ AÇIK BORÇLAR (carry-over)
- **KARARLAR.md boşluğu:** MK-169/170/171 girişleri eksik (168→172 atlıyor). Bu oturumda 174 eklendi; 169/170/171 hâlâ boş.
- **yukleyen_id null (MK-117):** devre_dokumanlari'nda yukleyen_id null → `kuyruk-isle-izometri.js:305` "kullanici_id zorunlu" abort → izometri/NOT/alıştırma yazılmaz. Çözüm: dosyalara user ID ata VEYA sistem yüklemeleri için kontrolü gevşet.
- **Gece cron (03:00 İstanbul):** üçüncü oturumdur ispatsız — gündüz tarayıcı drenajı kuyruğu boşaltıyor.
- **Kaynak etiketi (cap/et):** cap/et PDF'ten dolduğunda (166/A) hâlâ "Excel" rozeti (kalite gibi `_kaynak` bayrağı yok). Faz 1b genişlerken eklenebilir.

## TEST DEVRESİ SİLME (birikiyor)
174 yeni: cgghmcmhgvm120 (+ NB1137-D100-577 test). 173: cgghmcmhgvm120/cghfdkv/hthth/thjjy/kfyukfyl/kgcdkgc/uogyol. 172: NB1099C/NB1124/M120-Galv. 170: NB1099C. 171: M110-St.St/E120-St.St. → Temizlik turu yapılabilir.

## İLK HAMLE (175)
"eslestirme-backfill.js'i yükle" iste → oku → madde 1 kararını ver (tek kanal mı, böl mü) → uygula. Bu, kök "iki merge yolu"nu kapatır.
