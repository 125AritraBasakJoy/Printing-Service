import { PricingBreakdown, PrintSettings, Currency } from '../types/print';

export const RATES_BDT = {
  bwPerPage: 5.0, // 5 BDT per B&W page
  colorPerPage: 20.0, // 20 BDT per color page
  paperSizes: {
    A4: 0,
    Letter: 0,
    Legal: 2.0,
    A3: 15.0,
    '4x6_Photo': 10.0,
  },
  paperWeights: {
    standard_75gsm: 0,
    heavy_100gsm: 3.0,
    cardstock_200gsm: 10.0,
    glossy_photo: 25.0,
  },
  staples: {
    none: 0,
    top_left: 2.0,
    top_right: 2.0,
    two_left: 5.0,
    booklet: 15.0,
  },
  bindings: {
    none: 0,
    spiral_coil: 40.0,
    thermal: 60.0,
    comb: 30.0,
    hardcover: 150.0,
  },
  laminationPerPage: 20.0,
  duplexDiscountPerPage: 1.0,
  taxRate: 0.0, // No extra tax in local Bangladesh print shops
};

export const RATES_USD = {
  bwPerPage: 0.10,
  colorPerPage: 0.45,
  paperSizes: {
    A4: 0,
    Letter: 0,
    Legal: 0.05,
    A3: 0.20,
    '4x6_Photo': 0.15,
  },
  paperWeights: {
    standard_75gsm: 0,
    heavy_100gsm: 0.08,
    cardstock_200gsm: 0.25,
    glossy_photo: 0.40,
  },
  staples: {
    none: 0,
    top_left: 0.05,
    top_right: 0.05,
    two_left: 0.10,
    booklet: 0.30,
  },
  bindings: {
    none: 0,
    spiral_coil: 2.50,
    thermal: 3.50,
    comb: 1.80,
    hardcover: 7.00,
  },
  laminationPerPage: 1.00,
  duplexDiscountPerPage: 0.02,
  taxRate: 0.05,
};

export function calculatePrintPricing(
  pageCount: number,
  settings: PrintSettings,
  currency: Currency = 'BDT'
): PricingBreakdown {
  const rates = currency === 'BDT' ? RATES_BDT : RATES_USD;
  const copies = Math.max(1, settings.copies || 1);
  const isColor = settings.colorMode === 'color';
  const isDuplex = settings.duplex !== 'single';
  
  const pageUnitRate = isColor ? rates.colorPerPage : rates.bwPerPage;
  const paperSizeAddon = rates.paperSizes[settings.paperSize] || 0;
  const paperWeightAddon = rates.paperWeights[settings.finishing.paperWeight] || 0;
  
  const basePageCost = (pageUnitRate + paperSizeAddon) * pageCount * copies;
  const colorPremium = isColor ? (rates.colorPerPage - rates.bwPerPage) * pageCount * copies : 0;
  const paperUpgradeCost = paperWeightAddon * pageCount * copies;
  
  const duplexDiscount = isDuplex && pageCount > 1 ? rates.duplexDiscountPerPage * Math.floor(pageCount / 2) * copies : 0;
  const stapleCost = (rates.staples[settings.finishing.staple] || 0) * copies;
  const bindingCost = (rates.bindings[settings.finishing.binding] || 0) * copies;
  const laminationCost = settings.finishing.lamination ? rates.laminationPerPage * pageCount * copies : 0;

  const rawSubtotal = Math.max(
    currency === 'BDT' ? 5.0 : 0.20,
    basePageCost + paperUpgradeCost + stapleCost + bindingCost + laminationCost - duplexDiscount
  );
  
  const tax = Number((rawSubtotal * rates.taxRate).toFixed(2));
  const totalCost = Number((rawSubtotal + tax).toFixed(2));

  return {
    basePageCost: Number(basePageCost.toFixed(2)),
    colorPremium: Number(colorPremium.toFixed(2)),
    duplexDiscount: Number(duplexDiscount.toFixed(2)),
    paperUpgradeCost: Number(paperUpgradeCost.toFixed(2)),
    bindingCost: Number(bindingCost.toFixed(2)),
    stapleCost: Number(stapleCost.toFixed(2)),
    laminationCost: Number(laminationCost.toFixed(2)),
    subtotal: Number(rawSubtotal.toFixed(2)),
    tax,
    totalCost,
    currency: currency === 'BDT' ? '৳' : '$',
  };
}
