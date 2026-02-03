// lib/ai/groq.ts
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

interface ImageAnalysis {
    description: string;
    roomType?: string;
    style?: string;
    colors?: string[];
    objects?: string[];
    lighting?: string;
    suggestions?: string[];
}

export async function analyzeImageWithGroq(imageUrl: string): Promise<ImageAnalysis> {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.warn('GROQ_API_KEY not set, skipping image analysis');
            return {
                description: 'Image analysis unavailable',
            };
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this interior design image. Describe the room type, style, colors, furniture, lighting, and provide design suggestions. Be concise.',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                            },
                        },
                    ],
                },
            ],
            model: 'llama-3.2-90b-vision-preview',
            temperature: 0.5,
            max_tokens: 500,
        });

        const analysis = completion.choices[0]?.message?.content || 'No analysis available';

        // Parse the analysis into structured data
        return {
            description: analysis,
            // You could add more sophisticated parsing here
        };
    } catch (error: any) {
        console.error('Groq image analysis error:', error);
        return {
            description: 'Image analysis failed',
        };
    }
}

export async function generateDesignSuggestions(prompt: string): Promise<string[]> {
    try {
        if (!process.env.GROQ_API_KEY) {
            return ['AI suggestions unavailable'];
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert interior designer. Provide 3-5 concise design suggestions.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 300,
        });

        const response = completion.choices[0]?.message?.content || '';

        // Split by newlines and filter out empty lines
        const suggestions = response
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.match(/^\d+\./)) // Remove numbering
            .slice(0, 5);

        return suggestions.length > 0 ? suggestions : ['No suggestions available'];
    } catch (error: any) {
        console.error('Groq suggestions error:', error);
        return ['AI suggestions unavailable'];
    }
}

export default analyzeImageWithGroq;
