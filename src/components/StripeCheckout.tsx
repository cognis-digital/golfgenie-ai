import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe';
import StripePaymentForm from './StripePaymentForm';
import { X, CreditCard, ShoppingCart } from 'lucide-react';

interface StripeCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
  amount: number;
  description: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  description,
  items
}) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentCompleted(true);
    setTimeout(() => {
      onSuccess(paymentId);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Secure Checkout</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={paymentCompleted}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                  <div className="text-sm">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity > 1 && <span className="text-gray-500 ml-1">x{item.quantity}</span>}
                  </div>
                  <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center font-bold">
                <span>Total</span>
                <span>${(amount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Stripe Payment Form */}
          <Elements stripe={getStripe()}>
            <StripePaymentForm
              amount={amount}
              description={description}
              onSuccess={handlePaymentSuccess}
              onCancel={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;