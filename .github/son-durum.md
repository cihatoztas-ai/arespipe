# Son Durum — 133. Oturum (29 Mayıs 2026)

> 132 hijyen push'undan sonra ilk somut yapım oturumu. **K2 (malzeme listesi çapraz kıyası) v1
> canlı:** `lib/malzeme-kiyas.js` saf fonksiyon + `kuyruk-isle-izometri.js` `eslestir` wiring (5
> noktasal patch, +27 satır). Yeni endpoint yok, migration yok, function 12/12 korundu, MK-49.1
> korundu. Üç MK mühürlendi (MK-133.1/.2/.3). PARSER belgesi Bölüm 7.5 + Bölüm 4.4 notu + Bölüm 8/9
> güncellemeleriyle zenginleştirildi.

---

## Açılış (kısa)

- Git temiz, HEAD `f71342d`, CI yeşil. Function 12/12.
- 132'nin "açılışta hijyen push" maddesi `f234856` ile zaten yapılmış (izometri-oku.js comment-only,
  KARARLAR MK-132.1/.2, PARSER Bölüm 7.4). Re-do değil, verify ve geç.
- Gündem onayı: **K2 baş işi**. Glyph/tanıma defteri kapalı (132'de mühürlendi).

## Yapılanlar (sıra)

### 1. Şekil çıkarımı — koddan, belgeden değil

Üç dosya okuma:

- `l2-parser.js` → PDF `malzeme_listesi[]` satır şekli (kategori/tip, dn|dis_cap_mm, malzeme, kalite,
  tanim, agirlik_kg, adet, boy_mm; `kategori='islem'` direkt yakalanabilir).
- `ares-kabuk.js` → Excel `bom[]` konsolidasyonu (tip, dn, malzeme, tanim, boy_mm/adet, agirlik_kg,
  ifs_kod). `spool_malzemeleri` INSERT şeması (`malzeme` kanonik, `kalite` ham; `tip` boru/fitting).
- `kuyruk-isle-izometri.js` `eslestir` (498-648) → `bindir` çağrı noktası, `_eslesme.detay[]`
  iskeleti (`bindirme_flag` deseni — `malzeme_kiyas` aynı yere oturacak).

**Önemli teyit:** `ARES_NORM` tarayıcı global, **server tarafında yok** (`lib/ares-normalize*` yok,
`api/*` veya `lib/*`'de `malzemeKod` referansı yok). Lib kendi minimal normalizasyonunu yapacak.

### 2. Katman yapısı sorusu — arşivden onay

Cihat'ın "bazı bilgiler formattan bağımsız, bazıları tersane, bazıları gemi özelinde" tarifi 117'de
ilk taşı konan, **118'de mühürlenen 3 katmanlı "en-özel-kazanır" cascade**: Evrensel → Tersane+CAD →
Gemi/proje. Fiziksel karşılığı `katman-birlestirici.js` + `format-paketleri.js` (132'de canlı
koşulduğu doğrulandı). l2-parser merged tek parserKural alır; cascade engine'in önüne girer.

**K2 bu yapının evrensel katmanında oturur:** katman-birleştiriciden geçmiş çıktıyı tüketir, cascade'i
yeniden kurmaz. Tek katman bağımlılığı malzeme/kalite normalizasyonu (evrensel: ARES_NORM/
malzeme_standart_ipucu). Server'da yokluk nedeniyle v1'de minimal normalizasyon (uppercase + boşluk/
diakritik) yeter; kanonik malzeme eşlemesi sonraki rafine.

### 3. Lib v1 — canlı veriyle 3 keşif

Cihat'ın gerçek S02 verisi: `G200-339b-001 S02` devresinden (kuyruk_id `f713eee4...`), **PDF 20
malzeme satırı × Excel 5 spool_malzemeleri satırı**. Naive satır-satır diff yazılıp koşulunca üç
çakıltı:

1. **PDF ham kesim, Excel konsolide.** PDF'te 12 ayrı 323.9 boru parça (her biri ayrı satır), Excel'de
   tek konsolide satır (boy 3239.4mm = parçaların toplamı). K2 önce **PDF'i `grupla` deseninde
   konsolide** etmeli (parça-tipi + cap + et + kalite), sonra kıyaslamalı. Yoksa "11 fazla" gibi
   yanlış 🟡 üretir.
2. **Tanım iki dilde.** PDF Türkçe ("Boru Dikişli Çelik", "Dirsek"), Excel İngilizce ("Pipe Welded
   Steel", "Elbow"). Tanım metni üstünden eşleştirme imkansız. Çözüm: **evrensel parça-tipi sözlüğü**
   (TR + EN), kelime-sınırı eşleşmesi (substring tuzağı: "Steel" içinde "Tee").
3. **Kapsam ayrımı kritik.** İzometri imalat listesi (fab) ≠ Excel BOM (fab + montaj). Flanş/cıvata/
   conta gibi *montaj* parçalar BOM'da olur, PDF'te genelde olmaz — 🟡 değil **info** olmalı. Ayrıca
   **işlem** (kaynak/yiv/lehim, Cihat eklemesi K1) gerçek malzeme değil, kıyastan dışlanır.

### 4. Karşılaştırma kuralları — Cihat onayıyla 3 MK

| Karar | Cihat onayı | Mühür |
|---|---|---|
| Boru → uzunluk; fitting/flanş → adet | ✓ + "işlem (kaynak/yiv) format-bağımsız tanınsın" eki | MK-133.2 |
| Flanş Excel'de var PDF'te yok = montaj, info | ✓ "şimdilik göstermede de olur" | MK-133.1 (kapsam) |
| Boru %7.5 ağırlık sapması = soft sinyal | ✓ (kök bilinmiyor) | (kuralın parçası, MK altında) |
| Dirsek: adet kıyası kapalı, malzeme-korunumu (toplam ağırlık) invariantı | ✓ (Cihat'ın kendi gözlemi: artan parça fire değil geri-stok) | MK-133.3 |
| Excel referans kaynak güvenine bağlı: IFS otorite, manuel parite | ✓ "IFS düşünerek söyledim" | MK-133.1 |

### 5. Lib v3 koşum — S02 fixture canlı doğrulama

```
=== OZET (v3, excel_guven=otorite) ===
eslesen:3 celiski:1 pdf_fazla:0
excel_fazla -> fab:0 montaj:1 belirsiz:0
islem -> pdf:0 excel:0
flagVar (gercek 🟡): true
```

| Sonuç | İçerik |
|---|---|
| ✅ eşleşen (3) | boru 406.4 ✓, boru 323.9 (boy %0.2 ✓, kg %7.5 soft-info), bilezik DN400 ✓ |
| 🟡 çelişki (1) | **dirsek 323.9 — toplam kg: PDF 212.41 vs Excel 35.01 (~6× sapma)** |
| ℹ excel_fazla → montaj | flanş Slip-On DN300 (info) |
| 🟡 excel_fazla → fab | 0 |

**Dirsek bulgusu kayıt altında:** Excel-otorite varsayımıyla "IFS BOM 6 dirsek toplam 35 kg" diyor
(per-elbow 5.84 kg, DN300 için fiziksel olarak imkansız); PDF "her dirsek ~35 kg" diyor (makul).
Üç olası kök (PDF parser bug, Excel parse basis confusion, gerçek BOM hatası) ayırt edilmiyor —
K2 yalın sapmayı yüzeye çıkarıyor, sebep araştırması ayrı iş.

### 6. Wiring — `kuyruk-isle-izometri.js`

5 noktasal patch (+27 satır), `bindir` deseniyle birebir:

| # | Yer | Ne |
|---|---|---|
| 1 | satır 55 | `import { malzemeKiyas } from '../lib/malzeme-kiyas.js'` |
| 2 | satır 531 | `spool_malzemeleri` batch fetch (`.in('spool_id', spoolIds)`) + `malzemeHaritasi` Map |
| 3 | satır 573 | `bindir`'in altında: `const mk = malzemeKiyas(ps.malzeme_listesi, excelBom, { excel_guven: 'otorite' })` |
| 4 | satır 622 | `detay.push({...})` içine `malzeme_kiyas: mk, malzeme_flag: mk.flagVar` |
| 5 | satır 647 | `ozet`'e `malzeme_flag_sayisi: detay.filter(d => d.malzeme_flag).length` |

`node --check` syntax OK. Mevcut hiçbir satır silinmedi.

### 7. Belge zenginleştirme

`docs/PARSER-VE-YUKLEME-AKISI.md` (mevcut yapı bozulmadan):

- **Bölüm 4.4 altına** "133 GÜNCELLEMESİ" notu — adım 2 yapıldı, 7.5'e atıf.
- **Bölüm 7.5 yeni** — K2 v1 canlı, S02 doğrulaması, 3 tasarım kararı, MK-133.1/2/3 mührü, açık
  borçlar.
- **Bölüm 8 K2 satırı** "✓ 133: v1 CANLI (Bölüm 7.5)" güncellemesi.
- **Bölüm 9 MK atıf haritasına** MK-133.1, MK-133.2, MK-133.3 satırları.

## CI Son Durum

- HEAD `f71342d` (132 doc auto). Bu oturumda **push henüz yok** — paket hazırlandı, toplu push 134
  açılışında.
- Function: hâlâ 12/12 (api/*.js sayısı sabit; `lib/` altında yeni dosya).

## Push paketi

| Dosya | Repo yolu | Tür |
|---|---|---|
| `malzeme-kiyas.js` | `lib/malzeme-kiyas.js` | **YENİ** (225 satır) |
| `kuyruk-isle-izometri.js` | `api/kuyruk-isle-izometri.js` | **5 noktasal patch** (+27 satır) |
| `KARARLAR-ekleme-133.md` (içerik) | `KARARLAR.md` (manual append) | MK-133.1 + .2 + .3 |
| `PARSER-VE-YUKLEME-AKISI.md` | `docs/PARSER-VE-YUKLEME-AKISI.md` | Bölüm 4.4 notu + 7.5 yeni + 8 güncel + 9 ek |
| `son-durum.md` | `.github/son-durum.md` | doc |
| `CLAUDE-SON-OTURUM.md` | `CLAUDE-SON-OTURUM.md` | doc |
| `CLAUDE-SONRAKI-OTURUM.md` | `CLAUDE-SONRAKI-OTURUM.md` | doc |

Doc dosyaları `[skip ci]` ile gidebilir; `lib/malzeme-kiyas.js` ve `api/kuyruk-isle-izometri.js`
CI tetikler (kod yolu) — syntax + lint geçmesi beklenir.

## 134'e Açık Borç (önceliğe göre)

1. **Toplu push paketi** (bu oturumun tüm dosyaları).
2. **Live re-parse doğrulama:** S02 dirsek bulgusunun gerçek devre verisinde teyidi. `f713eee4...`
   kuyruk kaydını yeniden parse ettirip `_eslesme.malzeme_flag_sayisi=1` ve `detay[0].malzeme_kiyas`
   üretildiğini gör.
3. **K1+K3 (UI 🟡):** v3 İnceleme ekranında `bindirme_flag` + `malzeme_flag` rozetleri + düzelt popup
   (Bölüm 4.4-3). Function tavanı bağımlı; yeni endpoint yok — mevcut okuma yoluna ekleme.
4. **`excel_guven` otomatik türetme:** Format paketinden / parser_kural'dan kaynak güveni türetilmesi
   (MK-133.1 backlog). Şimdilik sabit `'otorite'`.
5. **Pipeline doğrulama (Bölüm 4.4-1):** POAR header pipeline × `dosyaAdiParse` deterministik kıyas
   (L3 `uyari_dosya_adi` sinyali zaten var ama L2/text-PDF'te yok).
6. **Dirsek bulgusunun kök tespiti:** PDF parser dirsek ağırlık çıkarımının doğruluğu vs Excel BOM
   parse basis'i ayrımı. Yalnız 1 fixture (S02) baktık; 2-3 örnek daha gerekebilir.
7. **Taşınanlar (önceki oturumlardan):** "Montaj Resmi" emekli formatın silinmesi, K5 function
   konsolidasyon, v3 giydirme, 117 (`yukleyen_id`), web-spool sync, fitting (DIN 86087/ASME B16.9),
   `spool_dokumanlari` bağ tablosu.

---

> 134 açılışında: bu dosya + `CLAUDE-SON-OTURUM.md` + `CLAUDE-SONRAKI-OTURUM.md` + PARSER Bölüm 7.5
> + KARARLAR MK-133.1/.2/.3 okunur. **İlk iş: toplu push, ardından canlı re-parse doğrulama.**
