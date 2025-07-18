"use client"

import { X, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useModel } from "@/context/Model.context"
import { useState } from "react"
import API from "@/lib/api"

export default function PlanBillingContent() {
  const [selectedCredit, setSelectedCredit] = useState<keyof typeof creditPricing>("100")
  const [isUpgrading, setIsUpgrading] = useState(false)

  const freeFeatures = ["Real-time contact syncing", "Automatic data enrichment", "Up to 3 seats", "Basic support"]

  const proFeatures = ["Real-time contact syncing", "Automatic data enrichment", "Unlimited seats", "Priority support"]

  const creditPricing = {
    "100": 20,
    "200": 35,
    "300": 50,
    "400": 65,
    "600": 90,
    "1000": 140,
  }

  const creditOptions = ["100", "200", "300", "400", "600", "1000"]

  const { ModalOpen, setIsModalOpen } = useModel()

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true)
      console.log('creadits that we are purchansing' , Number.parseInt(selectedCredit))
      await API.post("/chat/add-credits", {
        credits: Number.parseInt(selectedCredit),
      })
      // Handle success (maybe show a success message or redirect)
      console.log("Successfully upgraded with", selectedCredit, "credits")
    } catch (error) {
      console.error("Error upgrading plan:", error)
      // Handle error (maybe show an error message)
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="px-4 md:px-6 w-full font-inter">
      <div className="w-full flex justify-end ">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600 md:hidden"
          onClick={() => setIsModalOpen(!ModalOpen)}
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <h1 className="text-xl md:text-3xl font-semibold text-gray-900 mb-4 md:mb-6 text-center">Plans & Billing</h1>

      <div className="space-y-4 md:space-y-3">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          {/* Free Plan - $0 */}
          <Card className="relative w-full h-fit">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg font-medium">Free</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold">$0</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Small Teams</p>
              <div className="space-y-2 md:space-y-3">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 md:pt-4">
                <Input placeholder="5 daily credits" className="text-gray-500 text-sm" disabled />
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan - Dynamic Price */}
          <Card className="relative w-full">
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-base md:text-lg font-medium">Pro</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-bold">${creditPricing[selectedCredit]}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Growing Teams</p>
              <div className="space-y-2 md:space-y-3">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 md:space-y-4 pt-3">
                <Select value={selectedCredit} onValueChange={(value) => setSelectedCredit(value as keyof typeof creditPricing)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select credits" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditOptions.map((credits) => (
                      <SelectItem key={credits} value={credits}>
                        {credits} credits / month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? "Upgrading..." : "Upgrade"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
