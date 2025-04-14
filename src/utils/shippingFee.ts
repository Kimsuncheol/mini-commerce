import { CurrencyCode, convertCurrencyAmount } from './currencyUtils';

interface ShippingFeeResult {
  fee: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
}

/**
 * Calculate shipping fee based on order total and currency
 * @param total The total order amount
 * @param currencyCode The currency code
 * @returns Promise resolving to a ShippingFeeResult object with fee details
 */
export const calculateShippingFee = async (
  total: number,
  currencyCode: CurrencyCode = 'USD'
): Promise<ShippingFeeResult> => {
  // Handle invalid input
  if (total === undefined || total === null || isNaN(total)) {
    total = 0;
  }

  // Define threshold and fee values based on currency
  let freeShippingThreshold: number;
  let standardFee: number;
  
  // Set threshold and fee values based on currency
  if (currencyCode === 'KRW') {
    freeShippingThreshold = 200000;
    standardFee = 2500;
  } else {
    // For any currency other than KRW, use USD values and convert
    freeShippingThreshold = 200;
    standardFee = 15;
    
    // If we're not in USD or KRW, convert the thresholds to the target currency
    if (currencyCode !== 'USD') {
      try {
        freeShippingThreshold = await convertCurrencyAmount(freeShippingThreshold, 'USD', currencyCode);
        standardFee = await convertCurrencyAmount(standardFee, 'USD', currencyCode);
      } catch (error) {
        console.error("Error converting currency for shipping fee calculation:", error);
        // Keep the original USD values as fallback
      }
    }
  }
  
  // Determine if free shipping applies
  const isFreeShipping = total >= freeShippingThreshold;
  
  // Calculate the fee
  const fee = isFreeShipping ? 0 : standardFee;
  
  return {
    fee,
    freeShippingThreshold,
    isFreeShipping
  };
};
