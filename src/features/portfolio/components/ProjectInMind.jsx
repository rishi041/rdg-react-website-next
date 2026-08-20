const ProjectPng = "/assets/project.png"; // served from public/ in Next.js
const ProjectInMind = () => {
  return (
    <>
      <section className="project section">
        <div className="project__bg">
          <div className="project__container container grid">
            <div className="project__data">
              <h2 className="project__title">You have a new project</h2>
              <p className="project__description">Contact me now.</p>
              <a href="#contact" className="button button--flex button--white">
                Contact Me
                <i className="uil uil-message project__icon button__icon" />
              </a>
            </div>
            <img src={ProjectPng} alt="" className="project__img" />
          </div>
        </div>
      </section>
    </>
  );
};

export default ProjectInMind;
