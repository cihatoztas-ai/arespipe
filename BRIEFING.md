# AresPipe — BRIEFING

> Çok kiracılı (multi-tenant) tersane boru spool imalat takip SaaS.
> Stack: Supabase/PostgreSQL + PostgREST · Vercel Hobby (12 fonksiyon tavanı, MK-129.3) · vanilla JS/HTML · React Native mobil.
> Repo: `cihatoztas-ai/arespipe` · Prod: `arespipe.vercel.app` · Lokal: `~/Desktop/arespipe`.

---

## Güncel durum (Oturum 203 sonu)

**Kalite Kontrol (KK) modülü + TERSAN Boru Takip Formu** üzerinde çalışıldı.

- KK sekmeleri (Açık/Arşiv/Havuz): tablo hizalama, filtre/arama/sıralama, filtreli seçim, select-all.
- Belgeler: birleşik belge merkezi (üretilen + yüklenen + foto galerisi), `kk_belgeler` + Storage + RLS.
- KK Listesi: PDF + Excel.
- **TERSAN Boru Takip Formu (FR-DNTM-21-03)** parça seviyesinde: `spool_malzemeleri` → filtre + DN/ET-PN parse + gruplama → Excel (JSZip şablon) + PDF (portrait, çok sayfa). Tamamen client-side, $0.

## Aktif modül haritası
- `kalite_kontrol.html` — KK ana ekran (master-list + drawer), Belgeler, Boru Takip Formu (Excel + PDF).
- `templates/boru-takip-formu.xlsx` — TERSAN form şablonu (logo gömülü).
- `vendor/jszip.min.js` — şablon-doldur için.
- `lib/excel-parser.js`, `api/kuyruk-isle-excel.js` — Excel parser (Oturum 101).

## Açık işler
1. BUG: sevkiyat'ta `aktif_basamak='kk'` sızması.
2. spool_detay/devre_detay KK çapraz-link.
3. KK i18n (`lang/{tr,en,ar}.json`).
4. Boru Takip Formu Weld-O-let ET/PN kararı.
5. Kütüphane (fitting/flanş seed) — ayrı hat.

## Çalışma disiplini (özet)
- DATA → UI → code (MK-158.1); koddan önce oku (MK-126.8); şema varsayma, `information_schema` (MK-85.3).
- Schema migration BEGIN/ROLLBACK dry-run (MK-98.2); read-before-write (MK-111.2).
- Code commit `[skip ci]` YOK; doc commit VAR (MK-134.1). `node --check` her JS commit öncesi.
- Dosya teslimi: `present_files` → `arespipe_kopyala <src> <dst> <md5>` (MK-51.1 MD5).
- İki-AI: bu Claude = mimari/tasarım/ikinci göz; Claude Code = terminal/DB.
- Cihat: terse iletişim, A/B/C + net öneri, hızlı ikili karar; programcı değil, mimari sezgisi güçlü.
