const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { generalAccessToken, generalRefreshToken } = require("./JWTService");
const { refreshToken } = require("../controllers/UserController");

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!newUser) {
        return reject("newUser is undefined");
      }

      const { fullName, email, passwordHash, confirmPassword, phone } = newUser;
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser) {
        return resolve({
          status: "ERR",
          message: "The email is already registered",
          data: null,
        });
      }

      if (!fullName || !email || !passwordHash || !confirmPassword) {
        return reject("Missing required fields");
      }
      const hash = bcrypt.hashSync(passwordHash, 10);
      const createdUser = await User.create({
        fullName,
        email,
        passwordHash: hash,

        phone,
      });

      resolve({
        status: "OK",
        message: "SUCCESS",
        data: createdUser,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const loginUser = (userLogin) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userLogin) {
        return reject("userLogin  is undefined");
      }

      const { email, passwordHash } = userLogin;
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser === null) {
        return resolve({
          status: "ERR",
          message: "The email is not defined",
          data: null,
        });
      }

      if (!email || !passwordHash) {
        return reject("Missing required fields");
      }
      const comparePassword = bcrypt.compareSync(
        passwordHash,
        checkUser.passwordHash
      );

      if (!comparePassword) {
        return resolve({
          status: "ERR",
          message: "The password or user is incorrect",
          data: null,
        });
      }
      const access_token = await generalAccessToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });
      const refresh_token = await generalRefreshToken({
        id: checkUser.id,
        isAdmin: checkUser.isAdmin,
      });

      return resolve({
        status: "OK",
        message: "SUCCESS",
        access_token,
        refresh_token,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });

      if (checkUser === null) {
        return resolve({
          status: "ERR",
          message: "The user is not defined",
          data: null,
        });
      }
      const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
      return resolve({
        status: "OK",
        message: "SUCCESS",
        data: updatedUser,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ _id: id });

      if (checkUser === null) {
        return resolve({
          status: "ERR",
          message: "The user is not defined",
          data: null,
        });
      }
      await User.findByIdAndDelete(id);
      return resolve({
        status: "OK",
        message: "DELETE USER SUCCESS",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllUser = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const allUser = await User.find();
      return resolve({
        status: "OK",
        message: "SUCCESS",
        data: allUser,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({ _id: id });

      if (user === null) {
        return resolve({
          status: "ERR",
          message: "The user is not defined",
          data: null,
        });
      }

      return resolve({
        status: "OK",
        message: "FINDING USER SUCCESS",
        data: user,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUser,
  getDetailUser,
};
