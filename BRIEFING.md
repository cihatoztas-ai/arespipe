# AresPipe BRIEFING — 144. Oturum Kapanışı

> **Tek aktif bağlam dosyası (MK-56.2).** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır.

## HEAD (son push ~`de09c7e`)
- `de09c7e` feat(144): C3 sistem-türevli BOM rengi — K2 malzeme_flag çek + dogrulanmadi + doğrula butonu
- `d571134` feat(144): BOM kalem rötuşu C2 — tip-uyarlamalı malzeme düzenle modal + türetilen "duzeltildi"
- `2e6a80c` migration(144): 099 bom_durum + spool_malzemeleri.guncelleme [skip ci]
- `48512ba` feat(144): BOM güvenilirlik bayrağı C1 — bom_durum rozeti + güvensiz toggle
- **DB:** migration `099_bom_guvenilirlik.sql` canlı (COMMIT). Yeni endpoint YOK (12/12).

## 144 — yapılanlar (ANA İŞ: BOM güvenilirlik + kalem rötuşu, spool_detay)
1. **Migration 099.** `spooller.bom_durum` (text, default 'guvenilir', CHECK guvenilir/duzeltildi/guvensiz) + `bom_durum_not`/`bom_durum_zaman` + `spool_malzemeleri.guncelleme`. Son sonuncu latent-bug fix: sertToggle/heatKaydet `guncelleme` yazıyordu ama kolon yoktu → `_supaUpdate` sessizce console.warn'a düşüp fail ediyordu.
2. **C1 — güvenilirlik bayrağı.** Malzeme Listesi başlığında rozet + "Güvensiz işaretle"/"Güvenilir yap" toggle. `spooller.bom_durum` client-side UPDATE + RLS. Canlı doğrulandı.
3. **C2 — kalem rötuşu (tip-uyarlamalı).** Her satırda ✏️ (uç işlemi hariç) → modal: tip (boru/fitting/flanş/diğer) + kod/açıklama/malzeme(select)/kalite(datalist `kaliteListe`)/çap/et/boy/adet/ağırlık. Boy yalnız boruda, et flanşta gizli. Doğrudan `spool_malzemeleri` UPDATE (terfi-sonrası gerçek veri → taslak DEĞİL). virgül→nokta NaN-fix, MK-111.1 (et>çap engeli). Tip/boyut değişince kütüphane FK (boru/fitting/flansh_olculer_id) NULL'lanır = basit tanım, kütüphane zorlamaz. SELECT'e `kod/aciklama/adet/guncelleme` eklendi (kod artık gerçek, fallback değil). **Canlı doğrulandı** (NB1137 spool: malzeme/kalite/tip/boy değişti, render+log+kalıcılık tuttu).
4. **C3 — sistem-türevli renk (KOD DOĞRU, AKTİF DEĞİL).** `bomK2SinyalYukle()` `dosya_isleme_kuyrugu.parse_sonuc._eslesme.detay[].malzeme_flag`'i çeker → operatör karar vermemiş + flag varsa sarı "⚠ Doğrulanmadı" + "✓ Doğrula" butonu (`bom_durum_zaman` karar damgası). **TAKILDI:** `bomK2SinyalYukle` `SP.devre_id` ile filtreliyor, ama spool'un devresi ≠ izometrisinin devresi (örnek: spool `AT110-Drencher-Galv`/`fb80d315`, izometri+flag `g230`/`7ed93033`). pipeline+spool 13 farklı devrede tekrar ettiği için devre-bağımsız eşleşme GÜVENSİZ. Sonuç: C3 fail-safe yeşile düşüyor — **zarar yok, hata yok, regresyon yok** ama "Doğrulanmadı" sarısı şimdilik HİÇ tetiklenmiyor. Devre-bağı (D borcu) çözülünce aktifleşir.

## §13 DURUM
Operatör BOM güvenilirliği döngüsünün **terfi-sonrası (spool_detay) DEĞER + GÜVEN kısmı çalışıyor:** kalem rötuşla → "Düzeltildi"; güvensiz işaretle → kırmızı damga (manuel takip); güvenilir doğrula. Sistem-türevli "Doğrulanmadı" kod hazır ama devre-bağı borcuna bağlı (inert). Terfi-ÖNCESİ (wizard, B) ve downstream damga (kesim/büküm/markalama, C4) HENÜZ yok.

## CANLI DOĞRULAMA ✅
- C1: güvensiz toggle + kalıcılık (F5) — geçti.
- C2: NB1137-AT110-816-026-S01 kalem düzenleme (malzeme Paslanmaz, çap/boy değişti, kod gerçek geldi) — geçti.
- C3: kod konsol+SQL ile doğrulandı (client sorgu 12 kayıt/8 flag döndürüyor) ama devre-bağı yüzünden UI'da sarı çıkmıyor.

## AÇIK BORÇ (145 için, öncelik)
1. **C3 devre-bağı (ÖNCELİKLİ — C3'ü tamamlar):** Spool'un izometrisinin GERÇEK devresini bul (spool↔izometri devre kopukluğu). DEVIR'deki **D borcu (terfi sonrası izometri spool detaya gelmiyor) ile AYNI KÖK.** Çözülünce C3 sarısı kendiliğinden çalışır. Kanıt: spool.devre_id (fb80d315) ≠ K2/izometri devresi (7ed93033); pipeline+spool tenant'ta 13× tekrar (devre-bağımsız eşleşme yapılamaz).
2. **B — terfi öncesi BOM kalem rötuşu + güvensiz (wizard):** Wizard'da kalemler ZATEN görünür ("🔧 Malzeme Listesi" sekmesi, `WIZ._kabukSatirlar`, salt-okunur). Düzenleme + güvensiz için G2a deseninde kalem-seviyesi TASLAK katmanı (parse'tan gelen kalem sayfa yenilenince kaybolur) + terfide `ARES_KABUK.aktar`'a taşıma. `malzeme_flag` İnceleme tablosunda zaten var. A (terfi sonrası, bu oturum) B'nin varış noktası.
3. **C4 — downstream damga:** Kesim/büküm/markalama'da güvensiz görünür uyarı (ENGEL DEĞİL, taşınan bayrak). spool_malzemeleri zaten besliyor; istasyonların BOM tüketimini oku.
4. Kalite alanı datalist kaldı (MK-143.2 katı dropdown diyordu) — çalışıyor, basit-tanım'a uyuyor; ileride katı dropdown'a çevrilebilir (düşük öncelik).
5. Önceki borçlar: Dirsek ağırlık normalizasyonu (PDF agregat vs Excel birim — C3'ün yakaladığı flag'in bir kısmı bu, "yanlış pozitif" olabilir) · Band-B (NB1137 L3) · pipeline_no E120- prefix · yukleyen_id null · devre wizard folder tree · tip='fitting' ama flanş.

## PLAN
| Adım | Durum |
|---|---|
| Migration 099 (bom_durum + guncelleme) | ✅ canlı |
| C1 güvenilirlik bayrağı | ✅ 48512ba canlı |
| C2 tip-uyarlamalı kalem rötuşu | ✅ d571134 canlı, doğrulandı |
| C3 sistem-türevli renk | ⚠ de09c7e canlı ama devre-bağı borcuna bağlı (inert, zararsız) |
| C3 devre-bağı (D borcu) | 145 öncelikli |
| B terfi öncesi rötuş+güvensiz | 145 |
| C4 downstream damga | sonra |

## NEREDEYIZ — ÖZET
spool_detay'da BOM güvenilirliği uçtan uca: operatör kalem rötuşlar (tip-uyarlamalı, basit tanım), güvensiz işaretler (manuel takip damgası) veya güvenilir doğrular; "Düzeltildi" türetilir. Sistem-türevli "Doğrulanmadı" kodu hazır ama spool↔izometri devre kopukluğu (D borcu) yüzünden inert. Sıra: D borcunu çözüp C3'ü canlandırmak, sonra terfi-öncesi (B) ve downstream damga (C4).
