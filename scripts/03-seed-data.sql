-- Insert default services and packages
INSERT INTO services (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Marketing & Growth', 'Accelerate your customer acquisition and brand building'),
('550e8400-e29b-41d4-a716-446655440002', 'Legal & Compliance', 'Protect your business with expert legal guidance'),
('550e8400-e29b-41d4-a716-446655440003', 'Financial Advisory', 'Optimize your financial strategy and fundraising'),
('550e8400-e29b-41d4-a716-446655440004', 'Technology & Development', 'Build and scale your technical infrastructure');

-- Insert packages for Marketing & Growth
INSERT INTO packages (service_id, name, description, price, hours) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Marketing Audit', 'Comprehensive review of your current marketing strategy', 400, 8),
('550e8400-e29b-41d4-a716-446655440001', 'Marketing Pro Package', 'Full marketing strategy development and implementation plan', 750, 15),
('550e8400-e29b-41d4-a716-446655440001', 'Growth Acceleration', 'Complete growth strategy with ongoing support and optimization', 1250, 25);

-- Insert packages for Legal & Compliance
INSERT INTO packages (service_id, name, description, price, hours) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'Legal Consultation Basic', 'Initial legal review and basic compliance guidance', 500, 10),
('550e8400-e29b-41d4-a716-446655440002', 'Contract Review Package', 'Comprehensive contract drafting and review services', 900, 18),
('550e8400-e29b-41d4-a716-446655440002', 'Legal Advisory Retainer', 'Ongoing legal support and advisory services', 1500, 30);

-- Insert packages for Financial Advisory
INSERT INTO packages (service_id, name, description, price, hours) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'Financial Health Check', 'Assessment of your current financial position and recommendations', 600, 12),
('550e8400-e29b-41d4-a716-446655440003', 'Financial Advisory', 'Strategic financial planning and fundraising preparation', 1000, 20),
('550e8400-e29b-41d4-a716-446655440003', 'Investment Readiness', 'Complete investment preparation and pitch deck development', 1750, 35);

-- Insert packages for Technology & Development
INSERT INTO packages (service_id, name, description, price, hours) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'Tech Stack Audit', 'Review of your current technology and recommendations', 750, 15),
('550e8400-e29b-41d4-a716-446655440004', 'Technology Strategy', 'Comprehensive technology roadmap and architecture planning', 1100, 22),
('550e8400-e29b-41d4-a716-446655440004', 'Development Partnership', 'Ongoing technical advisory and development support', 2000, 40);
