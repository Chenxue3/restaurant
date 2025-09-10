import axios from 'axios';
import { getOpenAIClient } from '../services/openai.js';

async function translateTextOpenAI(text, targetLang) {

  if (!text) return text;
  
  try {
    const openai = getOpenAIClient();
    const prompt = `Translate the following text to ${targetLang} .If language already in target language, no need translate(only translate, do not explain):\n${text}`;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional translator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 512
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    throw new Error('Failed to translate text');
  }
}

export const translateMenu = async (req, res) => {
  try {
    const { menu, language } = req.body;

    // Check if menu and language are provided
    if (!menu || !language) {
      return res.status(400).json({
        success: false,
        message: 'Menu and language are required'
      });
    }

    // Language code mapping
    const langMap = {
      English: 'English',
      中文: 'Chinese',
      Chinese: 'Chinese',
      Français: 'French',
      French: 'French',
      日本語: 'Japanese',
      Japanese: 'Japanese',
      한국어: 'Korean',
      Korean: 'Korean',
      Español: 'Spanish',
      Spanish: 'Spanish',
    };
    const target = langMap[language] || 'English';


    const translatedMenu = {};
    for (const [catId, cat] of Object.entries(menu)) {
      try {
        const translatedCategory = {
          ...cat,
          categoryInfo: {
            ...cat.categoryInfo,
            name: await translateTextOpenAI(cat.categoryInfo.name, target),
            description: cat.categoryInfo.description
              ? await translateTextOpenAI(cat.categoryInfo.description, target)
              : '',
          },
          dishItems: await Promise.all(
            cat.dishItems.map(async (item) => ({
              ...item,
              name: await translateTextOpenAI(item.name, target),
              description: item.description
                ? await translateTextOpenAI(item.description, target)
                : '',
              flavor_profile: item.flavor_profile
                ? await translateTextOpenAI(item.flavor_profile, target)
                : '',
              texture: item.texture
                ? Array.isArray(item.texture)
                  ? await Promise.all(item.texture.map(t => translateTextOpenAI(t, target)))
                  : await translateTextOpenAI(item.texture, target)
                : '',
            }))
          ),
        };
        translatedMenu[catId] = translatedCategory;

      } catch (error) {
        console.error(`Error translating category ${catId}:`, error);
        // if a category translation fails, return the original content
        translatedMenu[catId] = cat;
      }
    }

    res.json({
      success: true,
      translatedMenu,
    });
  } catch (error) {
    console.error('Menu translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate menu',
      error: error.message
    });
  }
}; 