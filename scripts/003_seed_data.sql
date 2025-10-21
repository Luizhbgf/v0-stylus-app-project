-- Insert sample services
insert into
  public.services (name, description, duration, price, category, is_active)
values
  (
    'Corte de Cabelo Feminino',
    'Corte personalizado com lavagem e finalização',
    60,
    80.00,
    'Cabelo',
    true
  ),
  (
    'Corte de Cabelo Masculino',
    'Corte moderno com acabamento',
    45,
    50.00,
    'Cabelo',
    true
  ),
  (
    'Coloração',
    'Coloração completa com produtos de qualidade',
    120,
    150.00,
    'Cabelo',
    true
  ),
  (
    'Escova Progressiva',
    'Alisamento com escova progressiva',
    180,
    250.00,
    'Cabelo',
    true
  ),
  (
    'Manicure',
    'Cuidados com as unhas das mãos',
    45,
    35.00,
    'Unhas',
    true
  ),
  (
    'Pedicure',
    'Cuidados com as unhas dos pés',
    45,
    40.00,
    'Unhas',
    true
  ),
  (
    'Unhas em Gel',
    'Aplicação de unhas em gel',
    90,
    80.00,
    'Unhas',
    true
  ),
  (
    'Design de Sobrancelhas',
    'Modelagem e design de sobrancelhas',
    30,
    45.00,
    'Estética',
    true
  ),
  (
    'Limpeza de Pele',
    'Limpeza profunda facial',
    60,
    120.00,
    'Estética',
    true
  ),
  (
    'Massagem Relaxante',
    'Massagem corporal relaxante',
    60,
    100.00,
    'Estética',
    true
  ) on conflict do nothing;
