SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

---------------------------
-- MARKETING (Dalaq & Co.)
---------------------------
UPDATE services
SET description = 'Milestone-based marketing support with 4 tiers: market check → campaigns → GTM → full plan.'
WHERE name ILIKE 'marketing%';

-- Rename by hours (only where needed)
WITH s AS (SELECT id FROM services WHERE name ILIKE 'marketing%')
UPDATE packages p SET name='Market Health Check'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'Market Health Check';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'marketing%')
UPDATE packages p SET name='Marketing Campaign Development'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'Marketing Campaign Development';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'marketing%')
UPDATE packages p SET name='Go-to-Market Strategy'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Go-to-Market Strategy';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'marketing%')
UPDATE packages p SET name='Full Marketing Plan'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'Full Marketing Plan';

-- Descriptions
UPDATE packages p SET description =
'Description: Market overview, basic research, SWOT, early positioning advice.
Key Deliverables: Market need validation and foundational insight into market conditions.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'marketing%' AND p.name='Market Health Check';

UPDATE packages p SET description =
'Description: Custom campaign design (objectives, structure, messaging, timeline).
Key Deliverables: Launch-ready campaign strategy aligned to early customer engagement goals.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'marketing%' AND p.name='Marketing Campaign Development';

UPDATE packages p SET description =
'Description: Full roadmap of marketing activities (3-month plan), growth tactics, marketing mix.
Key Deliverables: Strategic GTM blueprint for launching and scaling early-stage operations.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'marketing%' AND p.name='Go-to-Market Strategy';

UPDATE packages p SET description =
'Description: Comprehensive 6-month marketing strategy with execution steps and cost-effective growth solutions.
Key Deliverables: Scalable, long-term marketing system supporting growth and partnerships.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'marketing%' AND p.name='Full Marketing Plan';

---------------------------
-- BRANDING (o’minus)
---------------------------
UPDATE services
SET description = 'Modular identity, documentation/templates, social content, and basic digital UI concepts (5h packages).'
WHERE name ILIKE 'branding%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'branding%')
UPDATE packages p SET name='Logo Package'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'Logo Package';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'branding%')
UPDATE packages p SET name='Branding Package'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'Branding Package';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'branding%')
UPDATE packages p SET name='Social Media Package'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Social Media Package';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'branding%')
UPDATE packages p SET name='Website & App Package'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'Website & App Package';

UPDATE packages p SET description =
'Description: Visual identity creation.
Key Deliverables: 3 custom logo options, mockups, color palette, and primary font selection.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'branding%' AND p.name='Logo Package';

UPDATE packages p SET description =
'Description: Brand documentation and templates.
Key Deliverables: Brand guideline document, branded PowerPoint theme, editable Canva templates.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'branding%' AND p.name='Branding Package';

UPDATE packages p SET description =
'Description: Social media design assets.
Key Deliverables: Post templates tailored to the brand; up to 20 fully designed ready-to-publish posts.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'branding%' AND p.name='Social Media Package';

UPDATE packages p SET description =
'Description: Basic digital interface design.
Key Deliverables: Initial app UX/UI design, homepage styling template, single-page landing website design.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'branding%' AND p.name='Website & App Package';

---------------------------
-- LEGAL (Nabulsi Law Office)
---------------------------
UPDATE services
SET description = 'Practical startup legal setup: registration, contracts, employment & compliance, IP, and investor readiness.'
WHERE name ILIKE 'legal%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'legal%')
UPDATE packages p SET name='Startup Legal Basics'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'Startup Legal Basics';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'legal%')
UPDATE packages p SET name='Operational Compliance & Contracts'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'Operational Compliance & Contracts';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'legal%')
UPDATE packages p SET name='Advanced Structuring & IP'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Advanced Structuring & IP';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'legal%')
UPDATE packages p SET name='Investor & Regulatory Readiness'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'Investor & Regulatory Readiness';

UPDATE packages p SET description =
'Description: Introductory legal support (registration options, founder setup, documentation needs).
Key Deliverables: Business registration guidance; employment & NDA templates; basic founders’ and service contracts.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'legal%' AND p.name='Startup Legal Basics';

UPDATE packages p SET description =
'Description: Employment law support, contract review, regulatory compliance.
Key Deliverables: Reviewed employment & service contracts; labor law compliance; governance templates.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'legal%' AND p.name='Operational Compliance & Contracts';

UPDATE packages p SET description =
'Description: Shareholder arrangements, IP protection, partnership structuring.
Key Deliverables: Shareholder agreement drafting; IP ownership advisories; partnership contract drafting.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'legal%' AND p.name='Advanced Structuring & IP';

UPDATE packages p SET description =
'Description: SAFE notes, corporate restructuring, investor compliance.
Key Deliverables: Customized SAFE notes; due diligence checklist; MoA/Articles of Association; term sheet review.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'legal%' AND p.name='Investor & Regulatory Readiness';

---------------------------
-- FINANCIAL (Alkhebrat)
---------------------------
UPDATE services
SET description = 'Foundations → projections → profitability & scenarios → investor readiness. Plain-language, practical tools.'
WHERE name ILIKE 'finance%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'finance%')
UPDATE packages p SET name='Startup Finance Essentials'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'Startup Finance Essentials';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'finance%')
UPDATE packages p SET name='Startup Finance in Action'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'Startup Finance in Action';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'finance%')
UPDATE packages p SET name='Strategic Financial Intelligence'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Strategic Financial Intelligence';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'finance%')
UPDATE packages p SET name='Investor Readiness & Strategic Finance'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'Investor Readiness & Strategic Finance';

UPDATE packages p SET description =
'Description: Budgeting, pricing, revenue models, cost structure, simplified statements.
Key Deliverables: 12-month income statement, balance sheet, and cash flow overview.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'finance%' AND p.name='Startup Finance Essentials';

UPDATE packages p SET description =
'Description: 3-year projections, forecasting tools, tax planning, financial health metrics, monitoring.
Key Deliverables: 3-year forecast; tax checklist; burn rate & runway tools; monthly dashboard; cash tracker.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'finance%' AND p.name='Startup Finance in Action';

UPDATE packages p SET description =
'Description: Profitability analysis; break-even & unit economics; ratio analysis; scenario planning.
Key Deliverables: Gross margin review; break-even model; KPI dashboard; mock investor pitch Q&A; risk planning tools.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'finance%' AND p.name='Strategic Financial Intelligence';

UPDATE packages p SET description =
'Description: Valuation; fundraising strategy; term sheets; post-investment financial setup.
Key Deliverables: Valuation model; due diligence checklist; investor reporting framework; capital structure analysis; governance tools.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'finance%' AND p.name='Investor Readiness & Strategic Finance';

---------------------------
-- PROTOTYPING (Twelve Degrees)
---------------------------
UPDATE services
SET description = 'Prototyping from low-fi exploration to high-fi investor-ready outputs across UI/UX and hardware.'
WHERE name ILIKE 'prototyping%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'prototyping%')
UPDATE packages p SET name='Foundation & Exploration'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'Foundation & Exploration';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'prototyping%')
UPDATE packages p SET name='Early Validation & Feedback'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'Early Validation & Feedback';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'prototyping%')
UPDATE packages p SET name='Refined Prototype & Deeper Insights'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Refined Prototype & Deeper Insights';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'prototyping%')
UPDATE packages p SET name='High-Fidelity & Presentation Readiness'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'High-Fidelity & Presentation Readiness';

UPDATE packages p SET description =
'Description: Initial ideation, sketching, concept visualization (low-fidelity).
Key Deliverables: Concept sketches; wireframes; paper prototypes; user journey maps; assumption definitions.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'prototyping%' AND p.name='Foundation & Exploration';

UPDATE packages p SET description =
'Description: Medium-fidelity prototypes with informal user testing (builds on Tier 1).
Key Deliverables: Clickable mockups; service blueprints; basic hardware PoCs; feedback plan; early usability validation.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'prototyping%' AND p.name='Early Validation & Feedback';

UPDATE packages p SET description =
'Description: Higher fidelity with iterative testing and feasibility (builds on Tiers 1 & 2).
Key Deliverables: Advanced UI/UX flows; working hardware samples; structured usability tests; feasibility checks; iterations.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'prototyping%' AND p.name='Refined Prototype & Deeper Insights';

UPDATE packages p SET description =
'Description: Full polish and investor-readiness planning (builds on all prior tiers).
Key Deliverables: High-fidelity visuals; functional models; storytelling support; presentation strategy; technical handoff guidance.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'prototyping%' AND p.name='High-Fidelity & Presentation Readiness';

---------------------------
-- AI (Hijazi Natsheh)
---------------------------
UPDATE services
SET description = 'Readiness, automation, integrated AI solutions, and investor-ready enablement for traction.'
WHERE name ILIKE 'ai%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'ai%')
UPDATE packages p SET name='AI Readiness & Planning'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5 AND p.name NOT ILIKE 'AI Readiness & Planning';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'ai%')
UPDATE packages p SET name='AI Automation & Traction Building'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10 AND p.name NOT ILIKE 'AI Automation & Traction Building';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'ai%')
UPDATE packages p SET name='Integrated AI Solutions'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15 AND p.name NOT ILIKE 'Integrated AI Solutions';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'ai%')
UPDATE packages p SET name='Investor-Ready AI Enablement'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20 AND p.name NOT ILIKE 'Investor-Ready AI Enablement';

UPDATE packages p SET description =
'Description: Needs assessment and roadmap; initial automation/prototype planning.
Key Deliverables: Prioritized AI opportunities; initial workflow map; feasibility notes.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'ai%' AND p.name='AI Readiness & Planning';

UPDATE packages p SET description =
'Description: Solution design + lightweight implementation; traction-oriented automations.
Key Deliverables: Configured automations; basic evaluation metrics; adoption checklist.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'ai%' AND p.name='AI Automation & Traction Building';

UPDATE packages p SET description =
'Description: Deeper workflow integration and traction scaling.
Key Deliverables: Integrated flows; monitoring hooks; iterative improvement plan.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'ai%' AND p.name='Integrated AI Solutions';

UPDATE packages p SET description =
'Description: Investor-ready enablement: smart features, automation, fundraising readiness.
Key Deliverables: Demoable features; evidence of traction; investor-facing summary.'
FROM services s WHERE p.service_id=s.id AND s.name ILIKE 'ai%' AND p.name='Investor-Ready AI Enablement';

---------------------------
-- IT (Website Dev ladder used if IT is combined)
---------------------------
UPDATE services
SET description = 'Four 5–20h tiers across IT domains. Default mapping uses Website Development ladder.'
WHERE name ILIKE 'it%';

WITH s AS (SELECT id FROM services WHERE name ILIKE 'it%')
UPDATE packages p SET description =
'Description: Single landing page (responsive).
Key Deliverables: One-page site, basic sections, contact info.'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=5;

WITH s AS (SELECT id FROM services WHERE name ILIKE 'it%')
UPDATE packages p SET description =
'Description: 3-page responsive site with contact form.
Key Deliverables: Home + 2 inner pages, contact form, basic deployment.'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=10;

WITH s AS (SELECT id FROM services WHERE name ILIKE 'it%')
UPDATE packages p SET description =
'Description: 4–5 pages OR CMS/blog module OR light SEO.
Key Deliverables: Expanded content or CMS/blog or initial SEO checklist.'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=15;

WITH s AS (SELECT id FROM services WHERE name ILIKE 'it%')
UPDATE packages p SET description =
'Description: 6-page site, multilingual-ready, mobile-optimized.
Key Deliverables: Full responsive site, language toggles prepared, performance passes.'
WHERE p.service_id=(SELECT id FROM s) AND p.hours=20;
