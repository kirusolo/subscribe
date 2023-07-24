const express = require("express");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

const stripe = require("stripe")(
  "sk_test_51NXN4gGX7OP4hGQPUCqlRI00H2AOuAbZwAazEYQhkVIkTs92WlHTDLJByYSX0QBrAPcwbk9i0jtgh991mCgcBkYk00ArEn8F1W"
);

// Endpoint to create a subscription
app.post("/subscriptions", async (req, res) => {
  try {
    const { customerId, planId, startDate, endDate } = req.body;

    // Save the subscription details in your database (Prisma)
    const newSubscription = await prisma.subscription.create({
      data: {
        customerId,
        planId,
        startDate,
        endDate,
      },
    });

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: "customer@example.com", // Replace with the customer's email address
      // Add any other relevant customer information
    });

    // Create a subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: "YOUR_STRIPE_PRICE_ID" }], // Replace with the relevant Stripe Price ID for the chosen plan
      // Add other subscription details, e.g., trial_period_days, billing_cycle_anchor, etc.
    });

    // Update the newly created subscription in your database with the Stripe subscription ID
    await prisma.subscription.update({
      where: { id: newSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
      },
    });

    res.status(200).json(newSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription." });
  }
});

// Endpoint to get all subscriptions
app.get("/subscriptions", async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany();
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subscriptions." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
