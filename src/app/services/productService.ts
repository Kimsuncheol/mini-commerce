/**
 * Generates a product description using AI based on product details
 */
export async function generateProductDescription(
  productName: string,
  category: string,
  features?: string
): Promise<string> {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName,
        category,
        features,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.description;
  } catch (error) {
    console.error('Error generating product description:', error);
    throw error;
  }
}
