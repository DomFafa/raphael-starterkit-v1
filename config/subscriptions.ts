import { ProductTier } from "@/types/subscriptions";

export const SUBSCRIPTION_TIERS: ProductTier[] = [
  {
    name: "Starter",
    id: "tier-hobby",
    productId: process.env.CREEM_STARTER_PRODUCT_ID || "prod_starter_monthly", // $11 monthly subscription
    priceMonthly: "$11",
    description: "Perfect for individuals wanting to explore Chinese names.",
    features: [
      "10 Chinese name generations per month",
      "Basic personality matching",
      "Cultural significance explanations",
      "PDF certificates",
      "Email support",
      "Name history tracking",
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Business",
    id: "tier-pro",
    productId: process.env.CREEM_BUSINESS_PRODUCT_ID || "prod_business_monthly", // $29 monthly subscription
    priceMonthly: "$29",
    description: "Ideal for enthusiasts and professionals seeking quality Chinese names.",
    features: [
      "Unlimited Chinese name generations",
      "Advanced personality analysis",
      "Deep cultural insights",
      "Premium PDF certificates",
      "Priority support",
      "Batch generation (up to 18 names)",
      "Name pronunciation audio",
      "Custom name preferences"
    ],
    featured: true,
    discountCode: "", // Optional discount code
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    productId: process.env.CREEM_ENTERPRISE_PRODUCT_ID || "prod_enterprise_monthly", // $99 monthly subscription
    priceMonthly: "$99",
    description: "For organizations and cultural institutions with advanced naming needs.",
    features: [
      "Unlimited generations with priority processing",
      "AI-powered cultural consultation",
      "Family name generation",
      "Business name generation",
      "Dedicated support",
      "Custom branding options",
      "API access for integrations",
      "Advanced analytics dashboard"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
];

export const CREDITS_TIERS: ProductTier[] = [
  {
    name: "Basic Package",
    id: "tier-3-credits",
    productId: process.env.CREEM_BASIC_CREDITS_ID || "prod_basic_credits", // $9 one-time purchase
    priceMonthly: "$9",
    description: "3 credits for testing and small-scale projects.",
    creditAmount: 3,
    features: [
      "3 premium Chinese name generations",
      "No expiration date",
      "Access to advanced features",
      "PDF certificates",
      "Email support"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Standard Package",
    id: "tier-6-credits",
    productId: process.env.CREEM_STANDARD_CREDITS_ID || "prod_standard_credits", // $13 one-time purchase
    priceMonthly: "$13",
    description: "6 credits for regular name generation needs.",
    creditAmount: 6,
    features: [
      "6 premium Chinese name generations",
      "No expiration date",
      "Priority processing",
      "Batch generation support",
      "Basic email support"
    ],
    featured: true,
    discountCode: "", // Optional discount code
  },
  {
    name: "Premium Package",
    id: "tier-9-credits",
    productId: process.env.CREEM_PREMIUM_CREDITS_ID || "prod_premium_credits", // $29 one-time purchase
    priceMonthly: "$29",
    description: "9 credits for extensive name generation and exploration.",
    creditAmount: 9,
    features: [
      "9 premium Chinese name generations",
      "No expiration date",
      "Priority processing",
      "Batch generation (up to 18 names)",
      "Premium support",
      "Advanced personality matching"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
];
