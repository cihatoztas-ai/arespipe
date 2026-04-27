# 35. Oturum Gündemi — ASME Lookup Tam Sistemi

> **Tarih:** 27 Nisan 2026 (veya sonrası)
> **Tema:** B1 (İzometri Batch) önkoşulu — ASME standart boru ölçü modülü
> **Önkoşul belge:** `docs/IZOMETRI-BATCH-KARAR.md` (Karar 5 — A1)

---

## Oturum Açılışı

**Standart 5 soruluk ritüel** (CLAUDE.md), sonra:

1. **db-backup saat kontrolü** — `arespipe-backups` repo Commits sekmesi → 27 Nis sabah commit saati. Beklenen: TR 03:00-03:30 (UTC 00:00-00:30). Hâlâ UTC 03:00+ ise `arespipe-backups` repo'sundaki workflow yml dosyasına bakılmalı (cron syntax veya alternatif tetikçi).

2. **Cihat'tan örnek PDF kontrolü:** "*34'te 2-3 örnek PAOR/AVEVA PDF yükleyeceğini söylemiştin. Yüklediğin var mı?*"
   - Varsa: 35'te kısa inceleme (ASME tablosu için referans çap/et değerleri çıkarılır)
   - Yoksa: sorun değil, ASME genel standart, PDF'siz çalışılır

3. **Ekran 1 demo testi sorgu:** "*izometri-batch.html'i yükleyip demo modu test ettin mi? PDF yükleme → 'Batch Başlat' → format badge'leri + manuel onay vurgusu görsel olarak çalışıyor mu?*"
   - Cihat onaylarsa: Ekran 1 frontend kapatıldı ✓
   - Sorun varsa: 35'te kısa düzeltme, sonra ASME'ye geç

4. **G-08 yaygınlaştırma kısa kontrol:** 21 sayfa hâlâ açık, devre_detay pattern hazır. Bu oturumda mı (zaman varsa) yoksa 36+ mı?

---

## 35. Oturumun Ana İşi — ASME Lookup

### Hedef

Boru sektörünün standart ölçüm tablolarını AresPipe'a kalıcı veri olarak getirmek. İzometri parser bu tablodan okuyarak DN+SCH'ten et kalınlığı, dış çap, ağırlık hesaplayacak.

### Çıktılar

**1. DB tablosu — `asme_olculer`**

```sql
CREATE TABLE asme_olculer (
  id SERIAL PRIMARY KEY,
  nps TEXT NOT NULL,           -- "1/2", "1", "4", "12" (NPS standart)
  dn INT NOT NULL,             -- 15, 25, 100, 300 (metric eşdeğer)
  dis_cap_mm DECIMAL(6,2) NOT NULL,    -- 21.34, 33.40, 114.30
  schedule TEXT NOT NULL,      -- "5S","10","10S","20","30","40","STD","60","80","XS","100","120","140","160","XXS"
  et_mm DECIMAL(5,2) NOT NULL,
  ic_cap_mm DECIMAL(6,2) NOT NULL,     -- (dis_cap - 2*et)
  agirlik_kg_m DECIMAL(7,3),   -- karbon çelik nominal (referans)
  notlar TEXT,
  UNIQUE (dn, schedule)
);

CREATE INDEX idx_asme_dn ON asme_olculer(dn);
CREATE INDEX idx_asme_dn_sch ON asme_olculer(dn, schedule);
```

**Kapsam:** DN15-DN400 (NPS 1/2 - NPS 16) × SCH 10/20/30/40/STD/60/80/XS/100/120/140/160/XXS. Yaklaşık **150-200 satır seed data**.

**2. Helper modülleri**

`js/ares-asme.js`:
```js
window.ARES_BORU = {
  // Et kalınlığı: DN100 + SCH40 → 6.02 mm
  etKalinligi: function(dn, schedule, malzeme) { ... },
  
  // Dış çap: DN100 → 114.30 mm
  disCap: function(dn) { ... },
  
  // İç çap: DN100 + SCH40 → 102.26 mm
  icCap: function(dn, schedule) { ... },
  
  // Schedule belirsizse default kuralı (DN ≤ 250 → SCH40, DN > 250 → STD)
  varsayilanSchedule: function(dn) { ... },
  
  // NPS ↔ DN dönüşümü (1" ↔ DN25)
  npsToDn: function(nps) { ... },
  dnToNps: function(dn) { ... }
};
```

`js/ares-agirlik.js`:
```js
window.ARES_AGIRLIK = {
  // Boru ağırlığı: DN100 + SCH40 + 1000mm karbon çelik → 16.06 kg
  boruHesapla: function(dn, schedule, boy_mm, malzeme) { ... },
  
  // Fitting ağırlığı (yaklaşık): tip + DN + SCH'e göre tablo
  fittingHesapla: function(tip, dn, schedule, malzeme) { ... },
  
  // Toplam: array ver, toplam kg dön
  topla: function(parcalar) { ... }
};
```

**3. Migration dosyası:** `migrations/003_asme_olculer.sql` (CREATE + INSERT seed data)

**4. Test dosyası:** `tests/asme-lookup.test.js` veya benzer — 5-10 birim test:
- DN100 SCH40 → et_mm=6.02 ✓
- DN50 SCH40 + 1000mm karbon → 5.44 kg ✓
- DN300 SCH40 → STD'ye fallback (uyarı gerekirse) ✓
- Bilinmeyen DN → exception veya null + console.warn ✓
- NPS "4" → DN 100 ✓

### Yapılış Sırası (önerilen)

1. **Saat 1 — Veri toplama:** ASME B36.10 / B36.19 standart tablosundan DN15-DN400 × SCH değerleri toplanır. Çoğu PDF/Excel tablosundan rahat çıkarılır. Karbon çelik ağırlıkları nominal (referans).
2. **Saat 2 — Migration yazımı:** `003_asme_olculer.sql` — CREATE TABLE + 150 INSERT satırı.
3. **Saat 3 — Helper modülleri:** `ares-asme.js` + `ares-agirlik.js`. DB'den okumak yerine modülün içine **statik object** olarak yazılır (browser-side, DB'ye gidip gelmek pahalı, veri statik).
4. **Saat 4 — Test:** Birim testler + manuel doğrulama (3-4 spot check).
5. **Saat 5 — Migration uygula + commit + push:** Canlıda doğrulama.

### Kapsam Dışı (35'te yapılmaz)

- İzometri batch entegrasyonu — 36+
- ASME B16 (fittings) tam kütüphanesi — kabuller motoru içinde, 36-37
- Pattern fallback (Schedule belirsiz → varsayılan) — sadece basit kural, otomatik öğrenme yok
- Ağırlık hesabında flanş/braket korreksiyonu — kabuller motoru, 36+
- Malzeme bazlı yoğunluk farklılıkları (paslanmaz vs karbon yoğunluk farkı %3) — şimdilik hep karbon çelik referansı, flag eklenmez

---

## Açılış Notları (Claude için)

- **Sapmama disiplini:** ASME Lookup tek hedef. İzometri batch'e atlama. KARAR.md Karar 5 net diyor: önce ASME, sonra B1.
- **Veri kaynağı:** ASME tabloları açık standart, internet'te rahat bulunur. Cihat'a "veriyi nereden alıyoruz" diye sorma — ben web search ile bulurum, doğrulukları kontrol ederim.
- **Statik vs DB tartışması:** Helper'lar **modülün içine gömülü statik object** kullansın. DB tablo migration tarihsel takip + API entegrasyonu için, ama runtime sorgu DB'ye gitmez (yavaş, 200 satır = 5 KB JS, hafif).
- **i18n:** Boru/Schedule terimi sektörel, Türkçeleştirme YOK. "Schedule" ve "DN" kalır.
- **G-01 (i18n) kontrolü:** Yeni hata mesajları/console.warn'lar varsa `tv()` ile i18n'lenmeli (eğer kullanıcıya görünür string ise).
- **Sayfa Teslim Kontrol Listesi:** ASME modülü UI'a temas etmez (helper). Bu yüzden checklist'in çoğu uygulanmaz, ama lint geçer mi kontrol edilmeli (`node .github/kontrol.js`).

---

## Açık Sorular (35'te kararlaştırılır)

1. **NPS imperial gösterimi de gerekli mi?** AresPipe metric (DN) kullanıyor, ama PAOR PDF'de NPS de geçebilir → dönüşüm helper'ı kesin lazım.
2. **Schedule "NULL" çıkarsa default ne?** Önerim: `dn <= 250 ? "40" : "STD"` — ama Cihat'ın sektör bilgisi devreye girebilir.
3. **Ağırlık tablosunda yoğunluk farkı** (paslanmaz/karbon/alüminyum/bakır)? Karbon × 1.0, paslanmaz × 1.02, alüm × 0.34, bakır × 1.13 katsayıları (yaklaşık) — şimdilik eklenir mi yoksa hep karbon mu?

---

## Olası Risk

ASME tablosu büyük ve hata payı düşük olmalı. **Yanlış et kalınlığı = yanlış ağırlık = yanlış sevkiyat hesabı.** Veri tek kez yazılır, sonsuza kadar referans olur. Bu yüzden:
- En az **iki ASME kaynağından** çapraz kontrol (web search + Wikipedia + sektörel referans)
- Cihat'a göstermeden push yok — 4-5 spot doğrulama (DN50, DN100, DN200 SCH40 değerleri)
- Migration `[skip ci]` değil — CI çalışsın, lint geçsin

---

## 36. Oturum Hatırlatıcı (yapılmadan biten önemli iş)

35'in ana işi ASME ama 35 bitince Cihat'a hatırlat:

> **36. oturum:** Backend dispatcher (`api/izometri-oku.js`) refactor + 502 fix + DB tabloları (`izometri_format_tanimlari`, `izometri_batch_kayitlari`) + Ekran 2 (manuel onay) UI. Bu oturum büyüktür — belki 2 oturuma bölünür.
>
> Ekran 1'in `_DEMO_MOD = true` sabiti `false`'a çekilecek. Mock data fonksiyonu silinecek.

---

> **Bu doküman 35. oturum açıldığında okunur. ASME Lookup'ın bitirme kriterleri burada belli, açık sorular da kararlaştırma sırasını gösterir.**
