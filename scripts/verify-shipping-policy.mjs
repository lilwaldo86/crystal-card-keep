import assert from "node:assert/strict";
import { calculateCustomerShipping } from "../src/data/shippingPolicy.js";

const pkg = (weightOunces = 16) => ({ weightOunces });

assert.equal(calculateCustomerShipping({ subtotalCents: 4000, packages: [pkg()] }).amountCents, 799);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg()] }).amountCents, 0);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg(), pkg()] }).amountCents, 500);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg(), pkg(), pkg()] }).amountCents, 1000);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg(801)] }).amountCents, 500);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg(), pkg(801)] }).amountCents, 500);
assert.equal(calculateCustomerShipping({ subtotalCents: 7500, packages: [pkg(801), pkg()] }).amountCents, 1000);
assert.equal(calculateCustomerShipping({ subtotalCents: 4999, packages: [pkg()], economyLetterEligible: true, selectedService: "economy" }).amountCents, 199);

console.log("Shipping policy verified: 8 scenarios passed.");
