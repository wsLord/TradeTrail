const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    },
    email: {
        type: String, 
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    address: {
        type: String,
        required: true,
    },
    state:{
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true,
    },
    purchasedProducts: [
        {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
        },
    ],
    postedProducts: [
        {
          type: mongoose.Types.ObjectId,
          ref: 'Product',
        },
    ],
    // watchList: [
    //     {
    //       type: mongoose.Types.ObjectId,
    //       ref: 'Auction',
    //     },
    // ],
});