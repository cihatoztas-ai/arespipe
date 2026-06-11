# CLAUDE-SONRAKI-OTURUM.md — Oturum 178 giriş planı

## Ritüel (önce)
`git pull && git status && git log --oneline -5` + fonksiyon 12/12 + handoff oku. HEAD bekle: 87c36c1 (+ 177 doc commit'i).
**DİKKAT git status:** working tree'de yarım migration taşıması (deleted düz dosyalar + untracked schema/data/)
GÖRÜNECEK — bu NORMAL, 177'nin işi değil (aşağıda). Panik yok.

## Bağlam: nerede kaldık (177)
Kütüphane veri girişi migration'dan KURTARILDI: `scripts/seed-from-json.mjs` (idempotent upsert) kuruldu,
Sandvik paslanmaz boru ile kanıtlandı (52 satır, 0 hata). Commit 3243e51 → push 87c36c1. Fonksiyon 12/12.
Malzeme takip sayfası tartışıldı ama Cihat ölçeği küçülttü ("genel not → uyarılar") + ertelendi. MK-176.7 (Onay
Kuyruğu → İnceleme taşıma) hâlâ el atılmadı.

## SIRADAKİ İŞ — Cihat açılışta seçer

### SEÇENEK A) Kütüphane devamı — fitting/flanş seed (MK-177.3)
**Gerçek eksik (DB teyitli, 177):** DIN 28011 cap (21 satır) + DIN 86087 saddle → `fitting_olculer`'da YOK.
JSON'lar `~/Downloads`'ta hazır (`din28011_cap_kme_v1.json`, `din86087_saddle_kme_v1.json`), parse gerekmez.
**ENGELLER (kod yazmadan çöz):**
1. `fitting_olculer` doğal UNIQUE constraint YOK (sadece id pkey). Upsert için gerekli.
   - Öneri unique key: `(standart, malzeme_grubu, parca_tipi, cap_buyuk_dn, cap_kucuk_dn)` — ama DOĞRULA.
   - MK-98.2 dry-run: `BEGIN; ALTER TABLE fitting_olculer ADD CONSTRAINT ... UNIQUE(...); ROLLBACK;` —
     mevcut 897 satır o kombinasyonu TEKRAR ediyorsa ALTER patlar. Önce `GROUP BY ... HAVING COUNT(*)>1` ile çakışma ara.
2. Eski cunife JSON'larında `_db_aksiyonu` YOK → script şu an "yazılacak yok" der. Script uyarlaması:
   `_db_aksiyonu` alanı hiç yoksa TÜM satırları yaz (yeni davranış, flag'le: `--hepsi` veya otomatik algıla).
3. JSON alanları (`agirlik_kg, cap_buyuk/kucuk_mm/dn/nps, ucu_uca_*_mm, yaricap_mm, parca_tipi, sanity_gecti`)
   ↔ `fitting_olculer` kolonları eşleşmesini information_schema ile teyit et (boru'da agirlik_kg_m'di, fitting'de agirlik_kg).
   `sanity_gecti` muhtemelen DB kolonu değil → atılmalı (script `_` ile başlamadığı için elle ele alınmalı).
4. `UNIQUE_KEY` haritasına `fitting_olculer: [...]` ekle, yeni md5, kopyala.
Sonra: --dry-run → --yaz → DB sayım teyit. Saddle'ın fitting mi flanş mı olduğunu JSON meta'dan kontrol et.

### SEÇENEK B) MK-176.7 — Onay Kuyruğu → İnceleme taşıma ⭐ (asıl keystone, 176'dan beri bekliyor)
Cihat fikri: aktif devrede ayrı "onay kuyruğu" yerine wizard İnceleme/düzenleme ekranını spool_detay/devre_detay'da
göster. **Kod yazmadan kapsam araştırması (MK-126.8):** `spool_detay.html` yapısı (henüz hiç açılmadı, yüklet),
`devre-inceleme.js` aktif-devre semantiği (terfi yok → "düzeltme/eşleştirme" eylemi ne olur), karar: sekmeyi
DEĞİŞTİR mi / spool_detay'a EK görünüm mü. B-6: atanmamış/manuel/post-terfi-Excel sinyalleri sessizce kaybolmamalı.

### SEÇENEK C) Malzeme takip — basit sürüm (177'de küçültüldü)
Cihat'ın indirgenmiş fikri: yıldızlı devre malzeme listesinde **genel not alanı** → personel "ezik/yamuk/eksik"
yazar → bir uyarılar görünümüne düşer. Yıldız sistemine DOKUNMA (devreler.html, DB-tabanlı kuyruk, çalışıyor).
Tam QC sistemi (ayrı tablo/foto/sayfa) İSTENMEDİ — basit tut. Mobil sonra.

## TEMİZLİK / BORÇ
- **migration/ → schema/+data/ taşıması (önceki oturum, commit bekliyor):** Cihat netleştirmeli — bu ayrım
  KASITLI ve kalıcı mı? Evetse ayrı commit'le (README dahil). Emin değilse o işi başlatan oturumun planına bırak.
  177 buna DOKUNMADI.
- **KUTUPHANE-YUKLEME-TAKIP.md güncelle:** v4/95'te bayat. DB gerçeği: boru karbon 297/paslanmaz 132/al 50/
  cunife 68; fitting cunife 328/karbon 569; flanş cunife 48/karbon 308. (paslanmaz boru Sandvik +52 ile büyüdü.)
- **KARARLAR.md MK-169/170/171 boşluğu** — 176'da kapatıldı denmişti, teyit et.
- 13 kirli devre recovery + B testi (176'dan). Recovery i18n (4×3). `1 1/4"` kesir bug. Gece cron ispatı.
- MK-117 (yukleyen_id null) — devam.

## İLK HAMLE (178)
Cihat A/B/C seçer. Hiçbiri demezse: **B (MK-176.7)** asıl keystone, en uzun bekleyen. A en hızlı somut kazanım
(gerçek eksik + araç hazır) ama fitting unique-key kararı gerektirir. Önce Cihat'ın gündemini al.

## 177'de KAPANAN
- ✅ Kütüphane seed akışı (migration döngüsü kırıldı) — kanıtlı (Sandvik 52, 0 hata).
- ✅ Malzeme takip — tartışıldı, küçültüldü, ertelendi (overkill önlendi).
