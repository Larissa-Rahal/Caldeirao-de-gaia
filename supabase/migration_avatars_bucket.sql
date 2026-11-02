-- ============================================================
-- Bucket de avatares de perfil
-- Execute DEPOIS de criar o bucket "avatars" no Dashboard:
-- Storage → New bucket → "avatars" → Public bucket ✅
-- ============================================================

-- Utilizador faz upload da sua própria foto
CREATE POLICY "avatar_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatares são públicos (leitura sem autenticação)
CREATE POLICY "avatar_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Utilizador pode actualizar/substituir a sua foto
CREATE POLICY "avatar_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Utilizador pode apagar a sua foto
CREATE POLICY "avatar_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
