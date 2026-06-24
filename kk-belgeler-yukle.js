/* ════════════════════════════════════════════════════════════════════
   KK BELGELER — Yükleme / Listeleme / Silme  (client-side, Supabase)
   ────────────────────────────────────────────────────────────────────
   12/12 Vercel endpoint korunur — yeni api/*.js YOK. Supabase SDK ile.
   kalite_kontrol.html içine taşınacak; ARES global helper'larını kullanır.

   ÖN KOŞUL (önce yapılacak, bu kod onlar olmadan çalışmaz):
     1) kk_belgeler tablosu (aşağıdaki migration)
     2) 'kk-belgeler' adında Supabase Storage bucket + RLS policy
     3) MK-85.3: aşağıdaki FK hedef tablo/sütun adlarını information_schema
        ile DOĞRULA (kullanicilar.ad_soyad? kullanicilar.id? — varsayım,
        gerçek şemayla teyit et). MK-98.2: migration'ı BEGIN/ROLLBACK
        dry-run ile dene, sonra uygula. Supabase SQL Editor BEGIN/COMMIT
        bloğu kabul etmez → IF NOT EXISTS idempotent kalıp kullan.
   ════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────
   MIGRATION — Supabase SQL Editor (idempotent, BEGIN/COMMIT YOK)
   ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kk_belgeler (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  davet_id     uuid NOT NULL REFERENCES public.kk_davetler(id) ON DELETE CASCADE,
  spool_id     uuid     NULL REFERENCES public.spooller(id)    ON DELETE SET NULL,  -- NULL = paket(tüm davet) bazlı
  tip          text NOT NULL CHECK (tip IN ('foto','belge')),
  dosya_yolu   text NOT NULL,                 -- Storage path: {tenant}/{davet}/{uuid}-{ad}
  dosya_adi    text,
  dosya_boyut  bigint,
  aciklama     text,                          -- foto/belge açıklaması
  personel_id  uuid NULL,                     -- sorumlu personel (FK kullanicilar — adı teyit et)
  yukleyen_id  uuid NULL,                     -- yükleyen
  silindi      boolean NOT NULL DEFAULT false,-- soft delete (veri silinmez, status-set)
  olusturma    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_kkbelge_davet ON public.kk_belgeler(davet_id) WHERE silindi = false;
CREATE INDEX IF NOT EXISTS ix_kkbelge_spool ON public.kk_belgeler(spool_id) WHERE spool_id IS NOT NULL AND silindi = false;
-- RLS (tenant izolasyonu — projedeki diğer tablolarla aynı policy kalıbını uygula)
ALTER TABLE public.kk_belgeler ENABLE ROW LEVEL SECURITY;
-- ÖRNEK policy (mevcut tenant policy kalıbınla değiştir):
-- CREATE POLICY kk_belgeler_tenant ON public.kk_belgeler
--   USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

   STORAGE BUCKET (Dashboard → Storage → New bucket):
     ad: kk-belgeler   ·   public: false (signed URL ile eriş)
     policy: INSERT/SELECT/DELETE — tenant klasörüne (path prefix = tenant_id) izin
   ───────────────────────────────────────────────────────────────────── */

(function(){
  'use strict';
  var BUCKET = 'kk-belgeler';

  function _uid(){
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now().toString(16) + Math.random().toString(16).slice(2));
  }
  function _temizAd(ad){ return String(ad||'dosya').replace(/[^\w.\-]+/g,'_').slice(0,120); }

  /* ── 1) YÜKLE: Storage'a koy + kk_belgeler'e kayıt ──
     file: File (input.files[0] veya drop)
     opts: { davetId, spoolId?, tip:'foto'|'belge', aciklama?, personelId? }
     dönüş: eklenen kayıt satırı */
  async function kkBelgeYukle(file, opts){
    opts = opts || {};
    if(!file) throw new Error('Dosya yok');
    if(!opts.davetId) throw new Error('davetId zorunlu');
    if(opts.tip!=='foto' && opts.tip!=='belge') throw new Error("tip 'foto' veya 'belge' olmalı");

    var supa = ARES.supabase(), tid = ARES.tenantId();
    var yol  = tid + '/' + opts.davetId + '/' + _uid() + '-' + _temizAd(file.name);

    // a) Storage'a yükle
    var up = await supa.storage.from(BUCKET).upload(yol, file, { cacheControl:'3600', upsert:false });
    if(up.error) throw up.error;

    // b) DB kaydı
    var kayit = {
      tenant_id:   tid,
      davet_id:    opts.davetId,
      spool_id:    opts.spoolId || null,
      tip:         opts.tip,
      dosya_yolu:  yol,
      dosya_adi:   file.name,
      dosya_boyut: file.size || null,
      aciklama:    opts.aciklama || null,
      personel_id: opts.personelId || null,
      yukleyen_id: (ARES.kullaniciId ? ARES.kullaniciId() : null)
    };
    var ins = await supa.from('kk_belgeler').insert(kayit).select().single();
    if(ins.error){
      // DB başarısızsa yüklenen dosyayı geri al (orphan bırakma)
      try{ await supa.storage.from(BUCKET).remove([yol]); }catch(e){}
      throw ins.error;
    }
    return ins.data;
  }

  /* ── 2) LİSTELE: bir davetin tüm belgeleri (foto + belge) ── */
  async function kkBelgeleriGetir(davetId){
    var supa = ARES.supabase(), tid = ARES.tenantId();
    var r = await supa.from('kk_belgeler')
      .select('id,davet_id,spool_id,tip,dosya_yolu,dosya_adi,dosya_boyut,aciklama,personel_id,yukleyen_id,olusturma')
      .eq('tenant_id', tid).eq('davet_id', davetId).eq('silindi', false)
      .order('olusturma', { ascending:true });
    if(r.error) throw r.error;
    return r.data || [];
  }

  /* ── 2b) TOPLU signed URL: { dosya_yolu: url } (private bucket görüntüleme) ── */
  async function kkBelgeUrlleri(yollar){
    if(!yollar || !yollar.length) return {};
    var supa = ARES.supabase();
    var r = await supa.storage.from(BUCKET).createSignedUrls(yollar, 3600);
    if(r.error) throw r.error;
    var m = {};
    (r.data || []).forEach(function(x){ if(x.path && x.signedUrl) m[x.path] = x.signedUrl; });
    return m;
  }

  /* ── 3) GÖRÜNTÜLEME URL'i (private bucket → signed, 1 saat) ── */
  async function kkBelgeUrl(dosyaYolu){
    var supa = ARES.supabase();
    var s = await supa.storage.from(BUCKET).createSignedUrl(dosyaYolu, 3600);
    if(s.error) throw s.error;
    return s.data.signedUrl;
  }

  /* ── 4) META GÜNCELLE: açıklama / sorumlu personel ── */
  async function kkBelgeMetaGuncelle(id, alanlar){
    var supa = ARES.supabase(), yama = {};
    if(alanlar.aciklama   !== undefined) yama.aciklama    = alanlar.aciklama   || null;
    if(alanlar.personelId !== undefined) yama.personel_id = alanlar.personelId || null;
    if(!Object.keys(yama).length) return true;
    var r = await supa.from('kk_belgeler').update(yama).eq('id', id);
    if(r.error) throw r.error;
    return true;
  }

  /* ── 5) SİL: soft delete (veri silinmez, MK; istenirse Storage'tan da kaldır) ── */
  async function kkBelgeSil(belge, storagedanDaSil){
    var supa = ARES.supabase();
    var r = await supa.from('kk_belgeler').update({ silindi:true }).eq('id', belge.id);
    if(r.error) throw r.error;
    if(storagedanDaSil && belge.dosya_yolu){
      try{ await supa.storage.from(BUCKET).remove([belge.dosya_yolu]); }catch(e){ console.warn('storage remove:', e); }
    }
    return true;
  }

  /* ── 6) Çoklu yükleme yardımcı (dropzone / input multiple) ── */
  async function kkBelgelerYukle(fileList, opts){
    var sonuc = [];
    for(var i=0;i<fileList.length;i++){
      var f = fileList[i];
      var tip = opts.tip || (/^image\//.test(f.type) ? 'foto' : 'belge');
      sonuc.push(await kkBelgeYukle(f, Object.assign({}, opts, { tip:tip })));
    }
    return sonuc;
  }

  // global'e aç (kalite_kontrol.html çağırır)
  window.kkBelgeYukle        = kkBelgeYukle;
  window.kkBelgelerYukle     = kkBelgelerYukle;
  window.kkBelgeleriGetir    = kkBelgeleriGetir;
  window.kkBelgeUrlleri      = kkBelgeUrlleri;
  window.kkBelgeUrl          = kkBelgeUrl;
  window.kkBelgeMetaGuncelle = kkBelgeMetaGuncelle;
  window.kkBelgeSil          = kkBelgeSil;
})();

/* ─── Kullanım örneği (belge modalına bağlanırken) ───
// foto ekle (input change):
async function fotoEkle(e, davetId, spoolId){
  for(const f of e.target.files){
    await kkBelgeYukle(f, { davetId, spoolId, tip:'foto', aciklama:'', personelId:null });
  }
  await belgeYenile(davetId);   // listeyi tazele
}
// belge yükle (dropzone):
async function belgeBirak(files, davetId, spoolId){
  await kkBelgelerYukle(files, { davetId, spoolId, tip:'belge' });
  await belgeYenile(davetId);
}
// galeri açıklama/sorumlu kaydet:
async function metaKaydet(belgeId, aciklama, personelId){
  await kkBelgeMetaGuncelle(belgeId, { aciklama, personelId });
}
*/
