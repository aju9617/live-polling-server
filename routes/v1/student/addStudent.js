const slugify = require("slugify");

const addStudent = async (req, res) => {
  try {
    const { name } = req.body;
    let id = `${slugify(name)}-${Date.now()}`;
    req.io.emit("new-student-joined", { name, id });

    return res.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    new Error("something went wrong");
  }
};

module.exports = addStudent;
