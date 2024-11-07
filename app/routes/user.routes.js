module.exports = app => {
  const users = require("../controllers/users.controller.js");

  var router = require("express").Router();

  // Create a new users
  router.post("/", users.create);

  //Sell ETH for usdt
  router.post("/convertETH", users.convertEthToUsdt);

  // Retrieve all users
  router.get("/", users.findAll);

  // Retrieve all published users
  router.get("/flagged", users.findAllFlagged);

  // Retrieve a single users with id
  router.get("/:address", users.findOne);

  // Update a users with address
  router.put("/:address", users.update);

  // Update a users with address
  router.put("/refered/:address", users.incrementReferrals);

  // Delete a users with address
  router.delete("/:address", users.delete);

  //delete all users
  router.delete("/", users.deleteAll);

  app.use("/api/users", router);
};
