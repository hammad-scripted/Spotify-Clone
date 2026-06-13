export const authCallback = async (req, res) => {
  const { id, firstName, lastName, imageUrl } = req.body;

  if (!id || !firstName || !lastName || !imageUrl) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields");
  }
  // ? check if user exists already
  const user = User.findOne({ clerkId: id });
  if (user) {
    return res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, 'User already exists'));
  }
  const newUser = new User({
    clerkId: id,
    fullName: `${firstName} ${lastName}`,
    imageUrl: imageUrl,
  });
  await newUser.save();
  return res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'User created successfully'));
};
