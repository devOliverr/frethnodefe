module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      address: String,
      balance: Number,
      ethprofit: Number,
      usdtprofit: Number,
      withdrawal: [{amount : Number}],
      referralCode: String,
      referrals: Number,
      flagged : Boolean
    },
    { timestamps: true }
  );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Users = mongoose.model("users", schema);
  return Users;
};
