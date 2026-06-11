# CLAUDE-SON-OTURUM.md — Oturum 177 özeti

## Ana tema
**Kütüphane veri girişinin migration darboğazı kırıldı.** `seed-from-json.mjs` idempotent upsert aracı yazıldı,
Sandvik paslanmaz boru ile canlı kanıtlandı (52 satır, 0 hata). Cihat'ın eski "bu mantıklı gelmiyor" sezgisi
(veri = migration değil) doğrulandı: veri kataloğu schema versiyonu değil, "doğru hâl"dir → upsert doğru araç.

## Yapılanlar
1. **Malzeme takip sayfası — tartışıldı, küçültüldü, ertelendi.** Tam QC sistemi (ayrı sayfa + uyarılar +
   foto + `malzeme_uyarilari` tablosu) tasarlandı, dry-run'a kadar gidildi. Cihat "bu kadar işe gerek var mı"
   deyince DURULDU → "genel not alanı → uyarılara gider" basit fikrine indirildi, sonraki oturuma. Hiçbir şey
   yazılmadı (dry-run ROLLBACK, repoda iz yok). **Doğru hamle: Cihat'ın ölçek sezgisine uyuldu, dayatılmadı.**
2. **seed-from-json.mjs (MK-177.1).** Brifing (`MIGRATION-DUZELTME-BRIFING.md`) planı izlendi. JSON oku →
   YENI satırları filtrele → upsert. `--dry-run` varsayılan güvenli. Commit 3243e51, push 87c36c1.
3. **Generated kolon engeli → kendi kendini iyileştirme (MK-177.2).** İlk `--yaz` "cannot insert a non-DEFAULT
   value into column et_min_mm" verdi. `boru_olculer`'da et_min_mm/et_max_mm/ic_cap_mm GENERATED (DB hesaplıyor).
   Hardcode yerine: upsert hatasından kolon adını regex'le yakala → düş → retry. Her tabloda çalışır, hardcode yok.
4. **Sandvik canlı seed.** 52 satır, 0 hata. DB teyit beklentiyle birebir (B36.19M=89, B36.10M=43).

## Yöntem / disiplin (bu oturumda işe yarayanlar)
- **MK-85.3 (şema-önce) tekrar tekrar kurtardı:** unique key DB'den çekildi (boru: 5 alan); kolon adları
  information_schema'dan teyit edildi (15/15 eşleşti); generated kolonlar `is_generated` ile saptandı.
  Hiçbiri tahmin değil. Fitting'e geçerken aynı disiplin "unique key YOK" gerçeğini çıkardı → seed durduruldu.
- **MK-126.8 (önce oku):** JSON yapısı (meta/satirlar/uyari/beta + alan adları + `_db_aksiyonu` dağılımı)
  seed'den önce incelendi. devreler.html yıldız sistemi kod okunarak anlaşıldı (malzeme sayfası tartışması).
- **--dry-run disiplini:** her `--yaz` öncesi dry-run; ilk generated-kolon hatası DB'ye hiçbir şey yazmadan
  yakalandı (52/52 reddedildi, tablo temiz kaldı).
- **Cihat'ın ölçek sezgisi > Claude'un sistem kurma eğilimi:** hem malzeme sayfasında (tam QC → basit not)
  hem migration'da (Claude sistem kurmaya meyilli, Cihat "gerek var mı"). İkisinde de Cihat haklıydı.

## Cihat'ın kritik müdahaleleri
1. "Stok tutmuyoruz" → malzeme sayfası MRP değil, teslim+QC kapısı olarak yeniden çerçevelendi.
2. "Bu kadar işe gerek var mı" → tam QC sistemi basit nota indirildi (overkill önlendi).
3. "Migration yarısı başka şey, sorun olmaz mı" → kavram netleşti: veri tabloda yaşar, migration sadece
   giriş kapısı; iki kapı (migration + seed) aynı `boru_olculer`'a yazar, tek hakikat.
4. "Bunlar yüklenmiştir, arşivden bak" → conversation_search ile 95/96 oturumları bulundu, sezgisi doğrulandı
   (cunife fitting 328 = TAM). DB sayımıyla takip belgesinin bayatlığı ortaya çıktı.

## Tuzaklar / öğrenmeler
- **`fitting_olculer` doğal unique key YOK** (sadece id pkey). Boru'dan farklı → upsert için önce constraint
  kararı gerekir. Dolu 897-satır tabloya UNIQUE ALTER riskli (mevcut tekrar varsa patlar) → dry-run şart.
- **Eski cunife JSON'larında `_db_aksiyonu` yok** (94-96 dönemi, YENI/MEVCUT sistemi sonradan eklendi) →
  script şu an bunları "yazılacak yok" sayar; fitting seed'inde uyarlama gerekir.
- **`.env.local` Vercel CLI dosyası secret çekmez** → service key boş (`""`) geliyordu. Supabase yeni
  `sb_secret_` formatından elle eklendi. (Eski `service_role` legacy sekmesinde de var, alternatif.)
- **Supabase secret key adı tire kabul etmez** (`seed-script` ✗ → `seed_script` ✓).
- **migration/ → schema/data/ taşıması working tree'de yarım** — önceki oturum işi, bu oturum dokunmadı,
  `gp` autostash ile korudu. Sonraki kütüphane oturumu commit'lemeli.

## Karar günlüğü
KARARLAR.md'ye **MK-177.1** (seed akışı), **MK-177.2** (generated-kolon kendi kendini iyileştirme),
**MK-177.3** (fitting/flanş seed — unique key kararı bekliyor) eklenecek.
