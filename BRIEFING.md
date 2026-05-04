# AresPipe BRIEFING — 60. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 4 Mayıs 2026, 60 kapanışı

---

## 🎯 61. Oturum Gündemi

**Birincil iş #1 (i18n + mimari telafi):** **MGiris.jsx i18n + Provider entegrasyonu.** 60'ta açılan yeni borç. Üç parça:

1. **TemaProvider'ı `App.jsx`'e ekle** (MK-60.1 implementasyonu). Şu an `useTema()` çağıran her component `<TemaProvider>` olmadığı için crash riski taşıyor — MDrawer çalışıyor çünkü oturum öncesi açılmıyor, ama bu sessiz tehlike. App.jsx'te `<TemaProvider><I18nProvider>...</I18nProvider></TemaProvider>` sırası.
2. **MGiris.jsx local state'lerini sil**, `useT()` + `useTema()`'ya bağla. Local `tema` ve `dil` useState'leri kaldırılır, provider'lardan alınır. localStorage logic provider'larda zaten var.
3. **8 hardcoded Türkçe string `tv()` ile sar** — `mob_giris_email_bos`, `mob_giris_sifre_bos`, `mob_giris_hatali`, `mob_giris_email_dogrulanmadi`, `mob_giris_cok_deneme`, `mob_giris_lbl_email`, `mob_giris_lbl_sifre`, `mob_giris_yapiliyor` + `mob_giris_yap` (8 anahtar × 3 dil = 24).

Etkilenen: `mobile/src/App.jsx`, `mobile/src/screens/MGiris.jsx`, `lang/{tr,en,ar}.json`.

**İkincil iş (kalıcı borç):** `oturum-saglik.sh --kapanis` Katman 1 60'ta canlandı — kullanılarak sınanmaya devam ediyor. Pratikte gözlemlenen eksikler 61+'da iyileştirme turuna girer (örn. dropdown yerine input, kategori tablosu daha okunaklı format).

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview dinamik UUID input alanı

---

## ✅ 60'ta Yapılanlar

**Birincil iş #1 tamamlandı: Geri Bildirim MDrawer'a taşındı + MSpoolDetay FAB temizlik** (commit `a5b75a2`).

UX tutarlılık kararı 59'da onaylanmıştı: tüm sayfalardan tek tıkla geri bildirim, sayfa-özel FAB karmaşası yok. Üç dosya değişimi:

- **Yeni:** `mobile/src/components/MGeriBildirimSheet.jsx` (bağımsız component, ~150 satır). Props: `acik`, `kapat`. `useLocation()` ile sayfa_url otomatik alınıyor — artık spool sayfasına bağlı değil. CSS prefix `mfb-*` (eski `msd-fb-*` MSpoolDetay'a özeldi).
- **MDrawer.jsx:** Profili Düzenle altına Geri Bildirim satırı + `[fbAcik, setFbAcik]` state + render sonuna `<MGeriBildirimSheet/>`. Tıklama: `kapat() + setFbAcik(true)` (drawer kapanır, sheet açılır, zIndex çakışması yok).
- **MSpoolDetay.jsx:** FAB butonu + bottom sheet JSX + 5 FB state (`fbAcik`, `fbKat`, `fbNot`, `fbFotoData`, `fbGonderiyor`) + `fotoInputRef` + 3 handler (`fbFotoSec`, `fbFotoYukle`, `fbGonder`) + ~80 CSS satırı silindi. Net **~110 satır temizlik**. **Devre adı modal'ı** hâlâ `msd-fb-*` class'larını kullanıyor (semantik olarak yanıltıcı ama silmek riskli — 60+ rename açık borcu).

**i18n: 8 anahtar yeniden adlandırıldı + 1 yeni**, 3 dilde:

| Eski | Yeni |
|---|---|
| `mob_sp_geri_bildirim` | `mob_fb_baslik` |
| `mob_sp_fb_hata`/`eksik`/`fikir` | `mob_fb_hata`/`eksik`/`fikir` |
| `mob_sp_fb_placeholder`/`foto`/`gonderiliyor`/`gonder` | `mob_fb_*` (4 anahtar) |
| (yeni) | `m_drawer_geri_bildirim` |

Konvansiyon: `mob_fb_*` cross-cutting feedback feature için, `m_drawer_*` drawer satır etiketleri için.

**Birincil iş #2 tamamlandı: `oturum-saglik.sh --kapanis` Katman 1** (commit `afac0a8`) — MK-56.4'ün ilk somut çıktısı, 57-58-59 boyunca açık olan borç kapandı.

Mevcut `kapanis_kontrol()` fonksiyonu zenginleştirildi (152+ insertions, 42- deletions). Yeni özellikler:
- **Bu oturumun commit listesi** — önceki kapanış SHA'sından HEAD'e (`docs(N-1): kapanis` pattern'i ile bulunur, fallback BRIEFING.md mtime)
- **Working tree değişimleri** ayrı bölüm
- **7 kategori dosyası taraması** (`docs/KARARLAR.md`, `docs/ARCHITECTURE.md`, `docs/CIHAT-PROFIL.md`, `docs/SAYFA-EKSIKLERI.md`, `SPOOL-AI-VIZYON.md`, `kurallar.json`, `migrations/`) — her biri için commit + working tree diff şort-stat
- **Tazelik kapısı kapanışta da çalışır** (önce sadece açılış)
- **Onay akışı talimatı** — Katman 2 (Claude rapor) + Katman 3 (Cihat yargı) sözleşmesi açıkça yazılı

Otomatik commit yapmaz (MK-56.1 kapısı). Test simülasyonu: fake repo + 60 oturumu commit'leri + working tree değişimi + kategori dosyalarına dokunma → script doğru çıktı verdi (KARARLAR commit'lendi, CIHAT-PROFIL working tree, diğerleri "dokunulmadı yok mu?" sorusuyla).

**Açık Borç #8 kapandı** (commit `22a66a7`): `.DS_Store` track'ten çıkarıldı. Hem kök hem `mobile/.gitignore`'da `.DS_Store` zaten vardı, ama dosya bir zamanlar commit'lenmiş olduğu için git takip etmeye devam ediyordu. `git rm --cached .DS_Store` çözdü, diskte dosya kaldı (Finder yaratmaya devam edecek), git artık görmüyor.

**Açık Borç #7 kapandı** (commit `767efb8`): `mobile/src/screens/Devreler.jsx` (68 byte) + `IsBaslat.jsx` (72 byte) silindi. App.jsx route yok, hiçbir yerden import edilmiyordu, boş stub kabuklar. Gelecekte gerçek `MDevreler.jsx` (60+ açık borç #6) yazılacak — eski stub'lar `M` öneki taşımıyordu, kafa karıştırıcıydı.

**Açık Borç #3 kapandı** (commit `d714bb2`): Helper'lar `mobile/src/lib/format.js`'e taşındı.

10 helper export'lu yeni dosya (142 satır):
- `revFmt`, `markaHesapla`, `nNRenkler`, `alistirmaBilgi`, `formatTarih`, `formatTarihSaat`, `formatSure`, `formatSpoolId` (MSpoolDetay'dan kanonik)
- `malzemeEtiket`, `esc` (MDevreDetay'dan tek nokta)

MSpoolDetay -73 satır (645 → 577), MDevreDetay -38 satır (501 → 463). **Bonus bug fix:** MDevreDetay'ın `revFmt` fonksiyonu MSpoolDetay'ın defensive sürümüyle değiştirildi. Eski sürümde `revFmt('0')` → `'Rev0'`, `revFmt(NaN)` → `'RevNaN'` gibi sessiz bug'lar vardı; yeni sürüm `Number.isFinite(n) && n > 0` kontrolüyle bunları boş string'e çeviriyor. **33 birim test** Node ile geçti — kullanım pattern'leri (full marka, rev=0, malformed input, alistirma case'leri, esc XSS, vs.) doğrulandı. Browser'da MSpoolDetay + MDevreDetay görsel doğrulama temiz: tüm helper'lar doğru render etti, konsol kırmızı yok.

`getStageKey` MDevreDetay'da kaldı — UI semantiği taşıyor (MK-59.1 `on_imalat → bekliyor` map'i), `format.js`'e gitmemesi doğru.

**MK-54.1 (useT bypass denetimi) yarı kapatıldı:**
- 4 M ekranı (MAnasayfaYonetici, MDevreDetay, MIslemler, MSpoolDetay) ✓ useT'li
- MAnasayfa.jsx ✓ temiz (sadece role-based router, görünür text yok)
- **MGiris.jsx ⚠️ atlandı** — 8 hardcoded Türkçe string + kendi local tema/dil state. Scope refactor gerektiriyor (TemaProvider eksiği + i18n entegrasyonu), 60'ta yetişmedi → 61'in birincil işi.

**TemaProvider keşfi (MK-60.1'in doğum kanıtı):** `mobile/src/lib/tema.jsx` `useTema()`'yı `<TemaProvider>` içine zorunlu kılıyor (`throw new Error`), ama `App.jsx`'te `TemaProvider` hiç yok — sadece `I18nProvider` sarıyor. MDrawer `useTema()` çağırıyor ve canlıda çalışıyor, demek ki oturum öncesi MDrawer açılmıyor (giriş yapılana kadar drawer ulaşılamaz). Sessiz risk: gelecekte birinin oturum öncesi drawer açma denemesi crash. 61'de App.jsx'e eklenmeli.

**6 push (CI bot rebase'leri hariç 4 ana commit):**
- `a5b75a2` feat(mob/60): Geri Bildirim MDrawer'a tasindi + MSpoolDetay FAB temizlik
- `afac0a8` feat(60): oturum-saglik.sh --kapanis Katman 1 implementasyonu (MK-56.4)
- `22a66a7` chore(60): .DS_Store track'ten cikarildi
- `767efb8` chore(60): mobile/src/screens/Devreler.jsx + IsBaslat.jsx silindi
- `d714bb2` refactor(mob/60): helper'lar mobile/src/lib/format.js'e tasindi (Acik Borc #3)

**3 yeni MK kararı (KARARLAR.md MK-60.1, MK-60.2, MK-60.3):**
- MK-60.1 — TemaProvider App.jsx'e eklenmeli (oturum öncesi crash riski)
- MK-60.2 — `mobile/src/lib/format.js` mobil ortak helper modülü (DRY pattern)
- MK-60.3 — `oturum-saglik.sh --kapanis` Katman 1 canlı (MK-56.4 ilk somut çıktı)

**Bilinçli atlanan:**
- Açık Borç #9 CI sarı temizliği (28 uyarı) — limit yetmedi, 61+ ya da daha sonraki oturumlarda

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
| **Mobil format helper'ları** | `mobile/src/lib/format.js` | 60'ta doğdu, 10 export |
| CI kuralları (SED, MK, G) | `kurallar.json` (root) | Kural ID arama |
| Lokal dev akışı, debug nereye bakılır | `docs/LOCAL-DEV.md` | Bölüm 5 (debug çıkmazları) |
| Yeni yazılımcı rehberi | `docs/ONBOARDING.md` | Tamamı |
| Önceki oturumun özeti | `BRIEFING.md` (bu dosya) | "✅ Yapılanlar" |
| Sıradaki gündem | `BRIEFING.md` (bu dosya) | "🎯 Gündem" |
| Eski oturumlar (1-22) | `docs/sessions/archive-01-22.md` | — |
| Arşivlenmiş eski dökümanlar | `docs/arsiv/` | ROADMAP, PANO-TASARIM, eski ritüel dosyaları |

---

## 📋 Açık Borçlar (öncelik sırasıyla)

1. **(61 birincil #1)** MGiris.jsx i18n + Provider entegrasyonu — TemaProvider App.jsx'e (MK-60.1) + MGiris local state sil + 8 string `tv()` ile sar (24 i18n anahtar)
2. **MK-58.1** — `spooller.alistirma` enum migration (DB SELECT + standardize lowercase)
3. **MK-58.5** — Panel mobile preview dinamik UUID input
4. **MDevreler React port** (vanilla `mobile/devreler.html` → `mobile/src/screens/MDevreler.jsx`). MDevreDetay topbar'ındaki "Tüm Devreler" linki + geri butonu şu an `/devreler`'e gidiyor, ama MDevreler henüz yok — placeholder. Birincil iş olarak 62+'da gündeme gelecek.
5. **MSpoolDetay devre adı modal class rename** — `msd-fb-modal/overlay/sheet/handle/title/send` class'ları semantik olarak yanıltıcı (FB MDrawer'a taşındı, ama devre modal'ı hâlâ bunları kullanıyor). `msd-modal-*` rename'i küçük iş, 61+'da yapılabilir.
6. **CI sarı temizliği** — 28 uyarı (9 `flansh_*` + 18 `izb_*` + 1 G-03 yüzey)
7. **MK-49.A** — spool_detay 3D model deterministik render (Three.js, $0 maliyet) — web vanilla için
8. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
9. **MDevreDetay 7. step "Ön İmalat"** — eğer ihtiyaç doğarsa. Şu an `on_imalat` → `bekliyor` map'leniyor (MK-59.1), yeterli görünüyor. UX feedback'e göre revize edilebilir.
10. **MDevreDetay Malzeme + İşlem Kay. sekmeleri** — şu an "Yakında" placeholder. Devre seviyesi BOM (`spool_malzemeleri` JOIN) + `islem_log.devre_id` log akışı. Ayrı tasarım kararı + mockup gerektirir (61+).
11. **`oturum-saglik.sh --kapanis` v2** — Katman 1 canlı (60'ta), pratikte gözlenen eksikler 61+ iyileştirme turunda toplanacak (örn. çıktı format okunabilirliği)
12. **parser_kural pipeline_no regex** (51 L2-FAIL: `\d{3}` dar) + 5+ Tersan PDF testi
13. **`_l2_meta` / `_l2_fallback` `ai_api_log` görünürlük** (51 borç)
14. **Migration disiplini kararı** (51-52'den beri konuşuluyor)
15. **`asme_borular`/`cuni_borular` silme durumu** (35'te dondu, belirsiz)
16. **Lang dosya senkronizasyon scripti** — 15. oturumdan beri açık borç (web `sp_*` ↔ mobile `mob_*` paralel anahtar takibi)

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
- **MK-56.4** — Kapanış orkestra protokolü (`--kapanis` flag'i, üç katman). Detay: `docs/KAPANIS-ORKESTRA-TASARIM.md`. **Katman 1 60'ta canlı (MK-60.3).**
- **MK-58.2** — Mobil rota konvansiyonu (detay tekil + `:id`, liste çoğul)
- **MK-58.3** — Kontrast-kritik renkler için sabit hex (CSS variable bypass)
- **MK-58.4** — Root `lang/` tek kaynak, mobile türev (prebuild kopyalar)
- **MK-58.6** — ✅ TAMAMLANDI 59'da (4 sorgu schema fix)
- **MK-58.7** — Spool ID format min 4 basamak pad (dinamik genişleme)
- **MK-59.1** — `on_imalat` aşaması UI'da "Bekliyor" sayacına map'lenir (vanilla'da yutuluyordu)
- **MK-59.2** — Outputs'a dosya unique isim disiplini (Chrome `(1)` suffix riski)
- **MK-60.1** — TemaProvider App.jsx'e eklenmeli (oturum öncesi crash riski, MDrawer canlıyor çünkü oturum öncesi açılmıyor — 61'de düzeltilecek)
- **MK-60.2** — `mobile/src/lib/format.js` mobil ortak helper modülü (DRY pattern, gelecekte yeni screen'ler buradan import edecek)
- **MK-60.3** — `oturum-saglik.sh --kapanis` Katman 1 canlı (commit, working tree, 7 kategori taraması, tazelik kapısı, onay akışı talimatı)

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

**61'de bekleyen tazelik notu:** MK-60.2 (format.js helper modülü) `CLAUDE-MOBILE.md`'ye yeni bir bölüm olarak eklenebilir — gelecekte yeni mobil screen yazıldığında hangi helper'ların hazır olduğunu göstermek için. Dosya tazelik penceresi içinde (sonraki_zorunlu 71). MK-60.1 (TemaProvider) `docs/ARCHITECTURE.md`'ye provider zinciri bölümünde belgelenebilir (sonraki_zorunlu 71).

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL. (60'ta dokunulmadı, açık borç #6.)
- **Vercel (web):** ✅ Production aktif (`arespipe.vercel.app`)
- **Vercel (mobile):** ✅ Production aktif (`arespipe-mob.vercel.app`) — 60 değişiklikleri canlıda: MDrawer Geri Bildirim, MSpoolDetay FAB temiz, format.js helper'lar
- **DB:** Bu oturumda dokunulmadı — 60'ta sadece SELECT (test verisi alma için spool/devre id'leri)

---

## 📦 Son Commit'ler (60 sonu, kapanış öncesi)

- `d714bb2` refactor(mob/60): helper'lar mobile/src/lib/format.js'e tasindi (Acik Borc #3)
- `beeb18e` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `7d5d7e6` docs: AUTO bölümleri güncellendi [skip ci]
- `767efb8` chore(60): mobile/src/screens/Devreler.jsx + IsBaslat.jsx silindi
- `745ba4d` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `22a66a7` chore(60): .DS_Store track'ten cikarildi (.gitignore zaten kuralı içeriyordu)
- `39a136f` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `afac0a8` feat(60): oturum-saglik.sh --kapanis Katman 1 implementasyonu (MK-56.4)
- `3d8d5a7` docs: AUTO bölümleri güncellendi [skip ci]
- `589e293` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `a5b75a2` feat(mob/60): Geri Bildirim MDrawer'a tasindi + MSpoolDetay FAB temizlik

(60 kapanış commit'i — bu dosya + KARARLAR — push'tan sonra yukarı eklenecek.)

---

## 🚪 61. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 61. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 61 && cat BRIEFING.md

---

## 📝 Açıkça Belgelenmiş Sapma Dersleri

1. **Açık Borçlar listesi gündem değildir.** Gündem `🎯` bölümüne yazılır. CI bakım kuyruğu ile asıl iş listesi karıştırılmaz.
2. **Dosya yolu uydurma.** *"Sanırım `docs/` altında"* deme — git'le, `ls`'le, kanıtla. (CIHAT-PROFIL.md'de alerji.) **58'de doğrulandı:** Cihat *"KARARLAR.md kökte mi?"* diye baktırınca yokluk çıktı, `docs/` altındaymış. Bilgi Haritası tablosu doğruydu, kafadan tahmin yanlış.
3. **Onarım modu özetin doğruluğunu doğrulamaz.** Sadece dosyaların güncel olduğunu kontrol eder. **MK-56.1** bunu kapatır: Cihat onayı zorunlu.
4. **`son-durum.md`'nin "Açık Borçlar" listesi gündem değil**, biriken iş listesi. İlk maddesini birincil iş sanma.
5. **BRIEFING'in "Yapılanlar" listesi yalan söyleyebilir.** 56'da *"CIHAT-PROFIL.md'ye alerji eklendi"* yazıldı ama dosyaya dokunulmadı. Cihat onayı sırasında çelişki kaçtı. **Bu MK-56.4'ün (kapanış orkestra protokolü) doğum kanıtıdır** — 60'ta Katman 1 canlı (MK-60.3).
6. **Heredoc + Türkçe markdown güvenilmez.** `cat > X.md << 'EOF'` markdown tablosu/code block'la çakışıyor, TextEdit yapıştırma Türkçe karakterleri bozuyor + uzun metni yarım kesiyor. **Çözüm:** uzun dosyalar için Claude `create_file`, Cihat `~/Downloads/`'tan `cp`. (CIHAT-PROFIL.md'de alerji.)
7. **(58'de eklendi)** **zsh `!` history expansion + `||` delimiter karışıklığı.** `node -e "..."` içinde `!` veya `|` karakterleri olunca zsh karışır (`zsh: event not found`, `bad flag in substitute command`). **Çözüm:** Tek-tırnaklı heredoc ile geçici dosya yaz (`cat > /tmp/fix.js << 'EOF'`) sonra `node /tmp/fix.js` çalıştır. Veya direkt outputs'a Node script üretip `~/Downloads/`'tan çalıştır. 58'de iki ayrı sed/node komut zsh tarafından kırıldı, üçüncü deneme dosya yöntemi ile geçti.
8. **(58'de eklendi)** **CI bot push race.** Her commit'ten sonra GitHub Actions otomatik bir commit atıyor (`ci-son-rapor.json güncelle [skip ci]`). İkinci push'unu yapmadan önce `git pull --rebase origin main` zorunlu, yoksa "rejected (fetch first)" hatası gelir. 58'de bu pattern 4 kez yaşandı. 59'da 3 kez. 60'ta 5 push × her birinde rebase = sorunsuz, pattern artık otomatik. Sadece "uyarı"; kayıp yok.
9. **(58'de eklendi)** **Vite dev server prebuild ile çakışma.** `npm run prebuild` `mobile/src/lang/` klasörünü `rm -rf` ile siliyor. Aynı terminal'de Vite çalışıyorsa Vite watcher'ı şaşırtabilir; ayrıca prebuild bittikten sonra Vite "yeniden başlat" gerektirebilir. **Disiplin:** `npm run dev` çalışırken prebuild çalıştırılmaz; gerekirse Vite'ı `Ctrl+C` ile durdur, prebuild yap, `npm run dev` ile yeniden başlat.
10. **(58'de eklendi)** **SPA fallback — Vercel'de React Router için manuel rewrite gerekir.** `mobile/vercel.json` yoksa `/spool/:id` gibi rotalar doğrudan açıldığında 404 olur. Default Vite + Vercel kombinasyonu bunu otomatik yapmaz.
11. **(59'da eklendi)** **Chrome `(1)` suffix riski.** Outputs'a aynı isimle dosya konursa, ikinci indirme `MSpoolDetay (1).jsx` olarak iniyor, `cp` eski dosyayı kopyalıyor. **MK-59.2** çözer: outputs'a unique isim ver. **60'ta defaultlandı** (her dosya `*-MK60-fb.jsx`, `*-MK60-helper-tasima.jsx` formatında).
12. **(59'da eklendi)** **Vite zombie portlar.** Dev server'lar Ctrl+C ile düzgün kapatılmazsa portları (5173, 5174...) tutmaya devam eder. **60'ta gözlemlendi:** İlk başlatma 5174'e düştü (5173 zombi), iki kez yeniden başlatma sırasında 5173'e geri döndü. Toplu temizlik: `lsof -i :5173 -i :5174 -i :5175 -i :5176 | grep node` + `kill <PID>`.
13. **(59'da eklendi)** **zsh `#` yorum yorumlanmaz** — kabuk INTERACTIVE_COMMENTS ayarı kapalıysa terminale `# yorum` yapıştırılınca `command not found: #` verir. **60'ta yine yaşandı:** "# Vite çalışıyorsa..." yorumu komut bloğuna sokulunca terminale gitti. Komut bloğunda yorum yazma.
14. **(60'da eklendi)** **Mesajdaki kod bloğunu olduğu gibi terminale yapıştırma.** İki ayrı vaka:
    - JavaScript fonksiyon örnekleri (`function revFmt(rev) { return ${rev} }`) terminale gidince zsh backtick'leri açık string sandı, `quote>` prompt'una düştü.
    - Bash komut bloğunda Türkçe metin (`Vite'ın çalıştığı`) tek tırnak içerdiği için zsh açık tırnak başlangıcı sandı, yine `quote>`.
    Çözüm: kod bloklarında **sadece komut, açıklama yok**. Açıklama prose'da, kod bloklarında değil. `Ctrl+C` her seferinde kurtardı, kayıp yok.
15. **(60'da eklendi)** **SQL editöre bash yapıştırma.** Cihat bash bloğundaki açıklamayı SQL editöre yapıştırınca Postgres `# yorum` yorumlamadığı için "syntax error at or near `#`" verdi. Hiçbir şey kırılmadı, ders: hangi terminale ne yapıştırılıyor dikkat.
16. **(60'da eklendi)** **Vite default port 5173 ama zombileri varsa otomatik 5174/5175'e düşer.** URL verirken hangi porta düştüğünü Cihat'tan teyit et, yoksa "ERR_CONNECTION_REFUSED" gelir.
17. **(60'da eklendi)** **TemaProvider App.jsx'te yok ama useTema kullanılıyor.** Sessiz çalışıyor sebep: `useTema()` çağıran component oturum öncesi açılmıyor (MDrawer giriş sonrası gelir). Test etmeden mimari varsayım yapma — provider zincirine dosya temelli kanıtla bak (`grep TemaProvider App.jsx` boş döndü, kanıt). MK-60.1 bunu kapatır.
