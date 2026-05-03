# AresPipe BRIEFING — 56. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 3 Mayıs 2026, 56 kapanışı

---

## 🎯 57. Oturum Gündemi

**Birincil iş:** Mobile MSpoolDetay sayfasını yaz — Cihat'ın vereceği vanilla referans dosyaya bakarak React'e port. Tasarım kararları **MK-54.E/F/G**'de yazılı: 3 sekme (Genel + Malzeme + İşlem Kayıtları), 3D yok, malzeme salt-okur, geri bildirim FAB, tipografi 14px sekme + 12px başlık `--txm`, n/N işlem durumu, tema-spesifik renkler. `useT()` doğru kullanılacak (MK-54.1 hatasını tekrarlamadan).

**Açılışta Cihat vanilla dosyayı verecek.** O olmadan kod yazımı başlamaz.

**İkincil iş (yapısal):** Etkileşimli kapanış checklist'i + git diff çelişki kontrolü (`oturum-saglik.sh --kapanis` genişletmesi). 56'nın bitmeyen B kapsamı. Vanilla dosya gelmezse veya kalan vakit varsa buna geç.

---

## ✅ 56'da Yapılanlar

- **BRIEFING.md mimarisi kuruldu.** 3 ayrı ritüel dosyası → tek dosya. Sebep: project knowledge sync gecikmesi/bug'ları + 4-5 dosya hatırlama yükü + yanlış özetin sonraki sohbeti yanıltma riski.
- **`oturum-saglik.sh` güncellendi.** BRIEFING.md başlık + mtime kontrolü, açılışta tazelik kapısı uyarısı (yavaş dosyalar `son_gozden_gecirme` ile takip).
- **MK-56.1, 56.2, 56.3 yazıldı.** Kapanış Cihat onayı + BRIEFING tek dosya + tazelik kapısı.
- **Eski 3 dosya `docs/arsiv/`'a taşındı.** (CLAUDE-SON-OTURUM-55.md, CLAUDE-SONRAKI-OTURUM-55.md, son-durum-54.md)
- **CLAUDE.md ritüeli güncellendi** — yeni tek-komut açılışı.
- **55'in sapması belgelendi:** *Önceki Claude `son-durum.md` Açık Borçlar listesini gündem sandı. O liste CI bakım kuyruğu, gündem değil. Asıl iş (MSpoolDetay) hiç başlamadı. Yapısal ders: dosyalardaki "Açık Borçlar" gündem değildir, gündem 🎯 bölümünde yazılır ve Cihat'ın 2. soru cevabıyla teyit edilir.*
- **CIHAT-PROFIL.md'ye yeni alerji eklendi:** *"Varsayım yapma, kanıttan git. Dosya yolu uydurma — kanıtlanmış yoldan gitmediysen, dosya gerçekten orada mı önce kontrol et."*

---

## 🗺️ Bilgi Haritası — Hangi Soru Hangi Dosyada

Sohbette bir bilgi gerekirse Claude buraya bakar, ilgili dosyayı `project_knowledge_search` veya `cat` ile çeker.

| Soru tipi | Dosya | Bölüm/İpucu |
|---|---|---|
| Bir MK kararının detayı | `docs/KARARLAR.md` | `MK-XX.Y` ara |
| Cihat'ın çalışma tarzı, alerjileri | `docs/CIHAT-PROFIL.md` | Tamamı |
| Claude'un Cihat'la nasıl çalışacağı | `docs/CLAUDE-CALISMA-MODU.md` | "Rol tanımı", "İletişim disiplini" |
| Sayfa X'in bilinen eksikleri | `docs/SAYFA-EKSIKLERI.md` | Sayfa adı başlığı, SED-XX-NN ID |
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

1. **(57 birincil)** MSpoolDetay React port (vanilla referansa göre, MK-54.E/F/G'ye uygun)
2. **(57 ikincil yapısal)** Etkileşimli kapanış checklist'i (`oturum-saglik.sh --kapanis` genişletmesi, hibrit Katman 1+2+3 modelinin tamamlanması)
3. **CI sarı temizliği** — 28 uyarı (9 `flansh_*` + 18 `izb_*` + 1 G-03 yüzey)
4. **MK-54.1** — M ekranları `useT()` bypass denetimi (5 dosya)
5. **MK-49.A** — spool_detay 3D model deterministik render (Three.js, $0 maliyet)
6. **MK-49.B** — İzometri PDF yükleme bileşeni (devre wizard Adım 2 + devre detay sekmesi)
7. **parser_kural pipeline_no regex** (51 L2-FAIL: `\d{3}` dar) + 5+ Tersan PDF testi
8. **`_l2_meta` / `_l2_fallback` `ai_api_log` görünürlük** (51 borç)
9. **Migration disiplini kararı** (51-52'den beri konuşuluyor)
10. **`asme_borular`/`cuni_borular` silme durumu** (35'te dondu, belirsiz)

---

## 🔧 Aktif Kritik MK Kararları

(Detay `docs/KARARLAR.md`, bunlar sadece *unutulmasın* başlıkları.)

- **MK-49.1** — `izometri-oku.js`'e dokunma (47 self-test felaketi dersi)
- **MK-50.1** — Hassas anahtar paylaşma (service_role JWT, API key, secret token Claude'a verilmez)
- **MK-50.3** — Yeterli örnek olmadan parser_kural yazılmaz (min 3 başarılı AI parse örneği)
- **MK-53.5** — Anlık karar yakalama (sohbette karar geçince bekleme, anında KARARLAR.md'ye işle)
- **MK-54.B** — Web öncül, mobile follower (mobile-only özellik reddedilir)
- **MK-54.E/F/G** — MSpoolDetay tasarım kararları (3 sekme, tipografi WCAG, n/N format)
- **MK-55.1** — Oturum sağlık scripti (mekanik açılış/kapanış, BAYAT'sa onarım modu)
- **MK-56.1** — Kapanış Cihat onayı (BRIEFING.md push edilmeden Cihat *"doğru"* demeli)
- **MK-56.2** — BRIEFING.md tek aktif bağlam dosyası (3 dosya birleştirildi)
- **MK-56.3** — Tazelik kapısı (yavaş dosyalara `son_gozden_gecirme` etiketi, script periyodik uyarır)

---

## 🔄 Tazelik Durumu — Yavaş Değişen Dosyalar

`oturum-saglik.sh --acilis` her oturumda bunları kontrol eder. `sonraki_zorunlu` ≤ aktif oturum ise uyarır.

| Dosya | Sahip | son_gozden_gecirme | sonraki_zorunlu | Tetikleyici |
|---|---|---|---|---|
| `SPOOL-AI-VIZYON.md` | Cihat | 56 | 76 (20 oturum) | Yeni katman, prototip→yapım geçişi |
| `docs/ARCHITECTURE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Mimari karar değişimi |
| `docs/CIHAT-PROFIL.md` | Cihat+Claude | 56 | 66 (10 oturum) | Yeni alerji/tercih tespiti |
| `docs/CLAUDE-CALISMA-MODU.md` | Cihat+Claude | 56 | 66 (10 oturum) | Yeni Claude disiplin dersi |
| `CLAUDE-MOBILE.md` | Cihat+Claude | 56 | 71 (15 oturum) | Yeni mobile şablon, prebuild değişimi |
| `docs/ONBOARDING.md` | Cihat+Claude | 56 | 76 (20 oturum) | Yeni yazılımcı katılımı, sistem değişimi |

**KARARLAR.md, SAYFA-EKSIKLERI.md, kurallar.json — tazelik kapısına alınmadı** çünkü bunlar zaten her oturumda dokunulan defter dosyaları.

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL.
- **Vercel:** ✅ Production aktif
- **DB:** Bu oturumda dokunulmadı

---

## 📦 Son 5 Commit

- 56'nın commit hash'i push'tan sonra otomatik dolacak
- 3f1f779 chore(ci): ci-son-rapor.json güncelle [skip ci]
- bdd7baf docs(55): MK-55.1 oturum-saglik.sh + 53+54 onarım modu
- f58c8d4 chore(ci): ci-son-rapor.json güncelle [skip ci]
- 7467b10 docs(54): oturum arşivi + 7 yeni MK kararı + PROJE-HARITASI mobil bölümü güncellendi

---

## 🚪 57. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 57. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 57 && cat BRIEFING.md

---

## 📝 56'da Açıkça Belgelenmiş Sapma Dersleri

1. **Açık Borçlar listesi gündem değildir.** Gündem `🎯` bölümüne yazılır. CI bakım kuyruğu ile asıl iş listesi karıştırılmaz.
2. **Dosya yolu uydurma.** *"Sanırım `docs/` altında"* deme — git'le, `ls`'le, kanıtla. (CIHAT-PROFIL.md'ye yeni alerji olarak eklendi.)
3. **Onarım modu özetin doğruluğunu doğrulamaz.** Sadece dosyaların güncel olduğunu kontrol eder. **MK-56.1** bunu kapatır: Cihat onayı zorunlu.
4. **`son-durum.md`'nin "Açık Borçlar" listesi gündem değil**, biriken iş listesi. İlk maddesini birincil iş sanma.
