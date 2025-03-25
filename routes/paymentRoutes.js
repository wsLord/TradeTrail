const express=require('express');
const router=express.Router();
const paymentController= require('../controllers/paymentController');
const Cart=require("../models/cartModel");
const {protectRoute}=require("../middleware/authMiddleware");
//router.post('/createOrder', paymentController.createOrder);
router.post('/verifyPayment',protectRoute, paymentController.verifyPayment);
router.get('/', paymentController.getPaymentPage);
router.get('/success', paymentController.paymentSuccess);
router.get('/test', (req, res) => {
    res.send('Payment API is working!');
});
router.post("/makePayment",protectRoute, paymentController.makePayment);
module.exports=router;