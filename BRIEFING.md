# AresPipe BRIEFING — 59. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 4 Mayıs 2026, 59 kapanışı

---

## 🎯 60. Oturum Gündemi

**Birincil iş #1 (UX tutarlılık):** Geri Bildirim'i `MDrawer`'a (sağdan açılan menü) taşı + `MSpoolDetay`'daki FAB'ı kaldır. 59'da onaylanan karar: tüm sayfalardan tek tıkla erişim, sayfa-özel FAB karmaşası yok. İki dosyada değişiklik:
- `mobile/src/components/MDrawer.jsx` — yeni "Geri Bildirim" satırı + bottom-sheet modal (Hata/Eksik/Fikir kategorileri, fotoğraf eki opsiyonel)
- `mobile/src/screens/MSpoolDetay.jsx` — `fbAcik` state + FAB butonu + bottom sheet bloğu kaldırılacak (~50 satır temizlik)

**İkincil iş (yapısal):** `oturum-saglik.sh --kapanis` flag'inin kodlanması. Tasarım `docs/KAPANIS-ORKESTRA-TASARIM.md`'de yazılı, MK-56.4 kararı 57'de kondu, 58-59'da yetişmedi (her ikisinde de büyük port işleri zamanı doldurdu). 60'ta bekleyen iş listesinin başında, ama birincil iş kısa olduğu için bu sefer kapanır.

**Diğer açık borçlar (gündem değil, çözülecek):**
- MSpoolDetay helper taşıma (`formatSpoolId`, `revFmt`, `markaHesapla`, `nNRenkler`, `formatTarih`, `alistirmaBilgi`, `malzemeEtiket`) → `mobile/src/lib/format.js`. MDevreDetay aynı helper'ları kopyaladı, taşıma her ikisini DRY yapar.
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview dinamik UUID input alanı

---

## ✅ 59'da Yapılanlar

**Birincil iş #1 tamamlandı: MK-58.6 [PENDING] → ✅ TAMAMLANDI** (commit `674435e`).

Vanilla `mobile/spool_detay.html`'den miras 4 Supabase sorgusu DB schema ile uyumsuzdu, 400 Bad Request veriyordu. Etkilenen UI alanları (KK & Sevkiyat satırları, Belgeler bölümü, İşlem Kayıtları sekmesi) boş gözüküyordu. 5 sorgu yeniden yazıldı:

| Eski (yanlış) | Yeni (doğru) |
|---|---|
| `kk_davetler.contains('spool_ids', [X])` (kolon yok) | `kk_davet_spooller` junction üzerinden + nested `kk_davetler(davet_no, olusturma)` |
| `kk_no` | `davet_no` |
| `sevkiyatlar(sevkiyat_no, tarih)` | `sevkiyatlar(sevk_no, tarih)` |
| `belgeler: ad, dosya_adi, url, olusturma` | `belgeler: ad, dosya_url, olusturma` |
| `islem_log.eq('kayit_id', X)` | `islem_log.eq('spool_id', X)` |

UI tarafında 6 yer güncellendi: `kkBilgi.kk_no` → `davet_no`, `sevkBilgi.sevkiyat_no` → `sevk_no`, `b.url` → `b.dosya_url` (2 yer), `b.dosya_adi` ölü fallback temizlendi, KK davet sıralaması foreignTable order karmaşası nedeniyle JS tarafına alındı.

**Birincil iş #2 tamamlandı: MDevreDetay React port** (commit `2c1e339`).

Vanilla `mobile/devre_detay.html` 502 satır → `mobile/src/screens/MDevreDetay.jsx` 502 satır. **3 sekme yapısı:** Genel sekmesi TAM (sticky header + aşama tracker + spool kartları), Malzeme + İşlem Kay. sekmeleri "Yakında" placeholder (60+'da dolacak — vanilla'da bu sekmeler de yoktu zaten, MSpoolDetay ile tutarlılık için iskeleti şimdi konuldu).

- **Mockup-first onaylı tasarım (R-10):**
  - Aşama pill'leri **OVAL** — 2-3 basamaklı sayılar sığsın (vanilla'da daha dardı)
  - Renk paleti vanilla'dan **birebir** (`sp-bekliyor`, `sp-imalat`, `sp-kaynak`, `sp-on_kontrol`, `sp-kk`, `sp-sevkiyat`, `sp-durduruldu` CSS class hex'leri sabit hex olarak React'a taşındı — MK-58.3 disiplin)
  - **Sol bar = pill rengi** (kart aşaması bir bakışta okunuyor — Cihat'ın 59'daki feedback'i)
  - Sağ ince bar: alıştırma (yeşil tam · sarı kısmi · gri yok)
  - Topbar geri: `/devreler` (placeholder, MDevreler 60+'da yazılacak)
  - Sticky header: devre başlığı (`{Gemi} / {Sistem}`) + arama + spool sayacı + durduruldu pill (varsa)

- **MK-59.1 — `on_imalat` aşaması Bekliyor'a map'lendi:** Vanilla'da `on_imalat` aşamasındaki spool'lar yutuluyordu (sayaç 0 görünüyordu, kullanıcı şaşırıyordu). MDevreDetay'da `getStageKey(s)` helper'ı `on_imalat` → `bekliyor` map'ler, böylece bu spool'lar Bekliyor sayacında görünür. UI seviyesinde fix, DB'ye dokunulmaz.

- **Format helper'ları kopyalandı (MSpoolDetay'dan):** `formatSpoolId`, `revFmt`, `markaHesapla`, `malzemeEtiket`. Bunların `lib/format.js`'e taşınması açık borç olarak kaldı (MDevreDetay yazıldıktan sonra bilinçli geciktirildi, taşıma 60+'da yapılacak).

- **Sorgu select genişledi:** `spooller` select'ine `pipeline_no, rev` eklendi. `markaHesapla(s, devre, proje)` full marka oluşturmak için bunlara ihtiyaç duyuyor (örn. `NB1137-AT110-816-026-S01-Rev`).

**i18n: 23 yeni `mob_dv_*` anahtarı, 3 dilde** (TR/EN/AR). Root `lang/` tek kaynak (MK-58.4), prebuild mobile'a kopyalar. 1718 → 1741 anahtar, 3 dilde simetrik.

**6 push, 5 dosya değişti:**
- `674435e` fix(mob/59): MSpoolDetay 4 Supabase sorgusu schema fix (MK-58.6)
- `797cbfa` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `2c1e339` feat(mob/59): MDevreDetay React port + 23 i18n anahtari (3 dil)
- `27fa99a` docs: AUTO bölümleri güncellendi [skip ci]
- `4fe1099` chore(ci): ci-son-rapor.json güncelle [skip ci]

**2 yeni MK kararı (KARARLAR.md MK-59.1, MK-59.2):**
- MK-59.1 — `on_imalat` aşaması UI'da "Bekliyor" sayacına map'lenir
- MK-59.2 — Outputs'a dosya unique isim disiplini (Chrome `(1)` suffix riskini önler)

**İkincil iş (oturum-saglik.sh --kapanis):** Yine yapılmadı, 60'a devredildi. MK-58.6 fix + MDevreDetay port + 4 ekstra fix turu + i18n + lang dosyaları zamanı doldurdu.

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

1. **(60 birincil #1)** MDrawer'a Geri Bildirim satırı + MSpoolDetay FAB temizlik (UX tutarlılık, 59'da onaylandı)
2. **(60 ikincil yapısal)** `oturum-saglik.sh --kapanis` flag implementasyonu (tasarım MK-56.4 yazılı, 57-58-59'da yetişmedi)
3. **MSpoolDetay + MDevreDetay helper taşıma** — `formatSpoolId, revFmt, markaHesapla, nNRenkler, formatTarih, alistirmaBilgi, malzemeEtiket` → `mobile/src/lib/format.js`. İki dosya da kopyaladı, DRY için merkezi yer (60+'da yapılabilir, küçük iş)
4. **MK-58.1** — `spooller.alistirma` enum migration (DB SELECT + standardize lowercase)
5. **MK-58.5** — Panel mobile preview dinamik UUID input
6. **MDevreler React port** (vanilla `mobile/devreler.html` → `mobile/src/screens/MDevreler.jsx`). MDevreDetay topbar'ındaki "Tüm Devreler" linki + geri butonu şu an `/devreler`'e gidiyor, ama MDevreler henüz yok — placeholder. Birincil iş olarak 61+'da gündeme gelecek.
7. **mobile/src/screens kullanılmayan dosyalar** — `Devreler.jsx`, `IsBaslat.jsx` App.jsx route yok, sil veya bağla
8. **mobile/.gitignore** — `.DS_Store` ekleme (küçük temizlik)
9. **CI sarı temizliği** — 28 uyarı (9 `flansh_*` + 18 `izb_*` + 1 G-03 yüzey)
10. **MK-54.1** — M ekranları `useT()` bypass denetimi (5 dosya)
11. **MK-49.A** — spool_detay 3D model deterministik render (Three.js, $0 maliyet) — web vanilla için
12. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
13. **MDevreDetay 7. step "Ön İmalat"** — eğer ihtiyaç doğarsa. Şu an `on_imalat` → `bekliyor` map'leniyor (MK-59.1), yeterli görünüyor. UX feedback'e göre revize edilebilir.
14. **MDevreDetay Malzeme + İşlem Kay. sekmeleri** — şu an "Yakında" placeholder. Devre seviyesi BOM (`spool_malzemeleri` JOIN) + `islem_log.devre_id` log akışı. Ayrı tasarım kararı + mockup gerektirir (60+).
15. **parser_kural pipeline_no regex** (51 L2-FAIL: `\d{3}` dar) + 5+ Tersan PDF testi
16. **`_l2_meta` / `_l2_fallback` `ai_api_log` görünürlük** (51 borç)
17. **Migration disiplini kararı** (51-52'den beri konuşuluyor)
18. **`asme_borular`/`cuni_borular` silme durumu** (35'te dondu, belirsiz)
19. **Lang dosya senkronizasyon scripti** — 15. oturumdan beri açık borç (web `sp_*` ↔ mobile `mob_*` paralel anahtar takibi)

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
- **MK-56.4** — Kapanış orkestra protokolü (`--kapanis` flag'i, üç katman, iki yönlü çelişki kontrolü). Detay: `docs/KAPANIS-ORKESTRA-TASARIM.md`. **Implementasyon 60'a ertelendi.**
- **MK-58.2** — Mobil rota konvansiyonu (detay tekil + `:id`, liste çoğul)
- **MK-58.3** — Kontrast-kritik renkler için sabit hex (CSS variable bypass)
- **MK-58.4** — Root `lang/` tek kaynak, mobile türev (prebuild kopyalar)
- **MK-58.6** — ✅ TAMAMLANDI 59'da (4 sorgu schema fix)
- **MK-58.7** — Spool ID format min 4 basamak pad (dinamik genişleme)
- **MK-59.1** — `on_imalat` aşaması UI'da "Bekliyor" sayacına map'lenir (vanilla'da yutuluyordu)
- **MK-59.2** — Outputs'a dosya unique isim disiplini (Chrome `(1)` suffix riski)

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

**60'ta bekleyen tazelik notu:** MK-58.3 (kontrast-kritik renkler sabit hex) `CLAUDE-MOBILE.md` R-09'a ek nota dönüştürülecek — ama dosya henüz tazelik penceresi içinde (sonraki_zorunlu 71). 60-71 arası fırsat varsa eklenebilir. MK-59.2 (outputs unique isim) `CLAUDE-CALISMA-MODU.md`'ye eklenebilir (sonraki_zorunlu 66).

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL. (59'da değişmedi.)
- **Vercel (web):** ✅ Production aktif (`arespipe.vercel.app`)
- **Vercel (mobile):** ✅ Production aktif (`arespipe-mob.vercel.app`) — MDevreDetay canlı, MSpoolDetay 4 sorgu fix canlı
- **DB:** Bu oturumda dokunulmadı — 59'da MK-58.6 schema kontrolü için 2 SQL okuma (`information_schema.columns`), DDL yok

---

## 📦 Son 6 Commit (59 sonu)

- `4fe1099` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `27fa99a` docs: AUTO bölümleri güncellendi [skip ci]
- `2c1e339` feat(mob/59): MDevreDetay React port + 23 i18n anahtari (3 dil)
- `797cbfa` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `674435e` fix(mob/59): MSpoolDetay 4 Supabase sorgusu schema fix (MK-58.6)
- `59a4192` chore(ci): ci-son-rapor.json güncelle [skip ci]

(59 kapanış commit'i — bu dosya + KARARLAR — push'tan sonra yukarı eklenecek.)

---

## 🚪 60. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 60. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 60 && cat BRIEFING.md

---

## 📝 Açıkça Belgelenmiş Sapma Dersleri

1. **Açık Borçlar listesi gündem değildir.** Gündem `🎯` bölümüne yazılır. CI bakım kuyruğu ile asıl iş listesi karıştırılmaz.
2. **Dosya yolu uydurma.** *"Sanırım `docs/` altında"* deme — git'le, `ls`'le, kanıtla. (CIHAT-PROFIL.md'de alerji.) **58'de doğrulandı:** Cihat *"KARARLAR.md kökte mi?"* diye baktırınca yokluk çıktı, `docs/` altındaymış. Bilgi Haritası tablosu doğruydu, kafadan tahmin yanlış.
3. **Onarım modu özetin doğruluğunu doğrulamaz.** Sadece dosyaların güncel olduğunu kontrol eder. **MK-56.1** bunu kapatır: Cihat onayı zorunlu.
4. **`son-durum.md`'nin "Açık Borçlar" listesi gündem değil**, biriken iş listesi. İlk maddesini birincil iş sanma.
5. **BRIEFING'in "Yapılanlar" listesi yalan söyleyebilir.** 56'da *"CIHAT-PROFIL.md'ye alerji eklendi"* yazıldı ama dosyaya dokunulmadı. Cihat onayı sırasında çelişki kaçtı. **Bu MK-56.4'ün (kapanış orkestra protokolü) doğum kanıtıdır** — `--kapanis` flag'i kodlandığında bu sızıntı türü iki yönlü `git diff` çelişki kontrolüyle yakalanacak.
6. **Heredoc + Türkçe markdown güvenilmez.** `cat > X.md << 'EOF'` markdown tablosu/code block'la çakışıyor, TextEdit yapıştırma Türkçe karakterleri bozuyor + uzun metni yarım kesiyor. **Çözüm:** uzun dosyalar için Claude `create_file`, Cihat `~/Downloads/`'tan `cp`. (CIHAT-PROFIL.md'de alerji.)
7. **(58'de eklendi)** **zsh `!` history expansion + `||` delimiter karışıklığı.** `node -e "..."` içinde `!` veya `|` karakterleri olunca zsh karışır (`zsh: event not found`, `bad flag in substitute command`). **Çözüm:** Tek-tırnaklı heredoc ile geçici dosya yaz (`cat > /tmp/fix.js << 'EOF'`) sonra `node /tmp/fix.js` çalıştır. Veya direkt outputs'a Node script üretip `~/Downloads/`'tan çalıştır. 58'de iki ayrı sed/node komut zsh tarafından kırıldı, üçüncü deneme dosya yöntemi ile geçti.
8. **(58'de eklendi)** **CI bot push race.** Her commit'ten sonra GitHub Actions otomatik bir commit atıyor (`ci-son-rapor.json güncelle [skip ci]`). İkinci push'unu yapmadan önce `git pull --rebase origin main` zorunlu, yoksa "rejected (fetch first)" hatası gelir. 58'de bu pattern 4 kez yaşandı. 59'da da 3 kez. Sadece "uyarı"; kayıp yok.
9. **(58'de eklendi)** **Vite dev server prebuild ile çakışma.** `npm run prebuild` `mobile/src/lang/` klasörünü `rm -rf` ile siliyor. Aynı terminal'de Vite çalışıyorsa Vite watcher'ı şaşırtabilir; ayrıca prebuild bittikten sonra Vite "yeniden başlat" gerektirebilir. 58'de bir kez `ERR_CONNECTION_REFUSED` sebebi: Vite terminali yanlışlıkla prebuild komutu yedi, dev server durdu. **Disiplin:** `npm run dev` çalışırken prebuild çalıştırılmaz; gerekirse Vite'ı `Ctrl+C` ile durdur, prebuild yap, `npm run dev` ile yeniden başlat.
10. **(58'de eklendi)** **SPA fallback — Vercel'de React Router için manuel rewrite gerekir.** `mobile/vercel.json` yoksa `/spool/:id` gibi rotalar doğrudan açıldığında 404 olur. Default Vite + Vercel kombinasyonu bunu otomatik yapmaz. Yeni rota eklerken sayfa açılışında 404 oluyorsa, ilk kontrol: `mobile/vercel.json` rewrite var mı.
11. **(59'da eklendi)** **Chrome `(1)` suffix riski.** Outputs'a aynı isimle (örn. `MSpoolDetay.jsx`) dosya konursa, Cihat'ın `~/Downloads/` klasöründe aynı isim varsa Chrome ikinci indirmeyi `MSpoolDetay (1).jsx` olarak kaydeder. `cp ~/Downloads/MSpoolDetay.jsx ...` komutu **eski/orijinal dosyayı** kopyalar. 59'da MSpoolDetay fix'i bu sebeple kayboldu, panik yaşandı (~5 dk kayıp). **MK-59.2** çözer: Outputs'a unique isim ver (`MSpoolDetay-MK586-fix.jsx`, `App-MK59-route.jsx`, `tr-MK59-mobdv.json`).
12. **(59'da eklendi)** **Vite zombie portlar.** Dev server'lar Ctrl+C ile düzgün kapatılmazsa portları (5173, 5174, 5175...) tutmaya devam eder. Yeni `npm run dev` bir sonraki porta düşer. 59'da 4 paralel zombi Vite vardı (5173-5175), bizim oturumun başlattığı 5176'ya düştü, sonra zombi temizliği sonrası 5174'e. **Çözüm:** `lsof -i :5173 -i :5174 -i :5175 -i :5176 | grep node` ile tespit, `kill <PID>` ile temizle. **Disiplin:** Vite'ı kapatırken Ctrl+C kullan, terminal sekmesini direkt kapatma.
13. **(59'da eklendi)** **zsh `#` yorum yorumlanmaz** — kabuk INTERACTIVE_COMMENTS ayarı kapalıysa terminale `# yorum` yapıştırılınca `command not found: #` verir. Komut bloğu çıktısı verirken yorum satırlarını ya çıkar ya da Cihat'a "yorum satırlarını atla" notunu açıkça düş.
