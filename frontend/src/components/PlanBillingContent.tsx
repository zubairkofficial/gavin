"use client"

import { X, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useModel } from "@/context/Model.context"

export default function PlanBillingContent() {
    const freeFeatures = [
        "Real-time contact syncing",
        "Automatic data enrichment",
        "Up to 3 seats",
        "Basic support",
    ]
    const proFeatures = [
        "Real-time contact syncing",
        "Automatic data enrichment",
        "Unlimited seats",
        "Priority support",
    ]
    const creditOptions = ["100", "200", "300", "400", "600", "1000"]
    const { ModalOpen, setIsModalOpen } = useModel();

    return (
        <div className="w-full max-w-[600px] mx-auto px-4 pb-4 font-inter md:hidden">
            <div className="w-full flex justify-end ">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setIsModalOpen(!ModalOpen)}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl md:text-3xl font-semibold text-gray-900 text-center mb-2 font-inter">
                    Plans & Billing
                </h1>
            </div>

            {/* Content Area */}
            <div className="space-y-4 md:space-y-6">
                {/* Free Plan */}
                <Card className="w-full shadow-sm">
                    <CardHeader className=" ">
                        <CardTitle className="text-base md:text-lg font-medium">Free</CardTitle>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-bold">$0</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Small Teams</p>
                        <div className="space-y-2 md:space-y-3">
                            {freeFeatures.map((text) => (
                                <div className="flex items-center gap-2" key={text}>
                                    <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                                    <span className="text-sm text-gray-700">{text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2 md:pt-4">
                            <Input placeholder="5 daily credits" className="text-gray-500 text-sm" disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="w-full shadow-sm">
                    <CardHeader className="">
                        <CardTitle className="text-base md:text-lg font-medium">Pro</CardTitle>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl md:text-3xl font-bold">$20</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-600">per user/month, billed annually</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs md:text-sm font-medium text-gray-900 mb-3">For Small Teams</p>
                        <div className="space-y-2 md:space-y-3">
                            {proFeatures.map((text) => (
                                <div className="flex items-center gap-2" key={text}>
                                    <Check className="w-5 h-5 text-[#AFAFAF] bg-gray-200 p-1 flex-shrink-0 rounded" />
                                    <span className="text-sm text-gray-700">{text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3 md:space-y-4 pt-3 md:pt-4">
                            <Select defaultValue="100">
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select credits" />
                                </SelectTrigger>
                                <SelectContent>
                                    {creditOptions.map((val) => (
                                        <SelectItem key={val} value={val}>
                                            {val} credits / month
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm">Upgrade</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}