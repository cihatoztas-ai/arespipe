# Sıradaki Oturum (209) — Ajanda

## 0. Açılış ritüeli
`git pull --rebase` · `git status` · `git log --oneline -3` · `ls api/*.js | wc -l` (≤12) · handoff oku.
**Ek (zorunlu):** `docs/MOBIL-STRATEJI.md` + `CLAUDE-MOBILE.md`.

## 1. Durum
208'de Sıra 3 (MAnasayfa 4 dallı router) canlıya çıktı: yoneticiMi → dashboard, musteriMi → placeholder,
gruplar>0 → MIslemler, else → MUygulamalar anaSayfaModu. `yetki.js`'e `musteriMi` eklendi (rol-temelli).
Marka mobile'a entegre: PWA ikon+manifest, giriş logosu+animasyonu (ÇALIŞIYOR), topbar mark (statik görünüyor).
İş modeli MK-208.1 ile kilitlendi.

## 2. AÇIK DEBT (208'den taşınan)
- **Topbar mark animasyonu — iOS Safari fix:** Giriş ekranı animasyonu çalışıyor ama topbar mark animasyonu
  iOS'ta görünmedi (SMIL beginElement + CSS keyframes denendi). KOD HAZIR: `MMarkLogo.jsx` (ortak component),
  `mobile/public/arespipe-mark-anim-bk.svg`. Web kalıbı: giris.html satır 230 (inline SVG) + 383 (tara() = beginElement).
  Seçenekler: (A) web'in tam yöntemini birebir taşı + iOS'ta neden tutmadığını teşhis (mount timing? Safari cache?
  intersection observer mı gerek?), (B) kabul edilebilir bırak (statik mark görünüyor, kullanıcı sorunu yok).
  NOT: statiğe DÖNÜLMEDİ — web statik kullanmıyor, animasyon hedefi korunuyor.
- **MK-208.1 → MOBIL-STRATEJI.md'ye işle:** Karar KARARLAR.md'de var ama strateji belgesine (§ iş modeli /
  §2 / §7) işlenmedi. 3 katman tablosu + market park notu eklenecek.

## 3. Kod planı (MOBIL-STRATEJI §8 sırası)
- **Sıra 4:** `MIslemler.jsx` — işlem butonları + "Uygulamalar" butonu (spool kullanıcısı için ikincil),
  eski 🔒 boş durum kalkar. (§3)
- **Sıra 5:** `MAnasayfaYonetici.jsx` — Uygulamalar linki + (MK-207.2) atıl kullanıcı sayacı adayı.
  NOT: dashboard'da "durdurulmuş spool var" uyarı bandı ZATEN kurulu → dormancy sayacı bu kalıptan türer.
- **Sıra 6:** `MProfil.jsx` (avatar, foto_url + Storage bucket arespipe-dosyalar) — mockup-first.
- **Sıra 7:** `MMusteri.jsx` (yeni) — mockup-first, customers RLS. Placeholder şu an MAnasayfa içinde
  (MMusteriPlaceholder), gerçek ekranla değişecek. customers↔kullanıcı bağı DB'de YOK — önce o ilişki kurulmalı.
- **Sıra 8 (EN BÜYÜK):** Kayıt/davet akışı (kod+DB). §7 kararları kilitli:
  - Spool: B akışı (signInWithOtp+upsert, web kalıbı). davet_eden YAZILMALI (207 borcu).
  - Uygulama: signUp self-servis → rol='uygulama' + ortak "uygulama" tenant'ı (önce bu tenant'ı oluştur).
  - MK-207.2 offboarding görünürlüğü (son_giris dormancy + dashboard sayaç).
- **Sıra 9:** Spool detay çatalı (IbSpoolDetay'a "Denetim" sekmesi + MSpoolDetay emekli) — §6.

## 4. Açık kararlar (MOBIL-STRATEJI §7 — bekleyen)
- §7-5 Yönetici dashboard içeriği (netleşmedi) — MK-207.2 sayacı buraya.
- §3 Bottom nav QR butonu etiketi ("spool bul" mu?).
- §6 Yönetici "Denetim" dışında işlem aksiyonu yapabilir mi?
- §7-3 Müşteri: customers RLS kapsamı + kullanıcı bağı (DB'de yok, kurulmalı).

## Disiplin
Native React (MK-206.1). R-10 mockup-first · R-08 i18n (root lang üçü birden) · R-09 useTema().
`ad_soyad` · tenant ayrı sorgu · kullanici_bloklar INSERT'te tenant_id · JWT anon key · "M" ön eki · buton min 72px.
≤12 api (MK-129.3) — kayıt endpoint'i gerekirse MK-207.1 (konsolide ya da Pro, kötü tasarıma sapma).
DATA→UI→kod (MK-158.1) · önce mevcut kalıbı oku (MK-126.8). Kod commit [skip ci] YOK · canlı test = PUSH.
Python patch'lerde heredoc yerine `python3 << EOF` + repr() güvenli (208'de heredoc birkaç kez tırnağa takıldı).
