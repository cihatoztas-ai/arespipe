# CLAUDE — 144. Oturum Girişi

## Açılış ritüeli
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3` → çıktı.
2. `cat BRIEFING.md` → 143 kapanış bağlamı.
3. Function sayımı (MK-129.3): `ls api/*.js | wc -l` → **12** olmalı. 144'te de yeni endpoint YOK hedefi.
4. `son-durum.md` (143) + `CLAUDE-SON-OTURUM.md` (143) + bu dosya oku.
5. KARARLAR.md'ye MK-143.1/.2/.3/.4 işlenmediyse işle.
6. Gündem teyidi.

## 143 nerede bıraktı
- **G2a TAM TUR BİTTİ:** operatör değer-düzeltmesi düzelt→tablo→terfi uçtan uca, canlıda doğrulandı.
- HEAD `68e2cec`. Migration 098 canlı (`taslak_duzeltmeleri`). Yeni endpoint yok (12/12).
- Düzeltilebilir 7 alan: çap/et/ağırlık (sayısal) + malzeme/yüzey/alıştırma/kalite (katı dropdown, kanonik kod).

## 144 — ANA İŞ ADAYI: BOM malzeme listesi düzeltme + güvensiz-bayrak
**Cihat'ın asıl derdi.** Spool'un içindeki malzeme kalemleri (`spool_malzemeleri`, spool detay "Malzeme Listesi" sekmesi).
Mantık (Cihat'ın tarif ettiği):
- **Küçük sorun** → düzelt popup'ında kalem rötuşu (bir adet/çap yanlış).
- **Büyük sorun / hiç güvenilmiyor** → spool/devre malzeme sekmesini **"güvensiz" işaretle**; canlıya çıkar ama damgalı, **manuel takibe** düşer. (Yanlış-ama-güvenilir-görünen veri yerine dürüst "güvensiz" → sessiz overwrite yok.)
- 3 durum: **güvenilir** (Excel temiz, Tersan/Cadmatic) / **küçük düzeltme** / **güvensiz**.
- Excel'siz formatlarda (Tersan dışı) BOM Excel'de olmayabilir → bu alan kritikleşir.

**KOD ÖNCESİ OKU (MK-126.8, tahmin yok — 143'te tablo/native-confirm yanlış varsayımdan kaçınıldı):**
1. `spool_malzemeleri` şeması (`information_schema.columns`) — hangi alanlar, FK, mevcut bayrak var mı.
2. Spool detay "Malzeme Listesi" sekmesi render (`spool_detay.html`) — kalemler nasıl gösteriliyor.
3. K2 malzeme kıyas (`malzeme_kiyas` / `_eslesme`) — çelişki nasıl tespit ediliyor (zaten "%100 çelişki" üretiyor).
4. Karar: güvensiz bayrak NEREDE? (spool seviyesi `spooller.malzeme_guvensiz` mi, devre mi, kalem mi). Migration gerekebilir → BEGIN...ROLLBACK.
5. Kalem düzeltme `taslak_duzeltmeleri`'ye sığmaz (anahtar spool başlığı) → ayrı yapı mı, yoksa kalem-id bazlı mı? Tasarım kararı.

## ÖNCELİKLİ AYRI TEŞHİS (144'te ya da ayrı): "Hep zayıf / %100 çelişki"
NB1124 G310 devresinde TÜM spool'lar "zayıf / doğrulanmadı / L2 %100 çelişki / okunamadı" (143 Image 3).
- Bu format-özgü parse/eşleşme sorunu. "%100 çelişki" neyin çelişkisi — `devre-inceleme` endpoint + `izo-eslesme` neye bakıyor?
- TAHMİN YOK. Kanıt teşhisi: bir spool'un izometri parse_sonuc'u + kabuk değerini yan yana koy, çelişki nerede.
- Cihat "genelde yeşil oluyordu, bu gemide niye okuyamıyor" dedi → format/glyph farkı olabilir (NB1137 Band-B gibi).
- **Eğer BOM işinden önce bu can sıkıyorsa, ısınma turu olarak teşhis (okuma) ile başlanabilir.**

## DİĞER AÇIK BORÇLAR
- **Terfi sonrası izometri PDF spool detaya gelmiyor** (143 Image 1) — `eslestirme-backfill` / 129-130 borcu. Teşhis: terfi sonrası backfill çağrılıyor mu, dönüşü ne, izometri neden bağlanmıyor.
- **Native confirm() → kendi modal** (143 Image 2, wizard iptal "Vazgeçmek istediğinize emin misiniz?"). Kozmetik, küçük. `confirm(` ara, kendi overlay deseninle değiştir.
- **G3a yayılma:** bir spool düzeltmesi aynı hatalı diğer spool'lara otomatik. Q1 (anahtar) + Q2 (değer-kopyala/kural-öğret) kararı GEREKLİ. Cihat 143'te sordu ("aynı hata diğerinde de vardı düzelmesi gerekmez mi") → bu G3a, henüz yapılmadı.
- **Durum/özet tutarlılığı:** düzeltilen satır hâlâ "zayıf/çelişki", üst özet/stat eski. Düzeltme durum/stat/özet hesabına dahil edilmeli (gösterim, risksiz, küçük).
- BUG-B DN125 (park) · MK-139.1 görsel teyit · tip='fitting' ama flanş · ara-açı dirsek (3D, MK-49.A).

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-126.8: yeni modül/SQL öncesi mevcut kod+DB oku (143'te ares-normalize/tanimlar/ares-kabuk okundu, körlemesine yazılmadı).
- MK-98.2: şema migration BEGIN...ROLLBACK dry-run → COMMIT.
- MK-101.1: arespipe_kopyala = üç argüman (kaynak hedef md5) + git status.
- MK-143.3: ares-kabuk paylaşılan modül — opsiyonel param ekle, devre_detay'ı bozma (sıfır regresyon).
- Kod commit'i `[skip ci]` YOK; doc/migration `[skip ci]`. Kod ve doc ayrı commit.

## Hatırlatmalar (143 dersi)
- Komutları TEK TEK ver — `gp` gibi alias bir sonraki kelimeye yapışıyor (143'te `gparespipe_kopyala` hatası oldu).
- sed HTML/JS'de yok → atomik str_replace/Python.
- Kanonik dropdown: malzeme/yüzey/alıştırma statik (ARES_NORM), kalite DB (malzeme_tanimlari, .or(tenant null + eq)).
- "DB kolon tipi text" ≠ "UI serbest giriş" — tanımlı alanlar dropdown olmalı (yazım farkı tablo bozar).
- Test verisi: NB1124 G310 (13 spool, hep zayıf — teşhis için iyi örnek) · NB1137 Watermist · A-1095/A-1096 (143'te düzeltme yazılan spool'lar).

---
> 144 ilk somut adım: ya BOM güvensiz-bayrak (ana iş, önce spool_malzemeleri + spool detay sekmesi OKU)
> ya da "hep zayıf" teşhisi (ısınma, okuma turu). Cihat hangisi can sıkıyorsa.
