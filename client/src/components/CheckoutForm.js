import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';

// Define the API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CARD_ELEMENT_OPTIONS = { /* ... card styling ... */ }; // Keep existing options

const CheckoutForm = ({ cartItems, totalPrice, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  // State variables...
  const [processing, setProcessing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: '', address1: '', address2: '', city: '', state: '', postal_code: '', country: 'US',
  });

  // Handle Shipping Address Input Change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Initiate Payment Intent Creation
  const handleInitiatePayment = async () => {
    // Address validation...
    if (!shippingAddress.name || !shippingAddress.address1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postal_code || !shippingAddress.country) {
       setError('Please fill in all required shipping address fields.');
       return;
    }
    setProcessing(true);
    setPaymentProcessing(true);
    setError(null);
    setMessage('Initializing secure payment...');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required.');

      const { data } = await axios.post(
        `${API_URL}/api/payments/create-payment-intent`, // Use API_URL
        { amount: totalPrice, items: cartItems },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (!data.clientSecret) throw new Error('Failed to get payment client secret.');
      setClientSecret(data.clientSecret);
      setMessage('Please enter card details.');
    } catch (err) {
      console.error('Payment initiation error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Payment initiation failed.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
       setProcessing(false);
       setPaymentProcessing(false);
    }
  };

  // Step 2: Handle Form Submission (Confirm Payment and Create Order)
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret || processing || paymentSucceeded) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setError('Card details element not found.'); return; }

    setProcessing(true);
    setPaymentProcessing(true);
    setError(null);
    setMessage('Processing payment...');

    try {
      // Confirm Card Payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: shippingAddress.name, address: { /* map address fields */ } }
        }
      });

      if (stripeError) throw new Error(stripeError.message || 'Payment failed.');

      // Payment Succeeded
      if (paymentIntent.status === 'succeeded') {
        setPaymentSucceeded(true);
        setMessage('Payment successful! Creating order...');
        setPaymentProcessing(false);

        // Create Order on Backend
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
          const orderPayload = {
            items: cartItems.map(item => ({ id: item.id, qty: item.qty, price: item.price })),
            totalPrice: totalPrice,
            shippingAddress: shippingAddress, // Send collected address
            paymentIntentId: paymentIntent.id,
          };
          const { data: createdOrder } = await axios.post(
            `${API_URL}/api/orders`, // Use API_URL
            orderPayload,
            config
          );
          setMessage('Order placed successfully!');
          if (onSuccess) onSuccess(createdOrder.id); // Notify parent

        } catch (orderError) {
          console.error('Backend order creation error:', orderError);
          const orderErrMsg = `Payment successful, but failed to save order: ${orderError.response?.data?.message || orderError.message}. Contact support with Payment ID: ${paymentIntent.id}`;
          setError(orderErrMsg);
          setMessage('');
          if (onError) onError(orderErrMsg);
        }
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}.`);
      }
    } catch (err) {
      console.error('Checkout handleSubmit error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setMessage('');
      if (onError) onError(err.message);
      // Ensure processing stops on error if payment didn't succeed
      if (!paymentSucceeded) {
          setProcessing(false);
          setPaymentProcessing(false);
      }
    }
    // Note: setProcessing(false) is implicitly handled by onSuccess/onError calls or the finally block above
  };

  // Render Logic
  return (
    <div>
      {/* Messages and Errors */}
      {message && <Alert variant="info">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Step 1: Shipping Address Form */}
      {!clientSecret && !paymentSucceeded && (
        <Form onSubmit={(e) => { e.preventDefault(); handleInitiatePayment(); }}>
          <h4 className="mb-3">Shipping Address</h4>
          {/* Address Form Fields */}
          <Row className="mb-3"><Form.Group as={Col}><Form.Label>Full Name</Form.Label><Form.Control type="text" name="name" value={shippingAddress.name} onChange={handleAddressChange} required /></Form.Group></Row>
          <Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control type="text" name="address1" value={shippingAddress.address1} onChange={handleAddressChange} required /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Address 2 (Optional)</Form.Label><Form.Control type="text" name="address2" value={shippingAddress.address2} onChange={handleAddressChange} /></Form.Group>
          <Row className="mb-3">
            <Form.Group as={Col}><Form.Label>City</Form.Label><Form.Control type="text" name="city" value={shippingAddress.city} onChange={handleAddressChange} required /></Form.Group>
            <Form.Group as={Col}><Form.Label>State</Form.Label><Form.Control type="text" name="state" value={shippingAddress.state} onChange={handleAddressChange} required /></Form.Group>
            <Form.Group as={Col}><Form.Label>Zip</Form.Label><Form.Control type="text" name="postal_code" value={shippingAddress.postal_code} onChange={handleAddressChange} required /></Form.Group>
          </Row>
          <Form.Group as={Col} controlId="formGridCountry" className="mb-3"><Form.Label>Country</Form.Label><Form.Control type="text" name="country" value={shippingAddress.country} onChange={handleAddressChange} required /></Form.Group>
          <div className="text-center my-4">
            <Button variant="primary" size="lg" type="submit" disabled={processing || paymentProcessing}>
              {paymentProcessing ? <><Spinner size="sm"/> Initializing...</> : 'Proceed to Payment Details'}
            </Button>
          </div>
        </Form>
      )}

      {/* Step 2: Payment Form */}
      {clientSecret && !paymentSucceeded && (
        <Form onSubmit={handleSubmit} className="mt-4">
          <h4 className="mb-3">Payment Details</h4>
          <Form.Group className="mb-4">
            <Form.Label>Credit or debit card</Form.Label>
            <div className="p-3 border rounded bg-light"><CardElement options={CARD_ELEMENT_OPTIONS} /></div>
            <small className="text-muted">Use test card 4242... for demo.</small>
          </Form.Group>
          <div className="d-flex justify-content-between align-items-center mt-4">
            <h4>Total: ${totalPrice.toFixed(2)}</h4>
            <Button type="submit" variant="success" size="lg" disabled={!stripe || processing || paymentProcessing || paymentSucceeded}>
              {paymentProcessing ? <><Spinner size="sm"/> Paying...</> : (processing ? <><Spinner size="sm"/> Processing...</> : 'Pay Now')}
            </Button>
          </div>
        </Form>
      )}

       {/* Step 3: Final Order Processing Message */}
       {paymentSucceeded && !error && (
          <div className="text-center my-4"><Spinner animation="border" variant="success" /><p className="mt-2">{message || 'Finalizing...'}</p></div>
       )}
    </div>
  );
};

export default CheckoutForm;
