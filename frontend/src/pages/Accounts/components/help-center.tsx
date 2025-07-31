"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, CreditCard, Shield, Users, Lock, Globe, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useModel } from "@/context/Model.context"

interface FAQItem {
  id: string
  question: string
  answer: string
  icon: React.ComponentType<{ className?: string }>
}

const faqData: FAQItem[] = [
  {
    id: "credit-system",
    question: "How does the credit system work?",
    answer:
      "Credits are used for AI-powered features like document analysis, legal research, and case predictions. Each action consumes a specific number of credits based on complexity. Free accounts get 5 daily credits, while Pro accounts include monthly credit allowances.",
    icon: CreditCard,
  },
  {
    id: "gavin-accuracy",
    question: "How accurate is Gavin AI?",
    answer:
      "Gavin AI maintains a 95%+ accuracy rate across legal document analysis and research tasks. Our AI is trained on millions of legal documents and continuously updated with the latest case law and regulations.",
    icon: Shield,
  },
  {
    id: "account-sharing",
    question: "Can I share my account with colleagues?",
    answer:
      "Yes! Pro accounts support unlimited team members. You can invite colleagues, assign roles, and manage permissions. Each team member gets their own login while sharing the account's credit pool.",
    icon: Users,
  },
  {
    id: "data-security",
    question: "Is my data secure?",
    answer:
      "Absolutely. We use enterprise-grade encryption, SOC 2 compliance, and follow strict data protection protocols. Your documents are encrypted at rest and in transit, and we never share your data with third parties.",
    icon: Lock,
  },
  {
    id: "jurisdictions",
    question: "What jurisdictions does Gavin AI cover?",
    answer:
      "Gavin AI covers all 50 US states, federal law, and major international jurisdictions including UK, Canada, Australia, and EU member states. We're continuously expanding our coverage based on user demand.",
    icon: Globe,
  },
]

export function HelpCenter() {
  const [openItems, setOpenItems] = useState<string[]>([])
   const { ModalOpen, setIsModalOpen } = useModel();

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }


  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:p-6 space-y-3">
      {/* Header */}
      <div className="w-full flex justify-end  md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600 md:hidden"
                    onClick={() => setIsModalOpen(!ModalOpen)}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Help Center</h1>
      </div>

      <div className="w-full border-1 border-gray-400"></div>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-gray-900">Frequently Asked Questions</h2>

        <div className="space-y-3">
          {faqData.map((item) => {
            const Icon = item.icon
            const isOpen = openItems.includes(item.id)

            return (
              <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleItem(item.id)}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{item.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>

      {/* Knowledge Base Link */}
      <div className="text-center ">
        <Button
          variant="link"
          className="text-blue-600 hover:text-blue-700 p-0"
          onClick={() => window.open("/knowledge-base", "_blank")}
        >
          Still need help? Visit our full Knowledge Base
          <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Contact Support */}
      <div className="space-y-3">
        <Button
          className="w-full bg-gray-600 hover:bg-gray-400 text-white py-1"
          size="lg"
        >
          Contact Support
        </Button>
        <p className="text-center text-sm text-gray-500">
          Our team typically responds within 24 hours on business days.
        </p>
      </div>
    </div>
  )
}
