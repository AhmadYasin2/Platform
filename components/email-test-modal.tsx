"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, X, TestTube, CheckCircle, AlertCircle } from "lucide-react"

interface EmailTestModalProps {
  open: boolean
  onClose: () => void
}

export default function EmailTestModal({ open, onClose }: EmailTestModalProps) {
  const [testEmail, setTestEmail] = useState("")
  const [subject, setSubject] = useState("Test Email from Orange Corners")
  const [message, setMessage] =
    useState(`This is a test email to verify that our Mailjet integration is working correctly.

Key features being tested:
• HTML email formatting
• Branded Orange Corners template
• Delivery confirmation
• Professional styling

If you receive this email, the integration is working perfectly!`)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null)

  const handleSendTest = async () => {
    if (!testEmail || !subject || !message) {
      alert("Please fill in all fields")
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [
            {
              email: testEmail,
              notification_email: testEmail,
              name: "Test User",
            },
          ],
          subject,
          message,
          senderName: "Orange Corners Test System",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          messageId: data.messageId,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to send test email",
        })
      }
    } catch (error) {
      console.error("Test email error:", error)
      setResult({
        success: false,
        message: "Network error occurred",
      })
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#212121] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="w-6 h-6 text-[#FF7A00]" />
              <span>Test Mailjet Email System</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{result.success ? "Email Sent Successfully!" : "Email Failed"}</span>
              </div>
              <p className="text-sm">{result.message}</p>
              {result.messageId && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Message ID: {result.messageId}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">About This Test</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Tests Mailjet API integration and authentication</li>
              <li>• Verifies HTML email template rendering</li>
              <li>• Confirms delivery and tracking capabilities</li>
              <li>• Validates branded Orange Corners styling</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to receive test message"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || !subject || !message || sending}
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
              {sending ? (
                <>
                  <Send className="w-4 h-4 mr-2 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
