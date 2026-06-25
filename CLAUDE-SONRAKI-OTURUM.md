# Sıradaki Oturum (206) — Ajanda: MOBİL TAMAMLAMA

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -3` · `ls api/*.js | wc -l` (≤12) · `gh run list -L 1` (205 push'u yeşil mi) · handoff oku.

## 1. ÖNCE: 205'ten devreden teyitler (5 dk, mobil'e geçmeden)
- [ ] **205 CI yeşil mi** (`4ee08f5` belge storage + migration 111).
- [ ] **Sevkiyat Listesi push durumu:** `md5sum ~/Desktop/arespipe/sevkiyatlar.html` → `622fdde9cac4d5bd0a476d2fc87cfc1f` mü? `git log --oneline -1` liste commit'i var mı? Yoksa kopyala+push.
- [ ] **Sevkiyat Listesi rötuşu:** Cihat "tam istediğim gibi değil" dedi. NE eksik? (kolon seçimi / üst bilgi / düzen / başlık / imza alanı?) Önce Cihat'tan netleştir, sonra dokun.

## 2. ANA İŞ: Mobil tamamlama
⚠ **HAFIZA ÇOK ESKİ — önce envanter (MK-126.8, kör yazma yok):**
```bash
cd ~/Desktop/arespipe
ls -R mobile/src | head -60
cat mobile/src/App.jsx | head -80          # route'lar, hangi ekran var/yok
ls mobile/src/screens 2>/dev/null || ls mobile/src
grep -rn "Route\|element=" mobile/src/App.jsx
```
Bilinen (eski, oturum ~2-3) mobil iskelet: i18n (`i18n.jsx`, `lang/`), `MGiris`, `MAnasayfa`(router), `MAnasayfaYonetici`, `MIslemler`, `MDrawer`, tema (`tema.jsx`). Stack: React (Vite) + Supabase, deploy `arespipe-mob.vercel.app` (root `mobile`, `npm run build`). **Ama bunların güncel hâli envanterle DOĞRULANMALI.**

### Mobil kuralları (CLAUDE-MOBILE.md'den)
- **R-10 Mockup-First:** Yeni ekran/component yazmadan ÖNCE artifact mockup + Cihat onayı.
- **R-09 Tema:** sadece `useTema()`; direct DOM yasak.
- `kullanicilar.ad` YOK → `ad_soyad`. `tenants(ad)` JOIN bazı RLS'de 400 → tenant ad'ı ayrı sorgu.
- Storage bucket aynı: `arespipe-dosyalar`. Upload deseni `CLAUDE-MOBILE.md`'de (fotograflar insert).

### Eski bekleyen mobil ekranlar (öncelik — envanterle güncelle)
1. **MProfil** — avatar yükleme + kişisel bilgi (mockup-first).
2. **MIsBaslat** — operatör iş akışı (eski `is_baslat.html`'den).
3. **MDevreler / MDevreDetay / MSpoolDetay / MQRTara** (mockup-first).
4. Rol etiketi i18n mapping.
5. Supabase Storage avatar upload.
6. Web/mobil dil dosyası senkron scripti.

→ Cihat'a sor: "Mobil tamamlama"dan kastın hangisi? (A) eksik ekranları yazmak (B) mevcut ekranların bug/eksik fix (C) belirli bir akış (örn. QR→spool→iş başlat) uçtan uca (D) başka. Mockup-first ile ilerle.

## 3. Genel borç (eski, fırsat olursa)
- Logo kalıcılığı `tenants.logo_url` + Storage.
- `devre_detay` `SV-/KK-Date.now()` → sayaç deseni (kapsam genişletir, `izometri-oku.js` DOKUNMA MK-49.1).
- Issue 117 (`yukleyen_id` null devre dokümanları).
- Library audit A11, fitting/flange FK + `yaricap_mm` (A8).

## Disiplin
MK-85.3 information_schema önce · MK-126.8 önce oku · MK-98.2/200.5 BEGIN/ROLLBACK (≠apply) · MK-163.1 by-ID SQL · MK-129.3 ≤12 fonksiyon · dosya teslim: present_files → `arespipe_kopyala <md5>` · `node --check` + `grep -c "</html>"` (print sayfasında 2 normal — string-içi) · code commit `[skip ci]` YOK, doc commit `[skip ci]` VAR · canlı test = PUSH şart (kopyala yetmez) · R-10 mockup-first (mobil).
