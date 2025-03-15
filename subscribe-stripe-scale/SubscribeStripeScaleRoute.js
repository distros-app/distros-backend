import express from 'express';
import SubscribeSchema from '../subscribe/SubscribeSchema.js';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10'
});

const SubscribeStripeScaleRoute = express.Router();

// You can delegate this to the existing logic
SubscribeStripeScaleRoute.post('/', async(req, res) => {
      try {
        const { priceId } = req.body; // Price ID from frontend
    
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: "https://app.distros.io/",
          cancel_url: "https://app.distros.io/",
        });
    
        return res.json({ sessionUrl: session.url }); // Send back checkout URL to frontend
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
});

export default SubscribeStripeScaleRoute;