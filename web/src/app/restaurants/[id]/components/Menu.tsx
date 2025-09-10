"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Filter } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { API_URL } from "@/lib/constants"
import { Dish } from '@/types/dish'

interface FoodCategory {
  _id: string
  name: string
  description?: string
  displayOrder: number
}


interface dishByCategory {
  [categoryId: string]: {
    categoryInfo: FoodCategory
    dishItems: Dish[]
  }
}

interface MenuProps {
  dishByCategory: dishByCategory | null
  defaultMenuLanguage?: string
}

export default function Menu({ dishByCategory, defaultMenuLanguage }: MenuProps) {
  const [filters, setFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
  })
  const [selectedLanguage, setSelectedLanguage] = useState<string>('default')
  const [translatedMenu, setTranslatedMenu] = useState<dishByCategory | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const languageOptions = useMemo(() => [
    { label: 'Default', value: 'default' },
    { label: 'English', value: 'English' },
    { label: '中文', value: 'Chinese' },
    { label: 'Français', value: 'French' },
    { label: '日本語', value: 'Japanese' },
    { label: '한국어', value: 'Korean' },
    { label: 'Español', value: 'Spanish' },
  ], [])

  useEffect(() => {
    if (defaultMenuLanguage) {
      const found = languageOptions.find(opt =>
        opt.value && opt.value.toLowerCase().startsWith(defaultMenuLanguage.toLowerCase())
      )
      if (found) setSelectedLanguage(found.value)
      else setSelectedLanguage('default')
    } else {
      setSelectedLanguage('default')
    }
  }, [defaultMenuLanguage, languageOptions])

  const toggleFilter = (filter: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }))
  }

  const filterFoodItems = (items: Dish[]) => {
    return items.filter(item => {
      if (filters.vegetarian && !item.isVegetarian) return false
      if (filters.vegan && !item.isVegan) return false
      if (filters.glutenFree && !item.isGlutenFree) return false
      return true
    })
  }

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang)
    if (lang === 'default') {
      setTranslatedMenu(null)
      return
    }
    if (dishByCategory) {
      try {
        setIsLoading(true)
        const response = await fetch(`${API_URL}/api/translateMenu`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            menu: dishByCategory,
            language: lang
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        // Check if the response is JSON
        const data = await response.json()
        if (data.success) {
          setTranslatedMenu(data.translatedMenu)
        } else {
          throw new Error(data.message || 'Translation failed')
        }
      } catch (error) {
        console.error('Translation error:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <span className="font-medium">Translate the menu to:</span>
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Please select the language" />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 flex items-center gap-2 bg-gray-50 p-3 rounded-md">
        <Filter size={18} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Dietary Filters:</span>
        <button
          className={`px-2 py-1 text-xs rounded-full ${filters.vegetarian
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          onClick={() => toggleFilter("vegetarian")}
        >
          Vegetarian
        </button>
        <button
          className={`px-2 py-1 text-xs rounded-full ${filters.vegan
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          onClick={() => toggleFilter("vegan")}
        >
          Vegan
        </button>
        <button
          className={`px-2 py-1 text-xs rounded-full ${filters.glutenFree
            ? "bg-green-100 text-green-800 border border-green-300"
            : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          onClick={() => toggleFilter("glutenFree")}
        >
          Gluten Free
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading translated menu...</p>
        </div>
      ) : (translatedMenu || dishByCategory) && Object.values(translatedMenu ? translatedMenu : dishByCategory!).length > 0 ? (
        Object.values(translatedMenu ? translatedMenu : dishByCategory!)
          .sort((a, b) => a.categoryInfo.displayOrder - b.categoryInfo.displayOrder)
          .map(category => {
            const filteredItems = filterFoodItems(category.dishItems)
            if (filteredItems.length === 0) return null

            return (
              <div key={category.categoryInfo._id} className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-gray-900">{category.categoryInfo.name}</h2>
                {category.categoryInfo.description && (
                  <p className="text-gray-600 mb-4">{category.categoryInfo.description}</p>
                )}
                <div className="space-y-4">
                  {filteredItems.map(food => (
                    <div key={food._id} className="flex bg-white p-3 rounded-lg shadow-sm">
                      {food.images && food.images.length > 0 && (
                        <div className="w-20 h-20 rounded-md overflow-hidden mr-4 relative">
                          <Image
                            src={food.images[0]}
                            alt={food.name}
                            className="object-cover"
                            fill
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900">{food.name}</h3>
                          <span className="font-medium text-gray-900">${food.price.toFixed(2)}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{food.description}</p>

                        {food.flavor_profile && (
                          <p className="text-gray-600 text-sm mt-1">
                            <span className="font-bold">Flavor:</span> {food.flavor_profile}
                          </p>
                        )}

                        {food.texture && (
                          <p className="text-gray-600 text-sm mt-1">
                            <span className="font-bold">Texture:</span> {Array.isArray(food.texture) ? food.texture.join(', ') : food.texture}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1">
                          {food.isVegetarian && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Vegetarian
                            </span>
                          )}
                          {food.isVegan && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Vegan
                            </span>
                          )}
                          {food.isGlutenFree && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Gluten Free
                            </span>
                          )}
                          {food.spicyLevel > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Spicy {Array(food.spicyLevel).fill("🌶️").join("")}
                            </span>
                          )}
                          {food.allergens && food.allergens.length > 0 && food.allergens.map(allergen => (
                            <span key={allergen} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No menu items available for this restaurant</p>
        </div>
      )}
    </div>
  )
}
