# CLAUDE-SON-OTURUM — Oturum 118 (24 May 2026)

## Tip
Dusunce + veri + kilavuz. Kod yok. [skip ci] doc commit.

## Akis (ne konustuk, ne kanitladik)
1. Cihat: wizard calisiyor ama parser kurallari daha cok ornekle guclendirilmeli; once Tersan, sonra
   diger formatlar; tasarim da onemli.
2. Cihat kritik tespit: kurallari tek formata gore yaziyoruz; bazi kurallar gemiye, bazi ofise/tersaneye,
   bazi evrensel. Katmanli yapi gerekiyor. NB1110'dan cikan kurallar NB1137'de kirildi.
3. Profesyonel desen karsilastirmasi: CSS cascade, K8s label-selector, AWS IDP inheritance, rule-engine.
   Sonuc: faceted/seselici tabanli katmanli model.
4. Cihat'in capraz tespiti: A tersanesi == B tersanesi olabilir (ayni tasarim firmasi); ayni gemide /
   ayni tersanede farkli format olabilir. -> agac degil, cok-boyutlu kompozisyon.
5. VERI ANALIZI (bash, pdftotext -layout):
   - 15 Tersan PDF (6 gemi): pipeline_no oneki M/AT/G/Y/E (eski G-regex kirilmasinin koku); malzeme
     grubu capraz facet (karbon metrik vs paslanmaz inc+Sch; NB1137 ICINDE ikisi de); NOT alani evrensel
     ayrim (alistirma vs yuzey talimati); proje_kodu govdede yok.
   - 4 capraz kaynak: Tersan=Cadmatic, Yonteknik=ayni iskelet (metadata silik!), Sefine=Cadmatic ama
     farkli sablon, Royal=AB makine detayi, PAOR=image. -> Producer metadata guvenilmez; yapisal parmak izi seselici.
   - 4 ekran goruntusu: SEFT (B), Navis/Kongsberg (C), Salt (D) + Sefine-Cadmatic (A2). SEFINE 3 ofisle
     3 format; SEFT tek format. -> TASARIM OFISI = birincil yordayici.
6. Cihat duzeltmeleri: "ayni ofis = ayni format" cok kati (surum degisir) -> MK-118.4 yumusatildi + MK-118.5
   (surum facet). "Hepsini yapma, secici al" -> MK-118.6 (specificity=katman sirasi, salience ertelendi).
7. Yeni format akisi (Cihat modeli): gorsel isaretleme (onayla/a-b-c/kutu ciz), capa-tabanli saklama,
   uc statu, iki-firma dogrulama, image istisnasi -> MK-118.7, 118.8.
8. Eksik alan akisi: sessiz hata yok; bu-PDF mi format mi (varsayilan format); kuyruk otomatik + ozet -> MK-118.9.

## Urun
docs/format-tanitma-kilavuzu.md (372 satir, 15 bolum, MK-118.1..9). 116 vizyon notunun halefi.

## Onemli ders
- pdftotext -layout konteynerde calistirildi; image-PDF (PAOR) 1 karakter -> teyit (MK-50.2).
- Turkce "o" dosya adinda NFD/NFC unicode -> yol eslesmedi; glob ile cozuldu (MK-99 bolgesi).
- Cihat'in capraz tezi kendi verisinde defalarca kanitlandi (Yonteknik==Tersan; Sefine 3 format).
