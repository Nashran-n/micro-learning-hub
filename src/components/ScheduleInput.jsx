import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import Tooltip from "./Tooltip";

const ScheduleInput = ({ onUpdateSchedule, onNotify }) => {
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    day: "Tuesday",
    start: "09:00",
    end: "09:05",
    duration: 5,
  });
  const [error, setError] = useState(null);

  // Generate 5-minute time options
  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  };

  // Calculate end time from start time
  const calculateEndTime = (start) => {
    const [hours, minutes] = start.split(":").map(Number);
    let newMinutes = minutes + 5;
    let newHours = hours;
    if (newMinutes >= 60) {
      newMinutes -= 60;
      newHours = (newHours + 1) % 24;
    }
    return `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "schedules", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSlots(docSnap.data().slots || []);
          onUpdateSchedule(docSnap.data().slots || []);
        } else {
          setSlots([]);
          onUpdateSchedule([]);
        }
      }
    };
    fetchSchedules();
  }, [onUpdateSchedule]);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate time slot
    const startTime = new Date(`2025-01-01T${newSlot.start}:00Z`);
    const endTime = new Date(`2025-01-01T${newSlot.end}:00Z`);
    const duration = (endTime - startTime) / (1000 * 60);
    if (duration !== 5 || newSlot.duration !== 5) {
      setError("Time slot must be exactly 5 minutes.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const updatedSlots = [...slots, newSlot];
      const docRef = doc(db, "schedules", user.uid);
      try {
        await setDoc(
          docRef,
          {
            slots: updatedSlots,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        setSlots(updatedSlots);
        onUpdateSchedule(updatedSlots);
        onNotify("Time slot added successfully!", "success");
        setNewSlot({ day: "Tuesday", start: "09:00", end: "09:05", duration: 5 });
      } catch (err) {
        setError("Failed to save schedule: " + err.message);
      }
    }
  };

  const handleDeleteSlot = async (index) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) return;
    const user = auth.currentUser;
    if (user) {
      const updatedSlots = slots.filter((_, i) => i !== index);
      const docRef = doc(db, "schedules", user.uid);
      try {
        await setDoc(
          docRef,
          {
            slots: updatedSlots,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        setSlots(updatedSlots);
        onUpdateSchedule(updatedSlots);
        onNotify("Time slot deleted successfully!", "error");
      } catch (err) {
        setError("Failed to delete schedule: " + err.message);
      }
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Your Schedule</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleAddSlot} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Day</label>
          <select
            value={newSlot.day}
            onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
              (day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Start Time</label>
          <select
            value={newSlot.start}
            onChange={(e) => {
              const start = e.target.value;
              const end = calculateEndTime(start);
              setNewSlot({ ...newSlot, start, end });
            }}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">End Time</label>
          <input
            type="text"
            value={newSlot.end}
            readOnly
            className="w-full p-2 border rounded-lg bg-gray-100"
          />
        </div>
        <Tooltip text="Add a 5-minute learning slot">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Time Slot
          </button>
        </Tooltip>
      </form>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Schedule</h3>
        {slots.length === 0 ? (
          <p className="text-gray-600">No time slots added yet.</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {slots.map((slot, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <span>
                  {slot.day}: {slot.start} - {slot.end} ({slot.duration} min)
                </span>
                <Tooltip text="Remove this time slot">
                  <button
                    onClick={() => handleDeleteSlot(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ScheduleInput;