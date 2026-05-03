# 54. Oturum — Mobile Vizyon + i18n Altyapısı (3 Mayıs 2026)

> **Durum:** ✅ Mobile vizyonu netleşti, prebuild altyapısı kuruldu, MSpoolDetay tasarım kararları bağlandı. M ekranlarındaki i18n bypass borcu (MK-54.1) tespit edildi, 55'e devredildi.
>
> 📜 Bu özet **53 + 54 birleşik** — 52 kapanışında ritüel dosyaları atlanmıştı, 53 ve 54 tamamlanmadan yeni özet yazılmadı. 55 açılışında oturum-saglik.sh script'i BAYAT dedi (MK-55.1), onarım modunda bu özet birleşik olarak toparlandı.

---

## 53. Oturum Özeti — Dökümantasyon Revizyonu (2 Mayıs 2026)

### Hedef
Cihat 53 başında talep etti: *"yakışıklı hazırlanmış cafcaflı dosyalar düzenleyip kenara atmak istemiyorum. ya canlı tutamayacağımız dosyalar olmasın ya da hiç olmasın."* — bayatlamış dökümantasyona karşı revizyon.

### Yapılanlar
1. **`docs/KARARLAR.md` doğdu** — Kanonik karar günlüğü. MK-49.1 → MK-52.4 dağınık halde duran tüm kararlar tek dosyada toplandı. Format: kategori etiketli (`[VIZYON]`, `[DISIPLIN]`, `[ALTYAPI]`...), geçerlilik durumlu (✅ Aktif / 🚫 İptal / 🔄 Revize), sebep açıklamalı.
2. **`docs/ROADMAP.md` öldü** — `docs/arsiv/ROADMAP-faz-b-c.md` adıyla arşivlendi. İçeriği `PROJE-HARITASI.md`'ye emildi.
3. **`docs/PANO-TASARIM.md` öldü** — `docs/arsiv/PANO-TASARIM-24-oturum.md` adıyla arşivlendi.
4. **`docs/PROJE-HARITASI.md` doğdu** — Modül bazlı yaşayan durum panosu (Aşama %, Son Durum, Sonraki Adım, Etiketler).
5. **Eski oturum arşivi başladı** — `docs/sessions/archive-01-22.md` (1-22. oturum özetleri).
6. **5 yeni karar** — MK-53.1 (KARARLAR.md doğumu) → MK-53.5 (etki taraması — anlık karar yakalama).

### Kritik karar
**MK-53.3** — Yeni dosya doğmadan önce kategorisi belirlenir: AKTIF (yaşar, canlı tutulur), ARŞIV (öldü ama tarihsel referans, `docs/arsiv/`), UYUR (ileride uyanacak modül, `docs/uyku/`). "Yaşar" dosya kabul edilmesinin üç şartı: rol netliği, tetikleyici netliği, sahip belli.

### Commit
`1998538 docs(53): dökümantasyon revizyonu — KARARLAR güncel, PROJE-HARITASI doğdu, ROADMAP+PANO arşivlendi, oturum arşivi başladı`

---

## 54. Oturum Özeti — Mobile Vizyon + i18n Altyapısı (3 Mayıs 2026)

### Hedef ve Sapma
**Planlanan:** 51-52'den ertelenen parser_kural canlı L2 başarısı (pipeline_no regex genişletme + `_l2_meta` log).

**Gerçekleşen:** Cihat mobile gündemini açtı, sohbet mobil vizyon konuşmasına döndü. parser_kural işi 55+'e ertelendi. Yerine 7 yeni karar + bir borç tespiti çıktı.

**Sapma değerlendirmesi:** Doğru yön. Mobile 5 hafta atalete girmişti — vizyon belirsizliği parser_kural işinden öncelikliydi.

### Yapılanlar

#### 1. Mobile vizyonu netleşti — 4 yeni karar (MK-54.A → MK-54.D)
- **MK-54.A** [VIZYON]: Mobile = web'in light versiyonu. Saha (veri girişi) + ofis (izleme). Üretim ekranları (devre tanımlama, IFS, izometri batch, kesim wizard, malzeme havuzu) **dahil değil**.
- **MK-54.B** [DISIPLIN]: Web öncül, mobile follower. Yeni özellik önce web'de doğar, mobile'a yansıtılır. Mobile-only özellik eklenmez.
- **MK-54.C** [VIZYON]: Vanilla mobile (`mobile.zip`, 7 HTML, 16 Nisan öncesi) referans olarak korunur, **kopya/port edilmez**. Tasarım/UX vanilla'dan, DB sorguları web'in bugünkü halinden, i18n web'le paylaşılan `lang/`'dan.
- **MK-54.D** [ALTYAPI]: Mobile prebuild pattern. `mobile/src/lang/` artık auto-generated, `mobile/package.json`'da `prebuild` script'i her build/dev öncesi `cp ../lang/*.json src/lang/` yapar. Tek anahtar kaynağı (`/lang/tr.json` 1659 anahtar), web ve mobile aynı dosya.

#### 2. MSpoolDetay tasarım kararları — 3 yeni karar (MK-54.E → MK-54.G)
- **MK-54.E** [TASARIM]: MSpoolDetay 3 sekme (Genel + Malzeme + İşlem Kayıtları). **3D Model sekmesi YOK** (web'de doğruluk problemi çözülene kadar). Malzeme sekmesi salt-okur. Geri bildirim FAB tüm sekmelerde.
- **MK-54.F** [TASARIM]: Tipografi WCAG kontrast düzeltmeleri. Sekme yazısı 11px → 14px, başlık 10px `--txd` → 12px `--txm` (kontrast 3.2:1 → 7:1 AAA). Renkler hardcoded hex değil CSS değişkeni ile.
- **MK-54.G** [TASARIM]: İşlem Durumu n/N format (örn. `Kesim 3/3 yeşil, Büküm 1/3 sarı`). İlerleme barı yok — bar bilgi katmıyor. Tema-spesifik renk değişkenleri (`--status-done/wip/no` koyu/açık tema için ayrı).

#### 3. i18n altyapısı kuruldu (kod commit'i)
- `mobile/package.json` scripts: `prebuild` + `predev` eklendi
- `mobile/.gitignore`'a `src/lang/` eklendi (auto-generated)
- Vercel build pipeline'ı `npm run build` çağırdığı için prebuild otomatik tetiklenir
- **Commit:** `f227253 feat(mobile-54): i18n altyapısı kuruldu, prebuild ile web lang/ paylaşımlı`

#### 4. Borç tespiti — MK-54.1
**M ekranları `useT()` hook'unu bypass ediyor.** Test sırasında keşfedildi: TR → EN → AR seçimi `localStorage` + html `lang` attribute güncelleniyor ama içerik aynı kalıyor. Sebep: ekranlar kendi paralel `[dil, setDil] = useState(...)` state'ini tutuyor, hook'u hiç çağırmıyor, JSX tüm yazılar hardcoded TR.

**Etkilenen dosyalar (denetim 55'te):**
- `mobile/src/screens/MGiris.jsx` — kanıtlı bypass
- `mobile/src/screens/MAnasayfa.jsx` — şüpheli
- `mobile/src/screens/MAnasayfaYonetici.jsx` — şüpheli
- `mobile/src/screens/MIslemler.jsx` — şüpheli
- `mobile/src/screens/MDrawer.jsx` — şüpheli

**Yan etki:** PROJE-HARITASI'nda bu ekranlar "%100 i18n'li" yazıyordu — yanlış bilgi, 54 kapanışında düzeltildi (%60: açılıyor ama i18n borç).

#### 5. PROJE-HARITASI mobile bölümü güncellendi
54'te ortaya çıkan vizyon (light versiyon, web öncül), prebuild altyapısı, MSpoolDetay tasarım kararları, MK-54.1 borç bilgisi PROJE-HARITASI'na işlendi.

### Commit'ler (54)
| Hash | Mesaj |
|------|-------|
| `f227253` | feat(mobile-54): i18n altyapısı kuruldu, prebuild ile web lang/ paylaşımlı |
| `dc41290` | docs: AUTO bölümleri güncellendi [skip ci] |
| `7467b10` | docs(54): oturum arşivi + 7 yeni MK kararı + PROJE-HARITASI mobil bölümü güncellendi |

### CI Son Durum (54 sonu)
- **Build:** ✅ YEŞİL (sarı uyarı)
- **Hata:** 0
- **Uyarı:** 28 (3 dosyada)
  - `izometri-batch.html`: 18 i18n eksik anahtar (`izb_*`)
  - `spool_detay.html`: 9 i18n eksik anahtar (`flansh_*`)
  - `devre_detay.html:1428`: 1 G-03 ham yüzey şüphesi
- **Vercel:** ✅ Production aktif

### DB değişiklikleri
Yok (54'te DB'ye dokunulmadı).

---

## Açık Borçlar Özeti

| Borç | Kaynak | Durum |
|------|--------|-------|
| **flansh_* / izb_* i18n eksik anahtarları (28 uyarı)** | 54 CI raporu | 55 birincil iş |
| **MK-54.1**: M ekranları useT() bypass (5 dosya) | 54 keşif | 55 ikincil iş |
| **MK-49.A**: spool_detay 3D model deterministik render (PDF parse → yon_dizilim JSON) | 49+'dan beri bekliyor | 55+ |
| **MK-49.B**: İzometri PDF yükleme bileşeni — wizard Adım 2 + devre detay sekmesi | 49+'dan beri bekliyor | 55+ |
| **parser_kural pipeline_no regex** (51 L2-FAIL) | 51 log | 55+ |
| **`_l2_meta` / `_l2_fallback` ai_api_log'a yazılması** | 51 borç | 55+ |
| **5+ Tersan PDF testi** (L2 başarı oranı ölçümü) | 51 borç | 55+ |
| **Migration disiplini kararı** | 51-52'den beri konuşuluyor | Henüz karar yok |
| **`CALISMA-MODU.md` ↔ `CIHAT-PROFIL.md` overlap** | 53 gözlem | Karar yok |
| **`asme_borular`/`cuni_borular` silme** | 35'te dondu | Durum belirsiz |

---

## 55. Oturuma Devredilen Ana İş

**Birincil iş:** CI'da raporlanmış 28 uyarı kapatma — 27 i18n eksik anahtar + 1 G-03 yüzey hatası. Bu 54'te yarım kalmış son dönem işidir, kapanmadan üzerine yeni iş eklemek doğru değil.

**İkincil:** MK-54.1 — mobile M ekranları i18n bypass denetimi.

**Detay:** `docs/CLAUDE-SONRAKI-OTURUM.md`.

---

## Önemli Öğrenmeler

1. **Ritüel atlamanın bedeli:** 52 kapanışında üç dosya (son-durum, son-oturum, sonraki-oturum) atlandı. 53 başında tamir edilmedi (sadece KARARLAR'a dökümantasyon revizyonu olarak yazıldı). 54 başında yine tamir edilmedi (mobile gündemi geldi). 55 başında "spool_detay yapıyorduk oradan devam" denildiğinde Claude'da somut gündem yoktu, userMemories'ten sahte gündem türetmeye çalıştı. **MK-55.1** bu zinciri kıracak: oturum-saglik.sh script'i BAYAT'sa ben işe başlamayacağım.

2. **Mobile 5 hafta atalet — sebebi vizyon belirsizliği değil baskı eksikliği:** Web evrildi (40+ sayfa, devre/spool/IFS/izometri batch refactor'ları), mobile geride kaldı çünkü bağımsız evrilme baskısı yoktu. MK-54.B (web öncül) bu boşluğu disiplin olarak doldurdu — artık her web değişikliği "mobile'a yansıyor mu?" sorusunu doğuracak.

3. **"Yarım kalmış iş" CI'da şişiyor:** 54'te `spool_detay.html`'de flansh_* tv() çağrıları yazılmış ama anahtarlar `lang/tr.json`'a eklenmemiş. CI uyarı verdi, deploy gitti, kullanıcıya `flansh_meta` gibi raw key görünüyor olabilir. **Disiplin:** Yeni `tv()` çağrısı yazınca aynı commit'te 3 dil dosyasına anahtar ekle. Pre-commit lint'i bu adımı zorlayacak (Faz B borcu).

---

> 55. oturum açılışında bu dosya okundu. 55'in gündemi: `docs/CLAUDE-SONRAKI-OTURUM.md`.
> Karar günlüğü: `docs/KARARLAR.md` (MK-55.1 dahil).
> Modül durumu: `docs/PROJE-HARITASI.md`.
