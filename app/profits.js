const cron = require('node-cron');
const axios = require('axios');
const db = require("./models");
const Users = db.users;

// Function to fetch ETH price
async function getEthPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    return response.data.ethereum.usd; // ETH price in USD
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return null;
  }
}

// Function to calculate percentage based on balance
function calculateProfitPercentage(balance) {
  if (balance >= 99 && balance <= 1499) return 0.02;
  if (balance >= 1500 && balance <= 2999) return 0.025;
  if (balance >= 3000 && balance <= 4999) return 0.028;
  if (balance >= 5000 && balance <= 9999) return 0.032;
  if (balance >= 10000 && balance <= 49999) return 0.038;
  if (balance >= 50000 && balance <= 99999) return 0.049;
  if (balance >= 100000) return 0.05;
  return 0; // Return 0 for balances below 99
}

// The main function to update ethprofit every 24 hours
async function updateUserProfits() {
  try {
    const ethPrice = await getEthPrice(); // Fetch ETH price in USD
    if (!ethPrice) {
      console.error('Failed to retrieve ETH price, skipping update.');
      return;
    }

    // Fetch all users
    const users = await Users.find();

    for (const user of users) {
      const profitPercentage = calculateProfitPercentage(user.balance);
      if (profitPercentage > 0) {
        const usdProfit = user.balance * profitPercentage; // Profit in USD
        const ethProfit = usdProfit / ethPrice; // Convert USD profit to ETH

        // Update the user's ethprofit
        user.ethprofit += ethProfit; // Add the calculated ethProfit
        await user.save(); // Save the user document
        console.log(`Updated user ${user.address} with profit ${ethProfit} ETH`);
      }
    }
  } catch (error) {
    console.error('Error updating user profits:', error);
  }
}

// Controller function to convert ethprofit to usdtprofit
const convertEthToUsdt = async (req, res) => {
  try {
    // Extract eth to be sold and the user address from the request
    const { ethToSell, address } = req.body;

    if (!ethToSell || ethToSell <= 0) {
      return res.status(400).json({ message: 'Invalid ETH amount' });
    }

    // Fetch the user by address
    const user = await Users.findOne({ address: address });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has enough ethprofit to sell
    if (user.ethprofit < ethToSell) {
      return res.status(400).json({ message: 'Insufficient ethprofit' });
    }

    // Fetch the current ETH/USDT price
    const ethToUsdtPrice = await getEthPrice();
    const usdtAmount = ethToSell * ethToUsdtPrice; // Convert ETH to USDT

    // Update user's ethprofit and usdtprofit
    user.ethprofit -= ethToSell; // Subtract the sold ETH from ethprofit
    user.usdtprofit += usdtAmount; // Add the equivalent USDT to usdtprofit

    // Save the updated user data
    await user.save();

    // Respond with the updated user data
    res.status(200).json({
      message: 'ETH converted to USDT successfully',
      ethSold: ethToSell,
      usdtAdded: usdtAmount,
      user: {
        address: user.address,
        ethprofit: user.ethprofit,
        usdtprofit: user.usdtprofit
      }
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



module.exports = { updateUserProfits, convertEthToUsdt };