# CLAUDE-SON-OTURUM.md — Oturum 165 özeti

## Tek cümle
165 "kanıt zinciri" oturumuydu: 164'ten devreden 42.2/3.56 vakası parse_sonuc dökümüyle üç
köke ayrıştırıldı (emperyal satırda boyut alanı yokluğu + dn alan-regex'inin kaynak satırına
çapası + asmeFallbackDoldur'un çift körlüğü — helper malzeme-kör, DB yolu schedule-kör) ve
iki commit'le kapatılıp drenajda 60.3/2.77/SCH 10S ile mühürlendi; Cihat'ın verdiği
tersan.zip ile atölye modeli (MK-162.1) ilk kez uçtan uca koştu (15/15 L2, bilezik_detay'ın
7 ham + 3 SESSİZ satırı kurtarıldı, E100-817-005 ilk kez söküldü, araç scripts/atolye-kosum.mjs
olarak kalıcılaştı), dnBul ters eşlemesiyle DN basmayan çizimler çözüldü ve açılış teyit
üçlüsü (izometri-kaynak format_id'li ✓ · OPR terfi ✓ · G2a kart eşiği ✓) mühürlendi.

## Kanıt zinciri (yöntem: parse_sonuc jsonb_pretty + repo klon kod okuma + mekanik node testleri + drenaj SQL + EKRAN)
1. **Vaka dökümü:** dn=32 · cap 42.2 · et 3.56 · `dolduruldu: {et_mm:"ares_boru (SCH 40)",
   cap_mm:"ares_boru"}` · malzeme_listesi 3 TEMİZ satır ("satirlar=0" 164 yanılgısı).
   et=3.56 imzası regex'ten gelemezdi (tek-ondalık yakalama) → fallback'i işaret etti.
2. **Fix-1 + repro:** olcuZenginlestir boyutsuz emperyal satırı atlıyordu → NPS sentezi
   (yerel boyutStr, m.boyut kirletilmez) + spoolOlcuTuret dn'i HEP dominant borudan (kenar
   §5). 9/9 test; drenaj-1 cap/dn düzeldi AMA et=1.65 "boru_olculer (SCH SCH5)".
3. **Çift körlük:** izometri-oku içi boruOlcuBul okundu (MK-49.1 — yalnız okuma): helper
   `malzeme_en_kodu||'karbon'` → karbon tablosunda 10S yok → fail; DB sorgusunda
   schedule_kod filtresi YOK + limit=1 → SCH5. → Fix-2: satır-kaynaklı asme et spool'a,
   etiket fallback'in birebir eşi (MK-164.1 ruhu). 13/13; drenaj-2: 2.77/2.77 ✓; UI bindirme
   uyarısında et/çap kalemi yok ✓.
4. **Atölye:** tersan.zip 15 PDF gerçek hat koşumu → bilezik 'Detay A' dökümünde 'Dış'
   satırlarının SESSİZ düştüğü görüldü (ham bile değil — yalnız set taramasıyla yakalanır);
   yeni tip 10/10 + tetik ayrımı; set sonrası ham=0. dnBul: 10 birim + 3 zincir; AT110-804
   gerçek PDF'te dn=50.
5. **Teyitler (Cihat ekranı + SQL):** taslak_duzeltmeleri → izometri+format_id DOLU ✓;
   spool_malzemeleri OPR satırı ✓ (kalite fallback'i kod okumasıyla regresyon DEĞİL diye
   ayrıştırıldı: dz.kalite girilmemişti); uyarilar kartı eşik davranışı doğru ✓ — bonus:
   A-001211/12 fix'in ürün-yüzü kanıtı olarak listede.

## Süreç dersleri (165)
- **MK-165.4:** cevap_full kuyruk alanı taşımaz; sha temizliği original_log_id üzerinden;
  Supabase "Success. No rows returned" UPDATE'te de gelir → her UPDATE etkisi SELECT'le.
  Drenaj FİLTRELİ: reset edilen satır, devresi açılmadan işlenmez (başka devre yüklemek
  yeni satır yaratır, eskiyi akıtmaz).
- **MK-165.6:** && zinciri "nothing to commit"te kırılır, sonraki commit sessiz kaybolur →
  commit'ler ayrı bloklar.
- Hipotez disiplini işledi: "ham-sayan kabul" hipotezim dökümle ÇÜRÜDÜ ve düşürüldü; hüküm
  yalnız örnek-teyitli anahtarlardan (MK-85.3) verildi.
- UI yardımcı metni ciddiye al: kullanıcının "taslakta spool'a girilmiyor" itirazı doğruydu —
  doğru adres devre_detay önizlemesi değil wizard ?devre_id= akışıydı (köprü eksiği MK-165.7).

## Dosyalar/commit'ler (165)
`5edbba1` (l2-parser: nps sentezi + dn dominant) · `1596481` (l2-parser: asme et yazımı) ·
`af90f85` (format-paketleri: bilezik_detay + scripts/atolye-kosum.mjs YENİ) · `f86ff81`
(ares-asme: dnBul + l2-parser: dn türetimi). DB: migration yok; ai_api_log 2 sha NULL.
Doc paketi: BRIEFING + üçlü + KARARLAR MK-165.1..7 + 4 yol-haritası/atölye eki (kesintisiz).
12/12 ✓ · izometri-oku ✓ (dokunulmadı).
