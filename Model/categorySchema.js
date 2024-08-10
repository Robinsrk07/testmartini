const mongoose = require("mongoose")

  const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: {
      data: { type: Buffer, required: false },
      contentType: { type: String, required: false }
    }, 
    is_list: { type: Boolean, default: true }
  });
 

module.exports = mongoose.model("category",categorySchema);