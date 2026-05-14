# AresPipe — Son Durum

> **Son güncelleme:** 14 Mayıs 2026 — 87. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 86. oturum — Renk semantiği + tanımsız öneri akışı (commit `92d652c`)
> **Sonraki oturum:** 88 — Tanımsız malzeme akışı **vizyon değişikliği** (yeniden tasarım)

---

## 87. Oturum Özeti — Kütüphane Kapanış + Vizyon Yeniden Hizalama

87'de hedef "kütüphaneyi şimdilik kapat, başka konulara geç" idi. 4 alt iş (A/B/C/D) tasarlandı, 3'ü tamamlandı, 4. (87.C onay/red akışı) sahaya çıktı ama Cihat'ın geri bildirimiyle **temel kurgu hatalı** olduğu tespit edilince revert edildi. Net sonuç: kütüphane görünüm + sayım altyapısı temiz, ama tanımsız öneri akışı 88'de sıfırdan vizyona uygun yazılacak.

---

## Yapılanlar

### 87.A — Kütüphane render + console temizliği (3 alt iş)

86 kapanışında "topbar/layout render fix" diye işaretlenmişti, gerçek tanı farklı çıktı:

1. **3 eksik tablo migration** (`062_eksik_kutuphane_tablolari.sql`):
   - `ozel_parcalar`, `tenant_spec_seti`, `spec_kural` — boş şema + RLS + 5'er policy
   - `KUTUPHANE-YUKLEME-TAKIP.md` §6, §7 referansı
   - Console'daki 3 adet 404 hata düştü

2. **`ares-layout.js` lang/tr.json path fix:**
   - `fetch('lang/' + lang)` → `fetch('/lang/' + lang)` (absolute path)
   - `admin/` altından çağrıldığında `admin/lang/tr.json` 404 atıyordu, root'tan absolute path çözdü

3. **`ares-layout.js` CSS injection guard:**
   - Statik `.sidebar` HTML tanımlamış sayfalarda (kutuphane.html, kutuphane-oneriler.html) `position:fixed` içeren dinamik CSS bloğunu DOM'a enjekte etmesin
   - Tanı: `getComputedStyle(.sidebar).position = fixed` (ares-layout.js satır 401 CSS), sidebar ana akıştan kopup içeriğin üstüne biniyordu
   - `if (!document.querySelector('.sidebar')) { document.head.appendChild(style); }`

### 87.B — Bekleyen Öneriler kartı (kutuphane.html)

- `GRUPLAR` array'ine 8. eleman: `{ kod:'oneriler', ozelKart:true, link:'kutuphane-oneriler.html' }`
- `ciz()` fonksiyonuna özel render branch — tıklanır `<a>`, sıklığa göre rozet (`bos/aktif/kritik` + pulse animasyon)
- `oneriSayisiAl()` — `tanimsiz_kayitlar` WHERE `durum='bekliyor'` count
- Realtime subscribe listesine `tanimsiz_kayitlar` eklendi
- CSS: `.oneri-rozet`, `.grup-kart-link`, pulse keyframes

### 87.B+ — kutuphane-oneriler.html iyileştirmeleri

86.D Phase 1'de yazılmıştı, 87'de iki bug düzeltildi:
1. **Sidebar:** 4-item (Panel/Kütüphane/Firmalar/Yönetim) → 8-item (kutuphane.html ile birebir, "Kütüphane" active turuncu)
2. **Supabase race condition:** `ARES.supabase()` çağrısı `ares-store.js` yüklenmeden önce → "Supabase bağlantısı yok" hatası. Fix: 80×100ms retry loop (kutuphane.html pattern'i)

### 87.C — 86.D Phase 2 (onay/red akışı) — **REVERT EDİLDİ**

- Migration `063_oneri_karar_rpc.sql` yazıldı + push edildi (kalıyor, atıl)
  - `oneri_reddet(p_oneri_id, p_karar_notu)` — UPDATE durum='reddedildi'
  - `oneri_onayla_boru(p_oneri_id, p_form jsonb, p_mod text)` — INSERT INTO boru_olculer
- `kutuphane-oneriler.html` UI: 3 buton + red modal + boru onay modal + agirlik_kg_m hesap + RPC çağrıları
- **Revert sebebi:** Cihat'ın geri bildirimi sonrası **3 temel hata** tespit edildi:
  1. **Sıklık yanıltıcı:** `siklik_sayisi` "kullanıcı kaç kez tıklayıp kaydetti" = oyunlaştırılabilir, gerçek talebi yansıtmıyor. Olması gereken: `spool_malzemeleri` üzerinden gerçek-zamanlı COUNT.
  2. **Kullanıcıya iş yükleniyor:** "Kaydet" akışı operatöre ekstra adım. Olması gereken: kullanıcı tıklamasa bile sistem otomatik tanımsız listesini görür.
  3. **Kullanıcı verisine güven yanlış:** Modal'da kullanıcı "Standart: DIN 17175" yazar ama yanlış olabilir → süper admin yine internetten araştırmalı.
- Commit `d2b22e3` revert edildi (`33c10b5` → `dad5307`). Saha 86.D Phase 1 (sadece okuma) hâline döndü.

### 87.D — Atlandı

Veri borç tanıları (60.30×6.3, 114.30, 139.70×4.5) — 87.C revert edilince anlam değişti. 88 vizyon implementasyonu sırasında otomatik adreslenir.

### 88 Vizyon Belgesi

Yeni `docs/88-VIZYON-TANIMSIZLAR.md` yazıldı:
- `v_tanimsiz_havuz` VIEW tasarımı (gerçek-zamanlı sıklık)
- Kullanıcı "Kaydet" akışı kaldırma planı
- Süper admin "Kütüphane Bilinçli Yardım" (3 paralel sorgu: ASME yakın eşleşme, malzeme katalog kontrolü, STD_KILAVUZ JS lookup)
- `oneri_kutuphaneye_bagla` yeni RPC tasarımı
- 88 için 8 alt görev (88.A — 88.H), ~4 saat tahmin

---

## Migration'lar (87'de eklendi)

| # | Dosya | Statü |
|---|---|---|
| 062 | `062_eksik_kutuphane_tablolari.sql` | ✅ DB'de aktif (3 tablo + 15 policy) |
| 063 | `063_oneri_karar_rpc.sql` | ⚠ DB'de atıl (UI revert edildi, çağrılmıyor — 88'de vizyona uyumluluğu değerlendirilir) |

---

## Commit'ler

| Hash | Mesaj | Etkisi |
|------|-------|--------|
| `9a5bf02` | feat(87.A): eksik kutuphane tablolari (062) + lang path absolute fix | 3 tablo + lang/tr.json fix |
| `48ed6d4` | fix(87.A): ares-layout.js CSS injection guard | Sidebar position:fixed bug fix |
| `b2ddac1` | feat(87.B): kutuphane.html Bekleyen Oneriler karti | 8. kart + oneriSayisiAl |
| `8a74307` | fix(87.B): kutuphane-oneriler.html sidebar tam menu + Supabase retry loop | Race condition + sidebar uyumu |
| `f80c00f` | feat(87.C): migration 063 oneri karar RPC fonksiyonlari | DB'de RPC'ler (atıl) |
| `d2b22e3` | feat(87.C): kutuphane-oneriler.html UI — onay/red modallari + RPC cagrilari | **REVERT edildi** |
| `33c10b5` | Revert "feat(87.C)..." | UI 86.D Phase 1'e döndü |
| `dad5307` | (bu kapanış) | Vizyon belgesi + kapanış dosyaları |

---

## 88'e Açık Borç (önceliğe göre)

1. **`v_tanimsiz_havuz` VIEW + RLS** — Phase 1 sadece boru (88.A)
2. **Kullanıcı "Kaydet" akışı kaldır** — `spool_detay.html` tanimsizModalAc fonksiyonu sök (88.B)
3. **`kutuphane-oneriler.html` listeYukle()** — `v_tanimsiz_havuz` view'inden veri çek, kolonlar güncelle (sıklık + devre + tenant) (88.C)
4. **"Kütüphane Bilinçli Yardım"** — detay paneline 3 paralel sorgu (ASME yakın eşleşme + kalite katalog + STD_KILAVUZ) (88.D)
5. **`oneri_kutuphaneye_bagla` RPC** — tek tıkla 36 spool'u bağla (88.E)
6. **STD_KILAVUZ JS lookup** — 50-100 yaygın kombinasyon seed (88.F)
7. **Manuel kaydet modal** — 87.C kodunu vizyona uyumlu refactor (88.G)
8. **Migration 063 değerlendirme** — vizyona uyumluysa kalır, değilse 90+ DROP

---

## Kritik Hatırlatmalar (87'de eklenen disiplinler)

- **MK-87.1** — Açılış ritüelinde `docs/CLAUDE-*.md` path'i kullan, kök değil. 86 kapanışta Cihat "ritüele uymadı" sandı çünkü `cat CLAUDE-SONRAKI-OTURUM.md` (kök) "no such file" verdi. Doğru: `cat docs/CLAUDE-SONRAKI-OTURUM.md`. (CLAUDE.md'de path düzeltmesi yapılacak — 88.A öncesi 5 dk iş.)

- **MK-87.2** — Eski admin sayfaları (panel.html ve alt sayfaları) modern kütüphane sayfalarıyla farklı sidebar pattern'ında. `kutuphane.html` ve `kutuphane-oneriler.html` yeni standart. Tüm admin sayfaları aynı şele kavuşturulmalı (88+ refactor borcu, "admin layout standardizasyonu" olarak).

- **MK-87.3** — Mac Terminal'e çoklu satır commit mesajı yapıştırma güvenilmez (bracketed paste karakter yutar → "parse error near ')'"). Commit mesajları **tek satırda** olmalı. Veya `git commit -F <dosya>`. MK-86.1'in commit varyantı.

- **MK-87.4 (kritik)** — Sıklık counter modeli yanlış: `tanimsiz_kayitlar.siklik_sayisi` "kaç kullanıcı tıkladı" demek, **DEĞİL** "sistemde gerçekten kaç kez geçiyor". Counter kolonlar kullanıcı eylemine bağlı olunca oyunlaştırılabilir ve gerçek talebi yansıtmaz. Yeni tasarım: gerçek-zamanlı view + `spool_malzemeleri` üzerinden COUNT. 88.A görevi.

- **MK-87.5** — Kullanıcıya iş yükleme prensibi: Sistem zaten bir bilgiyi görüyorsa (boru_olculer_id NULL → tanımsız), kullanıcıya "kaydet" dedirtmek gereksiz. Otomatik tetik tercih edilir. 88.B görevi.

- **MK-87.6** — "Süper admin sıfırdan araştıracak" kabulü kötü UX. Sistem önce **kendi kütüphanesinden** yakın eşleşme aramalı (ASME B36.10/B36.19), sonra manuel araştırmaya gerek olduğunu göstermeli. 88.D görevi.

Eski disiplinler korunur: MK-85.x (RLS asla kapalı, model-UI simetri), MK-86.x (zsh tuzakları, şema+CHECK+RLS üçü doğrulanmadan migration yazılmaz).

---

## CI Son Durum

- **Build:** ✅ YEŞİL
- **Vercel:** ✅ Production aktif, son deploy `dad5307` (revert push)
- **Lint:** 0 hata (87'de yeni kural eklenmedi)

---

## Performans / Veri Sinyalleri

- **87.A migration 062:** 3 tablo oluştu, count = 0 hepsinde, beklenen
- **87.B kart:** kutuphane.html sayfası 8. kart "Bekleyen Öneriler" görünüyor, 1 kayıt geldiğinde "1 bekliyor" turuncu rozet doğru
- **87.B+ retry loop:** kutuphane-oneriler.html artık `ares-store.js` async yükünü bekliyor, "Supabase yok" hatası geçmiyor
- **86.C v2.1 saha test:** Dolaylı doğrulandı — `tanimsiz_kayitlar` tablosunda 1 kayıt mevcut (`std_disi|139.700|4.500|st37`), CHECK constraint geçti, hash hesabı doğru
- **87.C revert sonrası:** Saha 86.D Phase 1 görünümünde — 3 buton yok, sadece okuma paneli

---

> **88. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md`, `docs/CLAUDE-SONRAKI-OTURUM.md` ve özellikle `docs/88-VIZYON-TANIMSIZLAR.md` okunacak.**
