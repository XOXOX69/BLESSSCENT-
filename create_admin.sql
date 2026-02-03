INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at) 
VALUES (
  gen_random_uuid(), 
  'admin@blesscent.com', 
  '$2b$10$94FFa7R9BpmzwL/oeg0f0e/Ag5i5wMEzPjalBNxKYXS4v1pgI0zSu', 
  'Admin', 
  'User', 
  'ADMIN', 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (email) DO UPDATE SET 
  password_hash = '$2b$10$94FFa7R9BpmzwL/oeg0f0e/Ag5i5wMEzPjalBNxKYXS4v1pgI0zSu',
  role = 'ADMIN',
  is_active = true;
