# AresPipe BRIEFING — 61. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 5 Mayıs 2026, 61 kapanışı

---

## 🎯 62. Oturum Gündemi

**Birincil iş #1 (61'den devir, mimari telafi):** **MGiris.jsx i18n + Provider entegrasyonu.** 60'ta açıldı, 61'de "araya konu al" kararıyla vizyon konsolidasyonuna kayıldı, 62'ye devredildi. Üç parça (içerik 60-61'den aynı):

1. **TemaProvider'ı `App.jsx`'e ekle** (MK-60.1 implementasyonu). Şu an `useTema()` çağıran her component `<TemaProvider>` olmadığı için crash riski taşıyor — MDrawer çalışıyor çünkü oturum öncesi açılmıyor, ama bu sessiz tehlike. App.jsx'te `<TemaProvider><I18nProvider>...</I18nProvider></TemaProvider>` sırası.
2. **MGiris.jsx local state'lerini sil**, `useT()` + `useTema()`'ya bağla. Local `tema` ve `dil` useState'leri kaldırılır, provider'lardan alınır. localStorage logic provider'larda zaten var.
3. **8 hardcoded Türkçe string `tv()` ile sar** — `mob_giris_email_bos`, `mob_giris_sifre_bos`, `mob_giris_hatali`, `mob_giris_email_dogrulanmadi`, `mob_giris_cok_deneme`, `mob_giris_lbl_email`, `mob_giris_lbl_sifre`, `mob_giris_yapiliyor` + `mob_giris_yap` (8 anahtar × 3 dil = 24).

Etkilenen: `mobile/src/App.jsx`, `mobile/src/screens/MGiris.jsx`, `lang/{tr,en,ar}.json`.

**İkincil iş (61'den taşıyor):** 4 MK karar adayı `docs/VIZYON-OTURUMLARI.md`'de yazıldı, henüz KARARLAR.md'ye geçmedi. 62'de yazılır:
- Spool agregat root pattern (yeni özellik kararlarında "bu spool agregatına mı enjekte olur?" sorusu zorunlu)
- Havuz batching pattern (yeni batching ihtiyacında bu desen referans)
- Format tanıtımı görsel template editor (prompt yazımı değil, görsel işaretleme)
- Etiketleme dörtlü bağ `parca_id`'den (foto/izometri/2D/STP ortak omurga)
- Yönetici gözlem fotosu (aşama yok, opsiyonel uyarı kutucuğu)

**Diğer açık borçlar (gündem değil, çözülecek):**
- MK-58.1 — `spooller.alistirma` kanonik enum migration (lowercase'e standardize)
- MK-58.5 — Panel.html mobile preview dinamik UUID input alanı

---

## ✅ 61'de Yapılanlar

> **Bu oturum bir kod oturumu olmadı** — gündem 60'ta MGiris.jsx i18n idi, Cihat *"araya başka konu al"* dedi, 4 vizyon belgesi (3'ü repo'da, 1'i yeni: `AI-VE-3D-VIZYON-v3.md`) okundu, sistem anatomisi çıkarıldı. Konsolidasyon ve karar oturumu oldu.

**Vizyon belgesi konsolidasyonu** (commit `[push sonrası eklenecek]`):

- **`docs/AI-VE-3D-VIZYON-v3.md` repo'ya alındı** (918 satır, 12 satırı repo entegrasyon notu). Belge SPOOL-AI-VIZYON v2.1'in revizyonu — v2.1 yerinde silinmedi (geçmiş kayıt), ama 4 madde v3 ile güncellendi: ürün karakteri (SaaS değil internal tool), hacim varsayımı (1000 spool/ay), foto akışı (QR-tetikli somutlaştı), tier modeli (terk edildi).

- **`docs/VIZYON-OTURUMLARI.md` doğdu** (146 satır, kategori belgesi). 61'in ilk kayıt. Bu sohbette ortaya çıkan her şey burada: 4 belgenin DNA ortaklığı, çelişki noktaları, sistem anatomisi (spool agregat, havuz pattern, bağlı raporlar, tezgahlar, uyarılar), Cihat'ın 15+ cevabı, 8 MK adayı, "ne kaçırıyorum" sorusunun cevabı, yeni proje transferi planı, 65-70 master vizyon konsolidasyonu hedefi.

- **BRIEFING bilgi haritasına 4 belge satırı eklendi** — 3 belge repo'da olmasına rağmen haritada yoktu (yetim), bu sohbette engel oldu. Düzeltme: `docs/KUTUPHANE-KAPSAM.md`, `docs/KUTUPHANE-YUKLEME-TAKIP.md`, `docs/VIZYON-VE-MODULER-MIMARI.md`, `docs/AI-VE-3D-VIZYON-v3.md`, `docs/VIZYON-OTURUMLARI.md`.

**4 yeni MK kararı** (KARARLAR.md MK-61.1, MK-61.2, MK-61.3, MK-61.4):
- **MK-61.1** — Foto arşiv stratejisi: sıkıştırılmış cloud + orijinal **yerel disk** (3-2-1 yedek). AI çağrıları sıkıştırılmış sürümü kullanır. v3'ün "3 versiyon paralel" stratejisinin hibrit hâli — bulut soğuk depo maliyeti ortadan kalkar.
- **MK-61.2** — Foto aşama bilgisi QR okutma anındaki spool aşamasından alınır, kişiden değil. Personel farklı aşamalarda çalışıyor olabilir; kişi → aşama eşlemesi sağlam değil.
- **MK-61.3** — Devre arşivlenmesi soft archive değil, görünürlük filtresi. Devre = aktif/biten. Gemi = aktif devre var/yok. Devre yeniden geldiğinde otomatik aktif. UI etiketlerle gizler/gösterir, veri yerinde durur.
- **MK-61.4** — Yeni belge yaratma kuralı: Yeni belge oluşturulurken **aynı anda** BRIEFING bilgi haritasında satırı + sahibi + tazelik penceresi tanımlanır. Yoksa yaratılmaz, mevcut belgeye eklenir. **Doğum kanıtı:** 61'de KUTUPHANE-KAPSAM, KUTUPHANE-YUKLEME-TAKIP, VIZYON-VE-MODULER 40-43. oturumlarda yaratılmıştı, bilgi haritasına eklenmemişti, 18-21 oturum boyunca yetim kaldılar.

**CIHAT-PROFIL.md'ye 2 yeni farkındalık** *(zaman kalırsa eklenecek, yoksa 62'ye)*:
- Heyecan-disiplin sarkacı: Cihat bazen heyecan yapıp yön sıçraması önerir, sonra geri çekilir. Claude körü körüne onaylamaz, *"şu an gerçekten zamanı mı?"* diye sorar.
- Kıyas + objektiflik dengesi: Cihat kıyastan veya eleştiriden rahatsız değil, abartıdan rahatsız. *"Kıyaslayabilirsin, eleştirebilirsin, iyi yönde ya da kötü yönde farketmez, sadece objektif olman yeter."* Pohpohlama (*"sektörün üstünde"*) ve küçümseme (*"basit CRUD"*) ikisi de dürüst değil. Kıyas yapılacaksa kanıtla, eğitim verisi kalıbıysa öyle söyle (*"eğitim verimde gördüğüm tipik..."*), insan deneyimi diliyle (*"farklı projelerin gövdesini görüyorum"*) sunma.

**4 belgenin DNA ortaklığı netleşti** (detay `docs/VIZYON-OTURUMLARI.md`):
- Spool = ML-uyumlu yapılandırılmış kayıt
- AI ikinci göz, karar verici değil
- Tetik koşulu olmadan iş yok
- Modülerlik birinci sınıf
- Veri silinmez, sıkıştırılır/arşivlenir
- RAG yolu (eğitim değil)
- Optionality (hiçbir kapı kapanmasın)

**Sistem anatomisi yazılı hâle geldi** (detay `docs/VIZYON-OTURUMLARI.md`):
- Spool agregat root → diğer kavramlar enjekte eder
- Havuz batching pattern → kesim/markalama/büküm aynı kalıp, 4. havuz hazır şablon
- Bağlı raporlar zinciri → F katmanı (müşteri portalı) altyapısı zaten kuruluyor
- Tezgahlar canlı görünürlük → "sıkışma analizi" gelecek altyapısı
- Devre arşivi = görünürlük filtresi (soft archive değil)

**Repo doğrulama dersi** (sapma 18 olarak BRIEFING'e eklendi):
Cihat *"spool detayda kütüphane bağlamı yapıldı"* dedi, Claude başta yanlış varsayım yapıp Parça Kimliği eksik sandı. Migration dosyalarına bakıldığında `tg_spool_malzemeleri_ref_sync` trigger + `malzeme_ref_id` kolonu bulundu — köprü gerçekten kuruluymuş. **Ders:** Cihat'ın anlatımındaki *"biz şunu yaptık"* cümleleri kontrol edilmiş varsayım kabul et, BRIEFING bilgi haritasındaki yokluk = gerçek yokluk değil olabilir, harita sadece tazelik kapısı.

**Bilinçli atlanan:**
- MGiris.jsx (62'ye, planlı)
- Diğer 4 MK karar adayı (62'ye, VIZYON-OTURUMLARI'da kayıtlı)
- CIHAT-PROFIL güncellemesi (zaman kalmazsa 62'ye)

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
| Vizyon, 7 katman durumu | `SPOOL-AI-VIZYON.md` (root) | v2.1, kısmen v3 ile revize edildi |
| **AI/3D vizyon revizyonu, internal tool, RAG** | `docs/AI-VE-3D-VIZYON-v3.md` | 5 May 2026, v2.1'in 4 maddesini günceller |
| **Modüler altyapı + 9 vizyon başlığı** | `docs/VIZYON-VE-MODULER-MIMARI.md` | 40. oturum, Parça Kimliği prensibi (Bölüm 2.A) |
| **Kütüphane standart kapsamı** | `docs/KUTUPHANE-KAPSAM.md` | 40. oturum, 7 malzeme grubu + DB şemaları |
| **Kütüphanenin canlı doluluk durumu** | `docs/KUTUPHANE-YUKLEME-TAKIP.md` | 43. oturum, P0-P3 öncelik sırası |
| **Vizyon konuşmalarının kümülatif kaydı** | `docs/VIZYON-OTURUMLARI.md` | 61'de doğdu, vizyon her geçtiğinde başlık eklenir |
| Sistem mimarisi mantığı | `docs/ARCHITECTURE.md` | Bölüm 1-10, AUTO bölümleri CI'dan |
| API endpoint listesi/davranışı | `docs/API.md` | AUTO bölümü endpoint listesi |
| DB şeması, RLS, multi-tenant | `docs/DATABASE.md` | Tamamı |
| L2 parser kararları | `docs/L2-PARSER-NOTLARI.md` | Tamamı |
| İzometri batch mimarisi | `docs/IZOMETRI-BATCH-KARAR.md` + `IZOMETRI-BATCH-NOTLARI.md` | İlki kararlar, ikincisi brief |
| Mobil mimari, ekran şablonu | `CLAUDE-MOBILE.md` (root) | Tamamı |
| Mobil format helper'ları | `mobile/src/lib/format.js` | 60'ta doğdu, 10 export |
| CI kuralları (SED, MK, G) | `kurallar.json` (root) | Kural ID arama |
| Lokal dev akışı, debug nereye bakılır | `docs/LOCAL-DEV.md` | Bölüm 5 (debug çıkmazları) |
| Yeni yazılımcı rehberi | `docs/ONBOARDING.md` | Tamamı |
| Önceki oturumun özeti | `BRIEFING.md` (bu dosya) | "✅ Yapılanlar" |
| Sıradaki gündem | `BRIEFING.md` (bu dosya) | "🎯 Gündem" |
| Eski oturumlar (1-22) | `docs/sessions/archive-01-22.md` | — |
| Arşivlenmiş eski dökümanlar | `docs/arsiv/` | ROADMAP, PANO-TASARIM, eski ritüel dosyaları |

---

## 📋 Açık Borçlar (öncelik sırasıyla)

1. **(62 birincil #1)** MGiris.jsx i18n + Provider entegrasyonu — TemaProvider App.jsx'e (MK-60.1) + MGiris local state sil + 8 string `tv()` ile sar (24 i18n anahtar)
2. **(62 ikincil)** 5 MK karar adayı KARARLAR.md'ye yazılmalı (VIZYON-OTURUMLARI.md'den taşıma)
3. **MK-58.1** — `spooller.alistirma` enum migration (DB SELECT + standardize lowercase)
4. **MK-58.5** — Panel mobile preview dinamik UUID input
5. **MDevreler React port** (vanilla `mobile/devreler.html` → `mobile/src/screens/MDevreler.jsx`). MDevreDetay topbar'ındaki "Tüm Devreler" linki + geri butonu şu an `/devreler`'e gidiyor, ama MDevreler henüz yok — placeholder. Birincil iş olarak 63+'da gündeme gelecek.
6. **MSpoolDetay devre adı modal class rename** — `msd-fb-modal/overlay/sheet/handle/title/send` class'ları semantik olarak yanıltıcı (FB MDrawer'a taşındı, ama devre modal'ı hâlâ bunları kullanıyor). `msd-modal-*` rename'i küçük iş, 62+'da yapılabilir.
7. **CI sarı temizliği** — 28 uyarı (9 `flansh_*` + 18 `izb_*` + 1 G-03 yüzey)
8. **MK-49.A** — spool_detay 3D model deterministik render (Three.js, $0 maliyet) — web vanilla için
9. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
10. **MDevreDetay 7. step "Ön İmalat"** — eğer ihtiyaç doğarsa. Şu an `on_imalat` → `bekliyor` map'leniyor (MK-59.1), yeterli görünüyor. UX feedback'e göre revize edilebilir.
11. **MDevreDetay Malzeme + İşlem Kay. sekmeleri** — şu an "Yakında" placeholder. Devre seviyesi BOM (`spool_malzemeleri` JOIN) + `islem_log.devre_id` log akışı. Ayrı tasarım kararı + mockup gerektirir (62+).
12. **`oturum-saglik.sh --kapanis` v2** — Katman 1 canlı (60'ta), pratikte gözlenen eksikler 62+ iyileştirme turunda toplanacak (örn. çıktı format okunabilirliği)
13. **parser_kural pipeline_no regex** (51 L2-FAIL: `\d{3}` dar) + 5+ Tersan PDF testi
14. **`_l2_meta` / `_l2_fallback` `ai_api_log` görünürlük** (51 borç)
15. **Migration disiplini kararı** (51-52'den beri konuşuluyor)
16. **`asme_borular`/`cuni_borular` silme durumu** (35'te dondu, belirsiz)
17. **Lang dosya senkronizasyon scripti** — 15. oturumdan beri açık borç (web `sp_*` ↔ mobile `mob_*` paralel anahtar takibi)
18. **Etiketleme sayfası** — vizyon belgelerinin yarısının kurulduğu sayfa, taslak halde duruyor. Cihat sahipleneceğini söyledi, sıra geldiğinde dörtlü bağ tasarımı (foto/izometri/2D/STP `parca_id` üzerinden).
19. **Master vizyon konsolidasyonu** — 4 belge → tek `docs/VIZYON.md`, 65-70 oturum civarı.

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
- **MK-60.1** — TemaProvider App.jsx'e eklenmeli (oturum öncesi crash riski, 62'de düzeltilecek)
- **MK-60.2** — `mobile/src/lib/format.js` mobil ortak helper modülü
- **MK-60.3** — `oturum-saglik.sh --kapanis` Katman 1 canlı
- **MK-61.1** — Foto arşiv: sıkıştırılmış cloud + orijinal yerel disk (3-2-1 yedek)
- **MK-61.2** — Foto aşama bilgisi QR okutma anındaki spool aşamasından (kişiden değil)
- **MK-61.3** — Devre arşivlenmesi görünürlük filtresi (soft archive değil)
- **MK-61.4** — Yeni belge yaratırken bilgi haritası satırı + sahip + tazelik penceresi zorunlu

---

## 🔄 Tazelik Durumu — Yavaş Değişen Dosyalar

`oturum-saglik.sh --acilis` her oturumda bunları kontrol eder. `sonraki_zorunlu` ≤ aktif oturum ise uyarır.

| Dosya | Sahip | son_gozden_gecirme | sonraki_zorunlu | Tetikleyici |
|---|---|---|---|---|
| `SPOOL-AI-VIZYON.md` | Cihat | 56 | 76 (20 oturum) | Yeni katman, prototip→yapım geçişi. **61'de kısmen v3 ile revize edildi, 65-70 master konsolidasyon planı var.** |
| `docs/AI-VE-3D-VIZYON-v3.md` | Cihat+Claude | 61 | 81 (20 oturum) | v3'ten ileri vizyon revizyonu, master konsolidasyona kadar. |
| `docs/VIZYON-OTURUMLARI.md` | Cihat+Claude | — | — | **Kayıt dosyası, tazelik kapısına alınmaz.** Eski oturumlar olduğu gibi durur, yenileri eklenir. |
| `docs/VIZYON-VE-MODULER-MIMARI.md` | Cihat | 40 | 70 (10 oturum, master öncesi) | Modüler altyapı prensipleri, 9 vizyon başlığı. Tetikler hâlâ geçerli mi diye 70'te bakılır. |
| `docs/KUTUPHANE-KAPSAM.md` | Cihat | 40 | 70 (10 oturum) | Yeni malzeme grubu eklendiğinde, yeni standart girince. |
| `docs/KUTUPHANE-YUKLEME-TAKIP.md` | Cihat | 43 | — | **Canlı durum dosyası, tazelik yerine her dolduruluda elle güncellenir.** |
| `docs/ARCHITECTURE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Mimari karar değişimi |
| `docs/CIHAT-PROFIL.md` | Cihat+Claude | 57 | 67 (10 oturum) | Yeni alerji/tercih tespiti. **61'de heyecan sarkacı + kıyas yorumlamama farkındalıkları eklenmesi planlandı, 62'ye taşınabilir.** |
| `docs/CLAUDE-CALISMA-MODU.md` | Cihat+Claude | 56 | 66 (10 oturum) | Yeni Claude disiplin dersi |
| `CLAUDE-MOBILE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Yeni mobile şablon, prebuild değişimi |
| `docs/ONBOARDING.md` | Cihat+Claude | 56 | 76 (20 oturum) | Yeni yazılımcı katılımı, sistem değişimi |

**KARARLAR.md, SAYFA-EKSIKLERI.md, kurallar.json — tazelik kapısına alınmadı** çünkü bunlar zaten her oturumda dokunulan defter dosyaları.

**62'de bekleyen tazelik notu:** MK-60.2 (format.js helper modülü) `CLAUDE-MOBILE.md`'ye yeni bir bölüm olarak eklenebilir. MK-60.1 (TemaProvider) `docs/ARCHITECTURE.md`'ye provider zinciri bölümünde belgelenebilir. MK-61.1/61.2 (foto arşiv + aşama) `docs/ARCHITECTURE.md`'ye veya yeni bir `docs/FOTO-AKISI.md`'ye girer (62-63 civarı).

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL. (61'de dokunulmadı.)
- **Vercel (web):** ✅ Production aktif (`arespipe.vercel.app`)
- **Vercel (mobile):** ✅ Production aktif (`arespipe-mob.vercel.app`)
- **DB:** Bu oturumda dokunulmadı (kod oturumu olmadığı için).

---

## 📦 Son Commit'ler (60 sonu)

- `c236b1f` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `0d5c9f8` docs(60): kapanis - BRIEFING 60 + 3 MK karari (MK-60.1, MK-60.2, MK-60.3)
- `4e2da13` chore(ci): ci-son-rapor.json güncelle [skip ci]
- `d714bb2` refactor(mob/60): helper'lar mobile/src/lib/format.js'e tasindi (Acik Borc #3)
- `767efb8` chore(60): mobile/src/screens/Devreler.jsx + IsBaslat.jsx silindi
- `22a66a7` chore(60): .DS_Store track'ten cikarildi
- `afac0a8` feat(60): oturum-saglik.sh --kapanis Katman 1 implementasyonu (MK-56.4)
- `a5b75a2` feat(mob/60): Geri Bildirim MDrawer'a tasindi + MSpoolDetay FAB temizlik

(61 kapanış commit'i — bu dosya + KARARLAR + 2 yeni belge + bilgi haritası + CIHAT-PROFIL — push'tan sonra yukarı eklenecek.)

---

## 🚪 62. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 62. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 62 && cat BRIEFING.md

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
12. **(59'da eklendi)** **Vite zombie portlar.** Dev server'lar Ctrl+C ile düzgün kapatılmazsa portları (5173, 5174...) tutmaya devam eder. Toplu temizlik: `lsof -i :5173 -i :5174 -i :5175 -i :5176 | grep node` + `kill <PID>`.
13. **(59'da eklendi)** **zsh `#` yorum yorumlanmaz** — kabuk INTERACTIVE_COMMENTS ayarı kapalıysa terminale `# yorum` yapıştırılınca `command not found: #` verir. Komut bloğunda yorum yazma.
14. **(60'da eklendi)** **Mesajdaki kod bloğunu olduğu gibi terminale yapıştırma.** İki ayrı vaka: JavaScript fonksiyon örnekleri (`function revFmt(rev) { return ${rev} }`) terminale gidince zsh backtick'leri açık string sandı, `quote>` prompt'una düştü. Bash komut bloğunda Türkçe metin (`Vite'ın çalıştığı`) tek tırnak içerdiği için zsh açık tırnak başlangıcı sandı. Çözüm: kod bloklarında **sadece komut, açıklama yok**.
15. **(60'da eklendi)** **SQL editöre bash yapıştırma.** Cihat bash bloğundaki açıklamayı SQL editöre yapıştırınca Postgres `# yorum` yorumlamadığı için "syntax error at or near `#`" verdi. Hangi terminale ne yapıştırılıyor dikkat.
16. **(60'da eklendi)** **Vite default port 5173 ama zombileri varsa otomatik 5174/5175'e düşer.** URL verirken hangi porta düştüğünü Cihat'tan teyit et, yoksa "ERR_CONNECTION_REFUSED" gelir.
17. **(60'da eklendi)** **TemaProvider App.jsx'te yok ama useTema kullanılıyor.** Sessiz çalışıyor sebep: `useTema()` çağıran component oturum öncesi açılmıyor. Test etmeden mimari varsayım yapma — provider zincirine dosya temelli kanıtla bak.
18. **(61'de eklendi)** **Bilgi haritası eksiği = belge yokmuş gibi davranma riski.** 61'de Cihat *"4 vizyon belgesi okuyalım"* dedi, Claude 3 belgeyi (`KUTUPHANE-KAPSAM`, `KUTUPHANE-YUKLEME-TAKIP`, `VIZYON-VE-MODULER-MIMARI`) BRIEFING bilgi haritasında bulamayınca *"yetim, repo'da yok galiba"* sandı. Repo cloning + `find` ile bakılınca üçü de `docs/` altında çıktı. **MK-61.4 bunu kapatır** — yeni belge yaratırken bilgi haritası satırı zorunlu.
19. **(61'de eklendi)** **Cihat'ın "biz şunu yaptık" cümleleri kontrol edilmiş varsayım kabul.** 61'de Cihat *"spool detayda kütüphane bağlamı yapıldı"* dedi, Claude başta yanlış varsayım yapıp Parça Kimliği eksik sandı (5 geri dönüşsüz karardan biri olarak listeledi). Migration dosyalarına bakıldığında `tg_spool_malzemeleri_ref_sync` trigger + `malzeme_ref_id` kolonu bulundu — köprü gerçekten kuruluymuş. BRIEFING bilgi haritasındaki yokluk = gerçek yokluk değil olabilir, harita sadece tazelik kapısı.
