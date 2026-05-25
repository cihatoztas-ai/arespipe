# AresPipe — Son Durum (Oturum 121 kapanis, 25 May 2026)

> 120 (registry ilk genisleme: montaj ailesi) -> 121 (Cadmatic glyph band-A onarimi CANLI).
> NB1137 montaj izometrileri artik L2 (sifir-AI); temiz PDF'lerde sifir regresyon.

## Bu oturum ne tipti
KOD oturumu. SONRAKI-OTURUM onerisi (A) "glyph onarimi" icra edildi. Plan veriyle yonlendi:
glyph IKI BANTLI cikti -> band A (buyuk harf/rakam) bu oturumda tam cozuldu; band B (kucuk
harf/Turkce) olculdu, ayri oturuma birakildi (yarim haritayla "tam onarildi" demedik).

## Genel durum
- Git: (push sonrasi) HEAD = 121 commit. CI: token-suz, [skip ci] yok (MK-119.5).
- Mimari: cok-kiraci, RLS. Izometri L2 registry'de iki aile (spool A1 + montaj) + Katman 0 glyph on-isleme.
- lib/l2-parser.js / lib/katman-birlestirici.js / lib/format-paketleri.js DEGISMEDI.
- izometri-oku.js: 4 MINIMAL dokunus (import + 2 metin-normalize noktasi + 1 meta bayragi). Motor degismedi.

## Bu oturumun urunu
- **lib/glyph-onar.js (YENI, Katman 0 evrensel):** KAPILI -29 Sezar onarici + capa-token tespiti.
  `onar29(text)` (her byte -29, sadece printable ASCII'ye duserse), `capaVar(text)`, `metinNormalle(text)`.
  Kapi: ham'da capa YOK ama -29-onarilmista VARSA onar; aksi halde DOKUNMA. Saf fonksiyon (yan etki/DB/AI yok).
- **api/izometri-oku.js (4 dokunus):**
  - import { metinNormalle }
  - pdfIpucuCikar: cikarilan metni fingerprint skorlama ONCESI normalize -> icerik-tabanli tanima da duzelir
    (kaymali export'ta capalar gizliydi, taninma yalniz dosya_adi_regex'e kaliyordu = sessiz yanlis-yonlendirme).
  - parserKuralIle: parse ONCESI normalize + glyph gorunurluk logu ([glyph-band-a]).
  - _l2_meta.glyph_band_a bayragi (DB log / format envanter metrigi).
- **test/asama1-pilot.mjs:** T8 glyph band-A self-test (17 assertion). 47/47 yesil (onceki 30 + 17).

## Kanit (gercek veri, canli cikarim = pdf-parse v1.1.1, MK-119.4)
15 Tersan PDF (6 gemi). Kapi + parse olcumu:
- **Kazanc (2):** NB1137 montaj/izometri L3 -> L2. E100-817-005.1 -> pipe_no E100-817-005, 6 spool.
  AT110-803-2311-P2.1 -> pipe_no AT110-803-2311-P2, 1 spool.
- **Sifir regresyon (11):** temiz PDF'ler (nb1110/1124/1130/1135/1136) durum='temiz' -> metin DEGISMEDI
  (byte-byte) -> parse birebir ayni.
- **Dürüst L3 (2):** NB1137 spool (E100/AT110 .S01) band-A onarildi ama malzeme tablosu band-B (kucuk
  harf tetikleyici "Boru Dik"/"Dirsek") -> hala L3 (malzeme_satir_az). Yanlis kazanc YOK.
- Deterministik ispat: onar29("pmlli=k^jb")="SPOOL NAME", onar29("bNMMJUNTJMMR")="E100-817-005".

## Kaydedilen MK kararlari (121)
- MK-121.1 — Glyph onarimi KAPILI olmali. Kapisiz -29 TEMIZ metni bozar (olcum: 11/11 temiz PDF L3'e
  dustu). Kapi: ham metinde capa varsa DOKUNMA; yoksa ama -29-onarilmista varsa onar; ikisinde de yoksa
  DOKUNMA (dogal L3). Drift guard testi (T8) bu zorunlulugu kanitlar.
- MK-121.2 — Glyph IKI BANTLI. Band A (buyuk harf/rakam/noktalama): glyph = gercek + 29, aritmetik -29
  TAM cozer. Band B (kucuk harf/Turkce): pdf-parse glyph kodlarini (0x80-0x97) font cmap'iyle Latin-1'e
  (0xC0+) cevirmis -> aritmetik DEGIL, font-kapsamli ters TABLO gerektirir. Band A evrensel, band B
  font-ailesine ozel. SONRAKI'deki "kg/Turkce tam cozulmeyebilir" uyarisi DOGRULANDI -> alan alan olc,
  "tam onarildi" diye VARSAYMA.
- MK-121.3 — Kapi capalari BAND-A kurtarilabilir TUMU-BUYUK token olmali (SPOOL NAME, PART NUMBER,
  WELDING NUMBER, CUT NUMBER). "Drawing symbols" / "Malzeme Listesi" / "Continue:" kucuk harf tasidigi
  icin -29 sonrasi GORUNMEZ -> capa OLAMAZ. Capa secimi olcumle dogrulandi.
- MK-121.4 — Glyph onarimi metin-cikarim sinirinda (Katman 0, aile-bagimsiz) ve fingerprint skorlama
  ONCESI olmali. Yalniz parse'i duzeltmek yetmez; icerik-tabanli tanima (baslik_regex/tablo_baslik_regex)
  da onarilmis metinle calismali -> kaymali ama dosya-adi-uymayan PDF'in sessiz yanlis-yonlendirmesi kapanir.

## Acik borclar
- **NB1137 Cadmatic glyph BAND B (kucuk harf/Turkce) — SIRADAKI, kendi oturumu:** ~28 band-B karakterin
  18'i haritalandi (gosterilen->gercek: ä->l, ë->s, í->t, Ö->g, â->k, vs.), 10 Turkce/sembol artik EKSIK
  (Ñ Å Ü Ç ş ğ ñ ć ° + sigma->'i'). Tam harita malzeme tablosu basligini ("Aciklama Boyut Boy Malzeme
  Agirlik") ve satirlarini acar -> NB1137 spool L2'ye gecer. Font-kapsamli (Cadmatic-Tersan); MK-96 capraz
  dogrulama (2 kaynak) + tam karakter haritasi gerekir. Eksik harita malzeme satirlarini SESSIZCE bozabilir.
- **Montaj tanima bosulugu (Asama 2):** 39a2c81b DB fingerprint'i "Continue:" ister; 2/7 montaj (G600-813,
  E100-817) tasimaz. NOT: band-A onarimi capalari (SPOOL NAME) actigi icin icerik-tanima KISMEN duzeldi,
  ama montaj fingerprint hala "Continue:" (kucuk harf, band B) -> tam cozum Asama 2 (paket skoru + esik).
- **117 — yukleyen_id null (HALA ACIK):** sistem/kullanicisiz yuklemeler parse edilemiyor (api kullanici_id zorunlu).
- **MK-120.6 — L3 politikasi (otomatik/onayli/kapali):** uygulama bekliyor (Bolum 12.1).
- **39a2c81b DB parser_kural'i hala eski [[PIPE:]] iceriyor (ZARARSIZ, MK-119.2):** Asama 3'te DB'ye tasininca temizlenir.

## Siradaki (CLAUDE-SONRAKI-OTURUM.md'de detay)
Onerilen: **Band B lookup tablosu** (NB1137 spool'u da L2'ye kazandirir, glyph isini tamamlar — tam harita
+ MK-96 capraz dogrulama) VEYA **Asama 2** (tanima boslulugu). Sonra 117 / MK-120.6.
