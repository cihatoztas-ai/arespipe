# 55. Oturum — i18n Borç Kapatma + Onarım Modu Test (3 Mayıs 2026)

> 54'ü takip eder. 54 mobile vizyon + i18n altyapısı işine ayrıldı, 9 (`flansh_*`) + 18 (`izb_*`) eksik i18n anahtarı + 1 G-03 yüzey uyarısı CI'da yarım kaldı. 55'in birincil işi bunları kapatmak.
>
> 55 aynı zamanda **MK-55.1 onarım modu**'nun ilk testi: 53+54 ritüel atlamasının üst üste birikmesi tespit edildi, oturum-saglik.sh script'i BAYAT dedi, geriye dönük özet bu dosyayla beraber yazıldı.

---

## Açılış Ritüeli (CLAUDE.md MK-55.1 sonrası)

```bash
cd ~/Desktop/arespipe && git pull origin main && ./scripts/oturum-saglik.sh 55
```

Beklenen: **✅ TEMİZ**. BAYAT çıkarsa yine onarım moduna girilir.

Sonra: "Bugün ne yapmak istiyorsun?" — önerilen sıra aşağıda.

---

## 55'in Hedefi

CI yeşilini sağlamlaştırmak (sarı→yeşil), 54'te yarım kalmış 28 uyarıyı kapatmak. Mobil i18n bypass borcunu (MK-54.1) ele almak. Bu işler küçük ama biriktiklerinde *"sistem güvenilmez"* hissi yaratıyorlar.

### Ana İş 1 — `spool_detay.html` flansh_* anahtarları (öncelik 1)

54'te flanş bölümüne kod yazılmış (satır 3485-3510 arası), `tv('flansh_*')` çağrıları var ama 9 anahtar `lang/tr.json` + `en.json` + `ar.json`'da yok.

**Eksik anahtarlar:**

| Satır | Anahtar | Tahmini içerik |
|-------|---------|----------------|
| 3485 | `flansh_meta` | (flanş ana başlık?) |
| 3495 | `flansh_standart` | Standart |
| 3496 | `flansh_od` | Dış Çap (OD) |
| 3497 | `flansh_kalinlik` | Kalınlık |
| 3499 | `flansh_hub` | Hub |
| 3502 | `flansh_ic_cap` | İç Çap |
| 3504 | `flansh_bcd` | BCD (Bolt Circle Diameter) |
| 3508 | `flansh_civata` | Cıvata |
| 3510 | `flansh_agirlik` | Ağırlık |

**Adım:**
1. `spool_detay.html:3485-3510` aralığını oku, her `tv()` çağrısının fallback'ini ve bağlamını gör
2. Üç dil için anahtar değerlerini belirle (TR canonical + EN + AR)
3. `lang/tr.json`, `lang/en.json`, `lang/ar.json` üçüne ekle
4. Anahtar sırası alfabetik mi kategori mi — mevcut dosyaya bak

**Test:** Lokal `python -m http.server 8000` veya direkt canlıda `?lang=en` ve `?lang=ar` ile flanş bölümü kontrol — raw key görünmemeli.

### Ana İş 2 — `izometri-batch.html` izb_* anahtarları (öncelik 2)

18 eksik anahtar (satır 349'dan 814'e kadar dağılmış). Tahmini içerikler büyük ölçüde anahtar adından okunabilir:

```
izb_calisiyor          izb_temizle_onay       izb_durum_yukleniyor
izb_durum_kuyrukta     izb_supabase_hata      izb_yeni_batch_onay
izb_yukleme_hazirlaniyor   izb_batch_acilmadi     izb_hicbir_yuklenmedi
izb_kuyruk_hata        izb_arkada_basladi     izb_hata_genel
izb_yukleniyor_x       izb_upload_hatasi      izb_bilinmeyen_hata
izb_btn_yeni_batch     izb_resume             izb_dosya
```

**Adım:** Aynı prosedür — bağlam okumak, üç dile yazmak, mevcut anahtar formatına uygun yere koymak.

### Ana İş 3 — `devre_detay.html:1428` G-03 ham yüzey

Tek satır, tek uyarı. `esc(x.yuzey)` yerine `ARES_NORM.yuzeyEtiket(x.yuzey)` kullanılacak. CLAUDE.md 2.18 referansı.

**Adım:**
1. Satır 1428'i oku
2. `ARES_NORM.yuzeyEtiket()` çağrısına çevir (ham `karbon` yerine "Karbon Çelik" gibi canonical)
3. Lokal smoke-test (devre detay açılışı bozulmadı mı)

### Ana İş 4 — CI yeşil doğrulama

Üç düzeltme commit'lendikten sonra `.github/ci-son-rapor.json` taranır:
- `hata: 0`
- `uyari: 0` (veya 1 — sadece bilinen tolere edilen)
- `durum: "yesil"`

Push edip GitHub Actions'da yeşil görmeden 55 kapanmaz.

---

## İkincil İş (zaman kalırsa)

### MK-54.1 — Mobile M Ekranları i18n Bypass Denetimi

54'te tespit edildi, 5 dosyada şüphe. **MGiris.jsx kanıtlı** (kendi `[dil, setDil] = useState` paralel state, `useT()` çağrılmıyor, JSX hardcoded TR).

**Plan:**
1. 5 dosyayı sırayla aç (MGiris, MAnasayfa, MAnasayfaYonetici, MIslemler, MDrawer)
2. Her birinde `useT()` import edilmiş mi, JSX'te `t()` veya `tv()` kullanılıyor mu?
3. Bypass varsa: hardcoded string'leri `tv('anahtar', 'fallback')` formatına çevir, eksik anahtarları üç dile ekle
4. Lokal `npm run dev` ile dil değiştirme testi (TR → EN → AR)

**Süre tahmini:** 5 ekran × ~10dk = ~50dk. Ana işlerden zaman artarsa 55'te kapanabilir, kalmazsa 56'ya devredilir.

---

## Aşağıda Bekleyen Büyük İşler (55'e dahil değil, hatırlatma)

Bu maddeler 55'te ele alınmıyor — sadece **unutulmasın** diye burada listede:

| Borç | Detay |
|------|-------|
| **MK-49.A** | spool_detay 3D model deterministik render. PDF parse'tan gelen `yon_dizilim` JSON'undan Three.js benzeri çizim. AI çağrısı yok, $0 maliyet. 49'dan beri bekliyor. |
| **MK-49.B** | İzometri PDF yükleme bileşeni. Devre wizard Adım 2'ye gömülü (atla butonu var) + devre detay sayfasında "İzometri Çizimleri" sekmesi. Aynı backend endpoint'leri (`batch-baslat` + `batch-kuyruga-al`). |
| **parser_kural pipeline_no regex** | 51 log: `[L2-FAIL] sebep: 'zorunlu_eksik: pipeline_no'`. Mevcut `\d{3}` dar, `303S` gibi varyant yakalamıyor. Genişletme + 5+ Tersan PDF test. |
| **`_l2_meta` / `_l2_fallback` ai_api_log** | L2 başarısı DB'ye yazılmıyor, görünürlük yok. Yeni log fonksiyonu (Seçenek A) tercih edilmişti. |
| **Migration disiplini** | DB değişiklikleri elle Supabase'de — repo görmüyor. Her DB değişikliği `migrations/NNN_*.sql` olarak yazılmalı kararı henüz alınmadı. |
| **CALISMA-MODU ↔ CIHAT-PROFIL overlap** | İkisinde de Cihat tanımı var, biri silinmeli. |

---

## Beklenen Commit'ler (55)

```
fix(i18n): spool_detay flansh_* anahtarları üç dile eklendi (55)
fix(i18n): izometri-batch izb_* anahtarları üç dile eklendi (55)
fix(g03): devre_detay yüzey rendering ARES_NORM'a çevrildi (55)
docs(55): MK-55.1 oturum-saglik.sh + CLAUDE.md ritual güncellendi
docs(55): oturum kapanış — son+sonraki+son-durum güncellendi
```

İkincil iş yapılırsa:
```
fix(mk-54.1): mobile M ekranları useT() hook'una bağlandı (55)
```

---

## Kapanış Protokolü (55 sonu)

```bash
# 1. Üç dosyayı 56 için yenile
#    - CLAUDE-SON-OTURUM.md → "# 55. Oturum — ..."
#    - CLAUDE-SONRAKI-OTURUM.md → "# 56. Oturum — ..."
#    - .github/son-durum.md → güncel borç

# 2. Sağlık kontrolü
./scripts/oturum-saglik.sh 55 --kapanis

# 3. Beklenti: ✅ üç dosya bugünkü, başlıklar doğru → otomatik commit
# 4. Manuel push
gp
```

---

## Kritik Hatırlatmalar

- **MK-55.1 aktif:** Bu oturum açılışında oturum-saglik.sh BAYAT dedi, onarım modu çalıştı. Bu kapı bundan sonra her oturum başında ve sonunda işliyor olacak.
- **MK-53.5 aktif:** Sohbet içinde karar geçtiğinde bekleme — anında KARARLAR.md'ye veya ilgili yaşayan dosyaya işle.
- **MK-54.B aktif:** Yeni özellik önce web'de doğar. Mobile-only öneri reddedilir.

---

> 56. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
> Karar günlüğü: `docs/KARARLAR.md`.
> Modül durumu: `docs/PROJE-HARITASI.md`.
