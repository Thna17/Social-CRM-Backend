const bcrypt = require("bcrypt");
const jwt = require("../utils/jwtUtils");
const { User }= require("../models/index")

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(req.body);

    // Validate password
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include an uppercase letter, and a number.",
      });
    }

    // if (password !== confirmPassword) {
    //   return res.status(400).json({ message: "Passwords do not match" });
    // }
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // const otp = generateOtp();
    // const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true,
      // otp,
      // otpExpires,
    });

    res.status(201).json({ message: "User registered successfully" });

    // res.redirect("/login");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendEmail(email, 'Password Reset', `Click here to reset: ${resetUrl}`);
    
    res.status(200).json({ message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.generateToken(user.id);
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    res.status(200).json({ message: 'Email verified successfully.', token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.generateToken(user.id);
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    res.status(200).json({ message: "Login successful", user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  console.log("logout");

  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "Lax",
  });

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out." });
    }

    res.status(200).json({ message: "Logout successful." });
  });
};

