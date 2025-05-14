
import Food from "../model/foodModel.js";


export const dashboard = async (req, res) => {
  try {
    const foodItems = await Food.find();

    res.render("admin/dashboard", {
      foodItems,
    });
  } catch (error) {
        req.flash("error", "Error loading dashboard. Please try again.");
    res.redirect("/api/admin/login");
  }
};


export const renderAddFoodPage = (req, res) => {
  try {
    res.status(200).render("admin/add-food");
  } catch (error) {
    
    req.flash("error", "Error loading Add Food page.");
    res.redirect("/api/admin/dashboard");
  }
};

// adding new food
export const addNewFoodItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      discount,
      ingredients,
      isVegetarian,
    } = req.body;

    const file = req.file;

    // Validate required fields
    if (!name || !description || !category || !price || !file) {
      req.flash("error", "All required fields must be provided.");
      return res.redirect("/api/admin/dashboard");
    }

    const imageUrl = `/uploads/${file.filename}`;

    await Food.create({
      name,
      description,
      category,
      price,
      discount: discount || 0,
      imageUrl,
      ingredients: ingredients || "No Ingredients Details Available",
      isVegetarian: isVegetarian === "on",
    });

    req.flash("success", "Food item added successfully!");
    return res.redirect("/api/admin/dashboard");

  } catch (error) {
    req.flash("error", "Error adding food item. Please try again.");
    return res.redirect("/api/admin/dashboard");
  }
};



// Update Food Item
export const renderEditFoodPage = async (req, res) => {
  const { id } = req.params;

  try {
    const foodItem = await Food.findById(id);
    
    if (!foodItem) {
      req.flash("error", "Food item not found.");
      return res.redirect("/api/admin/dashboard");
    }

    res.status(200).render("admin/edit-food", {
      foodItem,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Error loading edit food page.");
    res.redirect("/api/admin/dashboard");
  }
};
 

export const updateFoodItem = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  updateData.isVegetarian = req.body.isVegetarian === "on";
  updateData.price = parseFloat(req.body.price);
  updateData.discount = parseFloat(req.body.discount) || 0;

  if (req.file) {
    updateData.image = req.file.filename;
  }

  try {
    const updatedFood = await Food.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedFood) {
      req.flash("error", "Food item not found.");
      return res.redirect("/api/admin/dashboard");
    }

    req.flash("success", "Food item updated successfully!");
    return res.redirect("/api/admin/dashboard");

  } catch (error) {
    req.flash("error", "Error updating food item.");
    return res.redirect("/api/admin/dashboard");
  }
};



export const deleteFoodItem = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFood = await Food.findByIdAndDelete(id);

    if (!deletedFood) {
      req.flash("error", "Food item not found!");
      return res.redirect("/api/admin/dashboard");
    }

    req.flash("success", "Food item deleted successfully!");
    return res.redirect("/api/admin/dashboard");
  } catch (error) {
    req.flash("error", "Error deleting food item: " + error.message);
    return res.redirect("/api/admin/dashboard");
  }
};

export const searchFood = async (req, res) => {
  const { q, category, veg, sort } = req.query;
  const query = {};
  if (q) query.name = { $regex: q, $options: "i" };
  if (category) query.category = category;
  if (veg === "true") query.isVegetarian = true;

  let sortOption = {};
  if (sort === "price_asc") sortOption.price = 1;
  else if (sort === "price_desc") sortOption.price = -1;

  try {
    const results = await Food.find(query).sort(sortOption);

    if (results.length === 0) {
      req.flash("error", "No food items found.");
      return res.redirect("/api/admin/dashboard");
    }

    req.flash("success", `${results.length} item(s) found.`);
    res.render("admin/search-results", {
      results,
      query: q,
      messages: req.flash(),
    });
  } catch (err) {
    req.flash("error", "Search failed. Try again.");
    res.redirect("/api/admin/dashboard");
  }
};
