"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  // 📘 active nav item now follows the current route (the board, portfolio and
  // suggest are separate pages), not scroll position within one page.
  const pathname = usePathname();
  // localStorage only exists in the browser — guard so the server render doesn't crash (Next.js SSR)
  const [isDarkTheme, setDarkTheme] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("selected-theme") === "dark"
  );
  const [isIconTheme, setIconTheme] = useState(
    typeof window !== "undefined" &&
      localStorage.getItem("selected-icon") === "uil-moon"
  );

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const darkTheme = "dark-theme";
    const iconTheme = "uil-sun";
    const themeButton = document.getElementById("theme-button");

    const getCurrentTheme = () =>
      document.body.classList.contains(darkTheme) ? "dark" : "light";
    const getCurrentIcon = () =>
      themeButton.classList.contains(iconTheme) ? "uil-moon" : "uil-sun";

    // We validate if the user previously chose a topic
    if (isDarkTheme) {
      document.body.classList.add(darkTheme);
    } else {
      document.body.classList.remove(darkTheme);
    }

    if (isIconTheme) {
      themeButton.classList.add(iconTheme);
    } else {
      themeButton.classList.remove(iconTheme);
    }

    localStorage.setItem("selected-theme", getCurrentTheme());
    localStorage.setItem("selected-icon", getCurrentIcon());
  }, [isDarkTheme, isIconTheme]);

  const handleThemeToggle = () => {
    setDarkTheme((prevIsDarkTheme) => !prevIsDarkTheme);
    setIconTheme((prevIsIconTheme) => !prevIsIconTheme);
  };

  // active link start
  // Add state to track the active link
  const [activeLink, setActiveLink] = useState("");

  // Function to set the active link
  const setActiveLinkFromURL = () => {
    const currentURL = window.location.hash;
    setActiveLink(currentURL);
  };

  // Add a useEffect hook to set the active link when the component mounts or the URL changes
  useEffect(() => {
    setActiveLinkFromURL();
    window.addEventListener("hashchange", setActiveLinkFromURL);
    return () => {
      window.removeEventListener("hashchange", setActiveLinkFromURL);
    };
  }, []);

  // Function to set the active link based on the current scroll position
  const setActiveLinkFromScroll = () => {
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (
        window.scrollY >= sectionTop - sectionHeight * 0.25 &&
        window.scrollY < sectionTop + sectionHeight * 0.75
      ) {
        setActiveLink(`#${section.getAttribute("id")}`);
      }
    });
  };

  // Add a useEffect hook to set the active link when the component mounts
  useEffect(() => {
    setActiveLinkFromScroll();
    window.addEventListener("scroll", setActiveLinkFromScroll);
    return () => {
      window.removeEventListener("scroll", setActiveLinkFromScroll);
    };
  }, []);
  // active link end

  return (
    <>
      <header className="header" id="header">
        <nav className="nav container">
          <a href="/" className="nav__logo">
            Rushikesh Ganorkar
          </a>
          <div
            className={`nav__menu ${showMenu ? "show-menu" : ""}`}
            id="nav-menu"
          >
            <ul className="nav__list grid">
              {/* Home = the product board (landing page) */}
              <li className="nav__item">
                <Link
                  href="/"
                  className={`nav__link ${
                    pathname === "/" ? "active-link" : ""
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="uil uil-estate nav__icon" /> Home
                </Link>
              </li>
              {/* All personal info lives on one page now */}
              <li className="nav__item">
                <Link
                  href="/portfolio"
                  className={`nav__link ${
                    pathname === "/portfolio" ? "active-link" : ""
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="uil uil-user nav__icon" /> Portfolio
                </Link>
              </li>
              <li className="nav__item">
                <Link
                  href="/suggest"
                  className={`nav__link ${
                    pathname === "/suggest" ? "active-link" : ""
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="uil uil-lightbulb-alt nav__icon" /> Suggest
                </Link>
              </li>
            </ul>
            <i
              className="uil uil-times nav__close"
              id="nav-close"
              onClick={() => {
                setShowMenu(!showMenu);
              }}
            />
          </div>
          <div className="nav__btns">
            {/* Theme change button */}
            <i
              className="uil uil-moon change-theme"
              id="theme-button"
              onClick={handleThemeToggle}
            />
            <div className="nav__toggle" id="nav-toggle">
              <i
                className="uil uil-apps"
                onClick={() => {
                  setShowMenu(!showMenu);
                }}
              />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
