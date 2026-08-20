"use client";

import { useEffect, useState } from "react";

const ScrollUpButton = () => {
  const [showScroll, setShowScroll] = useState(false);

  const handleScroll = () => {
    if (window.scrollY >= 560) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = (e) => {
    e.preventDefault();
    const scrollOptions = {
      top: 0,
      behavior: "smooth",
    };
    window.scrollTo(scrollOptions);
  };

  return (
    <div>
      {showScroll && (
        <a
          href=""
          className="scrollup "
          id="scroll-up"
          onClick={(e) => scrollToTop(e)}
        >
          <i className="uil uil-arrow-up scrollup__icon"></i>
        </a>
      )}
    </div>
  );
};

export default ScrollUpButton;
