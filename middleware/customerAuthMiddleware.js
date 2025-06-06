// const authenticateCustomer = (req, res, next) => {
//   if (req.session && req.session.tableId) {
//     next();
//   } else {
//     res.status(401).json({
//       message: "Unauthorized access. Please scan the QR code to proceed.",
//     });
//   }
// };

const authenticateCustomer = (req, res, next) => {
  if (req.session && req.session.tableId && req.session.sessionKey) {
    return next();
  }

  // Session is missing or expired
  req.flash("error", "Session expired. Please scan the QR code again to continue.");
  return res.redirect("/scan-qr");
};

export default authenticateCustomer;

