-- Políticas para o bucket product-images
-- Execute após criar o bucket no Dashboard

-- Qualquer utilizador autenticado pode fazer upload
CREATE POLICY "Membros fazem upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
  );

-- Imagens são públicas (leitura sem autenticação)
CREATE POLICY "Imagens são públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Utilizador pode apagar as suas próprias imagens
CREATE POLICY "Utilizador apaga as suas imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
