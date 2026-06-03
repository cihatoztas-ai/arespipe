# CLAUDE-SON-OTURUM.md — Oturum 149 özeti

## Tek cümle
Format Tanıtma / Çapa ekranı; B1 (düzeltme kipi + INSERT→UPDATE) ve A+B (içerik-bazlı oto-tespit + alan yeşil/kırmızı + prompt_template) ile genişletildi, CI borcu kapatıldı — hepsi $0/AI'sız, izometri-oku'ya dokunmadan, 12/12 fonksiyon korunarak.

## Kararlar (kilitli)
- **B1 = format_tanit'in düzeltme kipi**, ayrı dosya değil (docs zaten "hedefli kip" diyordu). In-place additif genişletme; param/picker yoksa eski davranış aynen.
- **Patch, rebuild değil (MK-111.2):** Düzeltme kipinde `_mevcutKural` derin kopyalanır, yalnız `_dirty` alanlar üzerine yazılır. malzeme_tablosu / kabul_kriterleri / AI satır desenleri korunur.
- **Dirty takibi:** Sadece operatörün yeniden işaretlediği/elle düzenlediği alan patch'lenir. Dokunulmayana parmak değmez.
- **A = içerik-eşleşmesi (fingerprint değil):** "Bu kurallar bu PDF'i okuyor mu?" doğrudan cevabı. Kimlik (dosya adı/üretici) farklı sürüm olsa bile kural tutuyorsa yakalar. Production routing fingerprint'le devam eder — o ayrı mesele.
- **AI sözlü tarif = prompt_template** (zaten kolon var, L3'te okunuyor). Deterministik kuralın yanında durur, yerine geçmez. Alan-bazlı `ai_ipucu` ileriye bırakıldı (gerçek ihtiyaç doğunca; "ileride lazım" tuzağına düşme).

## AI merdiveni tasarımı (Cihat'ın senaryosu — onaylandı, 150'ye taşındı)
Basamaklar (her biri öncekinden pahalı, yalnız ucuz başarısız olunca yukarı çık):
1. Oto-eşleştir (A) → mevcut format bulundu mu?
2. Ufak düzeltme (B1) → kırmızı alanı elle çapala (deterministik, $0).
3. Zor → AI çağır, doldursun.
4. Çözülmeyen → **soru ağacı** + yer işaretleme ile sistem çözmeye çalışsın.
5. Yetmezse → seçimlere küçük açıklama ekle, **operatör tetikli** 2. AI çağrısı → sonucu **mühürle**.

Dürüst rötuşlar:
- Bu merdiven yalnız ÖĞRETME kipinde koşar, format başına BİR KEZ. Üretimde (izometri-oku) asla koşmaz: ya mühürlü kural → L2 ($0), ya yok → tek L3. "İki kere AI" korkusu ancak merdiven her belgede koşarsa gerçek olur; öğretmede mühürleme belge başı maliyeti sıfırlar.
- 2. AI çağrısı **asla otomatik değil** — operatör "açıklama ekle → tekrar dene" der.
- Mühür iki sonuç: (a) kurala indirgenebilir → $0; (b) indirgenemez → `requires_ai` o alan için + prompt_template → daha ucuz/isabetli ama AI kalır (meşru %5-10 artık, "$0'a indi" yalanı söylenmez).
- Soru ağacı merdivenin 4. basamağı DEĞİL; **tek deterministik motor**, iki yerde (AI öncesi 2 + AI sonrası 4). "Elle ayarla" paneli bunun ilkel hali — pratikleştir.
- Ölçüm: `ai_api_log` (parser_seviye, maliyet) huninin daraldığını sayıyla gösterir.

## Önemli teknik notlar
- **renderDots üç durum:** regex+_okudu≠false → yeşil (dolu); regex+_okudu===false → kırmızı; tabloda bbox → yeşil; regexsiz/null → nötr.
- **_alanlariKos:** her alanın regex'ini CANON_ALL'a `_alanCikar` ile koşar → a._okudu (true/false/null).
- **otoTespit:** tenant L2 formatları (requires_ai=false) çekilir, her birinin alanlar regex'leri sayılır, en yüksek skor. Eşik: `skor>=3 || (skor>=2 && skor>=top*0.5)`.
- **loadPdf akışı:** extractAll → runDiag → (duzelt? _alanlariKos : otoTespit) → renderDots/Detay/Page/fitWidth.
- **formatSecDegis:** picker boş → _yeniKipeDon (yeni kipe sıfırla).
- **kaydet üç yol:** duzelt (patch+UPDATE, prompt dahil, prompt-only değişim de kaydeder) / yeni-dedup (merge+UPDATE) / yeni-insert. Üçünde de prompt_template textarea'dan.

## CI borcu (oturumun ilk yarısı, kapatıldı)
- B1 (`41ff1ab`) CI kırmızıydı: `[ARES_LAYOUT_EKSIK]`. format_tanit layout yüklemiyordu.
- `kontrol.js` lokalde diski tarıyor (gitignore'a bakmaz) → `_arsiv` prototipleri lokalde 3 hata gösterdi ama origin'de yoklar (CI'da çıkmaz). Gerçek tek hata format_tanit'ti.
- Çözüm: layout script + atlama listesi (`format_tanit`). Eski _arsiv md'leri untrack (disk'te kalır).
- `git rm --cached _arsiv` ilk denemede tüm _arsiv'i (eski oturum md'leri dahil) listeye soktu → geri alıp sadece gerçek hedefleri seçtik. **Aktif handoff dosyalarına dokunulmadı.**

## Dosyalar (repo kökü / docs)
- format_tanit.html (584 → 640 satır; B1 + A+B + prompt_template + layout)
- ares-layout.js (atlama listesine format_tanit)
- docs/FORMAT-TANITMA-URETIM-SPEC.md, docs/FORMAT-TANITMA-148-ILERLEME.md (149 eklemeleri)
- Silinen: _arsiv/oturum-78/*.md (3), docs/_arsiv/KUTUPHANE-YUKLEME-TAKIP_v2_43.md

## Süreç dersleri (149)
- **Kırmızı zeminin üstüne kat çıkma:** A+B'yi B1'in kırmızı CI'sının üstüne yazmak yerine önce zemini yeşile çevirdik — hata kaynağı karışmasın.
- **kontrol.js lokal ≠ CI:** Lokal diski, CI origin'i tarar. Lokal _arsiv hataları CI'da çıkmaz; gerçek hatayı dosya-bazlı ayırmak şart.
- **Paylaşılan dosyaya minimum dokunuş:** ares-layout.js'e tek kelime (atlama) eklendi, refactor'dan kaçınıldı.
- **Mantık testi sözdizimden ayrı:** node --check sözdizimi; ayrı sentetik koşum skorlama mantığını kanıtladı (8/8 + kırmızı senaryo).

## Kapanışta durum
- A+B + B1 canlıda doğrulandı, CI yeşil, eksik yok.
- 150 ana teması: **soru ağacı** (taze bağlam için yeni oturuma bırakıldı).
