const healthCheck = async (req, res) => {
  try {
    console.log(req.io);
    return res.json({ server: { status: "ok" } });
  } catch (error) {
    new Error("something went wrong");
  }
};

module.exports = healthCheck;
