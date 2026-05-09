// mobile/src/components/isbaslat/IbSpoolDetay.jsx
// AresPipe — İş Başlat Ekran 3 (Spool Detay) — 69. oturum (Adım 3b + fix3 + 3c + fix)
//
// 67'de v9-v16 mockup turuyla kilitlenen tasarımı birebir hayata geçirir.
// Mockup referansları: ekran3_v13_*.html, v13b_*.html, v14_*.html.
//
// Bu dosyada:
// - Üst bant tek satır kimlik string (proje-pipeline-spool-rev birleşik) +
//   devam_ediyor durumunda sarı + yeşil pulse nokta (gemi_adi sızmaz, MK-68.3)
// - Foto carousel 200px (3b — fotograflar tablosu, prev/next, sayaç, meta chip)
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
// Bilinçli ertelenenler (69 sonrası):
// - Foto fullscreen tap-to-zoom (ayrı IbFotoViewer component, 70+)
// - Yetki kontrolü + Footer CTA branchleri (3d, sıradaki iş)
// - Devral foto akışı, alternatife başla DB update (3g/3h)
// - basamak_tanimlari label (slug → "Ön İmalat" gibi okunaklı görünüm)
// - İşe Başla / İşi Kapat / Not Ekle / İptal Et gerçek akışlar (3e/3f/3i/3j)
// - Genel paneli'nde Büküm / Markalama / Kesim ilerleme badge'leri (3l, agregat)
// - QR okutunca sertifikalı malzeme uyarısı (SED — IbUyariDrawer'a yeni
//   "sertifikalı malzeme dikkat" tipi eklenecek)
// - Spool'a sertifika evrakı yükleme akışı (SED — belgeler tablosu, devre
//   kalite dosyası agregasyonu)
// - m_ib_uy_yu_* anahtar setinin lang/tr,en,ar.json'a toplu eklenmesi
//   (alis/test/anladim/not — şu an hepsi tv() fallback ile çalışıyor)
//
// 68b'de eklendi:
// - Notlar drawer wiring (notlar tablosu fetch + sarı kart üreticisi,
//   spool_id veya devre_id eşleşmesi, qr_goster=true filtresi)
// - Üst banttan gemi_adi çıkarıldı (MK-68.3, UI'a sızmaması gerekiyordu)
//
// 69'da (Adım 3b) eklendi:
// - Foto carousel: fotograflar tablosu fetch (spool_id eq + olusturma DESC)
// - yukleyen_id → ad_soyad lookup (ayrı sorgu, embed RLS 400 riski yok)
// - 0 foto → mevcut placeholder; ≥1 → resim + meta chip; ≥2 → +nav + sayaç
// - Meta chip: islem_turu i18n (m_ib_foto_islem_*) · ad_soyad · GG Ay (locale)
//
// 69'da (Adım 3b-fix3, signed URL endpoint geçişi):
// - dosyaUrlAl helper (mobile/src/lib/dosya.js): /api/dosya-url-al
//   endpoint'ini çağırır. Endpoint server-side service_key kullanır
//   (RLS bypass), JWT'den okunan tenant_id path ile karşılaştırılır.
// - Önce supabase-js client'ın createSignedUrl'i denenmişti (3b-fix2)
//   ama bucket policy'leri storage.objects SELECT'i normal kullanıcılara
//   açmıyor → "Object not found" döndü. Endpoint doğru kanal.
// - Web tarafındaki ARES.dosyaUrlAl pattern'inin birebir muadili — aynı
//   cache mantığı (5 dk buffer), aynı error handling.
// - VITE_API_BASE env var (mobile/.env) → https://arespipe.vercel.app
// - onError: console.error log + img display:none. Eski "visibility:hidden"
//   sessiz hata gizliyordu, debug imkansızdı.
// - fotoCarouselWrap background #000 → var(--sur2): kırık img'de siyah
//   ekran yerine gri sur2 zemin (kullanıcı durumu anlar).
//
// 69'da (Adım 3c, Malzeme paneli BOM + heat inline edit):
// - spool_malzemeleri tablosu fetch (11 kolon, DB sırası — web pattern)
// - MalzemePanel placeholder yerine kart-tabanlı liste (mobile 380px'e
//   uygun, web 13-kolon tablo değil dikey kart). Her kart: #sıra · kod ·
//   tip chip · sertifikalı (varsa) · tanım · malzeme/kalite · ölçü
//   satırı · heat input.
// - Heat inline edit: input onBlur → heatKaydet(id, val). DB UPDATE +
//   state local güncelle + flash feedback (border mavi → yeşil/kırmızı,
//   1.2sn / 2sn). Web'in heatKaydet pattern'inin birebir muadili.
// - Sertifika READ-ONLY (mühendislik kararı, operatör değiştiremez).
//   ✓ chip yeşil, sertifikali=true ise görünür. Toggle yok.
// - Tip chip 4 renk grubu: boru=teal, flans/reduktor=mor,
//   dirsek/fitting/te=amber, bilinmeyen=gri.
// - 6 yeni i18n: m_ib_sd_malzeme_{birim, sert_kisa, heat_label,
//   heat_placeholder, bos, kayit_hatasi} × 3 dil = 18 satır.

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { dosyaUrlAl } from '../../lib/dosya'
import { aktifBasamakYetkili, basamakAdi, aktifIsKaydet, aktifIsHatirla, aktifIsUnut } from '../../lib/isbaslat'
import IbUyariDrawer from './IbUyariDrawer'

export default function IbSpoolDetay({
  spool,
  aktifRol,
  kullanici,
  bloklar = [],
  onBaskaSpool,
  onGeri,
}) {
  const { tv } = useT()

  const navigate = useNavigate()
  const [yerelSpool, setYerelSpool] = useState(spool)
  const [devre, setDevre] = useState(null)
  const [proje, setProje] = useState(null)
  const [testlerSayi, setTestlerSayi] = useState(0)
  const [notlar, setNotlar] = useState([])
  const [fotograflar, setFotograflar] = useState([])
  const [fotoIdx, setFotoIdx] = useState(0)
  const [kullaniciAdMap, setKullaniciAdMap] = useState({})
  const [malzemeler, setMalzemeler] = useState([])
  // heatKayitDurumu: { [malzemeId]: 'kaydediyor' | 'basarili' | 'hata' }
  // Kaydet sonrası 1.2sn 'basarili'/'hata' gösterilir, sonra silinir.
  const [heatKayitDurumu, setHeatKayitDurumu] = useState({})
  const [aktifSekme, setAktifSekme] = useState('genel')
  const [uyariDrawer, setUyariDrawer] = useState(null)        // akış-kesici
  // 3f.1: 'peek' (mevcut tap-to-expand) | 'kapat' (yeni kapat onay) | null (kapalı)
  const [yumusDrawerMod, setYumusDrawerMod] = useState(null)
  const yumusDrawerAcik = yumusDrawerMod !== null  // backward-compat alias
  function setYumusDrawerAcik(val) { setYumusDrawerMod(val ? 'peek' : null) } // yumuşak

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

  // ─── Fotograflar fetch ───
  // fotograflar tablosu: spool_id eq + olusturma DESC (en yeni önde).
  // yukleyen_id → ad_soyad lookup AYRI sorgu (Promise.all içinde):
  // embed select('*, kullanicilar(ad_soyad)') RLS 400 + FK disambiguate
  // riskini taşıyor (MDrawer'daki tenants(ad) deneyiminin dersi).
  // Spool değişiminde fotoIdx 0'a sıfırlanır.
  //
  // 3b-fix3: dosya_url path ise dosyaUrlAl helper'ı /api/dosya-url-al
  // endpoint'ine soracak. Endpoint server-side service_key ile RLS bypass
  // yapar + tenant_id check. Promise.all ile paralel — render anında
  // ek async iş yok. dosyaUrlAl 5 dk buffer'lı cache içeriyor (lib/dosya.js),
  // tek session'da tek spool aynı foto için tek fetch yapılır.
  useEffect(() => {
    if (!yerelSpool?.id) return
    let iptal = false
    ;(async () => {
      try {
        const { data: foto, error } = await supabase
          .from('fotograflar')
          .select('id, dosya_url, yukleyen_id, islem_turu, olusturma')
          .eq('spool_id', yerelSpool.id)
          .order('olusturma', { ascending: false })
        if (error || iptal) return
        const liste = Array.isArray(foto) ? foto : []

        // Signed URL paralel üretim — backend endpoint üzerinden (private bucket)
        const cozumlu = await Promise.all(
          liste.map(async (f) => {
            const cozulmus_url = await dosyaUrlAl(f.dosya_url)
            return { ...f, cozulmus_url }
          })
        )
        if (iptal) return
        setFotograflar(cozumlu)
        setFotoIdx(0)

        // Unique yukleyen_id'leri toplu ad_soyad'a çevir (0 foto → skip)
        const userIds = [...new Set(liste.map(f => f.yukleyen_id).filter(Boolean))]
        if (userIds.length === 0) {
          setKullaniciAdMap({})
          return
        }
        const { data: users, error: userErr } = await supabase
          .from('kullanicilar')
          .select('id, ad_soyad')
          .in('id', userIds)
        if (userErr || iptal) return
        const map = {}
        ;(users || []).forEach(u => { if (u?.id) map[u.id] = u.ad_soyad || '' })
        setKullaniciAdMap(map)
      } catch (e) {
        console.warn('[IbSpoolDetay] fotograflar yüklenemedi:', e)
      }
    })()
    return () => { iptal = true }
  }, [yerelSpool?.id])

  // ─── Spool malzemeleri fetch (3c) ───
  // BOM listesi (read-only görüntü + heat inline edit). DB sırası korunur
  // (web pattern). 11 kolon: kod, tip, tanim, malzeme, kalite, dis_cap_mm,
  // et_mm, boy_mm, agirlik_kg, sertifikali, heat_no.
  useEffect(() => {
    if (!yerelSpool?.id) return
    let iptal = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('spool_malzemeleri')
          .select('id, kod, tip, tanim, malzeme, kalite, dis_cap_mm, et_mm, boy_mm, agirlik_kg, sertifikali, heat_no')
          .eq('spool_id', yerelSpool.id)
        if (error || iptal) return
        setMalzemeler(Array.isArray(data) ? data : [])
      } catch (e) {
        console.warn('[IbSpoolDetay] malzemeler yüklenemedi:', e)
      }
    })()
    return () => { iptal = true }
  }, [yerelSpool?.id])

  // ─── Yumuşak uyarı kartlarını topla ───
  // 4 kategori (70. oturum 3d, doygun palet):
  //   Alıştırma kırmızı (spool.alistirma VAR/KISMI)
  //   Sertifika mavi (spool_malzemeleri.sertifikali=true — SED-69-04)
  //   Test mor (devreye test tanımlı)
  //   Not amber (notlar tablosundan, her not ayrı kart, olusturma DESC)
  // Sıra: alıştırma → sertifika → test → not (kritiklik azalan).
  const yumusKartlar = useMemo(() => {
    const liste = []
    if (!yerelSpool) return liste

    // Alıştırma kartları (70. oturum 3d-fix3): VAR ve KISMI farklı semantik.
    //   VAR   → 'alistirma'        (kırmızı): spool tamamen alıştırma, kaynak yok
    //   KISMI → 'alistirma_kismi'  (coral):   bazı parçalar alıştırma, bantlama gerek
    const alis = String(yerelSpool.alistirma || '').toUpperCase()
    if (alis === 'VAR') {
      liste.push({
        _key:     'alis',
        kategori: 'alistirma',
        baslik:   tv('m_ib_uy_yu_alis_var_baslik', 'Bu spool kaynatılmayacak'),
        mesaj:    tv('m_ib_uy_yu_alis_var_mesaj',  'Spool tamamen alıştırma (prefab) — kaynak yapılmayacak. Sadece montaj.'),
      })
    } else if (alis === 'KISMI') {
      liste.push({
        _key:     'alis',
        kategori: 'alistirma_kismi',
        baslik:   tv('m_ib_uy_yu_alis_kismi_baslik', 'Kısmi alıştırma'),
        mesaj:    tv('m_ib_uy_yu_alis_kismi_mesaj',  'Bu spoolda kaynatılmayacak yerler var. Bantlayarak ayırın, çizimi kontrol edin.'),
      })
    }

    // Sertifika kartı (mavi) — sertifikalı malzeme varsa (70. oturum, SED-69-04)
    const sertMalzemeler = malzemeler.filter(m => m && m.sertifikali === true)
    if (sertMalzemeler.length > 0) {
      const ilk3Kod = sertMalzemeler.slice(0, 3).map(m => m.kod).filter(Boolean)
      const fazlaSayi = sertMalzemeler.length - ilk3Kod.length
      const kodListesi = ilk3Kod.length
        ? ilk3Kod.join(', ') + (fazlaSayi > 0 ? ` ve ${fazlaSayi} diğer` : '')
        : '—'
      liste.push({
        _key:     'sertifika',
        kategori: 'sertifika',
        baslik:   tv('m_ib_uy_yu_sert_baslik', 'Sertifikalı malzeme'),
        mesaj:    tv('m_ib_uy_yu_sert_mesaj',
                      'Bu spoolda {sayi} adet sertifikalı malzeme var (MTC gerekli). Yanlış malzeme kullanmamaya dikkat et: {liste}')
                    .replace('{sayi}', String(sertMalzemeler.length))
                    .replace('{liste}', kodListesi),
      })
    }

    // Test kartı (mor) — devreye en az 1 test tanımlıysa
    if (testlerSayi > 0) {
      liste.push({
        _key:     'test',
        kategori: 'test',
        baslik:   tv('m_ib_uy_yu_test_baslik', 'Test tanımlanmış'),
        mesaj:    tv('m_ib_uy_yu_test_mesaj',  'Bu devreye test tanımlanmıştır. Çalışma tamamlandığında test kontrol edilecek.'),
      })
    }

    // Not kartları (amber) — her not ayrı kart, olusturma DESC
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
  }, [yerelSpool, testlerSayi, notlar, malzemeler, tv])

  // ─── Akış-kesici uyarı kontrolü ───
  // Mount + spool değişiminde değerlendirilir.
  // Öncelik (70. oturum 3d-fix3):
  //   1. tamAlistirmaKaynak — VAR + kaynakçı (özel mesaj)
  //   2. yetkisiz           — genel yetki
  //   3. devamEdiyor        — başkasının aktif işi
  //   4. alternatifBasamak  — kaynak ailesi içi geçiş
  useEffect(() => {
    if (!yerelSpool) return

    // 1. tamAlistirmaKaynak (70. oturum 3d-fix3) — Spool tamamen alıştırma
    // ise kaynak yapılmaz. Kaynakçı operatöre "yetki yok" yerine net mesaj.
    // Diğer roller (büküm, kesim) yumuşak kart yeterli — bu kontrol kaynakçı
    // özelinde priority 1.
    const alistirmaUst = String(yerelSpool.alistirma || '').toUpperCase()
    const kaynakciRol = aktifRol?.ad === 'Argon Kaynağı' || aktifRol?.ad === 'Gazaltı Kaynağı'
    if (alistirmaUst === 'VAR' && kaynakciRol) {
      setUyariDrawer({ tip: 'tamAlistirmaKaynak', payload: {} })
      return
    }

    // 2. yetkisiz — operatör bu basamak için yetkili değil
    // Akış-kesici, "Anladım" ile kapatılır. Kapanınca yumuşak drawer otomatik
    // açılır (handleAkisKesiciKapat içinde zincirleme).
    if (!aktifBasamakYetkili(yerelSpool.aktif_basamak, bloklar)) {
      setUyariDrawer({ tip: 'yetkisiz', payload: {} })
      return
    }

    // 3. devamEdiyor — başkasının aktif işi
    // 70. oturum (3e): "kim çalışıyor" bilgisi DB'de yok (spooller.aktif_isci_id
    // kolonu yok). Web pattern'i izleyerek localStorage 'ares_is_aktif'
    // üzerinden okunur. Tek operatör tek cihaz varsayımı.
    if (yerelSpool.is_durumu === 'devam_ediyor') {
      const aktifIs = aktifIsHatirla()
      const benimMi = !!(aktifIs && aktifIs.id === yerelSpool.id)
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

    // 4. alternatifBasamak — SADECE kaynak ailesi içinde (argon ↔ gazaltı).
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
  // 70. oturum (3d): Akış-kesici kapatılınca yumuşak uyarı varsa drawer
  // otomatik açılır (zincirleme akış). Operatör peek tab'ı kaçırmasın.
  // 3f.1 (Vazgeç akışı): kapatOnay tipinde zincirleme YAPMA — operatör
  // "Vazgeç" basmış, drawer'ı kapatıp yumuşak drawer'a açmak yanıltıcı.
  function handleAkisKesiciKapat() {
    const onceki = uyariDrawer
    setUyariDrawer(null)
    if (onceki?.tip !== 'kapatOnay' && yumusKartlar.length > 0) {
      setYumusDrawerAcik(true)
    }
  }
  function handleAkisKesiciAksiyon(aksiyon) {
    if (aksiyon === 'devral') {
      alert(tv('m_ib_sd_devral_placeholder', "(Devral akışı 68b'de eklenecek — foto çekme + DB update)"))
    } else if (aksiyon === 'alternatifeBasla') {
      alert(tv('m_ib_sd_alt_placeholder',    "(Alternatif başla akışı 68b'de eklenecek — DB update)"))
    } else if (aksiyon === 'kapatOnayli') {
      // 3f.1: kapatOnay drawer'dan "Tamam, kapat" — DB writes + Hub'a yönlendir
      handleKapatOnayli()
      return  // kapat akışı kendi içinde drawer kapatır + navigate, zincirleme yok
    }
    setUyariDrawer(null)
    if (yumusKartlar.length > 0) {
      setYumusDrawerAcik(true)
    }
  }
  function handleYumusKapat()  { setYumusDrawerAcik(false) }
  function handlePeekTabBas() {
    if (yumusKartlar.length === 0) return  // pasif
    setYumusDrawerAcik(true)
  }

  // ─── Heat kaydet (3c) ───
  // Input onBlur tetikler. Eski değerle aynıysa noop. Trim + null normalize.
  // Kaydet sonrası state lokal güncellenir + 1.2sn 'basarili' / 'hata' flash.
  // Web pattern: spool_detay.html heatKaydet(id, val) — birebir muadil.
  async function heatKaydet(id, yeniHam) {
    const malzeme = malzemeler.find(m => m.id === id)
    if (!malzeme) return
    const yeni = (yeniHam || '').trim()
    const eski = malzeme.heat_no || ''
    if (yeni === eski) return // değişmemiş

    setHeatKayitDurumu(prev => ({ ...prev, [id]: 'kaydediyor' }))
    try {
      const { error } = await supabase
        .from('spool_malzemeleri')
        .update({ heat_no: yeni || null })
        .eq('id', id)
      if (error) throw error
      setMalzemeler(prev => prev.map(m => m.id === id ? { ...m, heat_no: yeni || null } : m))
      setHeatKayitDurumu(prev => ({ ...prev, [id]: 'basarili' }))
      setTimeout(() => {
        setHeatKayitDurumu(prev => {
          const y = { ...prev }
          delete y[id]
          return y
        })
      }, 2500)
    } catch (e) {
      console.warn('[heatKaydet] hata:', e)
      setHeatKayitDurumu(prev => ({ ...prev, [id]: 'hata' }))
      setTimeout(() => {
        setHeatKayitDurumu(prev => {
          const y = { ...prev }
          delete y[id]
          return y
        })
      }, 2000)
    }
  }

  // ─── Foot CTA handler'ları ───
  // iseBasla: 70. oturum 3e implementasyonu. Diğer handler'lar 3f/3i/3j'de.

  // 3e — İşe Başla akışı.
  // Web pattern (is_baslat.html:1131 isBaslatDB) birebir port:
  //   1. spooller UPDATE: is_durumu='devam_ediyor', guncelleme=now
  //   2. localStorage 'ares_is_aktif' yaz (kim çalışıyor — DB'de alan yok)
  //   3. Local state güncelle (Footer 3'lü buton'a otomatik geçer)
  //
  // is_kayitlari INSERT yapılmaz — web'de işi kapat akışında yapılıyor (3f).
  // Hata yönetimi: alert (geçici, 3f'te toast helper eklenebilir).
  async function iseBasla() {
    if (!yerelSpool || !kullanici) return
    if (drawerAcikHerhangi || !yetkili) return  // güvenlik gate'i (button disabled olsa da)

    try {
      const { error } = await supabase
        .from('spooller')
        .update({
          is_durumu:   'devam_ediyor',
          guncelleme:  new Date().toISOString(),
        })
        .eq('id', yerelSpool.id)

      if (error) {
        console.error('[iseBasla] UPDATE hatası:', error)
        alert(tv('m_ib_sd_basla_hata', 'İşe başlatılamadı: ') + (error.message || error.code || 'RLS?'))
        return
      }

      // Aktif iş kaydı (web pattern muadili — localStorage)
      aktifIsKaydet({
        spoolId: yerelSpool.id,
        rolAd:   aktifRol?.ad || '',
      })

      // Local state — Footer otomatik 3'lü buton'a geçer
      setYerelSpool(prev => ({ ...prev, is_durumu: 'devam_ediyor' }))
    } catch (e) {
      console.error('[iseBasla] beklenmeyen hata:', e)
      alert(tv('m_ib_sd_basla_hata', 'İşe başlatılamadı: ') + (e?.message || 'bilinmeyen'))
    }
  }

  // 3f.1 — İşi Kapat akışı (yumuşak drawer kapat modu VEYA sade onay drawer)
  // Foto akışı 3f.2'de, basamak seçim 3f.3'te eklenecek. Bu turda minimum:
  //   - Yumuşak uyarı varsa: yumuşak drawer kapat modunda açılır (kart listesi + 2 buton)
  //   - Yumuşak uyarı yoksa: sade onay drawer (IbUyariDrawer 'kapatOnay' tipi)
  function isiKapat() {
    if (!yerelSpool || !kullanici) return
    if (drawerAcikHerhangi || !yetkili) return
    if (yumusKartlar.length > 0) {
      setYumusDrawerMod('kapat')
    } else {
      setUyariDrawer({ tip: 'kapatOnay', payload: {} })
    }
  }

  // 3f.1 — Onaylı kapatma DB writes + temizlik + navigate.
  // R-06: Web isTamamla pattern'i tamamı NO (foto + basamak seçim 3f.2/3'te).
  // is_kayitlari INSERT'te DB schema'ya UYULUR, web'in yanlış kolon adları
  // (kullanici_id/basamak/tarih) DEĞİL — web INSERT muhtemelen NOT NULL
  // ihlaliyle sessizce fail ediyor (try/catch /* opsiyonel */).
  // baslangic = bitis = now() — sure_dakika kayıp, 3f.2'de düzeltilir.
  async function handleKapatOnayli() {
    if (!yerelSpool || !kullanici) return

    const simdi = new Date().toISOString()

    try {
      // 1. is_kayitlari INSERT (opsiyonel, başarısızsa UPDATE devam eder)
      const insertPayload = {
        tenant_id:    yerelSpool.tenant_id,
        spool_id:     yerelSpool.id,
        personel_id:  kullanici.id,
        islem_tipi:   yerelSpool.aktif_basamak || 'imalat',
        baslangic:    simdi,
        bitis:        simdi,
        sure_dakika:  0,
        qr_baslangic: true,
        qr_bitis:     false,
      }
      const { error: insErr } = await supabase
        .from('is_kayitlari')
        .insert(insertPayload)
      if (insErr) {
        console.warn('[handleKapatOnayli] is_kayitlari INSERT hatası (devam):', insErr)
      }

      // 2. spooller UPDATE — aktif_basamak DEĞİŞMEZ (3f.3'te ilerletilecek)
      const { error: updErr } = await supabase
        .from('spooller')
        .update({
          is_durumu:   'bekliyor',
          guncelleme:  simdi,
        })
        .eq('id', yerelSpool.id)

      if (updErr) {
        console.error('[handleKapatOnayli] spooller UPDATE hatası:', updErr)
        alert(tv('m_ib_sd_kapat_hata', 'İş kapatılamadı: ') + (updErr.message || updErr.code || 'RLS?'))
        return  // drawer'lar açık kalsın, operatör tekrar deneyebilir
      }

      // 3. Temizlik
      aktifIsUnut()
      setUyariDrawer(null)
      setYumusDrawerMod(null)

      // 4. Hub'a yönlendir — App.jsx kök rotası rolüne göre yönlendirir
      navigate('/')
    } catch (e) {
      console.error('[handleKapatOnayli] beklenmeyen hata:', e)
      alert(tv('m_ib_sd_kapat_hata', 'İş kapatılamadı: ') + (e?.message || 'bilinmeyen'))
    }
  }

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

  // 70. oturum (Adım 3d): Yetki kontrolü
  // Operatörün atanmış bloklarından biri spool'un aktif basamağı için
  // uyumluysa "İşe Başla" gösterilir; değilse info satırı + "Başka Spool".
  // Bilinmeyen basamak → false (güvenli default — yetki gate'i için
  // false-positive engellenir).
  const yetkili = aktifBasamakYetkili(yerelSpool.aktif_basamak, bloklar)

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

      {/* Foto carousel — 3b (69. oturum) */}
      <FotoCarousel
        fotograflar={fotograflar}
        idx={fotoIdx}
        setIdx={setFotoIdx}
        kullaniciAdMap={kullaniciAdMap}
        tv={tv}
      />

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
        {aktifSekme === 'malzeme' && (
          <MalzemePanel
            malzemeler={malzemeler}
            heatKaydet={heatKaydet}
            kayitDurumu={heatKayitDurumu}
            tv={tv}
          />
        )}
      </div>

      {/* ───── Foot CTA — 70. oturum (3d): durum × yetki matrisi ─────
          Yetkisizlik artık akış-kesici drawer ile bildirilir (useEffect
          priority 1). Footer'da "İşe Başla" disabled gösterilir, info
          satırı yok (mesaj drawer'da). */}
      <div style={s.footWrap}>
        {!isDevamEdiyor ? (
          <>
            <button
              type="button"
              style={(!yetkili || drawerAcikHerhangi) ? s.footBtnYesilDisabled : s.footBtnYesilGhost}
              onClick={iseBasla}
              disabled={!yetkili || drawerAcikHerhangi}
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
      {/* Yumuşak drawer 'peek' modu — sağ kenar overlay (mevcut tap-to-expand) */}
      {yumusDrawerMod === 'peek' && yumusKartlar.length > 0 && (
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

      {/* 3f.1 — Yumuşak drawer 'kapat' modu — full-screen onay modal (yumuşak uyarı VAR) */}
      {yumusDrawerMod === 'kapat' && yumusKartlar.length > 0 && (
        <div style={s.kapatOverlay}>
          <div style={s.kapatKart}>
            <p style={s.kapatBaslik}>{tv('m_ib_sd_son_kontrol', 'Son kontrol')}</p>
            <div style={s.kapatKartYigin}>
              {yumusKartlar.map((kart) => (
                <YumusKart key={kart._key} kategori={kart.kategori} baslik={kart.baslik} mesaj={kart.mesaj} />
              ))}
            </div>
            <div style={s.kapatBtnYigin}>
              <button type="button" style={s.kapatBtnIkincil} onClick={() => setYumusDrawerMod(null)}>
                {tv('m_ib_uy_iptal', 'Vazgeç')}
              </button>
              <button type="button" style={s.kapatBtnKirmizi} onClick={handleKapatOnayli}>
                {tv('m_ib_uy_tamam_kapat', 'Tamam, kapat')}
              </button>
            </div>
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
  const ikon = yumusKartIkon(kategori, stil.ikonRenk)
  return (
    <div style={stil.kart}>
      {ikon}
      <div style={stil.icerik}>
        <div style={stil.baslik}>{baslik}</div>
        <div style={stil.mesaj}>{mesaj}</div>
      </div>
    </div>
  )
}

// 70. oturum (3d): Kategori bazlı SVG ikonu (renk körü için redundancy).
// Alıştırma yasak, sertifika belge, test erlen, not belge+işaret.
function yumusKartIkon(kategori, renk) {
  const ortakProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: renk,
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { flexShrink: 0, marginTop: 1 },
    'aria-hidden': true,
  }
  if (kategori === 'alistirma' || kategori === 'alistirma_kismi') {
    // VAR ve KISMI aynı ikon (yasak) — semantik aile aynı, renk ayrı.
    return (
      <svg {...ortakProps}>
        <circle cx="12" cy="12" r="9" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  if (kategori === 'sertifika') {
    return (
      <svg {...ortakProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    )
  }
  if (kategori === 'test') {
    return (
      <svg {...ortakProps}>
        <path d="M9 2v6l-5 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-9V2" />
        <line x1="7" y1="2" x2="17" y2="2" />
        <line x1="7" y1="13" x2="17" y2="13" />
      </svg>
    )
  }
  // not
  return (
    <svg {...ortakProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13l-3 3-2-2-3 3" />
    </svg>
  )
}

function yumusKartStili(kategori) {
  // 70. oturum (3d): Doygun palet (Anthropic ramp 100/200 + 4px sol accent
  // + ikon). Pastel paletten geçiş — Cihat saha test geri bildirimi.
  // Kategoriler: alistirma kırmızı, sertifika mavi, test mor, not amber.
  const ortakKart = {
    display:    'flex',
    gap:        12,
    alignItems: 'flex-start',
    padding:    14,
    borderRadius: 8,
  }
  const ortakIcerik = { flex: 1, minWidth: 0 }
  const ortakBaslik = { fontSize: 15, fontWeight: 600, marginBottom: 4 }
  const ortakMesaj  = { fontSize: 14, lineHeight: 1.5 }

  if (kategori === 'alistirma') {
    return {
      kart:     { ...ortakKart, background: '#F7C1C1', border: '0.5px solid #F0997B', borderLeft: '4px solid #A32D2D' },
      icerik:   ortakIcerik,
      baslik:   { ...ortakBaslik, color: '#501313' },
      mesaj:    { ...ortakMesaj,  color: '#501313' },
      ikonRenk: '#501313',
    }
  }
  if (kategori === 'alistirma_kismi') {
    // 70. oturum (3d-fix3): KISMI alıştırma — coral (kırmızıdan ayrı, 'alistirma'
    // ile aynı aile ama daha yumuşak ton, kısmi/bantlama semantiği).
    return {
      kart:     { ...ortakKart, background: '#F5C4B3', border: '0.5px solid #F0997B', borderLeft: '4px solid #993C1D' },
      icerik:   ortakIcerik,
      baslik:   { ...ortakBaslik, color: '#712B13' },
      mesaj:    { ...ortakMesaj,  color: '#4A1B0C' },
      ikonRenk: '#712B13',
    }
  }
  if (kategori === 'sertifika') {
    return {
      kart:     { ...ortakKart, background: '#B5D4F4', border: '0.5px solid #85B7EB', borderLeft: '4px solid #185FA5' },
      icerik:   ortakIcerik,
      baslik:   { ...ortakBaslik, color: '#0C447C' },
      mesaj:    { ...ortakMesaj,  color: '#042C53' },
      ikonRenk: '#0C447C',
    }
  }
  if (kategori === 'test') {
    return {
      kart:     { ...ortakKart, background: '#CECBF6', border: '0.5px solid #AFA9EC', borderLeft: '4px solid #534AB7' },
      icerik:   ortakIcerik,
      baslik:   { ...ortakBaslik, color: '#26215C' },
      mesaj:    { ...ortakMesaj,  color: '#26215C' },
      ikonRenk: '#26215C',
    }
  }
  // not (amber)
  return {
    kart:     { ...ortakKart, background: '#FAC775', border: '0.5px solid #EF9F27', borderLeft: '4px solid #854F0B' },
    icerik:   ortakIcerik,
    baslik:   { ...ortakBaslik, color: '#412402' },
    mesaj:    { ...ortakMesaj,  color: '#412402', whiteSpace: 'pre-line' },
    ikonRenk: '#412402',
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

// ─────────── Malzeme Paneli — 3c (69. oturum) ───────────
//
// BOM listesi kart formatı (mobile 380px). Her malzeme bir kart:
//   #sıra · kod (mono) · tip chip [renkli] · ✓ sert (sağda, varsa)
//   tanım (m.tanim)
//   malzeme · kalite (TR-capitalize fallback)
//   ölçü satırı: Ø<dis_cap> × <et> × <boy> mm · <adet> ad · <agirlik> kg
//     (sadece dolu alanlar gösterilir, yoksa atlanır)
//   Heat: [input mono] (read+write — onBlur DB UPDATE)
//
// Heat girişi: input → onBlur → heatKaydet(id, val). Kaydet sırasında
// kayitDurumu[id] = 'kaydediyor' (border mavi). Başarılı: 'basarili'
// (border yeşil 1.2sn). Hata: 'hata' (border kırmızı 2sn).
//
// Sertifika: read-only chip. DB'deki sertifikali=true ise yeşil ✓.
// Operatör değiştiremez — mühendislik kararı (gemi gövdesi gibi kritik
// kaynaklar için MTC/3.1 sertifikası gereken malzemeler). 70+'da
// QR okutunca uyarı + sertifika evrakı yükleme akışı eklenecek (SED).
//
// Tip chip renk haritası (4 grup):
//   boru                          → teal
//   flans, reduktor               → mor (uç eleman)
//   dirsek, fitting, te (default) → amber (yön/fitting)
//   bilinmeyen                    → gri

function MalzemePanel({ malzemeler, heatKaydet, kayitDurumu, tv }) {
  if (!malzemeler || malzemeler.length === 0) {
    return (
      <div style={s.merkezBos}>
        <p style={s.bosYazi}>
          {tv('m_ib_sd_malzeme_bos', 'Henüz malzeme eklenmemiş')}
        </p>
      </div>
    )
  }

  const sertSayim = malzemeler.filter(m => m.sertifikali).length
  const sertKisa = tv('m_ib_sd_malzeme_sert_kisa', 'sert')
  const birim = tv('m_ib_sd_malzeme_birim', 'kalem')

  return (
    <div style={s.malzemeWrap}>
      <div style={s.malzemeBaslik}>
        <span>{malzemeler.length} {birim}</span>
        {sertSayim > 0 && (
          <span style={s.malzemeBaslikSert}>✓ {sertSayim} {sertKisa}</span>
        )}
      </div>
      {malzemeler.map((m, idx) => (
        <MalzemeKart
          key={m.id || `m_${idx}`}
          malzeme={m}
          sira={idx + 1}
          heatKaydet={heatKaydet}
          kayitDurumu={kayitDurumu[m.id]}
          tv={tv}
        />
      ))}
      <div style={{ height: 16 }} />
    </div>
  )
}

function MalzemeKart({ malzeme, sira, heatKaydet, kayitDurumu, tv }) {
  const [heatLocal, setHeatLocal] = useState(malzeme.heat_no || '')

  // malzeme.heat_no dış kaynaktan değişirse (başka tab/cihaz) state senkron
  useEffect(() => {
    setHeatLocal(malzeme.heat_no || '')
  }, [malzeme.heat_no])

  const tip = (malzeme.tip || '').toLowerCase()
  const tipStil = tipChipStili(tip)
  const tipEtiket = tip
    ? tip.charAt(0).toLocaleUpperCase('tr-TR') + tip.slice(1)
    : '—'

  const malzemeAd = malzeme.malzeme
    ? malzeme.malzeme.charAt(0).toLocaleUpperCase('tr-TR') + malzeme.malzeme.slice(1)
    : '—'
  const kalite = malzeme.kalite || '—'

  // Ölçü satırı (sadece dolu alanlar)
  const olculer = []
  if (malzeme.dis_cap_mm) olculer.push(`Ø ${formatSayi(malzeme.dis_cap_mm)}`)
  if (malzeme.et_mm)      olculer.push(`× ${formatSayi(malzeme.et_mm)}`)
  if (malzeme.boy_mm)     olculer.push(`× ${formatSayi(malzeme.boy_mm)}`)
  const olcuStr = olculer.length ? olculer.join(' ') + ' mm' : null

  // Heat input border rengi (kayit durumuna göre)
  let heatBorderColor = 'var(--bd)'
  if (kayitDurumu === 'kaydediyor') heatBorderColor = 'var(--ac)'
  else if (kayitDurumu === 'basarili') heatBorderColor = 'var(--gr)'
  else if (kayitDurumu === 'hata')     heatBorderColor = 'var(--re)'

  return (
    <div style={s.malzemeKart}>
      {/* Üst satır: sıra + kod + tip chip + sert chip */}
      <div style={s.malzemeUstSatir}>
        <div style={s.malzemeKodBlok}>
          <span style={s.malzemeSira}>#{sira}</span>
          <span style={s.malzemeKod}>{malzeme.kod || '—'}</span>
          {tip && <span style={{ ...s.tipChip, ...tipStil }}>{tipEtiket}</span>}
        </div>
        {malzeme.sertifikali && (
          <span style={s.sertChip}>✓ {tv('m_ib_sd_malzeme_sert_kisa', 'sert')}</span>
        )}
      </div>

      {/* Tanım */}
      {malzeme.tanim && <div style={s.malzemeTanim}>{malzeme.tanim}</div>}

      {/* Malzeme · Kalite */}
      <div style={s.malzemeAlt}>{malzemeAd} · {kalite}</div>

      {/* Ölçü satırı + adet + ağırlık */}
      {olcuStr && (
        <div style={s.malzemeOlcu}>
          <span>{olcuStr}</span>
          {malzeme.agirlik_kg && (
            <>
              <span style={s.malzemeNoktaAyrac}>·</span>
              <span>{formatSayi(malzeme.agirlik_kg)} kg</span>
            </>
          )}
        </div>
      )}

      {/* Heat input */}
      <div style={s.heatBlok}>
        <span style={s.heatLabel}>{tv('m_ib_sd_malzeme_heat_label', 'Heat')}</span>
        <input
          type="text"
          value={heatLocal}
          onChange={(e) => setHeatLocal(e.target.value)}
          onBlur={() => heatKaydet(malzeme.id, heatLocal)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          placeholder={tv('m_ib_sd_malzeme_heat_placeholder', 'Heat no...')}
          style={{ ...s.heatInput, borderColor: heatBorderColor }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        {kayitDurumu === 'basarili' && (
          <span style={s.heatBasariYazi}>
            ✓ {tv('m_ib_sd_malzeme_kaydedildi', 'Kaydedildi')}
          </span>
        )}
        {kayitDurumu === 'hata' && (
          <span style={s.heatHataYazi}>
            {tv('m_ib_sd_malzeme_kayit_hatasi', 'Kaydedilemedi')}
          </span>
        )}
      </div>
    </div>
  )
}

// Tip chip rengi — 4 grup haritası
function tipChipStili(tip) {
  if (tip === 'boru') {
    return { background: '#E1F5EE', color: '#085041' } // teal
  }
  if (tip === 'flans' || tip === 'reduktor') {
    return { background: '#EEEDFE', color: '#3C3489' } // mor
  }
  if (tip === 'dirsek' || tip === 'fitting' || tip === 'te') {
    return { background: '#FAEEDA', color: '#633806' } // amber
  }
  return { background: 'var(--sur2)', color: 'var(--txd)' } // gri / bilinmeyen
}

// Sayı format — "139.7" → "139,7", trailing zero kırp
function formatSayi(n) {
  if (n == null || n === '') return '—'
  const num = parseFloat(n)
  if (isNaN(num)) return String(n)
  // Tam sayıysa ondalık yok, değilse en fazla 2 basamak
  const str = Number.isInteger(num)
    ? String(num)
    : num.toFixed(2).replace(/\.?0+$/, '')
  return str.replace('.', ',')
}

// ─────────── Foto Carousel — 3b (69. oturum) ───────────
//
// 0 foto → mevcut placeholder (kamera ikonu). Nav/sayaç/meta yok.
// 1 foto → resim + meta chip (tek). Nav/sayaç yok.
// ≥2 foto → resim + nav (sol/sağ daire) + sayaç pill (sol-alt) + meta chip
//   (sağ-alt). İlk fotoda sol ok pasif, sonda sağ ok pasif.
//
// Meta chip formatı: "<İslem> · <Yükleyen ad> · <GG Ay>"
// İslem turu i18n: m_ib_foto_islem_<slug>, fallback TR-capitalize.
// Tarih: tarayıcı locale'ine göre (tr-TR şu anlık — gelecekte useT'ten lokal alınabilir).
// Tap-to-fullscreen yok (3b kapsamı dışı, IbFotoViewer ileride).
//
// 3b-fix3 (69. oturum, signed URL endpoint geçişi):
// arespipe-dosyalar bucket'ı private + storage.objects SELECT RLS'i normal
// kullanıcılara kapalı. Bu yüzden client-side createSignedUrl da çalışmıyor
// ("Object not found" döndü). Çözüm: /api/dosya-url-al endpoint'i (server
// service_key ile RLS bypass + JWT'den tenant_id check). Helper:
// mobile/src/lib/dosya.js → dosyaUrlAl(yol). 5 dk buffer'lı cache.
// dosya_url full URL (https://...) ile gelirse aynen döner (geriye uyumlu).

function FotoCarousel({ fotograflar, idx, setIdx, kullaniciAdMap, tv }) {
  const sayim = Array.isArray(fotograflar) ? fotograflar.length : 0

  // 0 foto → mevcut placeholder
  if (sayim === 0) {
    return (
      <div style={s.fotoBlok}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--txd)" strokeWidth="1.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
    )
  }

  const guvIdx = Math.min(Math.max(idx, 0), sayim - 1)
  const aktif  = fotograflar[guvIdx]
  if (!aktif) return null

  const onceki  = () => { if (guvIdx > 0)         setIdx(guvIdx - 1) }
  const sonraki = () => { if (guvIdx < sayim - 1) setIdx(guvIdx + 1) }

  // Meta chip parçaları
  const islem = aktif.islem_turu || ''
  const islemLabel = islem
    ? tv(
        `m_ib_foto_islem_${islem}`,
        islem.charAt(0).toLocaleUpperCase('tr-TR') + islem.slice(1)
      )
    : ''
  const yukleyenAd = aktif.yukleyen_id ? (kullaniciAdMap[aktif.yukleyen_id] || '') : ''
  const tarihStr = aktif.olusturma
    ? new Date(aktif.olusturma).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : ''
  const metaText = [islemLabel, yukleyenAd, tarihStr].filter(Boolean).join(' · ')

  const ilkMi = guvIdx === 0
  const sonMi = guvIdx === sayim - 1

  return (
    <div style={s.fotoCarouselWrap}>
      <img
        src={aktif.cozulmus_url || ''}
        alt=""
        style={s.fotoResim}
        loading="lazy"
        onError={(e) => {
          console.error('[FotoCarousel] foto yüklenemedi — orijinal:', aktif.dosya_url, '| signed:', aktif.cozulmus_url)
          e.currentTarget.style.display = 'none'
        }}
      />

      {sayim > 1 && (
        <>
          <button
            type="button"
            onClick={onceki}
            disabled={ilkMi}
            style={{ ...s.fotoNavBtn, left: 8, opacity: ilkMi ? 0.3 : 1, cursor: ilkMi ? 'default' : 'pointer' }}
            aria-label={tv('m_ib_foto_onceki', 'Önceki foto')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={sonraki}
            disabled={sonMi}
            style={{ ...s.fotoNavBtn, right: 8, opacity: sonMi ? 0.3 : 1, cursor: sonMi ? 'default' : 'pointer' }}
            aria-label={tv('m_ib_foto_sonraki', 'Sonraki foto')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <span style={s.fotoSayac}>{guvIdx + 1} / {sayim}</span>
        </>
      )}

      {metaText && <span style={s.fotoMeta}>{metaText}</span>}
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
    background: 'var(--gr)',
    boxShadow: '0 0 6px rgba(34,197,94,0.8)',
    flexShrink: 0,
    animation: 'ibSdPulse 1.4s ease-in-out infinite',
  },

  // Foto blok (0 foto durumu — kamera ikonu placeholder)
  fotoBlok: {
    flexShrink: 0,
    height: 200,
    background: 'var(--sur2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Foto carousel (≥1 foto durumu — 3b)
  fotoCarouselWrap: {
    flexShrink: 0,
    position: 'relative',
    height: 200,
    background: 'var(--sur2)',
    overflow: 'hidden',
  },
  fotoResim: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  fotoNavBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 120ms ease',
    padding: 0,
  },
  fotoSayac: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 12,
    fontFamily: 'Barlow, sans-serif',
    pointerEvents: 'none',
    letterSpacing: 0.2,
  },
  fotoMeta: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    maxWidth: 'calc(100% - 90px)',
    padding: '4px 10px',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 12,
    borderRadius: 12,
    fontFamily: 'Barlow, sans-serif',
    pointerEvents: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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

  // Malzeme paneli (3c)
  malzemeWrap: {
    padding: '8px 12px',
  },
  malzemeBaslik: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 4px 12px',
    fontSize: 13,
    color: 'var(--txm)',
    fontFamily: 'Barlow, sans-serif',
  },
  malzemeBaslikSert: {
    color: 'var(--gr)',
    fontWeight: 500,
  },
  malzemeKart: {
    background: 'var(--sur)',
    border: '1px solid var(--bor)',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 10,
    fontFamily: 'Barlow, sans-serif',
  },
  malzemeUstSatir: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  malzemeKodBlok: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  malzemeSira: {
    fontSize: 12,
    color: 'var(--txm)',
    minWidth: 18,
    fontWeight: 500,
  },
  malzemeKod: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'monospace',
    color: 'var(--tx)',
  },
  tipChip: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 4,
    fontWeight: 500,
    letterSpacing: 0.2,
  },
  sertChip: {
    fontSize: 12,
    color: 'var(--gr)',
    fontWeight: 600,
    flexShrink: 0,
  },
  malzemeTanim: {
    fontSize: 14,
    color: 'var(--tx)',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  malzemeAlt: {
    fontSize: 12,
    color: 'var(--txm)',
    marginBottom: 6,
    fontWeight: 500,
  },
  malzemeOlcu: {
    fontSize: 13,
    color: 'var(--txm)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  malzemeNoktaAyrac: {
    color: 'var(--txm)',
    opacity: 0.5,
  },
  heatBlok: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  heatLabel: {
    fontSize: 12,
    color: 'var(--txm)',
    fontWeight: 600,
    minWidth: 36,
  },
  heatInput: {
    flex: 1,
    height: 36,
    padding: '0 12px',
    fontSize: 14,
    fontFamily: 'monospace',
    color: 'var(--tx)',
    background: 'var(--bg)',
    border: '1px solid var(--bd)',
    borderRadius: 6,
    outline: 'none',
    transition: 'border-color 200ms ease',
    WebkitAppearance: 'none',
    letterSpacing: 0.5,
  },
  heatBasariYazi: {
    fontSize: 12,
    color: 'var(--gr)',
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  heatHataYazi: {
    fontSize: 12,
    color: 'var(--re)',
    fontWeight: 500,
    flexShrink: 0,
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
  // 70. oturum (Adım 3d): Yetkisiz operatöre info satırı.
  // Genel paneli badge pattern'i (sur2 + bor + sol accent ac).
  // Üç temada (light/dark/light-anthracite) otomatik adapt.
  footInfoSatir: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    background: 'var(--sur2)',
    border: '1px solid var(--bor)',
    borderLeft: '3px solid var(--ac)',
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--tx)',
    fontFamily: 'Barlow, sans-serif',
  },
  footInfoIkon: {
    flexShrink: 0,
    marginTop: 1,
    color: 'var(--ac)',
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

  // 3f.1 — Kapat onay full-screen modal stilleri (yumuşak uyarı VAR durumunda)
  kapatOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    animation: 'ibUyFade 240ms ease-out forwards',
  },
  kapatKart: {
    background: 'var(--sur)',
    borderRadius: 14,
    padding: '18px 16px 16px',
    width: '100%',
    maxWidth: 360,
    fontFamily: 'Barlow, system-ui, sans-serif',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  kapatBaslik: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--tx)',
    margin: '0 0 14px',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  kapatKartYigin: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  kapatBtnYigin: {
    display: 'flex',
    gap: 8,
  },
  kapatBtnIkincil: {
    flex: 1,
    padding: 12,
    background: 'transparent',
    color: 'var(--tx)',
    border: '1px solid var(--bor)',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'Barlow, sans-serif',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  kapatBtnKirmizi: {
    flex: 1,
    padding: 12,
    background: 'var(--re)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
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
