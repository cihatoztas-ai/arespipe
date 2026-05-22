# CLAUDE — Sonraki Oturum (112) Gündemi

## Açılış ritüeli (52'den beri sade — 2 kontrol)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5`
   (HEAD 111 kod commit'leri + doküman commit'i olmalı).
2. Bugün ne yapmak istiyorsun?
Sonra Claude: git temiz mi, CI rengi (son commit), `docs/PROJE-HARITASI.md` + bu 3 dosya oku, gündem onayla.
**Mid-cycle scope ekleme yok.**

## Oturum başı doğrulama (Supabase SQL Editor → düz ASCII)
```sql
-- 111 bindirme canli mi? A-000764 yuzey/durum (111 sonu: yuzey='Galvaniz', kismi)
select spool_id, yuzey, et_kalinligi_mm, dis_cap_mm, cizim_durumu, agirlik_kg
from spooller where spool_id='A-000764';

-- PDF<->spool bagi (2b) duruyor mu
select dosya_adi, spool_id from devre_dokumanlari where spool_id is not null limit 10;

-- Bekleyen izometri kuyrugu — buton sorunu teshisi icin (alindi_at=null = worker hic almadi)
select q.durum, count(*) from dosya_isleme_kuyrugu q
where q.parser='izometri' group by 1;
```

---

## ⭐ ÖNCELİK 1 — `Bekleyenleri işle` butonu tetik sorunu (🔴 yeni, 111'de keşfedildi)

**Belirti:** Buton "izometri parse ediliyor" yazar, dökümanlar göz kırpar ama İLERLEME YOK. Kuyruktaki
işler `durum='bekliyor'`, `alindi_at=null`, `deneme_sayisi=0`, `hata_mesaji=null` kalır — yani worker
işi HİÇ ALMADI (parse hatası değil, tetik ulaşmıyor).

**KANITLANMIŞ:** Endpoint SAĞLAM. Terminalden direkt `POST /api/kuyruk-isle-izometri {is_id}` →
`{sonuc:'islendi', eslesme:{...}}` döndü, parse+bindirme tam çalıştı (A-000764). Yani sorun
**butonun çağırdığı tarafta** — fire-and-forget tetik ulaşmıyor ya da hiç atılmıyor.

**Bu PARÇA 2 ile İLGİSİZ** — 110'dan beri var olan ama fark edilmemiş (110'da d6dffba8 zaten parse
edilmişti, yeni yükleme test edilmemişti). 111 yeni devreye yükleme yapınca ortaya çıktı.

**112'de bakılacaklar (veriyi gör, varsayma):**
1. `Bekleyenleri işle` butonu hangi JS fonksiyonunu / hangi endpoint'i çağırıyor? (devre_detay.html
   Dökümanlar sekmesi). Çağrı gerçekten atılıyor mu (Network tab) yoksa hiç mi tetiklenmiyor?
2. `zincirDevam(supa)` self-chain çalışıyor mu — bir iş bitince sonrakini tetikliyor mu?
   (api/kuyruk-isle-izometri.js içinde, satır ~270). Belki ilk tetik hiç atılmadığı için zincir başlamıyor.
3. Buton `is_id` ile mi çağırıyor yoksa body'siz (kuyruktan en yüksek öncelikli al) mi? Body'siz çağrı
   kuyruğu doğru sorguluyor mu (parser='izometri', durum='bekliyor', öncelik/eskilik sırası)?
4. Vercel function log: buton tetiklendiğinde kuyruk-isle-izometri çağrısı log'a düşüyor mu?

**Geçici workaround (çalışıyor):** Terminalden `curl -X POST .../api/kuyruk-isle-izometri -d '{"is_id":"..."}'`.
Acil parse gerekirse bununla yapılır.

## ÖNCELİK 2 — Spool detay'da eşleşen PDF erişimi (2b'nin görünür kısmı)
DB bağı 111'de kuruldu (`devre_dokumanlari.spool_id`). Eksik olan UI: spool detay sayfasında eşleşen
izometri PDF'ine link/önizleme. Cihat: "sayfa tasarımını sonra değiştirebiliriz" dedi → UI bu oturumda.
- Spool detay (`spool_detay.html` / React `IbSpoolDetay.jsx`?) → `select * from devre_dokumanlari
  where spool_id = <bu spool uuid> and dokuman_tipi='izometri'` → "İzometri Çizimleri" bölümü/sekmesi.
- Vizyon: "spool imalat resimleri spool detay sayfalarına aktarılmalı ki ihtiyaç halinde hemen ulaşılsın."
- PDF önizleme mi, indir linki mi, gömülü iframe mi? — oturum başı A/B/C.

## ÖNCELİK 3 — Uyarılar sayfasında bindirme flag gösterimi
`parse_sonuc._eslesme.detay[].bindirme[].flag=true` olan spool'lar (çakışmalı — örn. ağırlık %3 üstü)
uyarılar sayfasında görünmeli. Vizyon: "eksiği/çelişkisi olan spool'lar buradan takip edilecek."
- Hangi tablo/sorgu? `dosya_isleme_kuyrugu.parse_sonuc` JSONB'den flag'li spool'ları çek, ya da
  bindirme anında `spooller`'a bir `bindirme_uyari` işareti yaz (tasarım kararı).
- A-000764 şu an flag'li (ağırlık %15.6) — gerçek test verisi hazır.

## Açık borçlar (öncelik sonrası)
4. **`_N` alt-spool fallback (MK-110.2 eksiği).** `S01_1` PDF → kök `S01`'e (pafta eki), `S08_1` gibi
   gerçek ayrı spool'u bozmadan: önce birebir, yoksa `_N` at + kök dene.
5. **"Tersan M110 Montaj Resmi" format temizliği.** manuel_onay'a düşüyor (düşük güven 0.65 < 0.7).
6. **Test verisi temizliği.** GERÇEK veri YOK içeride. 8ca4a958 vs 387732a0 ikiz devreleri + fakir/mükerrer
   test spool'ları (A-0006xx) topluca silinebilir. Acil değil — Cihat istediğinde.
7. **Yeni devre ekleme akışı.** Cihat: "henüz yeni devre ekleyemiyoruz, sadece mevcuda ilave." Wizard
   "yeni devre" yolu eksik/yarım mı? Netleştir — bu büyük bir eksik olabilir.
8. **Yön/3D hattı (MK-49.A).** Bindirme yön getirmedi (parse'ta kaynak yok). 3D girdisi için yön üretimi ayrı.
9. **HTTP 508 PDF** (`M100-323-FM12-ALS.S02.1.pdf`) — kalıcı izometri-oku hatası.
10. **İkiz kolon temizliği** (agirlik/agirlik_kg, durum/is_durumu — SEMA-IKIZLER.md, MK-108.2).
11. **Öğrenme döngüsü / format envanter UI** (MK-107.x, 51'den).

## Destekleyen kararlar (akılda tut)
- **MK-49.1:** izometri-oku.js'e DOKUNMA.
- **MK-108.1:** Wizard kuyruğu = dosya_isleme_kuyrugu + devre-belgeleri + kuyruk-isle-izometri.js.
- **MK-108.4:** Kolon adı yazmadan information_schema ile doğrula. (111'de defalarca unutuldu — DİKKAT.)
- **MK-109.1:** Çalışan kodu yeniden yazma — çıkar/çağır. (ares-olcu, ARES_BORU'yu çağırır; yeniden yazmaz.)
- **MK-109.5 / MK-51.1:** cp + md5 gözle teyit. (111'de yarım push'u bu yakaladı.)
- **MK-110.2:** Eşleşme anahtarı = devre+pipeline+spool, pipeline dosya adından.
- **MK-110.4 (A+B):** Emin değilsen eşleştirme/bindirme ZORLAMA — atanmamış/dokunma bırak.
- **MK-110.5:** Kuru çalışma önce — DB'ye dokunmadan raporla, doğrula, koş.
- **MK-111.1:** et ≥ dış çap olamaz.
- **MK-111.2:** bindirme survivorship — boş→doldur, çelişki→flag, ağırlık %3 tolerans, sessiz ezme yok.

## Önemli hatırlatmalar (disiplinler)
- **Veriyi gör, varsayma.** 111'de en çok bunda tökezledik — kolon adı varsayımı 3-4 SQL hatası yarattı.
- **cp + md5 gözle teyit. git status dosya sayısını DOĞRULA** (yarım push riski). Yeni dosya → `git add`.
- **Push sırası: migration COMMIT → kod push → deploy.**
- **zsh:** `--include="*.html"` tırnaklı. md5/açıklama bloğunu terminale yapıştırma (command not found / quote>).
- **HTML/JS tam dosya** değişimi; JS → node --check + saf fonksiyon birim testi.
- **Şema migration:** BEGIN...ROLLBACK dry-run → COMMIT (MK-98.2). Supabase SQL düz ASCII.
- Env: SUPABASE_SERVICE_KEY; SELF_BASE_URL=https://arespipe.vercel.app.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

## 112'ye tek cümle özet
"111'de boru ölçü zenginleştirme (PARÇA 1: ortak parser) + katman bindirme (PARÇA 2: survivorship +
PDF↔spool bağı) bitti ve canlı doğrulandı; 112'de önce 'Bekleyenleri işle' buton tetik sorununu çöz
(endpoint sağlam, buton ulaşmıyor), sonra bindirmenin GÖRÜNÜR kısımlarını ekle (spool detay'da PDF
erişimi + uyarılar sayfasında çakışma flag gösterimi)."
