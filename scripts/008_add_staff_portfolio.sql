-- Add portfolio and bio fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS specialties text[],
ADD COLUMN IF NOT EXISTS portfolio_images text[];

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL, -- Array of options with weights for each staff specialty
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quiz_results table
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommended_staff_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Quiz questions policies
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_level >= 30
    )
  );

-- Quiz results policies
CREATE POLICY "Users can view own quiz results" ON public.quiz_results
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can create quiz results" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Insert sample quiz questions
INSERT INTO public.quiz_questions (question, options, order_index) VALUES
('Qual é o seu principal objetivo?', 
 '[
   {"text": "Corte moderno e estiloso", "specialty": "cortes_modernos", "weight": 3},
   {"text": "Barba bem feita e alinhada", "specialty": "barbas", "weight": 3},
   {"text": "Visual clássico e tradicional", "specialty": "cortes_classicos", "weight": 3},
   {"text": "Tratamentos capilares", "specialty": "tratamentos", "weight": 3}
 ]'::jsonb, 1),
('Com que frequência você visita o salão?', 
 '[
   {"text": "Semanalmente", "specialty": "alta_frequencia", "weight": 2},
   {"text": "Quinzenalmente", "specialty": "media_frequencia", "weight": 2},
   {"text": "Mensalmente", "specialty": "baixa_frequencia", "weight": 2}
 ]'::jsonb, 2),
('Qual estilo você prefere?', 
 '[
   {"text": "Moderno e ousado", "specialty": "cortes_modernos", "weight": 3},
   {"text": "Clássico e elegante", "specialty": "cortes_classicos", "weight": 3},
   {"text": "Descontraído e casual", "specialty": "cortes_casuais", "weight": 3}
 ]'::jsonb, 3),
('Você tem preferência por algum serviço adicional?', 
 '[
   {"text": "Coloração e luzes", "specialty": "coloracao", "weight": 2},
   {"text": "Tratamentos e hidratação", "specialty": "tratamentos", "weight": 2},
   {"text": "Apenas corte", "specialty": "cortes", "weight": 1}
 ]'::jsonb, 4);
