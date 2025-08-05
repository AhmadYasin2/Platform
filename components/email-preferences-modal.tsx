"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, X, Save } from "lucide-react";

export interface Startup {
  id: string;
  name: string;
  founder_name: string | null;
  email: string;                        // ← add this
  logo_url: string | null;
  contract_status: "Pending" | "Sent" | "Signed";
  total_credits: number;
  used_credits: number;
  marketplace_access: boolean;
  user_id: string | null;
  created_by: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;

  // ← new email-preferences fields:
  notification_email?: string;
  email_preferences?: {
    meeting_reminders: boolean;
    service_updates: boolean;
    general_announcements: boolean;
  };
}
interface EmailPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  startup: Startup;
  onUpdate: (startup: Startup) => void;
}

export default function EmailPreferencesModal({
  open,
  onClose,
  startup,
  onUpdate,
}: EmailPreferencesModalProps) {
  const [notificationEmail, setNotificationEmail] = useState(
    startup.notification_email || startup.email
  );
  const [preferences, setPreferences] = useState(
    startup.email_preferences || {
      meeting_reminders: true,
      service_updates: true,
      general_announcements: true,
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/startups/${startup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_email: notificationEmail,
          email_preferences: preferences,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to update");
      }

      // inform parent of the update
      onUpdate({
        ...startup,
        notification_email: notificationEmail,
        email_preferences: preferences,
      });

      onClose();
      alert("Email preferences updated successfully!");
    } catch (error) {
      console.error("Error updating email preferences:", error);
      alert("Failed to update email preferences");
    } finally {
      setSaving(false);
    }
  };

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
                  onCheckedChange={(c) =>
                    setPreferences({
                      ...preferences,
                      meeting_reminders: c as boolean,
                    })
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
                  onCheckedChange={(c) =>
                    setPreferences({
                      ...preferences,
                      service_updates: c as boolean,
                    })
                  }
                />
                <Label htmlFor="service_updates" className="text-sm">
                  Service updates and new offerings
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="general_announcements"
                  checked={preferences.general_announcements}
                  onCheckedChange={(c) =>
                    setPreferences({
                      ...preferences,
                      general_announcements: c as boolean,
                    })
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
  );
}
