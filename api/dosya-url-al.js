// api/dosya-url-al.js — Vercel Serverless Function (Node.js)
// Supabase Storage dosyaları için signed URL üretir
// Yetki: JWT'den tenant_id okunur, yol ile eşleşmeli (cross-tenant bloklanır)
// Süper admin: tüm tenant'lara erişebilir (feedback fotoğrafları için)

import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const SIGNED_URL_SURE_SN = 3600; // 1 saat

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', kod: 'METOD_YANLIS' });
  }

  try {
    // 1. Env var kontrolü
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase env var yapılandırılmamış', kod: 'ENV_EKSIK' });
    }

    // 2. JWT token'ı Authorization header'dan al
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli (Bearer token)', kod: 'YETKI_GEREKLI' });
    }

    // 3. Body'den yolu al
    const { yol } = req.body || {};
    if (!yol || typeof yol !== 'string') {
      return res.status(400).json({ error: 'Yol parametresi gerekli', kod: 'YOL_EKSIK' });
    }

    // Yol formatı kontrolü: en az 2 segment olmalı (tenant_id/dosya)
    const segmentler = yol.split('/').filter(Boolean);
    if (segmentler.length < 2) {
      return res.status(400).json({ error: 'Yol formatı geçersiz', kod: 'YOL_GECERSIZ' });
    }
    const yoldanTenantId = segmentler[0];

    // UUID format kontrolü (basit)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(yoldanTenantId)) {
      return res.status(400).json({ error: 'Yoldaki tenant_id UUID formatında değil', kod: 'YOL_GECERSIZ' });
    }

    // 4. Supabase client (service role) ile JWT doğrula
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Token geçersiz veya süresi dolmuş', kod: 'TOKEN_GECERSIZ' });
    }
    const user = userData.user;

    // 5. Kullanıcının tenant_id ve rolünü DB'den oku (JWT metadata'ya güvenme, DB kaynak)
    const { data: kullaniciData, error: kullaniciError } = await supabase
      .from('kullanicilar')
      .select('tenant_id, rol')
      .eq('id', user.id)
      .single();

    if (kullaniciError || !kullaniciData) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı', kod: 'KULLANICI_YOK' });
    }

    const { tenant_id: kullaniciTenantId, rol } = kullaniciData;
    const superAdmin = rol === 'super_admin';

    // 6. Tenant yetki kontrolü
    if (!superAdmin && yoldanTenantId !== kullaniciTenantId) {
      return res.status(403).json({
        error: 'Bu dosyaya erişim yetkin yok',
        kod: 'TENANT_UYUSMAZLIGI'
      });
    }

    // 7. Signed URL üret
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('arespipe-dosyalar')
      .createSignedUrl(yol, SIGNED_URL_SURE_SN);

    if (signedError) {
      // "Object not found" durumunda 404 dön
      if (signedError.message?.toLowerCase().includes('not found')) {
        return res.status(404).json({ error: 'Dosya bulunamadı', kod: 'DOSYA_YOK' });
      }
      return res.status(500).json({
        error: 'Signed URL üretilemedi: ' + signedError.message,
        kod: 'SUPABASE_HATASI'
      });
    }

    // 8. Başarı
    const expiresAt = new Date(Date.now() + SIGNED_URL_SURE_SN * 1000).toISOString();
    return res.status(200).json({
      signedUrl: signedData.signedUrl,
      expiresAt: expiresAt
    });

  } catch (err) {
    console.error('[dosya-url-al] Beklenmeyen hata:', err);
    return res.status(500).json({
      error: 'Sunucu hatası',
      kod: 'BEKLENMEDIK_HATA'
    });
  }
}
