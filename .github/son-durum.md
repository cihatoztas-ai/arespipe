# son-durum.md — Oturum 177 kapanışı (HEAD 87c36c1)

## Özet
**Kütüphane veri girişi için migration döngüsü kırıldı: `seed-from-json.mjs` aracı kuruldu ve canlı kanıtlandı.**
Eskiden JSON elle SQL INSERT'e çevrilip Supabase dashboard'a yapıştırılıyordu (darboğaz Cihat'ta).
Artık: `PDF → JSON → node scripts/seed-from-json.mjs <dosya> --yaz → DB`. İdempotent upsert.
İlk canlı test: Sandvik paslanmaz boru **52 satır yazıldı, 0 hata** — gerçek bir kütüphane eksiği kapandı.

(Not: Bu oturumda ayrıca devre malzeme takip sayfası + 2" SCH10S et düzeltmesi konuşuldu; aşağıda.)

## Yapılanlar (sırayla)
1. **Malzeme takip sayfası tartışıldı, KAPATILDI.** Cihat fikir: yıldızlı devrelerin malzemesi için ayrı
   sayfa + "ezik/yamuk" not+foto + uyarılar sayfası. Kapsam araştırması yapıldı (devreler.html yıldız sistemi
   zaten DB-tabanlı kuyruk + teslim_adet). `malzeme_uyarilari` tablosu için dry-run (MK-98.2) yapıldı ama
   **Cihat "bu kadar işe gerek var mı" dedi → tam sistem yerine basit "genel not → uyarılar" fikrine indirildi,
   sonraki oturuma bırakıldı.** Hiçbir şey canlıya yazılmadı (dry-run ROLLBACK). Repoda iz yok.
2. **2" SCH10S paslanmaz et düzeltmesi (f3887e4).** Cihat oturum öncesi yapmış: `asmeFallbackDoldur` kör
   schedule fallback 3.91→2.77, MK-49.1 istisnası. Zaten commit+push'lu (bu sohbette yapılmadı, sadece teyit).
3. **seed-from-json.mjs kuruldu (MK-177.1, commit 3243e51).** Node ESM, dependency yok (supabase-js zaten kurulu).
   - `--dry-run` varsayılan; `--yaz` gerçek; `--tablo X` zorlama; `--uyari-yaz` opsiyonel.
   - Sadece `_db_aksiyonu IN (YENI_DN/YENI_SCH/YENI_SCH_KOMB)` satırları yazar; MEVCUT_TEYIT atlar.
   - `_`-alanları + generated kolonları otomatik atar (MK-177.2 — kendi kendini iyileştiren retry).
   - upsert `onConflict` = tablo unique-key (script içi `UNIQUE_KEY` haritası).
4. **Sandvik canlı seed (MK-177.1 kanıt).** `sandvik_b3619m_b3610m_paslanmaz_v1.json`: 121 satır, 52 YENI / 69 MEVCUT.
   `--yaz` → 52 yazıldı, 0 hata. **DB teyit:** B36.19M paslanmaz 89 (5S=20,10S=23,40S=23,80S=23),
   B36.10M paslanmaz 43 (20=8,120=7,160=14,XXS=14) — beklentiyle birebir.
5. **Service key kuruldu.** `.env.local`'de `SUPABASE_SERVICE_KEY` boştu (Vercel CLI secret çekmez). Supabase
   yeni `sb_secret_` formatından oluşturuldu, eklendi. `.env.local` gitignore'da (güvenli, teyit edildi).

## Canlı durum
- HEAD = **87c36c1**, origin/main senkron. Tek kod commit'i bu oturumdan: `3243e51` (seed script, 214 satır).
- **Fonksiyon: 12/12** (seed bir CLI script'i, serverless değil — tavanı etkilemez).
- DB: boru_olculer paslanmaz 132 (Sandvik +52 sonrası), B36.19M=89 + B36.10M=43.

## WORKING TREE — DİKKAT (dokunulmadı, kasıtlı)
- **migration/ → schema/+data/ taşıması commit BEKLİYOR.** Önceki bir oturumda 98 migration dosyası
  `migrations/schema/` (56) + `migrations/data/` (42)'ye taşınmış ama commit edilmemiş. git bunu
  "deleted düz dosyalar + untracked schema/data/" gösteriyor. **Bu oturumun işi DEĞİL — dokunulmadı.**
  `gp` autostash ile rebase'in altından sağ salim geçirdi. Sonraki kütüphane oturumu kendi planıyla commit'lemeli.
- `sandvik_...json` proje kökünde untracked (commit'lenmedi — veri DB'de, repoda gereksiz).

## Açık (sonraki oturum)
- **MK-176.7 (hâlâ keystone):** Onay Kuyruğu yerine wizard İnceleme ekranını spool_detay/devre_detay'da göster.
  177'de el atılmadı (gündem kütüphane oldu). spool_detay.html + devre-inceleme.js kapsam araştırması bekliyor.
- **Fitting/flanş seed (MK-177.3 — kütüphane devamı):** DIN 28011 cap (21) + DIN 86087 saddle DB'de YOK
  (teyitli), JSON'lar `~/Downloads`'ta hazır. AMA: `fitting_olculer` doğal UNIQUE constraint'i YOK (sadece id pkey)
  → upsert imkansız; eski cunife JSON'larında `_db_aksiyonu` yok → script "yazılacak yok" der. **Önce unique key
  kararı** (öneri: `standart+malzeme_grubu+parca_tipi+cap_buyuk_dn+cap_kucuk_dn`, dolu 897-satır tabloda
  MK-98.2 dry-run ile teyit — mevcut veri tekrar ediyorsa ALTER patlar), **sonra** script uyarlama (filtre +
  onConflict + `_db_aksiyonu` yoksa hepsini yaz).
- **KUTUPHANE-YUKLEME-TAKIP.md BAYAT:** v4/95'te kalmış. DB gerçeği: boru karbon 297 / paslanmaz 132 / al 50 /
  cunife 68; fitting cunife 328 / karbon 569; flanş cunife 48 / karbon 308. Güncellenmeli.
- Seed tolerans notu: et_min/et_max artık DB'nin sabit %12.5 toleransıyla hesaplanıyor; Sandvik'in gerçek
  tolerans bandı isteniyorsa `tolerans_et_yuzde` kolonuna yazılmalı (düşük öncelik).
- 13 kirli devre recovery (176'dan) + B testi (wizard terfi loop canlı) — hâlâ açık.
- Recovery i18n (4 anahtar × 3 dil), `1 1/4"` boşluklu-kesir bug, gece cron ispatı — devam.

## Dosya md5 (bu oturum, push edilmiş)
- scripts/seed-from-json.mjs = 5234b69806c6364aa2cea4512402d5b9
