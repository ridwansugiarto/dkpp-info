-- 011_vector_search.sql
-- Function to match document chunks with strict role-based filtering
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  user_role text DEFAULT 'GUEST',
  user_is_verified boolean DEFAULT false
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  filename TEXT,
  folder TEXT,
  category TEXT,
  is_sensitive BOOLEAN,
  visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.filename,
    d.folder,
    d.category,
    d.is_sensitive,
    d.visibility
  FROM public.document_chunks dc
  JOIN public.documents d ON dc.document_id = d.id
  WHERE 
    -- Strict security filter based on caller's verified role:
    (
      -- ADMIN can see everything
      user_role = 'ADMIN'
      OR
      -- EMPLOYEE can see non-sensitive and public/internal documents
      (
        user_role = 'EMPLOYEE' 
        AND (
          d.is_sensitive = FALSE 
          OR (user_is_verified = TRUE AND d.visibility IN ('PUBLIC', 'INTERNAL', 'RESTRICTED'))
        )
      )
      OR
      -- GUEST can ONLY see PUBLIC and non-sensitive documents
      (
        d.visibility = 'PUBLIC' 
        AND d.is_sensitive = FALSE 
        AND d.folder NOT IN ('sensitif', 'kepegawaian')
      )
    )
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
