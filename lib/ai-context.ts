import { supabase } from "./supabase"

export interface StartupContext {
  id: string
  name: string
  founder_name: string
  industry?: string
  stage?: string
  team_size?: number
  total_credits: number
  used_credits: number
  contract_status: string
}

export interface ServiceContext {
  id: string
  name: string
  description: string
  packages: {
    id: string
    name: string
    description: string
    price: number
    hours: number
  }[]
}

export interface MeetingContext {
  id: string
  meeting_date: string
  public_summary?: string
  action_items: string[]
  key_insights: string[]
}

export async function buildStartupContext(startupId: string): Promise<{
  startup: StartupContext
  services: ServiceContext[]
  meetings: MeetingContext[]
  selectedServices: string[]
}> {
  try {
    // Get startup info
    const { data: startup, error: startupError } = await supabase
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .single()

    if (startupError) throw startupError

    // Get all services with packages
    const { data: services, error: servicesError } = await supabase.from("services").select(`
        *,
        packages (*)
      `)

    if (servicesError) throw servicesError

    // Get public meeting summaries
    const { data: meetingSummaries, error: meetingsError } = await supabase
      .from("meeting_summaries")
      .select(`
        *,
        meetings!inner(id, meeting_date, startup_id)
      `)
      .eq("meetings.startup_id", startupId)
      .order("meetings.meeting_date", { ascending: false })
      .limit(5)

    if (meetingsError) throw meetingsError

    // Get selected services
    const { data: selectedServices, error: selectedError } = await supabase
      .from("startup_services")
      .select("package_id")
      .eq("startup_id", startupId)

    if (selectedError) throw selectedError

    return {
      startup: {
        id: startup.id,
        name: startup.name,
        founder_name: startup.founder_name,
        total_credits: startup.total_credits,
        used_credits: startup.used_credits,
        contract_status: startup.contract_status,
      },
      services:
        services?.map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          packages: service.packages || [],
        })) || [],
      meetings:
        meetingSummaries?.map((summary: any) => ({
          id: summary.meetings.id,
          meeting_date: summary.meetings.meeting_date,
          public_summary: summary.public_summary,
          action_items: summary.action_items || [],
          key_insights: summary.key_insights || [],
        })) || [],
      selectedServices: selectedServices?.map((s) => s.package_id) || [],
    }
  } catch (error) {
    console.error("Error building startup context:", error)
    throw error
  }
}

export function buildSystemPrompt(): string {
  return `You are an expert startup advisor for Orange Corners, a leading entrepreneurship program. Your role is to help startups choose the most appropriate services based on their specific needs, stage, and goals.

IMPORTANT GUIDELINES:
- Only recommend services that are available in the provided context
- Consider the startup's available credits and budget constraints
- Focus on services that align with their current stage and immediate needs
- Be specific about why each service would benefit them
- Never reveal any private or manager-only information
- If asked about private meeting notes or internal discussions, politely redirect to public information
- Provide actionable, practical advice based on the startup's profile and history

Your responses should be helpful, professional, and tailored to each startup's unique situation.`
}

export function buildUserPrompt(
  userMessage: string,
  context: {
    startup: StartupContext
    services: ServiceContext[]
    meetings: MeetingContext[]
    selectedServices: string[]
  },
): string {
  const availableCredits = context.startup.total_credits - context.startup.used_credits

  const selectedServiceNames = context.services
    .flatMap((s) => s.packages)
    .filter((p) => context.selectedServices.includes(p.id))
    .map((p) => p.name)

  return `STARTUP PROFILE:
Name: ${context.startup.name}
Founder: ${context.startup.founder_name}
Available Credits: ${availableCredits} hours
Contract Status: ${context.startup.contract_status}
Previously Selected Services: ${selectedServiceNames.length > 0 ? selectedServiceNames.join(", ") : "None"}

AVAILABLE SERVICES:
${context.services
  .map(
    (service) => `
${service.name}: ${service.description}
Packages:
${service.packages.map((pkg) => `  - ${pkg.name} (${pkg.hours} hours): ${pkg.description}`).join("\n")}
`,
  )
  .join("\n")}

RECENT MEETING INSIGHTS:
${
  context.meetings.length > 0
    ? context.meetings
        .map(
          (meeting) => `
Date: ${meeting.meeting_date}
Summary: ${meeting.public_summary || "No summary available"}
Action Items: ${meeting.action_items.join(", ") || "None"}
Key Insights: ${meeting.key_insights.join(", ") || "None"}
`,
        )
        .join("\n")
    : "No recent meetings"
}

USER QUESTION: ${userMessage}

Please provide specific, actionable advice based on this startup's profile and needs.`
}
