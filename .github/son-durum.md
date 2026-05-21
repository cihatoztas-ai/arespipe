# Son Durum — 109. Oturum (22 May 2026)

> 108 → 109 geçişi. Ana hedef: kabuk-first akışını TEK YERE topla (A-yolu). 108 sonu kullanıcı
> geri bildirimi: akış dolambaçlı — wizard "klasörü hallederim" diyor ama spool oluşturmak için
> devre_detay'a yolluyordu. 109 bu dolambacı kaldırdı.

---

## Bu Oturumun Sonucu

**109 başarıyla kapatıldı.** Onay/INSERT mantığı ortak `ares-kabuk.js`'e çıkarıldı; wizard artık
spool'u KENDİ İÇİNDE oluşturuyor (devre_detay → Excel → Aktar dolambacı tarihe karıştı). Üstüne üç
küçük iyileştirme: per-spool yüzey (B1), wizard güvenlik düğmesi (B2), wizard'da spool seçimi (#4),
ve devre_detay izometri etiketi için lang anahtarları (#5).

### Yapılanlar (A-yolu)

1. **`ares-kabuk.js` (YENİ ortak modül)** — `ARES_KABUK.boyutParse` + `grupla` + `aktar`. devre_detay'ın
   KANITLI `onayAktar` INSERT gövdesi AYNEN taşındı (yeniden yazılmadı — MK-109.1), DOM/toast/reload
   soyuldu, çoklu kuyruk id desteği eklendi. Kabuk kilidi (MK-WIZARD.3 idempotency) modülün İÇİNDE →
   iki taraf da otomatik korunur.
2. **devre_detay** — `_onayGrupla`/`_onayBoyut` → ince alias; `onayAktar` → ~25 satırlık sarmalayıcı
   (checkbox + yüzey topla → `ARES_KABUK.aktar` → toast/reload). Kullanıcıya davranış 108 ile birebir.
3. **devre_wizard** — kabuk önizleme altına "✓ Onayla / Kilitle → N spool oluştur"; tıkla → `ARES_KABUK.aktar`
   → yerinde "N spool oluşturuldu ✓" (davranış B). Elle Excel→Aktar yok.
4. **PDF onay butonları** — izometri PDF'in `parse_sonuc`'u (spoollar/format/batch_id) Excel BOM
   (satirlar) ile uyumsuz; "Önizle/Onayla" izometride "Parse sonucu boş" veriyordu (108 borcu). Artık
   `_kuyrukParser==='excel-generic'` ile gate'lendi; izometri için pasif "İzometri — arka planda" etiketi.

### Yapılanlar (B1 + B2 + #4 + #5)

- **B1 — per-spool yüzey:** `grupla` her spool'a `yuzeyHam` türetir (r.yuzey → system token). `aktar`
  opsiyonel `perSpoolYuzey:true` ile her spool kendi yüzey kodunu yazar (wizard); boşsa tek `yuzey`
  param'ına düşer. devre_detay flag GÖNDERMEZ → eski tek-yüzey davranışı korunur (sıfır regresyon).
  Önizlemede gösterilen yüzey artık DB'ye de yazılıyor.
- **B2 — wizard güvenlik düğmesi:** sonuç ekranında "⟳ Bekleyenleri işle (N)". Fire-and-forget izometri
  tetiği koparsa kullanıcı detaya gitmeden drene eder; wizard kendi kuyruk id'lerinden kalanı sorgular.
- **#4 — wizard spool seçimi:** kabuk tablosunda satır checkbox'ları + "tümünü seç/kaldır" + canlı sayaç;
  0 seçilirse buton pasif. Onayla sadece seçilenleri oluşturur (anahtar: pipeline|spool|rev — grupla ile aynı).
- **#5 — lang anahtarları:** `dv_izo_arka` + `dv_izo_arka_aciklama` → tr/en/ar.json (1909 → 1911).
  AR pattern korundu (spool=السبول, İzometri=إيزومتري).

### Canlı Doğrulamalar

- ✅ Wizard içi Onayla CANLI çalıştı: `cizim_durumu` dağılımı `bekliyor` 3 → **39** (36 yeni kabuk spool),
  `tam` 628 sabit. Dolambaç gerçekten kapandı.
- ✅ Wizard izometri kuyruğu: `bekliyor` 0 (self-chain drene etti), 1 `hata` (508 PDF), 17 `manuel_onay`,
  39 `oneri_hazir`.
- ⏳ B1/B2/#4 canlı testleri son push sonrası yapılacak (kod doğrulandı: node --check + saf-fonksiyon birim testi).

---

## Commit'ler (109)

| Hash | Mesaj |
|------|-------|
| `70f7e32` | feat(109): A-yolu — onay/INSERT ortak ares-kabuk.js'e tasindi, wizard ici Onayla + PDF butonu duzeltme |
| (bu push) | feat(109): B1 per-spool yuzey + B2 wizard bekleyenleri isle + #4 wizard spool secimi + #5 lang |
| (doc) | chore(109): kapanis dokumanlari [skip ci] |

CI: kod değişiklikleri düz string/render + DB sorgusu (lint sorunu beklenmedi). Kullanıcı push sonrası yeşili teyit eder.

---

## Mimari Kararlar (109)

- **MK-109.1 — Çalışan kodu yeniden yazma, ÇIKAR + hizala.** Kanıtlı `onayAktar` INSERT gövdesi
  `ares-kabuk.js`'e aynen taşındı; sıfırdan yazılmadı. Risk minimum, davranış korundu.
- **MK-109.2 — Kabuk-first onay wizard'ın İÇİNDE (A-yolu).** INSERT artık devre_detay'a bağlı değil;
  ortak modül iki sayfada da çağrılır. "Tek yerde biter" — kullanıcının dolambaç şikâyeti çözüldü.
- **MK-109.3 — izometri PDF parse_sonuc şekli ≠ Excel BOM.** PDF: spoollar/format/batch_id; Excel: satirlar.
  PDF başına onay YOK (kabuk-first); onay butonları parser tipiyle gate'lenir.
- **MK-109.4 — per-spool yüzey opt-in.** `perSpoolYuzey` bayrağı; varsayılan (devre_detay) tek yüzey =
  eski davranış. Geriye uyumlu genişletme deseni.
- **MK-109.5 — Büyük dosya düzenleme + doğrulama disiplini.** Full-file yeniden üretmek yerine kopya
  üzerinde `str_replace` → inline JS ayıkla → `node --check` → saf fonksiyonları birim testle doğrula.
  Ayrıca `arespipe_kopyala` yanlış kaynağa bakabildi (bu oturumda "Kaynak yok / MD5 uyuşmuyor") →
  `cp` + `md5` gözle teyit eşdeğer güvenlik (MK-101.1 tamamlayıcısı).
- **MK-109.6 — `[skip ci]` ve boş commit tuzağı.** `[skip ci]` push'un TEPE commit'inde olursa GitHub o
  push'un TÜM CI'sını atlar (alttaki kod commit'leri dahil — bu oturumda `cd93fae` kod commit'i, üstündeki
  `980f20b [skip ci]` yüzünden hiç koşmadı). Ayrıca BOŞ commit (`--allow-empty`, 0 değişen dosya) `paths`/
  `paths-ignore` filtreli workflow'u tetikleMEZ. Kural: (a) kod + doküman aynı push'taysa `[skip ci]`
  KULLANMA; ya da (b) önce kod commit'ini ayrı push'la (CI koşsun), SONRA doküman commit'ini `[skip ci]`
  ile ayrı push'la. CI'yı sonradan tetiklemek için boş commit değil, gerçek (zararsız) dosya değişikliği push'la.

---

## DB Değişiklikleri

Yok (109'da migration yok; `cizim_durumu` 108'de eklenmişti). Doğrulama sorgusu:
```sql
select cizim_durumu, count(*) from spooller group by 1 order by 1;
```

---

## 110'a Açık Borç (önceliğe göre)

1. **Adım 4 — PDF→kabuk eşleştirme (110 ANA TEMA).** izometri `parse_sonuc` → kabuk spool'a bağla
   (resim_no+spool_no, MK-WIZARD.5), eksik (alıştırma, yön) doldur, `cizim_durumu` `bekliyor→kismi→tam`.
   Canlı `parse_sonuc` örneği görmeden tasarlanamaz — kararlar SONRAKI doc'ta.
2. **`cizim_durumu` UI rozeti** — devre_detay spool listesinde bekliyor/kismi/tam göstergesi. Adım 4'ün parçası.
3. **HTTP 508 PDF** (`M100-323-FM12-ALS.S02.1.pdf`) — kalıcı `hata`; izometri-oku 508 sebebi araştır.
4. **İkiz kolon temizliği** — `SEMA-IKIZLER.md`, expand–contract, ayrı oturum (MK-108.2).
5. **Öğrenme döngüsü** — düzeltme sözlüğü (MK-107.3) + 3-katman (MK-107.5) + süper admin (MK-107.7).
6. **3D hattı** (MK-49.A + MK-107.6).
7. **"Tersan M110 Montaj Resmi" formatı GERÇEK** — silme, doğru tanıma.
8. **Düşük öncelik:** wizard tam i18n (dinamik JS metinleri hâlâ düz TR — tutarlı, ama EN/AR isterse büyük pass).

---

## Kritik Hatırlatmalar (109'a taşınanlar dahil)

- **`izometri-oku.js`'e DOKUNMA** (MK-49.1) — eşleştirme worker'ın SONRASINA, ayrı yere girer (Adım 4).
- **Önce `git commit`, SONRA `gp`** — gp commit'ten önce çalışırsa boşa push.
- **`arespipe_kopyala` şaşabilir** → `cp` + `md5` gözle teyit (MK-109.5).
- **MK-108.1 — iki kuyruk:** wizard = `dosya_isleme_kuyrugu`/`devre-belgeleri`/`kuyruk-isle-izometri.js`;
  eski = `is_kuyrugu`/`izometri-pdfs`/cron. Yeni iş eklerken hangi kuyruk olduğunu doğrula.
- **MK-108.4 — kolon adı yazmadan önce `information_schema` sorgula.**
- **Env:** `SUPABASE_SERVICE_KEY`; `SELF_BASE_URL=https://arespipe.vercel.app`.
- **Proje bilgisi ~52'de donmuş** — güncel durum yalnız bu dosyalar + git'ten.

---

> 110 açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.
