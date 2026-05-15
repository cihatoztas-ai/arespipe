# 88. Oturum Arşivi (14 Mayıs 2026)

> Konu: Tanımsız Malzeme Havuzu — paradigma değişimi + backend tamam, frontend kısmi.

---

## Oturum Açılışı

87. oturumun "vizyon tanımsızlar" commit'i (`58347a0`) ile geldi. Sonraki gündem belgesi `docs/88-VIZYON-TANIMSIZLAR.md` 87 kapanışında yazılmıştı; Cihat dosyayı yüklediğinde paradigma netleşti:

> "Mevcut tasarım yanlış — kullanıcı tıklamasına bakan counter modeli, sistemin gerçek durumunu yansıtmıyor."

Yeni vizyon:
- Tanımsız malzeme = `boru_olculer_id IS NULL` olan her satır (gerçek-zamanlı)
- Kullanıcı tarafında "Kaydet" akışı tamamen kalkar (operatör iş yükü = 0)
- Süper admin panelinde sıklığa göre liste + ya **standart tablo yükle** (toplu) ya **özel parça gir** (form)

---

## Tartışma Adımları (önemli netleşmeler)

### 1. AI önerisi var mı yok mu? (KARAR-88.3)

İlk taslakta "STD_KILAVUZ JS lookup" + ASME yakın eşleşme + malzeme katalog kontrolü ("Kütüphane Bilinçli Yardım") vardı. Cihat sordu:

> "Tanımsız olan malzemeyi ben dışarıda araştırayım ya da sana sorarım. Buradan sadece standart dışı malzemelerin tablo değerlerini girelim."

Karar: AI önerisi 88'de **YOK**. Sebep: halüsinasyon riski yüksek, doğrulama katmanı ayrı bir oturumluk iş. Pano sıklığa göre listeler, Cihat veriden öğrenir, gerektiğinde claude.ai sohbetinden standart bulur, sonra ya toplu seed migration ile yükler ya özel parça olarak girer.

### 2. Özel parça formu nasıl? (KARAR-88.2 öncesi)

İlk taslakta sabit form (7 alan: standart, dn, schedule, ölçü, ağırlık, kalite, açıklama). Cihat:

> "Form sabit değil, `boru_olculer` tablosunun kolonlarına göre dinamik."

Şema sorgusu: `boru_olculer` 27 kolon. Gruplandırınca:
- 7 zorunlu (NOT NULL, GENERATED değil): standart, malzeme_grubu, dn, schedule_tipi/deger/kod, dis_cap_mm, et_mm, agirlik_kg_m
- 5 GENERATED (otomatik): et_min, et_max, ic_cap, hacim, yüzey
- Geri kalan opsiyonel/default'lu

### 3. `agirlik_kg_m` neden GENERATED değil? (Risk değerlendirmesi)

Diğer hesaplanan kolonlar GENERATED ama bu değil. Manuel giriş riski tartışıldı:
- Risk 1 (hesap hatası): JS otomatik hesap ile çözülür
- Risk 2 (yoğunluk yanlış malzeme grubu): malzeme_grubu seçilince yoğunluk lookup otomatik
- Risk 3 (mevcut 358 satırla tutarlılık): GENERATED'a çevirme 90+'a kaldı, önce sapma kontrolü gerekir

Karar: β-iyileştirilmiş — form input'unda yoğunluk lookup ile otomatik hesap, üzerine yazılabilir.

### 4. RLS yaklaşımı — view vs RPC (KARAR-88.MK-A)

Süper admin tüm tenant'ları görmeli. `spool_malzemeleri` RLS policy'si `tenant_id = get_tenant_id()` filtresi yapıyor.

İki seçenek:
- (a) Policy'ye super_admin eklemek → tüm tablodaki sorgular yan etki alır
- (b) RPC SECURITY DEFINER + içeride super_admin auth

Karar: **(b)** — yan etki sıfır, scope dar.

### 5. CHECK constraint sürprizi (KARAR-88.2 finali)

Smoke test'te `boru_olculer_tenant_consistency` patladı. Constraint:

```sql
CHECK (
  (sistem_preset = true  AND tenant_id IS NULL) OR
  (sistem_preset = false AND tenant_id IS NOT NULL)
)
```

Yani "özel parça = `sistem_preset=false` + tenant_id" şeması zaten kurulmuş. İki yorum:
- Yol-A: "Özel" demek paylaşımlı kütüphane kaydı (`sistem_preset=true`)
- Yol-B: "Özel" demek tenant-spesifik (`sistem_preset=false + tenant_id`)

Cihat Yol-A seçti. Sebep: Yarın B tenant aynı ölçüyü kullanırsa Yol-B'de yine tanımsız çıkar, ikinci kez eklemek gerekir.

---

## Yapılanlar (sırasıyla)

1. **Vizyon belgesi okundu** (`docs/88-VIZYON-TANIMSIZLAR.md` — 87 kapanışından)
2. **Şema teyit sorguları** (`spool_malzemeleri`, `boru_olculer`, RLS, tanımsız sayım)
3. **Migration v1 yazıldı** (`064_v_tanimsiz_havuz.sql`) — VIEW + 2 RPC, `sistem_preset=false`
4. **Smoke test patladı** — `boru_olculer_tenant_consistency` constraint hatası
5. **Constraint analizi + karar** (KARAR-88.2: Yol-A, paylaşımlı)
6. **Migration v2 patch** — `sistem_preset=true`, MD5 değişti
7. **Smoke test v2 başarılı** — 30 spool bağlandı, GENERATED kolonlar formül uyumlu, view doğru sıralıyor
8. **RPC sürüm teyidi** — `pg_get_functiondef` ile `'boru', true` görüldü ✅
9. **`admin/kutuphane-oneriler.html` yazıldı** — Hero+Stats + tablo, cascade animasyon, RPC çağrısı
10. **Sayfa deploy edildi** (commit `dadfb18`) — yapısal sorunlar tespit edildi
11. **89 gündem belgesi yazıldı** (refactor + 88.G planı)
12. **Kapanış belgeleri** (bu dosya + son-durum + sonraki-oturum)

---

## Canlı Doğrulamalar

- ✅ VIEW + 2 RPC oluşturuldu (`Success. No rows returned`)
- ✅ RPC `'boru', true` sürümüyle DB'de (`pg_get_functiondef` ile teyit)
- ✅ Smoke test 30 spool'u tek transaction'da bağladı
- ✅ Tolerans (`±0.5mm dış çap / ±0.3mm et`) selektif çalıştı, 60.3×6.3 toleranstan kaldı
- ✅ GENERATED kolonlar: ic_cap=130.7, et_min=3.938, et_max=5.063, hacim=13.4166, yüzey=0.4389
- ❌ Frontend sayfa AresPipe pattern'ine uyumsuz → 89 refactor

---

## Öğrenmeler (MK kayıtları)

- **MK-88.A** — RPC SECURITY DEFINER + içeride auth.uid() + super_admin kontrolü → güvenli RLS bypass pattern'i. Diğer admin-only RPC'lerde de aynı şablon kullanılabilir.
- **MK-88.B** — CHECK constraint = schema tasarım sinyali. Bypass etmek yerine constraint'i okuyup vizyonu onunla buluştur. (`boru_olculer_tenant_consistency` örneği)
- **MK-88.C** — SQL Editor `postgres` rolünde `auth.uid()=NULL`. SECURITY DEFINER + auth kontrolü olan RPC'ler doğrudan test edilemez. Manuel SQL ile mantığı yürüt + ROLLBACK ile teyit et.
- **MK-88.D** — Yeni admin sayfası yazarken **referans bir admin sayfasını görmeden başlama**. AresPipe ortak layout pattern'i tahminle çalışmıyor — script path'leri, sidebar inject, CSS değişkenleri vs hepsi belirli pattern'e bağlı.
- **MK-88.E** — Vizyon belgesi büyükse oturum içinde paradigma onayını ilk 2-3 mesajda netleştir. Cihat "yanlış anlaşıldı" diyebilir, küçük adımlarla teyit etmek lazım.

---

## Karar Geçmişi (88'in)

| # | Karar | Bağlam |
|---|---|---|
| **KARAR-88.1** | Tanımsız = gerçek-zamanlı view (`boru_olculer_id IS NULL`). Counter modeli ve kullanıcı "Kaydet" akışı kalkar. | Vizyon belgesi 87 sonu + 88 onayı |
| **KARAR-88.2** | Özel parça `sistem_preset=true, tenant_id=NULL` — paylaşımlı kütüphane. | CHECK constraint sürprizi sonrası |
| **KARAR-88.3** | AI standart önerisi 88'de YOK. Tetik: 50+ tanımsız kayıt veya Cihat sinyali. | Cihat: "ben dışarıda araştırırım" |
| **KARAR-88.4** | Özel parça formu sabit değil, `boru_olculer` kolonlarına göre dinamik. | Cihat tarafından netleştirildi |
| **KARAR-88.5** | `agirlik_kg_m` β-iyileştirilmiş: form input + yoğunluk lookup ile otomatik hesap, üzerine yazılabilir. α (GENERATED migration) 90+'a kaldı. | Manuel giriş riski tartışması |
| **KARAR-88.6** | `kutuphane-oneriler.html` 89'da komple refactor. AresPipe admin pattern'ine uymadığı için sıfırdan yazılacak. | Canlı test sonrası |

---

## Yapılamayanlar / Devreden Borç

| # | Konu | Aciliyet |
|---|---|---|
| 1 | `admin/kutuphane-oneriler.html` refactor | P0 — 89 öncelik 1 |
| 2 | 88.G — Detay paneli + özel parça formu | P0 — 89 öncelik 2 |
| 3 | DIN 17175 seed migration (139.7×4.5 dahil) | P1 — opsiyonel 89 |
| 4 | AI standart önerisi (A-AI) | P2 — tetik koşulu var, ertelendi |
| 5 | `agirlik_kg_m` GENERATED migration | P2 — 90+, önce veri sapma kontrolü |

---

## Commit'ler

| Hash | Mesaj |
|------|-------|
| `dadfb18` | feat(88): tanimsiz malzeme havuzu - migration + liste sayfasi |

---

## Performans Notları

- View sorgusu: <50ms (40 satır / 2 grup)
- RPC `v_tanimsiz_havuz_listele()`: aynı sorgu, SECURITY DEFINER ek maliyet yok
- RPC `ozel_parca_boru_kaydet()`: 1 INSERT + 1 UPDATE (30 satır) = single transaction, <100ms tahmini

---

> 89. oturum açılışında bu dosya, `.github/son-durum.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunur. Sonra Cihat'a "Hangi işle başlayalım?" sorusu sorulur. Önerilen sıra: referans admin sayfasını gör → kutuphane-oneriler.html refactor → 88.G özel parça formu.
