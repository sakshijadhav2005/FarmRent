import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { createEquipment } from "../api";

const AddEquipment = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    model: "",
    type: "",
    year: "",
    price: "",
    location: "",
    description: "",
  });

  const [images, setImages] = useState([]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('model', form.model);
    formData.append('type', form.type);
    formData.append('year', form.year);
    formData.append('pricePerHour', form.price);
    formData.append('location', form.location);
    formData.append('description', form.description);

    if (images.length > 0) {
      formData.append('image', images[0]);
    }

    try {
      const res = await createEquipment(formData);
      alert("Equipment listed successfully!");
      console.log("Response:", res.data);

      setForm({
        name: "",
        model: "",
        type: "",
        year: "",
        price: "",
        location: "",
        description: "",
      });
      setImages([]);

      // Redirect to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert(err.message || "Error adding equipment");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">


      <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden">
        <div className="bg-brand-primary-darkest/50 px-6 py-4 border-b border-brand-primary/20">
          <h2 className="text-lg font-bold text-brand-text-light">Equipment Details</h2>
          <p className="text-brand-text text-sm mt-0.5">Provide accurate information to attract farmers</p>
        </div>

        <form className="p-6 space-y-4" onSubmit={handleSubmit}>

          {/* Equipment Name & Model */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Equipment Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                placeholder="e.g. John Deere 5050D"
                required
              />
            </div>

            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                placeholder="e.g. 5050D, Model X"
                required
              />
            </div>
          </div>

          {/* Type & Year */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Equipment Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                required
              >
                <option value="">Select Equipment Type</option>
                <option value="Tractor">🚜 Tractor</option>
                <option value="Harvester">🌾 Harvester</option>
                <option value="Drone">🚁 Drone</option>
                <option value="Tiller">⚙️ Tiller</option>
              </select>
            </div>

            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Manufacturing Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                placeholder="e.g. 2022"
                min="2000"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>

          {/* Price & Location */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Rental Price (₹/hour)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-brand-text text-sm">₹</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg pl-8 pr-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                  placeholder="e.g. 800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-brand-text font-semibold mb-1.5 text-sm">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                placeholder="City, District"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-brand-text font-semibold mb-1.5 text-sm">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 h-20 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition resize-none"
              placeholder="Describe condition, features, maintenance history, etc."
              required
            ></textarea>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-brand-text font-semibold mb-1.5 text-sm">Equipment Photos</label>

            <label className="border-2 border-dashed border-brand-primary/20 rounded-lg p-6 text-center hover:bg-slate-800/50 cursor-pointer block transition">
              <Upload className="h-8 w-8 mx-auto mb-2 text-brand-text" />
              <p className="text-brand-text font-medium text-sm">Click to upload or drag & drop</p>
              <p className="text-brand-text/70 text-xs mt-0.5">PNG, JPG, GIF up to 10MB</p>

              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setImages([...e.target.files])}
              />
            </label>

            {images.length > 0 && (
              <p className="mt-2 text-xs font-medium text-brand-primary-light">
                ✓ {images.length} file(s) selected
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-brand-primary/20">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border-2 border-slate-600 text-brand-text font-semibold rounded-lg text-sm hover:bg-slate-700 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold rounded-lg text-sm transition shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/40"
            >
              📤 List Equipment
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEquipment;
