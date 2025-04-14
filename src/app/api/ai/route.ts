import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from 'openai/resources';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Maximum context size for product data (to avoid token limits)
const MAX_PRODUCT_CONTEXT_LENGTH = 3500;

// Interface for OpenAI API error with status property
interface OpenAIAPIError extends Error {
  status?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { message, history, productData, cartData, wishlistData, couponData } = await request.json();
    
    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Build system prompt based on available product data
    let systemPrompt = `You are a helpful e-commerce assistant named "ShopBot". 
Always respond in a friendly, customer-service oriented tone. Be concise but thorough.
Your main purpose is to assist customers with product information, recommendations, and general queries.
Today's date is ${new Date().toLocaleDateString()}.

IMPORTANT: When you want to show interactive content, use the following special markup:

1. For products:
[[PRODUCT:{"id":"product-id","name":"Product Name","price":29.99,"imageUrl":"https://example.com/image.jpg","originalPrice":39.99,"discount":25}]]

2. For coupons:
[[COUPON:{"id":"coupon-id","code":"SAVE20","type":"percentage","value":20,"description":"20% off your purchase","endDate":"2023-12-31"}]]

Use these interactive components when showing:
- Products mentioned in the conversation
- Available coupons that the user might be interested in
- Recommended products based on their query

Example response with a product:
"Here's the smartphone you asked about: 
[[PRODUCT:{"id":"phone123","name":"SuperPhone X","price":699.99,"imageUrl":"https://example.com/phone.jpg","originalPrice":799.99,"discount":12}]]
It comes with a 1-year warranty and free shipping."

Rules for using interactive components:
- Only include products and coupons that actually exist in the data provided to you
- Use the exact ID, name, price, and other details from the data
- Don't make up IDs, prices, or other product details
- Display 1-3 of the most relevant items, not a long list
- Place each component on its own line for better readability`;

    // Add product data to the system prompt if available
    if (productData) {
      // Trim product data if too large
      let trimmedProductData = productData;
      if (productData.length > MAX_PRODUCT_CONTEXT_LENGTH) {
        // Keep the beginning which likely has the most relevant products
        trimmedProductData = productData.substring(0, MAX_PRODUCT_CONTEXT_LENGTH) + 
          '... [additional products available but not shown due to context limits]';
      }
      
      systemPrompt += `\n\nHere is the current product catalog data relevant to the customer's query:
${trimmedProductData}

Use this product information to answer customer questions about products, prices, recommendations, and availability.
If asked about a product that's not in this list, politely explain that you don't have information about that specific product
but can help with the ones listed or suggest similar products from the catalog data.

When referring to product information:
- Provide accurate prices and discounts
- Mention product ratings and reviews when relevant
- Be precise about product features from the descriptions
- If asked for recommendations, use the product information to justify your suggestions
- If multiple products match the query, compare them to help the customer decide
- Use the PRODUCT component to show the most relevant products with interactive buttons`;
    } else {
      systemPrompt += `\n\nYou don't have specific product information available for this query, but you can help with general questions about shopping, product categories, and provide general advice. If the customer asks about specific products, politely explain that you would need to look up that information.`;
    }

    // Add cart data if available
    if (cartData) {
      systemPrompt += `\n\nHere is the customer's current shopping cart information:
${cartData}

You can refer to this information when the customer asks about their cart. You can help them:
- Understand what's in their cart
- Calculate total prices and potential discounts
- Suggest complementary products based on cart contents
- Answer questions about shipping and checkout options`;
    }

    // Add wishlist data if available
    if (wishlistData) {
      systemPrompt += `\n\nHere is the customer's current wishlist information:
${wishlistData}

You can refer to this information when the customer asks about their wishlist. You can help them:
- Review what's in their wishlist
- Compare wishlist items
- Consider moving items from wishlist to cart
- Get updates on price changes for wishlist items`;
    }

    // Add coupon data if available
    if (couponData) {
      systemPrompt += `\n\nHere is information about currently available coupons for this customer:
${couponData}

When the customer asks about coupons, discounts, promotions, or deals:
- Provide accurate information about available coupons
- Use the COUPON component to display each available coupon in an interactive format
- Mention the coupon code they need to use at checkout
- Explain any restrictions like minimum purchase requirements
- Note the expiration dates and encourage using coupons before they expire
- If appropriate, suggest which coupon would work best with their current cart items
- Remind them they can apply coupons on the product page or in the cart

Example of suggesting coupons:
"I found some coupons that might help you save money:
[[COUPON:{"id":"coupon123","code":"SUMMER20","type":"percentage","value":20,"description":"Summer special discount","endDate":"2023-08-31"}]]
This coupon would give you 20% off on your purchase!"`;
    }

    // Add the chat history instructions
    systemPrompt += `\n\nMake your responses helpful, accurate, and friendly. Be honest about what information you have access to. Use the interactive components to make your responses more engaging and actionable.`;
    
    // Create system message for the API call
    const systemMessage: ChatCompletionSystemMessageParam = { 
      role: 'system', 
      content: systemPrompt 
    };
    
    // Initialize messages array with system message
    const messages: (ChatCompletionSystemMessageParam | ChatCompletionUserMessageParam | ChatCompletionAssistantMessageParam)[] = [systemMessage];
    
    // Add chat history if available
    if (history) {
      // Convert the history string into message objects
      const historyLines = history.split('\n');
      for (const line of historyLines) {
        if (line.startsWith('User: ')) {
          messages.push({ 
            role: 'user', 
            content: line.substring(6).trim() 
          });
        } else if (line.startsWith('Assistant: ')) {
          messages.push({ 
            role: 'assistant', 
            content: line.substring(11).trim() 
          });
        }
      }
    }
    
    // Add the current message
    messages.push({ role: 'user', content: message });
    
    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 600, // Increased token limit for richer responses
    });
    
    // Extract and return the response
    const aiResponse = response.choices[0]?.message?.content || 'I apologize, I could not generate a response at this time.';
    
    return NextResponse.json({ response: aiResponse });
    
  } catch (error: unknown) {
    console.error('AI API error:', error);
    
    // Return an appropriate error response
    const status = error instanceof Error ? (error as OpenAIAPIError).status || 500 : 500;
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
