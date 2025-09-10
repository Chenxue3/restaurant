import { useState } from "react"
import { Flame, MapPin, Utensils, ChevronDown } from "lucide-react"

export function NavigationTabs() {
  const [activeTab, setActiveTab] = useState("top-hit")

  const tabs = [
    {
      id: "top-hit",
      label: "Top Hit Post",
      icon: <Flame size={18} />,
    },
    {
      id: "nearest",
      label: "Nearest Restaurant",
      icon: <MapPin size={18} />,
    },
    {
      id: "food-choice",
      label: "Food Choice",
      icon: <Utensils size={18} />,
    }
  ]

  return (
    <div className="flex flex-wrap items-center mb-4 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center px-4 py-2 ${activeTab === tab.id
            ? "border-b-2 border-theme text-theme"
            : "text-gray-600 hover:text-theme hover:border-b-2 hover:border-theme/40"
            }`}
        >
          <span className="mr-2">{tab.icon}</span>
          <span className="font-medium">{tab.label}</span>
          {tab.id === "food-choice" && (
            <ChevronDown size={16} className="ml-1" />
          )}
        </button>
      ))}
    </div>
  )
} 