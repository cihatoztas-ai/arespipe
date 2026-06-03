# son-durum.md — Oturum 149 (2026-06-03)

## Bu oturumda ne yapıldı
Format Tanıtma / Çapa ekranı **iki büyük adımla** genişletildi ve CI borcu kapatıldı:

1. **B1 — Düzeltme kipi (hedefli tek-alan çapa):** Tanınan formatı yükle → kayıtlı regex'ler hidratlanır → operatör sorunlu alanı yeniden işaretler → **yalnız o alan** `parser_kural.alanlar` içinde PATCH'lenir (rebuild DEĞİL). UPDATE `.eq('id')` + `guncelleme_at`. Dirty takibi: sadece dokunulan alan yazılır.
2. **INSERT→UPDATE borcu kapandı:** Yeni kipte kaydetmeden önce `fingerprint.dosya_adi_regex + tenant` ile mevcut satır aranır; varsa onay → UPDATE (alanlar merge), yoksa INSERT. Test sırasında çift satır üretme sorunu bitti.
3. **A — İçerik-bazlı oto-tespit:** PDF açılınca tenant'ın tüm L2 formatlarının (`requires_ai=false`) kuralları `CANON_ALL`'a koşulur, **en çok alan okuyan** kazanır (skor ≥3 veya ≥2 & ≥%50). İyi skorsa otomatik düzeltme kipine girer, banner "🎯 Otomatik eşleşti: X · N/M alan okundu". Picker manuel override + boş seçim → yeni kipe dönüş.
4. **B — Alan yeşil/kırmızı:** Yüklenince her kayıtlı regex bu PDF'e karşı koşulur (`_alanlariKos`). Okuyan yeşil, okuyamayan kırmızı, formatta tanımsız nötr. İlk kırmızı alana otomatik atlar → PDF avlamadan sorun görünür.
5. **prompt_template textarea:** Tamamla ekranına "AI'a sözlü tarif" alanı. Insert / dedup-update / düzeltme — üç yola da bağlı. Yalnız L3 fallback'te kullanılır, deterministik kuralın yerine geçmez. Düzeltme kipinde sadece tarifi değiştirsen bile kaydedilir.

## Canlı doğrulamalar (ölçüldü)
- ✅ A: M110-306-SP13.S02 PDF picker'a dokunmadan açıldı → "tersan test" otomatik eşleşti, **8/8 alan okundu**.
- ✅ B: 8 alan yeşil, `dn` nötr (PDF'te DN verisi yok → doğru). spool_no → S02 `l2.alanCikar`.
- ✅ B1 mekanizması: format yüklendi, alanlar hidratlandı, spool_no okundu (önceki test).
- ✅ Sözdizimi (node --check) + skorlama mantığı (sentetik 8/8, kırmızı senaryo _okudu=false) doğrulandı.

## CI temizliği (bu oturumun ilk yarısı)
- B1 commit'i (`41ff1ab`) CI'da KIRMIZIYDI: hata `[ARES_LAYOUT_EKSIK] ares-layout.js yüklenmiyor` (format_tanit.html layout yüklemiyordu).
- Çözüm: `format_tanit.html`'e `<script src="ares-layout.js"></script>` eklendi + `ares-layout.js` atlama listesine `format_tanit` eklendi (tam-ekran araç, sidebar enjekte edilmesin).
- Eski `_arsiv` arşiv md'leri (3× oturum-78, 1× docs/_arsiv) git takibinden çıkarıldı (disk'te kalır). Prototipler zaten `.gitignore`'da.
- `git rm --cached _arsiv` dikkatli yapıldı: aktif handoff dosyaları DEĞİL, sadece `_eski`/`_v2_43`/`_76` ekli eski sürümler silindi.

## Commit'ler (149)
| Hash | Mesaj |
|------|-------|
| `5dd7b45` | chore: prototipleri arsivle, test artefaktlarini test/ altina topla + uretim spec |
| `41ff1ab` | feat(format_tanit): B1 duzeltme kipi — tek alan capa + INSERT->UPDATE (CI KIRMIZI idi) |
| `edc06e5` | fix(ci): format_tanit ares-layout ekle + layout atlama listesi + eski _arsiv md temizligi |
| `ba96fa6` | feat(format_tanit): A+B — icerik-bazli oto-tespit + alan yesil/kirmizi + prompt_template |

CI: ✅ YEŞİL (ba96fa6)

## Değişmeyen kurallar (korundu)
- izometri-oku.js DOKUNULMADI (MK-49.1). parser_kural→L2, prompt_template→L3 (s.589/721), fingerprint→tanıma — üçü hazır okuma noktası.
- Yeni endpoint YOK (MK-129.3, 12/12). Doğrudan Supabase.
- Şema değişikliği YOK — mevcut kolonlar (parser_kural, prompt_template, fingerprint, guncelleme_at). Migration gerekmedi.
- Patch-not-rebuild (MK-111.2): düzeltme kipinde malzeme_tablosu / kabul_kriterleri / AI satır desenleri ezilmez.

## Açık borçlar / sonraki oturum notu (150)
- **ANA TEMA — Soru ağacı:** "Elle ayarla" panelini (ne tür değer? / neye çapalı? / etiket? / önek?) yönlendirmeli akışa çevir. Tek deterministik motor, iki yerde: AI'dan ÖNCE (ufak düzeltme) + AI'dan SONRA (kalan stragglar). Beyaz tahta + tasarım.
- **AI merdiveni (3/5):** Operatör tetikli (asla otomatik) 2. AI çağrısı + mühür mantığı. Sonuç (a) kurala indirgenebilir → $0, (b) indirgenemez → `requires_ai` o alan için + prompt_template mühürle (meşru %5-10 artık). Soru ağacından SONRA.
- **bbox → PDF-point normalize** (render-px, scale-bağlı; konum_ipucu opsiyonel).
- **Malzeme tablosu toplu AI** (henüz stub).
- **Tetik butonu:** uyarilar.html / wizard inceleme zayıf-satır → "Bu formatı tanıt/düzelt" → format_tanit (`?format_id=&alan=`).
- **Kaydet sonrası propagasyon:** eslestirme-backfill.js ile eski L3 PDF'leri yeni L2 kuralıyla yeniden parse.
- **`ai_api_log` ölçümü:** L3 payı zamanla düşüyor mu — niyet değil, sayı.

## Kritik hatırlatmalar
- **MK-134.1:** Batch push'ta HEAD'deki `[skip ci]` tüm push'u atlar. Kod commit'i `[skip ci]`SİZ gitmeli.
- **MK-51.1:** Kopyalamadan önce MD5 + satır doğrula. `arespipe_kopyala <kaynak> <hedef> <md5>` — 3. argüman MD5 zorunlu.
- **zsh `quote>` tuzağı:** Komut satırındaki yorumlar (`#`) ve içindeki `'` kesme zsh'i tırnak moduna sokuyor — komutları yorumsuz çalıştır.
- **Artifact önizleme `ARES is not defined`:** claude.ai önizlemesi göreli script'leri yükleyemediği için beklenen; gerçek uygulamada olmaz.
