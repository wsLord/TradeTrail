const express=require('express');
const router=express.Router();
const paymentController= require('../controllers/paymentController');
const Cart=require("../models/cartModel");
//router.post('/createOrder', paymentController.createOrder);
router.post('/verifyPayment', paymentController.verifyPayment);
router.get('/', paymentController.getPaymentPage);
router.get('/success', paymentController.paymentSuccess);
router.get('/test', (req, res) => {
    res.send('Payment API is working!');
});
router.post("/makePayment", paymentController.makePayment);
module.exports=router;