# 24. Oturum — Süper Admin Pano

**Tarih:** 23 Nisan 2026
**Süre:** ~5 çalışma bloğu (Saat 1-5)
**Ana Tema:** `docs/PANO-TASARIM.md` plan → uygulama
**Sonuç:** Pano canlıda çalışıyor, 3 sekme dolu, CI yeşil, 26 mevcut feedback yeni akışa eşlendi.

---

## 📊 Hızlı Özet

| | Önce | Sonra |
|---|---|---|
| `admin/panel.html` | 1807 satır | 2179 satır (+372) |
| Sidebar öğe | 9 | 7 |
| Süper admin ana sayfa | Dağınık (Dashboard + 3 ayrı sayfa) | Tek Pano (3 sekme) |
| `feedback_kayitlari` kolon | 9 | 12 (+3) |
| `feedback_kayitlari` durum | 3 (bekliyor/onaylandi/reddedildi) | 5 (yeni/inceleniyor/yapilacak/yapildi/reddedildi) |
| DB tablosu | (yok) | `panel_gorevler` |
| Feedback yanıt mekanizması | ✕ | ✅ |
| Feedback → Görev dönüşümü | ✕ | ✅ |
| CI durum görünürlüğü | GitHub'a gir | Pano'da anlık |
| Profil takibi | Not defteri | Pano'da canlı |

---

## 🕐 Saat 1 — DB Migration

**Yapılan:**
- `panel_gorevler` tablosu kuruldu: `id, baslik, aciklama, kategori, oncelik, durum, kaynak, kaynak_id, katman, faz, olusturan_id, olusturma, guncellenme, tamamlanma, notlar` + 3 CHECK + 3 index + 1 update trigger
- `feedback_kayitlari` genişletildi: `yanit`, `yanit_tarihi`, `yanit_veren_id` (→kullanicilar FK)
- Durum CHECK genişletildi: eski 3 → yeni 5 değer
- 26 mevcut kayıt yeni akışa eşlendi:
  - `bekliyor` (N) → `yeni`
  - `onaylandi` (M) → `yapilacak`
  - `reddedildi` → `reddedildi`
- `is_super_admin()` helper function (SECURITY DEFINER, STABLE)
- 4 RLS policy `panel_gorevler` için (SELECT/INSERT/UPDATE/DELETE — tümü `is_super_admin()`)

**Hata → Düzeltme:**
- İlk denemede `UPDATE` eski CHECK'e takıldı (`'yeni' not in array[...,bekliyor,onaylandi,reddedildi]`).
- BEGIN/COMMIT atomik olduğu için transaction rollback oldu, veri kaybı yok.
- Düzeltme: DROP CONSTRAINT → UPDATE → ADD CONSTRAINT sırası.
- **Öğrenildi:** CHECK değişiminde her zaman bu sıra.

**Dosyalar:**
- `24-oturum-pano-migration.sql` (Supabase'de çalıştırıldı)
- `24-seed-gorevler.sql` (3 seed görev)

---

## 🕑 Saat 2 — Pano UI İskeleti

**HTML değişiklikleri:**
- Sidebar: 9 → 7 öğe. Çıkarılan: Geri Bildirimler / Yapılanlar / Yol Haritası. Eklenen: **📋 Pano** (Dashboard'dan hemen sonra).
- Silinen panel blokları: `pan-yapilanlar` (187 satır), `pan-feedback` (42 satır), `pan-yolharitasi` (45 satır).
- Yeni: `pan-pano` ~290 satır — 3 sekmeli (`pano-pane-gorev`, `pano-pane-feedback`, `pano-pane-oturum`).
- Görev modalı (Düzenle/Yeni/Sil) + görev CRUD UI.
- `<head>`'e `marked.js@12.0.2` CDN.

**JS değişiklikleri:**
- Silinen: `_YOL_HARITASI`, `_YH_DURUM`, `_YH_CLAUDE_DONE`, `_YH_SON_GUNCELLEME`, `CLAUDE_MD_URL` değişkenleri; `_normYhId`, `_oncelikBelirle`, `_parseCLAUDEmd`, `yolHaritasiYukle`, `yolHaritasiToggle`, `yolHaritasiRender` fonksiyonları (166 satır).
- Yeni: `panoTabSwitch`, `panoBolumToggle`, `panoVizyonYukle`, `panoRoadmapYukle`, `gorevYukle`, `gorevYeniAc`, `gorevDuzenleAc`, `gorevKaydet`, `gorevSil`.
- `goPan` güncellendi: `yolharitasi`/`yapilanlar`/`feedback` case'leri gitti, `pano` case'i eklendi.

**Seed:**
- 3 görev: "Sekme 2 Geri Bildirim UI" (yuksek/yapilacak), "Sekme 3 Oturum Panosu" (orta/yapilacak), "ARES_NORMALIZE temizliği" (dusuk/yeni).

---

## 🕒 Saat 3 — Feedback Yanıt + Göreve Dönüştürme

**Hata → Düzeltme:**
- Görev modalı şeffaf göründü. Sebep: `class="modal"`, `class="modal-btns"`, `class="form-lbl"` — mevcut sistem `modal-box`, `modal-foot`, `form-label` kullanıyor. 3 class ismi düzeltildi.
- Feedback sorgusu `Could not embed because more than one relationship was found` hatası verdi. Sebep: Saat 1'de eklenen `yanit_veren_id` FK'sı `kullanici_id` ile ambiguity yaratıyor. Düzeltme: `kullanicilar!kullanici_id(...)` syntax'ı.
- **Öğrenildi:** FK eklerken mevcut embed sorgularını disambiguate et.

**Yeni feedback akışı:**
- Liste kompakt kart — tıklanınca altında inline panel (▼ → ▲).
- Panel içeriği: mevcut yanıt (varsa) + yanıt textarea + 5 durum dropdown + "Göreve Dönüştür" butonu.
- Yanıt kaydet: `feedback_kayitlari.yanit` + `yanit_tarihi` + `yanit_veren_id` (oturumdaki admin).
- Göreve Dönüştür: Otomatik `panel_gorevler` kaydı oluşturuyor. Kategori eşleme: `hata` → `hata`, `eksik`/`fikir` → `ozellik`. Öncelik eşleme: `hata` → `yuksek`, `eksik` → `orta`, `fikir` → `dusuk`. `kaynak='feedback_donusumu'`, `kaynak_id=feedback.id`. Feedback durumu `yapilacak`a çekiliyor.

**ARES_NORMALIZE seed görevi zenginleştirildi:**
SQL ile güncellendi. Açıklama artık "NE / NASIL DÜZELTİLİR / HANGİ 11 SAYFA (`node .github/kontrol.js 2>&1 | grep ARES_NORMALIZE_EKSIK`) / NEDEN ACİL DEĞİL" bölümlü.

---

## 🕓 Saat 4 — Oturum Panosu (Sekme 3)

**3 bölüm canlı:**

1. **📈 CI Durumu** (üstte, açık)
   - Endpoint: `https://api.github.com/repos/cihatoztas-ai/arespipe/actions/runs?per_page=10`
   - Public repo → token yok, 60 req/saat rate limit yeterli
   - Üstte özet kart: YEŞİL/KIRMIZI/SARI + build numarası + tarih + GitHub link
   - Altta son 10 run listesi: sol kenar rengi (yeşil/kırmızı/gri), run numarası, workflow adı, branch, commit mesajı, tarih, ↗ link

2. **👤 Cihat Profili** (ortada, açık)
   - `docs/CIHAT-PROFIL.md` fetch + marked.js render
   - İlk açılışta yüklenir, tekrar yüklenmez (statik)

3. **📜 Oturum Geçmişi** (altta, kapalı)
   - `.github/son-durum.md` fetch + marked.js render
   - Başlangıçta kapalı — uzun içerik

**4 yeni fonksiyon:**
- `panoOturumYukle()` — sekme açıldığında master trigger
- `panoProfilYukle()` — profil md
- `panoOturumGecmisYukle()` — son-durum md
- `panoCiDurumYukle()` — GitHub API, conclusion → CSS class eşleme (success/failure/cancelled/pending/skipped)

**Pano style'ına eklendi:** `.ci-ozet`, `.ci-row`, `.ci-dot`, `.ci-info`, `.ci-no`, `.ci-msg`, `.ci-time`, `.ci-link` — toplam 30+ satır CSS.

**5 URL sabit:** `VIZYON_URL`, `ROADMAP_URL`, `PROFIL_URL`, `SONDUR_URL`, `GH_RUNS_URL`.

---

## 🕔 Saat 5 — Temizlik + Kapanış

**Yapılan:**
- Manuel test: tüm 3 sekme (Görev Takibi, Geri Bildirim, Oturum Panosu) Cihat tarafından onaylandı.
- Yetki: `super_admin` rol kontrolü panel açılışında (`panel.html` satır ~1770), RLS tablo seviyesinde (`is_super_admin()`).
- Lint: baseline korundu, yeni uyarı yok.
- 3 oturum sonu dosyası yazıldı.

**Erteleme (25. oturuma):**
- **Sistem Sağlığı kartı** (Pano'ya 22 uyarı detay listesi) — 2-3 saatlik ek iş, Saat 5 kapsamını aşardı. Gerekli: `kontrol.js`'in JSON export'u + Pano'da fetch + kategorili render.

---

## 📝 Değişen Dosyalar (Bu Oturum)

### DB (Supabase)
```
public.panel_gorevler                 — YENİ (16 kolon, 3 index, 1 trigger, 4 RLS policy)
public.feedback_kayitlari             — +3 kolon, durum CHECK genişlemiş
public.is_super_admin()               — YENİ function
```

### Kod
```
admin/panel.html                      — 1807 → 2179 satır (+372)
```

### Dokümantasyon
```
.github/son-durum.md                  — güncellendi
CLAUDE-SON-OTURUM.md                  — bu dosya
CLAUDE-SONRAKI-OTURUM.md              — 25. oturum gündemi
```

### Dokunulmayan Kritik Dosyalar
`.github/kontrol.js`, `.github/kurallar.json`, `.github/bozuk-ornekler/*`, `CLAUDE.md`, `ROADMAP.md`, `docs/*` — hepsi 23. oturumdaki halleriyle duruyor.

---

## 🧩 Mimari Kararlar

**1. Sidebar sadeleştirmesi — birleştirme lehine**
3 ayrı menü (Geri Bildirim + Yapılanlar + Yol Haritası) yerine tek "Pano" + 3 sekme. Sebep: Cihat'ın tek yerden takip ihtiyacı.

**2. CI için token'sız API**
Public repo → GitHub Actions API'a anonim erişim mümkün. Token yönetimi komplekse girmeye gerek yok. Rate limit (60/saat) kullanıcı başına — Cihat için fazlasıyla yeterli.

**3. Markdown render için marked.js CDN (seçenek A)**
Özel parser yazmak veya ham metin göstermek yerine CDN üzerinden marked.js. Hızlı başlangıç, isteğe göre 25+ oturumda özel style eklenebilir.

**4. Durum akışı birleştirmesi (feedback + görev aynı)**
Her iki tablonun durum kümesi aynı: `yeni/inceleniyor/yapilacak/yapildi/reddedildi`. Göreve dönüştürme kolaylaşır, UI tutarlı olur.

**5. Feedback'ten göreve dönüşümde otomatik eşleme**
Kategori ve öncelik otomatik seçiliyor ama admin düzenleme modalında değiştirebiliyor. "Akıllı default + kullanıcı override" pattern'ı.

---

## 🐛 Yaşanan Hatalar (Ders Kaydı)

1. **CHECK sıralama hatası** (Saat 1) — `UPDATE` eski CHECK'e takıldı. Çözüm: DROP → UPDATE → ADD. Kurallara eklenir: CHECK değişiminde sıra zorunlu.

2. **Modal class uyumsuzluğu** (Saat 3) — Benim eklediğim görev modalı mevcut CSS sistemine uymuyordu. Çözüm: `modal` → `modal-box`, vs. Kurallara eklenir: yeni modal eklerken mevcut `firmaModal`/`kulModal` yapısını örnek al.

3. **FK embed ambiguity** (Saat 3) — `feedback_kayitlari` artık `kullanicilar`'a 2 FK sahibi (kullanici_id + yanit_veren_id). PostgREST hangi FK'yı kullanacağını bilmiyor. Çözüm: `kullanicilar!kullanici_id(...)` syntax'ı. Kurallara eklenir: FK eklerken embed sorgularını güncelle.

---

## ✅ Sonuç

Pano Tasarımı (docs/PANO-TASARIM.md) → uygulama. 5 saatte tamamlandı, plana sadık kalındı. Saat 1-4 hedef işler, Saat 5 sağlama.

Cihat'ın **"en net ben nerden takip edebilirim?"** sorusuna **%80 cevap** verildi:
- ✅ Görev durumları → Pano > Görev Takibi
- ✅ CI yeşil/kırmızı → Pano > Oturum Panosu
- ✅ Roadmap → Pano > Görev Takibi > Roadmap bölümü
- ✅ Kullanıcı bildirimleri → Pano > Geri Bildirim
- ✅ Claude notları/profil → Pano > Oturum Panosu
- ⏳ CI uyarı detayı (22 uyarı hangi dosyada) → 25. oturum (Sistem Sağlığı kartı)

Geri kalan %20 bir sonraki oturumun ilk işi.
