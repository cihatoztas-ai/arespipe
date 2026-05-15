# 89. Oturum Gündemi

> **Önceki oturum:** 88. Oturum (14 Mayıs 2026)
> **Konu:** Kütüphane Önerileri sayfası refactor + 88.G özel parça formu
> **Tahmini süre:** 2-3 saat

---

## Ön Koşul — REFERANS SAYFA KRİTİK

89'a başlamadan önce **mutlaka bir mevcut admin sayfasının ilk 60 satırını görmek lazım** (örn. `admin/panel.html`, `admin/firma-detay.html`, `admin/formatlar.html`, vb.). MK-88.D öğrenmesi: AresPipe ortak layout pattern'i tahminle çalışmıyor.

Görmek istediklerim:
- Head'deki script imports (relative path yapısı)
- `<body>`'de hangi data-attribute'lar (`data-sayfa`, `data-tema` vb.)
- Sidebar HTML'i sayfada mı yoksa JS inject mi
- CSS değişkenleri (`--ac`, `--sur2`, `--bor`) hangi dosyadan geliyor
- `tv()` helper kullanımı (sync mi async mi, fallback formatı)
- Lang dosyalarının konumu (`lang/tr.json`? `lang.js`?)

**89 ilk mesajı:** "Hangi admin sayfasını referans alalım?" sor.

---

## Sıra

### Adım 1 — Referans sayfa analizi (15 dk)
- Cihat bir admin sayfasının HTML'ini yapıştırır
- Pattern'i çıkar: script imports, sidebar mekaniği, CSS yüklemesi, layout grid

### Adım 2 — `admin/kutuphane-oneriler.html` komple yeniden yaz (60-90 dk)
- AresPipe ortak layout pattern'ine uyumlu
- Sol sidebar görünür, üst header doğru
- Script path'leri çalışır → ARES global yüklenir
- CSS değişkenleri çalışır → palet doğru
- RPC `v_tanimsiz_havuz_listele()` çağrılır, 2 satır görünür
- Stat-pill'ler: 2 / 31 / 1 (kayıt / spool / tenant)
- Cascade animasyon (45ms × index)
- Boş durum mesajı (`Tüm malzemeler kütüphaneye bağlı!`)
- Konsol temiz

### Adım 3 — 88.G: Detay paneli + özel parça formu (45-60 dk)
- Liste satırına tıklama → yan panel veya modal aç
- Detay görünümü: ölçü, kalite, sıklık, etkilenen spool listesi (ufak), tenant'lar
- Form alanları (`boru_olculer` kolonlarına göre dinamik):
  - **Zorunlu:** standart (dropdown veya text — büyük olasılıkla "Özel"), malzeme_grubu (dropdown: karbon/paslanmaz/duplex/CuNi/alüminyum/alaşımlı/nikel), dn (number, view'dan pre-fill), schedule_tipi (text), schedule_deger (text), schedule_kod (text), dis_cap_mm (pre-fill view'dan, readonly öneririm), et_mm (pre-fill, readonly), agirlik_kg_m (otomatik hesap, üzerine yazılabilir)
  - **Opsiyonel:** kaynak (default "super_admin_ozel"), notlar
  - **Pre-fill:** view'dan gelen dış çap, et, kalite (kalite_match parametresi için)
- **Ağırlık otomatik hesap (JS):**
  ```js
  const YOGUNLUK = { karbon: 7850, paslanmaz: 7950, duplex: 7800, cuni: 8900, aluminyum: 2700, alasimli: 7900, nikel: 8900 };
  const agirlik = Math.PI * (dis_cap - et) * et * YOGUNLUK[malzeme_grubu] * 0.001;
  ```
- Submit → `sb.rpc('ozel_parca_boru_kaydet', { ... })` çağrısı
- Sonuç toast: "✓ X spool kütüphaneye bağlandı" + liste yenile

### Adım 4 (opsiyonel) — DIN 17175 seed migration (30 dk)
Eğer Cihat onaylarsa: 139.7×4.5 St 37 (30 spool) için doğru çözüm DIN 17175 tablo seed migration'ı yazmak. Migration sonunda UPDATE mantığı (88.A'daki gibi) ile 30 spool otomatik bağlanır.

---

## 88'den Devralınan Kararlar (DEĞİŞMEZ)

| # | Karar |
|---|---|
| **KARAR-88.1** | Tanımsız = `boru_olculer_id IS NULL` gerçek-zamanlı view. Counter/Kaydet akışı geri gelmez. |
| **KARAR-88.2** | Özel parça `sistem_preset=true, tenant_id=NULL` paylaşımlı. (RPC zaten bu şekilde çalışıyor.) |
| **KARAR-88.3** | AI standart önerisi (A-AI) hâlâ ertelendi. Tetik koşulu olmadan 89'da da konuşulmaz. |

---

## 88'den Devralınan Kritik Hatırlatmalar

- **MK-88.D:** Referans admin sayfasını görmeden HTML yazma.
- **MK-88.C:** SECURITY DEFINER + auth.uid() RPC'leri SQL Editor'da test edilemez. Manuel SQL + ROLLBACK.
- **MK-88.B:** CHECK constraint = schema sinyali. Bypass etme, vizyonu constraint'le buluştur.
- **MK-52.x:** `~/Downloads/_arsiv/` disiplin, MD5 doğrulama, terminal git akışı (web UI upload yok).

---

## Bonus İşler (89'da zaman kalırsa)

- `tanimsiz_kayitlar` tablosunun audit log rolüne düşürülmesi (kullanıcı INSERT yok artık) — şema sadeleştirme
- `tanimsiz_kayit_onerisi` ve `tanimsiz_hash_anahtari` eski RPC'lerinin DROP'u (90+'a not düşüldü, çağrı yoksa)
- Vizyon belgesi `docs/88-VIZYON-TANIMSIZLAR.md` → "88 kapanış notu" eklenmesi (KARAR-88.2 ve 88.C refactor durumu)
- `agirlik_kg_m` sapma kontrolü (mevcut 358 satır formülle uyumlu mu — α migration ön hazırlığı)

---

## Başarı Kriteri (89 Sonu)

- [ ] `kutuphane-oneriler.html` AresPipe pattern'inde, sol sidebar görünür, konsol temiz
- [ ] RPC çağrısı çalışır, 2 satır görünür, stat-pill'ler doğru
- [ ] Detay paneli açılıyor, form çalışıyor, ağırlık otomatik hesaplanıyor
- [ ] Submit → 30 spool tek tıkla bağlanıyor, toast onayı geliyor
- [ ] CI yeşil

---

> 89'a başlamadan: git pull, son-durum.md ve CLAUDE-SON-OTURUM.md okumayı atlamayın.
