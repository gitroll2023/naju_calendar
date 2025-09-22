-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE church_category AS ENUM (
  'church',     -- 교회 일정 (파란색 계열)
  'adult',      -- 장년회 (진한 파란색)
  'youth',      -- 청년회 (초록색 계열)
  'advisory',   -- 자문회 (보라색 계열)
  'women',      -- 부녀회 (핑크색 계열)
  'student',    -- 학생회 (주황색 계열)
  'children'    -- 유년회 (노란색 계열)
);

CREATE TYPE recurring_type AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  category church_category NOT NULL DEFAULT 'church',
  description TEXT,
  location VARCHAR(255),
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  reminder INTEGER, -- minutes before event
  recurring recurring_type,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_created_at ON events(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
-- For now, allowing all operations for simplicity
CREATE POLICY "Enable read access for all users" ON events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON events
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON events
    FOR DELETE USING (true);

-- Insert sample data
INSERT INTO events (title, date, start_time, end_time, category, description, location, is_all_day) VALUES
('주일예배', '2025-01-26', '11:00', '12:30', 'church', '주일 오전 예배', '본당', false),
('장년회 모임', '2025-01-27', '19:00', '21:00', 'adult', '월례 장년회 모임', '교육관', false),
('청년회 예배', '2025-01-29', '19:30', '21:00', 'youth', '청년부 수요예배', '청년부실', false),
('부녀회 기도회', '2025-01-30', '10:00', '11:30', 'women', '목요 기도회', '기도실', false),
('학생회 모임', '2025-01-31', '18:00', '20:00', 'student', '금요일 중고등부 모임', '학생부실', false),
('유년회 성경학교', '2025-02-01', null, null, 'children', '어린이 성경학교', '유아부실', true);