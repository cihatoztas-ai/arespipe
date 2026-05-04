# AresPipe BRIEFING — 57. Oturum Kapanışı

> **Bu dosya tek aktif bağlam dosyası.** Sohbet açılışında `cat BRIEFING.md` çıktısını yapıştır, ben tüm bağlamı anlarım. Detay için referans dosyalar (`docs/KARARLAR.md`, `docs/SAYFA-EKSIKLERI.md` vb.) — Bilgi Haritası bölümünden hangi dosyada ne olduğunu gör.
>
> **Son onay:** Cihat — 4 Mayıs 2026, 57 kapanışı

---

## 🎯 58. Oturum Gündemi

**Birincil iş:** Mobile MSpoolDetay sayfasını yaz — Cihat'ın vereceği vanilla referans dosyaya bakarak React'e port. Tasarım kararları **MK-54.E/F/G**'de yazılı: 3 sekme (Genel + Malzeme + İşlem Kayıtları), 3D yok, malzeme salt-okur, geri bildirim FAB, tipografi 14px sekme + 12px başlık `--txm`, n/N işlem durumu, tema-spesifik renkler. `useT()` doğru kullanılacak (MK-54.1 hatasını tekrarlamadan).

**Açılışta Cihat vanilla dosyayı verecek.** O olmadan kod yazımı başlamaz.

**İkincil iş (yapısal):** `oturum-saglik.sh --kapanis` flag'inin kodlanması. Tasarım `docs/KAPANIS-ORKESTRA-TASARIM.md`'de yazılı, MK-56.4 kararı kondu, sıra implementasyonda. 57'de tasarım yazıldı ama kod yetişmedi — limit nedeniyle 58'e devredildi. Vanilla MSpoolDetay gelmezse buna geç.

---

## ✅ 57'de Yapılanlar

- **MK-56.4 yazıldı** — Kapanış orkestra protokolü (etkileşimli `--kapanis` flag'i). Üç-katmanlı tasarım (Script + Claude rapor + Cihat yargı), iki yönlü çelişki kontrolü, sabit 7 kategori. KARARLAR.md MK-56.3 altına eklendi (541 satır).
- **`docs/KAPANIS-ORKESTRA-TASARIM.md` doğdu** (159 satır, MD5: 0d85796ea6ff468a330257b622c2273e) — Tam akış adımları, şablonu, doğum kanıtı (56 sızıntısı), genişlemeler. KARARLAR.md MK-56.4 buraya referans verir.
- **56 SIZINTISI TELAFİ EDİLDİ.** 56 BRIEFING.md *"CIHAT-PROFIL.md'ye yeni alerji eklendi"* diye yalan söylüyordu — `git log` ve `grep` 57'de dosyaya 27 Nisan'dan beri dokunulmadığını kanıtladı. 57'de alerji **gerçekten** eklendi (CIHAT-PROFIL.md'ye iki alerji bloğu: varsayım yapma + heredoc/markdown güvenilmez). Bu yalan MK-56.4'ün doğum kanıtı oldu.
- **Süreç disiplini öğrenildi:** Heredoc + TextEdit Türkçe markdown için güvenilmez. Uzun dosyalarda Claude `create_file` ile üretip Cihat indirip `cp` ile yerine koyacak — UTF-8 garantili, bütünlük garantili, kopyala-yapıştır riski sıfır. CIHAT-PROFIL.md'ye 2. alerji olarak eklendi.

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

1. **(58 birincil)** MSpoolDetay React port (vanilla referansa göre, MK-54.E/F/G'ye uygun)
2. **(58 ikincil yapısal)** `oturum-saglik.sh --kapanis` flag'inin kodlanması (tasarım hazır, MK-56.4 yazıldı)
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
- **MK-56.4** — Kapanış orkestra protokolü (`--kapanis` flag'i, üç katman, iki yönlü çelişki kontrolü). Detay: `docs/KAPANIS-ORKESTRA-TASARIM.md`.

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

---

## ⚙️ Sistem Sağlık Durumu

- **CI:** ⚠️ SARI — 28 uyarı (`spool_detay.html` 9, `izometri-batch.html` 18, `devre_detay.html` 1), 0 hata. Build YEŞİL.
- **Vercel:** ✅ Production aktif
- **DB:** Bu oturumda dokunulmadı

---

## 📦 Son 5 Commit

- 57'nin commit hash'i push'tan sonra otomatik dolacak
- f59c579 chore(ci): ci-son-rapor.json güncelle [skip ci]
- f2622ea docs(56): BRIEFING.md mimarisi + MK-56.1/2/3 + CLAUDE.md temizlik
- 3f1f779 chore(ci): ci-son-rapor.json güncelle [skip ci]
- bdd7baf docs(55): MK-55.1 oturum-saglik.sh + 53+54 onarım modu

---

## 🚪 58. Oturum Açılış Komutu

Aşağıdaki komutu terminale yapıştır, çıktıyı kopyalayıp 58. oturuma yapıştır:

    cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 58 && cat BRIEFING.md

---

## 📝 Açıkça Belgelenmiş Sapma Dersleri

1. **Açık Borçlar listesi gündem değildir.** Gündem `🎯` bölümüne yazılır. CI bakım kuyruğu ile asıl iş listesi karıştırılmaz.
2. **Dosya yolu uydurma.** *"Sanırım `docs/` altında"* deme — git'le, `ls`'le, kanıtla. (CIHAT-PROFIL.md'de alerji.)
3. **Onarım modu özetin doğruluğunu doğrulamaz.** Sadece dosyaların güncel olduğunu kontrol eder. **MK-56.1** bunu kapatır: Cihat onayı zorunlu.
4. **`son-durum.md`'nin "Açık Borçlar" listesi gündem değil**, biriken iş listesi. İlk maddesini birincil iş sanma.
5. **BRIEFING'in "Yapılanlar" listesi yalan söyleyebilir.** 56'da *"CIHAT-PROFIL.md'ye alerji eklendi"* yazıldı ama dosyaya dokunulmadı. Cihat onayı sırasında çelişki kaçtı. **Bu MK-56.4'ün (kapanış orkestra protokolü) doğum kanıtıdır** — `--kapanis` flag'i kodlandığında bu sızıntı türü iki yönlü `git diff` çelişki kontrolüyle yakalanacak.
6. **Heredoc + Türkçe markdown güvenilmez.** `cat > X.md << 'EOF'` markdown tablosu/code block'la çakışıyor, TextEdit yapıştırma Türkçe karakterleri bozuyor + uzun metni yarım kesiyor. **Çözüm:** uzun dosyalar için Claude `create_file`, Cihat `~/Downloads/`'tan `cp`. (CIHAT-PROFIL.md'de alerji.)
