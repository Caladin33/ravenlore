import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ccrujoulbvwnbfiqwoqn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcnVqb3VsYnZ3bmJmaXF3b3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYyNTYsImV4cCI6MjA5MzYxMjI1Nn0.d6zRuuanSBy-6tvc5Vp8KYB8ueFPOt4BbCdUIGOGec8'
)