import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';

// Define the API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component
    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get(`${API_URL}/api/notifications`, config); // Use API_URL
        if (isMounted && data) {
          // Filter out notifications already marked as seen based on client-side logic
          setNotifications(data.filter(notif => (notif.seen_count || 0) < 1));
        }
      } catch (err) {
        console.error('Error fetching notifications:', err.response?.data?.message || err.message);
      }
    };

    fetchNotifications();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleClose = async (id) => {
    // Optimistically remove the notification from the UI
    setNotifications(prevNotifications => prevNotifications.filter(notif => notif.id !== id));

    // Then, tell the backend it was seen
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Should not happen if notifications were fetched, but good check
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/api/notifications/${id}/seen`, {}, config); // Use API_URL
      // No need to refresh state here as it was removed optimistically
    } catch (err) {
      console.error('Error updating notification status on backend:', err.response?.data?.message || err.message);
      // Optional: Add the notification back to the UI if the backend call fails?
      // Or show an error message.
    }
  };

  // Only render the container if there are notifications to show
  if (notifications.length === 0) {
     return null;
  }

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1050 }}>
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          onClose={() => handleClose(notification.id)}
          show={true} // Controlled by the presence in the notifications array
          delay={8000} // Slightly shorter delay?
          autohide
          bg="light" // Example background
        >
          <Toast.Header closeButton={true}> {/* Ensure close button shows */}
            <strong className="me-auto">Notification</strong>
            <small className="text-muted">
              {/* Format date nicely if possible */}
              {new Date(notification.created_at).toLocaleTimeString()}
            </small>
          </Toast.Header>
          <Toast.Body>{notification.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default Notifications;
