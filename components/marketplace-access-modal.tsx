"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, X, Check, Ban } from "lucide-react"
import { supabase, type Startup } from "@/lib/supabase"

interface MarketplaceAccessModalProps {
  open: boolean
  onClose: () => void
  selectedStartups: Startup[]
  onAccessUpdated: () => void
}

export default function MarketplaceAccessModal({
  open,
  onClose,
  selectedStartups,
  onAccessUpdated,
}: MarketplaceAccessModalProps) {
  const [updating, setUpdating] = useState(false)

  const updateMarketplaceAccess = async (enable: boolean) => {
    setUpdating(true)
    try {
      const startupIds = selectedStartups.map((s) => s.id)

      const { error } = await supabase.from("startups").update({ marketplace_access: enable }).in("id", startupIds)

      if (error) throw error

      onAccessUpdated()
      onClose()
      alert(
        `Marketplace access ${enable ? "enabled" : "disabled"} for ${selectedStartups.length} startup${
          selectedStartups.length > 1 ? "s" : ""
        }`,
      )
    } catch (error) {
      console.error("Error updating marketplace access:", error)
      alert("Failed to update marketplace access. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const enabledCount = selectedStartups.filter((s) => s.marketplace_access).length
  const disabledCount = selectedStartups.length - enabledCount

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#212121] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
              <span>Manage Marketplace Access</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Selected Startups ({selectedStartups.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedStartups.map((startup) => (
                <div key={startup.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-[#212121]">{startup.name}</span>
                  <Badge
                    className={`text-xs ${
                      startup.marketplace_access
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {startup.marketplace_access ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
              <div className="text-sm text-green-700">Currently Enabled</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{disabledCount}</div>
              <div className="text-sm text-red-700">Currently Disabled</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">About Marketplace Access</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Enabled:</strong> Startups can browse and select service packages
              </li>
              <li>
                • <strong>Disabled:</strong> Startups cannot access the marketplace but can still view their dashboard
              </li>
              <li>• Changes take effect immediately</li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <Button
              onClick={() => updateMarketplaceAccess(true)}
              disabled={updating || enabledCount === selectedStartups.length}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              {updating ? "Updating..." : "Enable Access"}
            </Button>
            <Button
              onClick={() => updateMarketplaceAccess(false)}
              disabled={updating || disabledCount === selectedStartups.length}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Ban className="w-4 h-4 mr-2" />
              {updating ? "Updating..." : "Disable Access"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
