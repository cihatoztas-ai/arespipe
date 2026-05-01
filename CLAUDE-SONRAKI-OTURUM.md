# Claude — 50. Oturum Gündemi

> **Bu dosya 49 kapanışında oluşturuldu. 50 başında ilk okunacak.**

---

## 50 Açılış Mottosu

49, async kuyruk altyapısını canlıya aldı. Tarayıcı kapatılabilir, parse arka planda devam eder, çoklu PDF batch'leri çalışıyor. Excel raporlama 3 yeni kolonla (Durum + Uyarılar + AI Notları) güçlendi. Ama **gerçek ekonomi kazanımı henüz gelmedi** — şu an her PDF AI'a gidiyor ($0.036/PDF).

**50 iki kelimelik özeti: format öğrenme.**

İlk PDF AI'a gider (parse + parser_kural taslağı). Müşteri onaylar/düzeltir. Kalan 999 PDF aynı formatsa **L2 deterministik parse** ile çıkar — AI yok, regex extract, ~100ms × 999 = ~100 sn, $0 maliyet. **60× ekonomi, mimarinin asıl kazanımı.**

50 etkileşimli oturum (kullanıcı UX akışı + AI prompt + L2 engine birlikte). 50 sonu: PAOR formatının `parser_kural` JSONB'si dolu, L2 parser canlı, "ilk PDF $0.036, sonraki 999 PDF $0" senaryosu somut bir gerçeklik.

---

## 1. Açılış Ritüeli (~5 dk)

5 cevap zorunlu (CLAUDE.md):

```
Oturum başlangıç ritüeli — 5 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -5
2. GitHub Actions sekmesinde son build rengi nedir?
3. .github/son-durum.md dosyasını yükle veya içeriğini yapıştır
4. Bugün hangi dosyayla çalışılacak? (cevap: PAOR parser_kural taslağı + L2 parser engine + etkileşimli format öğretme modal)
5. admin/panel.html → Geri Bildirim sekmesinde açık feedback?
```

5 cevap geldikten sonra:
- son-durum.md'den 49 sonu detayını oku (9 mimari karar listesi MK-49.1→49.9)
- VIZYON-VE-MODULER-MIMARI.md ve SPOOL-AI-VIZYON.md hatırla (özellikle Madde 4 — öğrenme döngüsü)
- docs/CIHAT-PROFIL.md hatırla (kullanıcının çalışma tarzı)
- CLAUDE-SON-OTURUM.md (49 detayı) — gerekirse aranır
- **Migration disiplini hatırlat:** her DB değişikliği iki adımdır
- **Vercel build cache hatırlat (MK-48.1):** paket değişiminde manuel redeploy
- **Dosya transfer disiplini:** GitHub web UI fallback (49 dersi)
- **zsh quote sorunu:** parantezsiz commit mesajları (49 dersi)

---

## 2. Bağlam Tazeleme — 49'dan Devralan Karar Listesi

50'ye başlamadan önce 49'un 9 mimari kararı zihinde olmalı:

| # | Karar | 50 etkisi |
|---|---|---|
| **MK-49.1** | izometri-oku.js HTTP üzerinden çağrılır, module import yok | L2 parser entegrasyonu için bu kuralı koru. STUB içine L2 mantığı yazılır, dosya dokunulmaz devam eder. |
| **MK-49.2** | SELF_BASE_URL: VERCEL_PROJECT_PRODUCTION_URL > VERCEL_URL | Yeni endpoint eklenirse aynı pattern |
| **MK-49.3** | Self-trigger chain hibrit, 2 PDF/function | L2 parse hızlı (~100ms), 2 PDF limiti gevşetilebilir → 10-20 PDF/function |
| **MK-49.4** | parser_kural metin pattern tabanlı, koordinat değil | **50'nin temel tasarım kararı.** Konum bağımsız regex |
| **MK-49.5** | Cache HIT log yazmamak, basari_orani formülü dikkatli | L2 başarılı = log YAZ (cache HIT'ten farklı, $0 ama log var). Yeni kolon: `parser_seviye` (cache/L2/L3). |
| **MK-49.6** | Dosya-spool eşleştirme pipeline_no öncelikli | PAOR'a özel, 50'de generic'leştir (her formatta farklı pattern) |
| **MK-49.7** | 3D model render = kod tarafında, AI yok | 50'de değişmiyor, 52+'a |
| **MK-49.8** | İzometri PDF yükleme bileşeni hem wizard hem devre detay'da embed | 50'de format öğretme modalı bu bileşenin parçası |
| **MK-49.9** | Format öğretme mecburiyeti yok, ekonomik gereklilik | **50 UX'inin temel ilkesi:** modal kapat-git serbest, sistem L3 ile devam |

**48'den hâlâ geçerli kararlar:** MK-48.1 (Vercel cache), MK-48.2 (cache lookup), MK-48.3 (RLS), MK-48.4 (cache HIT log), MK-48.5 (format öğrenme > wizard — 50'de operasyonel oluyor), MK-48.6 (Veri Sahipliği — KARAR-48.1).

**Strateji notu (kritik):** Fine tuning YOK, RAG VAR. Anthropic AI sabit, AresPipe sistemi öğrenir. 50'nin asıl gücü budur.

---

## 3. Ana İş Hatları (~5-6 saat)

### 3.1 — Etkileşimli Format Öğretme Modal (~1.5 saat)

**Gerekçe:** İlk PDF parse'tan sonra kullanıcıya gösterilir. Cihat'ın "kullanıcı başında bekleyemem" sezgisinin somut karşılığı.

**Akış:**
1. Frontend: Polling ile ilk PDF tamam olduğunu görür → modal aç
2. Modal sol panel: PDF görüntüsü (PDF.js veya iframe)
3. Modal sağ panel: AI'ın bulduğu alanlar listesi (her satır: alan adı + değer + "✓ doğru / ✗ yanlış / 📝 düzelt")
4. Onay butonu → AI 2. prompt ile `parser_kural` JSONB taslağı üret → DB'ye yaz
5. Kalan PDF'ler (kuyruktaki) → L2 parser ile parse edilir

**Modal kapatılırsa:** localStorage'a "format öğretme atlandı, batch X" yaz → sistem L3 ile devam eder. **Mecburiyet yok (MK-49.9).**

**PDF görüntüleme:** Storage'dan signed URL alınır, iframe'e koyulur. PDF.js gerek yok (basit görüntüleme yeterli).

**Yan panel field listesi:** spool-bazlı değil, format-bazlı. Yani "spool_no nasıl çıkarılıyor (regex)" sorusu, "spool S01'in DN'i nedir" sorusu değil.

### 3.2 — `parser_kural` JSONB Şeması v1 (~30 dk)

Şema sabitlenmesi tasarım kararı — sonra bütün L2 engine bu şemaya göre yazılır.

```json
{
  "schema_version": 1,
  "ekstraktor_tipi": "regex_text",
  "spool_blok": {
    "isaret_regex": "\\[(\\d+)\\]",
    "spool_no_format": "S{:02d}"
  },
  "alanlar": {
    "pipeline_no": {
      "kaynak": "dosya_adi",
      "regex": "(\\d{5}-\\d{6})",
      "grup": 1
    },
    "dn": {
      "kaynak": "metin",
      "regex": "DN\\s*(\\d+)",
      "grup": 1,
      "tip": "int"
    },
    "kalite": {
      "kaynak": "metin",
      "regex": "\\b(ST\\s*37|ST37)\\b",
      "grup": 1,
      "normalize": "ST37"
    }
  },
  "malzeme_tablosu": {
    "tablo_basligi_regex": "(PIPES|FITTINGS|PENETRATIONS\\s*&?\\s*SUPPORTS|VALVES|FLANGES)",
    "tablo_bitis_regex": "(GENERAL\\s+NOTES|GALVANIZATION|PIPE\\s+CUT-LENGTHS|^\\s*$)",
    "satir_regex": "^\\s*(\\d+)\\s+(\\d+)\\s+(.+?)\\s*$",
    "alan_haritasi": ["kod", "adet", "tanim"]
  },
  "kabul_kriterleri": {
    "min_spool_sayisi": 1,
    "zorunlu_alanlar": ["spool_no", "pipeline_no", "dn", "kalite"]
  },
  "metadata": {
    "uretildi_at": "2026-05-01T...",
    "kaynak_log_idleri": ["uuid1", "uuid2"],
    "ornek_pdf_sayisi": 1
  }
}
```

**Kritik tasarım kararları:**
- `ekstraktor_tipi: regex_text` switch görevi görür (50+'da `koordinat_pdf` eklenirse eski kurallar bozulmaz)
- `kabul_kriterleri` L2 başarısız olduğunda L3 fallback tetikler
- `metadata.kaynak_log_idleri` iz sürebilirlik (KARAR-48.1 ruhuyla uyumlu)

### 3.3 — L2 Parser Engine (~1 saat)

**Yeni dosya:** `lib/l2-parser.js` (yeni klasör mü, mevcut yapıya bak)

```javascript
async function parserKuralIle({ pdf_buffer, dosya_adi, parser_kural }) {
  const data = await pdfParse(pdf_buffer);
  const text = data.text;

  // Şemayı oku, alanları çıkar
  const spoollar = [];
  const isaretler = [...text.matchAll(new RegExp(parser_kural.spool_blok.isaret_regex, 'g'))];
  
  for (const isaret of isaretler) {
    const spool = { spool_no: 'S' + String(isaret[1]).padStart(2, '0') };
    
    // Her alan için extract
    for (const [alanAd, kural] of Object.entries(parser_kural.alanlar)) {
      const kaynak = kural.kaynak === 'dosya_adi' ? dosya_adi : text;
      const match = kaynak.match(new RegExp(kural.regex));
      if (match) spool[alanAd] = match[kural.grup || 1];
    }
    
    // Malzeme listesi extract
    spool.malzeme_listesi = malzemeListesiCikar(text, parser_kural.malzeme_tablosu);
    
    spoollar.push(spool);
  }

  // Kabul kriterleri kontrol
  if (!kabulKriterleriUyuyor(spoollar, parser_kural.kabul_kriterleri)) {
    return null; // L3 fallback tetikle
  }

  return { ok: true, spoollar, _parser_seviye: 'L2' };
}
```

**Handler entegrasyonu (`api/izometri-oku.js`):**

Mevcut STUB:
```javascript
// L2 parser (parser_kural)
async function parserKuralIle(...) {
  return res.status(501).json({ error: 'Not implemented' });
}
```

Yeni:
```javascript
const { parserKuralIle } = require('../lib/l2-parser');

// Handler içinde:
if (cacheKayit) { /* cache HIT */ }
else if (formatBilgisi?.parser_kural && Object.keys(formatBilgisi.parser_kural).length > 0) {
  parseSonuc = await parserKuralIle({ pdf_buffer, dosya_adi, parser_kural: formatBilgisi.parser_kural });
  if (!parseSonuc) {
    parseSonuc = await visionAIParse({ ... });  // L3 fallback
  }
} else {
  parseSonuc = await visionAIParse({ ... });  // L3
}
```

### 3.4 — AI Taslak Üretici Endpoint (~45 dk)

**Yeni endpoint:** `api/format-kural-uret.js`

```
POST /api/format-kural-uret
Body: {
  format_id,           // izometri_format_tanimlari.id
  ornek_log_idleri,    // ai_api_log id'leri (1-3 adet, son başarılı parse'lar)
  format_sablonu       // schema_version=1 boş şema
}

Response: {
  ok: true,
  parser_kural_taslagi: { schema_version: 1, ... }
}
```

**Akış:**
1. `ai_api_log`'tan örnek parse'ları çek (cevap_full + istek)
2. Anthropic'e ekstra prompt: "Bu PDF parse sonucu var. Aynı formatta başka PDF'ler için extraction kuralı yaz. Şemayı doldur."
3. Cevabı `parser_kural_taslagi` olarak döndür (DB'ye YAZMAZ — kullanıcı onayı sonrası yazılır)

### 3.5 — Format Aktif Et Endpoint (~30 dk)

**Yeni endpoint:** `api/format-kural-aktif-et.js`

```
POST /api/format-kural-aktif-et
Body: {
  format_id,
  parser_kural   // kullanıcı düzeltilmiş JSONB
}

Response: {
  ok: true,
  format_id,
  egitim_kaynagi: 'AI_taslak_onayli'
}
```

**Akış:**
1. Validation: schema_version=1 mi, zorunlu alanlar var mı
2. UPDATE izometri_format_tanimlari SET parser_kural = $1, egitim_kaynagi = 'AI_taslak_onayli', guncelleme_at = now() WHERE id = $2
3. **Audit:** Önceki parser_kural'ı `parser_kural_history` JSONB array'ine push (yoksa kolon eklenir)

### 3.6 — Prompt İyileştirme: Spool Sayısı Tespiti (~30 dk)

49'da keşfedilen sorun: AI bazen `[1] [2]` köşeli parantezleri "kesim listesi" diye yorumluyor.

`api/izometri-oku.js`'in vision prompt'ında şu bölüm güçlendirilir:

```
SPOOL TESPİTİ KURALI (ÇOK ÖNEMLİ):
- "SPOOL" başlıklı bölümdeki köşeli parantezler = gerçek spool sayısı
  Örnek: "SPOOL [1] [2]" → 2 spool
- "PIPE CUT-LENGTHS" tablosundaki <1> <2> = kesim parçası, spool DEĞİL
  Bunlar spool sayılmaz, malzeme listesinde de görünmez
- Eğer SPOOL bölümündeki sayı ile dosya içinde çıkardığın spool sayısı uyuşmuyorsa
  notlar alanına yaz: "SPOOL bölümünde N spool, ama parse'ta M çıkardım"
```

### 3.7 — `parser_kural_history` Audit Kolonu (~10 dk, opsiyonel)

Migration 024:
```sql
ALTER TABLE izometri_format_tanimlari
ADD COLUMN parser_kural_history jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN izometri_format_tanimlari.parser_kural_history IS
  '50 — Önceki parser_kural sürümleri. Her aktif et'te eski kural buraya push edilir.';
```

Format aktif et endpoint'i bunu doldurur.

---

## 4. Test Stratejisi

50 sonu test scenarios:

**Test 1: PAOR ilk öğrenme**
1. Yeni PAOR PDF yükle (örn. 101510)
2. Modal açılır → AI alanları gösterir
3. Kullanıcı onaylar → parser_kural üretilir → DB'ye yazılır
4. **Doğrulama:** SELECT parser_kural FROM izometri_format_tanimlari WHERE format_kodu='paor_aveva_ana' → JSONB dolu

**Test 2: L2 parser çalışıyor mu**
1. Aynı format başka PDF (101511) yükle
2. **Beklenen:** parse süresi < 3 sn (L2), $0 maliyet
3. ai_api_log'da yeni kayıt YOK (cache HIT'ten farklı, L2 başarılı = log var ama maliyet sıfır)
4. **Doğrulama:** SELECT FROM ai_api_log → son kayıt cache_meta L2 içeriyor

**Test 3: L2 başarısız + L3 fallback**
1. Bozuk/farklı format PDF yükle (PAOR fingerprint eşleşir ama içerik farklı)
2. L2 kabul kriteri tutmuyor → L3 otomatik
3. **Doğrulama:** Vercel logs'ta "L2 başarısız, L3 fallback" mesajı

**Test 4: Cache HIT korunuyor mu**
1. Aynı PDF tekrar yükle → 3 sn cevap
2. **Doğrulama:** cache HIT (MK-48.4 hâlâ çalışır)

---

## 5. Risk Yönetimi

| Risk | İhtimal | Etki | Hafifletme |
|---|---|---|---|
| AI taslak üretici prompt zayıf, JSONB hatalı çıkar | Orta | Yüksek | İlk PAOR ile manuel test, prompt iyileştir |
| L2 parser regex bug, bazı alanlar yanlış extract | Orta | Orta | Kabul kriterleri sıkı tut, şüpheli olunca L3 fallback |
| Etkileşimli modal UX zayıf, kullanıcı kapat-gider | Düşük | Düşük | MK-49.9 — mecburiyet yok, sistem L3 ile devam eder |
| izometri-oku.js refactor riski (STUB içine kod) | Düşük | Yüksek | MK-49.1 — sadece STUB içinde değişiklik, başka yere dokunma |
| Storage 1 GB limit (Hobby) | Düşük | Yüksek | Lifecycle policy sonra düşünülür, şimdi sorun değil |

---

## 6. Süre Tahmini

| İş | Süre |
|---|---|
| Açılış ritüeli + bağlam | 15 dk |
| 3.1 Etkileşimli modal | 1.5 sa |
| 3.2 Şema sabitleme | 30 dk |
| 3.3 L2 parser engine | 1 sa |
| 3.4 AI taslak üretici endpoint | 45 dk |
| 3.5 Format aktif et endpoint | 30 dk |
| 3.6 Prompt iyileştirme | 30 dk |
| 3.7 Migration 024 (opsiyonel) | 10 dk |
| Test + bug fix | 1 sa |
| Kapanış (3 dosya) | 30 dk |

**Toplam: ~6 saat.** 49'la benzer büyüklük. Bölünebilir oturum.

---

## 7. Önemli Hatırlatmalar

**Migration disiplini (her DB değişikliği iki adımdır):**
1. Önce Supabase SQL Editor → DB'ye uygula + doğrula
2. Sonra GitHub'a upload → CI yeşil → versiyonlama

**Vercel build cache (MK-48.1):**
- Paket değişimi yok bu oturumda → manuel redeploy gerekmez
- Yeni endpoint eklenmesi cache'siz redeploy gerektirmez

**Dosya transfer (49 dersi):**
- 30KB+ dosya patch formatı tercih
- Mac indirme bozuksa GitHub web UI'dan direkt edit

**zsh quote (49 dersi):**
- Commit mesajları parantezsiz: `feat 50 L2 parser` (`feat(50): X` değil)

**Format öğretme felsefesi (MK-49.9):**
- Mecburiyet yok, ekonomik gereklilik
- Modal kapat-gider serbest
- Sistem L3 ile devam eder (sorun yok, sadece pahalı)

---

## 8. 51+ Hatırlatma — 50 Sonrası Gündem

50 başarılı olduktan sonra 51 gündemi:
- **Format envanter UI** (super_admin, read-only başlangıçta)
- **Manuel onay sayfasında PDF aç butonu** (15 dk iş)
- **Hatalı kayıt aksiyonları** (yeniden-dene, sil, pdf-indir endpoint'leri)
- **L2/L3 metrik dashboard** (cache hit oranı, L2 başarı oranı, tasarruf $)
- **`pdf_format_kutuphane` ↔ `izometri_format_tanimlari` terminoloji birleştirme**
- **`tv()` dil etiketleri eksik** (yeni anahtarlar `lang/tr.json` + `lang/en.json`'a)

52+ uzak vade:
- Devre yükleme wizard'ı (MK-49.8)
- Devre detay sayfası "İzometri Çizimleri" sekmesi (MK-49.8)
- Format evolution (eskiyen kuralları otomatik tespit)
- 3D wireframe başlangıç (MK-49.7)

---

## 9. Vizyon Disiplini Hatırlatması

50'de **YENİ VİZYON İSTİSNASI YAPILMAZ.** İstisna olabilecekler:
- ❌ Pasif öğrenme — vizyonda kalır
- ❌ Tier'li servis modeli — vizyonda kalır
- ❌ Lazer tarama pipeline — vizyonda kalır
- ❌ STEP koordinat çıkarımı — vizyonda kalır

50'de yapılacaklar **Vizyon Madde 4'ün operasyonel çekirdeği** (format öğrenme döngüsü). 48-49'un kurduğu temelin üzerine kurulur.

---

## 10. Açılış Mesajı Önerisi (Claude için)

50 başlangıcında Claude şu özetle açabilir:

> "49 async kuyruk altyapısını canlıya aldı, şimdi 50'de format öğrenme döngüsü L2 kuruluyor. Sıralama:
> 1. Etkileşimli modal (PDF + alan onayı)
> 2. parser_kural şeması v1
> 3. L2 parser engine
> 4. AI taslak üretici endpoint
> 5. Format aktif et endpoint
> 6. Prompt iyileştirme (spool sayısı)
> 7. Test (PAOR ile uçtan uca)
>
> İlk hedef format PAOR (26 başarılı kullanım, en zengin sample). 50 sonu: 'ilk PDF $0.036, sonraki 999 PDF $0' senaryosu canlıda."

Cihat onaylarsa teknik işe geç.

---

> Bu dosya 49 kapanışında oluşturuldu. 50 başında ilk okunacak.
> Son güncelleme: 1 Mayıs 2026 — 49. oturum kapandı.
