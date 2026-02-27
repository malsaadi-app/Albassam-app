-- Insert admin user (Mohammed)
INSERT INTO User (id, username, displayName, role, passwordHash, telegramId, notificationsEnabled, notifyOverdue, notifyDueSoon, notifyDailySummary, createdAt, updatedAt)
VALUES (
  'mohammed_001',
  'mohammed',
  'محمد',
  'ADMIN',
  '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe',
  '845495401',
  1,
  1,
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- Insert test users
INSERT INTO User (id, username, displayName, role, passwordHash, notificationsEnabled, notifyOverdue, notifyDueSoon, notifyDailySummary, createdAt, updatedAt)
VALUES 
('hr1_001', 'hr1', 'موظف موارد بشرية 1', 'HR_EMPLOYEE', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now')),
('hr2_001', 'hr2', 'موظف موارد بشرية 2', 'HR_EMPLOYEE', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now')),
('user1_001', 'user1', 'موظف 1', 'USER', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now')),
('user2_001', 'user2', 'موظف 2', 'USER', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now')),
('user3_001', 'user3', 'موظف 3', 'USER', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now')),
('user4_001', 'user4', 'موظف 4', 'USER', '$2a$10$d0cmvaLl0ep30soeM31ee.roA5J3GgMKi93X5lTbu1Ag9JNo1pnYe', 1, 1, 1, 1, datetime('now'), datetime('now'));
