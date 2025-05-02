import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Tab, Nav, Alert, Table, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define the API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProfilePage = () => {
  const navigate = useNavigate();

  // Profile Info State
  const [profileInfo, setProfileInfo] = useState({ name: '', email: '' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  // Listings State
  const [userListings, setUserListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  // Fetch Data on Mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');

    if (!token || !userInfo) {
      navigate('/login?redirect=/profile');
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
      setProfileLoading(true);
      setListingsLoading(true);
      setOrdersLoading(true);
      setProfileError('');
      setListingsError('');
      setOrdersError('');

      try {
        const [profileRes, listingsRes, ordersRes] = await Promise.all([
          axios.get(`${API_URL}/api/auth/me`, config), // Use API_URL
          axios.get(`${API_URL}/api/used-items?user=true`, config), // Use API_URL
          axios.get(`${API_URL}/api/orders/myorders`, config) // Use API_URL
        ]);

        // Process Profile
        if (profileRes.data) {
          setProfileInfo({
            name: `${profileRes.data.first_name || ''} ${profileRes.data.last_name || ''}`.trim(),
            email: profileRes.data.email || ''
          });
        } else { throw new Error('Failed to load profile.'); }
        setProfileLoading(false);

        // Process Listings
        setUserListings(listingsRes.data || []);
        setListingsLoading(false);

        // Process Orders
        setOrders(ordersRes.data || []);
        setOrdersLoading(false);

      } catch (err) {
        console.error('Failed to load profile page data:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load data.';
        // Set errors only if data wasn't loaded at all
        if (!profileInfo.email) setProfileError(errorMsg);
        if (userListings.length === 0 && !listingsLoading) setListingsError(errorMsg); // Check loading state too
        if (orders.length === 0 && !ordersLoading) setOrdersError(errorMsg); // Check loading state too
        setProfileLoading(false);
        setListingsLoading(false);
        setOrdersLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only navigate dependency needed here

  // Handler for Profile Update (Password)
  const submitHandler = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    if (password && password !== confirmPassword) {
      setProfileError('New passwords do not match.');
      return;
    }
    if (!password) {
      setProfileMessage('No changes to update.');
      return;
    }
    setProfileLoading(true);
    try {
       const token = localStorage.getItem('token');
       const config = { headers: { Authorization: `Bearer ${token}` } };
       // *** Replace with your actual password update endpoint ***
       // await axios.put(`${API_URL}/api/auth/update-password`, { password }, config); // Use API_URL
       console.log('Simulating password update...');
       await new Promise(resolve => setTimeout(resolve, 1000));
       setProfileMessage('Password updated successfully!');
       setPassword('');
       setConfirmPassword('');
    } catch (err) {
       console.error("Password update error:", err);
       setProfileError(err.response?.data?.message || 'Failed to update password.');
    } finally {
       setProfileLoading(false);
    }
  };

  // Handler for Deleting a Listing
  const deleteListingHandler = async (listingId) => {
     if (!window.confirm(`Delete listing ${listingId}?`)) return;
     setListingsLoading(true);
     setListingsError(''); // Clear previous error
     try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_URL}/api/used-items/${listingId}`, config); // Use API_URL
        setUserListings(prev => prev.filter(listing => listing.id !== listingId));
        setProfileMessage('Listing deleted successfully.'); // Use general message area
     } catch (err) {
        console.error("Delete listing error:", err);
        setListingsError(err.response?.data?.message || 'Failed to delete listing.');
     } finally {
        setListingsLoading(false);
     }
  };

  // Helper to render status badges
  const renderStatusBadge = (status) => {
    let variant = 'secondary';
    if (status === 'awaiting shipment' || status === 'processing' || status === 'pending') variant = 'warning';
    else if (status === 'shipped') variant = 'info';
    else if (status === 'delivered') variant = 'success';
    else if (status === 'cancelled') variant = 'danger';
    return <Badge bg={variant}>{status ? status.replace('_', ' ') : 'Unknown'}</Badge>;
  };

  // Render Logic
  return (
    <Container className="my-4">
      <Row className="mb-4"><Col><h1>My Profile</h1></Col></Row>
      <Tab.Container id="profile-tabs" defaultActiveKey="orders">
        <Row>
          {/* Navigation */}
          <Col md={3}>
            <Nav variant="pills" className="flex-column mb-3 mb-md-0">
              <Nav.Item><Nav.Link eventKey="info">Profile Info</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="orders">My Orders</Nav.Link></Nav.Item>
              <Nav.Item><Nav.Link eventKey="listings">My Listings</Nav.Link></Nav.Item>
            </Nav>
          </Col>
          {/* Content */}
          <Col md={9}>
            <Tab.Content>
              {/* Profile Info Pane */}
              <Tab.Pane eventKey="info">
                <h2>Profile Information</h2>
                {profileError && <Alert variant="danger">{profileError}</Alert>}
                {profileMessage && <Alert variant="success">{profileMessage}</Alert>}
                {profileLoading ? <div className="text-center"><Spinner animation="border" /></div> : (
                  <Form onSubmit={submitHandler}>
                    {/* Name, Email, Password Fields... */}
                    <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={profileInfo.name} disabled readOnly /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={profileInfo.email} disabled readOnly /></Form.Group>
                    <hr /><h5>Update Password</h5>
                    <Form.Group className="mb-3"><Form.Label>New Password</Form.Label><Form.Control type="password" placeholder="Leave blank to keep current" value={password} onChange={(e) => setPassword(e.target.value)} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label>Confirm New Password</Form.Label><Form.Control type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={!password} /></Form.Group>
                    <Button variant="primary" type="submit" disabled={profileLoading || !password}>{profileLoading ? <Spinner size="sm"/> : 'Update Password'}</Button>
                  </Form>
                )}
              </Tab.Pane>
              {/* My Orders Pane */}
              <Tab.Pane eventKey="orders">
                <h2>My Orders</h2>
                {ordersError && <Alert variant="danger">{ordersError}</Alert>}
                {ordersLoading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? (
                  <Alert variant="info">You haven't placed any orders yet.</Alert>
                ) : (
                  <Table striped bordered hover responsive size="sm">
                    <thead><tr><th>ID</th><th>Date</th><th>Total</th><th>Status</th><th>Items</th></tr></thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>${order.total_amount ? order.total_amount.toFixed(2) : '0.00'}</td>
                          <td>{renderStatusBadge(order.status)}</td>
                          <td>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} item(s)</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>
              {/* My Listings Pane */}
              <Tab.Pane eventKey="listings">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2>My Listings</h2><Link to="/add-listing" className="btn btn-success btn-sm">+ Add Listing</Link>
                </div>
                {listingsError && <Alert variant="danger">{listingsError}</Alert>}
                {profileMessage && <Alert variant="info">{profileMessage}</Alert>} {/* Show general messages */}
                {listingsLoading ? <div className="text-center"><Spinner animation="border" /></div> : userListings.length === 0 ? (
                  <Alert variant="info">You haven't created any listings. <Link to="/add-listing">Add one!</Link></Alert>
                ) : (
                  <Table striped bordered hover responsive size="sm">
                    <thead><tr><th>Title</th><th>Price</th><th>Condition</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {userListings.map((listing) => (
                        <tr key={listing.id}>
                          <td>{listing.name}</td><td>${listing.price ? listing.price.toFixed(2) : '0.00'}</td><td>{listing.condition_status || 'N/A'}</td>
                          <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                          <td> {/* Status Badge Logic */}
                            {listing.is_sold ? <Badge bg="success">Sold</Badge> :
                             listing.approval_status === 'pending' ? <Badge bg="warning" text="dark">Pending</Badge> :
                             listing.approval_status === 'denied' ? <Badge bg="danger">Denied</Badge> :
                             <Badge bg="primary">Active</Badge>}
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1 mb-1 mb-md-0" onClick={() => navigate(`/edit-listing/${listing.id}`)} title="Edit"><i className="fas fa-edit"></i></Button>
                            <Button variant="outline-danger" size="sm" className="mb-1 mb-md-0" onClick={() => deleteListingHandler(listing.id)} disabled={listingsLoading} title="Delete"><i className="fas fa-trash"></i></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default ProfilePage;
