// Central business details. Replace every PLACEHOLDER once the owner supplies them.
export const site = {
  name: "Poorvitha Mobiles",
  tagline: "Mobiles, accessories, smartwatches & audio",
  description:
    "Poorvitha Mobiles – shop mobile phones, chargers, cables, smartwatches, earphones and Bluetooth speakers at honest prices with delivery across India.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "+91 96202 46249", // customer support
  phone2: "+91 98442 46249", // customer support
  phones: "+91 96202 46249 / +91 98442 46249",
  whatsapp: "919620246249", // digits only, with country code. CONFIRM this number is on WhatsApp
  email: "poorvithamobiles25@gmail.com",
  address: "No.15/2, 20th Cross, 5th Main Road, K.P Agrahara, Magadi Main Road, Bangalore – 560023",
  gstin: "GSTIN: 29BJTPR0034E2Z0",
  hours: "10:00 AM – 9:00 PM",
  instagram: "https://www.instagram.com/ravi143306",
  instagramHandle: "@ravi143306",
  instagramFollowers: "196K", // update now and then
  mapsUrl: "https://maps.app.goo.gl/TT69yYfzMLm3wYAr9",
  grievanceOfficer: "Ravi, Customer Care Officer, Poorvitha Mobiles",
  // Largest order (₹) allowed as Cash on Delivery; bigger orders must be paid online. 0 = no limit. Override with COD_MAX_AMOUNT.
  codMax: Number(process.env.COD_MAX_AMOUNT ?? 3000),
  freeShippingAbove: 499,
  shippingFee: 49,
};
