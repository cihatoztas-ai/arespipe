# son-durum.md — Oturum 150 (2026-06-03)

## Bu oturumda ne yapıldı
1. **Soru ağacı beyaz tahtası → mimari dönüş (Cihat kararı):** "Her format tanıtımında bir AI mantıklı" —
   merdiven sırası değişti: **AI önce okur**, elle işaretleme tamir aracı oldu. AI'nın işi DEĞER bulmak
   (kural yazmak değil); kuralı cozumle sentezler, **kural çıktısı == AI değeri** doğrulaması ground-truth (MK-51.2 çözümü).
2. **AI-oku (Increment 1) GEMİDE:** format_tanit'e 🟣 buton + aiOku()/_aiSentezle()/_fileBase64(). Mevcut
   /api/izometri-oku çağrılır (MK-129.3: 12/12 korundu; MK-49.1: dokunulmadı). Yeşil=mühür, kırmızı="AI gördü: X"
   ipucu + B1 tamiri, **sızıntı kuralı**: AI null + cozumle dolu → mühürleme (dn50 vakası mekanik kanıtla yakalandı).
3. **Schedule zinciri gemide (UYUYOR):** l2-parser spool.schedule geçişi + izometri-oku asmeFallbackDoldur→
   boruOlcuBul schedule paramı. **MK-49.1 KONTROLLÜ İSTİSNA** (tek seferlik, 2 parametre+yorum): kanıt —
   boruOlcuBul guard `schedule?String(schedule):varsayilan` → undefined/null=bugünkü yol birebir; mevcut hiçbir
   formatta spool.schedule yok. İlk schedule'lı kural kaydedilince canlanır.
4. **Türetilmiş alan tasarımı kilitlendi:** çap/et/dn metinde yoksa (Y100: "2\" Sch 10S") regex değil ÇEVİRME —
   normalize TEK merkezde (ARES_OLCU.olcuParse→ARES_BORU; Node-uyumlu). Cihat finali: teaching tek soru sorar —
   "malzeme tablosu nerede" — çap/et/dn soruları öldü. → **docs/FORMAT-TANITMA-TABLO-TASARIM.md** (151 ana iş, tam spec).

## Canlı doğrulamalar (ölçüldü)
- M230 node kanıtı: 8/9 alan AI'sız kurala indi; dn sızıntısı guard'la yakalandı (yanlış dn=50 mühürü ENGELLENDİ).
- Y100-817-013.S03 canlı: AI-oku çalıştı, cap_mm kırmızı + "🟣 AI gördü: 60.3" ipucu (beklenen — metinde 60.3 yok).
- Y100-817-018.S02 (redüksiyon): "AI gördü: 48.3"; npsToDn('1-1/2')→40 doğrulandı; 2-1/8 NPS tabloda yok→null (zararsız).
- izometri-oku standalone yan etki analizi: batch+ai_api_log+cache; spooller/izometri YAZILMAZ, MK-117 tetiklenmez.

## Commit'ler (150)
| Hash | Mesaj |
|------|-------|
| `3393eb6` | feat(format_tanit): AI-oku — L3 deger bul, cozumle ile kurala indir, yesil/kirmizi (Increment 1) |
| `6359555` | feat(l2-parser): spool nesnesine schedule gecisi (ASME turetilmis olcu zinciri) |
| `30e995c` | feat(izometri-oku): asmeFallbackDoldur schedule gecisi — MK-49.1 kontrollu istisna (undefined=no-op kanitli) |
| (remote `4b3e9fd`) | ci-son-rapor otomatik güncelleme — rebase ile alındı, push `73f3f38` |

CI: ⏳ `73f3f38` yeşil teyidi 151 açılışında. + M230 regresyon (istisna sonrası davranış aynı mı) canlıda görülmeli.

## MK kaydı
- **MK-49.1 istisnası (150):** asmeFallbackDoldur'da 2 boruOlcuBul çağrısına `schedule: yeni.schedule`. Tek seferlik,
  kanıtlı (no-op), yorumla belgeli. Kural YÜRÜRLÜKTE kalır.
- MK-129.3 ✓ (12/12, AI çağrısı mevcut endpoint) · MK-111.1/111.2 ✓ · MK-126.8 ✓ (ares-olcu bulundu, kopya yazılmadı).

## Açık borçlar / 151
- **ANA İŞ — Increment 2 (tablo motoru):** _tabloSentezle + l2-parser olcuParse/dominant-Boru türetimi + 3-PDF
  mekanik test. TEK KAYNAK: docs/FORMAT-TANITMA-TABLO-TASARIM.md — tartışma tekrarlanmaz.
- Sonrası kuyruk (tasarım dok. §6): pekiştirme bağlama, requires_ai dürüstlüğü, tetik butonu, propagasyon,
  bbox normalize, boruOlcuBul DB fallback schedule filtresi.
- Cihat'tan 1 SELECT: tersan kuralının parser_kural.malzeme_tablosu dökümü (satir_tipleri dolu mu — hâlâ görülmedi).

## Kritik hatırlatmalar
- MK-134.1: kod commit `[skip ci]`SİZ; doc commit `[skip ci]`. MK-51.1: arespipe_kopyala + MD5 zorunlu.
- zsh quote> tuzağı: komutlar yorumsuz. format_tanit canlı test: uygulama içinden, giriş yapılı, flag aktif.
