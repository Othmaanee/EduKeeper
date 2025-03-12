
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mtbcrbfchoqterxevvft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10YmNyYmZjaG9xdGVyeGV2dmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NDUwNzUsImV4cCI6MjA1NzEyMTA3NX0.97PG3U92JkmrsoxmxFNxiFMwxsHc8GnQM8Xpailfhy0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
