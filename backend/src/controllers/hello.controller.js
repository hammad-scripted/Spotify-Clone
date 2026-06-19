export const geHello = (req, res) => {
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Hello World', 'Hello World'));
};
