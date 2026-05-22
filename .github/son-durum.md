# Son Durum — 111. Oturum (22 May 2026)

> 110 → 111 geçişi. ANA TEMA: **Boru ölçü zenginleştirme + katman bindirme** (MK-110.3).
> İki parça halinde planlandı, **ikisi de tamamlandı ve canlı doğrulandı.**
> PARÇA 1: kabuk akışının fakir boru ölçüleri IFS'in zengin lookup'ına bağlandı.
> PARÇA 2: eşleşen PDF verisi kabuk spool'a bindiriliyor (survivorship + çakışma flag + PDF↔spool bağı).

---

## Bu Oturumun Sonucu

**111 başarıyla kapandı. İki büyük parça da canlıda çalışıyor.**

110'da keşfedilen "iki ayrı parser" sorunu (kabuk SCH/inç bilmiyor, IFS biliyor) çözüldü:
artık **tek ortak metin parser** (`ares-olcu.js`) var, lookup'ı `ARES_BORU` (ares-asme.js) yapıyor.
Üstüne, eşleşen izometri PDF'inin verisi kabuk spool'a **katman katman bindiriliyor** — Cihat'ın
baştan beri vizyonu olan "Excel + PDF birbirini tamamlasın, çakışmaları gör" mantığı.

---

## YAPILANLAR

### PARÇA 1 — Ortak boyut parser (Karar-B, MK-110.3)

**Kök neden (110'da kanıtlanmıştı):** Üç ayrı boyut-parser vardı —
- `ares-kabuk.js::boyutParse` (FAKİR: SCH/inç bilmez, `4" Sch 10S` → dis_cap=4/et=null)
- `devre_yeni.html::_boyutParcala` (ZENGİN ama inline `_schWT` KOPYASI — ARES_BORU'yu çağırmaz)
- `ares-asme.js` = `ARES_BORU` (tam lookup motoru ama saf, metin parse etmez, kimse çağırmaz)

**Çözüm (Karar 2-B):** Yeni `ares-olcu.js` ortak metin parser. `olcuParse(boyutStr, malzeme)`:
- `"4\" Sch 10S"` → NPS çıkar → `ARES_BORU.npsToDn` → `disCap` + `etKalinligi` → {114.3, 3.05, dn:100, sch:'10S'}
- `"88.9x8.0"` → açık OD x et → {88.9, 8.0}
- `"DN100"` → `ARES_BORU.disCap` → {114.3, null}
- `"OD:60"` → {60, null} (eski kabuk desteğiydi, regresyon önleme)
- `"100 x 114.3"` → {100, null} — **MK-111.1: et ≥ dis_cap olamaz → et iptal** (bonus bug fix)
- dn+sch döndüğü için ağırlık lookup'ı (`agirlikKgM`) da bedava açıldı

**Bağlama:** `ares-kabuk.js::boyutParse` fakir mantığı SİLİNDİ → `ARES_OLCU.olcuParse`'a devredildi.
İki çağrı yeri malzeme alacak şekilde güncellendi. `ARES_OLCU` yüklenmemişse boş+warn (fallback yok,
kopya bırakma). Script sırası: `ares-asme → ares-olcu → ares-kabuk` (devre_wizard.html + devre_detay.html).

**Bonus:** Kabuk artık `spooller.et_kalinligi_mm`'i de dolduruyor — IFS'in bile yapmadığı şey.

**Canlı doğrulama:** Yeni aktarılan A-0759 → DIŞ ÇAP 60,3 / ET 4,50 (eskiden 2,0/—). ✅

### PARÇA 2a — Katman bindirme (MK-111.2)

`eslestir()` (110'da kuruldu, sadece `cizim_durumu` rozeti değiştiriyordu) artık eşleşen PDF
verisini kabuk spool'a BİNDİRİYOR. Yeni `lib/bindir.js` saf çekirdek (`bindir(pdfSpool, kabukSpool)`):

- **Et / Çap:** boşsa doldur; doluysa eşitse geç, **FARKLIYSA flag** (kabuk korunur, sessiz ezme yok)
- **Ağırlık:** |fark|/kabuk ≤ **%3** → sessiz geç (kabuk kalır); > %3 → **flag** + ikisini sakla
- **Yüzey:** kabuk boş + PDF dolu → doldur; ikisi dolu+farklı → flag
- **Yön:** parse'ta kaynak alan YOK → bindirme dışı (backlog/3D, MK-49.A)

Çakışma izi `parse_sonuc._eslesme.detay[].bindirme[]` JSONB'ye (`{alan,kabuk,pdf,secilen,flag,sebep}`).
Şema değişmez (oku-birleştir-yaz). `ozet.bindirme_flag_sayisi` = çelişkili eşleşme sayısı.

### PARÇA 2b — PDF↔spool kalıcı bağı

Migration (CANLI): `devre_dokumanlari.spool_id uuid REFERENCES spooller(id) ON DELETE SET NULL`
+ partial index. Eşleşmede `eslestir()` bunu set ediyor. Spool detay sayfası (UI sonraki oturum)
bu bağdan eşleşen izometri PDF'ine erişecek.

### Canlı Doğrulama (curl ile direkt worker tetik — A-000764)

`POST /api/kuyruk-isle-izometri {is_id}` → `M235-302-101 1(6).S01.1.pdf` →
- Eşleşti: S01 / M235-302-101 → A-000764, bekliyor→kismi (yukseltilen:1)
- Bindirme: et 3.2=3.2 (esit), cap 21.3=21.3 (esit), **agirlik kabuk 3.459 ↔ PDF 4.0 = %15.6 → FLAG**
  (kabuk korundu, ezme yok), **yuzey null → 'Galvaniz' dolduruldu**
- `bindirme_flag_sayisi:1` — ilk gerçek çakışma, doğru flag'lendi ✅
- DB teyit: `spooller A-000764` yuzey='Galvaniz', cizim_durumu='kismi' ✅
- `devre_dokumanlari` spool_id=f19f671c (A-000764) ✅

---

## Commit'ler (111)

| Hash | Mesaj |
|------|-------|
| `a651ad9` | feat(111): ortak boyut parser ares-olcu.js + kabuk SCH/inc lookup (Karar-B, MK-110.3/111.1) |
| `1179a5f` | feat(111): PARCA2a katman bindirme — lib/bindir.js (EKSIK: eslestir baglantisi commitlenmedi) |
| `977207c` | feat(111): PARCA2a eslestir bindirme baglandi — onceki commit eksik kalmisti |
| (doc) | chore(111): kapanis dokumanlari [skip ci] |

CI: ✅ YEŞİL (`97a47a0` #925 yeşil). Vercel Production Current = yeni kod (deploy doğrulandı).

DB: `devre_dokumanlari.spool_id` migration COMMIT'lendi (canlı).

---

## Mimari Kararlar (111)

- **MK-111.1:** Fiziksel kural — et ≥ dış çap OLAMAZ. `"100 x 114.3"` gibi DNxOD notasyonunda
  ikinci sayı et sanılmaz; et iptal. (110'da kanıtlanan bonus bug'ın temiz çözümü.)
- **MK-111.2 (bindirme survivorship):** Eşleşen PDF→kabuk spool bindirme kuralları:
  boş→doldur; et/çap çelişki→flag (kabuk korunur); ağırlık %3 tolerans (üstü→flag);
  yüzey boş→doldur/çelişki→flag. **SESSİZ EZME YOK** — her çakışma `_eslesme.bindirme`'ye saklanır
  (audit). Sektör MDM "survivorship + golden record" disiplininin AresPipe ölçeğine indirgenmiş hali.
- **Karar-B:** Ortak boyut parser ayrı modülde (`ares-olcu.js`), ARES_BORU saf lookup kalır.
  Kabuk + IFS + gelecekteki PDF/STP hepsi tek kapıdan geçer (MK-109.1 ruhu).

---

## Sektör/MDM Araştırması — Alınan Kararlar (Cihat değerlendirmesi)

Cihat başka bir sohbette "benzer sistemler ne öğrenmiş" diye sordu, sonucu AresPipe'a bağladık.
Sektörün BOM reconciliation + MDM (golden record) disiplinleri tam bizim yaptığımız iş.
**Hepsini değil, ölçeğimize uyanı al** kararıyla süzüldü:

**ALINANLAR (3):**
- Minimal survivorship (alan-bazlı kaynak önceliği) → **YAPILDI** (MK-111.2).
- Eşik yönlendirme + kritik alan flag → kısmen var (guven_skoru, manuel_onay zaten çalışıyor;
  bindirme flag eklendi). Uyarılar sayfasında gösterim → borç.
- Yeni format → ilk turlar zorunlu insan incelemesi → **disiplin notu** (kod değil, alışkanlık).

**REDDEDİLENLER (ölçeğimize gereksiz):**
- Sistematik grounding (her değer hangi satırdan) → az format + az hacim → gereksiz.
- Format kayması monitoring panosu → binlerce belge ölçeği için → gereksiz.
- Tam audit trail (kim/ne zaman/neden) → compliance ölçeği → gereksiz. "İkisini sakla + flag" yeter.

**ÖNEMLİ TEŞHİS DÜZELTMESİ:** Sektör cevabı çap=4 sorununu "survivorship yok, son yazan eziyor"
diye okumuştu (MDM lensi). GERÇEK kök parser asimetrisiydi (kabuk SCH/inç bilmiyor) — canlı veriyle
kanıtlandı. PARÇA 1 ile çoğu "çakışma" kayboldu çünkü onlar veri çelişkisi değil parser eksikliğiydi.
Survivorship ihtiyacı, gerçekten iki kaynağın farklı ölçtüğü nadir duruma indi (örn. ağırlık %15.6).

---

## 112'ye Açık Borç (önceliğe göre)

1. **🔴 `Bekleyenleri işle` butonu tetik sorunu.** Endpoint SAĞLAM (curl ile direkt POST → islendi).
   Buton çağrısı ulaşmıyor / fire-and-forget tetik kayıp. 110'dan beri var olan, PARÇA 2 ile ilgisiz.
   "Göz kırpıyor ama ilerleme yok" belirtisi. İlk bakılacak: butonun çağırdığı endpoint + zincirDevam.
2. **Spool detay UI — eşleşen PDF erişimi (2b'nin görünür kısmı).** DB bağı (spool_id) kuruldu;
   spool detay sayfasında "İzometri" linki/önizleme eklenecek. Cihat "sayfa tasarımı sonra" dedi.
3. **Uyarılar sayfasında bindirme flag gösterimi.** `_eslesme.bindirme[].flag=true` olan spool'lar
   (çakışmalı) uyarılar sayfasında görünmeli (vizyon: "eksiği/çelişkisi olan spool").
4. **`_N` alt-spool fallback (MK-110.2 eksiği).** `S01_1` PDF → kök `S01`'e eşleşsin (pafta eki),
   ama `S08_1` gibi gerçek ayrı spool'u bozmadan: önce birebir, yoksa `_N` at + kök dene.
5. **"Tersan M110 Montaj Resmi" format temizliği.** manuel_onay'a düşüyor (düşük güven). Backlog'da.
6. **Test verisi temizliği.** İçeride GERÇEK veri YOK (Cihat: "rastgele spool ekliyorum, yeni devre
   ekleyemiyoruz henüz"). 8ca4a958 vs 387732a0 ikiz devreleri + fakir/mükerrer test spool'ları
   (A-0006xx serisi vb.) topluca silinebilir. Acil değil.
7. **Yön/3D hattı (MK-49.A).** Bindirme yön verisi getirmedi (parse'ta kaynak yok). 3D için yön
   üretimi ayrı iş.
8. **Yeni devre ekleme.** Cihat: "henüz yeni devre ekleyemiyoruz, sadece mevcuda ilave." Wizard
   "yeni devre" akışı eksik olabilir — netleştir.

---

## Kritik Hatırlatmalar

- **Veriyi gör, varsayma (bu oturumun TEKRAR EDEN dersi).** Bu oturumda kolon adlarını birkaç kez
  varsaydım, SQL hata verdi (`devre_id`, `parse_sonuc` yanlış tablo). Her seferinde `information_schema`
  ile doğrulamak gerekti. MK-108.4 hatırla: kolon adı yazmadan information_schema ile teyit et.
- **md5 gözle teyit HAYAT KURTARDI (MK-109.5/MK-51.1).** PARÇA 2 push'unda `cp` eski dosyayı kopyaladı,
  `git status` sadece 1 dosya gösterdi, md5 335bf78 (beklenen 1042fc5c değil) yakaladı → yarım push
  fark edildi, düzeltildi. md5 olmasaydı bindirme canlıda çalışmazdı, sebebini günlerce arardık.
- **Push sırası: migration ÖNCE COMMIT → kod push → deploy.** `devre_dokumanlari.spool_id` koddan önce
  eklendi (kolon yoksa kod hata loglar). Bu oturumda doğru sırayla yapıldı.
- **zsh tuzakları:** `--include=*.html` tırnaksız patlar (`--include="*.html"` kullan). md5/açıklama
  bloğunu komut satırına yapıştırma — `command not found` / `quote>` moduna takılır.
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

> 112 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
