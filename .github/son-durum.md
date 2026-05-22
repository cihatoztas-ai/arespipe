# Son Durum — 112. Oturum (22 May 2026)

> 111 → 112 geçişi. ANA TEMA: **izometri drenaj buton tetik sorunu (MK-112.1)** +
> **spool detayda eşleşen izometri PDF erişimi (MK-112.3)** + **uyarılar sayfasında bindirme
> çelişki uyarıları (MK-112.5)**. Üç planlı öncelik de tamamlandı ve canlı doğrulandı.

---

## Bu Oturumun Sonucu

**112 başarıyla kapandı. Üç öncelik de canlıda çalışıyor.**

- **Öncelik 1:** "Bekleyenleri işle" butonu artık gerçekten drene ediyor. Kök neden: fire-and-forget
  self-chain Vercel'de container suspend yüzünden ölüyordu (her tetik = 1 iş). İç-döngü drenajla
  çözüldü + buton devreye özgü hale getirildi.
- **Öncelik 2:** Eşleşen izometri PDF'i artık spool detay sayfalarından açılabiliyor (mobil + web),
  Belgeler bölümünde. Endpoint çok-bucket destekli yapıldı.
- **Öncelik 3:** Bindirme çelişkileri (kabuk Excel ↔ PDF farkı) uyarılar sayfasında görünüyor —
  sayfanın ilk canlı DB bağlantısı.

---

## YAPILANLAR

### Öncelik 1 — İzometri drenaj buton tetik sorunu (MK-112.1, MK-112.3)

**Kök neden (canlı kanıtlandı):** `kuyruk-isle-izometri.js` her iş bitince `zincirDevam()` ile
fire-and-forget `fetch` atıp kendini tekrar tetikliyordu. Vercel serverless'te `res.json()` döndükten
sonra container SUSPEND olur → o fetch çoğu zaman paket gitmeden ölür. Sonuç: her tetik tam 1 iş,
zincir hiç başlamaz. 112'de kanıt: `bekliyor:134`, tek curl → sadece 1 azaldı.

**Çözüm (MK-112.1):** `zincirDevam` silindi. Tek-iş mantığı `birIsIsle(supa, baseUrl, is)` saf
fonksiyonuna taşındı (res'e dokunmaz, sonuç objesi döner). Yeni `drenajTuru(supa, baseUrl, {maxIs,
maxMs, devreId})` — `maxDuration:60` içinde ardışık iş işler (maxIs=4, maxMs=50sn). Container zaten
ayakta, iç while-döngüsü Vercel suspend tuzağına takılmaz. `isiHataylaKapat`'tan res çıkarıldı (obje
döner). Frontend (`devre_detay.html::bekleyenIzometriIsle`) setInterval → ardışık await döngüsü
(kalan_var=false olana dek tekrar tetikler, MAX_TUR=60 + ardışık hata + boşTur korumaları).

**Devre-özgü (MK-112.3):** Buton sayacı bu devreye özgüydü ama backend global drene ediyordu →
"sayı azalmıyor" belirtisi. `drenajTuru` artık `devreId` alıyor; kuyrukta `devre_id` kolonu YOK
(şema: tenant_id, devre_dokuman_id, parser, oncelik, durum, olusturma), o yüzden devre dokümanı
id'leri çekilip kuyruk `.in('devre_dokuman_id', [...])` ile filtreleniyor. devreId yoksa global
(cron için geriye uyumlu — MK-112.2). Buton `body:{devre_id: DEVRE.supaId}` gönderiyor.

**Canlı doğrulama:** curl drenaj → `islenen_sayisi:4, kalan_var:true` (eskiden 1). deneme 3d devresi
(8ea2963c) butonla boşaldı: 18 izometri işlendi (10 oneri_hazir + 8 manuel_onay), bekliyor=0.

**Birim test:** drenajTuru için mock supa + mock fetch ile 25/25 (döngü/limit/kalan_var + devre
izolasyonu: D1 işlenirken D2'ye dokunulmuyor + global geriye uyumluluk).

### Öncelik 2 — Spool detayda eşleşen izometri PDF erişimi (MK-112.3, MK-112.4)

DB bağı 111'de kurulmuştu (`devre_dokumanlari.spool_id`). Bu oturumda UI + erişim:

- **Mobil (`mobile/src/components/isbaslat/IbSpoolDetay.jsx`):** `devre_dokumanlari.spool_id` fetch
  (foto deseninin aynısı) + "📐 İzometri Çizimleri" bölümü + "Aç ↗" (window.open, PWA). Çoklu PDF
  `.map()` ile destekli. Canlı: A-0764'te PDF göründü+açıldı.
- **Web (`spool_detay.html`):** Mevcut "📄 Belgeler" bölümünün İÇİNE "📐 İzometri Çizimleri"
  alt-grubu (ayrı tablo `devre_dokumanlari`, ayrı bucket). `renderBelgeler` genişletildi, akıllı boş
  durum. Canlı: A-000764'te göründü+açıldı (bucket fix sonrası).
- **Endpoint çok-bucket (MK-112.4):** `api/dosya-url-al.js` body'den `bucket` okuyor, allow-list
  (`arespipe-dosyalar` + `devre-belgeleri`), gelmezse default (geriye uyumlu — foto/belge bozulmaz).
  `mobile/src/lib/dosya.js` + `ares-store.js` (web) `dosyaUrlAl(yol, bucket)` 2. param + bucket-duyarlı
  cache key. KÖK NEDEN: izometri `devre-belgeleri`'nde, endpoint hardcoded `arespipe-dosyalar`'a
  bakıyordu → 404 "açılamadı". Çözülünce hem web hem mobil açıyor.

### Öncelik 3 — Uyarılar sayfasında bindirme çelişki uyarıları (MK-112.5)

`uyarilar.html` şu ana dek MOCK veriydi (U001-U005 hardcoded, SYOS). İlk canlı DB bağlantısı eklendi:
`bindirmeUyarilariYukle()` → `dosya_isleme_kuyrugu.parse_sonuc->_eslesme` (izole select, hafif) →
`bindirme_flag_sayisi>0` olan kayıtlardan flag'li alanları çıkarıp "⚖️ Bindirme Çelişkisi" kartı üretir.
Kart: "A-000662 — çap çelişkisi" + "kabuk 4 ↔ PDF 114.3". A planı: yeni kolon/yazma YOK, _eslesme
JSONB okunur. Idempotent. Mock uyarılar dokunulmadan kalır. Canlı: 10 flag'li kayıt mevcut
(M200-355C + M235 formatları).

---

## Commit'ler (112)

| Hash | Mesaj |
|------|-------|
| `32405f6` | fix(112): izometri drenaj — self-chain yerine ic-dongu (MK-112.1) |
| `38a2b29` | fix(112): bekleyen izometri butonu — ardisik drenaj dongusu |
| `f9d12a4` | fix(112): drenaj devre-ozgu — buton sadece o devreyi isler (MK-112.3) |
| `0b0cb9c` | feat(112): spool detayda eslesen izometri PDF — mobil + endpoint cok-bucket (MK-112.3/112.4) |
| `2922aad` | feat(112): web spool detay belgeler bolumunde eslesen izometri PDF |
| `0dfd5ef` | fix(112): web dosyaUrlAl bucket param — izometri PDF acilmasi (MK-112.4) |
| `(yeni)`  | feat(112): uyarilar sayfasi bindirme celiski uyarilari — canli (MK-112.5) |
| `(doc)`   | chore(112): kapanis dokumanlari [skip ci] |

CI: aradaki CI commit'leri (`ci-son-rapor.json [skip ci]`) pull-rebase ile düzgün alındı, çakışma yok.
Vercel: ana proje (arespipe) + mobil proje (arespipe-mob) ayrı deploy ediliyor.

---

## Mimari Kararlar (112)

- **MK-112.1:** Vercel serverless'te fire-and-forget self-chain GÜVENİLMEZ (response sonrası container
  suspend → fetch ölür). Kuyruk drenajı `maxDuration` içinde iç while-döngüsü ile yapılır (maxIs=4,
  maxMs=50sn). Tek-iş mantığı saf fonksiyona ayrılır, res'e dokunmaz.
- **MK-112.2 (backlog/hazır):** Yükleme-sonrası OTOMATİK arka plan drenaj istenirse → Vercel Cron,
  mevcut `drenajTuru` çekirdeğini çağırır. Yeni mantık gerekmez (devreId'siz = global). Bugün
  monte EDİLMEDİ; "araba/roket" — pilot olay-tetikli, gerek yok. Bağlantı noktası hazır bırakıldı.
- **MK-112.3:** Drenaj/erişim devre veya spool-özgü olmalı (kullanıcı bağlamı). Kuyrukta devre_id
  kolonu yok → devre filtresi `devre_dokumanlari` id'leri üzerinden `.in()`. Spool detayda izometri
  = `devre_dokumanlari where spool_id = <spool uuid>`.
- **MK-112.4:** `dosya-url-al` endpoint çok-bucket (allow-list + default geriye uyumlu). Helper'lar
  (web ares-store.js + mobil dosya.js) bucket param + bucket-duyarlı cache key alır. Bucket varsaymak
  yerine path/parametre ile açıkça verilir.
- **MK-112.5:** Bindirme çelişkileri uyarılar sayfasında A planıyla gösterilir — `_eslesme` JSONB
  okunur, yeni kolon/yazma yok, `eslestir`'e dokunulmaz (MK-49.1/109.1).

---

## 113'e Açık Borç (önceliğe göre)

1. **🔴 WIZARD — yeni devre ekleme akışı (DOĞRULANMAMIŞ, kritik olabilir).** 111+112'de Cihat:
   "henüz yeni devre ekleyemiyoruz, sadece mevcuda ilave." Wizard'ın "yeni devre oluştur" yolu
   yarım/yok mu? 113 başında `devre_wizard.html` + yükleme akışı CANLI incelenmeli, bu liste doğrulanmalı.
2. **Mobil YÖNETİCİ ekranında izometri PDF görünmüyor.** İş Başlat (personel) ekranında GÖRÜNDÜ
   (Image kanıt), ama Cihat yönetici ekranında görmedi. İş Başlat + foto-carousel'li ekran grep'te
   AYNI dosya (IbSpoolDetay.jsx) çıktı — ama davranış farklı. Ya farklı bir bileşen var ya yönetici
   bağ olmayan spool'a baktı. TEŞHİS edilmedi. (Not: A-000764 dışında bağ yok — başka spoolda boş
   görünmesi DOĞRU.)
3. **Personel "İş Başlat" ekranına izometri — zaten geldi (kalsın mı?).** Aslında IbSpoolDetay.jsx
   tek dosya olduğu için izometri hem yöneticiye hem personele geldi. Cihat "personele sonra" demişti
   ama saha için faydalı. Kalsın mı / ayrılsın mı kararı.
4. **Bindirme uyarıları "Git →" linki.** uyariKartHtml'de `onclick="navigateUyari(u)"` — u runtime
   scope'ta tanımsız (mevcut mock'larda da kırık olabilir). Link `spool_detay.html?id=<uuid>` olarak
   set edildi ama navigateUyari davranışı doğrulanmadı. Test/düzeltme.
5. **Format öğrenme / manuel_onay oranı.** M200-355C + M235 formatları yüksek oranda manuel_onay'a
   düşüyor (10 flag'li kaydın çoğu). Format envanter UI + öğretme döngüsü (MK-107.x, eski borç).
6. **"Başka tersane klasörü yükledim, olmadı" (Cihat, bu oturum).** Teşhis edilmedi (Cihat "sonra"
   dedi). Muhtemelen M200-355C formatı manuel_onay'a düşüyor (yukarıdaki madde ile aynı kök olabilir).
   113'te: hangi katmanda takıldı — yükleme mi, parse mı, eşleşme mi?
7. **2 yeni lang anahtarı (i18n borcu).** devre_detay: `dv_izo_drenaj_hata`, `dv_izo_drenaj_kismi` +
   spool/uyarı: `sp_izo_baslik`, `sp_izo_ac`, `sp_izo_acilamadi`, `sp_izo_eslesen` — fallback'le
   çalışıyor ama lang/*.json'da yok (TR dışı dilde TR fallback). G-01 i18n.
8. **`_N` alt-spool fallback (MK-110.2 eksiği).** `S01_1` PDF → kök `S01` (pafta eki) — önce birebir,
   yoksa `_N` at + kök dene.
9. **İkiz kolon temizliği** (agirlik/agirlik_kg, durum/is_durumu — MK-108.2). Web spool durum senkronu.

---

## Kritik Hatırlatmalar (112 dersleri)

- **Veriyi gör, varsayma — yine işe yaradı.** Kuyrukta `devre_id` kolonu yok (information_schema ile
  teyit), kolon adı `is_emri_no` (`is_emri` değil — Postgres hint), endpoint hardcoded bucket — üçü de
  varsayım yerine bakılarak yakalandı. JSONB yapısı (`_eslesme.detay[].bindirme[]`) gerçek veriden
  görülüp öyle kod yazıldı.
- **md5 + tek-dosya teyidi her push'ta uygulandı.** cp sonrası git status dosya sayısı doğrulandı,
  md5 indirme sonrası karşılaştırıldı. Yarım push olmadı.
- **Push sırası: pull --rebase → commit → push.** Her push'ta uzaktaki CI commit'i (`ci-son-rapor`)
  autostash + rebase ile temiz alındı.
- **İki ekran karıştırma riski.** Mobilde İş Başlat vs yönetici ekranı baştan ters eşleştirildi;
  grep ile dosya kesinleştirildi. Ekran→dosya eşlemesini varsayma.
- **Mock sayfa tuzağı.** uyarilar.html mock'tu — "küçük ekleme" sandığımız iş aslında "ilk canlı bağ"
  çıktı. Sayfanın canlı mı mock mu olduğunu kod yazmadan kontrol et.
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`. Mobil: `VITE_API_BASE`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

> 113 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
> 113 İLK İŞ ÖNERİSİ: Wizard "yeni devre ekleme" akışını canlı doğrula (Açık Borç 1) — bu büyük bir
> eksik olabilir, netleştirilmeli.
