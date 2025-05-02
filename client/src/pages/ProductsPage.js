import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Spinner, Alert } from 'react-bootstrap'; // Added Spinner, Alert
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Product from '../components/Product'; // Assuming path is correct

// Define the API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductsPage = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryName, setCategoryName] = useState('All Products');

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        // Fetch products and categories concurrently
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get(`${API_URL}/api/products`), // Use API_URL
          axios.get(`${API_URL}/api/categories`) // Use API_URL
        ]);

        const allProducts = productsResponse.data || [];
        const allCategories = categoriesResponse.data || [];

        if (categoryId) {
          const catId = parseInt(categoryId);
          const currentCategory = allCategories.find(cat => cat.id === catId);
          setCategoryName(currentCategory ? currentCategory.name : `Category ${categoryId}`);

          // Find subcategory IDs if the current category is a parent
          const subcategoryIds = allCategories
            .filter(cat => cat.parent_id === catId)
            .map(cat => cat.id);

          // Filter products by the current category ID OR any of its subcategory IDs
          const filteredByCategory = allProducts.filter(product =>
            product.category_id === catId || subcategoryIds.includes(product.category_id)
          );

          setProducts(filteredByCategory);
          setFilteredProducts(filteredByCategory); // Initially set filtered list

        } else {
          // No category specified, show all products
          setProducts(allProducts);
          setFilteredProducts(allProducts); // Initially set filtered list
          setCategoryName('All Products');
        }

      } catch (err) {
        console.error('Failed to load products/categories:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, [categoryId]); // Re-run when categoryId changes

  // Filter products based on search term (client-side filtering)
  useEffect(() => {
    if (!loading) { // Only filter after initial load
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          const filtered = products.filter(product =>
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            (product.description && product.description.toLowerCase().includes(lowerSearchTerm)) ||
            (product.brand && product.brand.toLowerCase().includes(lowerSearchTerm))
          );
          setFilteredProducts(filtered);
        } else {
          // If search term is empty, show all products relevant to the category
          setFilteredProducts(products);
        }
    }
  }, [searchTerm, products, loading]); // Re-run when search, products list, or loading state changes

  return (
    <Container className="my-4">
      <h1 className="mb-4">{categoryName}</h1>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Search within this category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search products"
          />
        </Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredProducts.length === 0 ? (
         <Alert variant="info">{searchTerm ? 'No products match your search term.' : 'No products found in this category.'}</Alert>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filteredProducts.map((product) => (
            <Col key={product.id}>
              {/* Ensure Product component receives the product prop */}
              <Product product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductsPage;
