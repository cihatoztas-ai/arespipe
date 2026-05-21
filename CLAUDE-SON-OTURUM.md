# CLAUDE-SON-OTURUM — Oturum 106 (21 May 2026)

## Özet
İki iş + bir tasarım. (1) L2 parser'ın Tersan İmalat'ta zaten çalıştığı kanıtlandı (105'teki
"eksik veri" cache'ti). (2) NOT yakalama + KISMI alıştırma ipucu eklendi, test edildi, canlıya
alındı. (3) Wizard'ın gerçek 103 durumu netleşti + yeniden tasarım omurgası yazıldı.

## 1. L2 parser kanıtlama (kod değişmeden)
- 3 PDF (M100-317-01-P2 S01/S02/S03) pdf-parse ile çıkarıldı (production yolu) → mevcut kural
  ile parse → 30 malzeme satırı tertemiz: flanş DN'leri (300/200/65/125), adet=1, "1" yok, NOT yok.
- Fixture suite 10/10. Sonuç: 088 fix çalışıyor, bozuk Excel = stale cache.
- DELETE gerekmedi (count=0, cache zaten temizdi).

## 2. NOT + alıştırma ipucu (commit 3e0055e)
**lib/l2-parser.js** — spool nesnesi: `not_metni` + `alistirma_ipucu`. İpucu türetme
config-driven blok (parserKural.alistirma_ipucu_kurali okur, motor jenerik kalır).
**kural** — `alanlar.not_metni` regex `NOT:[ \t]*,?[ \t]*([^\s,][^\n]*)` (boş notu reddeder,
newline yutmaz). `alistirma_ipucu_kurali`: kelimeler `["al.{2}t.rma","ayarlanarak"]`, deger KISMI.
**fixtures + runner** — yeni alan beklentileri + 2 kontrol. node test/l2-tersan-test.mjs → 10/10.
**migration 089** — jsonb_set, sadece tersan_cadmatic_spool. Dry-run → COMMIT → DB teyit.

### Regex dersleri (ampirik)
- `\s*` (newline dahil) NOT regex'ini boş notta alt satıra atlattı → `[ \t]*` ile satıra sabitle.
- `[^\n,]` boşluğa izin verince geri-izleyip " ," yakaladı → `[^\s,]` (ilk karakter gerçek içerik).
- Anahtar kelime `al[ıi]şt[ıi]rma` Unicode → SQL Editor bozar → ASCII `al.{2}t.rma` (nokta ı/ş tutar).

## 3. Wizard durumu (recon)
- 97-100: iskelet, bucket, klasör ağacı. **103-A: BOM Excel oto-parse** (excel-generic worker).
- **103-B eksik:** izometri PDF `'sakla'` (arşiv), parse yok = MK-49.B.
- 4 adım: Devre Seç → Dosya Yükle → Onay → Yükleme. Step 1 mevcut devre seçer.

## 4. Wizard yeniden tasarım (docs/MK-WIZARD-DEVRE-YUKLEME.md)
Cihat endişesi: sessiz eksik/fazla spool (25→23). İlke: **otorite kabuktur, PDF değil.**
- 3 kaynak: K1 IFS / K2 şablon (boş şablon indir) / K3 PDF (damgalı)
- Spool no formatı tersane bazında bir kez, wizard'da önizlenir
- Eşleştirme = resim_no + spool_no (içerikten bağımsız → image-PDF'te de çalışır)
- İlişki N:N (spool_dokumanlari): bir resim→çok spool (PAOR), bir spool→çok resim (detay+montaj)
- Mutabakat ekranı zorunlu (eşleşen/eksik/fazla/şüpheli), sessiz tamamlama yok

### Doğrulanmış örnekler
- Tersan: NB1110-M100-262-302-47-S01 (text, 1 PDF=1 spool, resim no=pipe gövdesi)
- PAOR: NB1110-Z06 52600-102778-A-S01/S02 (image, 1 PDF=2 spool, resim no=çizim no)
- Proje: PDF B1110 ↔ devre NB1110 → N öneki normalize

## Commit'ler
| Hash | Mesaj |
|------|-------|
| 3e0055e | feat(106): L2 parser NOT yakalama + KISMI alistirma ipucu (089 + test 10/10) |

## Mimari kararlar
MK-106.1 (cache şüphesi), MK-106.2 (config-driven NOT + ASCII), MK-WIZARD.1-5 (omurga belgesi).

## Sonraki oturum
İlk hedef: MK-49.B — wizard izometri routing (sakla → kuyruk + worker). Detay: CLAUDE-SONRAKI-OTURUM.md.
