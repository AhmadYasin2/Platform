"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, X, TestTube } from "lucide-react"
import type { Startup } from "@/lib/supabase"
import EmailTestModal from "@/components/email-test-modal"

interface EmailModalProps {
  open: boolean
  onClose: () => void
  selectedStartups: Startup[]
}

export default function EmailModal({ open, onClose, selectedStartups }: EmailModalProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [testModalOpen, setTestModalOpen] = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selectedStartups.map((startup) => ({
            email: startup.email,
            notification_email: startup.notification_email || startup.email,
            name: startup.name,
          })),
          subject,
          message,
          senderName: "Orange Corners Program Manager",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSending(false)
        setSubject("")
        setMessage("")
        onClose()
        alert(`✅ ${result.message}`)
      } else {
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Email error:", error)
      alert(`❌ Failed to send email: ${error.message}`)
      setSending(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#212121] flex items-center justify-between">
              {/* <div className="flex items-center space-x-3">
                <span>Send Email to {selectedStartups.length} Startups</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestModalOpen(true)}
                  className="text-[#1BC9C9] border-[#1BC9C9] hover:bg-[#1BC9C9] hover:text-white"
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test Email
                </Button>
              </div> */}
              {/* <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button> */}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-[#F9F7F1] rounded-lg">
              <p className="text-sm text-[#212121] font-medium mb-2">Recipients:</p>
              <div className="flex flex-wrap gap-2">
                {selectedStartups.map((startup) => (
                  <span key={startup.id} className="px-2 py-1 bg-white rounded text-xs text-[#212121]">
                    {startup.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="subject" className="text-[#212121] font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-[#212121] font-medium">
                Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={8}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} className="bg-white text-[#212121] border-gray-300">
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!subject || !message || sending}
                className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {testModalOpen && <EmailTestModal open={testModalOpen} onClose={() => setTestModalOpen(false)} />}
    </>
  )
}
