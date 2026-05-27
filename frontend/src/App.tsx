import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./middleware/ProtectedRoute";
import GuestRoute from "./middleware/GuestRoute";

import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProductIndex from "./pages/products/Index";
import ProductDetails from "./pages/products/Details";
import Cart from "./pages/cart/Cart";
import Wishlist from "./pages/wishlist/Wishlist";
import SearchPage from "./pages/search/Search";
import Vendors from "./pages/vendors/Vendors";
import Categories from "./pages/categories/Categories";
import About from "./pages/about/About";
import Profile from "./pages/profile/Profile";
import PaymentCallback from "./pages/payment/PaymentCallback";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        <Route path="products" element={<ProductIndex />} />
        <Route path="products/:slug" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="categories" element={<Categories />} />
        <Route path="about" element={<About />} />
        <Route path="payment/callback" element={<PaymentCallback />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:tab" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
