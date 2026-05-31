# Oturum 138 — Malzeme hazırlık: eksik→Uyarılar VEYA mobil React (+ KARAR-137 mühür)

## Açılış ritüeli
Git pull/status/log → CI rengi (137 son kod commit'i = export gerçek veri, dfc6128 civarı) →
şu dosyalar: `son-durum.md` (137), `CLAUDE-SON-OTURUM.md` (137), bu dosya → KARARLAR **MK-137.1/.2/.3**
(henüz mühürlenmediyse önce onları KARARLAR.md'ye işle) → gündem teyidi.
**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12. 138'de de yeni endpoint YOK hedefi.

## 137 nerede bıraktı
- Malzeme hazırlık WEB tarafı uçtan uca çalışıyor: yıldız DB kuyruk, spool_malzemeleri kaynağı, modal +
  toplu çekim export gerçek veri. Migration 095 + 096 uygulandı (DB + repo).
- GAP 1 (wizard Adım 1 klasör ağacı) tamam.
- Mobil 2-sekme mockup hazır (indirilenlerde / opsiyonel `docs/mockups/`'a commit edilebilir).
- **Deploy görsel teyidi 137 sonunda yapılıyordu** — export PDF/Excel gerçek kalemleri basıyor mu, ilk iş doğrula.

## Yapılacaklar (öncelik)

### 1. Deploy görsel teyit (kısa)
- Yıldızlı devre(ler) → "Malzeme Listesi" → PDF + Excel: "henüz oluşturulmadı" değil, gerçek kalem/eksik geliyor mu.
- Yıldız çok-cihaz: bir tarayıcıda yıldızla, başka cihazda kırmızı görünüyor mu.

### 2. (A) Eksik → Uyarılar entegrasyonu — ORTA, dosyasız
- Personel/yönetici bir kalemi "eksik/depoda yok" işaretleyince Uyarılar sayfasına düşsün.
- Şu an UI'da "eksik" işareti var (modal + mockup), akış YOK. Uyarılar sayfası/şeması incelenecek (körlemesine yazma).
- Karar gerekebilir: eksik nerede saklanır (spool_malzemeleri'ne flag mi, uyarı kaydı mı). Önce mevcut Uyarılar yapısını oku.

### 3. (B) Mobil malzeme hazırlık React inşası — BÜYÜK
- mockup'a göre 2 sekme (Devreler + Toplu Çekim). `mobile/` (React/Vite PWA) altına.
- Veri: `devreler.malzeme_kuyrukta` + `spool_malzemeleri` (adet/teslim_adet), spool→devre zinciri.
- Teslim girişi −/+ sayaç (kısmi). Mobil neredeyse boş (%2) → ilk gerçek modül, dikkatli.

> Öneri: 138'de **A (eksik→Uyarılar)** ile başla — küçük, dosyasız, web sistemini tamamlar. Sonra B (mobil React) büyük blok olarak ayrı.

### 4. Diğer borçlar (öncelik dışı)
- GAP 2 (düzelt-yazma + çapa) — test dosyasına bağlı, gelince açılır.
- 129/130 terfi-sonrası imalat-izo görünmeme · 117 yukleyen_id · pipeline doğrulama (4.4-1) · fitting (DIN 86087/ASME B16.9).
- Toplu çekim export "yeşil hariç" davranışı: şu an state=3 devreler PDF'den çıkarılıyor (eksik odaklı) — istenirse "tam liste" modu eklenebilir.

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-137.1/.2/.3: yıldız=DB kuyruk · kaynak spool_malzemeleri (pipeline terk) · web modal dirty-only (mobil kısmiyi ezme).
- MK-101.1: arespipe_kopyala + MD5 + git status mandatory (137'de 2 kez sessiz kayıp yakalandı).
- MK-134.1: kod commit'i + [skip ci] doc aynı push'ta doc-HEAD'de gönderilmez.

## Hatırlatmalar
- sed HTML/JS'de yok → atomik str_replace/Python.
- Çok satırlı terminal yapıştırmada `#` yorum + parantez = zsh parse error → yorumsuz, çıplak komut ver.
- Doc [skip ci]; kod CI tetikler.
- Test verisi: P26-184 / 7702313c-1bd1-4eef-80b5-e6a951697774 (35 malzeme kalemi, 8 spool) — malzeme modal/export testi için.

---
> 138'in ilk somut adımı: deploy görsel teyit (#1) → eksik→Uyarılar (#2, A) ya da mobil React (#3, B).
> Web malzeme sistemi tamam; kalan iki ucu (eksik akışı + mobil) bağlayınca uçtan uca biter.
