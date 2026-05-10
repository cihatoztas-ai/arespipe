# BRIEFING-72.md — AresPipe 72. Oturum Açılış

**Tarih**: 10 Mayıs 2026 (UTC saatinde geç vakit)
**Önceki oturum**: 71 — kapanışı doğrulanmamış, açık konularla bitti
**Bu oturumun amacı**: Saha akışı mimarisini final haline getirmek (Cihat 71 final v3)

---

## 🚨 İLK İŞLER (yeni Claude'un ilk turn'da yapacakları)

1. **Sağlık scripti**: `bash docs/oturum-saglik.sh 72`
2. **Pending push doğrula**: `cd ~/Desktop/arespipe && git log --oneline -5`
   - `ca11743 fix(71): saha akis kurali...` görmeli misin? Bu LOCAL'de duruyor ama PUSH EDILMEMIŞ.
3. **Push'u tetikle**: `git pull --rebase origin main && git push origin main`
4. **Vercel deploy yeşil mi**: https://vercel.com/cihatoztas-ais-projects/arespipe-mob/deployments
5. **Saha test başlat** (aşağıdaki "Doğrulanmamış 71 davranışı" bölümü)
6. Sonra SED-72-01'e geç

---

## 71'in son durumu (NET ÖZET)

### ✅ 71'de tamamlanan işler

- **SED-71-01**: 70b.A RLS hata sonrası is_kayitlari INSERT doğrulandı
- **SED-71-02**: Migration 034 (`is_kayitlari` RLS get_tenant_id pattern) repo'da
- **SED-71-04**: Mobile 3f.3 sonraki basamak drawer (4 hotfix sonrası çalışır halde)
- **SED-71-05**: Web `devre_detay.html` `is_durumu` okuma + kaynak alias
- **SED-71-06 [yeni]**: Migration 035 (`basamak_tanimlari` multi-tenant policy temizlik)

### ⚠️ 71'in 4 hotfix turu (her biri DB veya kod fix'i)

1. `3727cd8` — feat: 3f.3 ilk versiyon (sonra fail oldu)
2. `b145133` — fix: drawer useT() pattern (`react-i18next` → `lib/i18n`)
3. `1334f35` — fix: `is_kayitlari` UPDATE'ten `sure_dakika` kaldır (GENERATED column)
4. `ca11743` — fix: saha akış kuralı + on_kontrol terminal + RLS migration 035 ❗ **PUSH EDİLMEDİ**

### ⚠️ Doğrulanmamış 71 davranışı (yeni Claude'un test ettireceği şey)

`ca11743` push edildikten + Vercel deploy yeşili sonrası saha test:

**Test 1 (drawer çalışma):**
1. Mac Chrome → DevTools → Application → Clear site data (mutlaka, eski bundle önlemi)
2. demo.imalatci@arespipe.dev / Demo1234!
3. Yeni Bekliyor spool seç → İşe Başla → 1dk bekle
4. İşi Kapat → Tamam, kapat
5. **Beklenen drawer**: tek "İmalat" butonu (çünkü spool şu an `aktif_basamak='on_imalat'`)
6. "İmalat" seç → Hub'a navigate

**Test 2 (drawer 3 buton):**
1. Aynı spool tekrar seç (artık `imalat`/`bekliyor`) → İşe Başla
2. İşi Kapat → drawer 3 buton: **Argon Kaynağı (mavi) / Gazaltı Kaynağı / Ön Kontrol**
3. KK ve Sevkiyat YOK olmalı (saha akış kuralı)
4. "Argon Kaynağı" → Hub'a → DB'de `aktif_basamak='argon_kaynagi'`

**Test 3 (on_kontrol terminal):**
1. Spool'u SQL ile `on_kontrol`/`devam_ediyor` durumuna çek (manuel)
2. Demo İmalatçı ile o spool'u aç → İşi Kapat → Tamam, kapat
3. **Beklenen**: drawer **AÇILMAZ**, direkt Hub'a (terminal davranış)

Üç test geçince 71 KAPATILABİLİR.

---

## 🏛️ MİMARİ KARARLAR (KARARLAR.md güncelleme)

### 71'in MK kararları (eklendi)

- **MK-71.1**: Mobile basamak adları DB-driven (`basamak_tanimlari.gorunen_ad{,_en,_ar}`), i18n'a hardcode YOK
- **MK-71.2**: Kaynak alt-tipleri `aktif_basamak` text kolonuna direkt yazılır. Tablo gösteriminde `/kaynak/i` prefix normalize → "Kaynak" alias
- **MK-71.3**: `lib/i18n` `useT()` pattern: `{ tv, dil, setDil, mevcutDiller }`. `react-i18next` projeye eklenmemiş, KULLANMA
- **MK-71.4**: PostgreSQL GENERATED kolonlar (`is_kayitlari.sure_dakika`) frontend'de manuel set edilmez; UPDATE/INSERT payload'una dahil edilmez
- **MK-71.5**: PostgreSQL RLS permissive policy'leri OR mantığıyla birleşir; bir `qual=true public` policy diğer tenant filterlerini bypass eder. **Asla yapma**
- **MK-71.6**: Akış kural matrisi kodda hardcoded (saha senaryosu net). 73+'da `basamak_tanimlari.olasi_sonraki` JSON kolonu

### 72'de uygulanacak yeni MK kararları (Cihat onaylı)

- **MK-72.1 [DB]**: Kaynak alt-tipleri DB'ye taşınacak. Yeni tablo `kaynak_alt_tipleri` (sistem_adi, gorunen_ad, gorunen_ad_en, gorunen_ad_ar, sira, aktif). Tenant-scoped, RLS get_tenant_id() pattern.
- **MK-72.2 [SAHA AKIŞ]**: Alıştırma kontrolü mobile sahada uygulanır:
  - `spooller.alistirma = true` ise:
    - İmalatçı drawer'ında "Kaynak yok, direkt ön kontrole" seçeneği vurgulanır (badge veya öncelik)
    - Eğer imalatçı yine kaynak (argon/gazaltı) seçerse → kaynakçı sayfasında uyarı drawer
    - "İşe Başla" butonu pasif kalır
- **MK-72.3 [DRAWER UX]**: İmalatçı drawer'ında **vazgeç YOK**, seçim zorunlu. Mevcut davranış korunur (zaten yok).
- **MK-72.4 [GÖRÜNÜM]**: Saha kullanıcısına her yerde `gorunen_ad` gösterilir, sistem_adi DEĞİL. Admin sayfalarında (firma_detay) `sistem_adi` görünür kalsın.
- **MK-72.5 [BAŞLANGIÇ DURUMU]**: Yeni spool insert'inde `aktif_basamak='on_imalat'` (Görünen ad: "Başlamadı"). Bu doğru. İmalatçı QR okuttuğunda `on_imalat → imalat` otomatik geçiş gerekli (3e iseBasla'da).

---

## 📋 SED-72 KUYRUĞU (sıralı, kabul kriterleri ile)

### SED-72-01: `kaynak_alt_tipleri` tablosu + seed
**Süre**: ~30dk
**Adımlar**:
1. Migration 036 yaz: tablo şeması + RLS policy (`get_tenant_id()` pattern)
   ```sql
   CREATE TABLE kaynak_alt_tipleri (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id uuid NOT NULL REFERENCES tenants(id),
     sistem_adi text NOT NULL,  -- 'argon_kaynagi', 'gazalti_kaynagi'
     gorunen_ad text NOT NULL,  -- 'Argon Kaynağı'
     gorunen_ad_en text,
     gorunen_ad_ar text,
     sira int DEFAULT 0,
     aktif bool DEFAULT true,
     olusturma timestamptz DEFAULT now(),
     UNIQUE(tenant_id, sistem_adi)
   );
   -- RLS aç + policy: kaynak_alt_tipleri_tenant ALL get_tenant_id()
   -- Seed: Cihat'ın tenant_id için 2 satır (argon, gazaltı)
   ```
2. Studio'da uygula (test) + repo'ya commit
**Kabul**: `select * from kaynak_alt_tipleri where tenant_id = '00000000...0001'` → 2 satır

### SED-72-02: Drawer alt-tipleri DB'den çeksin
**Süre**: ~30dk
**Bağımlılık**: SED-72-01
**Adımlar**:
1. `mobile/src/lib/basamak-akisi.js`'ten `ALT_TIP_ETIKETLERI` hardcoded'ı sil
2. Yeni async fonksiyon `kaynakAltTipleriniGetir(supabase)` ekle
3. `sonrakiBasamaklar()` artık async olmalı (alt-tipleri DB'den çek)
4. `IbSpoolDetay.jsx`'te `handleKapatOnayli` güncelle: `await kaynakAltTipleriniGetir`
**Kabul**: Drawer "Argon Kaynağı / Gazaltı Kaynağı" gösteriyor (DB'den)

### SED-72-03: 3e iseBasla `on_imalat → imalat` otomatik geçiş
**Süre**: ~20dk
**Adımlar**:
1. `IbSpoolDetay.jsx` veya hub'da `handleIseBasla` fonksiyonunu bul (tahminim 580-600 satır civarı)
2. UPDATE payload'una ekle:
   ```js
   const yeniBasamak = yerelSpool.aktif_basamak === 'on_imalat'
     ? 'imalat'  // İmalatçı QR okuttu, otomatik imalat'a geç
     : yerelSpool.aktif_basamak  // diğer durumlarda dokunma
   ```
3. UPDATE: `{ is_durumu: 'devam_ediyor', aktif_basamak: yeniBasamak, ... }`
**Kabul**: Demo İmalatçı yeni Bekliyor spool'a İşe Başla → DB'de `aktif_basamak='imalat'`

### SED-72-04: `spooller.alistirma` kolonu kontrolü
**Süre**: ~15dk
**Adımlar**:
1. Studio'da kontrol: `\d spooller` veya `select column_name from information_schema.columns where table_name='spooller'`
2. `alistirma` kolonu YOKSA migration 037 yaz: `ALTER TABLE spooller ADD COLUMN alistirma bool DEFAULT false`
3. VARSA: hangi spool'larda true olduğunu doğrula
**Kabul**: kolon var, default false

### SED-72-05: Alıştırma kontrolü — imalatçı drawer'ında öncelikleme
**Süre**: ~1sa
**Bağımlılık**: SED-72-02 + SED-72-04
**Adımlar**:
1. `basamak-akisi.js`'te `sonrakiBasamaklar()` opsiyonel `alistirma` parametresi al
2. `alistirma=true` ise drawer'da **Ön Kontrol** primary mavi yapılsın (Argon/Gazaltı yine listede ama secondary)
3. Veya bilgilendirme metni: "Alıştırma — kaynak gerekmez, önerilen: Ön Kontrol"
4. Drawer prop olarak `alistirma` kabul etsin
5. `IbSpoolDetay.jsx`'te `yerelSpool.alistirma` parametre olarak geçsin
**Kabul**: alistirma=true spool için drawer açılır, "Ön Kontrol" mavi

### SED-72-06: Alıştırma kontrolü — kaynakçı sayfasında uyarı + işe başlat pasif
**Süre**: ~1.5sa
**Bağımlılık**: SED-72-04
**Adımlar**:
1. `IbSpoolDetay.jsx`'te `aktifRol.ad` kaynakçı VE `yerelSpool.alistirma=true` VE `yerelSpool.aktif_basamak` kaynak alt-tipi ise:
   - Sayfa açılışında uyarı drawer (`IbUyariDrawer` benzeri) çıksın
   - Mesaj: "BU SPOOL ALIŞTIRMA — KAYNAK YAPILMAZ. Lütfen vardiya amirinizle görüşün."
   - "İşe Başla" butonu disabled
2. Yeni i18n anahtarları (3 dil): `m_ib_uy_alistirma_kaynak_baslik`, `m_ib_uy_alistirma_kaynak_mesaj`
**Kabul**: alıştırma=true + argon/gazaltı kaynakçı için işe başlat pasif

### SED-72-07: Saha kullanıcılarına gorunen_ad gösterimi denetimi
**Süre**: ~30dk
**Adımlar**:
1. Mobile'da grep: `grep -rn "aktif_basamak\|sistem_adi" mobile/src/`
2. `sistem_adi`'nin doğrudan gösterildiği yerleri tespit et
3. `basamakAdi(b, dil)` veya analog mapping kullan
4. Web saha kullanıcılarına dönük sayfalar var mı? (Tezgahlar) — kontrol et
**Kabul**: Mobile/saha web'inde sistem_adi text olarak gözükmüyor

---

## 📊 KRİTİK BİLGİ HARİTASI

### Saha akış kuralı (Cihat 71 final v3)

```
on_imalat (Başlamadı)  →  imalat              [SED-72-03 ile otomatik geçiş]
imalat                 →  argon | gazaltı | on_kontrol  (KK, Sevkiyat YASAK)
argon_kaynagi          →  gazaltı | on_kontrol           (KK, Sevkiyat YASAK)
gazalti_kaynagi        →  argon | on_kontrol             (KK, Sevkiyat YASAK)
on_kontrol             →  []  TERMINAL — saha biter, web devralır
```

KK ve Sevkiyat **mobile'da hiç gözükmez** (web tarafı yönetir).

### Saha durum diagram

```
Yeni spool insert   →  aktif_basamak='on_imalat', is_durumu='bekliyor'
                       Tabloda: "Başlamadı" (nokta yok)

İmalatçı QR okuttu  →  aktif_basamak='imalat',    is_durumu='devam_ediyor'
                       Tabloda: "İmalat" + 🟢 nokta

İmalatçı bitirdi    →  drawer açılır, seçer:
                         Argon/Gazaltı/Ön Kontrol
                       aktif_basamak={seçim},      is_durumu='bekliyor'
                       Tabloda: "Kaynak" / "Ön Kontrol" (nokta yok)

Argoncu QR okuttu   →  aktif_basamak='argon_kaynagi', is_durumu='devam_ediyor'
                       Tabloda: "Kaynak" + 🟢 nokta

Argoncu bitirdi     →  drawer açılır, seçer:
                         Gazaltı/Ön Kontrol
                       (similar to imalat)

Önkontrolcü bitirdi → drawer AÇILMAZ
                       aktif_basamak='on_kontrol' kalır
                       is_durumu='bekliyor'
                       SAHA TERMINAL — web devralır
```

### `basamak_tanimlari` tablosu (Cihat'ın tenant_id'i için)

```
sira  sistem_adi   gorunen_ad        ilerleme_puani
1     on_imalat    Başlamadı         0
2     imalat       İmalat            30
3     kaynak       Kaynak            30
4     on_kontrol   Ön Kontrol        20
5     kk           Kalite Kontrol    10
6     sevkiyat     Sevkiyat          10
```

**Toplam**: 100/100 puan ✓

### `aktif_basamak` text kolonu (enum DEĞİL)

`spooller.aktif_basamak` text kolonu — istenen değer yazılabilir. `argon_kaynagi`, `gazalti_kaynagi` gibi değerler `basamak_tanimlari`'nda satır olmasa da yazılabilir. **Tablo görünümünde** `kaynakAltTipiMi(s) || s` ile "Kaynak" alias'ına normalize ediliyor.

### RLS durumu (canlı DB'de)

- `is_kayitlari`: ✅ migration 034 sonrası `get_tenant_id()` pattern, RLS doğru
- `basamak_tanimlari`: ✅ migration 035 sonrası tek policy `basamak_tenant`, multi-tenant sızma kapatıldı
- `spooller`: zaten doğru pattern (önceki turlardan)
- `kaynak_alt_tipleri`: SED-72-01 ile yeni tablo, RLS lazım

### Mobile drawer mimarisi (mevcut)

```
IbSonrakiBasamakDrawer
├── props: acik, basamaklar, onSec, yukleniyor
├── tek ekran (alt drawer kaldırıldı)
├── overlay onClick yok (atla yok, seçim zorunlu — MK-72.3)
└── basamaklar.map → button (ilki primary mavi)
```

`basamak-akisi.js`:
```
sonrakiBasamaklar(aktifBasamak, liste)
  → AKIS_KURAL_MATRISI[aktifBasamak] kodlari
  → her kod için liste'de ara, yoksa ALT_TIP_ETIKETLERI fallback (HARDCODED — SED-72-02 ile DB-driven olacak)
  → return [{sistem_adi, gorunen_ad, gorunen_ad_en, gorunen_ad_ar}, ...]
```

### `IbSpoolDetay.jsx` kritik fonksiyonlar (satır numaraları)

- `handleKapatOnayli` ~639: spool kapatma + drawer açma
- `handleSonrakiBasamakSec` ~743: drawer'dan basamak seçimi
- `<IbSonrakiBasamakDrawer>` JSX render ~970
- `<IbUyariDrawer>` JSX render ~960 (alıştırma uyarısı buraya benzer)

---

## 🔧 TEST ORTAMI

- **Mobile**: https://arespipe-mob.vercel.app
- **Web**: https://arespipe.vercel.app (devre_detay'da spool kontrolu)
- **Login**: demo.imalatci@arespipe.dev / Demo1234!
- **Tenant ID**: `00000000-0000-0000-0000-000000000001` (Cihat firmasi)
- **Mac path**: `/Users/cihatoztas/Desktop/arespipe`
- **Studio**: SQL Editor için her yeni session öncesi `select get_tenant_id()` ile context kontrol edilebilir
- **Cache temizleme zorunlu**: Mac Chrome → DevTools → Application → "Clear site data" her test öncesi

---

## ⚠️ TUZAKLAR (yeni Claude'un takılmaması için)

1. **`react-i18next` kullanma** — proje wrapper'ı `lib/i18n` `useT()` (MK-71.3)
2. **GENERATED kolonlar** — `sure_dakika` frontend'de hesaplanmaz/gönderilmez (MK-71.4)
3. **RLS permissive policy** — yeni policy eklerken `qual=true public` ASLA (MK-71.5). Hep `get_tenant_id()` pattern.
4. **Service worker stale bundle** — Mac Chrome'da Application → Clear site data zorunlu (PWA'da skipWaiting yok henüz, SED-71-09 olarak duruyor)
5. **`aktif_basamak` text kolonu** — enum değil, istenen değer yazılabilir
6. **Push reject loop** — CI bot tekrar push atıyor, normal. `git pull --rebase && git push` çöz.
7. **Lang dosyaları** — kök `lang/` editlenir, `mobile/src/lang/` build script üretir (MK-68.5)
8. **Vercel projeler 2 adet** — `arespipe` (web) ve `arespipe-mob` (mobile). Mobile commit'lerinin mob deploy'una bakılmalı.

---

## 📝 SED KUYRUĞU (71'den DEVAM EDEN)

- **SED-71-08 [yapılmadı]**: iPhone Safari PWA service worker auto-update
- **SED-71-09 [yapılmadı]**: `basamak_tanimlari.olasi_sonraki` JSON kolonu (kural matrisi DB'ye)
- **SED-71-10 [yapılmadı]**: Web `spool_detay.html`'e mobile 3f.3 pattern (web tek-yönlü "Sonraki Basamak" şu an mobile ile uyumsuz)
- **SED-71-11 [yapılmadı]**: Yetki sistemi `bloklar` tablo değil — Bilgi Haritası'na açıklama notu

72'nin asıl kuyruğu yukarıdaki SED-72-01 → SED-72-07. Bunlar bitmeden 71'in eski borçlarına dönülmez.

---

## 💬 İLK MESAJDA YENİ CLAUDE'A NE DİYECEĞİM (Cihat)

Yeni oturum açılışında Cihat şunu yazacak:

> "72 oturumuna başlıyoruz. BRIEFING-72.md'yi project knowledge'da bul ve oku. Sonra git log'a bak — `ca11743` push'lı mı? Push edilmediyse pull-rebase + push yap. Sonra Vercel deploy yeşilini bekle, ben saha test yaparken sen SED-72-01'in migration 036'sını yaz."

Veya project knowledge'da BRIEFING-72.md varsa doğrudan o kurala göre devam.

---

## 🎯 71 KAPANIŞI İÇİN HÂLÂ AÇIK 1 İŞ

`ca11743` commit local'de duruyor, push edilmedi. Sebep: oturum açılış doğrulamasının test'i yapılmadı. **72'nin ilk dakikalarında** push edilmeli + saha test yapılmalı. Sonuçlar 72 BRIEFING'in en altına eklenir, 71 kapatılır.

