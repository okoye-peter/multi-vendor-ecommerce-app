import express from 'express';
import { addToCart, getCarts, removeFromCartByCartId, updateCart } from '../controllers/cart.controller.js';



const router = express.Router()


router.get('/', getCarts);
router.post('/', addToCart);
router.put('/:cartId', updateCart);
router.delete('/:cartId', removeFromCartByCartId);


export default router;