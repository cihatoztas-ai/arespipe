# AresPipe Süper Admin — Yönetim Panosu Tasarımı

> **Durum:** Tasarım belgesi — kod yazılmadı. 24. oturumda implementasyon.
> **Konumu:** `admin/panel.html` (mevcut süper admin sayfası) altında yeni 3 sekme.
> **Yetki:** Yalnızca `super_admin` rolü.

---

## 📌 Neden Bu Pano?

AresPipe 23 oturumda olgun bir proje oldu ama Cihat'ın gözünden üç şey görünmüyordu:

1. **Kullanıcılardan gelen geri bildirimler** veritabanına düşüyordu, ama yönetilemiyordu (not defteri gibi)
2. **Projenin uzun vadeli hedefine olan uzaklığı** — günlük iş (örn. malzeme standartları) uzun vade vizyona (Spool AI) katkı veriyor mu, saptırıyor mu bilinmiyordu
3. **Yapılanlar / kalan işler** — ROADMAP.md'de metin olarak vardı ama görsel takip yoktu, başlangıçta net sonradan bulanık oluyordu

Pano bu üç boşluğu birlikte kapatıyor. **Yeni sistem değil — mevcut yaşayan dosyaların görsel yüzü.**

---

## 🏗 Yapı

Mevcut `admin/panel.html` içinde **"Yol Haritası"** ve **"Geri Bildirimler"** bölümleri çıkarılıyor (çöktüler). Yerine 3 sekmeli Pano geliyor:

```
Süper Admin Sayfası
├── Mevcut bölümler (firma yönetimi, kullanıcılar, vs.)   ← DOKUNMUYORUZ
├── [KALDIRILIYOR] Yol Haritası
├── [KALDIRILIYOR] Geri Bildirimler
└── [YENİ] Yönetim Panosu
    ├── Sekme 1: Görev Takibi
    ├── Sekme 2: Geri Bildirim Yönetimi
    └── Sekme 3: Oturum Panosu (Claude notları)
```

---

## 📋 Sekme 1 — Görev Takibi

### Amaç
"Şu an neredeyiz, neyi tamamladık, neyi yapacağız, bu iş hedefe hizmet ediyor mu?" sorularına **tek bakışta** cevap.

### Veri Kaynağı (C seçeneği — hibrit)

Pano iki kaynaktan besleniyor:

**1) Dosyalardan otomatik okur (statik görev planı):**
- `docs/ROADMAP.md` — 29 oturumluk yakın vade plan
- `docs/SPOOL-AI-VIZYON.md` — 7 katman + 5 faz uzun vade vizyon

Bu dosyalar pano açıldığında fetch edilir, markdown parse edilir, tablolara dökülür. Cihat dosyayı güncellediğinde pano otomatik güncellenir.

**2) Veritabanından okur (elle eklenen görevler):**

Yeni tablo:

```sql
CREATE TABLE panel_gorevler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik TEXT NOT NULL,
  aciklama TEXT,
  durum TEXT NOT NULL DEFAULT 'yapilacak',   -- yapilacak | yapiliyor | tamamlandi | ertelendi | iptal
  oncelik TEXT NOT NULL DEFAULT 'normal',    -- kritik | yuksek | normal | dusuk
  kategori TEXT,                             -- 'operasyon', 'ai', 'mobil', 'altyapi', 'yonetim'
  hedef_katman TEXT,                         -- Spool AI vizyon katmanı (opsiyonel, ör. "Katman 3 — Parça Kütüphanesi")
  hedef_oturum INT,                          -- planlanan oturum numarası (opsiyonel)
  tamamlanma_notu TEXT,                      -- "şu sebeple ertelendi" gibi
  kaynak TEXT NOT NULL DEFAULT 'manuel',     -- 'manuel' | 'feedback_dönüsümü' | 'vizyon' | 'roadmap'
  kaynak_id UUID,                            -- feedback'ten dönüşmüşse feedback.id
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme TIMESTAMPTZ,
  -- Yalnızca super_admin erişir — RLS aşağıda
);

-- RLS: sadece super_admin
ALTER TABLE panel_gorevler ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_gorevler_super_admin ON panel_gorevler
  FOR ALL
  USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'));
```

### Ekran Düzeni

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 ÖZET KARTLARI                                             │
│ [Toplam 23] [Tamamlandı 14] [Aktif 4] [Bekleyen 5]           │
├──────────────────────────────────────────────────────────────┤
│ 🎯 SPOOL AI VİZYON HARİTASI                                   │
│ (docs/SPOOL-AI-VIZYON.md'den otomatik okunur)                │
│                                                              │
│ Katman 1 — Eğitim Oyunu         ✅ PROTOTİP HAZIR            │
│ Katman 2 — 3D Montaj            ✅ PROTOTİP HAZIR            │
│ Katman 3 — Parça Kütüphanesi    🔵 YAPILIYOR (4 görev açık)  │
│ Katman 4 — Etiketleme Aracı     🟠 SONRAKI (2 görev planlı)  │
│ Katman 5 — QR Referans Ölçek    🟠 SONRAKI                   │
│ Katman 6 — Crowdsourced Küt.    ⚪ İLERİDE                   │
│ Katman 7 — AI Model Eğitimi     ⚪ 500+ VERİ SONRASI         │
├──────────────────────────────────────────────────────────────┤
│ 📅 YAKIN VADE — 29 OTURUM PLANI                              │
│ (docs/ROADMAP.md + panel_gorevler birleşik)                  │
│                                                              │
│ Filtre: [Tümü ▼] [Durum ▼] [Kategori ▼]  +YENİ GÖREV         │
│                                                              │
│ ✅ 22. Oturum — Faz A Faz 2: Malzeme Havuzu                  │
│ ✅ 23. Oturum — Faz B: Sapmama Sistemi                       │
│ 🔵 24. Oturum — Yönetim Panosu    [Aktif]        [Detay]     │
│ ⚪ 25. Oturum — Faz A Faz 3: Autocomplete        [Detay]     │
│ ⚪ 26. Oturum — Kesim/Büküm/Markalama bitirme    [Detay]     │
│ ⚪ Manuel: "Feedback FB-0042'den doğan iş"       [Detay]     │
└──────────────────────────────────────────────────────────────┘
```

### Görev Detay Modal'ı

Bir göreve tıklayınca açılacak kutu:

```
Görev: 26. Oturum — Kesim sayfasını bitir
Kategori: operasyon  |  Öncelik: yüksek  |  Durum: yapılacak
Hedef Katman: — (operasyon sayfası, Spool AI'a doğrudan hizmet etmiyor)
Hedef Oturum: 26

Açıklama: Kesim sayfası 14. oturumda %80'e geldi. Eksik: tablo export,
manuel parça ekleme validasyonu, KK entegrasyonu.

Kaynak: manuel  |  Oluşturma: 23 Nisan 2026

[Durum Değiştir ▼]  [Düzenle]  [Sil]  [Vizyona Bağla]
```

### Vizyon Bağlantısı (Kritik Özellik)

Her göreve bir hedef katman atanabilir. Bu Cihat'ın "bu iş hedefe hizmet ediyor mu?" sorusuna cevap:

- **Vizyona hizmet eden görev:** Yeşil çizgi + "→ Katman 3'e katkı" rozeti
- **Vizyonla bağlantısız görev:** Gri + "— operasyonel" rozeti
- **Vizyondan sapan görev:** Kırmızı + "⚠ hedeften uzaklaştırıyor" uyarısı (Claude bu etiketi önerir, Cihat onaylar)

Örnek yorum: "Malzeme standartlaştırma → Katman 3 (Parça Kütüphanesi) için canonical format altyapısı → hedefe yaklaştırıyor ✓"

---

## 💬 Sekme 2 — Geri Bildirim Yönetimi

### Mevcut Durum
Geri bildirim tablosu adını bilmiyoruz (`feedback` veya `geri_bildirimler` olabilir — implementasyon öncesi kontrol edilir). Kullanıcılardan gelen mesajlar birikiyor, yönetim yok.

### Varsayılan Tablo Şeması (eğer yoksa oluşturulur)

```sql
CREATE TABLE IF NOT EXISTS geri_bildirimler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID REFERENCES kullanicilar(id),
  tenant_id UUID,
  sayfa TEXT,                      -- hangi sayfadan gönderildi
  tip TEXT NOT NULL,               -- 'hata' | 'fikir' | 'soru' | 'diger'
  mesaj TEXT NOT NULL,
  ekler JSONB,                     -- screenshots vs. (ileride)
  durum TEXT NOT NULL DEFAULT 'yeni',  -- yeni | inceleniyor | yapilacak | yapildi | reddedildi
  yanit TEXT,                      -- süper admin'in cevabı
  yanit_tarihi TIMESTAMPTZ,
  gorev_id UUID REFERENCES panel_gorevler(id),  -- göreve dönüştürüldüyse
  olusturma TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Ekran Düzeni

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 ÖZET KARTLARI                                             │
│ [Yeni 7] [İnceleniyor 3] [Yapılacak 4] [Yapıldı 18]          │
├──────────────────────────────────────────────────────────────┤
│ 🔍 Filtre: [Tümü ▼] [Tip ▼] [Durum ▼] [Tarih ▼]              │
├──────────────────────────────────────────────────────────────┤
│ 🆕 Ahmet Yılmaz · 23 Nis 14:30 · kesim.html · HATA           │
│ "Manuel parça eklerken çap 0 girince hata vermiyor..."       │
│ [Aç] [Yanıtla] [Göreve Dönüştür] [Kapat: reddedildi ▼]       │
├──────────────────────────────────────────────────────────────┤
│ 🔵 Mehmet Can · 22 Nis 09:12 · devreler.html · FİKİR         │
│ "Export sırasında filtreli veri mi tam veri mi seçilebilsin" │
│ Yanıt verildi: "Teşekkürler, FB-0042 olarak göreve döndürdük"│
│ Görev: panel_gorevler.id = ... [Görevi Aç]                   │
├──────────────────────────────────────────────────────────────┤
│ ... (pagination)                                             │
└──────────────────────────────────────────────────────────────┘
```

### İşlemler

- **Yanıtla** → Kullanıcıya in-app bildirim + (ileride) email. Şimdilik yanıt veritabanında saklanır, kullanıcı sayfasında gösterilir.
- **Göreve Dönüştür** → `panel_gorevler` tablosuna yeni satır, `kaynak='feedback_dönüsümü'`, `kaynak_id=feedback.id`. Feedback durumu `yapilacak` olur.
- **Durum Değiştir** → yeni → inceleniyor → yapılacak/reddedildi → yapıldı akışı.

---

## 👤 Sekme 3 — Oturum Panosu (Claude Notları)

### Amaç
Cihat'ın Claude ile çalışma tarzı her oturumda kayboluyordu. Artık bir yerde duracak. Bu sekme **iki yönlü**:

1. **Cihat'ın profil dosyası** (`docs/CIHAT-PROFIL.md`) — Claude bu dosyayı her oturum başı okur
2. **Geçmiş oturumların özeti** (`.github/son-durum.md` + `CLAUDE-SON-OTURUM.md`) — kronolojik

### Ekran Düzeni

```
┌──────────────────────────────────────────────────────────────┐
│ 👤 PROFİL                                                    │
│ "docs/CIHAT-PROFIL.md" içeriği render edilir                 │
│ [Düzenle] butonuyla in-app edit (GitHub'a otomatik commit)   │
├──────────────────────────────────────────────────────────────┤
│ 📜 OTURUM GEÇMİŞİ (kronolojik, en üstte en yeni)             │
│                                                              │
│ Oturum 23 — Faz B                    23 Nis 2026   [Aç]      │
│   Sapmama sistemi, CI + kurallar.json, self-test             │
│   CI son: YEŞİL (0 hata, 22 uyarı)                           │
│                                                              │
│ Oturum 22 — Malzeme Havuzu           23 Nis 2026   [Aç]      │
│   tanimlar.html > Malzeme Havuzu sekmesi                     │
│                                                              │
│ Oturum 21 — Render Standardı        22 Nis 2026   [Aç]      │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│ 📈 CI DURUMU (son 10 commit)                                 │
│ 23 Nis 09:40 ✅ YEŞİL  0 hata, 22 uyarı                      │
│ 23 Nis 09:30 ✅ YEŞİL  0 hata, 22 uyarı                      │
│ 23 Nis 09:15 ✅ YEŞİL  0 hata, 22 uyarı                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Tasarım Standartları

AresPipe sisteminin standartlarına uyuyoruz:

- **Font:** Barlow (gövde), Barlow Condensed (başlık), JetBrains Mono (kod)
- **Renk:** CSS değişkenleri (`var(--ac)`, `var(--gr)`, `var(--re)`, `var(--warn)`, `var(--leg)`)
- **Tema:** `[data-theme=dark]` ve `[data-theme=light-anthracite]` desteği
- **Kart Stili:** `.stat-card` pattern (mevcut index.html'de var)
- **Sol Kenar (B-01):** Her satırda durum rengi (yeşil = ok, mavi = aktif, gri = bekliyor, kırmızı = uyarı)
- **Font Size (F-01):** Minimum 14px
- **i18n (G-01):** Tüm metinler `tv('anahtar', 'fallback')` — `lang/tr.json`, `lang/en.json`, `lang/ar.json` güncellenir
- **G-02 Hero + Pill:** Üst istatistik satırı bu standarda uyar
- **G-03 Render:** Zaten ARES_NORM kullanılır (malzeme/yüzey vs. görüntülenirse)

---

## 🔨 24. Oturum İçin Implementasyon Planı

### Saat 1 — Hazırlık
1. Mevcut `admin/panel.html`'i incele. "Yol Haritası" ve "Geri Bildirimler" bölümlerini bul, kaldırmaya hazırla.
2. Mevcut `feedback`/`geri_bildirimler` tablosu var mı kontrol et. Yoksa oluştur.
3. Yeni `panel_gorevler` tablosunu oluştur (SQL migration dosyası: `24-oturum-panel-gorevler.sql`).
4. RLS politikaları ekle.

### Saat 2 — Sekme 1 (Görev Takibi)
1. 3 sekmeli tab yapısı (mevcut tanimlar.html pattern'ı)
2. Özet kartları (G-02 Hero+Pill)
3. Katman haritası (vizyon dosyasından fetch + parse)
4. ROADMAP tablosu (dosyadan fetch + parse)
5. Manuel görev listesi (panel_gorevler DB'den)
6. +YENİ GÖREV modalı
7. Görev detay modalı

### Saat 3 — Sekme 2 (Geri Bildirim)
1. Geri bildirim listesi (filtreli)
2. Yanıtla / göreve dönüştür / durum değiştir akışları
3. Yanıt şablonu metin kutusu

### Saat 4 — Sekme 3 (Oturum Panosu)
1. Profil dosyası fetch + render (markdown → HTML)
2. Profil edit → GitHub'a API ile commit (ya da şimdilik sadece preview, edit 25. oturuma)
3. Oturum geçmişi (docs/sessions/ yoksa .github/son-durum.md'den)
4. CI durumu (GitHub Actions API ile)

### Saat 5 — Test + Temizlik
1. Tüm yetki kontrolü (super_admin haricinde görmüyor)
2. Mevcut "Yol Haritası" ve "Geri Bildirimler" bölümlerini sil
3. Lint kontrol (kontrol.js yeşil mi)
4. Manuel test: görev ekle, feedback yanıtla, durum değiştir

---

## ⚠ Açık Sorular (24. oturumda karar verilecek)

1. **Profil düzenleme** — Panoda in-app edit mi, yoksa sadece view mu? (GitHub API entegrasyonu zaman alabilir, başlangıçta view-only olur, 25. oturumda edit eklenir)
2. **CI durumu entegrasyonu** — GitHub Actions API erişimi token gerektirir. Token'ı süper admin paneli üzerinden ayarlar mı, yoksa Vercel env'e mi koyarız?
3. **Markdown render** — Vizyon ve profil dosyaları markdown. Tarayıcıda render için (A) marked.js CDN, (B) basit custom parser, (C) sadece ham metin gösterim. (A) en hızlı, başlangıçta A.

---

## ✅ Başarı Kriteri (24. Oturum Sonu)

- [ ] 3 sekme çalışıyor, super_admin harici görmüyor
- [ ] Görev ekle/düzenle/sil çalışıyor
- [ ] Feedback liste + yanıtla + göreve dönüştür çalışıyor
- [ ] Profil görünüyor (edit 25. oturuma)
- [ ] Oturum geçmişi listeleniyor
- [ ] CI son durum bir şekilde görünüyor (Actions API veya son-durum.md)
- [ ] Eski "Yol Haritası" + "Geri Bildirimler" bölümleri temizlendi
- [ ] Lint yeşil, G-03 uyumlu, i18n eklendi

---

## 📚 Referanslar

- Ana sayfa tasarım örneği: `index.html` (layout + renk + tab pattern)
- Tab yapısı örneği: `tanimlar.html` (sekme + alt-sekme)
- Modal pattern: `spool_detay.html` (popup form)
- Yetki kontrolü: `ARES.sayfaYetkiKontrol(['super_admin'])`
- Supabase bağlantısı: `ARES.supabase()`
- Font + renk: CSS değişkenleri + Barlow

---

**İlk yazım:** 23 Nisan 2026 — 23. oturum sonunda, 24. oturum hazırlığı için.
