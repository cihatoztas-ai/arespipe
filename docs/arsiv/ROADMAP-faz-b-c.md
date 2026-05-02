> ⚠️ **ARŞİV — DONDURULDU**
>
> Bu dosya 53. oturumda dondurulmuştur. Yaşayan içerik `docs/PROJE-HARITASI.md`'ye emildi, kabuk tarihsel kayıt için duruyor.
>
> **Bu dosyadaki bilgiler güncel değildir.** Yeni karar veya plan için PROJE-HARITASI.md'ye bak.

---

# AresPipe — Uzun Vadeli Yol Haritası

> **Amaç:** AresPipe'ı 1-2 yıl içinde çoklu tersane/firma müşteri tabanına satılabilir, bug'sız ve hızlı bir SaaS ürününe dönüştürmek.
>
> **Ekip profili:** Solo geliştirici + AI asistanlar (Claude, Cursor vb.)
>
> **Kalite hedefi:** Sıfır regresyon toleransı. Bug ve yavaşlık kabul edilmiyor.
>
> **Oluşturulma tarihi:** 23 Nisan 2026 (22. oturum öncesi)
>
> **Son güncelleme:** 23 Nisan 2026

---

## 🎯 Temel Zihniyet — "Zorla Uyumlu Geliştirme"

Bugüne kadar **kurallı geliştirme** yapıldı: kurallar CLAUDE.md'de, geliştirici uygulamaya çalışıyor. Bu yaklaşım 21 oturum dayandı ama daha fazla gitmez.

Yeni zihniyet: **zorla uyumlu geliştirme**. Kurallar otomatik sistemlerde (lint, test, CI) kodlanmış. Uyumsuz kod **fiziksel olarak** merge edilemiyor, canlıya çıkamıyor.

Temel fark: Bir kural atlanırsa sistem "bug üretmek" yerine "kod yayınlanmasını engeller". Bug üretmenin bedeli tersanede felaket (tek bir spool_no karışıklığı milyonluk kayıp). Engelleme bedeli 5 dakikalık gecikme. Bu dengesi SaaS'ın temelidir.

---

## 📐 Üç Faz, Dokuz Oturum, ~25-30 Saat

### FAZ A — Malzeme Sistemi Tamamlanması (mevcut yol)

Zaten devam ediyor. Bu fazı tamamlamadan Faz B'ye geçmek mantıksız — mevcut çalışan işi yarıda bırakmak kullanıcı değerini boşa harcar.

| Oturum | Konu | Süre | Getiri |
|---|---|---|---|
| 22 | Faz 2 Admin UI (`tanimlar.html` malzeme havuzu) | 2-3 saat | Kullanıcı preset-dışı kalite ekleyebilir |
| 25 | Faz 3 Form Refactor (autocomplete + select) | 1-2 saat | UX iyileşmesi |
| 26 | Faz 4 IFS Fuzzy Match | 1-2 saat | Import esnekliği |

**22. oturum yan bug'lar:** `spool_detay.html` M3_RENK eski TR key'ler + `devre_detay.html:1609-1611` duplicate `<td>` — her ikisi de 5-10 dk, aynı oturumda çözülecek.

### FAZ B — Altyapı Güvencesi (SAĞLAM PLANIN KALBİ)

Bu faz "sağlam plan" sorusunun cevabı. 21 oturumluk birikimden sonra ortaya çıkan sistematik sorunların (CLAUDE.md şişmesi, kural atlanması, ölü kod birikimi, regresyon sürüklenmesi) köklü çözümü.

**23. Oturum — Dosya Mimarisi + Lint + Şablon (3-4 saat)**

**1. Dosya bölme (30 dk)** — CLAUDE.md'yi 3 katmana ayır:
```
CLAUDE.md                         (ana sözleşme, ~600 satır tavan)
├─ Proje tanımı
├─ Kural Sicili (tek tablo, link'lerle)
├─ Oturum Ritüeli
├─ Son Oturum Özeti (sadece güncel!)
└─ ZORUNLU İlk Tool Call bloğu

docs/
├─ rules/                         (her kural kendi dosyasında ~150 satır)
│   ├─ G-01-i18n.md
│   ├─ G-02-theme.md
│   ├─ G-03-enum-render.md
│   ├─ B-01-confirm.md
│   ├─ B-02-local-key.md
│   ├─ E-01-enum-canonical.md
│   ├─ E-06-malzeme-master.md
│   └─ R-10-mockup-first.md
│
├─ architecture/                  (sabit referanslar)
│   ├─ db-schema.md
│   ├─ enum-system.md
│   └─ file-structure.md
│
├─ sessions/                      (geçmiş arşivi)
│   ├─ 001-012-erken.md
│   ├─ 013-018.md
│   ├─ 019-malzeme-master.md
│   ├─ 020-ifs-kok-neden.md
│   └─ 021-render-std.md
│
└─ templates/                     (şablonlar — kuralı pasif uygular)
    ├─ new-page.html
    ├─ new-modal.html
    └─ new-table.sql

scripts/
├─ lint/
│   ├─ g01-i18n.sh
│   ├─ g02-theme.sh
│   ├─ g03-enum-render.sh
│   ├─ b02-local-key.sh
│   ├─ e01-enum-canonical.sh
│   ├─ a01-error-handling.sh
│   └─ dead-code.sh
└─ health-check.sh                (hepsini birleştirir, tek rapor)

.husky/
└─ pre-commit                     (health-check, başarısızsa commit iptal)

.github/workflows/
└─ lint.yml                       (PR'da otomatik)
```

**2. Lint script'leri (90 dk)** — her kural için:

- **G-01 i18n** — hard-coded Türkçe string yakala; `lang/tr.json`, `en.json`, `ar.json` senkron mu
- **G-02 tema** — hard-coded hex + `font-size: Npx` yakala; `var(--xx)` kullan (karakter büyüklüğü sorununun çözümü)
- **G-03 enum render** — `esc(x.malzeme|kalite|yuzey)` ham kullanım yakala
- **B-02 local key** — aynı array'de `.find/.filter(x => x.spoolNo|pipelineNo|kod === ...)` pattern'i yakala
- **E-01 enum canonical** — `<option value="...">` + `<option>Türkçe</option>` tutarsızlığı yakala
- **A-01 error handling** — `await supa.from(...)` çağrısında `.error` kontrolü yapılmış mı
- **Dead code** — hiç çağrılmayan fonksiyonlar + hiç SELECT/INSERT edilmeyen DB tabloları

Her lint script bağımsız çalışır, exit kodu 0 (temiz) veya 1 (ihlal). `health-check.sh` hepsini toplar.

**3. Git + CI kilitleme (30 dk):**
- `.husky/pre-commit` kancası
- GitHub Actions workflow
- Vercel Deploy: lint başarısız → deploy iptal

**4. Şablonlar (30 dk):**
- `new-page.html` — G-01 + G-02 + G-03 + RTL + ARES_NORM yüklemesi içinde, kopyala-yapıştır çalışır
- `new-modal.html` — standart modal iskeleti
- `new-table.sql` — RLS + trigger + index iskeletleri

**5. Oturum ritüeli zorlama (30 dk):**
- CLAUDE.md başına "ZORUNLU ilk tool call: `bash scripts/health-check.sh`"
- CLAUDE.md sonuna oturum kapanış checklist'i

**24. Oturum — Mevcut Kod Temizliği (2-3 saat)**

23. oturum'un çıktısı ilk `health-check.sh` çalıştırıldığında muhtemelen 30-80 hit verecek (mevcut teknik borç). Bu oturumda:
- Her lint hit'ini dosya-dosya fix'le
- Ölü kod tespiti çıktısı → sil
- **Font-size refactor** — `--fs-xs`, `--fs-sm`, `--fs-base`, `--fs-lg`, `--fs-xl` değişken seti kur, tüm hard-coded px'leri dönüştür. Karakter büyüklüğü sorununun köklü çözümü.
- Sonuç: kod tabanı **bugün** temiz, lint yeşil, gelecekte yeşil kalması garanti

### FAZ C — SaaS Hazırlığı

Hedef SaaS olduğu için gerekli. Sadece tek tersane sistemi olsaydı bu faz atlanabilirdi.

**27. Oturum — Tenant İzolasyon Testleri (3-4 saat)**

SaaS'ta en ölümcül hata: **bir firmanın başka firmanın verisini görmesi**. RLS policy'ler var ama sistemli test edilmiyor.

- Test tenant A + Test tenant B oluştur (migration ile)
- Otomatik test: A kullanıcısı B'nin spool_malzemeleri'ni GÖREMEMELİ
- Otomatik test: A admini B'nin malzeme_tanimlari'nı DEĞİŞTİREMEMELİ
- Her yeni tablo için izolasyon testi şablonu
- `tests/rls-isolation.sql` — CI'de çalışır, kırılma → deploy iptal

**28. Oturum — Performans Bütçesi + Observability (2-3 saat)**

"Yavaşlık istemiyorum" hedefini somutlaştırır:

- **Sayfa açılış bütçesi:** `spool_detay < 2s`, `devre_detay < 2s`, `kesim < 1.5s`
- **Sorgu bütçesi:** her Supabase sorgusu < 500ms (p95)
- **Lighthouse CI** — PR'da otomatik ölçüm, bütçe aşımı → uyarı
- **Sentry** veya alternatif error tracking — canlıda hata olduğunda dashboard'dan gör
- **Supabase logs query panel** — en yavaş sorgular haftalık rapor

Sonuç: Kullanıcı yavaşlıktan şikayet ettiğinde "bakayım" yerine **dashboard'dan** nerede tıkandığını görürsün.

**29. Oturum — Rollback + Feature Flag (2-3 saat)**

SaaS'ta deploy bozulursa firmalar etkileniyor, hızlı geri alınabilirlik şart:

- **Vercel rollback** düğmesinin prosedürü yazılı (CLAUDE.md'de)
- **Feature flag tablosu** (`ares_flags`) — yeni özellik canlıya `flag=false` ile çıkar; sen bir müşteri için `flag=true` yaparsın, test edersin, sonra genel açarsın
- **DB migration'lar geri alınabilir** — her `up.sql` için `down.sql`
- **Canary deployment** — yeni sürüm önce 1 firmaya, 24 saat sonra hepsine

---

## 📊 Plan Sonrası vs. Öncesi

| Sorun Alanı | Şu An | Plan Sonrası |
|---|---|---|
| Kural uygulama | Akılda tut, umut et | Lint zorluyor |
| Regresyon | Kullanıcı yakalıyor | Test yakalıyor |
| Ölü kod | Sezgisel fark ediliyor | Otomatik tespit |
| Oturum başı | Bağlamı tekrar yükle | health-check 1 dk'da hazırlar |
| CLAUDE.md | Şişiyor | Her dosya konuya odaklı, 150 satır tavan |
| Tenant izolasyon | "Policy yazdık umarım çalışır" | Her commit'te test |
| Performans | Sezgisel | Dashboard'dan görünür |
| Deploy bozulması | Müşteriler bekler | Rollback + feature flag |
| Karakter büyüklüğü | Hard-coded px kaynıyor | `--fs-xx` değişkenleri |
| Yeni sayfa | "Hangi kuralları uygulamalıydım?" | Şablonu kopyala-yapıştır, uyumlu |

## 💰 Plan'ın Maliyeti

**Zaman:** 4 oturum altyapı + 1 oturum temizlik = 5 oturum yaklaşık 12-15 saat yatırım (Faz B) + Faz C için 3 oturum daha (7-10 saat)

**Bu süreçte yeni özellik çıkmaz** — bakım ve güvence yatırımı.

**Öğrenme eğrisi:** Lint uyarısı aldığında "bypass et" eğilimine karşı 1-2 hafta direnç göstermen gerekir. Sonra alışkanlık.

**Neyi bozar:** Hiçbir şeyi. Mevcut canlı sistem çalışmaya devam eder, altyapı eklemesi pasif.

---

## 📅 Takvim

```
BU HAFTA (kullanıcı değeri)
  22. oturum   Faz 2 Admin UI + yan bug'lar          2-3 saat

GELECEK HAFTA (ALTYAPI — sağlam plan)
  23. oturum   Dosya mimarisi + lint + şablon        3-4 saat
  24. oturum   Mevcut kod temizliği + font-size      2-3 saat

SONRAKİ HAFTA (kullanıcı değeri, lint destekli)
  25. oturum   Faz 3 Form Refactor                   1-2 saat
  26. oturum   Faz 4 IFS Fuzzy Match                 1-2 saat

AYLIK (SaaS hazırlığı)
  27. oturum   Tenant izolasyon testleri             3-4 saat
  28. oturum   Performans bütçesi + observability    2-3 saat
  29. oturum   Rollback + feature flag               2-3 saat

İLERİDE (yeni özellik fazları — bu altyapı üstüne)
  30+          Mobil entegrasyon, raporlar, analitik...
```

---

## 🔒 Plana Bağlılık Disiplini

Bu plan ancak sen uygularsan çalışır. Dört basit kural:

1. **Lint hit'ini bypass etme.** "Bu sefer geçeyim" yoktur. Ya lint yanlış yazılmış (düzelt), ya kod yanlış yazılmış (düzelt). Üçüncü seçenek yok.

2. **Faz B'yi atlayıp Faz C'ye geçme.** Tenant izolasyon testi yazmak için önce tests dizini, CI altyapısı lazım. Sıra bozulmasın.

3. **Oturum başı ritüeline sadık kal.** Yeni sohbet açar açmaz `bash scripts/health-check.sh`. Bu bir öneri değil, sözleşme.

4. **Yeni kural → lint + rule dosyası + sicil.** Bir kural CLAUDE.md'ye yazıldıysa ama lint'e kodlanmadıysa o kural yoktur. Bir sonraki oturumda atlanır.

---

## 🚫 Bu Plan NE DEĞİLDİR

Dürüstlük bölümü. Bu plan:

- **Test coverage %100** değildir. Sadece kritik path'ler test edilir (tenant izolasyon, enum canonical, migration up/down).
- **Microservices/Kubernetes** değildir. Vercel + Supabase monolit devam eder, sadece kodlama disiplinleri eklenir.
- **GraphQL/tRPC geçişi** değildir. Supabase client kalır.
- **Tam CI/CD** değildir. Commit → lint → deploy var, ama automated staging environment vs. yok (solo geliştiriciye gerek yok).
- **Kod review** zorunluluğu değildir. Solo + AI ekibisin, self-review yeterli (lint + test yakalıyor).

SaaS büyüyüp ekip 3+ olunca bu satırlar yeniden değerlendirilir.

---

## 📞 Plan Sapması Durumunda

Plan %100 kesin değildir. Uygulamada şunlar olabilir:

- **23. oturumda altyapı 4 saat yerine 6 saat sürdü.** Normal. Bir parçayı 24'e kaydır, önemli değil.
- **24. oturumda 80 hit çıktı.** Muhtemel. Bu oturum 3 saat yerine 5 saat olabilir, veya 24A ve 24B'ye bölün.
- **Müşteri acil bir özellik istedi.** Altyapıyı yarıda bırakma — mevcut oturumu bitir, sonra özellik. Yarım altyapı faydasızdır.
- **SaaS hedefi değişti.** ROADMAP.md güncellenir, Faz C değişir.

---

## 🎯 Başarı Kriterleri

Bu planın "başarılı" sayılması için:

- ✅ 24. oturum sonunda `bash scripts/health-check.sh` tüm kurallarda yeşil
- ✅ 25-26. oturumlarda yeni özellik eklerken lint zaten var, yeni ihlal çıkmıyor
- ✅ 27. oturum sonunda `tests/rls-isolation.sql` çalışıyor, CI'de otomatik
- ✅ 29. oturum sonunda bozuk deploy olursa 5 dakika içinde rollback yapılabilir
- ✅ 6 ay sonra: canlıda 3 aydır kullanıcı-gördüğü regresyon yok
- ✅ 12 ay sonra: 2. tersane/firma müşterisi satılmış, tenant izolasyon sızıntısı yok
