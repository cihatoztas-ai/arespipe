# 52. Oturum — Akış Altyapısı Revizyonu (2 Mayıs 2026)

> **Durum:** ✅ Beklenmedik yöne gitti, ama bu doğru yöndü.
>
> 52'nin planı parser_kural iyileştirmesiydi. Sohbet altyapı işine yöneldi: knowledge ↔ repo bağlantısı, dosya transfer otomasyonu, push akışı, ritüel sadeleştirme. Sonuçta planlanan teknik iş 53'e ertelendi ama "her oturum başlangıcının vergi'si" ciddi şekilde düştü.

> 📜 Bu özet 53. oturumun başında yazıldı (52 kapanışında atlandı). Detaylar `git log` + bu sohbet üzerinden derlendi.

---

## Hedef ve Sapma

**Planlanan hedef:** 51'in açık borçlarını kapatmak — parser_kural pipeline_no regex'i genişletme, `_l2_meta` DB'ye yazma, 5+ Tersan PDF ile L2 başarı oranı ölçümü.

**Gerçekleşen:** Cihat sohbette altyapıyla ilgili olası iyileştirmeleri sezdi, sohbet bu yöne döndü. Sonuçta dökümantasyon ve akış altyapısı elden geçirildi. Planlanan teknik iş 53/54'e ertelendi.

**Sapma değerlendirmesi:** Doğru yön. Parser_kural'ı iyileştirmek için her oturumda önce 10-15 dakika manuel dosya yükleme + bağlam kurma vergisi ödeniyordu. Bu vergi olmadan 54'te parser_kural işine doğrudan dalmak mümkün.

---

## Yapılanlar (Sıralı)

### 1. Knowledge ↔ Repo Bağlantısı (MK-52.4)

**Eski akış:** Her oturum sonunda `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` üçü manuel olarak Claude project'e Files olarak yükleniyordu. Eski sürümler silinip yenisi konuyordu. Tek doğru kaynak yoktu, repo ↔ Claude bilgi senkronu kırılgandı, bağlam dardı (5-10 dosya).

**Yeni akış:** Claude project doğrudan GitHub repo'ya bağlandı. Repo'daki tüm dosyalar push sonrası otomatik knowledge'a indekslenir. ~1-2 dakika gecikme var (push → indexleme), bu süre dışında knowledge canlı.

**Sonuç:** 12% kapasite kullanımı. 40+ web sayfa, mobil React kodu, `api/`, `lib/`, `docs/` (16 dosya), `migrations/` (26 dosya), `.github/` hepsi indexli. Claude bu cevapta knowledge'ı 6 farklı sorguyla taradı, anında geldi.

**Sınır:** DB içeriği, runtime log'lar, Storage PDF'leri, Vercel env değişkenleri repo'da olmadığı için knowledge'da da değil. Bunlar hâlâ kopyala-yapıştır gerektiriyor.

### 2. `arespipe_kopyala` zsh Fonksiyonu (MK-52.1)

**Sorun:** macOS Downloads `dosya.js` zaten varsa yenisini `dosya (1).js` olarak ekliyor, sonra `dosya (2).js`, vb. `cp ~/Downloads/dosya.js ~/Desktop/...` komutu eski (boyut 1) sürümü kopyalıyor. 15+ oturum boyunca bu yüzden yanlış push'lar oldu, her seferi 30+ dakika düzeltme aldı.

**Çözüm:** `~/.zshrc`'de `arespipe_kopyala` fonksiyonu. Kullanım:

```bash
arespipe_kopyala ~/Downloads/dosya.js ~/Desktop/arespipe/api/dosya.js <BEKLENEN_MD5>
```

MD5 doğrular, eşleşirse kopyalar (`✅ Kopyalandi`), eşleşmezse reddeder (`❌ MD5 uyusmuyor`).

**Claude tarafı disiplin:** Her dosya transferinde MD5'i komutta veriyor, `cp` doğrudan kullanılmıyor.

### 3. `gp` zsh Fonksiyonu (MK-52.2)

**Sorun:** Her `git push` sonrası GitHub Actions `ci-son-rapor.json`'u güncelleyip `[skip ci]` ile commit ediyor. Bir sonraki push'ta lokal arkada kalıyor → push reject → manuel `git pull --rebase` → tekrar push. Oturum başına 5+ kez tekrarlanıyordu.

**Çözüm:** `~/.zshrc`'de `gp` fonksiyonu. Önce origin fetch + rebase, sonra push. Conflict olursa abort eder, kullanıcıya söyler.

**Disiplin:** Artık `git push origin main` doğrudan yazılmaz, `gp` kullanılır.

### 4. Açılış Ritüeli Sadeleştirildi (MK-52.3)

**Eski (5 madde):**
1. git pull temiz mi
2. CI yeşil mi (Actions sayfası)
3. son-durum.md güncel mi
4. Bekleyen migration var mı
5. Cihat'tan geri bildirim var mı

**Yeni (2 madde):**
1. `git pull && git status && git log --oneline -3` çıktısı
2. Bugün ne yapmak istiyorsun?

**Sebep:** Bilgi vermeyen adımlar Cihat'ı yoruyordu. CI durumu zaten `son-durum.md`'de, geri bildirim genelde 0, "hangi sayfa" gündem konuşulunca çıkıyor. Knowledge ↔ repo bağlandığı için son-durum.md anlık güncel.

### 5. Yeni Dökümanlar Doğdu

**`docs/CLAUDE-CALISMA-MODU.md`** — Claude'un Cihat ile nasıl çalışacağı talimat dosyası. "Sen kimsin", "Cihat kim", "senden beklenen", "yapma" listeleri.

**`docs/PROJE-HARITASI.md`** — Yazıldı ama içerik tamamlanmadı. CLAUDE.md ve CLAUDE-CALISMA-MODU.md "her oturum başında oku" diyor ama dosya boş kaldı. **53'te içeriği yazıldı.**

### 6. CLAUDE.md Güncellemeleri

- Açılış ritüeli 5→2 madde olarak güncellendi
- MK-52.1 ve MK-52.2 detayları (komut kullanımı için) yazıldı
- Knowledge ↔ repo bağlantısı not edildi

---

## Karşılaşılan Yapısal Problem (53'e devreden ana iş)

Sohbet sonunda Cihat şunu fark etti:

> *"yakışıklı hazırlanmış cafcaflı dosyalar düzenleyip kenara atmak istemiyorum. ya canlı tutamayacağımız dosyalar olmasın ya da hiç olmasın. ben nasıl olsa kaydettik diye güveniyorum, aradan 20 oturum geçmiş, ortada çoktan ölmüş dosyalar var."*

**Tespitler:**
- `docs/ROADMAP.md` 23-29. oturum planı, 24+ oturum sapmış, kimse güncellememiş
- `docs/PANO-TASARIM.md` 24. oturum implementasyon planı, "şu an neredeyiz" sorusunun cevabı yok
- `docs/PROJE-HARITASI.md` referansı var ama dosya boş
- `son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` 52 kapanışında güncellenmemiş — hâlâ 51 sürümünde
- MK kuralları üç dosyada birden tekrar ediyor, kanonik adres yok

**Sonuç:** 53'ün ilk işi dökümantasyon revizyonu olarak kararlaştırıldı. **53'te yapıldı** — bu özetin yazılma sebebi de o.

---

## Veriyle Tasarım Hatırlatması

52'de altyapı kararlarının pek çoğu **ölçüldükten sonra** alındı:
- "Knowledge'a kaç dosya yüklüyoruz?" → 5-10
- "Manuel yüklemede hangi adımda kayboluyor?" → eski sürüm `~/Downloads`'da
- "Kaç oturumda yanlış sürüm kopyalandı?" → 15+
- "`git push --rebase` döngüsü oturum başına kaç kez?" → 5+

Bu rakamlar olmasaydı kararların gerekçesi sezgisel kalırdı.

---

## Süreç Olayları

### Mac Downloads Karmaşası (sürekli)

Cihat tarayıcıdan dosyayı indirirken bazen önceki sürüm hâlâ Downloads'da duruyordu. `KARARLAR.md` indirilince `KARARLAR (1).md` oluyor, `arespipe_kopyala` MD5 uyuşmazsa reddediyor. Disiplin: `~/Downloads/_arsiv/` klasörüne eskiyi taşıyıp yeniyi `KARARLAR.md` olarak yeniden adlandırma.

### "Komut Çıktı Gürültüsü"

Sohbet sırasında `for f in ...; cat "$f"; done` desenli toplu çıktı verince Cihat "komutun başladığı yeri bile bulmak zor" dedi. Bu MK-53.2 olarak resmiyetleştirildi (53'te).

---

## DB Operasyonları

Yok.

---

## Commit'ler

Detay GitHub repo `git log` üzerinden alınabilir. Ana noktalar:

- Birden fazla `docs/` güncelleme commit'i
- `f8980f1` docs: CLAUDE.md ritual okuma listesi güncellendi (52)
- `f5eb28b` chore(ci): ci-son-rapor.json güncelle [skip ci] (kapanış)

CI: ✅ YEŞİL (her commit sonrası ci-son-rapor.json otomatik)

---

## 53'e Devreden Borçlar

**Hemen:**
- Dökümantasyon revizyonu (yapıldı, 53'te)
- KARARLAR.md doğacak (yapıldı, 53'te)
- ROADMAP + PANO-TASARIM arşivlenecek (yapıldı, 53'te)

**Sonra (54+):**
- parser_kural pipeline_no fix
- `_l2_meta` / `_l2_fallback` log
- 5+ Tersan PDF testi
- Format envanter UI

---

## Performans

Mevcut metrikler 51'le aynı (52'de kod değişmedi).

---

## Kazanılan Zaman (54+'a)

Her oturum başlangıcında:
- Eski: 10-15 dk manuel dosya yükleme + bağlam kurma
- Yeni: 30 sn (`git pull` çıktısı + ne yapacağız sorusu)

20 oturum projesi varsayarsak ~3-5 saatlik kazanç. Aynı zamanda "manuel yükleme unutuldu, Claude eski bilgiyle çalıştı" risk sıfırlandı.

---

> 53. oturum açılışında bu dosya + son-durum.md + CLAUDE-SONRAKI-OTURUM.md okundu. Bu özet kapsamlı detay isteyenler için, son-durum.md tek sayfalık snapshot için.
> Detay karar listesi: `docs/KARARLAR.md`. Modül durumu: `docs/PROJE-HARITASI.md`.
> 51'in detayı: `docs/oturumlar/051-tersan-l2-canli.md` (kalıcı arşiv).
