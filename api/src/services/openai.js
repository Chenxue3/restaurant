import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 */
export const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
    }

    return new OpenAI({ apiKey });
};

/**
 * Analyze a restaurant menu image using OpenAI with structured output
 * @param {string} imageUrl - URL of the menu image
 * @param {string} language - Language code (e.g., "en", "zh")
 * @returns {Promise<Object>} - Analyzed menu data
 */
export const analyzeMenuImageFromOpenAI = async (imageUrl, language = 'en') => {
    try {
        console.log(`Starting menu analysis for image: ${imageUrl}`);
        const client = getOpenAIClient();

        const messages = [
            {
                role: "system",
                content: `You are a restaurant menu expert that can analyze menu images accurately.
                When analyzing restaurant menu images:
                1. Focus on organizing menu items by categories (appetizers, main dishes, desserts, etc.)
                2. Keep the JSON structure in English but provide all content in ${language}
                3. Extract item names, descriptions, and prices accurately
                4. **IMPORTANT: Keep the original price and currency symbol exactly as seen in the image. Do NOT localize or convert currencies.** For example, if the price is "$12.99" or "NT$150", it must appear exactly as such.
                5. Include information about spiciness level, vegetarian/vegan options, allergens when available
                6. Identify and list potential allergens for each dish (e.g., nuts, dairy, gluten, shellfish, soy)
                7. Analyze and describe flavor profiles (e.g., sweet, savory, spicy, umami, sour)
                8. Describe texture characteristics when possible (e.g., crispy, tender, creamy, crunchy)
                9. Be comprehensive but concise
                10. If you can't read certain items clearly, indicate this in the output
                11. **CRITICAL: The response MUST be valid JSON format. Follow these rules strictly:**
                   - All property names must be in double quotes
                   - All strings must be in double quotes
                   - Use commas to separate array elements and object properties
                   - Close all arrays with ] and objects with }
                   - Do not add extra commas after the last element
                   - Ensure all categories are within the same categories array
                   - Double check the JSON structure before returning`
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Analyze this restaurant menu image and organize the menu items.
                  Return the response in this EXACT JSON format (do not modify the structure):
                  {
                      "restaurant_name": "Name of the restaurant if visible",
                      "menu_type": "Breakfast/Lunch/Dinner/Special menu type if specified",
                      "categories": [
                          {
                              "name": "Category name (e.g., Appetizers, Main Dishes, etc.)",
                              "items": [
                                  {
                                      "name": "Item name in specified language",
                                      "description": "Item description in specified language",
                                      "price": "Keep the price and currency symbol **exactly as in the image** — do NOT convert or localize currency (e.g., $ -> ￥ or NT$).",
                                      "attributes": ["spicy", "vegetarian", "vegan", "gluten-free", etc.],
                                      "allergens": ["dairy", "nuts", "gluten", "shellfish", "eggs", "soy", etc.],
                                      "flavor_profile": "Description of flavors in specified language",
                                      "texture": "Description of texture in specified language"
                                  }
                              ]
                          }
                      ]
                  }`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                            detail: "high"
                        }
                    }
                ]
            }
        ];

        const response = await client.chat.completions.create({
            model: "gpt-4.1-nano",
            messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "return_menu_data",
                        description: "Returns restaurant menu data in structured format",
                        parameters: {
                            type: "object",
                            properties: {
                                restaurant_name: { type: "string" },
                                menu_type: { type: "string" },
                                categories: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            items: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        name: { type: "string" },
                                                        description: { type: "string" },
                                                        price: { type: "string" },
                                                        attributes: {
                                                            type: "array",
                                                            items: { type: "string" }
                                                        },
                                                        allergens: {
                                                            type: "array",
                                                            items: { type: "string" }
                                                        },
                                                        flavor_profile: { type: "string" },
                                                        texture: { type: "string" }
                                                    },
                                                    required: ["name", "description", "price"]
                                                }
                                            }
                                        },
                                        required: ["name", "items"]
                                    }
                                }
                            },
                            required: ["categories"]
                        }
                    }
                }
            ],
            tool_choice: "auto",
            max_tokens: 32768
        });

        const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall || !toolCall.function?.arguments) {
            throw new Error("Structured data not returned from OpenAI");
        }

        return JSON.parse(toolCall.function.arguments);

    } catch (error) {
        console.error(`Error analyzing menu with OpenAI: ${error.message}`);
        throw error;
    }
};

/**
 * Translate a restaurant menu image using OpenAI without function calling
 * @param {string} imageUrl - URL of the menu image
 * @param {string} language - Language code (e.g., "en", "zh")
 * @returns {Promise<Object>} - Translated menu data
 */
export const translateMenuImageFromOpenAI = async (imageUrl, language = 'en') => {
    try {
        console.log(`Starting menu translation for image: ${imageUrl} to ${language}`);
        const client = getOpenAIClient();

        const messages = [
            {
                role: "system",
                content: `You are a restaurant menu expert that can translate menu images accurately.
                When translating restaurant menu images:
                1. Focus on organizing menu items by categories (appetizers, main dishes, desserts, etc.)
                2. Keep the JSON structure in English but provide all content in ${language}
                3. Extract item names, descriptions, and prices accurately
                4. **IMPORTANT: Keep the original price and currency symbol exactly as seen in the image. Do NOT localize or convert currencies.** For example, if the price is "$12.99" or "NT$150", it must appear exactly as such.
                5. Include information about spiciness level, vegetarian/vegan options, allergens when available
                6. Identify and list potential allergens for each dish (e.g., nuts, dairy, gluten, shellfish, soy)
                7. Analyze and describe flavor profiles (e.g., sweet, savory, spicy, umami, sour)
                8. Describe texture characteristics when possible (e.g., crispy, tender, creamy, crunchy)
                9. Be comprehensive but concise
                10. If you can't read certain items clearly, indicate this in the output
                11. **CRITICAL: The response MUST be valid JSON format. Follow these rules strictly:**
                   - All property names must be in double quotes
                   - All strings must be in double quotes
                   - Use commas to separate array elements and object properties
                   - Close all arrays with ] and objects with }
                   - Do not add extra commas after the last element
                   - Ensure all categories are within the same categories array
                   - Double check the JSON structure before returning`
            },
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Translate this restaurant menu image and organize the menu items.
                  Return the response in this EXACT JSON format (do not modify the structure):
                  {
                      "restaurant_name": "Name of the restaurant if visible",
                      "menu_type": "Breakfast/Lunch/Dinner/Special menu type if specified",
                      "categories": [
                          {
                              "name": "Category name (e.g., Appetizers, Main Dishes, etc.)",
                              "items": [
                                  {
                                      "name": "Item name in specified language",
                                      "description": "Item description in specified language",
                                      "price": "Keep the price and currency symbol **exactly as in the image** — do NOT convert or localize currency (e.g., $ -> ￥ or NT$).",
                                      "attributes": ["spicy", "vegetarian", "vegan", "gluten-free", etc.],
                                      "allergens": ["dairy", "nuts", "gluten", "shellfish", "eggs", "soy", etc.],
                                      "flavor_profile": "Description of flavors in specified language",
                                      "texture": "Description of texture in specified language"
                                  }
                              ]
                          }
                      ]
                  }`
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                            detail: "high"
                        }
                    }
                ]
            }
        ];

        const response = await client.chat.completions.create({
            model: "gpt-4.1-nano",
            messages,
            response_format: { type: "json_object" },
            max_tokens: 32768
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("No response content returned from OpenAI");
        }

        return JSON.parse(content);

    } catch (error) {
        console.error(`Error translating menu with OpenAI: ${error.message}`);
        throw error;
    }
};

/**
 * Generate an image of a dish based on its name and description
 * @param {string} dishName - Name of the dish
 * @param {string} dishDescription - Description of the dish
 * @returns {Promise<Object>} - Object containing the generated image URL
 */
export const genDishImg = async (dishName, dishDescription) => {
    try {
        console.log(`Generating image for dish: ${dishName}`);
        const client = getOpenAIClient();
        
        const prompt = `A professional, appetizing food photography image of "${dishName}". 
        ${dishDescription ? `The dish description: ${dishDescription}.` : ''} 
        High-quality, realistic photograph with good lighting, on a restaurant table setting. 
        No text, no watermarks, photorealistic style.`;

        const response = await client.images.generate({
            model: "dall-e-2",
            prompt,
            n: 1,
            size: "512x512",
            response_format: "url"
        });

        if (!response.data || !response.data[0] || !response.data[0].url) {
            throw new Error("No image URL returned from OpenAI");
        }

        return { 
            success: true, 
            data: { 
                image_url: response.data[0].url 
            } 
        };
    } catch (error) {
        console.error(`Error generating dish image with OpenAI: ${error.message}`);
        return {
            success: false,
            message: `Failed to generate dish image: ${error.message}`
        };
    }
};
