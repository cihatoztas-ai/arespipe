# Sonraki Oturum (204) — Gündem

> Açılış ritüeli: `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3` + handoff doc'ları oku (`son-durum.md`, bu dosya).

---

## Öncelik 1 — BUG: sevkiyat'ta `aktif_basamak='kk'` sızması
`aktif_basamak='kk'` olan spool'lar sevkiyat görünümünde yanlış görünüyor.
- DATA önce (MK-158.1): hangi sorgu sevkiyat listesini çekiyor, `aktif_basamak` filtresi ne?
- Devre-scoped SQL ile teyit (MK-163.1), düzeltme tek noktada.

## Öncelik 2 — KK çapraz-linkler
`spool_detay` / `devre_detay` → KK davet/sonuç durumuna link (spool hangi davette, sonucu ne).
- İki katman model (MK-199.3): `spooller.aktif_basamak` + `kk_davet_spooller.sonuc` ({gecti, hatali, tamir, bekliyor}).

## Öncelik 3 — Boru Takip Formu rötuşları
- **Weld-O-let ET/PN boş** kararı (Cihat): outlet'te basınç sınıfı yok — boş mu kalsın, değer mi?
- Canlı test: 306 TANK SOUNDING formu tekrar üret → bilezik/sounding/butt-weld çıkmış, Weld-O-let kalmış, PDF çok sayfa başlık tekrarı (Chrome print preview) doğrula.
- Çok satırlı (40+) devrede PDF 2. sayfa başlık tekrarı görsel teyit.

## Öncelik 4 — KK i18n
`tvv()` çağrıları şu an TR fallback. `kk_*` anahtarlarını `lang/{tr,en,ar}.json`'a ekle (form kolon başlıkları dahil).

## Açık tasarım kararları (KK)
- PDF kalıcılık modeli: on-demand vs snapshot JSON (`kk_davetler`) vs Storage upload.
- Belgeler popup gerçek Storage binding son durum.

---

## Hatırlatmalar
- **kk-tasarim.md:** Boru Takip Formu bölümü eklenecek (bu oturumda hazırlandı, orijinal doküman kayıpsız merge için gerekti).
- Endpoint tavanı 12/12 (MK-129.3) — yeni serverless ekleme.
- Boru Takip Formu tüm üretim **client-side** ($0, JSZip + window.print), zero AI / zero server call.
- `vendor/jszip.min.js` + `templates/boru-takip-formu.xlsx` repoda olmalı (form çalışması için).
