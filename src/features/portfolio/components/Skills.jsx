"use client";

import { useState } from "react";
import "./Skills.scss";

const Skills = () => {
  const [activeSection, setActiveSection] = useState(0);

  const toggleSection = (sectionIndex) => {
    setActiveSection((prevSection) =>
      prevSection === sectionIndex ? -1 : sectionIndex,
    );
  };

  return (
    <>
      <section className="skills section" id="skills">
        <h2 className="section__title">Skills</h2>
        <span className="section__subtitle">My technical level</span>
        <div className="skills_container container grid">
          <div>
            {/* Skills 1 */}
            <div
              className={`skills__content ${
                activeSection === 0 ? "skills__open" : "skills__close"
              }`}
            >
              <div className="skills__header" onClick={() => toggleSection(0)}>
                <i className="uil uil-brackets-curly skills__icon" />
                <div>
                  <h1 className="skills__title">Frontend developer</h1>
                  <span className="skills__subtitle">
                    Frontend Developer with 3+ Years of Experience
                  </span>
                </div>
                <i
                  className={
                    activeSection === 0
                      ? "uil uil-angle-down skills__arrow"
                      : "uil uil-angle-down skills__arrow"
                  }
                />
              </div>
              <div className="skills__list grid">
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">ReactJS & TypeScript</h3>
                    <span className="skills__number">90%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__react" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Material UI & React Query</h3>
                    <span className="skills__number">85%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__js" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">React Hook Form & Redux</h3>
                    <span className="skills__number">85%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__html" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">HTML5, CSS3 & SASS</h3>
                    <span className="skills__number">90%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__css" />
                  </div>
                </div>
              </div>
            </div>
            {/* Skills 2 */}
            {/* <div
              className={`skills__content ${
                activeSection === 1 ? "skills__open" : "skills__close"
              }`}
            >
              <div className="skills__header" onClick={() => toggleSection(1)}>
                <i className="uil uil-server-network skills__icon" />
                <div>
                  <h1 className="skills__title">Backend developer</h1>
                  <span className="skills__subtitle">More than 1 years</span>
                </div>
                <i
                  className={`uil ${
                    activeSection === 1 ? "uil-angle-down" : "uil-angle-down"
                  } skills__arrow`}
                />
              </div>
              <div className="skills__list grid">
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">SQL</h3>
                    <span className="skills__number">80%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__sql" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Node Js</h3>
                    <span className="skills__number">70%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__node" />
                  </div>
                </div>
                 <div class="skills__data">
                  <div class="skills__titles">
                    <h3 class="skills__name">Core Java</h3>
                    <span class="skills__number">90%</span>
                  </div>
                  <div class="skills__bar">
                    <span class="skills__percentage skills__java"></span>
                  </div>
                </div>
                <div class="skills__data">
                  <div class="skills__titles">
                    <h3 class="skills__name">Python</h3>
                    <span class="skills__number">55%</span>
                  </div>
                  <div class="skills__bar">
                    <span class="skills__percentage skills__python"></span>
                  </div>
                </div> 
              </div>
            </div> */}
            {/* Skills 3 */}
            <div
              className={`skills__content ${
                activeSection === 2 ? "skills__open" : "skills__close"
              }`}
            >
              <div className="skills__header" onClick={() => toggleSection(2)}>
                <i className="uil uil-setting skills__icon" />
                <div>
                  <h1 className="skills__title">Tools & Architecture</h1>
                  <span className="skills__subtitle">
                    Testing, DevOps & Performance
                  </span>
                </div>
                <i
                  className={`uil ${
                    activeSection === 2 ? "uil-angle-down" : "uil-angle-down"
                  } skills__arrow`}
                />
              </div>
              <div className="skills__list grid">
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Git & Agile Scrum</h3>
                    <span className="skills__number">90%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__adobe" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Twilio SDK & REST APIs</h3>
                    <span className="skills__number">85%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__photoshop" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Jest & Enzyme</h3>
                    <span className="skills__number">80%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__html" />
                  </div>
                </div>
                <div className="skills__data">
                  <div className="skills__titles">
                    <h3 className="skills__name">Performance Optimization</h3>
                    <span className="skills__number">85%</span>
                  </div>
                  <div className="skills__bar">
                    <span className="skills__percentage skills__js" />
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

export default Skills;
