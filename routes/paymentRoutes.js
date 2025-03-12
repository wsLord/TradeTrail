const express=require('express');
const router=express.Router();
//const { createOrder, verifyPayment }= require('../controllers/paymentController');
const paymentController= require('../controllers/paymentController');
router.post('/createOrder', paymentController.createOrder);
router.post('/verifyPayment', paymentController.verifyPayment);
router.get('/', paymentController.getPaymentPage);
router.get('/payment-success', paymentController.paymentSuccess);
module.exports=router;
