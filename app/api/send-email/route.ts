import { NextResponse } from "next/server"
import Mailjet from "node-mailjet"

// Initialize Mailjet
const mailjet = Mailjet.apiConnect(process.env.MAILJET_API_KEY!, process.env.MAILJET_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { recipients, subject, message, senderName = "Orange Corners Team" } = await request.json()

    if (!recipients || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare email data for Mailjet
    const emailData = {
      Messages: recipients.map((recipient: any) => ({
        From: {
          Email: process.env.MAILJET_FROM_EMAIL!,
          Name: senderName,
        },
        To: [
          {
            Email: recipient.notification_email || recipient.email,
            Name: recipient.name,
          },
        ],
        Subject: subject,
        HTMLPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background-color: #FF7A00; padding: 30px 20px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <div style="width: 48px; height: 48px; background-color: #FF7A00; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 3px solid white;">
                  <div style="width: 32px; height: 32px; background-color: white; border-radius: 4px; position: relative;">
                    <div style="position: absolute; top: 0; right: 0; width: 8px; height: 8px; background-color: #FF7A00;"></div>
                  </div>
                </div>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Orange Corners</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Entrepreneurship for a better world</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px; background-color: #f9f9f9;">
              <h2 style="color: #212121; margin: 0 0 20px 0; font-size: 24px;">Hello ${recipient.name}!</h2>
              
              <div style="background-color: white; padding: 30px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="color: #212121; font-size: 16px; line-height: 1.6;">
                  ${message.replace(/\n/g, "<br>")}
                </div>
              </div>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <p style="color: #666; font-size: 16px; margin: 0;">
                  Best regards,<br>
                  <strong style="color: #212121;">${senderName}</strong><br>
                  <span style="color: #FF7A00;">Orange Corners Program</span>
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #212121; padding: 25px 20px; text-align: center;">
              <div style="margin-bottom: 15px;">
                <div style="display: inline-flex; align-items: center; justify-content: center;">
                  <div style="width: 24px; height: 24px; background-color: #FF7A00; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
                    <div style="width: 16px; height: 16px; background-color: white; border-radius: 2px; position: relative;">
                      <div style="position: absolute; top: 0; right: 0; width: 4px; height: 4px; background-color: #FF7A00;"></div>
                    </div>
                  </div>
                  <span style="color: white; font-weight: bold; font-size: 16px;">Orange Corners</span>
                </div>
              </div>
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2025 Orange Corners. All Rights Reserved. 
              </p>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                You received this email because you're part of the Orange Corners entrepreneurship program.
              </p>
            </div>
          </div>
        `,
        TextPart: `
Hello ${recipient.name}!

${message}

Best regards,
${senderName}
Orange Corners Program

---
© 2025 Orange Corners. All Rights Reserved.
You received this email because you're part of the Orange Corners entrepreneurship program.
        `,
      })),
    }

    // Send emails via Mailjet
    const result = await mailjet.post("send", { version: "v3.1" }).request(emailData)

    // console.log("Mailjet response:", result.body)

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipient(s)`,
      messageId: result.body.Messages?.[0]?.To?.[0]?.MessageID,
    })
  } catch (error) {
    console.error("Mailjet error:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.response?.body || error.message,
      },
      { status: 500 },
    )
  }
}
