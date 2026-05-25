# CLAUDE-SONRAKI-OTURUM — Oturum 121 gundemi

## Acilis rituali (CLAUDE.md)
1. `cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3`
2. Bugun ne? (Glyph onarimi mi, Asama 2 mi, 117 borcu mu)

## Once oku
- `.github/son-durum.md` — 120 kapanisi, MK-120.1-5, acik borclar.
- `docs/format-tanitma-kilavuzu.md` — Asama 1 TAMAM (Bolum 13), Asama 2 SIRADAKI (Bolum 6).

## Karar verilecek (oturum basinda) — uc aday, hangisi once
- **(A) Glyph onarimi (-29 Sezar) + dogru tespit.** YUKSEK KALDIRAC, taze bulgu.
  NB1137 export'lari (spool+izometri) gomulu fontta -29 kaymali. Cozunce metin temiz (120'de kanit:
  E100-817-005, B1137, SPOOL NAME hepsi dogru). Is: (1) evrensel katmana/on-isleme -29 onarici (capa
  token ham metinde yoksa -29-kaymali dene, varsa onar); (2) glyph TESPITINI Latin-orandan capa-token'a
  cevir (yanlis-negatif kapanir, MK-120.3); (3) bozuk-ornek testi (kontrol.js self-test deseni). Kazanim:
  bir geminin TUM export'lari L3'ten L2'ye (sifir-AI) + sessiz yanlis-yonlendirme hatasi kapanir.
  DIKKAT: kg/Turkce yuzey gibi ASCII-disi karakterler -29 bandi disinda kalabilir; once gercek metinde
  hangi alanlarin temiz cozuldugunu olc (M100 spool degil, NB1137 ornekleriyle).
- **(B) Asama 2 — eslestirme skoru + esik + tanima bosulugu.** fingerprintSkor'u paket duzeyine cikar;
  "bu PDF A1'e %92, montaj'a %X". Somut motivasyon (120'den): 2/7 montaj "Continue:" tasimadigi icin
  39a2c81b fingerprint'iyle TANINMAYABILIR (parse'lari dogru ama route edilmez). Skor+esik+ikincil aday bunu cozer.
- **(C) 117 acik borc — yukleyen_id null.** Kucuk, canli sistemi etkiliyor. Cozum A: sistem id ata;
  Cozum B: kontrolu gevset (veri sahipligi KARAR-48.1).

Oneri sira: **(A) glyph** — taze, yuksek kaldirac, hem L2 kazanir hem TESPIT hatasini kapatir (sessiz
yanlis-yonlendirme ileride yeni formatlari bozar). Sonra (B) tanima, sonra (C).

## Veri ihtiyaci (Cihat getirecek)
- (A) icin: NB1137'nin 1-2 glyph'li PDF'i (spool tercih, izometri de olur). 120'deki tersan.zip'te
  zaten var (E100-817-005.1, AT110-803-2311-P2.1, ve NB1137 spool'lari). Yeni indirmeye gerek yok;
  ayni zip yeterli. Onarim sonrasi temiz-metinli PDF'lerle parite (sifir regresyon).
- (B) icin: ek PDF gerekmez; mevcut 7 montaj + 8 spool yeterli.

## Teknik notlar (120'den tasinan)
- Parite/test HEP pdf-parse v1.1.1 (`pdf-parse/lib/pdf-parse.js`). v2 yaniltir/patlar. (MK-119.4)
- Tek-aile composability icin AILE_KAYIT[format_kodu], TUM_PAKETLER DEGIL (montaj Katman 1 sizar). (MK-120.4)
- DB kolonu serbest sanma; CHECK constraint yazmadan kontrol et. egitim_kaynagi enum'du. (MK-120.5/101.5)
- Glyph -29 onarimi: ASCII printable band (0x21-0x7e) -29 geri kaydir. kg/Turkce gibi ust-band glyph'leri
  bu basit kaymayla tam cozulmeyebilir -> alan alan dogrula, "tam onarildi" diye varsayma.
- 39a2c81b DB parser_kural'i hala eski [[PIPE:]] iceriyor ama ZARARSIZ (registry-bagli, parse kaynagi kod
  paketi, MK-119.2). Asama 3'te paketler DB'ye tasininca temizlenir; simdi dokunma.

## Aciklik
- Asama 1 paketleri kod tarafinda (gecici, MK-119.2 ikiligi). Asama 3'te DB'ye tasininca tek kaynak DB olur.
  Su an 2 aile (spool+montaj) bagli; 3-4 aile birikince DB'ye tasima mantikli.
- 84c12f61 emekli (aktif=false). Tam silme YOK (append-only/gecmis, KARAR-48 ruhu). Gerekce son-durum.md'de.
