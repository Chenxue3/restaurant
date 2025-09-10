// Updated chatbotLogic.js
import axios from 'axios';
import Restaurant from '../models/Restaurant.js';
import dotenv from 'dotenv';
import { getOpenAIClient } from '../services/openai.js';
dotenv.config();

let retryCount = 0;
const MAX_RETRIES = 2;

export async function sendToOpenAI(messages, max_tokens = 500) {
    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages,
            temperature: 0.7,
            max_tokens
        });
        retryCount = 0; // Reset on success
        return {
            success: true,
            data: response.choices[0].message.content.trim()
        };
    } catch (error) {
        // Don't retry for quota or authentication errors
        if (error.code === 'insufficient_quota' || error.code === 'invalid_api_key' || error.code === 'authentication_error') {
            console.error('Non-retryable API Error:', {
                code: error.code,
                message: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
        
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retry attempt ${retryCount}`);
            return await sendToOpenAI(messages, max_tokens);
        }
        console.error('Final API Error:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        return {
            success: false,
            error: error.message
        };
    }
}

// Add error mapping
export function getErrorReason(error) {
    const errorMap = {
        ECONNRESET: 'Network connection unstable, please check your network and try again',
        ECONNABORTED: 'Request timeout, please try again later',
        ENOTFOUND: 'Unable to connect to API server'
    };
    return errorMap[error.code] || 'API request failed';
}

// Function to check if restaurant exists and get its ID
async function getRestaurantId(name) {
    try {
        const restaurant = await Restaurant.findOne({ 
            name: { $regex: new RegExp(name, 'i') } 
        });
        return restaurant ? restaurant._id : null;
    } catch (error) {
        console.error('Error checking restaurant:', error);
        return null;
    }
}

// Function to add hyperlinks to restaurant names
async function addRestaurantLinks(text) {
    const restaurants = await Restaurant.find({});
    let result = text;

    // Handle exact matches first
    for (const r of restaurants) {
        const exactRegex = new RegExp(`"\\b${r.name}\\b"`, 'g');
        if (exactRegex.test(result)) {
            result = result.replace(exactRegex, `<a href="/restaurants/${r._id}">${r.name}</a>`);
        }
    }

    // Handle partial matches within double quotes
    for (const r of restaurants) {
        const mainPart = r.name.split(/\s|,|&/)[0];
        if (mainPart.length > 2) {
            const likeRegex = new RegExp(`"[^"]*\\b${mainPart}\\b[^"]*"`, 'gi');
            result = result.replace(likeRegex, `<a href="/restaurants/${r._id}">${r.name}</a>`);
        }
    }

    return result;
}

// Unified answer generation
export async function getAnswerUtility(question, language = 'zh') {
    const systemMessage = {
        role: "system",
        content: language === 'zh'
            ? `You are a professional food assistant, please strictly follow:
            1. Answer all questions related to food, restaurants, food culture, and dining recommendations
            2. Include food and restaurant queries from different countries/regions. If no specified location, default to New Zealand.
            3. Rejection template: "Please ask food-related questions"
            4. When mentioning restaurant names, always put them in quotes
            Valid examples:
            - Best restaurants in New Zealand
            - Seafood recommendations in Christchurch
            - What is Hāngī (traditional Māori food)? Answer the question within 100 words, using the same language as the question.`
            : `You are a food expert assistant. Rules:
            1. Answer all food/restaurant/cuisine-related questions
            2. Include questions about international cuisines
            3. Rejection template: "Please ask food-related questions"
            4. When mentioning restaurant names, always put them in quotes
            Valid examples:
            - Best restaurants in Wellington
            - How to make Pavlova
            - Traditional Māori food
            Answer the question within 100 words, using the same language as the question, but for restaurant name, keep as english.`
    };
    const response = await sendToOpenAI([
        systemMessage,
        { role: "user", content: question }
    ]);
    if (response.success) {
        response.data = await addRestaurantLinks(response.data);
    }
    return response;
}

// Enhanced relevance check
export async function checkTopicRelevanceUtility(question) {
    const response = await sendToOpenAI([
        {
            role: "system",
            content: `Strictly determine if the question relates to food/restaurants. Respond ONLY with "Y" or "N".
            
            Valid Examples:
            [User] How to cook steak? → Y
            [User] Best restaurant in Auckland → Y
            [User] Traditional Māori food → Y
            [User] How to change a tire? → N
            [User] Learn programming → N
            
            Current Question: ${question}. Please provide its relevance.`
        },
        { role: "user", content: "Is this question relevant?" }
    ], 10);
    console.log('Relevance Check Response:', response);
    return {
        success: response.success,
        isRelevant: response.success && response.data.trim().toLowerCase() === 'y'
    };
}