"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"
import restaurantsAPI from "@/services/restaurants"

interface AnalyzedMenuItem {
  name: string
  description?: string
  price: string
  attributes?: string[]
  allergens?: string[]
  flavor_profile?: string
  texture?: string
  image_url?: string
}

interface AnalyzedCategory {
  name: string
  items: AnalyzedMenuItem[]
}

interface AnalyzedMenu {
  restaurant_name?: string
  menu_type: string
  categories: AnalyzedCategory[]
}

export default function ScanMenuPage() {
  const [menuImage, setMenuImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisLanguage, setAnalysisLanguage] = useState<string>('English')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzedMenu | null>(null)
  const [generatingImageForDish, setGeneratingImageForDish] = useState<string | null>(null)
  const [dishImages, setDishImages] = useState<Record<string, string>>({})

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMenuImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!menuImage) {
      toast.error("Please select a menu image")
      return
    }

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('menuImage', menuImage)
      formData.append('language', analysisLanguage)

      const { data: analysisData } = await restaurantsAPI.scanMenu(formData)

      if (!analysisData.success) {
        toast.error(analysisData.message || "Failed to analyze menu")
        return
      }

      setAnalysisResult(analysisData.data)
      toast.success("Menu translation completed")
    } catch (error) {
      console.error("Error analyzing menu:", error)
      toast.error(error instanceof Error ? error.message : "Failed to analyze menu")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateDishImage = async (dishName: string, dishDescription?: string) => {
    try {
      if (dishImages[dishName]) return

      setGeneratingImageForDish(dishName)
      const response = await restaurantsAPI.generateDishImage(dishName, dishDescription || '')

      if (response.data && response.data.success && response.data.data.image_url) {
        setDishImages(prev => ({
          ...prev,
          [dishName]: response.data.data.image_url
        }))
      } else {
        toast.error('Failed to generate dish image')
      }
    } catch (error) {
      console.error('Error generating dish image:', error)
      toast.error('Failed to generate dish image')
    } finally {
      setGeneratingImageForDish(null)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Scan & Translate Menu</h1>

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Upload a menu image to get AI-powered translation and analysis!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div className="w-full">
                    <Select
                      value={analysisLanguage}
                      onValueChange={setAnalysisLanguage}
                      required
                    >
                      <SelectTrigger id="analysisLanguage" className="w-full">
                        <SelectValue placeholder="Select Expected language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Chinese">中文</SelectItem>
                        <SelectItem value="French">Français</SelectItem>
                        <SelectItem value="Japanese">日本語</SelectItem>
                        <SelectItem value="Korean">한국어</SelectItem>
                        <SelectItem value="Spanish">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full">
                    <Input
                      type="file"
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="w-full"
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <Button
                      onClick={handleAnalyze}
                      disabled={!menuImage || isAnalyzing || !analysisLanguage}
                      className="w-full md:w-auto"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Translate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview</h4>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                    {isAnalyzing ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <Image
                        src={imagePreview}
                        alt="Menu preview"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-6">Translation Results</h4>

                  {analysisResult.restaurant_name && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-500">Restaurant Name</h5>
                      <p className="text-lg">{analysisResult.restaurant_name}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-500">Menu Type</h5>
                    <p className="text-lg">{analysisResult.menu_type}</p>
                  </div>

                  <div className="space-y-8">
                    {analysisResult.categories?.map((category, index) => (
                      <div key={index} className="bg-white rounded-lg overflow-hidden">
                        <h6 className="text-lg font-medium px-4 pt-4 pb-2 border-b border-gray-100">{category.name}</h6>

                        <div className="divide-y divide-gray-100">
                          {category.items?.map((item, itemIndex) => (
                            <div key={itemIndex} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col gap-3">
                                {/* Dish header with name and price */}
                                <div className="flex justify-between items-start">
                                  <h6 className="font-medium text-gray-900">{item.name}</h6>
                                  <span className="text-base font-medium text-gray-900">{item.price}</span>
                                </div>

                                {/* Description */}
                                {item.description && (
                                  <p className="text-sm text-gray-600">{item.description}</p>
                                )}

                                {/* Tags */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.attributes && item.attributes.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {item.attributes.map((attr, attrIndex) => (
                                        <span key={attrIndex} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {item.allergens && item.allergens.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {item.allergens.map((allergen, allergenIndex) => (
                                        <span key={allergenIndex} className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs">
                                          {allergen}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Generate Image Button - moved to bottom */}
                                {!dishImages[item.name] && (
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-8"
                                      onClick={() => handleGenerateDishImage(item.name, item.description)}
                                      disabled={generatingImageForDish === item.name}
                                    >
                                      {generatingImageForDish === item.name ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <span>View Image</span>
                                      )}
                                    </Button>
                                  </div>
                                )}

                                {/* Generated Image */}
                                {dishImages[item.name] && (
                                  <div className="mt-3 w-full md:w-2/3 lg:w-1/2 mx-auto rounded-md overflow-hidden">
                                    <div className="aspect-[4/3] relative">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={dishImages[item.name]}
                                        alt={`${item.name} visualization`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 