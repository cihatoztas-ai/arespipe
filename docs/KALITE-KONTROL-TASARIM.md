# Kalite Kontrol Bölümü — Kodlama Spesifikasyonu

> **Bu doküman sonraki oturumda Claude Code'a verilecek.** Amaç: soru sormadan, baştan
> sona kodlanabilir bir sözleşme. Mevcut `kalite_kontrol.html` sayfası **terk edilip
> yeniden yazılacak** (eski sayfa "öylesine bulunsun diye" yapılmıştı, kullanışsız ve
> `bekleyen/onaylandi/reddedildi` değerleriyle DB constraint'ini ihlal ediyor).
>
> **Oturum 199 keşfinin çıktısıdır.** O oturumda kod DEĞİŞTİRİLMEDİ — sadece salt-okuma
> keşif yapıldı, mimari netleştirildi, bu sözleşme yazıldı.

---

## 0. ÖNCE OKU — kodlamaya başlamadan zorunlu doğrulamalar

Claude Code bu bölümü atlamadan kodlamaya **başlamaz**:

1. **Şema doğrula** (MK-85.3 / MK-126.8 — asla kolon adı varsayma):
   ```
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name IN ('kk_davetler','kk_davet_spooller','spooller','sayac')
   ORDER BY table_name, ordinal_position;
   ```
2. **Mevcut constraint'i doğrula** (199'da exec_sql ile teyit edildi — yine de bak):
   ```
   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
   WHERE conrelid='kk_davetler'::regclass AND contype='c';
   ```
   199'da bulunan: `kk_davetler_durum_check: durum ∈ {'bekliyor','tamamlandi'}`, default `'bekliyor'`.
3. **Mevcut sayaç desenini oku** — `KK+yıl+sıra` üretimini sıfırdan icat etme; tanımlamalar
   sayfasındaki mevcut seri/sayaç mantığını (`sayac` tablosu + üretici fonksiyon) bul, aynı kalıbı izle.
4. **Mevcut filtre desenini oku** — `kesim.html` / `bukum.html` filtre+seçim mantığı; KK havuzu
   filtresi bununla **aynı** olacak (kullanıcı net söyledi). Yeniden tasarlama, uyarla.
5. **12/12 endpoint tavanı** (MK-129.3) — bu özellik **yeni Vercel endpoint AÇMAYACAK**.
   Her şey client-side `ARES.supabase()` + RLS. PDF üretimi de client-side (bkz. Bölüm 7).
6. **R-10** — implementasyondan önce mockup. Bu doküman içeriği mockup'a temel.

---

## 0.5 Kanonik basamak dizisi ve terminoloji (geçmiş oturum 72/73'ten)

**Tam basamak dizisi (sistem adı → görünür ad):**
```
on_imalat        → Başlamadı
imalat           → İmalat
argon_kaynagi    → Argon Kaynağı     ┐ kaynak basamağı İKİ türdür
gazalti_kaynagi  → Gazaltı Kaynağı   ┘ (spool'a göre biri)
on_kontrol       → Ön Kontrol        ← KK HAVUZU bu basamak
kk               → Kalite Kontrol    ← pakete kilitli (davette)
sevkiyat         → Sevkiyat
```

**MK-72.11 (ZORUNLU terminoloji):** Sistem adları (`on_kontrol`, `kk`, `argon_kaynagi`...)
yalnızca SQL/kodda. UI metinlerinde **görünür adlar** kullanılır (Ön Kontrol, Kalite Kontrol).
Yeni KK sayfasının tüm görünür metinleri bu kurala uyacak.

**MK-71 (doğrulanacak):** `5f23df6` commit'inde "on_kontrol terminal + saha akış kuralı"
geçiyor. Kodlamadan önce KARARLAR.md'de MK-71'i oku — `on_kontrol`'ün özel/terminal bir
davranışı varsa havuz mantığını etkileyebilir.

---

## 1. Amaç ve gerçek saha akışı

### 1.0 Mimari sahiplik — WEB OMURGA, MOBİL İZLEME (oturum 199 kararı)

**KK'nin tek yazma omurgası WEB'dir.** Havuz, davetiye oluşturma, sonuç girme, kapatma —
hepsi `kalite_kontrol.html` (web). Mobil bu akışı **YAZMAZ**.

- **Mobil = salt-izleme** (şimdilik): davet paketlerini ve durumlarını görüntüler, o kadar.
- **İleride (Faz 3, şimdi değil):** mobil yalnızca kontrol esnasında davet paketine **fotoğraf
  veya açıklama** ekleyebilir. Bunun için şema şimdiden hazır olsun (sonradan migration
  gerekmesin): `kk_davet_spooller`'a ileride `foto_yolu text null` eklenebilir — bu oturumda
  EKLENMEZ ama tasarım buna açık tutulur.
- **Gerekçe:** ana omurgayı mobile dağıtmak iki yazan-yüzey yaratır → tutarsızlık/hata. Web
  yazar, mobil okur. İki yüzey **aynı şemayı** okur (junction + `durum`/`sonuc`); senkron
  derdi yoktur çünkü tek yazıcı vardır.

> **Geçmiş bağlam (oturum 58-59):** Mobil `MSpoolDetay.jsx` KK sorguları junction'a +
> `kk_no→davet_no`'ya çevrildi (reconciliation). Ama vanilla `kalite_kontrol.html` bu
> reconciliation'a **dahil edilmedi** — `bekleyen/onaylandi/reddedildi` modeliyle geride
> kaldı, hiçbir zaman DB constraint'iyle (`bekliyor/tamamlandi`) eşleşmedi. Yani eski sayfa
> pratikte ölü. Yeni sayfa junction modelini (mobilin okuduğu aynı yapı) baştan doğru kurar.

### 1.1 Saha akışı

Şirket (tersane müşterisi), imalatı biten spool'lar için **tersaneyi kontrole çağırır**:
"imalatlarınız bitti, gelip kontrol edebilirsiniz." Tersane bir **kalite kontrol uzmanı**
gönderir; uzman imalatı denetler, uygunsa onaylar, değilse hatayı işaretler.

**Kritik saha gerçeği — davet önden gider:** Tersane personeli davet anında hazırda beklemez;
gelmeleri birkaç gün sürer. Bu yüzden şirket, uzmanın gelebileceği süreyi öngörerek
**imalatı tam bitmemiş spool'lar için de** önceden davet gönderebilir. Yani KK daveti
"şu an kontrolde" demek değildir — "bu spool'ları kontrole hazır/uygun gördük" demektir.

**İki katmanlı yapı (kesim/büküm havuz mantığına benzer):**

- **Havuz** = `spooller.aktif_basamak='on_kontrol'` olan spool'lar. "KK aşamasına uygun
  gördüğümüz, davete hazır" spool'lar. Sen (operatör/yönetici) uygun gördüğünü buraya sevk
  edersin (spool_detay / is_baslat / devre_detay üzerinden manuel basamak ilerletme).
- **Davetiye (paket)** = havuzdan filtreyle süzülmüş bir spool grubu, bir takip no ile
  (`KK26-005`) kilitlenir. "Şu numaralı spool'lar kontrole hazırdır, buyurun gelin."

---

## 2. Veri modeli

### 2.1 Mevcut tablolar (199'da doğrulandı)

- **`kk_davetler`** — davet paketi (başlık). `durum ∈ {'bekliyor','tamamlandi'}` (CHECK,
  default `'bekliyor'`). `'bekliyor'` = paket açık; `'tamamlandi'` = paket kapatılmış (arşiv).
- **`kk_davet_spooller`** — junction (paket ↔ spool). `sonuc ∈ {'bekliyor','onay','ret'}`
  (her spool'un kontrol sonucu — paketin durumundan AYRI alan).

> **199'da bulunan asıl bug:** `kalite_kontrol.html` `durum`'u `'bekleyen'` okuyup yazıyordu;
> DB `'bekliyor'` tutuyor → davetler ekrana hiç düşmüyordu. Yeni sayfa kanonik değerleri
> (`bekliyor`/`tamamlandi` + `onay`/`ret`) baştan doğru kullanacak. devre_detay zaten doğru
> (`'bekliyor'` yazıyor) — ona dokunma.

### 2.2 Gereken yeni alanlar (migration)

`kk_davetler` üzerine, mevcut şemada yoksa (önce `information_schema` ile doğrula):

| Alan | Tip | Açıklama |
|------|-----|----------|
| `takip_no` | text | `KK26-005` formatı, sayaçtan üretilir, benzersiz |
| `tersane_id` | uuid (FK tersaneler) | Paketin tersanesi — tek tersane kuralı buradan |
| `olusturma_ts` | timestamptz default now() | Davet oluşturma zaman damgası (otomatik) |
| `kapanis_ts` | timestamptz null | Buton ile kapatılınca damgalanır |
| `pdf_yolu` | text null | Storage'daki davet PDF dosya yolu |
| `olusturan_id` | uuid (FK kullanicilar) | Daveti açan kullanıcı |

`kk_davet_spooller` üzerine, yoksa:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `sonuc_ts` | timestamptz null | Spool onay/ret damgası |
| `hata_notu` | text null | Ret ise hata açıklaması (FAZ 1 — sonuç ekranında girilir) |
| `personel_id` | uuid null (FK kullanicilar) | Hatadan sorumlu personel (FAZ 1 — QR adayından seçilir) |
| `foto_yolu` | text null | Ret fotoğrafı, Storage yolu (FAZ 1). Aynı foto spool galerisine de bağlanır |

> **Oturum 199 kararı:** `hata_notu` + `personel_id` + `foto_yolu` Faz 2'den **Faz 1'e taşındı** —
> sonuç girme ekranının parçası (kullanıcı tik kaldırınca girilir). Faz 2'de kalan tek şey
> personel sayfasındaki **hata raporu gösterimi**.

**Foto → spool galeri bağı:** Ret fotoğrafı o spool'a ait olduğundan spool_detay resim
galerisinde de görünmeli. İki yol: (a) galeri zaten `foto_yolu`'nu KK kaynağıyla okur, veya
(b) mevcut spool-foto tablosu varsa oraya da kayıt düşülür. Kodlamadan önce spool_detay'ın
galeri kaynağını (`information_schema`) doğrula, mevcut desene uy.

**Migration disiplini (MK-98.2):** Her ALTER için `BEGIN/ROLLBACK` dry-run → sayım/etki
doğrula → `COMMIT`. APPLY canlı DB'ye, kod deploy'dan ÖNCE (MK-184.5). Migration dosyasını
arşivle. Yeni CHECK enum'u eklemeden önce `pg_get_constraintdef`.

### 2.3 Faz 2 — `kk_hatalar` tablosu (bu oturumda KODLANMAYACAK, taslak)

Personel bazlı hata takibi için ayrı tablo. **Sonraki ayrı bir iş** (bkz. Bölüm 8).
```
kk_hatalar (
  id uuid pk,
  spool_id text fk,
  davet_id uuid fk kk_davetler,
  personel_id uuid fk kullanicilar,   -- hatadan sorumlu kişi
  hata_notu text,
  tespit_ts timestamptz default now(),
  tenant_id uuid
)
```

---

## 3. Takip numarası ve sayaç

- **Format:** `KK` + yıl (2 hane, örn. 26) + `-` + sıra (3 hane, sıfır dolgulu) → `KK26-005`.
- **Üretim:** mevcut `sayac` tablosu + üretici fonksiyon deseniyle (Bölüm 0.3'te okunacak).
  Yeni icat etme; diğer seri kodlarının (iş emri no vb.) izlediği aynı yolu izle.
- **Listeleme:** Tanımlamalar sayfası → **"Kod, Seri ve Sayaçlar"** bölümünde, diğer seri
  kodlarıyla birlikte görünmeli. Bu bölüme yeni satır eklemek gerekebilir — mevcut listeyi oku.
- **Sıra sıfırlaması:** yıl bazlı mı global mi — mevcut sayaç deseni ne diyorsa ona uy
  (büyük olasılıkla yıl bazlı, ama DB deseni belirleyici).

---

## 4. Sayfa yapısı — üç bölüm (TEK TUTARLI FORMAT)

> **Oturum 199 kararı:** Üç sekmenin (Havuz / Açık Davetiyeler / Arşiv) **tamamı aynı
> açılır devre-grubu + aynı tablo formatını** kullanır. Kart yok — her yerde aynı tablo.
> Görsel referans: `docs/kalite-kontrol-mockup.html`.

**Açılır devre başlığı (her üç sekmede aynı):** tersane · gemi no · devre adı · zone no ·
malzeme · toplam ağırlık · **adet oranı `X/Y`**. Başlığa tıklayınca grup açılır/kapanır.

**`X/Y` oran kuralı:** Y = devrenin TOPLAM spool sayısı (sabit). X = bu sekmede/bağlamda
görünen spool. Havuzda `havuzda 4/20`, davetiyede `bu pakette 15/20`, arşivde `kontrol 14/20`.
Kullanıcı net istedi: "o devrede kaç spool var, kaçı burada görelim."

**Spool tablosu kolonları (devre_detay'daki gerçek tablo — birebir):**
`# · Marka · Rev · Spool ID · Çap · Et · Ağırlık · Malzeme · Kalite · Yüzey`
- Açık Davetiyeler + Arşiv'de son kolon **"Yüzey" yerine "Sonuç"** (onay/ret/bekliyor rozeti).
- **Marka** = tam ad (`NB1137-M120-721-0001-S01`).
- **Spool ID** = standart format, **baştaki iki sıfır gösterilmez** (`A-2205`, `A-000580` değil).
  DB'de zero-padded saklanır (spool identity kuralı), UI'da kırpılır. Mor renk (#534AB7).
- **Malzeme** rozeti (G-05 renkleri): Bakır Alaşım coral, Karbon gray, vb.

Tasarım dili: aktif-devreler tablosu hissi, G-02 Hero+Stat, G-05 malzeme renkleri.
i18n: TR-tek (199 kararı), yeni metinler yine `data-i18n` ile.

### Bölüm A — HAVUZ (`aktif_basamak='on_kontrol'`)
- Yukarıdaki açılır devre tablosu, satırlar **seçilebilir** (checkbox; grup başlığından toplu seçim).
- **Filtre:** kesim/büküm'deki filtre mantığının aynısı — proje / gemi no / tersane / devre.
  Kullanıcı istediği grubu süzer (örn. sadece 1124 gemisi). Sistem ZORUNLU engeli sadece
  **tersane** seviyesinde koyar (Bölüm 6); gemi/proje seviyesi manuel filtre.
- **"Davetiye Oluştur"** butonu → seçili spool'larla davet özet modalı (Bölüm 4.1).

### Bölüm B — AÇIK DAVETİYELER (`durum='bekliyor'`)
- Davet başlığı: `takip_no` · durum rozeti (Bekliyor) · tarih · tersane · spool/devre sayısı
  · PDF linki · **"Sonuç Gir"** butonu.
- Başlık altında **aynı açılır devre tablosu** (son kolon Sonuç). Pakete tıklamadan içeriği görülür.
- **"Sonuç Gir"** → kontrol sonuç ekranı (Bölüm 4.2).

### Bölüm C — ONAYLANANLAR / ARŞİV (`durum='tamamlandi'`)
- Aynı format, kapanmış haliyle: Sonuç kolonu dolu (onay/ret), davet + kontrol tarihleri,
  onay/ret sayıları, PDF erişimi. Salt görüntüleme.

### 4.1 Davetiye oluştur modalı
Seçili spool'ları **devre devre özetler** (kullanıcı net istedi: "hangi devreler, kaç spool,
malzeme, ağırlık, liste"):
- Tek tersane doğrulama satırı (✓ veya engel — Bölüm 6).
- Tablo: devre adı+zone · malzeme · **X/Y spool** · ağırlık.
- Toplam satırı: toplam spool + toplam kg.
- Takip no: "oluşturulunca atanır" (anında üretim — Bölüm 3; vazgeçilirse sayaç tüketilmez).
- "Oluştur · PDF üret · kilitle" → paket + junction + PDF (Bölüm 7) atomik.

### 4.2 Sonuç girme ekranı (KK uzmanı geldiğinde)
> **Oturum 199 kararı — "hata istisnadır" modeli + personel/foto Faz 1'e taşındı.**

- Davetin tüm spool'ları **varsayılan ONAY** (tik işaretli gelir).
- KK uzmanı yalnızca **sorunlu** spool'un tikini kaldırır → o satır **RET** olur + **uyarı çıkar**
  ("Bu spool RET işaretlenecek, personel + foto + açıklama gerekir, devam?").
- Ret satırı açılınca **hata giriş alanı** (ARTIK FAZ 1, Faz 2 değil):
  - **Sorumlu personel seç** — aday liste QR'dan gelir (`is_kayitlari.personel_id` + `islem_tipi`,
    örn. "Ahmet Y. (kaynak · QR)"); nihai seçim elle.
  - **Fotoğraf ekle** — Storage'a yüklenir.
  - **Açıklama** (hata notu metni).
- **Fotoğraf çift bağ:** eklenen foto hem KK hata kaydına hem **spool_detay resim galerisine**
  işlenir (o spool'a ait olduğu için). Bkz. Bölüm 8.
- **"Daveti Kapat"** (buton, MK-126 — otomatik kapanma yok): özet onaylı uyarı
  ("N onay → arşive, M ret → havuza, geri alınamaz"). Onaylanınca:
  - onay → `aktif_basamak` ileri (sevkiyata uygun), junction `sonuc='onay'`
  - ret → `aktif_basamak='on_kontrol'` (havuza döner, tamir, yeni davet)
  - hâlâ bekleyen → havuza döner
  - davet `durum='tamamlandi'`, `kapanis_ts=now()`

---

## 5. Davetiye yaşam döngüsü (durum makinesi)

```
[Havuz: on_kontrol]
      │  kullanıcı spool grubu seçer + "Davetiye Oluştur"
      │  → tersane-tek guard kontrolü (Bölüm 6)
      ▼
[Paket oluştur]  takip_no üret (KK26-005) · durum='bekliyor' · olusturma_ts=now()
      │  junction: seçili spool'lar sonuc='bekliyor'
      │  spooller.aktif_basamak='on_kontrol' → 'kk' (havuzdan çıkar, kilitlenir)
      │  PDF türet (atomik, Bölüm 7) → pdf_yolu kaydet
      ▼
[Açık davetiye: bekliyor]  ← spool_detay/devre_detay'da "KK26-005 ile davette" görünür
      │  kontrolcü gelir (günler sonra), "Sonuç Gir"
      │  her spool: onay → sonuc='onay', sonuc_ts   |   ret → sonuc='ret' + hata_notu, sonuc_ts
      │  (kısmi olabilir — hepsini aynı anda sonuçlandırmak zorunda değil)
      ▼
[Kullanıcı "Daveti Kapat" butonu]
      │  durum='tamamlandi' · kapanis_ts=now()
      │  ONAY alan spool'lar → aktif_basamak ileri ('sevkiyat'a uygun)
      │  RET alan spool'lar  → aktif_basamak='on_kontrol' (havuza döner, tamir, tekrar davet)
      │  Hâlâ 'bekliyor' kalan spool'lar → havuza döner ('on_kontrol')
      ▼
[Arşiv: tamamlandi]
```

**Tamir döngüsü:** Ret edilen spool havuza döner, tamiri yapılır, tekrar davete eklenir →
**YENİ takip no** alır (`KK26-009` gibi). Eski davet bağı junction'da kalır (geçmiş için).

> **MK-126 (otomatik ilerleme YOK):** Sistemde self-advancing/arka plan işlemi yoktur —
> spool'lar park eder, kullanıcı/admin **elle** ilerletir. KK'nin her geçişi (havuz→davet,
> davet→kapanış) buton ile, otomatik tetik YOK. "Tüm spool'lar onaylandı, daveti otomatik
> kapat" gibi bir otomasyon EKLENMEZ — kapanış her zaman kullanıcının "Daveti Kapat"
> butonudur. (Bu, kullanıcının açık talebiyle de örtüşür.)

---

## 6. Tersane-tek kuralı (ZORUNLU GUARD)

Kullanıcı net: **"sadece aynı pakette farklı tersane olursa sistem engellesin."** Diğer
daraltmalar (gemi/proje) manuel filtreyle yapılır, sistem zorlamaz.

**Neden zorunlu:** bir tersanenin verisinin yanlışlıkla başka tersaneye gitmesini önlemek
(güvenlik/gizlilik). Tersane belgesi yanlış tersaneye giderse ciddi sorun.

**Uygulama:** "Davetiye Oluştur" anında, seçili spool'ların tersanesini zincirden türet
(`spooller→devreler→projeler→tersaneler`). Hepsi aynı `tersane_id` değilse → **engelle**,
uyarı göster ("Bir davet paketinde yalnızca tek tersane olabilir. Seçimde N tersane var.").
İşlem iptal, hiçbir şey yazılmaz.

---

## 7. Belge üretimi (PDF)

### 7.1 İç liste (davet listesi)
- **İçerik:** davetteki spool'lar, **devreler halinde** gruplu. Her devre başlığı altında
  o devrenin bu pakete giren spool'ları alt alta.
- **Kısmi oran:** devre başlığında `seçilen / devre_toplam` → örn. devre 20 spool'dan oluşuyor,
  bu pakete 15'i girdiyse **`15/20`**. Sonraki pakette kalan 5 girerse **`5/20`**.
  (Payda = devrenin TOPLAM spool sayısı, pay = bu pakete giren.)
- **Kolonlar:** devre no · spool no · spool_id · malzeme · ağırlık · ölçü/çap · iş emri no
  (devre_detay'da mevcut olan bilgiler — oradan derlenir).

### 7.2 Tersane formu (ayrı belge)
- İç listeden ayrı, tersaneye sunulan resmi form. **Şablon kullanıcıdan gelecek** (oturumda
  yanında değildi). Yapı olarak "bir spool listesi gibi, mevcut bilgilerin derlenmesi."
- **Bu oturumda yer tutucu:** form üretimini fonksiyon olarak hazırla ama nihai layout'u
  kullanıcının vereceği şablona göre sonra şekillendir. Kod yapısı buna izin versin
  (ayrı fonksiyon, değiştirilebilir şablon).

### 7.3 Üretim ve arşivleme — TEKNİK KARAR
- **Ne zaman:** davet paketi oluşturulduğu **an** üretilir (atomik — paket + PDF birlikte doğar).
- **Nerede üretilir:** **CLIENT-SIDE** (tarayıcıda). Yeni Vercel endpoint açmıyoruz (MK-129.3,
  12/12 tavan). Python/reportlab **kullanılmaz** (sunucu tarafı, endpoint gerektirir).
  Tarayıcı PDF kütüphanesi (jsPDF veya pdfmake — mevcut vendor'da var mı önce kontrol et;
  yoksa vendor'a ekle, CDN değil — offline/serverless uyumu için mevcut izometri vendor desenini izle).
- **Nereye saklanır:** üretilen PDF **Supabase Storage**'a yüklenir, `kk_davetler.pdf_yolu`'na
  dosya yolu kaydedilir. Kalıcı arşiv — pakete tıklayınca PDF erişilebilir.
- **Atomiklik notu:** paket insert + junction + PDF üretimi + Storage upload + pdf_yolu update.
  Bir adım başarısızsa kullanıcıya net hata; yarım paket bırakma. (exec_sql ile transaction
  mümkün ama Storage upload transaction dışı — sıra: önce DB kayıtları, sonra PDF; PDF
  başarısızsa pakete "pdf_yolu=null, yeniden üret" düşür, paketi iptal etme.)

---

## 8. spool_detay + devre_detay entegrasyonu

**İddia: spool'un A'dan Z'ye her hareketini takip ediyoruz — bu KK adımı da görünmeli.**

### spool_detay.html
- Spool bir davete bağlıysa: **"`KK26-005` ile kalite davete girdi"** göster.
  (Kaynak: `kk_davet_spooller` junction → `kk_davetler.takip_no`. Ayrı "kilitli" bayrağı
  GEREKMEZ — junction bağı + `aktif_basamak='kk'` zaten kilit demek.)
- **Takip no'ya tıkla → paket içeriği:** ne zaman davet olmuş (`olusturma_ts`), ne zaman
  kontrol edilmiş (`kapanis_ts` / spool `sonuc_ts`), sonuç ne (`onay`/`ret`).
- **Tam tarihçe:** spool birden çok kez davet edilmişse (ret→tamir→tekrar davet), **hepsi**
  görünür: `KK26-005 (ret, "kaynak hatası") → KK26-009 (onay)`. Junction tüm bağları tutar;
  gösterim TAM tarihçe (son değil). Ret notları dahil.

### devre_detay.html
- Devrenin spool'larının KK durumları (hangi spool hangi pakette, hangi sonuç).
- Mevcut sayfada KK davet gösterimi var (496 civarı) — onu yeni modele uyarla.

---

## 9. Personel hata RAPORU (FAZ 2 — daraltıldı, bu oturumda kodlanmayacak)

> **Oturum 199'da kapsam değişti:** Hata GİRİŞİ (personel seç + foto + açıklama) Faz 1'e
> taşındı (Bölüm 4.2). Faz 2'de kalan TEK iş: bu kayıtların **personel sayfasında raporlanması**.

Faz 1'de her ret, `kk_davet_spooller`'a (`personel_id`, `hata_notu`, `foto_yolu`) yazılır.
Faz 2 bunları kişi bazında toplayıp gösterir:
- Opsiyon A: ayrı `kk_hatalar` tablosu (Bölüm 2.3) — sorgu/rapor kolaylığı için denormalize.
- Opsiyon B: doğrudan `kk_davet_spooller WHERE sonuc='ret'` üstünden personel bazlı agrega.
- **kullanıcı_detay** sayfasında o kişinin biriken hata kayıtları (hangi spool, hangi davet,
  hangi hata, tarih, foto). Kullanıcı bu dokümanı personel sayfasını düzenlerken verecek.

**QR→personel kaynağı (Faz 1'de zaten kullanılıyor):** `is_kayitlari.personel_id` + `islem_tipi`
(oturum 72/73'te kanıtlı şema) — bir spool'da kim işlem yaptıysa aday olarak sunulur.

---

## 10. Kodlama başlangıç kontrol listesi (özet)

- [ ] `information_schema` ile 4 tablonun gerçek şemasını çıkar (Bölüm 0.1)
- [ ] KARARLAR.md'de **MK-71** (`on_kontrol terminal`) ve **MK-72.11** (görünür ad kuralı) oku
- [ ] `is_kayitlari` şemasını teyit et (Faz 2 personel kaynağı: `personel_id`, `islem_tipi`)
- [ ] `kk_davetler` CHECK constraint'i teyit et (`bekliyor`/`tamamlandi`)
- [ ] Mevcut sayaç deseni + tanımlamalar "Kod/Seri/Sayaçlar" bölümünü oku
- [ ] kesim/bukum filtre+seçim desenini oku (havuz filtresi buna göre)
- [ ] Vendor'da client-side PDF kütüphanesi var mı kontrol et (yoksa vendor'a ekle)
- [ ] Migration: yeni alanlar (Bölüm 2.2) — BEGIN/ROLLBACK dry-run → APPLY → arşivle (MK-98.2/184.5)
- [ ] R-10: mockup yap, kullanıcıya göster, onay al → sonra implementasyon
- [ ] 12/12 endpoint tavanı korunuyor (yeni endpoint YOK) — doğrula
- [ ] Yeni metinler `data-i18n` ile (TR-tek değer, ama anahtar hazır)
- [ ] Eski `kalite_kontrol.html`'i yeni modelle değiştir; `bekleyen/onaylandi/reddedildi`
      değerlerini tamamen kaldır
- [ ] A-002210'un çift davet kaydı: yeni guard kurulunca tek UPDATE ile temizle (MK-98.2)
- [ ] spool_detay + devre_detay entegrasyonu (Bölüm 8)
- [ ] Faz 2 (personel hata) bu oturumda DEĞİL — Bölüm 9 sonraki işe bırakıldı

---

## EK — Oturum 199'da netleşen kararlar (özet)

1. Eski `kalite_kontrol.html` terk → yeniden yaz (yanlış durum modeli + kullanışsız UI).
2. Kanonik durum: `kk_davetler.durum ∈ {bekliyor, tamamlandi}` (DB constraint dayatıyor).
   Onay/ret detayı `kk_davet_spooller.sonuc ∈ {bekliyor, onay, ret}` — AYRI katman.
3. Havuz (`on_kontrol`) = davete hazır; davet (`kk`) = pakete kilitli. İki katman, kasıtlı.
4. Davet önden gidebilir (imalat tam bitmeden) — saha gerçeği, sistem buna izin verir.
5. Tek zorunlu guard: **tersane-tek**. Gerisi manuel filtre.
6. Davet **butonla** kapanır; kalan/ret spool havuza döner; tekrar davet → yeni no.
7. PDF: paket oluşumuyla atomik, client-side üretim, Supabase Storage arşiv.
8. spool_detay: tam KK tarihçesi (ret notları dahil, son değil).
9. Hata girişi (personel+foto+açıklama) Faz 1'e taşındı; "hepsi varsayılan onay, tik kaldır =
   ret" modeli. Ret fotoğrafı spool_detay galerisine de bağlanır.
10. Üç sekme (Havuz/Açık/Arşiv) TEK tutarlı açılır-devre tablosu formatı; başlıkta X/Y oran.
11. Spool ID UI'da iki sıfır kırpılır (`A-2205`); DB zero-padded. Tablo kolonları devre_detay
    ile birebir (#·Marka·Rev·SpoolID·Çap·Et·Ağırlık·Malzeme·Kalite·Yüzey/Sonuç).
12. Davetiye oluştur modalı devre-devre özet (devre·malzeme·X/Y·ağırlık·toplam).
13. i18n TR-tek (199 kararı), anahtarlar yine de `data-i18n` ile yazılsın.
14. Faz 2 daraltıldı: sadece personel sayfasında hata raporu gösterimi.
