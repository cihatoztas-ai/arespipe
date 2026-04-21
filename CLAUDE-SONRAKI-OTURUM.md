# AresPipe — 14. Oturum Gündemi

> 13. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar, DB şeması
2. **CLAUDE-SON-OTURUM.md** oku — 13. oturum ne yapıldı
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. **Kullanıcıya sor:**
   - "12. oturum dosyalarını (devre_detay + devreler + spool_detay) deploy ettin mi?"
   - "13. oturum dosyalarını deploy ettikten sonra test borçlarını yaptın mı?"
   - "Mobil mi, bug fix mi, yoksa başka öncelik mi?"

---

## 🔴 ÖNCELİK 0 — DEPLOY BORCU

### 12. Oturum (hâlâ deploy edilmedi mi?)

```
devre_detay.html, devreler.html, spool_detay.html
```

Eğer deploy edilmediyse önce bunlar. 13. oturum dosyaları üzerlerine gider.

### 13. Oturum Deploy

Tüm 13. oturum dosyaları kullanıcıya teslim edildi. Deploy sırası önerilmez — hepsi birlikte gitmeli çünkü `ares-layout.js` scrollbar CSS diğer HTML'lerin duplicate CSS'ini varsayar (temizlendi).

---

## 🔴 ACİL BUGLAR — Geri Bildirim Listesinden

### A1 — Kesim listesine geçişte hata
**Durum:** 13. oturumda kısmen fix edildi (`parseFloat('—')` NaN guard'ları eklenmişti önceki oturumda). Ama tam hata mesajı alınamamıştı.
**Aksiyon:** Deploy sonrası test et. Hata tekrar gelirse konsol ekran görüntüsü al.

### A2 — Geri bildirim fotoğrafları süper admin'e gitmiyor
**Aksiyon:** `geri_bildirim.html` dosyasını at, Storage/email entegrasyonuna bak.

### A3 — islem_log Supabase GET hatası
**Aksiyon:** Hangi sayfada olduğu belirlenmeli. `islem_log` kolon adları: `islem`, `katman`, `katman_id` (CLAUDE.md 4.2).

### A4 — izometri-batch.html POST hatası
**Aksiyon:** `izometri-batch.html` dosyasını at, 359. satır civarına bak.

### A5 — Proje ilerleme sistemi çalışmıyor
**Aksiyon:** Hangi sayfa? `proje_detay.html` büyük ihtimalle. Dosyayı at.

---

## Orta Öncelikli

| Madde | Tip | Not |
|---|---|---|
| Giriş sayfasından yanlış yönlendirmeler | Bug | Detay lazım |
| devre detay üst format | Feature | breadcrumb sırası |
| Sağ üst tarih/saat güncellenmesi | Feature | `setInterval` 1dk |
| Aktif devreler yüklenirken animasyon | UX | Skeleton loader |
| İmalat/argon/gazaltı bekleyen sayısı | Feature | Dashboard widget |

---

## Test Borçları

**12. oturum test borçları (hâlâ bekliyor):**
- [ ] Küme B — devre_yeni.html 3-buton dedup
- [ ] Küme C.2 — migration (devreler.html deploy sonrası)
- [ ] Küme C.4 — AR tracker (spool_detay deploy sonrası)
- [ ] notlar persistence: not ekle → F5 → hâlâ var mı?

**13. oturum test (deploy sonrası):**
- [ ] büküm.html fason sekmesi görünmüyor mu?
- [ ] bükülenler sekmesi açılıyor mu? Tersane filtresi çalışıyor mu?
- [ ] Tüm sayfalarda tersane badge renkleri tutarlı mı?
- [ ] markalama.html animasyon tek kez mi oynar?
- [ ] kesim/büküm.html bükülecekler listesi doluyor mu?

---

## ÖNCELİK 8 — Mobil Ekranlar

Acil buglar temizlenince:
- **MProfil.jsx** — avatar yükleme, kişisel bilgi düzenleme
- Sonraki: MIsBaslat, MDevreler, MDevreDetay, MSpoolDetay, MQRTara

---

## Bekleyen Küçük İşler

| İş | Dosya | Süre |
|---|---|---|
| `devreler.malzeme` DB migration | SQL | 15 dk |
| `fotograflar.yapan_id` DROP (legacy) | SQL | 5 dk |
| Excel export başlıkları i18n | `kesim.html` | 30 dk |
| `proje_liste.html`, `proje_detay.html` — kisa_ad | Bu dosyalarda tersane varsa | 15 dk |
