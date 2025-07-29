import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

const UserProfile = ({ profile, onUpdateProfile, onClose }) => {
  const [formData, setFormData] = useState({
    name: profile.name || "",
    email: profile.email || "",
    preferences: profile.preferences || [],
    bio: profile.bio || "",
    avatarUrl: profile.avatarUrl || "",
    dateOfBirth: profile.dateOfBirth || "",
    hintUsage: profile.hintUsage || 0,
    achievements: profile.achievements || [],
    notificationEnabled: profile.notificationEnabled || true,
  });
  const [progressSummary, setProgressSummary] = useState({
    completedLessons: 0,
    averageScore: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  const availableCategories = ["Language", "Mindfulness", "Science", "Math", "History"];

  useEffect(() => {
    const fetchProgressSummary = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "progress", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const completedLessons = data.completedLessons?.length || 0;
          const attempts = data.attempts || [];
          const averageScore =
            attempts.length > 0
              ? Math.round(
                  attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length
                )
              : 0;
          setProgressSummary({ completedLessons, averageScore });
        }
      }
    };
    fetchProgressSummary();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    }
  };

  const handlePreferenceToggle = (category) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(category)
        ? prev.preferences.filter((c) => c !== category)
        : [...prev.preferences, category],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>
            {isEditing && (
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                placeholder="Enter image URL"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{formData.name || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold">Email</label>
              <p className="text-gray-900">{formData.email}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{formData.dateOfBirth || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-semibold">Bio</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              ) : (
                <p className="text-gray-900">{formData.bio || "Not set"}</p>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Learning Preferences</label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferences.includes(category)}
                      onChange={() => handlePreferenceToggle(category)}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-900">
                {formData.preferences.length > 0
                  ? formData.preferences.join(", ")
                  : "Not set"}
              </p>
            )}
          </div>

          {/* Progress Summary */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Progress Summary</label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900">
                Completed Lessons: {progressSummary.completedLessons}
              </p>
              <p className="text-gray-900">
                Average Quiz Score: {progressSummary.averageScore}%
              </p>
              <p className="text-gray-900">
                Hint Usage: {formData.hintUsage}
              </p>
              <p className="text-gray-900">
                Achievements: {formData.achievements.length > 0 ? formData.achievements.join(", ") : "None"}
              </p>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Notification Settings</label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.notificationEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, notificationEnabled: e.target.checked })
                }
                disabled={!isEditing}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Enable notifications</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;