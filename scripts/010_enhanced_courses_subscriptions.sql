-- Creating enhanced course system with modules and multiple delivery methods

-- Course modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course content table (supports videos, PDFs, live sessions, in-person)
CREATE TABLE IF NOT EXISTS course_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'live', 'in_person', 'text')),
  
  -- Video content
  video_url TEXT,
  video_duration INTEGER, -- in minutes
  
  -- PDF/Text content
  pdf_url TEXT,
  text_content TEXT,
  
  -- Live session content
  live_platform TEXT, -- 'youtube' or 'custom'
  live_url TEXT,
  live_date TIMESTAMPTZ,
  live_duration INTEGER, -- in minutes
  
  -- In-person content
  in_person_location TEXT,
  in_person_date TIMESTAMPTZ,
  in_person_duration INTEGER, -- in minutes
  in_person_type TEXT CHECK (in_person_type IN ('online', 'presencial')),
  
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course enrollments (who enrolled in which course)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  amount_paid NUMERIC(10, 2),
  UNIQUE(course_id, client_id)
);

-- Course content progress tracking
CREATE TABLE IF NOT EXISTS course_content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0, -- in minutes
  UNIQUE(enrollment_id, content_id)
);

-- Subscription payments tracking
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'pix' CHECK (payment_method IN ('pix', 'cash', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  
  -- PIX specific fields
  pix_key TEXT,
  pix_qr_code_url TEXT,
  pix_copy_paste TEXT,
  pix_txid TEXT,
  pix_paid_at TIMESTAMPTZ,
  
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff portfolios
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS portfolio_description TEXT,
ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Quiz enhancements for AI personalization
CREATE TABLE IF NOT EXISTS quiz_question_personalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  personalized_question TEXT NOT NULL,
  personalized_options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- Course modules
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course modules"
  ON course_modules FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage own course modules"
  ON course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
      AND c.instructor = (SELECT id::text FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin can manage all course modules"
  ON course_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_level = 10
    )
  );

-- Course content
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course content"
  ON course_content FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage own course content"
  ON course_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = course_content.module_id
      AND c.instructor = (SELECT id::text FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin can manage all course content"
  ON course_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_level = 10
    )
  );

-- Course enrollments
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON course_enrollments FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Users can create own enrollments"
  ON course_enrollments FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Staff can view enrollments for their courses"
  ON course_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_enrollments.course_id
      AND c.instructor = (SELECT id::text FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin can manage all enrollments"
  ON course_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_level = 10
    )
  );

-- Course content progress
ALTER TABLE course_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON course_content_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.id = course_content_progress.enrollment_id
      AND ce.client_id = auth.uid()
    )
  );

-- Subscription payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription payments"
  ON subscription_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_payments.subscription_id
      AND s.client_id = auth.uid()
    )
  );

CREATE POLICY "Staff can manage subscription payments"
  ON subscription_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_payments.subscription_id
      AND s.staff_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_level = 10
    )
  );

-- Quiz personalization
ALTER TABLE quiz_question_personalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personalized questions"
  ON quiz_question_personalization FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "System can create personalized questions"
  ON quiz_question_personalization FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_module_id ON course_content(module_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_client_id ON course_enrollments(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_quiz_personalization_client_id ON quiz_question_personalization(client_id);
