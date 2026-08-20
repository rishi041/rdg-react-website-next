"use client";

import { useState } from "react";

const Qualification = () => {
  const [Qualification, setQualification] = useState("#education");
  const handleTabClick = (data) => {
    setQualification(data);
  };

  return (
    <>
      <section className="qualification section">
        <h2 className="section__title">Qualification</h2>
        <span className="section__subtitle">My personal journey</span>
        <div className="qualification__container container">
          <div className="qualification__tabs">
            <div
              className={`qualification__button button--flex ${
                Qualification === "#education" ? "qualification__active" : " "
              }`}
              // data-target="#education"
              onClick={() => handleTabClick("#education")}
            >
              <i className="uil uil-graduation-cap qualification__icon" />
              Education
            </div>
            <div
              className={`qualification__button button--flex ${
                Qualification === "#work" ? "qualification__active" : " "
              }`}
              // data-target="#work"
              onClick={() => handleTabClick("#work")}
            >
              <i className="uil uil-briefcase-alt qualification__icon" />
              Work
            </div>
          </div>
          <div className="qualification__sections">
            {/* Qualification content 1 */}
            <div
              className={`qualification__content ${
                Qualification === "#education" ? "qualification__active" : " "
              }`}
              data-content
              id="education"
            >
              {/* Qualification 1 */}
              <div className="qualification__data">
                <div>
                  <h3 className="qualification__title">
                    10<sup>th</sup> Maharashtra Boards
                  </h3>
                  <span className="qualification__subtitle">
                    Manibai Gujrati High School And Junior College
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> 2014 - 2015
                  </div>
                </div>
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
              </div>
              {/* Qualification 2 */}
              <div className="qualification__data">
                <div />
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
                <div>
                  <h3 className="qualification__title">
                    12<sup>th</sup> Maharashtra Boards
                  </h3>
                  <span className="qualification__subtitle">
                    Manibai Gujrati High School And Junior College
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> 2015 - 2017
                  </div>
                </div>
              </div>
              {/* Qualification 3 */}
              <div className="qualification__data">
                <div>
                  <h3 className="qualification__title">
                    Bachelor of Computer Applications
                  </h3>
                  <span className="qualification__subtitle">
                    Brijlal Biyani Science College
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> 2017 - 2020
                  </div>
                </div>
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
              </div>
              {/* Qualification 4 */}
              <div className="qualification__data">
                <div />
                <div>
                  <span className="qualification__rounder" />
                  {/* <span class="qualification__line"></span> */}
                </div>
                <div>
                  <h3 className="qualification__title">
                    Master of Computer Applications
                  </h3>
                  <span className="qualification__subtitle">
                    Shri Ramdeobaba College of Engineering and Management
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> 2020 - 2022
                  </div>
                </div>
              </div>
            </div>
            {/* Qualification content 2 */}
            <div
              className={`qualification__content ${
                Qualification === "#work" ? "qualification__active" : " "
              }`}
              data-content
              id="work"
            >
              {/* Qualification 1 */}
              <div className="qualification__data">
                <div>
                  <h3 className="qualification__title">Web Developer</h3>
                  <span className="qualification__subtitle">Pune</span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> May 2022 - Aug 2022
                  </div>
                </div>
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
              </div>
              {/* Qualification 2 */}
              <div className="qualification__data">
                <div />
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
                <div>
                  <h3 className="qualification__title">Frontend Developer</h3>
                  <span className="qualification__subtitle">
                    Trinesis Tech Pvt Ltd, Pune
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt" /> Dec 2022 - March 2024
                  </div>
                </div>
              </div>
              {/* Qualification 3 */}
              <div className="qualification__data">
                <div>
                  <h3 className="qualification__title">Frontend Developer</h3>
                  <span className="qualification__subtitle">
                    HeapTrace Tech Pvt Ltd, Pune
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt"></i> Mar 2024 - Oct 2024
                  </div>
                </div>
                <div>
                  <span className="qualification__rounder" />
                  <span className="qualification__line" />
                </div>
              </div>
              {/* Qualification 4 */}
              <div className="qualification__data">
                <div />
                <div>
                  <span className="qualification__rounder" />
                  {/* <span className="qualification__line" /> */}
                </div>
                <div>
                  <h3 className="qualification__title">Frontend Engineer</h3>
                  <span className="qualification__subtitle">
                    Thinkitive Technologies Pvt Ltd, Pune
                  </span>
                  <div className="qualification__calendar">
                    <i className="uil uil-calendar-alt"></i> Nov 2024 - Present
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Qualification;
