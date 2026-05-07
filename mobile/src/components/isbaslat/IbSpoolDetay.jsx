// mobile/src/components/isbaslat/IbSpoolDetay.jsx
// AresPipe — İş Başlat Ekran 3 (Spool Detay) — 68b. oturum (notlar wiring)
//
// 67'de v9-v16 mockup turuyla kilitlenen tasarımı birebir hayata geçirir.
// Mockup referansları: ekran3_v13_*.html, v13b_*.html, v14_*.html.
//
// Bu dosyada:
// - Üst bant tek satır kimlik string (gemi-pipeline-spool-rev birleşik) +
//   devam_ediyor durumunda sarı + yeşil pulse nokta
// - Foto blok 200px placeholder (kamera ikonu)
// - Aktif rol mavi pill + Spool ID mor pill (4-hane normalize) + Peek tab
//   (yumuşak uyarı varsa sarı + sayı, yoksa gri pasif)
// - Sekmeler (Genel | Malzeme)
// - Genel paneli iş takibi badge'leri (Çap, Ağırlık, Malzeme/Kalite, Yüzey,
//   Alıştırma badge, Durum, Aktif basamak, İlerleme)
// - Foot CTA dikey 2 buton (ghost yeşil İşe Başla + ghost gri Başka Spool)
//   · devam_ediyor varyantı: kırmızı solid Kapat + ghost Not + ghost İptal
// - Yumuşak uyarı drawer (sağdan 320px slide-in) — N kart (alıştırma kırmızı /
//   test mavi / not sarı) + tek "Anladım, devam et" mavi solid buton, tek
//   blok dikey merkez (mockup v14 final pattern)
// - Akış-kesici drawer (IbUyariDrawer merkez modal) — devamEdiyor +
//   alternatifBasamak (kaynak ailesi içinde)
// - Drawer açıkken (her iki tip de) İşe Başla disabled
//
// Uyarı önceliği:
// 1. Akış-kesici varsa drawer aç, dur (yumuşak atla)
// 2. Yoksa yumuşak uyarı(lar) topla, drawer otomatik aç (peek tab aktif)
// 3. Yumuşak yoksa drawer yok, peek tab pasif (gri)
//
// Bilinçli ertelenenler (68b):
// - Foto carousel detayı (fotograflar tablosu sorgusu, prev/next, sayaç)
// - Malzeme paneli BOM listesi + heat inline edit
// - Devral foto akışı, alternatife başla DB update
// - basamak_tanimlari label (slug → "Ön İmalat" gibi okunaklı görünüm)
// - Yetki kontrolü (alternatifBasamakYetkili / yetkisiz ayrımı)
// - İşe Başla / İşi Kapat / Not Ekle / İptal Et gerçek akışlar
// - Genel paneli'nde Büküm / Markalama / Kesim ilerleme badge'leri (agregat)
// - m_ib_uy_yu_* anahtar setinin lang/tr,en,ar.json'a toplu eklenmesi
//   (alis/test/anladim/not — şu an hepsi tv() fallback ile çalışıyor)
//
// 68b'de eklendi:
// - Notlar drawer wiring (notlar tablosu fetch + sarı kart üreticisi,
//   spool_id veya devre_id eşleşmesi, qr_goster=true filtresi)
// - Üst banttan gemi_adi çıkarıldı (UI'a sızmaması gerekiyordu)

import { useState, useEffect, useMemo } from 'react'
import { useT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import IbUyariDrawer from './IbUyariDrawer'

export default function IbSpoolDetay({
  spool,
  aktifRol,
  kullanici,
  onBaskaSpool,
  onGeri,
}) {
  const { tv } = useT()

  const [yerelSpool, setYerelSpool] = useState(spool)
  const [devre, setDevre] = useState(null)
  const [proje, setProje] = useState(null)
  const [testlerSayi, setTestlerSayi] = useState(0)
  const [notlar, setNotlar] = useState([])
  const [aktifSekme, setAktifSekme] = useState('genel')
  const [uyariDrawer, setUyariDrawer] = useState(null)        // akış-kesici
  const [yumusDrawerAcik, setYumusDrawerAcik] = useState(false) // yumuşak

  // ─── Devre fetch ───
  // Spool yüklenince devre_id ile devre bilgisini al — iş emri, devre adı,
  // zone + spool null kolonları için fallback (malzeme, yüzey, ağırlık).
  useEffect(() => {
    if (!yerelSpool?.devre_id) return
    let iptal = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('devreler')
          .select('id, devre_no, zone, is_emri_no, agirlik, malzeme, yuzey, ad, proje_id')
          .eq('id', yerelSpool.devre_id)
          .maybeSingle()
        if (error || iptal) return
        if (data) setDevre(data)
      } catch (e) {
        console.warn('[IbSpoolDetay] devre yüklenemedi:', e)
      }
    })()
    return () => { iptal = true }
  }, [yerelSpool?.devre_id])

  // ─── Proje fetch ───
  // Devre yüklenince proje_id ile proje bilgisini al — proje_no üst banttaki
  // kimlik string'inde kullanılır (örn. "NB1137-AT100-..."). gemi_adi 68b'de
  // bilinçli olarak çıkarıldı (UI'da hiç gösterilmemeliydi).
  useEffect(() => {
    if (!devre?.proje_id) return
    let iptal = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('projeler')
          .select('id, proje_no')
          .eq('id', devre.proje_id)
          .maybeSingle()
        if (error || iptal) return
        if (data) setProje(data)
      } catch (e) {
        console.warn('[IbSpoolDetay] proje yüklenemedi:', e)
      }
    })()
    return () => { iptal = true }
  }, [devre?.proje_id])

  // ─── Testler sayım fetch ───
  // Devreye en az 1 test tanımlıysa yumuşak drawer'da "Test tanımlanmış"
  // mavi kartı gösterilecek. (Testler devre seviyesinde tanımlı, spool
  // seviyesi sonuçlar 68b'de eklenecek — test_spooller join.)
  useEffect(() => {
    if (!yerelSpool?.devre_id) return
    let iptal = false
    ;(async () => {
      try {
        const { count, error } = await supabase
          .from('testler')
          .select('id', { count: 'exact', head: true })
          .eq('devre_id', yerelSpool.devre_id)
        if (error || iptal) return
        setTestlerSayi(count || 0)
      } catch (e) {
        console.warn('[IbSpoolDetay] testler sayilamadi:', e)
      }
    })()
    return () => { iptal = true }
  }, [yerelSpool?.devre_id])

  // ─── Notlar fetch ───
  // notlar tablosu: spool seviyesi (spool_id) veya devre seviyesi (devre_id).
  // Filtre: tenant_id + silindi=false + qr_goster=true.
  // qr_goster=false olan iç-idari notlar drawer'a sızmaz (Notlar sekmesi
  // ilerideki bir oturumda hepsini ayrı UI'da gösterecek). Sıralama
  // olusturma DESC — en yeni not ilk kart.
  useEffect(() => {
    if (!yerelSpool?.id) return
    const tenantId = kullanici?.tenant_id || yerelSpool.tenant_id
    if (!tenantId) return
    let iptal = false
    ;(async () => {
      try {
        const orFiltre = yerelSpool.devre_id
          ? `spool_id.eq.${yerelSpool.id},devre_id.eq.${yerelSpool.devre_id}`
          : `spool_id.eq.${yerelSpool.id}`
        const { data, error } = await supabase
          .from('notlar')
          .select('id, metin, olusturma')
          .eq('tenant_id', tenantId)
          .eq('silindi', false)
          .eq('qr_goster', true)
          .or(orFiltre)
          .order('olusturma', { ascending: false })
        if (error || iptal) return
        setNotlar(Array.isArray(data) ? data : [])
      } catch (e) {
        console.warn('[IbSpoolDetay] notlar yüklenemedi:', e)
      }
    })()
    return () => { iptal = true }
  }, [yerelSpool?.id, yerelSpool?.devre_id, kullanici?.tenant_id])

  // ─── Yumuşak uyarı kartlarını topla ───
  // 3 kategori: Alıştırma kırmızı (spool.alistirma VAR/KISMI), Test mavi
  // (devreye test tanımlı), Not sarı (notlar tablosundan, her not ayrı kart).
  const yumusKartlar = useMemo(() => {
    const liste = []
    if (!yerelSpool) return liste

    // Alıştırma kartı (kırmızı) — VAR/KISMI
    const alis = String(yerelSpool.alistirma || '').toUpperCase()
    if (alis === 'VAR' || alis === 'KISMI') {
      liste.push({
        _key:     'alis',
        kategori: 'alistirma',
        baslik:   tv('m_ib_uy_yu_alis_baslik', 'Bu spool kaynatılmayacak'),
        mesaj:    tv('m_ib_uy_yu_alis_mesaj',  'Alıştırma (prefab) spool — kaynak işlemi uygulanmaz. Sadece montaj yapılacak.'),
      })
    }

    // Test kartı (mavi) — devreye en az 1 test tanımlıysa
    if (testlerSayi > 0) {
      liste.push({
        _key:     'test',
        kategori: 'test',
        baslik:   tv('m_ib_uy_yu_test_baslik', 'Test tanımlanmış'),
        mesaj:    tv('m_ib_uy_yu_test_mesaj',  'Bu devreye test tanımlanmıştır. Çalışma tamamlandığında test kontrol edilecek.'),
      })
    }

    // Not kartları (sarı) — her not ayrı kart, olusturma DESC
    notlar.forEach(n => {
      if (!n?.metin) return
      liste.push({
        _key:     `not_${n.id}`,
        kategori: 'not',
        baslik:   tv('m_ib_uy_yu_not_baslik', 'Dikkat Edilecekler'),
        mesaj:    String(n.metin),
      })
    })

    return liste
  }, [yerelSpool, testlerSayi, notlar, tv])

  // ─── Akış-kesici uyarı kontrolü ───
  // Mount + spool değişiminde değerlendirilir. Öncelik: devamEdiyor > alternatifBasamak.
  useEffect(() => {
    if (!yerelSpool) return

    // 1. devamEdiyor — başkasının aktif işi
    if (yerelSpool.is_durumu === 'devam_ediyor') {
      const aktifIsciId = yerelSpool.aktif_isci_id || yerelSpool.aktif_kullanici_id
      const benimMi = aktifIsciId && kullanici?.id && aktifIsciId === kullanici.id
      if (!benimMi) {
        setUyariDrawer({
          tip: 'devamEdiyor',
          payload: {
            operatorAd: yerelSpool.aktif_isci_ad || yerelSpool.son_isci_ad || '',
          },
        })
        return
      }
    }

    // 2. alternatifBasamak — SADECE kaynak ailesi içinde (argon ↔ gazaltı).
    // Diğer basamak uyumsuzlukları için drawer açılmaz; iş başlatma izni
    // RLS/yetki kontrolüyle DB tarafında yapılır. İlk operatör senaryosu
    // (örn. imalatçı ön imalat bekleyen spool'a okutmuşsa) drawer çıkmaz.
    if (yerelSpool.aktif_basamak && aktifRol?.ad) {
      const aktif = String(yerelSpool.aktif_basamak).toLowerCase()
      const rol   = String(aktifRol.ad).toLowerCase()
      const kaynakMi = (str) =>
        str.includes('argon') || str.includes('gazalti') || str.includes('gazaltı')
      const farkliKaynakTuru =
        kaynakMi(aktif) && kaynakMi(rol) &&
        !(aktif.includes('argon') && rol.includes('argon')) &&
        !(aktif.includes('gazalt') && rol.includes('gazalt'))
      if (farkliKaynakTuru) {
        setUyariDrawer({
          tip: 'alternatifBasamakYetkili',
          payload: {
            aktifBasamak: yerelSpool.aktif_basamak,
            alternatif:   aktifRol.ad,
          },
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yerelSpool?.id])

  // ─── Yumuşak drawer otomatik aç ───
  // Akış-kesici varsa atla. İlk yüklemede yumuşak kart varsa drawer aç.
  useEffect(() => {
    if (uyariDrawer) return  // akış-kesici var → yumuşak atla
    if (yumusKartlar.length > 0) {
      setYumusDrawerAcik(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yerelSpool?.id])

  // ─── Drawer handler'ları ───
  function handleAkisKesiciKapat()    { setUyariDrawer(null) }
  function handleAkisKesiciAksiyon(aksiyon) {
    if (aksiyon === 'devral') {
      alert(tv('m_ib_sd_devral_placeholder', "(Devral akışı 68b'de eklenecek — foto çekme + DB update)"))
    } else if (aksiyon === 'alternatifeBasla') {
      alert(tv('m_ib_sd_alt_placeholder',    "(Alternatif başla akışı 68b'de eklenecek — DB update)"))
    }
    setUyariDrawer(null)
  }
  function handleYumusKapat()  { setYumusDrawerAcik(false) }
  function handlePeekTabBas() {
    if (yumusKartlar.length === 0) return  // pasif
    setYumusDrawerAcik(true)
  }

  // ─── Foot CTA handler'ları (placeholder) ───
  function iseBasla() { alert(tv('m_ib_sd_basla_placeholder', "(İşe Başla akışı 68b'de eklenecek)")) }
  function isiKapat() { alert(tv('m_ib_sd_kapat_placeholder', "(İşi Kapat akışı 68b'de eklenecek)")) }
  function notEkle()  { alert(tv('m_ib_sd_not_placeholder',   "(Not Ekle akışı 68b'de eklenecek)")) }
  function isiIptal() { alert(tv('m_ib_sd_iptal_placeholder', "(İptal Et akışı 68b'de eklenecek)")) }

  // ─── Render ───
  if (!yerelSpool) {
    return (
      <div style={s.merkezBos}>
        <p style={s.bosYazi}>{tv('m_ib_sd_spool_yok', 'Spool yok.')}</p>
        <button type="button" style={s.btnIkincil} onClick={onBaskaSpool}>
          {tv('m_ib_sd_baska', 'Başka spool tara')}
        </button>
      </div>
    )
  }

  const isDevamEdiyor = yerelSpool.is_durumu === 'devam_ediyor'
  const drawerAcikHerhangi = !!uyariDrawer || yumusDrawerAcik

  // Üst bant tek satır kimlik string — mockup formatı: "proje-pipeline-spool-rev"
  // Proje: projeler.proje_no (örn. "NB1137"). gemi_adi UI'a sızmaz (68b kararı).
  const ustBant = [
    proje?.proje_no,
    yerelSpool.pipeline_no,
    yerelSpool.spool_no,
    yerelSpool.rev,
  ].filter(Boolean).join('-') || '—'

  return (
    <div style={s.kapsayici}>

      {/* ───── Üst bant ───── */}
      <div style={isDevamEdiyor ? s.ustBantDevam : s.ustBant}>
        {isDevamEdiyor && <span style={s.pulseNokta} aria-hidden="true" />}
        <span style={s.ustBantYazi}>{ustBant}</span>
      </div>

      {/* Foto carousel placeholder */}
      <div style={s.fotoBlok}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--txd)" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>

      {/* Aktif rol + Spool ID + Peek tab satırı */}
      <div style={s.idSatir}>
        <span style={s.rolPill}>{aktifRol?.ad || '—'}</span>
        <span style={s.spoolPill}>{normalizeSpoolId(yerelSpool.spool_id)}</span>
        <button
          type="button"
          style={yumusKartlar.length > 0 ? s.peekAktif : s.peekPasif}
          onClick={handlePeekTabBas}
          disabled={yumusKartlar.length === 0}
          aria-label={tv('m_ib_sd_peek_aria', 'Uyarıları göster')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {yumusKartlar.length > 0 && (
            <span style={s.peekSayi}>{yumusKartlar.length}</span>
          )}
        </button>
      </div>

      {/* Sekmeler */}
      <div style={s.sekmeler}>
        <button
          type="button"
          style={aktifSekme === 'genel' ? s.sekmeAktif : s.sekme}
          onClick={() => setAktifSekme('genel')}
        >
          {tv('m_ib_sd_genel', 'Genel')}
        </button>
        <button
          type="button"
          style={aktifSekme === 'malzeme' ? s.sekmeAktif : s.sekme}
          onClick={() => setAktifSekme('malzeme')}
        >
          {tv('m_ib_sd_malzeme', 'Malzeme')}
        </button>
      </div>

      {/* İçerik */}
      <div style={s.icerikInner}>
        {aktifSekme === 'genel'   && <GenelPanel spool={yerelSpool} devre={devre} tv={tv} />}
        {aktifSekme === 'malzeme' && <MalzemePanel tv={tv} />}
      </div>

      {/* ───── Foot CTA ───── */}
      <div style={s.footWrap}>
        {!isDevamEdiyor ? (
          <>
            <button
              type="button"
              style={drawerAcikHerhangi ? s.footBtnYesilDisabled : s.footBtnYesilGhost}
              onClick={iseBasla}
              disabled={drawerAcikHerhangi}
            >
              {tv('m_ib_sd_basla', 'İşe Başla')}
            </button>
            <button type="button" style={s.footBtnIkincil} onClick={onBaskaSpool}>
              {tv('m_ib_sd_baska', 'Başka Spool Tara')}
            </button>
          </>
        ) : (
          <>
            <button type="button" style={s.footBtnKirmizi} onClick={isiKapat}>
              {tv('m_ib_sd_kapat', 'İşi Kapat')}
            </button>
            <button type="button" style={s.footBtnIkincil} onClick={notEkle}>
              {tv('m_ib_sd_not', 'Not Ekle')}
            </button>
            <button type="button" style={s.footBtnKirmiziGhost} onClick={isiIptal}>
              {tv('m_ib_sd_iptal', 'İptal Et')}
            </button>
          </>
        )}
      </div>

      {/* ───── Yumuşak uyarı drawer (inline, sağdan slide-in) ─────
          Mockup v14 final: kartlar + buton TEK BLOK dikey merkez.
          Transparan zemin → sayfa kısmen görünür, sadece kartlar opak. */}
      {yumusDrawerAcik && yumusKartlar.length > 0 && (
        <div style={s.yumusOverlay}>
          <div style={s.yumusBlok}>
            <div style={s.yumusKartYigin}>
              {yumusKartlar.map((kart) => (
                <YumusKart key={kart._key} kategori={kart.kategori} baslik={kart.baslik} mesaj={kart.mesaj} />
              ))}
            </div>
            <button type="button" style={s.yumusBtn} onClick={handleYumusKapat}>
              {tv('m_ib_uy_yu_anladim', 'Anladım, devam et')}
            </button>
          </div>
        </div>
      )}

      {/* ───── Akış-kesici drawer (IbUyariDrawer merkez modal) ───── */}
      {uyariDrawer && (
        <IbUyariDrawer
          tip={uyariDrawer.tip}
          payload={uyariDrawer.payload}
          onKapat={handleAkisKesiciKapat}
          onAksiyon={handleAkisKesiciAksiyon}
        />
      )}
    </div>
  )
}

// ─────────── Yumuşak uyarı kartı (inline) ───────────

function YumusKart({ kategori, baslik, mesaj }) {
  const stil = yumusKartStili(kategori)
  return (
    <div style={stil.kart}>
      <div style={stil.baslik}>{baslik}</div>
      <div style={stil.mesaj}>{mesaj}</div>
    </div>
  )
}

function yumusKartStili(kategori) {
  // Mockup v14 light-anthracite renk paleti
  if (kategori === 'alistirma') {
    return {
      kart:   { background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 8, padding: 14 },
      baslik: { fontSize: 15, fontWeight: 500, color: '#791F1F', marginBottom: 6 },
      mesaj:  { fontSize: 14, color: '#501313', lineHeight: 1.5 },
    }
  }
  if (kategori === 'test') {
    return {
      kart:   { background: '#E6F1FB', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: 14 },
      baslik: { fontSize: 15, fontWeight: 500, color: '#0C447C', marginBottom: 6 },
      mesaj:  { fontSize: 14, color: '#042C53', lineHeight: 1.5 },
    }
  }
  // not (sarı)
  return {
    kart:   { background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 8, padding: 14 },
    baslik: { fontSize: 15, fontWeight: 500, color: '#854F0B', marginBottom: 6 },
    mesaj:  { fontSize: 14, color: '#412402', lineHeight: 1.5, whiteSpace: 'pre-line' },
  }
}

// ─────────── Genel Paneli — mockup v13b uyumlu ───────────

function GenelPanel({ spool, devre, tv }) {
  // Malzeme/Yüzey/Ağırlık: spool null ise devreden inherit
  const malzemeRaw = spool.malzeme || devre?.malzeme || null
  // Capitalize (mockup: "Karbon Çelik" gibi büyük harfle başlayan)
  const malzemeDeger = malzemeRaw
    ? malzemeRaw.charAt(0).toLocaleUpperCase('tr-TR') + malzemeRaw.slice(1)
    : null
  const malzemeKalite = [malzemeDeger, spool.kalite].filter(Boolean).join(' · ')

  // Türkçe sayı formatı (virgül) — mockup "219,1 mm" / "12,5 kg" tarzı
  const capDeger = spool.dis_cap_mm
    ? `${parseFloat(spool.dis_cap_mm).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} mm`
    : null
  const agirlikRaw = spool.agirlik || spool.agirlik_kg || devre?.agirlik
  const agirlikDeger = agirlikRaw
    ? `${parseFloat(agirlikRaw).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`
    : null

  // Yüzey: "galvaniz" → "Galvaniz" (ilk harf büyük)
  const yuzeyRaw = spool.yuzey || spool.yuzey_islemi || devre?.yuzey
  const yuzeyDeger = yuzeyRaw
    ? yuzeyRaw.charAt(0).toLocaleUpperCase('tr-TR') + yuzeyRaw.slice(1)
    : null

  // Devre adı: "262- Tank Connection — AT100-Galv"
  const devreAdi = devre
    ? [devre.devre_no, devre.zone].filter(Boolean).join(' — ')
    : null

  // Durum: Türkçe değer (`durum`) öncelikli, slug (`is_durumu`) fallback
  const durumDeger = spool.durum || spool.is_durumu

  // Aktif basamak: slug → görünen ad (basamak_snapshot içinden)
  const basamakDeger = basamakLabel(spool.aktif_basamak, spool.basamak_snapshot)

  const satirlar = [
    { etiket: tv('m_ib_sd_g_is_emri',        'İş Emri'),          deger: devre?.is_emri_no },
    { etiket: tv('m_ib_sd_g_devre',          'Devre'),            deger: devreAdi },
    { etiket: tv('m_ib_sd_g_cap',            'Çap'),              deger: capDeger },
    { etiket: tv('m_ib_sd_g_agirlik',        'Ağırlık'),          deger: agirlikDeger },
    { etiket: tv('m_ib_sd_g_malzeme_kalite', 'Malzeme / Kalite'), deger: malzemeKalite || malzemeDeger || null },
    { etiket: tv('m_ib_sd_g_yuzey',          'Yüzey İşlem'),      deger: yuzeyDeger },
    { etiket: tv('m_ib_sd_g_alistirma',      'Alıştırma'),        deger: spool.alistirma, badge: alistirmaBadgeStili(spool.alistirma) },
    { etiket: tv('m_ib_sd_g_durum',          'Durum'),            deger: durumDeger },
    { etiket: tv('m_ib_sd_g_basamak',        'Aktif basamak'),    deger: basamakDeger },
    { etiket: tv('m_ib_sd_g_ilerleme',       'İlerleme'),         deger: spool.ilerleme != null ? `%${spool.ilerleme}` : null },
  ]

  return (
    <div>
      {satirlar.map((sat, i) => (
        <div key={i} style={i === satirlar.length - 1 ? s.gpSatirSon : s.gpSatir}>
          <span style={s.gpEtiket}>{sat.etiket}</span>
          {sat.badge && sat.deger ? (
            <span style={{ ...s.gpBadge, ...sat.badge }}>{sat.deger}</span>
          ) : (
            <span style={s.gpDeger}>{sat.deger || '—'}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function MalzemePanel({ tv }) {
  return (
    <div style={s.merkezBos}>
      <p style={s.bosYazi}>
        {tv('m_ib_sd_malzeme_yakinda', "Malzeme listesi 68b'de eklenecek.")}
      </p>
    </div>
  )
}

// ─────────── Helpers ───────────

function normalizeSpoolId(rawId) {
  if (!rawId) return '—'
  const m = String(rawId).match(/^([A-Z]{1,4})-0*(\d{4,6})$/)
  if (!m) return rawId
  const [, prefix, num] = m
  const onlemli = num.padStart(4, '0').slice(-4)
  return `${prefix}-${onlemli}`
}

function alistirmaBadgeStili(deger) {
  if (!deger) return null
  const v = String(deger).toUpperCase()
  if (v === 'VAR' || v === 'KISMI') {
    return { background: 'rgba(229,62,62,0.12)', color: 'var(--re)' }
  }
  if (v === 'YOK') {
    return { background: 'rgba(34,197,94,0.12)', color: '#16a34a' }
  }
  return null
}

// Aktif basamak slug'ından görünen ad — basamak_snapshot JSON içinden çevir.
// Örn: "on_imalat" → "Ön İmalat"
//
// basamak_snapshot'ta aynı sistem_adi için birden fazla görünen_ad olabilir
// (sistem_adi="on_imalat" → "Başlamadı" placeholder + "Ön İmalat" gerçek ad
// gibi). Placeholder satırlarını atlayıp gerçek görünen adı bul.
function basamakLabel(slug, snapshot) {
  if (!slug) return null
  if (!Array.isArray(snapshot)) return slug
  const found = snapshot.find(b =>
    b && b.sistem_adi === slug && b.gorunen_ad && b.gorunen_ad !== 'Başlamadı'
  )
  return found?.gorunen_ad || slug
}

// ─────────── Stiller ───────────

const s = {
  // Kapsayıcı — TEK scroll alanı (foot dahil her şey kayar, sadece üst bant sticky)
  // Cihat 68 (Adım 3a-final iter2): üst bant dışında her şey kaysın.
  kapsayici: {
    height: 'calc(100dvh - 56px - 80px)',
    overflowY: 'auto',
    background: 'var(--bg)',
    color: 'var(--tx)',
    position: 'relative',  // yumuşak drawer overlay için
  },

  // Üst bant — sticky top
  ustBant: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 16px',
    background: 'var(--sur)',
    borderBottom: '1px solid var(--bor)',
  },
  ustBantDevam: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 16px',
    background: '#fef3c7',
    borderBottom: '1px solid #fcd34d',
  },
  ustBantYazi: {
    fontSize: 17,
    fontWeight: 500,
    color: 'var(--tx)',
    lineHeight: 1.3,
    wordBreak: 'break-all',
  },
  pulseNokta: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 6px rgba(34,197,94,0.8)',
    flexShrink: 0,
    animation: 'ibSdPulse 1.4s ease-in-out infinite',
  },

  // Foto blok
  fotoBlok: {
    flexShrink: 0,
    height: 200,
    background: 'var(--sur2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ID satırı
  idSatir: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '14px 16px 12px',
    background: 'var(--sur)',
  },
  rolPill: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ac)',
    background: 'rgba(45,142,255,0.12)',
    padding: '5px 12px',
    borderRadius: 8,
  },
  spoolPill: {
    fontSize: 15,
    fontWeight: 500,
    color: '#3C3489',
    background: '#EEEDFE',
    padding: '5px 14px',
    borderRadius: 8,
    letterSpacing: 0.3,
    fontFamily: "'Barlow Condensed', sans-serif",
  },
  // Peek tab — yumuşak uyarı varsa sarı + sayı
  peekAktif: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 11px',
    background: '#FAEEDA',
    color: '#854F0B',
    border: '0.5px solid #FAC775',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  // Peek tab pasif — yumuşak uyarı yoksa gri
  peekPasif: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 11px',
    background: 'transparent',
    color: 'var(--txd)',
    border: '0.5px solid var(--bor)',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  peekSayi: {
    fontWeight: 600,
  },

  // Sekmeler
  sekmeler: {
    flexShrink: 0,
    display: 'flex',
    background: 'var(--sur)',
    borderTop: '1px solid var(--bor)',
    borderBottom: '1px solid var(--bor)',
  },
  sekme: {
    flex: 1,
    padding: '12px 0',
    background: 'transparent',
    color: 'var(--txd)',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  sekmeAktif: {
    flex: 1,
    padding: '12px 0',
    background: 'transparent',
    color: 'var(--tx)',
    border: 'none',
    borderBottom: '2px solid var(--tx)',
    marginBottom: '-1px',
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },

  // İçerik padding (artık ayrı scroll değil, kapsayıcı doğrudan scroll yapıyor)
  icerikInner: {
    padding: '4px 16px',
    background: 'var(--sur)',
  },

  // Genel paneli satırları
  gpSatir: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--bor)',
    fontSize: 14,
    gap: 12,
  },
  gpSatirSon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: 14,
    gap: 12,
  },
  gpEtiket: {
    color: 'var(--txd)',
    flexShrink: 0,
  },
  gpDeger: {
    color: 'var(--tx)',
    fontWeight: 500,
    textAlign: 'right',
    overflowWrap: 'anywhere',
  },
  gpBadge: {
    fontSize: 14,
    fontWeight: 500,
    padding: '3px 10px',
    borderRadius: 8,
  },

  // Boş durum
  merkezBos: {
    padding: 32,
    textAlign: 'center',
  },
  bosYazi: {
    fontSize: 14,
    color: 'var(--txd)',
    margin: '0 0 16px',
  },
  btnIkincil: {
    padding: '10px 20px',
    background: 'transparent',
    color: 'var(--tx)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
  },

  // Foot CTA
  footWrap: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 16px 16px',
    background: 'var(--sur)',
    borderTop: '1px solid var(--bor)',
  },
  footBtnYesilGhost: {
    width: '100%',
    padding: 14,
    background: 'rgba(34,197,94,0.12)',
    color: '#16a34a',
    border: '1px solid rgba(34,197,94,0.4)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  footBtnYesilDisabled: {
    width: '100%',
    padding: 14,
    background: 'var(--sur2)',
    color: 'var(--txd)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'not-allowed',
  },
  footBtnIkincil: {
    width: '100%',
    padding: 14,
    background: 'transparent',
    color: 'var(--txd)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  footBtnKirmizi: {
    width: '100%',
    padding: 14,
    background: 'var(--re)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  footBtnKirmiziGhost: {
    width: '100%',
    padding: 14,
    background: 'transparent',
    color: 'var(--re)',
    border: '1px solid var(--re)',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },

  // ───── Yumuşak drawer (inline, sağdan slide-in 320px) ─────
  // Mockup v14 final: transparan zemin, sadece kartlar opak,
  // kart yığını + "Anladım" buton TEK BLOK dikey merkez.
  yumusOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    maxWidth: '100%',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    zIndex: 50,
    pointerEvents: 'none', // sadece blok tıklanabilir
  },
  yumusBlok: {
    pointerEvents: 'auto',
  },
  yumusKartYigin: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  yumusBtn: {
    marginTop: 14,
    width: '100%',
    padding: 14,
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
}

// Pulse + fade keyframe'leri
if (typeof document !== 'undefined') {
  const KEYFRAME_ID = 'ib-sd-keyframes'
  if (!document.getElementById(KEYFRAME_ID)) {
    const styleEl = document.createElement('style')
    styleEl.id = KEYFRAME_ID
    styleEl.textContent = `
      @keyframes ibSdPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.4; transform: scale(0.85); }
      }
      @keyframes ibUyFade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `
    document.head.appendChild(styleEl)
  }
}
