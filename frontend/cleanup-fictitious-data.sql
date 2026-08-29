-- ============================================================
-- LIMPEZA DE DADOS FICTÍCIOS - AppManicure
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Remover links professional_services (dependência de professionals e services)
DELETE FROM professional_services
WHERE professional_id IN (
  'bd334ad3-8793-4ef1-9b5d-bcccdb1e49be',
  '23e03677-a324-48ce-a965-070f95d6e982',
  '80c6ffa7-b4eb-4a8d-8708-92e0c59e27bd'
)
OR service_id IN (
  '95fc8906-5e0a-4e62-bfd1-622f2a02e4f5',
  '6fe504db-5806-4711-bc48-cabd99d70022',
  '77c80f4f-b64d-4ed8-9a4f-af3d07488ed4',
  '4911afeb-c4e5-4363-ac2e-b1649fba3f26',
  'f8a162c9-3186-4d4b-9e4d-3605cac7391d',
  'f2214af5-ad1f-44d2-80e2-e2f689b4ed7b',
  '00049dd1-1410-4184-a76e-95251049056e',
  '07142083-df44-4667-8d77-daaed20b016a'
);

-- 2. Remover availability dos profissionais fictícios
DELETE FROM availability
WHERE professional_id IN (
  'bd334ad3-8793-4ef1-9b5d-bcccdb1e49be',
  '23e03677-a324-48ce-a965-070f95d6e982',
  '80c6ffa7-b4eb-4a8d-8708-92e0c59e27bd'
);

-- 3. Remover os 8 serviços fictícios (Manicure e Pedicure de 60min)
DELETE FROM services
WHERE id IN (
  '95fc8906-5e0a-4e62-bfd1-622f2a02e4f5',
  '6fe504db-5806-4711-bc48-cabd99d70022',
  '77c80f4f-b64d-4ed8-9a4f-af3d07488ed4',
  '4911afeb-c4e5-4363-ac2e-b1649fba3f26',
  'f8a162c9-3186-4d4b-9e4d-3605cac7391d',
  'f2214af5-ad1f-44d2-80e2-e2f689b4ed7b',
  '00049dd1-1410-4184-a76e-95251049056e',
  '07142083-df44-4667-8d77-daaed20b016a'
);

-- 4. Remover os 3 profissionais fictícios (Admin A, Admin B, Client A)
DELETE FROM professionals
WHERE id IN (
  'bd334ad3-8793-4ef1-9b5d-bcccdb1e49be',
  '23e03677-a324-48ce-a965-070f95d6e982',
  '80c6ffa7-b4eb-4a8d-8708-92e0c59e27bd'
);

-- ============================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================================

-- Deve retornar 0 linhas:
SELECT * FROM services WHERE name IN ('Manicure', 'Pedicure') AND default_duration_minutes = 60;

-- Deve retornar 0 linhas:
SELECT * FROM professionals WHERE display_name IN ('Admin A', 'Admin B', 'Client A');

-- Deve retornar 0 linhas:
SELECT * FROM professional_services WHERE professional_id IN (
  'bd334ad3-8793-4ef1-9b5d-bcccdb1e49be',
  '23e03677-a324-48ce-a965-070f95d6e982',
  '80c6ffa7-b4eb-4a8d-8708-92e0c59e27bd'
);
