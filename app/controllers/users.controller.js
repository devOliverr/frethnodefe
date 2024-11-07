const db = require("../models");
const { convertEthToUsdt } = require('../profits.js');
const Users = db.users;

// Create and Save a new Users
exports.create = (req, res) => {
  // Validate request
  if (!req.body.address) {
    res.status(400).send({ message: "Address cannot be empty!" });
    return;
  }

  // Check if address already exists in the database
  Users.findOne({ $or: [{address: req.body.address}, {referralCode: req.body.referralCode}]})
    .then(existingUser => {
      if (existingUser) {
        // Address already exists
        res.status(400).send({ message: "Address already exists!" });
      } else {
        // Create a new user if address does not exist
        const users = new Users({
          address: req.body.address,
          balance: req.body.balance,
          ethprofit: req.body.ethprofit,
          usdtprofit: req.body.usdtprofit,
          withdrawal: req.body.withdrawal,
          referrals: req.body.referrals,
          referralCode: req.body.referralCode,
          dateInvest: req.body.dateInvest,
          flagged: req.body.flagged,

        });

        // Save new user to the database
        users
          .save()
          .then(data => {
            res.send(data);
          })
          .catch(err => {
            res.status(500).send({
              message: err.message || "Some error occurred while creating the user."
            });
          });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while checking the address."
      });
    });
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  const address = req.query.address;
  var condition = address ? { address: { $regex: new RegExp(address), $options: "i" } } : {};

  Users.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving userss."
      });
    });
};

// Find a single Users with an id
exports.findOne = (req, res) => {
  const address = req.params.address; // Extract address from request parameters

  // Find user by address
  Users.findOne({ address: address })
    .then(data => {
      if (!data) {
        res.status(404).send({ message: "Not found user with address " + address });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error retrieving user with address=" + address });
    });
};


// Update a Users by the address in the request
exports.update = async (req, res) => {
  // Validate request
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({
      message: "Data to update cannot be empty!"
    });
  }

  // Check if referralCode exists and handle it
  if (req.body.referralCode) {
    const existingUser = await Users.findOne({ referralCode: req.body.referralCode });
    if (existingUser) {
      return res.status(400).send({
        message: "Referral Code already exists!"
      });
    }
  }

  const address = req.params.address; // Extract address from request parameters

  // Use $set to update only the provided fields and keep the rest unchanged
  Users.findOneAndUpdate(
    { address: address },
    { $set: req.body }, // $set will update only the provided fields
    { new: true, useFindAndModify: false } // new: true returns the updated document
  )
    .then(data => {
      if (!data) {
        return res.status(404).send({
          message: `Cannot update user with address=${address}. Maybe user was not found!`
        });
      } else {
        res.send({ message: "User was updated successfully.", data });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating user with address=" + address
      });
    });
};





// Delete a Users with the specified address in the request
exports.delete = (req, res) => {
  const address = req.params.address; // Extract address from request parameters

  // Find user by address and remove
  Users.findOneAndRemove({ address: address }, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot delete user with address=${address}. Maybe user was not found!`
        });
      } else {
        res.send({
          message: "User was deleted successfully!"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete user with address=" + address
      });
    });
};


// Delete all Users from the database.
exports.deleteAll = (req, res) => {
  Users.deleteMany({})
    .then(data => {
      res.send({
        message: `${data.deletedCount} users were deleted successfully!`
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all users."
      });
    });
};

// Find all published Users
exports.findAllFlagged = (req, res) => {
  Users.find({ flagged: true })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving userss."
      });
    });
};

exports.incrementReferrals = async (req, res) => {
  try {
    // Get the referral code from the request
    const { referralCode } = req.body;

    // Find the user by referralCode and increment the referrals field
    const updatedUser = await Users.findOneAndUpdate(
      { referralCode: referralCode }, // Query to find the document by referralCode
      { $inc: { referrals: 1 } }, // $inc increments the referrals field by 1
      { new: true } // Return the updated document
    );

    // If no user was found with the provided referralCode
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found with the given referral code' });
    }

    // Respond with the updated user document
    return res.status(200).json({ message: 'Referrals incremented', user: updatedUser });
  } catch (error) {
    // Handle any errors that occur
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.convertEthToUsdt = async (req, res) => {
  console.log(req.body)
  convertEthToUsdt(req, res);
}


