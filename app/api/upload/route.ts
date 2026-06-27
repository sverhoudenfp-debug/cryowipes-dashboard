import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand gevonden' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Timestamp voor signature
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'cryowipes-ads';

    // Signature genereren
    const crypto = await import('crypto');
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    // Upload naar Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('api_key', apiKey!);
    uploadFormData.append('timestamp', String(timestamp));
    uploadFormData.append('signature', signature);
    uploadFormData.append('folder', folder);

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body: uploadFormData }
    );

    const uploadData = await uploadRes.json();

    if (uploadData.error) {
      return NextResponse.json({ error: uploadData.error.message }, { status: 500 });
    }

    return NextResponse.json({
      url: uploadData.secure_url,
      public_id: uploadData.public_id,
      resource_type: resourceType,
      width: uploadData.width,
      height: uploadData.height,
      format: uploadData.format,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
