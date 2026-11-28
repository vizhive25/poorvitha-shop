-- Prices for phones that were "Price on request" (owner decision, 28 Nov 2026):
--   smartphones  -> Rs 8,999      feature phones -> Rs 1,699
-- MRP is set equal to the price (no discount badge). Stock is not changed.
-- Only rows still marked "price on request" are touched, so prices set by hand in the admin are never overwritten.

UPDATE `Product` SET `price` = 8999, `mrp` = 8999, `priceOnRequest` = 0
WHERE `priceOnRequest` = 1 AND `slug` IN ('ringme-bold-s180-air', 'ringme-bold-s170-air', 'ringme-bold-s230-pro', 'ringme-bold-s330-pro', 'ringme-bold-p70-4gb-ram-128gb-storage', 'ringme-s25', 'ringme-17-pro-1', 'ringme-17-pro', 'ringme-bold-s16-android-3-64', 'snexian-bold-t670', 'snexian-bold-t660', 'snexian-bold-t450', 'snexian-bold-t440', 'snexian-bold-t26-ultra', 'snexian-bold-t170', 'snexian-bold-t410', 'snexian-bold-t550', 'snexian-bold-t17', 'snexian-bold-t650');

UPDATE `Product` SET `price` = 1699, `mrp` = 1699, `priceOnRequest` = 0
WHERE `priceOnRequest` = 1 AND `slug` IN ('ringme-the-royal-v2', 'ringme-legend', 'ringme-bold-z', 'ringme-bold-x', 'ringme-supreme-4g', 'ringme-r2173', 'ringme-r1708', 'ringme-r312', 'ringme-r310', 'ringme-jumbo-2-4-lcd-feature-phone', 'ringme-316c-feature-phone-with-crystal-keypad', 'ringme-310c-feature-phone-with-crystal-keypad', 'ringme-312c-crystal-keypad', 'snexian-rock-r6', 'snexian-rock-x', 'snexian-rock-4g-3-0', 'snexian-bold-777c', 'snexian-bravo-4g', 'snexian-bold-40k', 'snexian-guru-gt-4g', 'snexian-guru-4g');
