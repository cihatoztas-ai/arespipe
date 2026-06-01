# Oturum 138 — Wizard inceleme: montaj ayrımı + mükerrer-kayıt dedup + taslak hijyeni

Oturum, Cihat'ın farklı gemilerden gerçek devreler yükleyip wizard inceleme ekranında çıkan sorunları
tek tek kapatmasıyla geçti ("problemleri çöze çöze gidelim"). Üç kök sorun bulundu ve kapatıldı; hepsi
ölçümle (DB sorgusu + container birim testi) doğrulandı, körlemesine fix yok (§11.1 / MK-126.8).

## Akış — neden bu sıra
Açılışta BRIEFING 70 döneminde bayat çıktı (oturum-saglik BAYAT verdi); 137 kapanışı için yeniden yazıldı
(3-dosya sistemi BRIEFING'i 67 oturum güncellememiş — script `son-durum.md`'ye bağlanmalı, 139+ borç).
Sonra gerçek Y100/NB1137 + NB1099C devreleriyle wizard sürüldü.

## Yapılanlar

### 1. Montaj "Fazla" sorunu — üç turda kök sebep (teşhis revizyonu)
- **İlk hipotez (doküman §11.1-A):** `montajDosyaKok` `Y100-817-NNN.1.pdf`'i tutmuyor. **ÇÜRÜDÜ** —
  `node -e` ile kanıtlandı: `montajDosyaKok('Y100-817-007.1.pdf')='Y100-817-007'`, `dosyaAdiParse=null`.
  Regex sağlam.
- **Gerçek kök:** Aynı montaj PDF'i bir devrede `montaj{}` üretmiş, **başka yüklemede `cache_hit` ile
  montajsız** gelmiş (`parse_sonuc._cache_meta.cache_hit=true`, `original_log_id` montajsız eski parse).
  Boş kopya spool dalına düşüp `dosya_adi_pipeline_yok` → 🟠 Fazla.
- **`api/devre-inceleme.js` `izometrileriDerle` montaj dalı ZATEN VARDI** ama yalnız `ps.montaj` varsa
  çalışıyordu; bayat-cache montajsız kayıt o dalı atlıyordu.

### 2. Fix 138/A — dosya_adi bazlı dedup (api/devre-inceleme.js)
- Aynı `dosya_adi` için en bilgilendirici kayıt seçilir (montaj{} 3 > spoollar dolu 2 > işlendi 1 > boş 0).
- Container'da gerçek dosyaya patch + node --check + senaryo testi GEÇTİ.

### 3. Feat 138/B — montaj ayrı bölüm (3 dosya, tek commit)
- **Tespit deterministik:** `montajDosyaKok!=null && dosyaAdiParse==null` → montaj belge. AI yok (MK-49.1).
  `montaj{}` parse'ta olmasa da (bayat-cache) dosya adından montaj sayılır → `icerik_okundu=false`.
- `lib/izo-eslesme.js`: `montaj_belge` filtresi (Fazla'ya girmez) + `montajlar[]` + `ozet.montaj`. Self-test
  korundu, montaj birim testi GEÇTİ.
- `api/devre-inceleme.js`: dosya-adı-tabanlı montaj-belge dalı (eski `if(ps.montaj)` kapsandı, `montaj_belge`
  işareti eklendi).
- `devre_wizard_v3.html`: `j.montajlar` → ayrı "Montaj / genel çizimler" bölümü (nötr, Fazla değil).
- **İlk commit eksik gitti** (izo-eslesme patch a2 anchor tutmadı — gerçek dosyada çok-satırlı return,
  benim anchor'ım tek-satırdı). Cihat tam dosyayı yükledi; doğru anchor'la tamamlandı, ayrı commit'le
  push edildi. **Doğrulama:** G400-817-015'te "0 fazla", montaj çeteleden çıktı.

### 4. Fix 138/A+B1 — taslak hijyeni (devreler.html + devre_wizard_v3.html)
- **A:** `applyFilters`'a `.neq('durum','taslak')` (tek nokta → count/liste/id tutarlı).
- **B1:** `wizardIptal()` soft-delete (`silindi=true`, yalnız taslak). İki İptal butonu (üst-bar + Adım 1)
  ona bağlandı. node --check (izole fonksiyon) OK.
- **Kök:** `inceleBaslat()` "İncele →" anında taslak INSERT ediyor (devre_id storage/kuyruk için lazım);
  terk edilince yetim kalıyordu.

### 5. Temizlik
- 15 boş devre (9 taslak + 6 aktif, hepsi çöp/yarım test) soft-delete. `bos_kalan=0`.
- 6 aktif-boş = eski v2 artığı (Nisan-Mayıs); yeni kod boş kabukta devreyi aktif yapmıyor → sistemik değil.

## Kararlar / içgörüler
- **Teşhis iki kez revize edildi, ikisi de ölçümle.** "Regex tutmuyor" hipotezi `node -e` ile çürütüldü;
  asıl kök bayat-cache. **Doküman hipotezine değil, koşan koda güven** (131→132→7.4 dersinin tekrarı).
- **MK-126.8 işe yaradı:** montaj dalı zaten vardı (devre-inceleme.js) — yeniden yazmadan mevcut dalı
  genişlettik. `montajDosyaKok` da vardı, dokunmadık.
- **Soft-delete > hard-delete:** yeni endpoint (MK-129.3 tavanı) + storage/FK riski yerine `silindi=true` +
  mevcut filtre. Tek UPDATE, anında çözer, geri alınabilir.
- **Anchor patch dersi:** çok-satırlı kod bloklarını anchor olarak alırken GERÇEK dosyanın birebir
  formatını kullan (boşluk/satır kırılımı). Tek-satıra sıkıştırılmış anchor `count==0` ile sessiz
  başarısız oldu; assertion yakaladı (dosyayı bozmadı). Cihat tam dosya yükleyince düzeldi.

## Süreç notu
Her teşhis adımı DB sorgusu/container testiyle; üç JS patch'i container'da `node --check` + birim testten
geçirildi; HTML patch'i izole fonksiyon node --check'i ile doğrulandı. Patch'ler anchor+assertion korumalı
(yanlış dosyada sessiz çalışmaz). Tüm fix'ler canlıda görsel doğrulandı.

## Mühürler (KARARLAR.md — 138 açılış/kapanışta)
MK-138.1 (dosya_adi dedup) · MK-138.2 (montaj deterministik tespit + ayrı bölüm) · MK-138.3 (taslak gizle +
iptal soft-delete).

## 139 ilk iş
B-çap sürprizi: `ares-kabuk.js grupla()` spool başlığına cap/et yazmıyor → modal "—", terfide doluyor.
Fix planlı (grupla'ya boyutParse türetmesi → taslak=terfi). Detay: son-durum + CLAUDE-SONRAKI-OTURUM.
