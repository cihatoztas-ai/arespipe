# Claude — 44. Oturum Gündemi

> **Bu dosya 43 kapanışında oluşturuldu. 44 başında ilk okunacak.**

---

## 44 Açılış Mottosu

43'te kütüphane içerik gerçek dünyaya değdi — **ama yarım**:
- A105 WN Class 150 tam tablo canlıda (20 satır)
- DN65 DIN 2448 + EN 10216-1 et ailesi (10 yeni satır)
- IFS pilot lookup **veritabanında** eşleşti: 22.43 kg ✓
- **AMA spool_detay sayfasında kullanıcı bunu göremiyor**

Cihat 43 kapanışında ekran görüntüsüyle gösterdi: M1 satırı hâlâ "Pipe Seamless Steel Tube — 3.1 Certificate / 76,1 mm / 4,5 mm" yazıyor. Hiçbir kütüphane bağlantısı yok.

**Bunun üstüne ek karar (43 son turu):** Cihat dedi ki — *"Sadece tablolar için yeni proje açmak lazım, internet sitesi içinde de malzeme search bölümü yapacaktık."* Yani kütüphane:
1. AresPipe'tan ayrı bir GitHub repo
2. Website'taki public malzeme search ürününü besleyecek
3. AresPipe ile veri paylaşımı (mimari kararı 44'te)

44 iki paralel ana teması var:
- **Cascade UI** (AresPipe içi — pilot eşleşmesini UI'da göster)
- **Kütüphane mimari kararı** (yeni repo + Supabase stratejisi + website entegrasyonu)

---

## 1. Açılış Ritueli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritueli. 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi sayfayla çalışılacak? (cevap: spool_detay.html + mimari konuşma)
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 43 sonu detayını oku
- docs/CIHAT-PROFIL.md, docs/SPOOL-AI-VIZYON.md, docs/KUTUPHANE-YUKLEME-TAKIP.md hatırla
- Cihat'ın website hakkında bilgi vermesini iste (hangi framework, hosting, mevcut durum)

---

## 2. Ana Tema A — Kütüphane Mimari Kararı (~30-45 dk)

### 43'te netleşen konular

✅ Kütüphane AresPipe'tan ayrılacak — yeni repo olacak
✅ Website'ta public malzeme search bölümü olacak (Cihat zaten konuşmuştu)
✅ Aynı veri AresPipe spool akışını + website search'ü besleyecek

### 44'te konuşulacak — açık kararlar

**Karar 1: Database stratejisi — Aynı Supabase mı, yeni Supabase mi?**

| Konu | Aynı Supabase | Ayrı Supabase |
|---|---|---|
| AresPipe spool → kütüphane FK | ✅ Doğrudan korunur | ❌ API call gerek |
| Migration taşıma | Sadece dosya kopyala | DB sıfırdan kurulur |
| Public erişim | Anon key + RLS policy | Tertemiz public API |
| Yatırım | ~1 oturum | ~2-3 oturum |
| İleride API ürünü | Sonradan ayrılabilir | Hazır temel |

**44'te öneri:** Aynı Supabase + ayrı repo (FK korunur, hızlı kuruluş). İleride API ürünü olursa migration script'le ayrılır.

**Karar 2: Repo yapısı**

```
arespipe/                  # mevcut — sadece spool sistemi
arespipe-kutuphane/        # yeni — public kütüphane repo
├── migrations/            # 014, 015 buraya taşınır
├── docs/
│   ├── KUTUPHANE-KAPSAM.md
│   └── KUTUPHANE-YUKLEME-TAKIP.md
├── cizimler/
│   └── flans/
│       └── asme_b16_5_class150_wn_dn100.svg  # 43'te yapıldı
├── scripts/lib_import/    # 45'te kurulacak pipeline
└── README.md
```

AresPipe'a `submodule` veya `tools/lib-link.js` ile bağlanır (AresPipe yine kütüphaneyi okur, ama kütüphane bağımsız çalışır).

**Karar 3: Website entegrasyonu — search nasıl çalışacak?**

| Yaklaşım | Açıklama |
|---|---|
| Direkt Supabase | Website'tan anon key ile RLS'li sorgu (en hızlı) |
| API katmanı | Vercel/Cloudflare worker — search.api.arespipe.com |
| Static export | Belirli aralıklarla snapshot, JSON olarak yayın (en ucuz) |

**44'te bilmediğimiz:** Website'ın hangi teknolojide olduğu, hosting durumu, trafik beklentisi. Cihat'ın bilgi vermesi gerek.

**Karar 4: Public API ürünü mü?**
- Şimdilik website search yeterli mi?
- Yoksa "ASME B16.5 search by parameter API" olarak sektöre satılacak mı?
- Karar 1 ve 3 buna bağlı

### 44 hedef çıktısı (mimari karar tarafı)

- Yeni repo açma kararı netleşir
- Database stratejisi karara bağlanır
- Website entegrasyon yöntemi seçilir
- 45 ana teması belirlenir (yeni repo kurulumu + ilk taşıma)

---

## 3. Ana Tema B — Cascade UI (~75-90 dk)

### Hedef Kullanıcı Akışı

Kullanıcı spool_detay.html'de M1 satırına tıklar →
- Modal açılır
- "Pipe Seamless Steel Tube — 3.1 Certificate" başlığı
- **Kütüphane eşleşmesi bloğu:**
  - Standart: DIN 2448 / EN 10216-1 (paralel)
  - DN: 65 (NPS 2.5)
  - OD: 76.1 mm
  - Et: 4.5 mm
  - İç çap: 67.1 mm (GENERATED)
  - Birim ağırlık: 7.946 kg/m
- **Pilot kayıt karşılaştırması:**
  - Boy: 2823.2 mm
  - Sistem hesabı: 7.946 × 2.8232 = 22.43 kg
  - IFS kaydı: 22.43 kg
  - ✓ Eşleşme (yeşil rozet)
- **Alternatif et değerleri (aynı standart, aynı DN):**
  - 2.9 mm → 5.235 kg/m
  - 3.6 mm → 6.437 kg/m
  - 4.0 mm → 7.110 kg/m
  - **4.5 mm → 7.946 kg/m (mevcut, vurgulu)**
  - 5.0 mm → 8.764 kg/m
  - 5.6 mm → 9.732 kg/m
  - 7.1 mm → 12.078 kg/m
- **Eşleşme yoksa:** "Bu kayıt kütüphanede bulunamadı. Kütüphaneye ekle?" CTA

### Adımlar

1. **41 flanş modal'ını incele** (~15 dk) — pattern'ı oku, i18n eksiklerini listele (lang/tr.json'da 9 anahtar)
2. **Boru modal iskeleti** (~30 dk) — flanş modal'ının kardeşi, satıra onclick
3. **Lookup sorgusu** (~20 dk) — `boruLookup(disCap, et)` Supabase query
4. **Alternatif et değerleri** (~15 dk) — aynı standart + aynı DN diğer et değerleri
5. **Pilot karşılaştırma** (~10 dk) — sistem_hesap = agirlik_kg_m × (boy_mm/1000), tolerans ±%2
6. **i18n** (~15 dk) — 41 flanş 9 eksik + boru yeni 12 anahtar = ~21 yeni TR/EN/AR
7. **Canlı test** (~15 dk) — Cihat'ın spool'unda M1-M4 (76.1×4.5 boruları), modal açılış + içerik kontrolü

### Önemli not
M5/M6/M7 (Ic Bilezik, Outer Sleeve) → fitting_olculer ve ozel_parcalar boş. Bu kayıtlar için modal "kütüphaneye ekle" CTA gösterir, lookup eşleşmesi yok. 44'te boru tarafı odaklı.

---

## 4. Sıralama

44 oturumu uzun olabilir (~3-3.5 saat). Sıralama:

| Faz | Süre | Aksiyon |
|---|---|---|
| 1. Açılış ritueli | 5 dk | 5 cevap zorunlu |
| 2. Mimari karar konuşması (Tema A) | 30-45 dk | Karar netleşmeden Tema B'ye geçilmez |
| 3. Cascade UI (Tema B) | 75-90 dk | 7 alt adım |
| 4. Kapanış | 10 dk | 3 dosya, varsa yeni repo karar dökümü |

**Açılışta net soru:** Cihat website'ın bugünkü durumu hakkında bilgi versin (framework, hosting, repo). Mimari karar bu olmadan tam veremez.

---

## 5. Kapanış (~10 dk)

- Git push
- son-durum.md güncelle: cascade UI ✓, mimari karar belgelendi
- KUTUPHANE-YUKLEME-TAKIP.md güncelle (Frontend cascade UI ✓)
- Yeni: `docs/KUTUPHANE-PROJE-MIMARI.md` — 44'te alınan mimari kararların dökümü
- CLAUDE-SON-OTURUM.md (44 detay arşiv)
- CLAUDE-SONRAKI-OTURUM.md (45 gündemi — yeni repo kurulumu)

---

## 45+ Parking — Yeni Repo Kurulumu

44'te mimari karar verildikten sonra, 45 ana teması:
- `arespipe-kutuphane` repo açılması
- 014, 015 migration'ları taşınması (aynı Supabase'de kalırsa sadece dosya kopyala)
- KUTUPHANE-KAPSAM.md, KUTUPHANE-YUKLEME-TAKIP.md taşınması
- ASME B16.5 SVG çizim (43'te yapıldı) buraya taşınması
- AresPipe'tan submodule veya link yöntemi
- README.md (public yüzü, lisans, katkı rehberi)
- İlk public deploy (Vercel/Netlify static)

---

## 46+ Parking — Pipeline Mimarisi

Yeni repo kurulumundan sonra 46 ana teması: **İçerik pipeline.**

`arespipe-kutuphane/scripts/lib_import/`:
- `wermac_flange.py` — Wermac HTML scrape, 6 sınıf
- `ferrobend_check.py` — cross-check + mismatch flag
- `ose_fitting.py` — OSE-piping CSV → fitting_olculer
- `ose_pipe.py` — OSE pipe.csv → boru_olculer
- `normalize.py` — birim çevirimi
- `sql_writer.py` — idempotent SQL (014/015 pattern template)

**46 hedef:** Class 150 SO/BL + Class 300 WN/SO/BL (~120-200 satır flanş) + OSE fitting import (~200-500 satır fitting). Tek oturumda 10-20x sıçrama.

---

## 47+ Parking — Website Search Sayfası

Pipeline çalışınca + içerik dolunca:
- Website'ta `/malzeme-arama` sayfası
- Filter: standart × DN × et × malzeme grubu
- Sonuç tablosu
- Detay görünümü (cizimler/flans/*.svg ile)
- Public Supabase anon key, RLS read-only

---

## 48+ Parking — CuNi P0 + Şema Borçları

- DIN 86019/86087-90 (Cihat PDF varsa)
- ASTM B466/B467 (CuNi boru)
- boru_olculer'a tenant_id + sistem_preset
- KK + Sevkiyat sayfa kapsamlı revizyon
- Büküm modal açıklama alanı UI

---

## Vizyon Disiplini Hatırlatması

44 sonunda hâlâ vizyondan SIFIR madde kapsama almama sözü geçerli.

**Önemli ayrım:** Yeni repo + website search **mevcut "kütüphane istisnası"nın yer değişikliği**, yeni vizyon maddesi değil. Kütüphane zaten 41-42-43'te kapsama alınmıştı. Şimdi sadece nerede yaşadığı netleşiyor.

❌ Pasif öğrenme — vizyonda kalır
❌ Tier'lı servis modeli — vizyonda kalır
❌ Lazer tarama pipeline — vizyonda kalır
❌ STEP koordinat çıkarımı — vizyonda kalır
❌ Klasör yükleme + format tanıma — vizyonda kalır
❌ Çapraz validasyon (3 katman) — vizyonda kalır

Cihat *"bunu da yapalım"* derse: cevap *"41-42-43'te üç kez istisna yaptık. Dördüncüsü presedan. 50. oturumdan sonra konuşalım."*

---

## 44 Gündemi Özet

| Adım | Süre | Öncelik |
|---|---|---|
| Açılış ritueli | 5 dk | 🔴 |
| **Tema A: Mimari karar** | 30-45 dk | 🔴 (önce!) |
| **Tema B: Cascade UI** | 75-90 dk | 🔴 |
| Kapanış | 10 dk | 🔴 |

**Toplam:** ~3-3.5 saat oturum.

**Açılış soru sırası:**
1. Website teknik durumu nedir? (framework, hosting, repo)
2. Public search ürünü mü, sadece bilgi sayfası mı?
3. Önce mimari konuşalım sonra UI mı, paralel mi?

---

> 43 kapanışında yazıldı. 44 başında okunacak. 44 sonunda 45 için yenisi yazılacak.
