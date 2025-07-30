import { Controller, Post, Body, Request, Get, Query, Req, RawBodyRequest } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Subscription } from './entities/payment.entity';
import { Public } from '@/auth/decorators/public.decorator';
import { User } from '@/auth/entities/user.entity';


@Controller('payment-session')
export class PaymentController {
  private stripe: Stripe;
  private URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  @Post('create')
  async createPaymentSession(@Request() request: any, @Body() body: any) {
    const {
      credits,
      price: amount,
      productName = 'Gavin Subscription'
    } = body;
    const userId = request.user?.id || body.userId; // Assuming user ID is passed in the request or body
    try {
      // Create Stripe checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: productName,
                description: `${credits} credits subscription`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.URL}`,
        cancel_url: `${this.URL}`,
        metadata: {
          userId,
          productName,
          credits: credits.toString(),
          amount: amount.toString(),
        },
      });
      console.log("Stripe session created:", session);
      // Save subscription record with pending status
      const subscription = await this.subscriptionRepository.save({
        userId,
        name: productName,
        credits,
        amount,
        status: 'pending',
        stripeSessionId: session.id,
      });
      console.log("Subscription created:", subscription);

      return {
        url: session.url,
        subscriptionId: subscription.id
      };
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw new Error('Failed to create payment session');
    }
  }

  @Get('verify')
  async verifyPayment(@Query('session_id') sessionId: string) {
    try {
      // Retrieve the session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      // Find the subscription record
      const subscription = await this.subscriptionRepository.findOne({
        where: { stripeSessionId: sessionId }
      });

      if (!subscription) {
        return { success: false, message: 'Subscription not found' };
      }

      if (session.payment_status === 'paid') {
        // Update subscription status to active
        await this.subscriptionRepository.update(subscription.id, {
          status: 'active',
          updatedAt: new Date(),
        });

        return {
          success: true,
          message: 'Payment successful! Your subscription is now active.',
          subscription: {
            ...subscription,
            status: 'active'
          }
        };
      } else {
        return {
          success: false,
          message: 'Payment not completed'
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: 'Error verifying payment'
      };
    }
  }

  @Public()
  @Post('webhook')
  async handleStripeWebhook(@Req() request: RawBodyRequest<any>) {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
      }

      // Access the raw body from the request
      const rawBody = request.rawBody;
      if (!rawBody) {
        throw new Error('No raw body available in the request');
      }

      event = this.stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return { error: 'Invalid signature' };
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('Payment session completed:', session);

          // Update subscription status
          await this.subscriptionRepository.update(
            { stripeSessionId: session.id },
            {
              status: 'active',
              updatedAt: new Date(),
            }
          );
          const data = await this.userRepository.findOne({ where: { id: session.metadata.userId } });
          console.log('User data:', data);
          const TotalCredits = data?.totalCredits || 0;
          const credits = data?.credits || 0;
          const updatedCredits = Number(credits || 0) + parseFloat(session.metadata.credits );
          console.log('Updated credits:', updatedCredits);
          const updatedTotalCredits = (TotalCredits || 0) + parseInt(session.metadata.credits);

          // Update the user with the new credits and totalCredits
          await this.userRepository.update(
            { id: session.metadata.userId },
            {
              credits: updatedCredits,
              totalCredits: updatedTotalCredits,
            }
          );
          break;

        case 'checkout.session.expired':
          const expiredSession = event.data.object;
          console.log('Payment session expired:', expiredSession);

          // Update subscription status to cancelled
          await this.subscriptionRepository.update(
            { stripeSessionId: expiredSession.id },
            {
              status: 'cancelled',
              updatedAt: new Date(),
            }
          );
          break;

        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log('Payment intent succeeded:', paymentIntent.id);
          break;

        case 'charge.succeeded':
          const charge = event.data.object;
          console.log('Charge succeeded:', charge.id);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      return { error: 'Error processing webhook' };
    }
  }

  @Get('get-credit-info')
  async creditInfo(@Req() req: any) {
    try {
      const user = await this.userRepository.findOne({ where: { id: req.user?.id } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      console.log('User credit info:', user.credits, user.totalCredits);
      return {
        success: true,
        credits: user.credits,
        totalCredits: user.totalCredits,
      };
    } catch (error) {
      console.error('Error fetching credit info:', error);
      return { success: false, message: 'Error fetching credit info' };
    }
  }
}