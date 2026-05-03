# AresPipe — Proje Haritası

> **Bu dosya projenin "şu an neredeyiz, sonraki adım ne" tek kanonik adresidir.**
>
> Sen oturum açarken buraya bakar, "konuşalım" dediğin modülün satırını bulup içine dalarsın. Claude oturum kapanışında her modülün satırını gözden geçirir, değişen varsa günceller.
>
> **Yaşar dosya** — her oturum sonunda, etkilenen modül satırı değişir. Bayatlamasına izin verilmez.
> **İlk yazım:** 53. oturum (2 Mayıs 2026) — eski ROADMAP + PANO-TASARIM dosyalarındaki yaşayan içerikten emildi, ölü kabuk arşivlendi.

---

## Notasyon

**Aşama yüzdeleri** (kabaca):
- **%0** — Yapılmadı, planlanmış olabilir
- **%30** — İskelet var, çalışmıyor
- **%60** — Çalışıyor ama eksik
- **%85** — Sağlam, küçük eksikler/test
- **%100** — Bitti, dokunulmuyor
- **— UYKU** — Aktif değil, donmuş

**Vizyon etiketi** (sağ kolonda):
- `B1` — İzometri parser (Spool AI Katman B)
- `D` — Veri akışı (mobil etiketleme, 3D montaj, log altyapısı)
- `A` — Sade altyapı (ASME, boru standart, parça kütüphanesi)
- `C` — RAG (firma standartları AI'a bağlama)
- `E` — Uzun vade (görsel tanıma, fotogrametri)
- `F` — Belgeleme (müşteri portalı, kayıt PDF)
- `OP` — Operasyonel (vizyona doğrudan değmez ama gerekli)
- `IÇ` — İç altyapı (CI, lint, sapmama)

---

## 1. MODÜL DURUM TABLOSU

### Grup 1 — Veri Girişi (Spool sisteme nasıl giriyor)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Devre/Pipeline tanımı (`devre_yeni`, `devre_detay`, `devreler`) | %85 | Spool çakışma 3-buton (10), `_lk` stable key (10), `gemi→projeNo` rename (12), notlar tablosu ayrı (12), denormalizasyon kapatıldı (12) | `devreler.malzeme` canonical migration; Excel export'ta ölü `d.durum` temizliği | OP |
| Spool kaydı (`spool_detay`) | %90 | 3225→3217 satır, M3_RENK canonical (22), kaliteleriDoldur master tablodan (22), tracker i18n (11), notlar/fotoğraflar/ağırlık/spool_id 6'da fix | İleri test, denormalizasyon kararı uygulanmış değil (devreler.malzeme) | OP |
| Spool malzemeleri / Malzeme Havuzu (`tanimlar.html`) | %95 | 22'de Faz A Faz 2 kapatıldı: sistem (12) + firma kaliteleri sekmesi, inline ekleme/düzenleme/silme, FK violation kontrolü, sistem preset uyarısı | Faz 3 — autocomplete dropdown (free text yerine) | A |
| IFS/Excel import (fuzzy match) | %0 | Faz 4 olarak planlandı (eski ROADMAP) | Tarih netleşmedi — Cihat karar verecek | OP |
| İzometri PDF okuma — L1 cache | %95 | Çalışıyor, `pdf_sha256` lookup ~3 sn | — | B1 |
| İzometri PDF okuma — L2 deterministik parser | %30 | Canlıda (51), parser_seviye='l2' kolonu var (Migration 024), Tersan formatı için aktif **ama %0 başarı oranı**: pipeline_no regex `\d{3}` dar, `303S` yakalamıyor; `_l2_meta` log'a yazılmıyor; ASME helper fix'lendi (51) | (1) pipeline_no regex genişletme `[\dA-Z]+\d*` (2) `_l2_meta`/`_l2_fallback` ai_api_log'a (3) 5+ Tersan PDF testi | B1 |
| İzometri PDF okuma — L3 vision AI | %95 | Canlı, 11-25 sn/PDF, ~$0.036, halüsinasyon koruması (K3/36) — 7 madde şüpheli satır kriteri | Cost log görünürlük (`_l2_fallback` DB'ye) | B1 |
| Format tanıma (fingerprint) | %85 | 5 sinyal (ulke, tersane, başlık, tablo, dosya_adi_regex), tie-breaker bonus +5 (51), 3 format DB'de (Tersan Spool, Tersan Isometry, PAOR) | "Tersan M110 Montaj Resmi" temizlik kararı (kullanılıyor mu?) | B1 |
| Format öğretme (etkileşimli modal) | %0 | Planlandı: yeni format → AI L3 → modal → parser_kural taslağı | UI tasarım + endpoint | B1 |
| Format envanter UI (`/admin/formatlar`) | %0 | Yapılmadı | super_admin sayfası: format listesi + parser_kural durumu + L2 fail oranı | B1 |
| AI taslak üret endpoint | %0 | Planlandı: L3 sonucu → 2. AI prompt → parser_kural taslağı | Endpoint + prompt yazımı | B1 |
| İzometri batch (`izometri-batch.html`) | %50 | Ekran 1 frontend (34, demo modu, 707 satır), Ekran 2-3 yapılmadı, hatalı kayıt aksiyonları (yeniden-dene, sil, pdf-indir) eksik | Ekran 2 (manuel onay) — K1-K14 (36) hazır | B1 |

### Grup 2 — Operasyon (Spool nasıl üretiliyor)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Kesim (`kesim.html`) | %85 | 14'te %80'e geldi, 22'de wizard refactor (3 adımlı modal, V3 kart, PDF), tablo standardizasyonu (13), cascade animasyon | Tablo export i18n, manuel parça validasyonu, KK entegrasyonu | OP |
| Büküm (`bukum.html`) | %80 | 13'te fason kaldırıldı (1385→812 satır), tersane badge eklendi | Test, eksik kalan ufak işler | OP |
| Markalama (`markalama.html`) | %75 | 13'te tablo standardizasyonu, plaka malzeme fix | Tam kapsamlı test, eksiklerin tespiti | OP |
| Argon Kaynağı | %0 | Yetki bloğu var (17 Nis), sayfa yok | Sayfa tasarımı + DB | OP |
| Gazaltı Kaynağı | %0 | Yetki bloğu var (17 Nis), sayfa yok | Sayfa tasarımı + DB | OP |
| Kalite Kontrol (`kalite_kontrol.html`) | %60 | Tersane badge (13) | Kapsam tespiti, eksiklerin listelenmesi | OP |
| Sevkiyat (`sevkiyatlar.html`) | %60 | Tersane badge (13) | Kapsam tespiti | OP |

### Grup 3 — Yönetim ve Referans (Üst yapı)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Tanımlar — Yetki Blokları | %95 | 15 Nis tamamlandı, 17 Nis "Grup = Buton" mimarisi rafinasyon (Argon/Gazaltı ayrıldı), 12 sistem preset trigger korumalı | i18n eksik (28 uyarı CI'da) | OP |
| Tanımlar — Kod Serileri | %90 | Çalışıyor, tenant kod yönetimi UI eksik (6'da karar) | Tenant kod yönetimi UI | OP |
| Tanımlar — Malzeme Havuzu | %95 | 22'de tamamlandı (Faz A Faz 2) | Faz 3 — form refactor + autocomplete | A |
| Tersaneler (`tersaneler.html`) | %90 | `kisa_ad` kolonu (13), tersane badge sistemi | Test | OP |
| ASME Lookup tam sistemi | %100 | 35'te tamamlandı (358 satır boru ölçüsü, 4 dosya, helper'lar) | — | A18-19 |
| Boru standart sistemi (8 maddeli) | %100 | 36'da kuruldu (3 yeni tablo, 12 standart sözlüğü, 171 NPS eşleme); 4 aktif standart + 8 hazır tanım | DIN/JIS/GOST veri yüklemesi (organik, ihtiyaç doğunca) | A |
| Fitting/flanş tabloları | %0 | 9-15 standart kombinasyonu, planlandı (G-11 defter) | 37-38 oturumlarda (eski plan) — yeniden değerlendir | A |
| Yetki sistemi (RLS + bloklar) | %95 | 15-17 Nis tamamlandı, kullanici_bloklar tenant_id zorunlu | İleri tarihte regresyon testi | OP |
| Multi-tenant + RLS | %95 | 51 tablo, hepsi tenant_id, 4 policy/tablo | Tenant izolasyon testleri (eski Faz C planı) | İÇ |
| Feature flag sistemi | %100 | `tenant_features` + `ARES.featureVar()`, 5 aktif flag | — | İÇ |

### Grup 4 — Yönetici Görünümleri

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Süper admin paneli (`admin/panel.html`) | %70 ❓ | "Yol Haritası" + "Geri Bildirimler" bölümleri var, eski tasarım | Pano tasarımı uygulandı mı? Teyit gerekli | OP |
| Pano — Görev Takibi | %0 ❓ | PANO-TASARIM.md 24'te planlandı; `panel_gorevler` tablosu hazır mı? | Implement durumu teyit | OP |
| Pano — Geri Bildirim Yönetimi | %0 ❓ | Planlandı, `geri_bildirimler` tablosu var mı bilinmiyor | Implement durumu teyit | OP |
| Pano — Oturum Panosu | %0 ❓ | Planlandı (CIHAT-PROFIL render + oturum geçmişi + CI durumu) | Implement durumu teyit | İÇ |
| AI API Kullanım izleme | %0 | 40+ oturumda planlandı (yeni sekme `admin/panel.html`) | Tasarım + tablo (`ai_api_log` zaten var) | İÇ |
| Format envanter UI | %0 | (Grup 1'de aynı satır, super_admin perspektifinden) | super_admin sayfası | B1 |

### Grup 5 — Mobil Saha (Operatör tableti)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Mobile React iskeleti | %50 | 54'te 5 hafta sonra ilk kez canlı (npm run dev OK, Vite v8.0.8). prebuild pattern (MK-54.D) ile lang/ web ile paylaşımlı. Vanilla mobile zip referans (MK-54.C). Vizyon: web'in light versiyonu (MK-54.A), web öncül mobile follower (MK-54.B). | M ekranları i18n bağlama (MK-54.1) | OP |
| MGiris.jsx | %60 | İskelet açılıyor, form çalışıyor (Supabase auth). **Bug (MK-54.1):** i18n hook bypass — kendi paralel `[dil, setDil]` state'i, hardcoded TR string'ler. | `useT()` hook'una bağla, JSX'teki `'E-posta'` vb. → `tv('m_giris_eposta', 'E-posta')` | OP |
| MAnasayfa.jsx (router) | %60 ❓ | Role göre yönlendirir, açılıyor olduğu varsayılıyor. **Şüphe (MK-54.1):** i18n bypass olabilir, denetim 55'te. | i18n denetimi + bağlama | OP |
| MAnasayfaYonetici.jsx | %60 ❓ | Dashboard + İşlem Başlat + profil butonu. **Şüphe (MK-54.1):** i18n bypass olabilir. | i18n denetimi + bağlama | OP |
| MIslemler.jsx | %60 ❓ | Grup bazlı buton ekranı + profil butonu. **Şüphe (MK-54.1):** i18n bypass olabilir. | i18n denetimi + bağlama | OP |
| MDrawer.jsx | %60 ❓ | 17 Nis (2. oturum) — profil + tema toggle + dil dropdown + çıkış. **Şüphe (MK-54.1):** i18n bypass olabilir. | i18n denetimi + bağlama | OP |
| MProfil.jsx | %0 | Planlandı: avatar yükleme + kişisel bilgi | Mockup-first → kod | OP |
| MIsBaslat.jsx | %0 | Planlandı (eski `is_baslat.html`'den, vanilla'da 1930 satırlık 9-ekranlı state machine) | 56-57. oturumlar (vizyona göre) | D (mobil etiketleme) |
| MDevreler.jsx | %0 | Planlandı | Mockup-first → kod | OP |
| MDevreDetay.jsx | %0 | 54'te tasarım kararları konuşuldu (Spoollar + Notlar sekme yapısı, 6-aşama timeline + filtre, kompakt tipografi MK-54.F). MSpoolDetay sonrası başlanır. | 56. oturum (sonraki adım) | OP |
| MSpoolDetay.jsx | %5 | 54'te tasarım kilitlendi: 3 sekme (Genel + Malzeme + İşlem Kay., 3D yok MK-54.E), kompakt tipografi (MK-54.F), n/N işlem durumu (MK-54.G), salt-okur Malzeme tablosu, Geri Bildirim FAB. **55'in ana işi.** | Web spool_detay.html upload + DB sorgu + JSX yaz + route ekle + lokal test | OP |
| MQRTara.jsx | %0 | Planlandı, tenant prefix parse (`A-0504:UUID`) cross-tenant uyarısı gerekli | Mockup-first → kod | D |
| Mobil i18n altyapısı | %85 | 54'te kuruldu: `i18n.jsx` provider (TR/EN/AR + RTL otomatik + localStorage + fallback), prebuild pattern (MK-54.D), 1659 anahtar × 3 dil web'le paylaşımlı. **Borç (MK-54.1):** M ekranları henüz `useT()` ile bağlanmamış, hardcoded TR string'ler kullanıyor. | Tüm M ekranlarında `useT()` denetimi (55) + spool detay için `mob_sp_*` 36 anahtar yazımı | İÇ |
| Mobil tema sistemi | %95 | `useTema()` Context, light-anthracite + dark, MGiris'te toggle çalışıyor. **MK-54.G ile** tema-spesifik durum renkleri eklendi (`--status-done/wip/no`). | Tüm M ekranlarında AAA kontrast denetimi (vanilla'nın `--txd` hatası tekrarlanmasın) | İÇ |
| Mobil yetki sistemi | %100 ❓ | `lib/yetki.js` blok/grup/gizli_bolumler. **Şüphe:** 5 hafta önce yazıldı, web yetki sistemiyle uyum kontrolü yapılmamış. i18n bug'ının kuzeni olabilir. | İleride denetim (düşük öncelik) | İÇ |
| Avatar Storage upload | %0 | `foto_url` kolonu var, upload UI yok | MProfil'le birlikte | OP |
| Mobil 3D model render | — UYKU | 54'te karar (MK-54.E): web 3D doğruluk problemi çözülene kadar mobile'a eklenmez. Sahada izometri çıkmayan personel için **kritik özellik** ama yanlış görsel = fire riski. | Web 3D olgunlaştığında 56-58. oturumda port | A + D |
### Grup 6 — Altyapı ve Disiplin (Görünmez ama şart)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| CI/lint sistemi (`kontrol.js`) | %95 | 14 aktif kural, 0 hata / 22 uyarı, baseline 74 dosya, self-test 3 bozuk-örnek | i18n eksik anahtarlar (28 uyarı), mobil için yeni kurallar (mobil aktif olunca) | İÇ |
| Migration sistemi | %100 | `NNN_aciklama.sql`, MIG_* CI kuralları, baseline `000_initial_schema.sql` (6029 satır, 51 tablo), 26 migration | DB UPDATE'leri migration olarak yazma disiplini (53'te öneri) | İÇ |
| Yedekleme | %100 | Her gece 03:00 TR, 30 gün retention, `arespipe-backups` repo'sunda | — | İÇ |
| Sapmama protokolü | %95 | CLAUDE.md, MK-49 ila MK-53.1, KARARLAR.md (53'te kanonik) | Etki taraması protokolü (anlık karar yakalama) | İÇ |
| Knowledge ↔ repo bağlantısı | %100 | 52'de kuruldu, otomatik indeksleme, 12% kapasite | — | İÇ |
| KARARLAR.md | %100 | 53'te kuruldu, MK-49.1 ila MK-53.1 | Yeni kararlar oturumda eklenir | İÇ |
| `arespipe_kopyala` (MK-52.1) | %100 | MD5 doğrulamalı, zsh fonksiyonu | — | İÇ |
| `gp` (MK-52.2) | %100 | Otomatik rebase + push | — | İÇ |
| Web i18n (TR/EN/AR) | %95 | 1379 anahtar (11. oturumda) | 28 uyarı (eksik anahtarlar), `basamak_tanimlari` çok dil (12'de eklendi ama tablo TR) | İÇ |
| Web tema sistemi | %95 | `[data-theme=dark]` + `[data-theme=light-anthracite]`, flash prevention zorunlu | — | İÇ |
| `ARES_NORM` canonical sistem | %95 | 5 malzeme + 5 yüzey kategorisi, render simetrisi G-03 (21'de tüm sayfalar tarandı) | Yeni sayfa eklenince ARES_NORM kullan | İÇ |
| 3D model render (`spool_detay`) | %85 | Three.js, M3_RENK canonical (22), buildChain interface | Parça kütüphanesi hazır olunca yeniden bağlanır | A + D |

### Grup 7 — Uzun Vade Vizyon (Spool AI)

| Modül | Aşama | Son Durum (kısa) | Sonraki Adım | Vizyon |
|---|---|---|---|---|
| Spool AI vizyon dokümanı | %100 | v2.1 (26 Nis), A-F katmanları, 33 madde | Vizyon değişince güncellenir | Belge |
| Parça kütüphanesi (vizyonun belkemiği) | %20 | Kavramsal kararlar (40. oturum kapanış sohbeti, VIZYON-VE-MODULER-MIMARI.md), `spool_malzemeleri.parca_id` referans yapısı planlandı | DB tablolarının açılması (`fitting_olculer`, `flansh_olculer`, `malzeme_kataloglari`) — pilot başlamadan önce | A (Madde 3 — vizyonun ana damarı) |
| 3D montaj aracı (`spool_3d_montaj`) | %30 | Prototip var, manuel kurulum | Aşama 2 — izometri parser çıktısı 3D'ye otomatik yükle | D (Madde 13) |
| Eğitim oyunu (`spool_usta.html`) | %30 | Prototip var | Veri biriktikçe AI eğitim örneklerine dönüştürme | D (Madde 14) |
| Operasyonel pipeline (`islem_log` zenginleştirme) | %60 | `islem_log` çalışıyor, `meta JSONB` planlandı | Disiplin: yeni sayfa açılırken `islem_log` zenginleştir | D (Madde 11) |
| Mobil saha etiketleme | %5 | Mobil iskelet hazır, MIsBaslat ve MQRTara yapılınca aktif olacak | Mobil yoğun başlangıç (~55-56) | D (Madde 12) |
| Halka açık eğitim oyunu | %0 | Planlandı (sınırlı kapsam, 30-40 anonim izometri) | Veri olgunlaşınca | D (Madde 14) |
| Arşiv etiketleme | %0 | Planlandı (süper admin sayfası) | İleride | D (Madde 15) |
| QR ölçek altyapısı | %0 | Planlandı (`ayarlar.html` tenant bazlı) | İleride | D (Madde 16) |
| Hatalı imalat örnekleri toplama | %0 | Planlandı (süper admin) | İleride | D (Madde 17) |
| Kaynak öncesi hazırlık kontrolü | %0 | Vizyon E katmanı, 6-12 ay test | Veri biriktikçe | E (Madde 18) |
| Görsel parça tanıma (domain-specific) | %0 | Vizyon E katmanı, 12-24 ay | 500-1000+ etiketli görsel sonrası | E (Madde 19) |
| QR fotogrametri ile boyut kontrolü | %0 | Vizyon E katmanı, 6-12 ay | İleride | E (Madde 21) |
| Müşteri portalı + imalat kayıt PDF | %0 | Vizyon F katmanı | Veri olgunlaştığında | F (Madde 24) |
| Çok-standartlı boru hub'ı (halka açık) | %5 | DB altyapı hazır (slug, açıklama TR/EN, kullanım sektörü) | Yeni site açılınca | F + SEO |

---

## 2. SIRADAKI 3-5 OTURUM

| Oturum | Konu | Önkoşul | Durum |
|---|---|---|---|
| **53** | Dökümantasyon revizyonu — KARARLAR.md, PROJE-HARITASI.md, ROADMAP+PANO arşiv, üç oturum dosyası 52 sonu güncel | — | 🔵 Aktif |
| **54** | Parser_kural pipeline_no fix + DB log yazma + 5+ Tersan PDF testi (L2 başarı oranı ölçümü) | 53 ✓ | ⚪ Sırada |
| **55** | MSpoolDetay.jsx port (vanilla referans + web bugünkü sorgu) + tüm M ekranlarında i18n hook denetimi (MK-54.1) | 54 ✓ | 🔵 Plan net |
| **56-57** | Mobil yoğun başlangıç (planlanmış: MProfil, MIsBaslat, MQRTara) — mockup-first | 55 ✓ + Cihat hazırsa | ⚪ Niyet |

**Not:** Bu liste **uzun vade taahhüt değil**. 3-5 oturumdan ileriyi yazmıyoruz çünkü plan bayatlıyor (eski ROADMAP'in dersi). Her oturum kapanışında bu liste yeniden değerlendirilir.

---

## 3. TARAMA SORULARI (Claude'un proje keşfi)

> Cihat-Profil'deki *"Onun [Cihat'ın] işi tüm projeyi aklında tutmak değil. Senin işin."* talimatının somut hali. Claude her oturumda 1-2 madde tarayıp Cihat'a "şuna bakalım mı?" diye önerir.

**Henüz sorulmamış / cevabı belirsiz olanlar:**

- [ ] `admin/panel.html` "Yol Haritası" ve "Geri Bildirimler" bölümleri **gerçekten** PANO-TASARIM'a göre güncellendi mi, yoksa eski tasarım mı duruyor?
- [ ] `panel_gorevler` ve `geri_bildirimler` tabloları DB'de var mı, RLS policy'leri canlı mı?
- [ ] Tüm 51 tabloda RLS policy gerçekten var mı, yoksa bazıları unutulmuş mu? (MK-51.4 etkisi)
- [ ] `proje_liste.html` ve `proje_detay.html` Supabase entegrasyonu hâlâ yok mu?
- [ ] `malzeme.html` (planlandı, yazılmadı) — gerçekten ihtiyaç var mı, yoksa Malzeme Havuzu yetiyor mu?
- [ ] Vercel function süre limiti yaklaştı mı? (L3 vision parse 11-25 sn, batch'te 5+ PDF varsa toplam 100+ sn)
- [ ] Vercel free tier deploy günlük limiti yaklaşıldı mı? (52'de hızlı push'lar)
- [ ] i18n eksik anahtar sayısı şu an kaç? (CI'da 28 uyarıydı, 53'te güncel mi?)
- [ ] `kullanici_bloklar` `tenant_id NULL` satır var mı? (RLS gizleyici, sessiz veri)
- [ ] Yedekleme repo'sunda `arespipe-backups` son 7 günlük yedek dolmuş mu? Free tier limit?
- [ ] Eski `asme_borular` ve `cuni_borular` tabloları hâlâ duruyor mu (35'te dondu, 37-38'de silinecekti — yapıldı mı)?
- [ ] `boru_olculer` GENERATED kolonları (`ic_cap_mm`, `hacim_l_m`) gerçekten doğru hesaplanıyor mu? (36'dan beri test edilmedi)
- [ ] CLAUDE.md "Bölüm 10 DOSYA BAZINDA BEKLEYENLER" listesindeki `[ ]` maddeler — kaç tanesi gizliden tamamlandı, kaç tanesi unutuldu?
- [ ] Mobil deploy (`arespipe-mob.vercel.app`) çalışıyor mu, son ne zaman test edildi?

**Sorulup cevaplanmış olanlar** (tarihsel kayıt):
- ✅ 53'te: `docs/PROJE-HARITASI.md` mevcut değildi, oluşturuldu

---

## 4. UYKU LİSTESİ (Şu an aktif değil ama silinmiyor)

> Aktif geliştirme yapılmayan ama bilgi olarak duran modüller. Uyandığında bu listede kontrol et, hangi notlar hazır.

Şu an liste boş. Mobil 55+ oturumda yoğun başlayacak — uykuda değil "yarı aktif" konumda.

Eğer ileride bir modül donduğunda buraya ekleriz.

---

## 5. GÜNCELLEME PROTOKOLÜ

**Bu dosya nasıl yaşar:**

1. **Her oturum kapanışında** Claude şu 7 grubu tarar, etkilenen modül satırını **mutlaka** günceller. Etkilenmediyse dokunulmaz.

2. **Yeni bir modül doğunca** ilgili gruba yeni satır eklenir.

3. **Bir modül %100'e geldiğinde** silinmez, "Sonraki Adım" sütunu `—` olur, listede kalır (geçmiş hafıza).

4. **Bir modül donduğunda** "Aşama" sütunu `— UYKU` olur, satır Uyku Listesi'ne taşınır (içeriği aynı, başka klasörde).

5. **Aşama tahminleri yanlışsa** Cihat düzeltir, Claude güvenle kabul eder. Cihat'ın hisleri Claude'un metin taramasından daha sağlam.

6. **"Tarama Soruları" listesi tükenirse** Claude yeni soru ekler. Liste canlı.

---

## 6. BAĞLANTILI YAŞAYAN DOSYALAR

Bu dosya ana harita, ama bazı modüllerin **kendi detay dosyaları** var:

- `docs/SPOOL-AI-VIZYON.md` — Vizyon detayı (Grup 7)
- `docs/IZOMETRI-BATCH-KARAR.md` — İzometri batch K1-K14 mimari kararları (Grup 1)
- `docs/IZOMETRI-BATCH-NOTLARI.md` — İzometri batch brief (Grup 1)
- `docs/L2-PARSER-NOTLARI.md` — L2 parser detay (Grup 1)
- `docs/VIZYON-VE-MODULER-MIMARI.md` — Parça kimliği prensibi (Grup 7)
- `docs/KUTUPHANE-YUKLEME-TAKIP.md` — Parça kütüphane yükleme takibi
- `docs/ARCHITECTURE.md` — Sistem mimarisi (niye)
- `docs/DATABASE.md`, `docs/API.md`, `docs/LOCAL-DEV.md` — Teknik referans
- `docs/KARARLAR.md` — Kanonik karar günlüğü (53'te doğdu)
- `docs/CIHAT-PROFIL.md` — Cihat'la çalışma notu
- `docs/CLAUDE-CALISMA-MODU.md` — Claude'a talimatlar
- `CLAUDE.md` — Ana sözleşme + ritüel
- `CLAUDE-MOBILE.md` — Mobil özel kurallar (55+ aktive olacak)

---

> İlk yazım: 53. oturum (2 Mayıs 2026). Eski `docs/ROADMAP.md` ve `docs/PANO-TASARIM.md` yaşayan içerikleri buraya emildi, kabuk dosyalar `docs/arsiv/`'e taşındı.
