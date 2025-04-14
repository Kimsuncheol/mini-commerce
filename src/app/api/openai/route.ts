import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { corsHeaders } from '@/utils/cors';

// Initialize OpenAI client using the API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { productName, category, features } = body;
    
    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Construct the prompt for generating product description
    const prompt = `Write an engaging and professional product description for an e-commerce store with the following details:
Product Name: ${productName}
Category: ${category || 'General'}
${features ? `Key Features: ${features}` : ''}

The description should be approximately 100-150 words, highlight the product's benefits, use persuasive language to appeal to potential customers, and be SEO-friendly.
Avoid excessive hyperbole and keep the tone professional but enthusiastic.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 250,
    });

    // Extract the generated description
    const generatedDescription = completion.choices[0].message.content;

    return NextResponse.json(
      { description: generatedDescription },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate product description' },
      { status: 500, headers: corsHeaders }
    );
  }
}
