const AboutJpg = "/assets/about.jpg"; // served from public/ in Next.js
const PDFfile = "/pdf/RushikeshGanorkarResume.pdf";
const About = () => {
  return (
    <>
      {" "}
      <section className="about section" id="about">
        <h2 className="section__title">About Me</h2>
        <span className="section__subtitle">My introduction</span>
        <div className="about__container container grid">
          <img src={AboutJpg} alt="" className="about__img" />
          <div className="about__data">
            <p className="about__description">
              Frontend Engineer with 3+ years of experience building scalable,
              production-grade healthcare SaaS applications using ReactJS and
              TypeScript. Specialized in complex dynamic forms, SDK
              integrations, and real-time communication systems. Strong
              ownership mindset with focus on performance, maintainability, and
              clean architecture.
            </p>
            <div className="about__info">
              <div>
                <span className="about__info-title">03+</span>
                <span className="about__info-name">
                  Years <br />
                  experience
                </span>
              </div>
              <div>
                <span className="about__info-title">03+</span>
                <span className="about__info-name">
                  Completed <br />
                  projects
                </span>
              </div>
              <div>
                <span className="about__info-title">03</span>
                <span className="about__info-name">
                  Companies <br />
                  worked
                </span>
              </div>
            </div>
            <div className="about__buttons">
              <a href={PDFfile} className="button button--fkex">
                Download CV <i className="uil uil-download-alt" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
