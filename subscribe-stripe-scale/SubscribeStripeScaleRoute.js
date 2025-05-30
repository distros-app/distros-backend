import express from 'express';
import SubscribeSchema from '../subscribe/SubscribeSchema.js';
import UserSchema from '../users/UserSchema.js';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10'
});

const SubscribeStripeScaleRoute = express.Router();

// You can delegate this to the existing logic
SubscribeStripeScaleRoute.post('/', async(req, res) => {
      try {
        const { priceId, userId } = req.body; // Price ID from frontend
    
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: "https://app.distros.io/",
          cancel_url: "https://app.distros.io/",
        });
        if(session.id) {
          const nextPaymentDate = new Date(); // Get current local time
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Add 1 month
                  
          await UserSchema.findOneAndUpdate({ _id: userId }, 
            { $set: 
              { 
                stripeSessionId: session.id, 
                'subscription.type': 'SCALE',
                subscriptionStartDate: new Date().toLocaleString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true, // 12-hour clock with AM/PM
                }),
                nextPaymentDate: nextPaymentDate.toLocaleString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true, // 12-hour clock with AM/PM
                }),
              }
            }, { new: true });
        }
         
        return res.json({ session: session }); // Send back checkout URL to frontend
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
});

SubscribeStripeScaleRoute.post('/details', async(req, res) => {
  try {
    const { sessionId, user } = req.body; // Price ID from frontend
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Extract subscription ID from the session
    const subscriptionId = session.subscription;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID not found in session' });
    }
  
    // Fetch subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if(subscription && !user.stripeSubscriptionId) {
      await UserSchema.findOneAndUpdate({ _id: user._id }, { $set: { stripeSubscriptionId: subscriptionId }}, { new: true });
    }

    return res.json({ status: subscription.status }); // Send back checkout URL to frontend
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

SubscribeStripeScaleRoute.post('/cancel', async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body; // Get subscription ID from frontend

    // Cancel the subscription immediately
    const deletedSubscription = await stripe.subscriptions.del(subscriptionId);
    if(deletedSubscription) {
          await UserSchema.findOneAndUpdate({ _id: userId }, 
            { $set: 
              { 
                stripeSessionId: '',
                stripeSubscriptionId: '',
                'subscription.type': 'FREE' ,
                tempViewLimit: 2000
              }
            }, { new: true });
        }

    return res.json({
      message: 'Subscription canceled successfully',
      subscription: deletedSubscription,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default SubscribeStripeScaleRoute;