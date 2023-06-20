const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(express.json()); 

const users = [
  {
    id: '1',
    username: 'josealcalde',
    password: '11', 
    isAdmin: false,
    cart: []
  }
];

const products = [
  {
    id: '1',
    name: 'Doritos',
    price: 150,
    isActive: true
  },
  {
    id: '2',
    name: 'Lays',
    price: 170,
    isActive: true
  },
  {
    id: '3',
    name: 'Rold Gold',
    price: 185,
    isActive: true
  }
];

// User Registration
app.post('/login', (req, res) => {
 
});

function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    const userId = decoded.id;
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  });
}

// User authentication/verification
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Authentication failed' });
    }

    if (!result) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, 'secretkey');
    res.json({ token });
  });
});

// Create a Product (Admin only)
app.post('/products', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { name, price, isActive } = req.body;

  const newProduct = {
    id: String(products.length + 1),
    name,
    price,
    isActive
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
});

// Retrieve all products (Admin only)
app.get('/products', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  res.json(products);
});

// Set user as admin (Admin only)
app.put('/users/:userId/admin', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const userId = req.params.userId;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isAdmin = true;

  res.json({ message: 'User set as admin' });
});

//Retrieve authenticated user's orders
app.get('/orders', authenticate, (req, res) => {
  const userId = req.user.id;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const userOrders = user.orders;

  res.json(userOrders);
});;

// Retrieve all active products
app.get('/products/active', authenticate, (req, res) => {
  const activeProducts = products.filter(product => product.isActive);
  res.json(activeProducts);
});

// Retrieve single product
app.get('/products/:id', authenticate, (req, res) => {
  const productId = req.params.id;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
});

// Update Product information (Admin only)
app.put('/products/:id', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const productId = req.params.id;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const updatedProduct = req.body;
  Object.assign(product, updatedProduct);

  res.json(product);
});

// Archive Product (Admin only)
app.put('/products/:id/archive', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const productId = req.params.id;
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  product.isActive = false;

  res.json({ message: 'Product archived' });
});

// Retrieve authenticated user's orders
app.get('/orders', authenticate, (req, res) => {
  const userId = req.user.id;
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const userOrders = user.orders;

  res.json(userOrders);
});

// Retrieve all orders (Admin only)
app.get('/orders/all', authenticate, (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
});

// Add to Cart
app.post('/cart', authenticate, (req, res) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;

  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const cartItem = {
    productId,
    name: product.name,
    price: product.price,
    quantity
  };

  req.user.cart.push(cartItem);

  res.json({ message: 'Product added to cart' });
});

// Retrieve Cart
app.get('/cart', authenticate, (req, res) => {
  const cartItems = req.user.cart;
  res.json(cartItems);
});

// Change product quantities in Cart
app.put('/cart/:productId', authenticate, (req, res) => {
  const productId = req.params.productId;
  const quantity = req.body.quantity;

  const cartItem = req.user.cart.find(item => item.productId === productId);

  if (!cartItem) {
    return res.status(404).json({ message: 'Product not found in cart' });
  }

  cartItem.quantity = quantity;

  res.json({ message: 'Cart updated' });
});

// Remove product from Cart
app.delete('/cart/:productId', authenticate, (req, res) => {
  const productId = req.params.productId;

  const cartItemIndex = req.user.cart.findIndex(item => item.productId === productId);

  if (cartItemIndex === -1) {
    return res.status(404).json({ message: 'Product not found in cart' });
  }

  req.user.cart.splice(cartItemIndex, 1);

  res.json({ message: 'Product removed from cart' });
});

//Subtotal for each item in Cart
function calculateSubtotal(item) {
  // Code for calculating the subtotal for each item in the cart
  // ...
}

//Total price for all items in Cart
function calculateTotal(cart) {
  // Code for calculating the total price for all items in the cart
  // ...
}

app.get('/', (req, res) => {
  res.send('E-commerce API MVP');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});