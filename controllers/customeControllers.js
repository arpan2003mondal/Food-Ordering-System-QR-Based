import Food from "../model/foodModel.js";
import Cart from "../model/cartModel.js";
import Order from "../model/orderModel.js";

// QR Code Scan Route
export const qrScanRoute = async (req, res) => {
  // const { tableId } = req.params;

  // try {
  //   req.session.tableId = tableId;

  //   const foodItems = await Food.find();

  //   res.status(200).json({
  //     message: "Menu fetched successfully! qrScan",
  //     tableId: req.session.tableId,
  //     menu: foodItems,
  //   });
  // } catch (error) {
  //   res.status(500).json({
  //     message: "Error fetching menu!",
  //     error: error.message,
  //   });
  // }

  const { tableId } = req.params;

  try {
    req.session.tableId = tableId;

    const foodItems = await Food.find();

    res.status(200).render("customer/home", {
      tableId: req.session.tableId,
      menu: foodItems,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading menu page!");
  }
};

// View Menu Route
export const viewMenu = async (req, res) => {
  try {
    const foodItems = await Food.find();

    res.status(200).json({
      message: "Menu fetched successfully! viewMenu",
      tableId: req.session.tableId,
      menu: foodItems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching menu!",
      error: error.message,
    });
  }
};

// Get Food Details
export const getFoodDetails = async (req, res) => {
  const { itemId } = req.query;

  if (!itemId) {
    return res.status(400).json({
      message: "itemId is required in query string!",
    });
  }

  try {
    const foodItem = await Food.findById(itemId);

    if (!foodItem) {
      return res.status(404).json({
        message: "Food item not found!",
      });
    }

    res.status(200).json({
      message: "Food item details fetched successfully!",
      foodItem,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching food item details!",
      error: error.message,
    });
  }
};

// Add to Cart
export const addToCart = async (req, res) => {
  const { itemId, quantity } = req.query;
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ message: "Table ID not found in session!" });
  }

  try {
    const foodItem = await Food.findById(itemId);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found!" });
    }

    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );

    if (!cart) {
      cart = new Cart({
        tableId,
        items: [{ foodId: itemId, quantity: parseInt(quantity) || 1 }],
        totalAmount: foodItem.price * (parseInt(quantity) || 1),
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.foodId._id.toString() === itemId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += parseInt(quantity) || 1;
      } else {
        cart.items.push({ foodId: itemId, quantity: parseInt(quantity) || 1 });
      }

      cart.totalAmount =
        cart.items.length > 0
          ? cart.items.reduce(
              (total, item) => total + (item.foodId.price || 0) * item.quantity,
              0
            )
          : foodItem.price * (parseInt(quantity) || 1);

      if (isNaN(cart.totalAmount)) {
        cart.totalAmount = 0;
      }
    }

    await cart.save();
    // ✅ Populate after saving to update cart object
    await cart.populate("items.foodId");

    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.foodId.price * item.quantity,
      0
    );

    // ✅ Save again after updating totalAmount
    await cart.save();
    
    res.status(200).json({
      message: "Item added to cart successfully!",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding item to cart!",
      error: error.message,
    });
  }
};

// View Cart
export const viewCart = async (req, res) => {
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ message: "Table ID not found in session!" });
  }

  try {
    const cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart is empty!" });
    }

    // ✅ Recalculate Total Amount
    const updatedTotalAmount = cart.items.reduce(
      (total, item) => total + item.foodId.price * item.quantity,
      0
    );

    if (cart.totalAmount !== updatedTotalAmount) {
      cart.totalAmount = updatedTotalAmount;
      await cart.save();
    }

    res.status(200).json({
      message: "Cart fetched successfully!",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching cart!",
      error: error.message,
    });
  }
};

// Delete Item from Cart
export const deleteFromCart = async (req, res) => {
  const { itemId } = req.query;
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ message: "Table ID not found in session!" });
  }

  try {
    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart is empty!" });
    }

    cart.items = cart.items.filter(
      (item) => item.foodId._id.toString() !== itemId
    );

    // ✅ Recalculate Total Amount
    cart.totalAmount =
      cart.items.length > 0
        ? cart.items.reduce(
            (total, item) => total + (item.foodId.price || 0) * item.quantity,
            0
          )
        : 0; // ✅ Set totalAmount to 0 if cart is empty

    if (isNaN(cart.totalAmount)) {
      cart.totalAmount = 0;
    }

    await cart.save();

    res.status(200).json({
      message: "Item removed from cart successfully!",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing item from cart!",
      error: error.message,
    });
  }
};

// Update Item Quantity in Cart
export const updateCartItemQuantity = async (req, res) => {
  const { itemId, action } = req.query;
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ message: "Table ID not found in session!" });
  }

  try {
    let cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: "Cart is empty!" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.foodId._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart!" });
    }

    if (action === "increase") {
      cart.items[itemIndex].quantity += 1;
    } else if (action === "decrease") {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        cart.items.splice(itemIndex, 1);
      }
    }

    // ✅ Recalculate Total Amount
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.foodId.price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Cart updated successfully!",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating cart!",
      error: error.message,
    });
  }
};

// Place Order
export const placeOrder = async (req, res) => {
  const tableId = req.session.tableId;

  if (!tableId) {
    return res.status(400).json({ message: "Table ID not found in session!" });
  }

  try {
    const cart = await Cart.findOne({ tableId, status: "active" }).populate(
      "items.foodId"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty!" });
    }

    const newOrder = new Order({
      tableId,
      items: cart.items,
      totalAmount: cart.totalAmount, // ✅ Corrected Total Amount
      status: "pending",
    });

    await newOrder.save();
    cart.status = "ordered";
    await cart.save();

    res.status(200).json({
      message: "Order placed successfully!",
      orderId: newOrder._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error placing order!",
      error: error.message,
    });
  }
};

// Payment Initiation
export const initiatePayment = async (req, res) => {
  const { orderId } = req.query;

  try {
    const order = await Order.findById(orderId);

    if (!order || order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Invalid or already paid order!" });
    }

    const paymentId = `PAY_${Date.now()}`;

    order.paymentId = paymentId;
    order.paymentStatus = "processing";
    await order.save();

    res.status(200).json({
      message: "Payment initiated successfully!",
      paymentId,
      orderId: order._id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error initiating payment!",
      error: error.message,
    });
  }
};

// Verify Payment
export const verifyPayment = async (req, res) => {
  const { orderId, paymentId, status } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order || order.paymentId !== paymentId) {
      return res.status(400).json({ message: "Invalid payment or order!" });
    }

    if (status === "success") {
      order.paymentStatus = "paid";
      order.status = "completed";
    } else {
      order.paymentStatus = "failed";
      order.status = "pending";
    }

    await order.save();

    res.status(200).json({
      message: "Payment verification completed!",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error verifying payment!",
      error: error.message,
    });
  }
};
