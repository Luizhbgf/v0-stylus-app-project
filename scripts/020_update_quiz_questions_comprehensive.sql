-- Delete old hair-focused quiz questions and create comprehensive new ones

-- Delete existing quiz questions
DELETE FROM quiz_questions;

-- Insert new comprehensive quiz questions covering all service categories
INSERT INTO quiz_questions (question, options, order_index, category) VALUES
(
  'Quais categorias de serviços você tem interesse?',
  jsonb_build_array(
    jsonb_build_object('value', 'cabelo', 'label', 'Cabelo (Corte, Coloração, Tratamentos)'),
    jsonb_build_object('value', 'barba', 'label', 'Barba e Bigode'),
    jsonb_build_object('value', 'unhas', 'label', 'Unhas (Manicure, Pedicure, Alongamento)'),
    jsonb_build_object('value', 'estetica', 'label', 'Estética Facial e Corporal'),
    jsonb_build_object('value', 'massagem', 'label', 'Massagens e Relaxamento'),
    jsonb_build_object('value', 'sobrancelha', 'label', 'Sobrancelhas e Cílios'),
    jsonb_build_object('value', 'maquiagem', 'label', 'Maquiagem'),
    jsonb_build_object('value', 'depilacao', 'label', 'Depilação')
  ),
  1,
  'interesse'
),
(
  'Com que frequência você busca esses serviços?',
  jsonb_build_array(
    jsonb_build_object('value', 'semanal', 'label', 'Semanalmente'),
    jsonb_build_object('value', 'quinzenal', 'label', 'A cada 15 dias'),
    jsonb_build_object('value', 'mensal', 'label', 'Mensalmente'),
    jsonb_build_object('value', 'trimestral', 'label', 'A cada 2-3 meses'),
    jsonb_build_object('value', 'eventual', 'label', 'Ocasionalmente')
  ),
  2,
  'frequencia'
),
(
  'O que é mais importante para você?',
  jsonb_build_array(
    jsonb_build_object('value', 'qualidade', 'label', 'Qualidade e experiência do profissional'),
    jsonb_build_object('value', 'preco', 'label', 'Preço acessível'),
    jsonb_build_object('value', 'rapidez', 'label', 'Atendimento rápido'),
    jsonb_build_object('value', 'localizacao', 'label', 'Localização conveniente'),
    jsonb_build_object('value', 'ambiente', 'label', 'Ambiente agradável e acolhedor')
  ),
  3,
  'prioridade'
),
(
  'Que tipo de profissional você prefere?',
  jsonb_build_array(
    jsonb_build_object('value', 'moderno', 'label', 'Moderno e antenado nas tendências'),
    jsonb_build_object('value', 'classico', 'label', 'Clássico e tradicional'),
    jsonb_build_object('value', 'versatil', 'label', 'Versátil (faz vários tipos de trabalho)'),
    jsonb_build_object('value', 'especialista', 'label', 'Especialista em técnicas específicas')
  ),
  4,
  'estilo'
);
