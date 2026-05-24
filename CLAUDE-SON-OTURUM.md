# CLAUDE -- Son Oturum Ozeti (Oturum 117, 24 May 2026)

## Ozet
ANA TEMA: IMALAT NOT -> spooller.imalat_not (temel) + ALISTIRMA cikarimi (bonus). KOD TARAFI
TAM BITTI, deploy edildi. Alistirma cikarimi CANLI KANITLANDI (E120 -> VAR ekranda). imalat_not
yazimi KOD CANLI ama eslesen devrede henuz dogrulanmadi (test devreleri yukleyen_id null sorununa
takildi -> ACIK BORC). Parser mantigi 4 PDF lokal repro ile kanitlandi.

## Adimlar (veriyle)
1. **Bulgu:** Motor zaten not_metni + alistirma_ipucu tasiyordu. Sorun: NOT regex agirligi yutuyor
   + agirliksiz NOT'a tutmuyor; eski alistirma kurali TERS (komple->KISMI); spooller'a yazma yok.
2. **Migration 093:** spooller.imalat_not text (dry-run -> COMMIT).
3. **parser_kural (e1fb879d):** NOT regex duzeltildi + flag 'im' (multiline -- agirliksiz NOT icin
   KRITIK) + eski yanlis alistirma kurali kaldirildi (motor merkezi varsayilani kullanir).
4. **l2-parser.js:** ALISTIRMA_IPUCU_VARSAYILAN merkezi sabit + kademeli motor (override > varsayilan,
   VAR baskin, geriye uyumlu). node ile kanitlandi.
5. **kuyruk-isle-izometri.js:** eslestir() imalat dali -> alistirma (PDF baz) + imalat_not (D2-genis).
6. **spool_detay.html:** imalat NOT amber blok (renderNotlar + QR onizleme), salt-okunur.

## Mimari kararlar
- **MK-117.1 (M1):** Alistirma kelimeleri MERKEZI (l2-parser ALISTIRMA_IPUCU_VARSAYILAN), format
  override edebilir. NOT cekme format-ozel. Sebep: ifade format-bagimsiz, kopya kaymasi onleme.
- **KARAR-117 (PDF baz):** PDF VAR/KISMI uretti -> yaz (mevcut ezilir, PDF otorite). null -> dokunma.
- **KARAR-117.2 (D2-genis):** imalat_not yaz AMA alistirma 'VAR' ise yazma (tekrar onle). KISMI/talimat -> yaz.

## Dersler
1. Sonraki-oturum notu varsayim cikti (motor zaten okuyordu) -- koda bak.
2. Kural VAR ama YANLIS -> sifirdan yazma, neden bos geliyor kazi.
3. Canli test gercek bug yakalar (agirliksiz NOT flag bug'i lokalde gorunmedi).
4. "hicbiri yok" -> kok neden zincir: yukleyen_id null -> parse edilemiyor.
5. alistirma/imalat_not/notlar UC AYRI yer -- mukerrer endisesi yersiz.
6. Unicode-paste: json.dumps(ensure_ascii) + backslash'siz regex.

## Commit'ler
| Hash | Icerik |
|------|--------|
| 44814fc | imalat NOT + alistirma (merkezi motor + PDF baz) |
| 450b74c | D2-genis (alistirma VAR ise imalat_not yazma) |
| (093) | migration arsiv (kapanista) |

CI: kod commit'leri [skip ci] YOK. Vercel deploy basarili.

## Sonraki oturum
Detay CLAUDE-SONRAKI-OTURUM.md. **ONCELIK 1: imalat_not CANLI DOGRULAMA** (eslesen devre +
yukleyen_id dolu + NOT'lu PDF -> imalat_not dolmali, VAR'da bos kalmali D2). **ONCELIK 2:
yukleyen_id null parse borcu** (kuyruk-isle-izometri.js:305). **STRATEJIK: desen-disi yonetimi /
format ogrenme** (Cihat tespiti -- desen-disini yuzeye cikar, eksik-alan raporu ilk adim).
