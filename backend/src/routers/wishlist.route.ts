import express from 'express';
import { addToWishlist, getWishlists, moveWishlistItemToCart, removeFromWishlist } from '../controllers/wishlist.controller.js';


const router = express.Router()

router.get('/', getWishlists)
router.post('/:productId', addToWishlist)
router.delete('/:productId', removeFromWishlist)
router.post('/', moveWishlistItemToCart)

export default router;