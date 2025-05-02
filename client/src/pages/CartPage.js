import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CartPage = () => {
  const { cartItems, removeFromCart, updateCartQuantity, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  const removeFromCartHandler = (id) => {
    removeFromCart(id);
  };

  const checkoutHandler = () => {
    if (!localStorage.getItem('token')) {
      navigate('/login?redirect=cart');
      return;
    }
    setIsCheckingOut(true);
  };

  const handlePaymentSuccess = (paymentIntentId) => {
    setPaymentCompleted(true);
    // Clear the cart
    clearCart();
  };

  return (
    <Container>
      <h1 className="my-4">Shopping Cart</h1>
      
      {paymentCompleted ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h2>Payment Successful!</h2>
          <p className="lead">Your order has been placed.</p>
          <Button variant="primary" onClick={() => navigate('/profile')}>
            View Your Orders
          </Button>
        </div>
      ) : isCheckingOut ? (
        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Header as="h5">Checkout</Card.Header>
              <Card.Body>
                <Elements stripe={stripePromise}>
                  <CheckoutForm 
                    cartItems={cartItems} 
                    totalPrice={totalPrice}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Header as="h5">Order Summary</Card.Header>
              <ListGroup variant="flush">
                {cartItems.map((item) => (
                  <ListGroup.Item key={item.id}>
                    <div className="d-flex justify-content-between">
                      <span>{item.name} x {item.qty}</span>
                      <span>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  <div className="d-flex justify-content-between">
                    <strong>Total</strong>
                    <strong>${totalPrice.toFixed(2)}</strong>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col md={8}>
            {cartItems.length === 0 ? (
              <div className="text-center py-5">
                <h2>Your cart is empty</h2>
                <Link to="/products" className="btn btn-primary mt-3">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <ListGroup variant="flush">
                {cartItems.map((item) => (
                  <ListGroup.Item key={item.id}>
                    <Row>
                      <Col md={2}>
                        <Image src={item.primary_image || "https://via.placeholder.com/100x100?text=No+Image"} alt={item.name} fluid rounded />
                      </Col>
                      <Col md={3}>
                        <Link to={`/product/${item.id}`}>{item.name}</Link>
                      </Col>
                      <Col md={2}>${item.price}</Col>
                      <Col md={2}>
                        <Form.Control
                          as="select"
                          value={item.qty}
                          onChange={(e) => updateCartQuantity(item.id, Number(e.target.value))}
                        >
                          {[...Array(10).keys()].map((x) => (
                            <option key={x + 1} value={x + 1}>
                              {x + 1}
                            </option>
                          ))}
                        </Form.Control>
                      </Col>
                      <Col md={2}>
                        <Button
                          type="button"
                          variant="light"
                          onClick={() => removeFromCartHandler(item.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
          <Col md={4}>
            <Card>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <h2>Subtotal ({totalItems}) items</h2>
                  ${totalPrice.toFixed(2)}
                </ListGroup.Item>
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="w-100"
                    disabled={cartItems.length === 0}
                    onClick={checkoutHandler}
                  >
                    Proceed To Checkout
                  </Button>
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage;