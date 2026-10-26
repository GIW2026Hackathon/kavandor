import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-errors';
import { withAuthenticatedApi } from '@/lib/api-route';

const maxFileBytes = 10 * 1024 * 1024;
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer'], async ({ actor, supabase }) => {
    const { id: harvestId } = await params;
    const { data: harvest, error: harvestError } = await supabase.from('harvests')
      .select('id').eq('id', harvestId).eq('farmer_id', actor.userId).maybeSingle();
    if (harvestError) throw harvestError;
    if (!harvest) throw new ApiError('NOT_FOUND', 'Harvest not found.', 404);

    const form = await request.formData();
    const files = form.getAll('photos');
    const photos = files.filter((file): file is File => file instanceof File);
    if (photos.length < 1 || photos.length > 5 || photos.length !== files.length) {
      throw new ApiError('INVALID_PHOTOS', 'Upload between one and five image files.', 400);
    }

    const preparedPhotos = await Promise.all(photos.map(async (file) => {
      const extension = allowedTypes.get(file.type);
      if (!extension || file.size < 1 || file.size > maxFileBytes) {
        throw new ApiError('INVALID_PHOTO', 'Photos must be JPEG, PNG, or WebP and no larger than 10 MB each.', 400);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!matchesImageSignature(file.type, bytes)) {
        throw new ApiError('INVALID_PHOTO_CONTENT', 'The uploaded file does not match its declared image type.', 400);
      }
      return { file, bytes, extension };
    }));

    const uploaded: Array<{ path: string; metadataId: string; signedUrl: string }> = [];
    const uploadedPaths: string[] = [];
    const metadataIds: string[] = [];
    try {
      for (const { file, bytes, extension } of preparedPhotos) {
        const path = `${harvestId}/${randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('harvest-photos').upload(path, bytes, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);

        const { data: signed, error: signedError } = await supabase.storage.from('harvest-photos')
          .createSignedUrl(path, 900);
        if (signedError) throw signedError;
        const { data: metadata, error: metadataError } = await supabase.from('harvest_photos')
          .insert({ harvest_id: harvestId, storage_path: path }).select('id').single();
        if (metadataError) throw metadataError;
        metadataIds.push(metadata.id);
        uploaded.push({ path, metadataId: metadata.id, signedUrl: signed.signedUrl });
      }

      const finalPath = uploaded[uploaded.length - 1].path;
      const { data: updatedHarvest, error: harvestUpdateError } = await supabase.from('harvests')
        .update({ photo_path: finalPath, updated_at: new Date().toISOString() })
        .eq('id', harvestId).eq('farmer_id', actor.userId).select('id').maybeSingle();
      if (harvestUpdateError) throw harvestUpdateError;
      if (!updatedHarvest) throw new ApiError('NOT_FOUND', 'Harvest not found.', 404);
    } catch (error) {
      if (metadataIds.length > 0) {
        const { error: metadataCleanupError } = await supabase.from('harvest_photos').delete().in('id', metadataIds);
        if (metadataCleanupError) console.error('Photo metadata cleanup failed:', metadataCleanupError.code);
      }
      if (uploadedPaths.length > 0) {
        const { error: storageCleanupError } = await supabase.storage.from('harvest-photos').remove(uploadedPaths);
        if (storageCleanupError) console.error('Uploaded photo cleanup failed:', storageCleanupError.name);
      }
      throw error;
    }
    return NextResponse.json({ photos: uploaded }, { status: 201 });
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAuthenticatedApi(request, ['farmer', 'operations_admin'], async ({ supabase }) => {
    const { id: harvestId } = await params;
    const { data, error } = await supabase.from('harvest_photos').select('id, storage_path, created_at')
      .eq('harvest_id', harvestId).order('created_at', { ascending: false }).limit(5);
    if (error) throw error;
    const photos = await Promise.all((data ?? []).map(async (photo) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from('harvest-photos').createSignedUrl(photo.storage_path, 900);
      if (signedError) throw signedError;
      return { id: photo.id, createdAt: photo.created_at, signedUrl: signed.signedUrl };
    }));
    return NextResponse.json({ photos });
  });
}

function matchesImageSignature(type: string, bytes: Uint8Array) {
  if (type === 'image/jpeg') {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  }
  if (type === 'image/png') {
    return bytes.length > 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  }
  return type === 'image/webp' && bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
