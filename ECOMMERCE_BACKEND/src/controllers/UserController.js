const UserService = require("../services/UserService");
const JWTService = require("../services/JWTService");
const createUser = async (req, res) => {
  try {
    const { fullName, email, passwordHash, confirmPassword, phone } = req.body;

    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isCheckEmail = reg.test(email);
    console.log("isCheckEmail", isCheckEmail);
    if (!email || !passwordHash) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    } else if (!isCheckEmail) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is email",
      });
    } else if (passwordHash !== confirmPassword) {
      return res.status(200).json({
        status: "ERR",
        message: "The passwordHash is equal confirmPassword",
      });
    }

    const responseFromService = await UserService.createUser(req.body);
    return res.status(200).json(responseFromService);
  } catch (e) {
    console.error("CreateUser error:", e);
    return res.status(500).json({
      status: "ERR",
      message: e.message || e.toString(),
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    if (!email || !passwordHash) {
      return res.status(200).json({
        status: "ERR",
        message: "The input is required",
      });
    }

    const responseFromService = await UserService.loginUser(req.body);
    const { refresh_token, ...newReponse } = responseFromService;
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax", // hoặc “none” nếu dùng https
      path: "/",
    });
    return res.status(200).json(newReponse);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e, // show message thực sự
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id; // sửa lại id
    const data = req.body;

    if (!userId) {
      return res.status(400).json({
        // dùng 400 cho thiếu params
        status: "ERR",
        message: "The userId is required",
      });
    }

    const responseFromService = await UserService.updateUser(userId, data);
    return res.status(200).json(responseFromService);
  } catch (e) {
    console.error("Update user error:", e);
    return res.status(500).json({
      message: e.message || e,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const token = req.headers;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "The userId is required",
      });
    }

    const responseFromService = await UserService.deleteUser(userId);
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e, // show message thực sự
    });
  }
};
const deleteMany = async (req, res) => {
  try {
    const ids = req.body;
    const token = req.headers;

    if (!ids) {
      return res.status(200).json({
        status: "ERR",
        message: "The ids is required",
      });
    }

    const responseFromService = await UserService.deleteManyUser(ids);
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e, // show message thực sự
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const responseFromService = await UserService.getAllUser();
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};

const getDetailUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "The userId is required",
      });
    }

    const responseFromService = await UserService.getDetailUser(userId);
    return res.status(200).json(responseFromService);
  } catch (e) {
    return res.status(500).json({
      message: e.message || e, // show message thực sự
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;

    if (!token) {
      return res.status(200).json({
        status: "ERR",
        message: "The token is required",
      });
    }

    const responseFromService = await JWTService.refreshTokenJWTService(token);
    return res.status(200).json(responseFromService);
    return;
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};

const lockoutUser = async (req, res) => {
  try {
    res.clearCookie("refresh_token");
    return res.status(200).json({
      status: "OK",
      message: "Logout Successfully",
    });
  } catch (e) {
    return res.status(500).json({
      message: e.message || e,
    });
  }
};
module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUser,
  getDetailUser,
  refreshToken,
  lockoutUser,
  deleteMany,
};
