import type { Appearance } from "@stripe/stripe-js";

// Mirrors the brand tokens in src/app/globals.css's @theme block. Kept as
// plain hex/rgba literals (not CSS var references) because Stripe's
// Payment Element renders inside an iframe and can't read this page's
// custom properties.
export const stripeAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#a35a38", // terracotta
    colorBackground: "#fffdf9", // cream
    colorText: "#2c2825", // bark
    colorDanger: "#a35a38", // terracotta doubles as the only "urgent" tone in the palette
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, sans-serif',
    borderRadius: "6px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgb(140 109 70 / 0.2)", // --color-hairline
      backgroundColor: "#fffdf9",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #8c6d46", // jute
      boxShadow: "0 0 0 2px rgb(140 109 70 / 0.3)",
    },
    ".Label": {
      color: "#2c2825",
      fontWeight: "500",
    },
    ".Tab": {
      border: "1px solid rgb(140 109 70 / 0.2)",
      backgroundColor: "#fffdf9",
    },
    ".Tab--selected": {
      border: "1px solid #a35a38",
      backgroundColor: "#fffdf9",
    },
  },
};
