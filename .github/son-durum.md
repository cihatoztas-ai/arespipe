# AresPipe — Son Durum (Oturum 120 kapanis, 25 May 2026)

> 119 (Asama 1 katman birlestirici) -> 120 (registry ILK GENISLEME: ikinci aile baglandi).
> Montaj ailesi canli, CI yesil.

## Bu oturum ne tipti
KOD oturumu. Format-tanitma kilavuzunun (A isi) gercek-veri icraati: 84c12f61 baglama PLANI
veriyle yeniden yonlendi -> dogru aile 39a2c81b (montaj) baglandi, 84c12f61 emekliye ayrildi,
NB1137 pipeline_no kirilmasi (acik borc) kapatildi.

## Genel durum
- Git: temiz. HEAD = 3c142f9 (feat 120). CI: ✅ YESIL (token-suz mesaj, [skip ci] yok, MK-119.5).
- Mimari: cok-kiraci, RLS. Izometri L2 registry'de artik IKI aile: spool (A1) + montaj.
- izometri-oku.js / l2-parser.js / katman-birlestirici.js DEGISMEDI (MK-119.1 kaniti).

## Bu oturumun urunu
- lib/format-paketleri.js: yeni MONTAJ_TERSAN paketi (Katman 1, montaj_modu, malzeme tablosuz).
  AILE_KAYIT'a `tersan_cadmatic_montaj` satiri. TUM_PAKETLER guncellendi. A1/spool'a DOKUNULMADI.
- + 120 FIX (NB1137 pipeline_no kirilmasi): pipe_no regex'i hayalet `[[PIPE:]]` markerindan
  gercek SPOOL NAME satirina cevrildi ([A-Z]{1,3}\d{2,3} onek, Bolum 5.1). Marker'i ureten kod
  hic yoktu -> pipe_no HEP null -> -ALS alistirma (PARCA) sinyali oluydu; artik canli.
- test/asama1-pilot.mjs: T6 montaj assertion'i (artik BAGLI) + T7 montaj drift guard.
  Composability testleri SPOOL ailesine baglandi (cok-aile sizintisi engellendi).
- DB: 84c12f61 (tersan_cadmatic_isometry) aktif=false (emekli).

## Kanit (gercek veri, canli cikarim = pdf-parse v1.1.1, MK-119.4)
7 Tersan montaj/izometri PDF (6 gemi). Temiz metinli 5/5'te pipe_no DOLDU (onceden hep null):
M100/AT110-804/AT110-816/G400/G600. M100'de -ALS -> alistirma=PARCA (sinyal canlandi).
Spool regresyon: 8/8 spool PDF BYTE-BYTE ayni (A1'e dokunulmadi). Pilot 30/30 yesil.
NB1137'nin 2 montaji L2-fail: Cadmatic glyph -29 kaymasi (format degil) -> L3 (MK-120.3).

## Acik borclar
- **NB1137 Cadmatic glyph (-29 kayma) — YENI TESPIT, ONARILABILIR:** NB1137 export'lari (spool+izometri)
  gomulu fontta her ASCII karakteri -29 kaydiriyor (deterministik Sezar). Cozulunce metin temiz
  (E100-817-005, B1137, SPOOL NAME hepsi dogru). Su an L3 (dogru, guvenli). Onarim L2'yi acar,
  sifir-AI. Glyph TESPITI de bozuk: Latin-oran kontrolu yanlis-negatif verdi (kaymali metin yuksek
  Latin orani). Dogru dedektor: capa token ham VEYA -29-kaymali metinde mi. Kendi oturumunu hak ediyor.
- **Montaj tanima bosulugu (Asama 2):** 39a2c81b DB fingerprint'i baslik_regex:"Continue:". Ama 2/7
  montaj (G600-813, E100-817) "Continue:" tasimiyor -> bu PDF'ler 39a2c81b olarak TANINMAYABILIR
  (parse'lari dogru ama route edilmezler). Parse != tanima; Asama 2 (paket skoru) cozer.
- **117 — yukleyen_id null (HALA ACIK):** api/izometri-oku.js kullanici_id zorunlu; sistem/kullanicisiz
  yuklemeler parse edilemiyor. Wizard yuklemeleri etkilenmez.
- **39a2c81b DB parser_kural'i hala eski [[PIPE:]] iceriyor (ZARARSIZ):** MK-119.2 geregi format
  artik registry-bagli -> parse kaynagi KOD paketi, DB satiri yalniz tanima(fingerprint). DB kuralini
  elle duzeltmek parse'i etkilemez. Asama 3'te paketler DB'ye tasininca temizlenir.

## Kaydedilen MK kararlari (120)
- MK-120.1 — Baglanacak satiri VERIYLE teyit et, isimle degil. 84c12f61 adi "Montaj Resmi" ama
  fingerprint'i SPOOL imzasi ister (Malzeme Listesi+Cut&Bending; montaj PDFinde ikisi de YOK) ve
  parser_kural'i spool kopyasi = olu satir. Gercek montaj parser'i 39a2c81b idi. 84c12f61 emekli.
- MK-120.2 — Marker-bekleyen alan = sessiz null riski. 39a2c81b pipe_no [[PIPE:]] markerini ariyordu,
  markeri ureten kod yoktu -> pipe_no hep null, -ALS alistirma sinyali oldu. Cozum: gercek metin regex'i.
  Ureten-kod-yok bir marker'a guvenme; cikarimi gercek metinden test et (MK-51.2).
- MK-120.3 — Glyph != format VE Latin-oran glyph dedektoru DEGIL. Cadmatic glyph = deterministik -29
  Sezar kaymasi (onarilabilir). Latin-oran yanlis-negatif verir (kaymali metin yuksek Latin orani,
  harfler yanlis). Dogru dedektor: beklenen capa token'lar ham VEYA -29-kaymali metinde geciyor mu.
  (MK-119.3'u keskinlestirir.)
- MK-120.4 — TUM_PAKETLER cok-aile envanteri. Tek-aile composability/birlestirme icin AILE_KAYIT
  [format_kodu] kullan, tum havuzu paketSec'e verme (montaj Katman 1 -> aileler karisir). Uretimde
  aileBirlestir zaten boyle yapar; sizinti yalniz testteydi, T1/T3 yakaladi.
- MK-120.5 — egitim_kaynagi CHECK-kisitli enum (vision_only vb.), serbest not alani DEGIL. Notlar
  dokuman/MK'ye yazilir. (MK-101.5 tekrari: yazmadan once constraint'i kontrol et.)

## Siradaki (CLAUDE-SONRAKI-OTURUM.md'de detay)
Glyph onarimi (-29, NB1137'yi L2'ye kazandirir + dedektor duzeltir) VEYA Asama 2 (eslestirme skoru
+ tanima bosulugu). Glyph kaldiraci yuksek (bir geminin tum export'lari + sessiz yanlis-yonlendirme).
