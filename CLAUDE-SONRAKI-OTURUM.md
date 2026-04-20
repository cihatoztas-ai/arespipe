# AresPipe — 13. Oturum Gündemi

> 12. oturumda biriken işler ve sonraki oturum öncelikleri.
> Başlangıçta bu dosyayı + CLAUDE.md + CLAUDE-SON-OTURUM.md birlikte oku.

---

## Oturum Başı Ritüeli

1. **CLAUDE.md** oku — mimari, kurallar, DB şeması
2. **CLAUDE-SON-OTURUM.md** oku — 12. oturum ne yapıldı, deploy durumu
3. Bu dosya (**CLAUDE-SONRAKI-OTURUM.md**) — ne yapılacak
4. **Kullanıcıya sor:**
   - "12. oturum dosyalarını deploy ettin mi? (devre_detay + devreler + spool_detay)"
   - "Test borçlarından hangilerini yapabildik?"
   - "Geri bildirim listesindeki acil buglardan başlayalım mı, yoksa mobil mi?"

---

## 🔴 ÖNCELİK 0 — DEPLOY + TEST BORCU

### Deploy edilecek dosyalar (12. oturumda hazırlandı)

```bash
git add devre_detay.html devreler.html spool_detay.html
git commit -m "12. oturum: gemi→projeNo rename + notlar persistence + basamak multilang + pattern temizlik"
git push origin main
```

### Test senaryoları

**Küme B — 3-Buton Dedup (devre_yeni.html):**
- [ ] Aynı Excel'i iki kez yükle → 3 buton popup çıkıyor mu?
- [ ] "Çakışanları atla" → sadece yeniler INSERT
- [ ] "Zorla ekle" → duplicate oluşuyor (regresyon)
- [ ] AR/EN dil → buton metinleri çevrilmiş mi?

**Küme C.1 — _projeNo (spool_detay.html):**
- [ ] Spool başlığı `NB1124-K110-721-414C-S01` formatında mı?
- [ ] `localStorage.getItem('ares_aktif_spool')` → `_projeNo` var, `_gemi` yok

**Küme C.2 — Migration (devreler.html deploy sonrası):**
- [ ] devreler.html'den bir devreye tıkla → devre_detay açılıyor mu?
- [ ] localStorage'da `projeNo` var, `gemi` yok mu?

**Küme C.4 — AR tracker (spool_detay.html deploy sonrası):**
- [ ] AR dilinde spool_detay → tracker "ما قبل التصنيع" / "التصنيع" vb. görünmeli

**Küme D — _lk Duplicate (devre_detay.html):**

Önkoşul: Aynı devrede `pipeline1+S01` + `pipeline2+S01` oluştur.
- [ ] Inline edit → sadece o spool güncellenir
- [ ] Sil → sadece bir tanesi silinir
- [ ] Toplu seçim → iki spool ayrı checkbox

**YENİ — notlar persistence:**
- [ ] devre_detay → not ekle → F5 → not hâlâ görünüyor mu?
- [ ] Not sil → Supabase'de `silindi=true` mu?

---

## 🔴 ACİL BUGLAR — Geri Bildirim Listesinden

### A1 — Kesim listesine geçişte hata
**Durum:** `kesim.html` incelendi, bariz crash noktası yok. Tam hata mesajı olmadan teşhis yapılamadı.
**Aksiyon:** Konsolu açık tut, hatayı tekrar üret, mesajı kopyala. Olası: Supabase RLS, `parseFloat('—')` NaN birikimi, veya `sayfaYetkiKontrol` yönlendirme.

**Bilinen potansiyel bug (hata mesajı gelmese bile fix edilebilir):**
```js
// kesim.html satır 944 — kesimOlcusu '—' ise NaN üretir
var mm = klB.reduce((s,k) => s + parseFloat(k.kesimOlcusu), 0);
// Fix:
var mm = klB.reduce((s,k) => s + (parseFloat(k.kesimOlcusu) || 0), 0);
```

### A2 — Geri bildirim fotoğrafları süper admin'e gitmiyor
**Aksiyon:** `geri_bildirim.html` veya ilgili dosyayı at, Storage/email entegrasyonuna bak.

### A3 — islem_log Supabase GET hatası
```
GET /rest/v1/islem_log?select=katman,islem,olusturma... 
```
**Aksiyon:** Hangi sayfada? Tam hata mesajı? Kolon adı değişmiş olabilir (CLAUDE.md 4.2'de canonical kolonlar var: `islem`, `katman`, `katman_id`).

### A4 — izometri-batch.html POST hatası
```
[ARES] Supabase bağlantısı kuruldu
izometri-batch.html:359 POST https://arespipe... 
```
**Aksiyon:** `izometri-batch.html` dosyasını at, 359. satıra bak.

### A5 — Proje ilerleme sistemi çalışmıyor
**Aksiyon:** Hangi sayfa? `proje_detay.html` mi? Dosyayı at.

### A6 — Her sayfada üst bilgilendirme kutularında farklı yazı boyutu/tipi
**Aksiyon:** Hangi sayfalar etkileniyor? Ekran görüntüsü veya dosyaları at. CSS standardizasyon — `stat-lbl` ve `stat-val` class'ları tüm sayfalarda aynı olmalı (CLAUDE.md 2.3).

---

## Orta Öncelikli — Geri Bildirim Listesi

Acil buglar çözüldükten sonra bunlara bakılacak:

| Madde | Tip | Not |
|---|---|---|
| Giriş sayfasından yanlış yönlendirmeler | Bug | Hangi yönlendirme? Detay lazım |
| devre detay üst format (tersane/gemi/devre/zone sırası) | Feature | Breadcrumb düzeni — devre_detay.html |
| Sağ üst tarih/saat sayfa yenilemeden değişmiyor | Feature | `setInterval` ile her dakika güncelle |
| Aktif devreler yüklenirken animasyon | UX | Skeleton loader veya fade-in animasyon |
| Logout sayfadan çıkıyor uyarısı | UX | `beforeunload` event bastırılmalı |
| İmalat/argon/gazaltı bekleyen spool sayısı | Feature | Dashboard widget — basamak bazlı sayaç |

---

## ÖNCELİK 8 — Mobil Ekranlar (mockup-first)

Acil buglar temizlenince:

**MProfil.jsx (sıradaki):**
- Avatar yükleme (Supabase Storage, `kullanicilar.foto_url`)
- Kişisel bilgi düzenleme (`ad_soyad`, `tel`, `brans`)
- R-10: önce mockup artifact → kullanıcı onayı → kod

**Sonraki:** MIsBaslat.jsx, MDevreler.jsx, MDevreDetay.jsx, MSpoolDetay.jsx, MQRTara.jsx

---

## Bekleyen Küçük İşler

| İş | Dosya | Süre |
|---|---|---|
| `parseFloat('—')` NaN fix | `kesim.html` satır 944 | 5 dk |
| Excel export başlıkları i18n | `kesim.html` | 30 dk |
| `devreler.malzeme` DB migration | SQL | 15 dk |
| `fotograflar.yapan_id` DROP (legacy) | SQL | 5 dk |

---

## Özet — 13. Oturum Ne Beklenebilir

**Kısa:** 12. oturumda 3 HTML + DB değişiklikleri hazır ama deploy edilmedi. 13. oturum **önce deploy + test borcu**, sonra **acil buglar** (en azından kesim hatası tam mesajıyla). Test temizse mobil (MProfil mockup).

**Risk uyarıları:**
- `devre_detay.html` en kapsamlı değişiklik — deploy sonrası sayfayı tam test et (başlık, breadcrumb, etiket, PDF, notlar)
- `notlar` tablosuna `devre_id` eklendi ama eski notlar (varsa) `devre_id = NULL` kalır — bu beklenen davranış
