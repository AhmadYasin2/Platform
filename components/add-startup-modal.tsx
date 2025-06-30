// AddStartupModal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Copy } from "lucide-react";

interface AddStartupModalProps {
  open: boolean;
  onClose: () => void;
  onStartupAdded: () => void;
}

export default function AddStartupModal({
  open,
  onClose,
  onStartupAdded,
}: AddStartupModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    founderName: "",
    email: "",
    description: "",
    totalCredits: 1250,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ password: string } | null>(null);

  const generatePassword = (founderName: string) => {
    const cleanName = founderName.toLowerCase().replace(/\s+/g, "");
    const randomNumbers = Math.floor(Math.random() * 90) + 10;
    return `${cleanName}${randomNumbers}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(null);

    try {
      const password = generatePassword(formData.founderName);

      // 1) Create the startup
      const res = await fetch("/api/create-startup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          founderName: formData.founderName,
          email: formData.email,
          password,
          totalCredits: formData.totalCredits,
        }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error);

      // 2) Mark success & notify parent
      setSuccess({ password });
      onStartupAdded();

      // 3) Send welcome email
      const recipients = [{ name: formData.name, email: formData.email }];
      const subject = `🎉 Welcome to Orange Corners, ${formData.name}!`;
      const message = `
Hello ${formData.founderName},

Your startup "${formData.name}" is now live on Orange Corners.

Login details:
 • Email: ${formData.email}
 • Password: ${password}

Total Credits: ${formData.totalCredits}

${
  formData.description ? `About your startup:\n${formData.description}\n\n` : ""
}
Log in at: https://orangecorners.uyi.ai

— Orange Corners Team
      `.trim();

      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject, message }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      founderName: "",
      email: "",
      description: "",
      totalCredits: 1000,
    });
    setError("");
    setSuccess(null);
    onClose();
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // === SUCCESS VIEW ===
  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-green-600 flex items-center justify-between">
              ✅ Startup Created & Email Sent!
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border rounded-lg">
              <h4 className="font-medium text-green-800">Login Credentials:</h4>
              <div className="flex justify-between mt-2">
                <div>
                  <p className="text-xs text-gray-600">Email:</p>
                  <p className="font-mono">{formData.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(formData.email)}
                >
                  <Copy className="w-4 h-4 text-green-600" />
                </Button>
              </div>
              <div className="flex justify-between mt-2">
                <div>
                  <p className="text-xs text-gray-600">Password:</p>
                  <p className="font-mono">{success.password}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(success.password)}
                >
                  <Copy className="w-4 h-4 text-green-600" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-[#FF7A00] text-white"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // === FORM VIEW ===
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#212121] flex items-center justify-between">
            Add New Startup
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startupName" className="font-medium">
                Startup Name *
              </Label>
              <Input
                id="startupName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="mt-1"
                placeholder="e.g., TechVenture Inc."
              />
            </div>
            <div>
              <Label htmlFor="founderName" className="font-medium">
                Founder/Team Lead Name *
              </Label>
              <Input
                id="founderName"
                value={formData.founderName}
                onChange={(e) =>
                  setFormData({ ...formData, founderName: e.target.value })
                }
                required
                className="mt-1"
                placeholder="e.g., John Smith"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="font-medium">
              Startup Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="mt-1 w-full"
              placeholder="contact@startup.com"
            />
          </div>

          <div>
            <Label htmlFor="totalCredits" className="font-medium">
              Total Credits
            </Label>
            <Input
              id="totalCredits"
              type="number"
              value={formData.totalCredits}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  totalCredits: Number(e.target.value),
                })
              }
              min={0}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <Label htmlFor="description" className="font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="mt-1 w-full"
              placeholder="Brief description of the startup..."
            />
          </div>

          {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-[#212121] mb-2">
              Auto-generated Credentials:
            </h4>
            <p>
              <strong>Password:</strong>{" "}
              {formData.founderName
                ? generatePassword(formData.founderName)
                : "[founder-name][random-numbers]"}
            </p>
          </div> */}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !formData.name ||
                !formData.founderName ||
                !formData.email ||
                saving
              }
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Creating..." : "Create Startup"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
