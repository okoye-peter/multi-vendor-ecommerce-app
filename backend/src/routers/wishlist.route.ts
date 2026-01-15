import express from 'express';
import { clearWishlist, getWishlists, moveWishlistItemToCart, toggleProductInWishlist } from '../controllers/wishlist.controller.js';


const router = express.Router()

router.get('/', getWishlists)
router.delete('/', clearWishlist)
router.post('/:productId', toggleProductInWishlist)
router.post('/add-to-cart', moveWishlistItemToCart)

export default router;