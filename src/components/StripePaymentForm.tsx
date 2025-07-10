import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader, Lock, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { processPayment } from '../lib/stripe';

interface StripePaymentFormProps {
  amount: number;
  description: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  description,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: ''
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card details');
      return;
    }

    if (!billingDetails.name) {
      setError('Please provide your name');
      return;
    }

    if (!billingDetails.email) {
      setError('Please provide your email');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: {
            line1: billingDetails.address.line1,
            city: billingDetails.address.city,
            state: billingDetails.address.state,
            postal_code: billingDetails.address.postal_code
          }
        }
      });

      if (error) {
        throw error;
      }

      // Process payment with backend
      const result = await processPayment(
        paymentMethod.id,
        amount,
        'usd',
        description
      );

      if (result.success) {
        setSucceeded(true);
        onSuccess(result.paymentIntentId);
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
        <div className="flex items-start space-x-3">
          <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
            <p className="text-xs text-blue-600 mt-1">
              Your payment information is encrypted and secure. We never store your full card details.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name on Card *
          </label>
          <input
            type="text"
            value={billingDetails.name}
            onChange={(e) => setBillingDetails({ ...billingDetails, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Full name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={billingDetails.email}
            onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="email@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={billingDetails.phone}
            onChange={(e) => setBillingDetails({ ...billingDetails, phone: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Details *
        </label>
        <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
          <div className="flex items-center mb-2">
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Credit or Debit Card</span>
          </div>
          <CardElement 
            options={cardStyle} 
            onChange={(e) => setCardComplete(e.complete)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {succeeded && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Payment Successful</h3>
              <p className="text-xs text-green-700 mt-1">
                Your payment has been processed successfully. Thank you for your purchase!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-bold text-lg">${(amount / 100).toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-500">
          {description}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing || succeeded}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : succeeded ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Paid
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default StripePaymentForm;