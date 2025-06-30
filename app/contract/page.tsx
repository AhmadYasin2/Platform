"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"
import { supabase, type Startup } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

export default function ContractPage() {
  const [startup, setStartup] = useState<Startup | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchStartupData()
    }
  }, [user])

  const fetchStartupData = async () => {
    try {
      const { data, error } = await supabase.from("startups").select("*").eq("user_id", user?.id).single()

      if (error) throw error

      setStartup(data)
    } catch (error) {
      console.error("Error fetching startup data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Signed":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "Sent":
        return <Clock className="w-6 h-6 text-yellow-600" />
      case "Pending":
        return <AlertCircle className="w-6 h-6 text-red-600" />
      default:
        return <FileText className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Signed":
        return "bg-green-100 text-green-800 border-green-200"
      case "Sent":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Pending":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "Signed":
        return "Congratulations! Your contract has been signed and you have full access to all program services and resources."
      case "Sent":
        return "Your contract has been sent to you for review and signature. Please check your email and return the signed document as soon as possible."
      case "Pending":
        return "Your contract is being prepared by our team. You will receive it via email once it's ready for your review."
      default:
        return "Contract status information is not available at this time."
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FF7A00]" />
            <p className="text-[#212121]">Loading contract information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!startup) {
    return (
      <DashboardLayout>
        <div className="p-6 bg-[#F9F7F1] min-h-screen flex items-center justify-center">
          <p className="text-[#212121]">Unable to load contract information</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 bg-[#F9F7F1] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#212121] mb-2">Contract Status</h1>
          <p className="text-[#212121] opacity-70">View your program participation contract details</p>
        </div>

        <div className="max-w-2xl">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-[#212121] flex items-center space-x-3">
                <FileText className="w-6 h-6 text-[#FF7A00]" />
                <span>Orange Corners Program Contract</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center p-8 bg-[#F9F7F1] rounded-lg">
                <div className="text-center">
                  <div className="flex justify-center mb-4">{getStatusIcon(startup.contract_status)}</div>
                  <h3 className="text-lg font-semibold text-[#212121] mb-2">Your contract status is:</h3>
                  <Badge className={`${getStatusColor(startup.contract_status)} border text-lg px-4 py-2`}>
                    {startup.contract_status}
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-[#212121]">{getStatusMessage(startup.contract_status)}</p>
              </div>

              {startup.contract_status === "Signed" && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#212121]">Contract Details:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#212121] opacity-70">Program Duration:</span>
                      <p className="font-medium text-[#212121]">6 months</p>
                    </div>
                    <div>
                      <span className="text-[#212121] opacity-70">Start Date:</span>
                      <p className="font-medium text-[#212121]">{new Date(startup.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-[#212121] opacity-70">Total Credits:</span>
                      <p className="font-medium text-[#212121]">{startup.total_credits} hours</p>
                    </div>
                    <div>
                      <span className="text-[#212121] opacity-70">Program Manager:</span>
                      <p className="font-medium text-[#212121]">Farah Al-Rashid</p>
                    </div>
                  </div>
                </div>
              )}

              {startup.contract_status === "Sent" && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-[#212121] mb-2">Next Steps:</h4>
                  <ul className="text-sm text-[#212121] space-y-1">
                    <li>• Check your email for the contract document</li>
                    <li>• Review all terms and conditions carefully</li>
                    <li>• Sign and return the document within 7 days</li>
                    <li>• Contact your program manager if you have questions</li>
                  </ul>
                </div>
              )}

              {startup.contract_status === "Pending" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-[#212121] mb-2">What's Next:</h4>
                  <p className="text-sm text-[#212121]">
                    Our team is preparing your contract based on your application and program requirements. You will
                    receive an email notification once your contract is ready for review. This typically takes 2-3
                    business days.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
