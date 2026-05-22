const crypto = require("crypto");
const Building = require("../models/Building");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { signToken } = require("../utils/tokens");
const { serializeBuilding, serializeUser } = require("../utils/serializers");

function makeBuildingCode(name) {
  const base = (name || "BUILDING")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "B");
  return `${base}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function authResponse(res, user, building, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    token: signToken(user),
    user: serializeUser(user),
    building: serializeBuilding(building)
  });
}

const registerAdmin = asyncHandler(async (req, res) => {
  const name = req.body.name || req.body.adminName;
  const { phone, buildingName, password } = req.body;

  if (!name || !phone || !buildingName || !password) {
    res.status(400);
    throw new Error("Name, phone, building name and password are required");
  }

  const existingAdmin = await User.findOne({ phone, role: "admin" });
  if (existingAdmin) {
    res.status(409);
    throw new Error("An admin with this phone already exists");
  }

  let code = makeBuildingCode(buildingName);
  while (await Building.exists({ code })) {
    code = makeBuildingCode(buildingName);
  }

  const building = await Building.create({ name: buildingName, code });
  const user = await User.create({
    name,
    phone,
    password,
    role: "admin",
    building: building._id,
    status: "Active"
  });

  building.admin = user._id;
  await building.save();

  authResponse(res, user, building, 201);
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, phone, flatNo, buildingCode, password } = req.body;
  const rent = Number(req.body.rent || 0);

  if (!name || !phone || !flatNo || !buildingCode || !password) {
    res.status(400);
    throw new Error("Name, phone, flat number, building code and password are required");
  }

  const building = await Building.findOne({ code: buildingCode.toUpperCase().trim() });
  if (!building) {
    res.status(404);
    throw new Error("Building code was not found");
  }

  const duplicate = await User.findOne({
    building: building._id,
    $or: [{ phone }, { flatNo }]
  });

  if (duplicate) {
    res.status(409);
    throw new Error("Phone or flat number is already registered for this building");
  }

  const user = await User.create({
    name,
    phone,
    flatNo,
    rent,
    password,
    role: "tenant",
    building: building._id,
    status: "Active"
  });

  authResponse(res, user, building, 201);
});

const login = asyncHandler(async (req, res) => {
  const { phone, flatNo, password, buildingCode } = req.body;
  const loginId = phone || flatNo;

  if (!loginId || !password) {
    res.status(400);
    throw new Error("Phone/flat number and password are required");
  }

  const query = {
    $or: [{ phone: loginId }, { flatNo: loginId }]
  };

  if (buildingCode) {
    const building = await Building.findOne({ code: buildingCode.toUpperCase().trim() });
    if (!building) {
      res.status(404);
      throw new Error("Building code was not found");
    }
    query.building = building._id;
  }

  const user = await User.findOne(query).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid login credentials");
  }

  const building = await Building.findById(user.building);
  authResponse(res, user, building);
});

const me = asyncHandler(async (req, res) => {
  const building = await Building.findById(req.user.building);
  res.json({
    success: true,
    user: serializeUser(req.user),
    building: serializeBuilding(building)
  });
});

module.exports = { registerAdmin, registerUser, login, me };
