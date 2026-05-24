# CLAUDE-SONRAKI-OTURUM — Oturum 119 gundemi

## Acilis rituali
git status -> CI rengi -> son-durum.md -> gundem teyidi -> acik geri bildirim sayisi. Kapsam ekleme yok.

## Once oku
docs/format-tanitma-kilavuzu.md (118 urunu). Ozellikle Bolum 4 (katmanlar), 6 (eslestirme), 9-10 (akislar), 15 (MK).

## ONCELIK 1 — Asama 1: Katman birlestirici (kod, pilot)
Kilavuz Bolum 13 / Asama 1. `lib/l2-parser.js` onune evrensel<-aile<-malzeme<-gemi birlestirici.
- Mevcut `parse(text, parser_kural)` imzasi KORUNUR (MK-118.3).
- PILOT alan: boyut/cap (karbon metrik ODxWT vs paslanmaz inc+Sch).
- Kanit: NB1110 (metrik) + NB1137 (ikisi de) ayni kodla calissin. MK-51.2: 5+ gercek ornek.
- Mevcut Tersan satiri `e1fb879d`'ye DOKUNMA; pipeline_no G-regex'i `[A-Z]{1,3}\d{2,3}` diye aile katmaninda genislet.
- Dry-run zorunlu (MK-98.2 BEGIN...ROLLBACK) eger sema/veri migration olursa.

## ONCELIK 2 (117 acik borc — hala acik) — yukleyen_id null
`api/kuyruk-isle-izometri.js:305` yukleyen_id null -> "yukleyen_id bos" ile kapatir (izometri-oku
kullanici_id zorunlu, satir 334). Once `grep` ile izometri-oku.js kullanici_id'yi NE ICIN istiyor (audit mi RLS mi)
bak (MK-49.1: fingerprint skorlama tarafina dokunma). Cozum A: null dosyalara sistem id ata. Cozum B:
sistem yuklemelerinde kontrolu gevset. Veri sahipligi (KARAR-48.1) gozet.

## STRATEJIK (sonraki asamalar, kilavuz Bolum 13)
- Asama 2: eslestirme skoru + esik (fingerprintSkor paket duzeyine).
- Asama 3: facet kapsama raporu UI (super admin) + yeni tasarim tabani provasi.
- Asama 4: gorsel isaretleme arayuzu (Bolum 9 akisi — capa-tabanli, uc statu).
- Asama 5: eksik alan / kuyruk otomatik yeniden degerlendirme (Bolum 10).

## Veri ihtiyaci (Cihat getirecek)
- Her aile (A2/B/C/D) icin gercek metinli PDF'ler (ekran goruntusu degil) -> alan capalari haritasi.
- Ayni ofisin iki surumune ait ornek (MK-118.5 dogrulama).
- "Cok buyuk / yaninda olmayan" formatlar.

## Karar verilecek
- Asama 1'e mi (kod, kok mimari) yoksa 117 acik borca mi (yukleyen_id) once girilecek?
  Oneri: 117 borcu kucuk ve canli sistemi etkiliyor -> once onu kapat, sonra Asama 1.
