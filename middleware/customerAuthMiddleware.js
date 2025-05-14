const authenticateCustomer = (req, res, next) => {
  if (req.session && req.session.tableId) {
    next();
  } else {
    res.status(401).json({
      message: "Unauthorized access. Please scan the QR code to proceed.",
    });
  }
};

export default authenticateCustomer;
