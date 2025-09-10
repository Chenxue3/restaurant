import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Globe,
  MessageSquare,
  Bot,
  Star,
  DollarSign,
  Utensils,
  Languages,
  Phone,
  LucideIcon,
} from "lucide-react"

interface FaqItem {
  title: string
  description: string
  icon: LucideIcon
}

export default function FAQsPage() {
  // Product features
  const productFeatures: FaqItem[] = [
    {
      title: "Multilingual Menu Access",
      description: "View detailed menu information in your native language, making ordering seamless and comfortable.",
      icon: Globe,
    },
    {
      title: "Chatbot Reservations",
      description: "Make, modify, or cancel restaurant reservations simply by chatting with our intuitive chatbot.",
      icon: MessageSquare,
    },
    {
      title: "In-Restaurant Service Requests",
      description: "While dining, request services by talking to the chatbot—no need to wait for a staff member to walk by.",
      icon: Bot,
    },
  ]

  // Restaurant benefits
  const restaurantBenefits: FaqItem[] = [
    {
      title: "AI-Enhanced Customer Service",
      description: "Use cutting-edge AI to provide better, more responsive service to your customers.",
      icon: Star,
    },
    {
      title: "Reduced Operational Costs",
      description: "No more phone calls for reservations, and less need for staff to run around the restaurant, reducing operational expenses.",
      icon: DollarSign,
    },
  ]

  // User benefits
  const userBenefits: FaqItem[] = [
    {
      title: "Frustration-Free Ordering",
      description: "Ordering food is no longer a headache. View the menu in your native language, including allergy info, flavor descriptions, and images of each dish—so you know exactly what you're ordering.",
      icon: Utensils,
    },
    {
      title: "Language Barrier Eliminated",
      description: "If you're shy or uncomfortable speaking a foreign language in a non-native country, just communicate with the chatbot in the language you're most comfortable with.",
      icon: Languages,
    },
    {
      title: "No More Phone Calls",
      description: "Don't like making phone calls to manage restaurant bookings? Just chat with the chatbot to make arrangements.",
      icon: Phone,
    },
  ]

  const renderFaqItems = (items: FaqItem[]) => {
    return items.map((item, index) => (
      <div key={index} className="mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <item.icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        </div>
      </div>
    ))
  }

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Discover how SmartSavor is revolutionizing the restaurant experience
          for both diners and restaurant owners.
        </p>
      </div>

      <Tabs defaultValue="product" className="mb-12">
        <TabsList className="w-full mb-8">
          <TabsTrigger
            value="product"
            className="flex-1 text-xs sm:text-sm py-2 px-1 sm:px-4"
          >
            <span className="block truncate">Product Features</span>
          </TabsTrigger>
          <TabsTrigger
            value="restaurants"
            className="flex-1 text-xs sm:text-sm py-2 px-1 sm:px-4"
          >
            <span className="block truncate">For Restaurants</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 text-xs sm:text-sm py-2 px-1 sm:px-4"
          >
            <span className="block truncate">For Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>What Makes Our Product Stand Out</CardTitle>
              <CardDescription>
                Key features that set SmartSavor apart from traditional restaurant solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderFaqItems(productFeatures)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <Card>
            <CardHeader>
              <CardTitle>Why Restaurants Choose SmartSavor</CardTitle>
              <CardDescription>
                Discover how SmartSavor can enhance your restaurant&apos;s operations and customer experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderFaqItems(restaurantBenefits)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Why Users Choose SmartSavor</CardTitle>
              <CardDescription>
                Features that make dining out more enjoyable and accessible for everyone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderFaqItems(userBenefits)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />

      <div className="text-center py-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Still have questions?</h2>
        <p className="text-gray-600 mb-6">
          Contact our support team for more information about SmartSavor.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="mailto:support@smartsavor.com"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-md"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

