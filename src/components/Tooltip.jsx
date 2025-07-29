import React, { useState } from "react";

const Tooltip = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 bg-gray-800 text-white text-sm px-2 py-1 rounded-md shadow-lg -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;