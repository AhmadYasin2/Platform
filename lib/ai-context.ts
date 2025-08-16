import { pool } from "@/lib/db";

export interface StartupContext {
  id: string;
  name: string;
  founder_name: string | null;
  total_credits: number;
  used_credits: number;
  contract_status: string;
}

export interface ServiceContext {
  id: string;
  name: string;
  description: string;
  packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    hours: number;
  }[];
}

export interface MeetingContext {
  id: string;
  meeting_date: string;
  public_summary?: string;
  action_items: string[];
  key_insights: string[];
}

export async function buildStartupContext(startupId: string): Promise<{
  startup: StartupContext;
  services: ServiceContext[];
  meetings: MeetingContext[];
  selectedServices: string[];
}> {
  // 1) Startup
  const { rows: startupRows } = await pool.query(
    `SELECT id,name,founder_name,total_credits,used_credits,contract_status
     FROM startups WHERE id=$1 LIMIT 1`,
    [startupId]
  );
  if (!startupRows.length) throw new Error("Startup not found");
  const startup = startupRows[0];

  // 2) Services + packages
  const { rows: serviceRows } = await pool.query(
    `SELECT s.id AS service_id,s.name AS service_name,s.description AS service_desc,
            p.id AS package_id,p.name AS package_name,p.description AS package_desc,p.price,p.hours
     FROM services s
     LEFT JOIN packages p ON p.service_id = s.id
     ORDER BY s.name ASC`
  );

  const serviceMap = new Map<string, ServiceContext>();
  for (const row of serviceRows) {
    if (!serviceMap.has(row.service_id)) {
      serviceMap.set(row.service_id, {
        id: row.service_id,
        name: row.service_name,
        description: row.service_desc,
        packages: [],
      });
    }
    if (row.package_id) {
      serviceMap.get(row.service_id)!.packages.push({
        id: row.package_id,
        name: row.package_name,
        description: row.package_desc,
        price: row.price,
        hours: row.hours,
      });
    }
  }
  const services = [...serviceMap.values()];

  // 3) Meeting summaries
  const { rows: meetingRows } = await pool.query(
    `SELECT m.id,m.meeting_date,ms.public_summary,ms.action_items,ms.key_insights
     FROM meetings m
     LEFT JOIN meeting_summaries ms ON ms.meeting_id=m.id
     WHERE m.startup_id=$1
     ORDER BY m.meeting_date DESC
     LIMIT 5`,
    [startupId]
  );
  const meetings = meetingRows.map(m => ({
    id: m.id,
    meeting_date: m.meeting_date,
    public_summary: m.public_summary,
    action_items: m.action_items || [],
    key_insights: m.key_insights || [],
  }));

  // 4) Selected services
  const { rows: selectedRows } = await pool.query(
    `SELECT package_id FROM startup_services WHERE startup_id=$1`,
    [startupId]
  );
  const selectedServices = selectedRows.map(r => r.package_id);

  return {
    startup,
    services,
    meetings,
    selectedServices,
  };
}

export function buildSystemPrompt(): string {
  return `You are an expert startup advisor for Orange Corners.
Your role is to help startups choose the most appropriate services
based on their needs, stage, and goals.

- Never reveal credits or prices
- Recommend only services in the context
- Align with meeting notes and startup goals
- Give actionable and professional advice`;
}

export function buildUserPrompt(
  userMessage: string,
  context: {
    startup: StartupContext;
    services: ServiceContext[];
    meetings: MeetingContext[];
    selectedServices: string[];
  }
): string {
  const availableCredits = context.startup.total_credits - context.startup.used_credits;
  const selected = context.services
    .flatMap(s => s.packages)
    .filter(p => context.selectedServices.includes(p.id))
    .map(p => p.name);

  return `STARTUP: ${context.startup.name}
Founder: ${context.startup.founder_name}
Credits Available: ${availableCredits}
Selected Services: ${selected.length ? selected.join(", ") : "None"}

MEETING INSIGHTS:
${context.meetings.map(m => `- ${m.meeting_date}: ${m.public_summary ?? "No summary"}`).join("\n")}

USER QUESTION: ${userMessage}`;
}
