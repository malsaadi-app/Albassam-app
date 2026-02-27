-- Insert Branches
INSERT INTO Branch (id, name, type, commercialRegNo, latitude, longitude, geofenceRadius, workStartTime, workEndTime, workDays, status, createdAt, updatedAt)
VALUES 
('branch_001', 'مجمع البسام الأهلية بنين', 'SCHOOL', '2050040241', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_002', 'مجمع البسام الأهلية بنات', 'SCHOOL', '2050040241', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_003', 'مجمع البسام العالمية بنات', 'SCHOOL', '2050110165', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_004', 'معهد البسام العالي للتدريب (رجالي)', 'INSTITUTE', '2050089277', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_005', 'معهد البسام العالي للتدريب (النسائي)', 'INSTITUTE', '2050089294', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_006', 'شركة الصفر التجارية', 'COMPANY', '2050015622', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_007', 'شركة يوسف حمد البسام وشركاه', 'COMPANY', '2050034348', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now')),
('branch_008', 'فرع شركة يوسف حمد البسام وشركاه', 'COMPANY', '2050084516', NULL, NULL, 100, '07:00', '14:00', '0,1,2,3,4', 'ACTIVE', datetime('now'), datetime('now'));

-- Insert Stages
INSERT INTO Stage (id, branchId, name, code, latitude, longitude, geofenceRadius, workStartTime, workEndTime, managerId, status, createdAt, updatedAt)
VALUES 
-- مجمع البسام الأهلية بنين
('stage_001', 'branch_001', 'ابتدائية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_002', 'branch_001', 'متوسطة', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_003', 'branch_001', 'ثانوية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
-- مجمع البسام الأهلية بنات
('stage_004', 'branch_002', 'رياض أطفال', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_005', 'branch_002', 'ابتدائية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_006', 'branch_002', 'متوسطة', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_007', 'branch_002', 'ثانوية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
-- مجمع البسام العالمية بنات
('stage_008', 'branch_003', 'رياض أطفال', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_009', 'branch_003', 'ابتدائية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_010', 'branch_003', 'متوسطة', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now')),
('stage_011', 'branch_003', 'ثانوية', NULL, NULL, NULL, 100, NULL, NULL, NULL, 'ACTIVE', datetime('now'), datetime('now'));
