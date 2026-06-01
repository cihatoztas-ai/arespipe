# Oturum 139 — B-çap sürprizi (grupla türetme) + (varsa) wizard inceleme kalan uçları

## Açılış ritüeli
Git pull/status/log → CI rengi (138 son kod commit'i = taslak A+B1, `edca4a8` civarı) →
`son-durum.md` (138) + `CLAUDE-SON-OTURUM.md` (138) + bu dosya → KARARLAR **MK-138.1/.2/.3**
(mühürlenmediyse önce işle) → gündem teyidi.
**Function sayımı (MK-129.3):** `ls api/*.js | wc -l` → 12. 139'da da yeni endpoint YOK hedefi.

## 138 nerede bıraktı
- Wizard inceleme montaj/mükerrer/taslak sorunları kapandı, hepsi canlıda doğrulandı (detay: son-durum 138).
- 15 boş test-devresi soft-delete (`bos_kalan=0`).
- BRIEFING 137→güncel; ama oturum-saglik hâlâ BRIEFING tazeliği ölçüyor (3-dosya sistemi terk etmiş).

## 1. İlk iş — B-çap sürprizi (ORTA, ares-kabuk.js)
**Belirti (138'de teşhis edildi, fix edilmedi):** Taslak inceleme modalı (`devre_wizard_v3.html:1063`)
spool `s.cap`/`s.et` okuyor → "—" gösteriyor; ama devre canlıya terfi edince tabloda çap doluyor.
"Nereden geliyor" sürprizi.

**Kök sebep (kanıtlı):** `ares-kabuk.js grupla()` (satır 67-110) spool BAŞLIĞINA `cap`/`et` YAZMIYOR —
döndürdüğü şekil `{pipeline,spoolNo,rev,anaMalzeme,toplamKg,yuzeyHam,bom}` (cap yok). Çap/et türetmesi
(`boyutParse → ARES_OLCU.olcuParse`) yalnız `aktar()`'da (terfi, satır 174-187 `anaBoru→boyutParse →
dis_cap_mm:bp.dis_cap`) ve bom kalemlerinde (satır 207-213) koşuyor. Modal başlık `cap`'i okuyunca undefined.

**Fix yönü:** `grupla()`'nun spool döndürdüğü yere (satır 108-110 `return {pipeline,spoolNo,...}`),
`aktar()`'daki AYNI `anaBoru → boyutParse` türetmesini koy → spool başlığında `cap`/`et` olsun.
- `anaBoru = s.bom/kalemler.filter(tip==='boru').sort(boy_mm desc)[0]` (aktar'daki birebir).
- `boyutParse` zaten `grupla` kapsamında (satır 36-42). Tek kaynak, taslak=terfi.
- `incelemeTablosu`/endpoint zaten kabuk spool'u olduğu gibi geçiriyor → modal `s.cap` dolu görür.
- **Bonus:** modal etiketi "Excel" yerine "Excel → türetildi" yapılabilir (devre_wizard_v3.html:1063 civarı
  satir() çağrısı) — sürpriz tam biter. Opsiyonel, iyi olur.

**Dikkat:** `grupla` SAF/browser-global IIFE; `boyutParse` `ARES_OLCU` yüklü değilse `{dis_cap:null,et:null}`
döndürüyor (satır 41 guard) — zararsız. node --check yok (browser global), ama container'da boyutParse
mantığını ARES_OLCU stub'ıyla test edilebilir.

## 2. Diğer borçlar (öncelik dışı)
- **Problem 1 (bayat-cache montajsız parse):** 138/B dosya-adı tespiti maskeledi; cache invalidation
  ileri iş. Montaj her hâlde doğru görünüyor — acil DEĞİL.
- **Taslak hard-delete + storage yetim temizliği:** soft-delete yeterli; toplu cleanup düşük öncelik
  (yeni endpoint MK-129.3 tavanı — konsolidasyon ya da toplu SQL+Storage API job).
- **oturum-saglik.sh açılış kapısını `son-durum.md`'ye bağla:** BRIEFING 67 oturum terk edilmiş, script
  yanlış dosyayı ölçüyor (138 açılışında BAYAT yanlış-alarm). Kalıcı çözüm (Cihat kararı).
- 117 yukleyen_id · pipeline doğrulama (4.4-1) · montaj prefix · fitting (DIN 86087/ASME B16.9).
- Mobil malzeme hazırlık React inşası + eksik→Uyarılar entegrasyonu (mockup hazır, 137'den).

## KORUMA bantları
- MK-49.1: izometri-oku.js'e DOKUNMA. · MK-129.3: api/*.js = 12, yeni endpoint yok.
- MK-138.1/.2/.3: dosya_adi dedup · montaj deterministik tespit + ayrı bölüm · taslak gizle + iptal soft-delete.
- MK-126.8: yeni modül/endpoint yazmadan önce mevcut kodu+DB oku (138'de işe yaradı — montaj dalı zaten vardı).
- MK-101.1: arespipe_kopyala + MD5 + git status (bu oturum patch'ler in-place Python ile yapıldı, transfer yok).
- MK-99.5: storage.objects SQL DELETE yasak → Storage API.

## Hatırlatmalar
- sed HTML/JS'de yok → atomik str_replace/Python (anchor + assertion korumalı; çok-satırlı anchor'da
  GERÇEK dosyanın birebir formatını kullan — 138'de tek-satır anchor sessiz count==0 verdi).
- Patch'leri container'da gerçek dosya kopyasında node --check + birim testten geçir, sonra ver.
- Çok satırlı terminal yapıştırmada `#` yorum + parantez = zsh parse error → yorumsuz çıplak komut.
- Doc [skip ci]; kod CI tetikler. Kod ve doc ayrı commit (MK-134.1).
- Test verisi: Y100-St.St (NB1137/Watermist, montaj+spool ayrı klasör) · NB1099C 582-Sanitary (51 spool dolu).

---
> 139'un ilk somut adımı: `ares-kabuk.js grupla()` 67-110 oku → spool başlığına anaBoru→boyutParse türetmesi
> ekle → modal "—" yerine türetilmiş çapı göster (taslak=terfi). Sonra opsiyonel modal "Excel→türetildi" etiketi.
