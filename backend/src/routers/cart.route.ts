import express from 'express';
import { addToCart, clearAllCartItem, getCarts, removeFromCartByCartId, updateCart } from '../controllers/cart.controller.js';



const router = express.Router()


router.get('/', getCarts);
router.post('/', addToCart);
router.put('/:cartId', updateCart);
router.delete('/:cartId', removeFromCartByCartId);
router.delete('/', clearAllCartItem);


export default router;