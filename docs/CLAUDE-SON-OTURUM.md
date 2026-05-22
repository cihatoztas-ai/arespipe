# CLAUDE — Son Oturum Özeti (Oturum 111, 22 May 2026)

## Özet
ANA TEMA iki parçaydı, ikisi de bitti ve CANLI doğrulandı. **PARÇA 1:** 110'da keşfedilen "üç ayrı
boyut-parser" sorunu çözüldü — yeni `ares-olcu.js` ortak metin parser, lookup'ı `ARES_BORU`
(ares-asme.js) yapıyor; kabuk akışı artık `4" Sch 10S` → 114.3/3.05 üretiyor (eskiden 4.0/null).
**PARÇA 2:** eşleşen izometri PDF verisi kabuk spool'a bindiriliyor (et/çap/ağırlık/yüzey, %3 ağırlık
toleransı, çakışma flag, sessiz ezme yok) + PDF↔spool kalıcı bağı (`devre_dokumanlari.spool_id`).
İlk gerçek çakışma canlıda yakalandı (A-000764 ağırlık %15.6 → flag, kabuk korundu, yüzey doldu).

Yan keşif: `Bekleyenleri işle` butonu tetik sorunu (endpoint SAĞLAM, buton ulaşmıyor) — 110'dan beri
var, PARÇA 2 ile ilgisiz, 112'ye devredildi.

## 1) ares-olcu.js — YENİ, ortak boyut/ölçü metin parser (PARÇA 1, Karar-B)
- `olcuParse(boyutStr, malzeme)` → {dis_cap, et, dn, sch}. Öncelik: NPS+Sch → ODxet → OD: → DN → tek sayı.
- NPS+Sch dalı `ARES_BORU.npsToDn/disCap/etKalinligi` çağırır (MK-109.1: yeniden yazma, çağır).
- MK-111.1: ODxet'te ikinci sayı ≥ ilk sayı ise et iptal (et dış çaptan büyük olamaz). `100 x 114.3`→{100,null}.
- `OD:60` dalı eski kabuk desteğiydi, regresyon önleme için korundu.
- `agirlikKgM(dn,sch,malzeme)` bonus — dn+sch çözüldüğü için ağırlık lookup'ı da bedava.
- ARES_BORU runtime resolve: `_boru()` (window/globalThis). Node testte `require('./ares-asme.js')` globalThis'e yazar.
- Birim test: 13/13 (4" Sch 10S, 88.9x8.0, DN100, OD:60, 100x114.3 bonus bug, negatifler).

## 2) ares-kabuk.js — boyutParse → olcu delegasyonu (PARÇA 1)
- Fakir DN-tablosu + parseFloat mantığı SİLİNDİ. `boyutParse(dn, malzeme)` → `ARES_OLCU.olcuParse`.
- İki çağrı yeri malzeme alıyor: `boyutParse(anaBoru.dn, anaBoru.malzeme)`, `boyutParse(b.dn, b.malzeme)`.
- ARES_OLCU yoksa boş+warn (sessiz fallback YOK — kopya bırakma disiplini).
- Bonus: spooller.et_kalinligi_mm artık doluyor (IFS bile yapmıyordu).
- Birim test: ARES_KABUK.boyutParse 6/6 (olcu üzerinden).

## 3) devre_wizard.html + devre_detay.html — script sırası (PARÇA 1)
- `ares-asme.js` + `ares-olcu.js`, `ares-kabuk.js`'ten ÖNCE eklendi. Eskiden ares-asme HİÇ yüklü değildi
  (kabuk fakir tablosuyla idare ediyordu). grep ile ares-kabuk yükleyen sadece bu 2 sayfa olduğu teyit.
- devre_detay zaten ARES_KABUK'a tam devrediyordu (_onayBoyut/_onayGrupla/onayAktar ince alias) — sadece tag.

## 4) lib/bindir.js — YENİ, saf bindirme çekirdeği (PARÇA 2a)
- `bindir(pdfSpool, kabukSpool)` → {degisiklik, bindirme[], flagVar}.
- Gerçek parse alan adları: et_mm, cap_mm, agirlik_kg, yuzey (canlı parse_sonuc'tan görüldü, varsayılmadı).
- Kurallar MK-111.2. AGIRLIK_TOLERANS=0.03. Birim test: 10/10 (boş→doldur, çelişki→flag, tolerans iç/dış).
- ESM (`export { bindir, AGIRLIK_TOLERANS }`). api/'den `../lib/bindir.js` ile import.

## 5) api/kuyruk-isle-izometri.js — eslestir() bindirme + bağ (PARÇA 2a/2b)
- import bindir; `eslestir(supa, devreId, kuyrukId, okuJson, devreDokumanId)` (imza genişledi, handler'da dok.id geçer).
- spooller SELECT genişletildi: + et_kalinligi_mm, dis_cap_mm, agirlik, agirlik_kg, yuzey (bindirme kıyası için).
- `if(hedef)` bloğu: `bindir(ps,hedef)` → degisiklik + cizim_durumu='kismi' TEK UPDATE'te birleşir
  (bekliyorsa filtreli, yarış+idempotency korundu). 2b: `devre_dokumanlari.spool_id=hedef.id`.
- detay[].bindirme + bindirme_flag; ozet.bindirme_flag_sayisi.

## 6) Migration (CANLI, COMMIT)
```sql
ALTER TABLE devre_dokumanlari ADD COLUMN IF NOT EXISTS spool_id uuid REFERENCES spooller(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_devre_dokumanlari_spool_id ON devre_dokumanlari(spool_id) WHERE spool_id IS NOT NULL;
```
Dry-run (BEGIN...ROLLBACK) önce yapıldı (MK-98.2), temiz çıktı, sonra COMMIT.

## Kuru-mod (MK-110.5) + Canlı kanıt
- Kuru-mod: gerçek eslestir() mantığı + gerçek veri (M100-317-47-ALS PDF + d6dffba8 spoollar),
  DB'ye SIFIR yazma → "ne bindirilirdi" raporu doğrulandı (A-000645: yüzey dolar, gerisi eşit).
- Canlı: curl direkt POST → A-000764 eşleşti, ağırlık %15.6 FLAG (kabuk 3.459 korundu, PDF 4.0 saklandı),
  yüzey null→Galvaniz, cizim_durumu bekliyor→kismi, devre_dokumanlari.spool_id=f19f671c. DB ile teyit edildi.

## Mimari kararlar
- MK-111.1: et ≥ dış çap olamaz (DNxOD notasyonunda et iptal).
- MK-111.2: bindirme survivorship — boş→doldur, et/çap çelişki→flag, ağırlık %3 tolerans, sessiz ezme yok, audit `_eslesme.bindirme`.
- Karar-B: ortak parser ayrı modül (ares-olcu.js), ARES_BORU saf lookup kalır.

## Sektör/MDM araştırması (Cihat değerlendirmesi)
Yaptığımız iş = BOM reconciliation + MDM (golden record). 3 madde alındı (minimal survivorship YAPILDI,
eşik/flag kısmen var, yeni-format insan turu disiplin notu), 3 reddedildi (grounding/monitoring/audit —
ölçeğimize gereksiz). Teşhis düzeltmesi: çap=4 sorunu MDM değil parser asimetrisiydi (PARÇA 1 çözdü).

## Commit'ler
| Commit | İçerik |
|--------|--------|
| a651ad9 | PARÇA1: ares-olcu.js + kabuk lookup + 2 HTML script tag |
| 1179a5f | PARÇA2a: lib/bindir.js (eslestir bağlantısı EKSİK commitlendi — md5 ile yakalandı) |
| 977207c | PARÇA2a: eslestir bindirme bağlandı (eksik commit düzeltildi) |
| (doc) | kapanis dokumanlari [skip ci] |

## Değişen/yeni dosyalar
- `ares-olcu.js` (YENİ), `ares-kabuk.js`, `devre_wizard.html`, `devre_detay.html`
- `lib/bindir.js` (YENİ), `api/kuyruk-isle-izometri.js`
- DB: `devre_dokumanlari.spool_id` migration (canlı)

## Dersler (bu oturum)
1. **Veriyi gör, varsayma — TEKRAR.** Kolon adları birkaç kez varsayıldı (devre_id, parse_sonuc yanlış
   tablo), SQL hata verdi. information_schema ile teyit şart (MK-108.4).
2. **md5 gözle teyit hayat kurtardı.** Yarım push (eski dosya kopyalandı) sadece md5 sayesinde yakalandı.
3. **Push sırası:** migration COMMIT → kod push → deploy. Doğru uygulandı.
4. **PARÇA 1 çoğu "çakışmayı" yok etti** — onlar veri çelişkisi değil parser asimetrisiydi. Survivorship
   gerçekten farklı ölçen nadir duruma indi (ağırlık swaged/pulled farkı gibi).
5. **Buton vs endpoint ayrımı:** "ilerleme yok" curl ile test edilince endpoint sağlam çıktı → sorun
   butonun tetiğinde. Belirtiyi katmana ayırmak (UI tetik / worker / parse / bindirme) teşhisi hızlandırdı.

## Sonraki oturum
Detay CLAUDE-SONRAKI-OTURUM.md. Öncelik: ① Bekleyenleri işle buton tetik sorunu (endpoint sağlam),
② spool detay'da eşleşen PDF erişimi UI (2b görünür kısmı), ③ uyarılar sayfasında bindirme flag gösterimi.
