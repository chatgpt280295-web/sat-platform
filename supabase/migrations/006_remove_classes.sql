-- Migration: 006_remove_classes.sql
-- Mục đích: Xóa các bảng liên quan đến lớp học (class-based model)
-- CẢNH BÁO: Chỉ chạy sau khi Phase 1-2 đã ổn định và dữ liệu đã được migrate
-- Created: 2026-04-18

-- Xóa theo thứ tự để tránh FK violation
DROP TABLE IF EXISTS class_assignments CASCADE;
DROP TABLE IF EXISTS class_members     CASCADE;
DROP TABLE IF EXISTS class_sessions    CASCADE;
DROP TABLE IF EXISTS classes           CASCADE;
DROP TABLE IF EXISTS attendances       CASCADE;
DROP TABLE IF EXISTS intake_surveys    CASCADE;
