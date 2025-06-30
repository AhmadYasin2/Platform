"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, X, Save } from "lucide-react"
import { supabase, type Startup } from "@/lib/supabase"

interface EmailPreferencesModalProps {
  open: boolean
  onClose: () => void
  startup: Startup
  onUpdate: (startup: Startup) => void
}

export default function EmailPreferencesModal({ open, onClose, startup, onUpdate }: EmailPreferencesModalProps) {
  const [notificationEmail, setNotificationEmail] = useState(startup.notification_email || startup.email)
  const [preferences, setPreferences] = useState(
    startup.email_preferences || {
      meeting_reminders: true,
      service_updates: true,
      general_announcements: true,
    },
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("startups")
        .update({
          notification_email: notificationEmail,
          email_preferences: preferences,
        })
        .eq("id", startup.id)

      if (error) throw error

      onUpdate({
        ...startup,
        notification_email: notificationEmail,
        email_preferences: preferences,
      })

      onClose()
      alert("Email preferences updated successfully!")
    } catch (error) {
      console.error("Error updating email preferences:", error)
      alert("Failed to update email preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#212121] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-6 h-6 text-[#FF7A00]" />
              <span>Email Preferences</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="Enter email for notifications"
              className="mt-1"
            />
            <p className="text-xs text-[#212121] opacity-70 mt-1">
              This email will be used for all program communications
            </p>
          </div>

          <div>
            <Label className="text-base font-medium">Email Types</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meeting_reminders"
                  checked={preferences.meeting_reminders}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, meeting_reminders: checked as boolean })
                  }
                />
                <Label htmlFor="meeting_reminders" className="text-sm">
                  Meeting reminders and calendar invites
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service_updates"
                  checked={preferences.service_updates}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, service_updates: checked as boolean })}
                />
                <Label htmlFor="service_updates" className="text-sm">
                  Service updates and new offerings
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="general_announcements"
                  checked={preferences.general_announcements}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, general_announcements: checked as boolean })
                  }
                />
                <Label htmlFor="general_announcements" className="text-sm">
                  General program announcements
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !notificationEmail}
              className="bg-[#FF7A00] hover:bg-[#E66A00] text-white"
            >
              {saving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
