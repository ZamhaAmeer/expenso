const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

// @desc Parse natural language expense prompt into structured JSON
// @route POST /api/ai/parse-expense
exports.parseExpense = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt text is required' });
    }

    // Fallback parser if no OpenAI API Key provided
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // Simple regex extraction for fallback demo mode
      const amountMatch = prompt.match(/\$?(\d+(\.\d{1,2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      
      return res.json({
        parsed: {
          title: prompt.slice(0, 30),
          amount,
          type: 'expense',
          category: prompt.toLowerCase().includes('food') || prompt.toLowerCase().includes('pizza') ? 'Food & Dining' : 'General',
          merchant: 'Extracted Merchant',
          date: new Date().toISOString().split('T')[0],
        },
        requiresReview: true,
        source: 'fallback_regex',
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expense parsing assistant. Parse the user's text into JSON with exact keys:
{
  "title": string,
  "amount": number,
  "type": "expense" | "income",
  "category": string (e.g., Food & Dining, Transportation, Utilities, Entertainment, Shopping, General),
  "merchant": string,
  "date": "YYYY-MM-DD"
}
Return valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content);
    res.json({
      parsed: parsedData,
      requiresReview: true,
      source: 'openai_gpt4o',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
