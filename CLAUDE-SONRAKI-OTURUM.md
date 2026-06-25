# Sıradaki Oturum — Ajanda

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -3` · `ls api/*.js | wc -l` (≤12) · handoff oku.

## 1. Canlı test teyitleri (bu oturumdan devreden)
- [ ] **Sevkiyat:** Hazırla → drawer → spool çıkar/ekle → Sevk Et → kilit; Paketi sil → havuza dönüş; Durum kolonu+filtre.
- [ ] **KK:** oran renkleri; proje araması (NB1124); Açık/Arşiv tarih aralığı; işaretli-satır filtre (geri çıkmamalı); yeni drawer header + üstten kesik yok.
- [ ] Mevcut `SV-143569` eski kayıt — gerekiyorsa `UPDATE sevkiyatlar SET durum='sevk_edildi' WHERE sevk_no='SV-143569';`

## 2. Migration dosyaları (repoda klasör YOK — önce yeri bul)
`find . -name "*.sql" -not -path "*/node_modules/*" | head` → desen/numara gör (hafıza: "migration 110"). Sonra 2 dosya yaz (idempotent, ZATEN canlıda uygulandı, repro amaçlı):

```sql
-- sevkiyat_icerik_teslimtel
ALTER TABLE sevkiyatlar ADD COLUMN IF NOT EXISTS icerik text;
ALTER TABLE sevkiyatlar ADD COLUMN IF NOT EXISTS teslim_tel text;

-- sevkiyat_durum
ALTER TABLE sevkiyatlar ADD COLUMN IF NOT EXISTS durum text NOT NULL DEFAULT 'hazirlaniyor';
ALTER TABLE sevkiyatlar DROP CONSTRAINT IF EXISTS sevkiyatlar_durum_check;
ALTER TABLE sevkiyatlar ADD CONSTRAINT sevkiyatlar_durum_check CHECK (durum IN ('hazirlaniyor','sevk_edildi'));
```
CI'nin (`kontrol.js`) `.sql` tarayıp taramadığını / migration klasörünün exclude'da olup olmadığını netleştir.

## 3. Sevkiyat borç (öncelik sırası)
- **Belge/Foto Storage** (D2=B): drawer'da "Belgeler & Fotoğraflar" placeholder → `sevkiyat_belgeler` tablosu + Storage + RLS (KK `kk_belgeler` desenini aynala). Foto galerisi yeri canlıda netleşecek.
- **Liste/İrsaliye yazdır:** paket drawer "Liste / İrsaliye" → A4 PDF (`window.print()`, KK deseni).
- **Devre oto-arşiv** `sevkiyat_tamam_ts`: kısmi sevk 10/10 olunca 1 gün listede sonra arşiv (Cihat otomatik istedi).

## 4. Genel borç (eski)
- **Logo kalıcılığı:** `tenants.logo_url` + Storage (logo localStorage'da, temizlenince uçuyor — `tenants`'ta logo kolonu yok).
- **devre_detay** eski `SV-Date.now()` / `KK-Date.now()` yazımı → sayaç desenine (A-fix; kapsam genişletir, ayrı ele al; `izometri-oku.js` DOKUNMA MK-49.1).
- **kk-tasarim.md**'ye Boru Takip Formu bölümü (203 borcu — `1782304036614_kk-tasarim-EKLENECEK-BOLUM.md` hazır, merge edilmedi).
- Issue 117: `yukleyen_id` null devre dokümanları.
- Library audit A11, fitting/flange FK backfill + `yaricap_mm` (A8).

## Disiplin
MK-85.3 information_schema önce · MK-98.2 BEGIN/ROLLBACK (ROLLBACK≠apply, MK-200.5) · MK-163.1 by-ID SQL · zsh inline `#` yok · dosya teslim: present_files → arespipe_kopyala <md5> · node --check + grep -c "</html>" · code commit `[skip ci]` YOK, doc commit `[skip ci]` VAR · canlı test = PUSH şart (kopyala yetmez).
