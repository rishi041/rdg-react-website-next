const Footer = () => {
  return (
    <>
      <footer className="footer">
        <div className="footer__bg">
          <div className="footer__container container grid">
            <div>
              <h1 className="footer__title">Rushikesh Ganorkar</h1>
              <span className="footer__subtitle">Frontend Engineer</span>
            </div>
            <ul className="footer__links">
              {/*<li>
              <a href="#services" class="footer__link">Services</a>
            </li>
            <li>
              <a href="#portfolio" class="footer__link">Portfolio</a>
            </li>
            <li>
              <a href="#contact" class="footer__link">Contact Me</a>
            </li>*/}
            </ul>
            <div className="footer__socials">
              <a
                href="https://www.linkedin.com/in/rushikesh-ganorkar-rd/"
                target="_blank"
                className="footer__social"
                rel="noreferrer"
              >
                <i className="uil uil-linkedin-alt" />
              </a>
              <a
                href="https://github.com/rishi041"
                target="_blank"
                className="footer__social"
                rel="noreferrer"
              >
                <i className="uil uil-github-alt" />
              </a>
              <a
                href="https://x.com/rdganorkars3"
                target="_blank"
                className="footer__social"
                rel="noreferrer"
              >
                {/* <i className="uil uil-twitter-alt" /> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 14 14"
                >
                  <g fill="none">
                    <g clipPath="url(#primeTwitter0)">
                      <path
                        fill="currentColor"
                        d="M11.025.656h2.147L8.482 6.03L14 13.344H9.68L6.294 8.909l-3.87 4.435H.275l5.016-5.75L0 .657h4.43L7.486 4.71zm-.755 11.4h1.19L3.78 1.877H2.504z"
                      />
                    </g>
                    <defs>
                      <clipPath id="primeTwitter0">
                        <path fill="#fff" d="M0 0h14v14H0z" />
                      </clipPath>
                    </defs>
                  </g>
                </svg>
              </a>
            </div>
          </div>
          <p className="footer__copy">
            © {new Date()?.getFullYear()} Rushikesh Ganorkar. All Rights
            Reserved
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
