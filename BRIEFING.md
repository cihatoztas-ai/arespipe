# AresPipe BRIEFING — 58. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 4 Mayıs 2026, 58 kapanışı

---

## 🎯 59. Oturum Gündemi

**Birincil iş #1:** MK-58.6 — MSpoolDetay'da 4 Supabase sorgusu 400 Bad Request düzeltmesi. Vanilla'dan miras schema uyumsuzluğu. Sorgular: `belgeler`, `islem_log`, `kk_davetler`, `sevkiyat_spooller`. Supabase SQL editor'de `information_schema.columns` ile gerçek kolon isimleri tespit edilip MSpoolDetay.jsx'teki sorgular düzeltilecek. Kullanıcı şu an KK & Sevkiyat satırları, Belgeler bölümü, İşlem Kayıtları sekmesi boş gözüküyor.

**Birincil iş #2:** MDevreDetay React port. Web `devre_detay.html`'den port — mobile (yeni) `mobile/src/screens/MDevreDetay.jsx`. MSpoolDetay topbar'ındaki `geri` butonu `/devre/:id`'e gidiyor şu an placeholder. MDevreDetay yazılınca otomatik bağlanır. Tasarım kararları açılışta konuşulacak (mevcut web devre_detay.html üzerinden + MK-54.E/F/G mantığı).

**İkincil iş (yapısal):** `oturum-saglik.sh --kapanis` flag'inin kodlanması. Tasarım `docs/KAPANIS-ORKESTRA-TASARIM.md`'de yazılı, MK-56.4 kararı 57'de kondu, 58'de kod yetişmedi (MSpoolDetay port'u + bug fix'ler 5 push aldı). 59'da bekleyen iş listesinin başında.

**Diğer 58 borçları (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview dinamik UUID input alanı
- `mobile/src/screens/{Devreler.jsx, IsBaslat.jsx}` — App.jsx route'u yok, kullanılıyor mu kontrol → kullanılmıyorsa sil
- `mobile/.gitignore`'a `.DS_Store` ekleme
- MSpoolDetay helper'larını (`formatSpoolId`, `revFmt`, `markaHesapla`, `nNRenkler`, `formatTarih`, `alistirmaBilgi`) `mobile/src/lib/format.js`'e taşı (MDevreDetay da kullanacak)

---

## ✅ 58'de Yapılanlar

**Birincil iş tamamlandı: MSpoolDetay React port** (vanilla `mobile/spool_detay.html` 635 satır → `mobile/src/screens/MSpoolDetay.jsx` 762 satır, ardından format düzeltmeleriyle ~775 satır).

- **Tasarım uygulamaları (MK-54.E/F/G + 58'de eklenenler):**
  - 3 sekme (Genel | Malzeme | İşlem Kayıtları), 3D Model atıldı
  - Spool Bilgileri'nde Pipeline No yerine **tam marka** (E-02 formatı: `proje_no-pipeline_no-spool_no[-RevN]` örn. `NB1137-AT110-816-026-S03`)
  - Alıştırma → Spool Bilgileri'nin son satırı (işlem değil, durum kabulü)
  - İşlem Durumu 4 satır (Kesim/Büküm/Markalama/Test), n/N renk pill (devre_detay.html 1308-1310 birebir port)
  - Tipografi 14px+ tabanlı (vanilla'da 10-11px ihlaller vardı)
  - Sekme yazıları açık temada `#1a1817`, koyu temada `#eceae3` (sabit hex, CSS variable bypass — MK-58.3)
  - Devre adı uzunsa ellipsis + bottom sheet modal
  - Topbar geri: `/devre/:id` (MDevreDetay placeholder)
  - Geri Bildirim FAB + bottom sheet (Hata/Eksik/Fikir)
  - Topbar ID: `formatSpoolId(sp.spool_id)` öncelikli (A-XXXX format), `spool_no` fallback
  - Spool ID format: min 4 basamak pad, dinamik genişleme (`A-000555` → `A-0555`, `A-012345` → `A-12345` — MK-58.7)
  - Ağırlık: tek desimal (`53.755801999...` → `53.8 kg`)

- **i18n: 65 yeni `mob_sp_*` anahtarı, 3 dilde** (TR/EN/AR). Root `lang/` tek kaynak (MK-58.4), prebuild mobile'a kopyalar. 1659 → 1718 anahtar, 3 dilde simetrik.

- **Süper admin paneli güncellendi:** `admin/panel.html` Mobile Önizleme bölümü artık React canlı URL'leri (`https://arespipe-mob.vercel.app/...`) iframe'liyor. Eski vanilla yolları (`../mobile/spool_detay.html` vb.) silindi. Cross-origin iframe çalışıyor (Vercel default'ta `X-Frame-Options` koymuyor). Hardcoded test UUID: `c79d0983-e0f3-406f-afde-bb7bc9ad92c3` (MK-58.5 — 59'da dinamik).

- **Bonus fix (planlanmamış):** SPA fallback eksik bug yakalandı + düzeltildi. `mobile/vercel.json` doğdu — 4 satırlık rewrite kuralı tüm path'leri `/index.html`'e yönlendirir, React Router parse eder. **MK-58 öncesi de sessiz var olan bir bug**: kullanıcı `/spool/:id` URL'ine doğrudan giderse veya F5'lese 404 alıyordu, ama tıklayarak gidişlerde fark edilmemişti. 58'de panel iframe testi sayesinde yakalandı.

- **5 push, 7 dosya değişti:**
  - `3ce6ae4` MSpoolDetay React port + 65 i18n + App.jsx route
  - `a3afc6d` panel mobile preview React URL'lerine güncellendi
  - `3d81366` mobile/vercel.json SPA fallback
  - `9a7be70` topbar spool_id öncelikli (A-XXXX format)
  - `e622794` formatSpoolId helper + ağırlık tek desimal

- **7 yeni MK kararı (KARARLAR.md MK-58.1..7):**
  - MK-58.1 [PENDING] — `spooller.alistirma` enum standardizasyonu
  - MK-58.2 — Mobil rota konvansiyonu (detay tekil + `:id`, liste çoğul)
  - MK-58.3 — Kontrast-kritik renkler için sabit hex (CSS variable bypass)
  - MK-58.4 — Root `lang/` tek kaynak, mobile türev (prebuild kopyalar)
  - MK-58.5 [PENDING] — Panel hardcoded UUID (59'da dinamik input)
  - MK-58.6 [PENDING] — MSpoolDetay 4 Supabase sorgu schema uyumsuzluğu
  - MK-58.7 — Spool ID format min 4 basamak pad (dinamik)

- **Vanilla kalıntı taraması TEMIZ.** mobile/ klasörü tamamen Vite/React, eski HTML/CSS/JS yok, admin'de `../mobile/` referansı yok. Sadece kökteki `./spool_detay.html` (web) korunmaya devam.

**İkincil iş (oturum-saglik.sh --kapanis):** Yapılmadı, 59'a devredildi. 5 push'luk birincil iş + bug fix kuyruğu zamanı doldurdu.

---

## 🗺️ Bilgi Haritası — Hangi Soru Hangi Dosyada

Sohbette bir bilgi gerekirse Claude buraya bakar, ilgili dosyayı `project_knowledge_search` veya `cat` ile çeker.

| Soru tipi | Dosya | Bölüm/İpucu |
|---|---|---|
| Bir MK kararının detayı | `docs/KARARLAR.md` | `MK-XX.Y` ara |
| Cihat'ın çalışma tarzı, alerjileri | `docs/CIHAT-PROFIL.md` | Tamamı |
| Claude'un Cihat'la nasıl çalışacağı | `docs/CLAUDE-CALISMA-MODU.md` | "Rol tanımı", "İletişim disiplini" |
| Sayfa X'in bilinen eksikleri | `docs/SAYFA-EKSIKLERI.md` | Sayfa adı başlığı, SED-XX-NN ID |
| Kapanış orkestra protokolü detayı | `docs/KAPANIS-ORKESTRA-TASARIM.md` | Tamamı (MK-56.4 referansı) |
| Vizyon, 7 katman durumu | `SPOOL-AI-VIZYON.md` (root) | Katman tablosu |
| Sistem mimarisi mantığı | `docs/ARCHITECTURE.md` | Bölüm 1-10, AUTO bölümleri CI'dan |
| API endpoint listesi/davranışı | `docs/API.md` | AUTO bölümü endpoint listesi |
| DB şeması, RLS, multi-tenant | `docs/DATABASE.md` | Tamamı |
| L2 parser kararları | `docs/L2-PARSER-NOTLARI.md` | Tamamı |
| İzometri batch mimarisi | `docs/IZOMETRI-BATCH-KARAR.md` + `IZOMETRI-BATCH-NOTLARI.md` | İlki kararlar, ikincisi brief |
| Mobil mimari, ekran şablonu | `CLAUDE-MOBILE.md` (root) | Tamamı |
| CI kuralları (SED, MK, G) | `kurallar.json` (root) | Kural ID arama |
| Lokal dev akışı, debug nereye bakılır | `docs/LOCAL-DEV.md` | Bölüm 5 (debug çıkmazları) |
| Yeni yazılımcı rehberi | `docs/ONBOARDING.md` | Tamamı |
| Önceki oturumun özeti | `BRIEFING.md` (bu dosya) | "✅ Yapılanlar" |
| Sıradaki gündem | `BRIEFING.md` (bu dosya) | "🎯 Gündem" |
| Eski oturumlar (1-22) | `docs/sessions/archive-01-22.md` | — |
| Arşivlenmiş eski dökümanlar | `docs/arsiv/` | ROADMAP, PANO-TASARIM, eski ritüel dosyaları |

---

## 📋 Açık Borçlar (öncelik sırasıyla)

1. **(59 birincil #1)** MK-58.6 — MSpoolDetay 4 Supabase sorgu schema fix (`belgeler`, `islem_log`, `kk_davetler`, `sevkiyat_spooller`)
2. **(59 birincil #2)** MDevreDetay React port (web `devre_detay.html` → `mobile/src/screens/MDevreDetay.jsx`)
3. **(59 ikincil yapısal)** `oturum-saglik.sh --kapanis` flag implementasyonu (tasarım MK-56.4 yazılı, 57 ve 58'de yetişmedi)
4. **MK-58.1** — `spooller.alistirma` enum migration (DB SELECT + standardize lowercase)
5. **MK-58.5** — Panel mobile preview dinamik UUID input
6. **MSpoolDetay helper taşıma** — `formatSpoolId, revFmt, markaHesapla, nNRenkler, formatTarih, alistirmaBilgi` → `mobile/src/lib/format.js` (MDevreDetay öncesi yapılabilir)
7. **mobile/src/screens kullanılmayan dosyalar** — `Devreler.jsx`, `IsBaslat.jsx` App.jsx route yok, sil veya bağla
8. **mobile/.gitignore** — `.DS_Store` ekleme (küçük temizlik)
9. **CI sarı temizliği** — 28 uyarı (9 `flansh_*` + 18 `izb_*` + 1 G-03 yüzey)
10. **MK-54.1** — M ekranları `useT()` bypass denetimi (5 dosya)
11. **MK-49.A** — spool_detay 3D model deterministik render (Three.js, $0 maliyet) — web vanilla için
12. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
13. **parser_kural pipeline_no regex** (51 L2-FAIL: `\d{3}` dar) + 5+ Tersan PDF testi
14. **`_l2_meta` / `_l2_fallback` `ai_api_log` görünürlük** (51 borç)
15. **Migration disiplini kararı** (51-52'den beri konuşuluyor)
16. **`asme_borular`/`cuni_borular` silme durumu** (35'te dondu, belirsiz)
17. **Lang dosya senkronizasyon scripti** — 15. oturumdan beri açık borç (web `sp_*` ↔ mobile `mob_*` paralel anahtar takibi)

---

## 🔧 Aktif Kritik MK Kararları

(Detay `docs/KARARLAR.md`, bunlar sadece *unutulmasın* başlıkları.)

- **MK-49.1** — `izometri-oku.js`'e dokunma (47 self-test felaketi dersi)
- **MK-50.1** — Hassas anahtar paylaşma (service_role JWT, API key, secret token Claude'a verilmez)
- **MK-50.3** — Yeterli örnek olmadan parser_kural yazılmaz (min 3 başarılı AI parse örneği)
- **MK-53.5** — Anlık karar yakalama (sohbette karar geçince bekleme, anında KARARLAR.md'ye işle)
- **MK-54.B** — Web öncül, mobile follower (mobile-only özellik reddedilir)
- **MK-54.E/F/G** — MSpoolDetay tasarım kararları (3 sekme, tipografi WCAG, n/N format) — 58'de uygulandı
- **MK-55.1** — Oturum sağlık scripti (mekanik açılış/kapanış, BAYAT'sa onarım modu)
- **MK-56.1** — Kapanış Cihat onayı (BRIEFING.md push edilmeden Cihat *"doğru"* demeli)
- **MK-56.2** — BRIEFING.md tek aktif bağlam dosyası (3 dosya birleştirildi)
- **MK-56.3** — Tazelik kapısı (yavaş dosyalara `son_gozden_gecirme` etiketi, script periyodik uyarır)
- **MK-56.4** — Kapanış orkestra protokolü (`--kapanis` flag'i, üç katman, iki yönlü çelişki kontrolü). Detay: `docs/KAPANIS-ORKESTRA-TASARIM.md`. **Implementasyon 59'a ertelendi.**
- **MK-58.2** — Mobil rota konvansiyonu (detay tekil + `:id`, liste çoğul)
- **MK-58.3** — Kontrast-kritik renkler için sabit hex (CSS variable bypass)
- **MK-58.4** — Root `lang/` tek kaynak, mobile türev (prebuild kopyalar)
- **MK-58.7** — Spool ID format min 4 basamak pad (dinamik genişleme)

---

## 🔄 Tazelik Durumu — Yavaş Değişen Dosyalar

`oturum-saglik.sh --acilis` her oturumda bunları kontrol eder. `sonraki_zorunlu` ≤ aktif oturum ise uyarır.

| Dosya | Sahip | son_gozden_gecirme | sonraki_zorunlu | Tetikleyici |
|---|---|---|---|---|
| `SPOOL-AI-VIZYON.md` | Cihat | 56 | 76 (20 oturum) | Yeni katman, prototip→yapım geçişi |
| `docs/ARCHITECTURE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Mimari karar değişimi |
| `docs/CIHAT-PROFIL.md` | Cihat+Claude | 57 | 67 (10 oturum) | Yeni alerji/tercih tespiti |
| `docs/CLAUDE-CALISMA-MODU.md` | Cihat+Claude | 56 | 66 (10 oturum) | Yeni Claude disiplin dersi |
| `CLAUDE-MOBILE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Yeni mobile şablon, prebuild değişimi |
| `docs/ONBOARDING.md` | Cihat+Claude | 56 | 76 (20 oturum) | Yeni yazılımcı katılımı, sistem değişimi |

**KARARLAR.md, SAYFA-EKSIKLERI.md, kurallar.json — tazelik kapısına alınmadı** çünkü bunlar zaten her oturumda dokunulan defter dosyaları.

**59'da bekleyen tazelik notu:** MK-58.3 (kontrast-kritik renkler sabit hex) `CLAUDE-MOBILE.md` R-09'a ek nota dönüştürülecek — ama dosya henüz tazelik penceresi içinde (sonraki_zorunlu 71). 59-71 arası fırsat varsa eklenebilir.

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL.
- **Vercel (web):** ✅ Production aktif (`arespipe.vercel.app`)
- **Vercel (mobile):** ✅ Production aktif (`arespipe-mob.vercel.app`) — SPA fallback eklendi 58'de
- **DB:** Bu oturumda dokunulmadı — 59'da MK-58.6 schema kontrolü için Supabase SQL editor

---

## 📦 Son 5 Commit (58 sonu)

- `e622794` fix(mob/58): spool_id min 4 basamak format + agirlik tek desimal
- `9a7be70` fix(mob/58): topbar spool_id oncelikli (A-0072 formati), spool_no fallback
- `3d81366` fix(mob/58): SPA fallback — mobile/vercel.json ile tüm rotalar index.html'e
- `a3afc6d` feat(admin/58): panel mobile preview React canlı URL'lerine güncellendi
- `3ce6ae4` feat(mob/58): MSpoolDetay React port + 65 i18n anahtarı (3 dil)

(58 kapanış commit'i — bu dosya + KARARLAR + SAYFA-EKSIKLERI — push'tan sonra yukarı eklenecek.)

---

## 🚪 59. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 59. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 59 && cat BRIEFING.md

---

## 📝 Açıkça Belgelenmiş Sapma Dersleri

1. **Açık Borçlar listesi gündem değildir.** Gündem `🎯` bölümüne yazılır. CI bakım kuyruğu ile asıl iş listesi karıştırılmaz.
2. **Dosya yolu uydurma.** *"Sanırım `docs/` altında"* deme — git'le, `ls`'le, kanıtla. (CIHAT-PROFIL.md'de alerji.) **58'de doğrulandı:** Cihat *"KARARLAR.md kökte mi?"* diye baktırınca yokluk çıktı, `docs/` altındaymış. Bilgi Haritası tablosu doğruydu, kafadan tahmin yanlış.
3. **Onarım modu özetin doğruluğunu doğrulamaz.** Sadece dosyaların güncel olduğunu kontrol eder. **MK-56.1** bunu kapatır: Cihat onayı zorunlu.
4. **`son-durum.md`'nin "Açık Borçlar" listesi gündem değil**, biriken iş listesi. İlk maddesini birincil iş sanma.
5. **BRIEFING'in "Yapılanlar" listesi yalan söyleyebilir.** 56'da *"CIHAT-PROFIL.md'ye alerji eklendi"* yazıldı ama dosyaya dokunulmadı. Cihat onayı sırasında çelişki kaçtı. **Bu MK-56.4'ün (kapanış orkestra protokolü) doğum kanıtıdır** — `--kapanis` flag'i kodlandığında bu sızıntı türü iki yönlü `git diff` çelişki kontrolüyle yakalanacak.
6. **Heredoc + Türkçe markdown güvenilmez.** `cat > X.md << 'EOF'` markdown tablosu/code block'la çakışıyor, TextEdit yapıştırma Türkçe karakterleri bozuyor + uzun metni yarım kesiyor. **Çözüm:** uzun dosyalar için Claude `create_file`, Cihat `~/Downloads/`'tan `cp`. (CIHAT-PROFIL.md'de alerji.)
7. **(58'de eklendi)** **zsh `!` history expansion + `||` delimiter karışıklığı.** `node -e "..."` içinde `!` veya `|` karakterleri olunca zsh karışır (`zsh: event not found`, `bad flag in substitute command`). **Çözüm:** Tek-tırnaklı heredoc ile geçici dosya yaz (`cat > /tmp/fix.js << 'EOF'`) sonra `node /tmp/fix.js` çalıştır. Veya direkt outputs'a Node script üretip `~/Downloads/`'tan çalıştır. 58'de iki ayrı sed/node komut zsh tarafından kırıldı, üçüncü deneme dosya yöntemi ile geçti.
8. **(58'de eklendi)** **CI bot push race.** Her commit'ten sonra GitHub Actions otomatik bir commit atıyor (`ci-son-rapor.json güncelle [skip ci]`). İkinci push'unu yapmadan önce `git pull --rebase origin main` zorunlu, yoksa "rejected (fetch first)" hatası gelir. 58'de bu pattern 4 kez yaşandı. Sadece "uyarı"; kayıp yok.
9. **(58'de eklendi)** **Vite dev server prebuild ile çakışma.** `npm run prebuild` `mobile/src/lang/` klasörünü `rm -rf` ile siliyor. Aynı terminal'de Vite çalışıyorsa Vite watcher'ı şaşırtabilir; ayrıca prebuild bittikten sonra Vite "yeniden başlat" gerektirebilir. 58'de bir kez `ERR_CONNECTION_REFUSED` sebebi: Vite terminali yanlışlıkla prebuild komutu yedi, dev server durdu. **Disiplin:** `npm run dev` çalışırken prebuild çalıştırılmaz; gerekirse Vite'ı `Ctrl+C` ile durdur, prebuild yap, `npm run dev` ile yeniden başlat.
10. **(58'de eklendi)** **SPA fallback — Vercel'de React Router için manuel rewrite gerekir.** `mobile/vercel.json` yoksa `/spool/:id` gibi rotalar doğrudan açıldığında 404 olur. Default Vite + Vercel kombinasyonu bunu otomatik yapmaz. Yeni rota eklerken sayfa açılışında 404 oluyorsa, ilk kontrol: `mobile/vercel.json` rewrite var mı.
