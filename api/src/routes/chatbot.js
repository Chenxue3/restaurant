import express from 'express';
import {
    getAnswerUtility,
    checkTopicRelevanceUtility
} from '../util/chatbotLogic.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
    const { message, language = 'zh' } = req.body;

    // Validate input
    if (!message?.trim() || typeof message !== 'string') {
        return res.status(400).json({
            success: false,
            error:  'Invalid input message'
        });
    }

    try {
        // Check relevance first
        console.log(message);
        const relevanceCheck = await checkTopicRelevanceUtility(message);
        if (!relevanceCheck.success) throw new Error('Relevance check failed');
        
        if (!relevanceCheck.isRelevant) {
            return res.json({
                success: true,
                response:  'I can only answer questions related to food or restaurant😱. Please ask me questions related 😊.'
            });
        }

        // Get detailed answer
        const answer = await getAnswerUtility(message, language);
        if (!answer.success) throw new Error(answer.error);

        res.json({
            success: true,
            response: answer.data
        });

    } catch (error) {
        console.error('Chat Error:', error);
        const errorMessage = 'Service unavailable, please try again later 🙇🏽‍♀️';
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;