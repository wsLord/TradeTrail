const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OttSchema = new Schema({
    platform_name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },

    min_price: { 
        type: Number,
        required: function() { return this.saleType === 'auction'; }
      },
      startDate: {
        type: Date,
        required: function() { return this.saleType === 'auction'; }
      },
      endDate: { 
        type: Date,
        required: function() { return this.saleType === 'auction'; }
      },
      
    maxBid: { type: Number, default: 0 }, // Store highest bid
    //need to add user
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "BidProducts" }], // Store bid product references
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true, default: 10 }, 

    saleType: {
        type: String,
        enum: ['direct', 'auction'],
        required: true
      },
    
    credentialsVerified: {
             type: Boolean,
             default: false
    },
           
    verificationPending: {
             type: Boolean,
             default: false
    }
});
const ottProduct = mongoose.model("Ott", OttSchema);
module.exports = ottProduct;