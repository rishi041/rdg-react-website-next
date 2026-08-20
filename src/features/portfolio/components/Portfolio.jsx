"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import "swiper/css";
// served from public/ in Next.js (only used by the commented-out slides below)
const portfolio1 = "/assets/portfolio1.jpg";
const portfolio2 = "/assets/portfolio2.jpg";
const portfolio3 = "/assets/portfolio3.jpg";

const Portfolio = () => {
  return (
    <>
      <section className="portfolio section" id="portfolio">
        <h2 className="section__title">Portfolio</h2>
        <span className="section__subtitle">Most recent work</span>
        <div className="portfolio__container container">
          <Swiper
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[Pagination]}
            className="mySwiper"
          >
            {/* PORTFOLIO 1 */}
            <SwiperSlide>
              <div className="portfolio__content grid">
                {/* <img src={portfolio1} alt="" className="portfolio__img" /> */}
                <img
                  src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
                  alt="spotify"
                  className="portfolio__img"
                />
                <div className="portfolio__data">
                  <h3 className="portfolio__title">Spotify Clone - React</h3>
                  <p className="portfolio__description">
                    Developed a responsive web app inspired by Spotify, featuring reusable UI components, interactive animations, and optimized for seamless performance across devices.
                  </p>
                  <a
                    href="https://spotify-clone-rdg.netlify.app/"
                    target="_blank"
                    className="button button--flex button--small portfolio__button"
                  >
                    Demo
                    <i className="uil uil-arrow-right button__icon" />
                  </a>
                </div>
              </div>
            </SwiperSlide>
            {/* PORTFOLIO 2 */}
            {/* <SwiperSlide>
              <div className="portfolio__content grid">
                <img src={portfolio2} alt="" className="portfolio__img" />
                <div className="portfolio__data">
                  <h3 className="portfolio__title">Brand Design</h3>
                  <p className="portfolio__description">
                    Website adaptable to all devices, with ui components and
                    animated interactions.
                  </p>
                  <a
                    href="#"
                    className="button button--flex button--small portfolio__button"
                  >
                    Demo
                    <i className="uil uil-arrow-right button__icon" />
                  </a>
                </div>
              </div>
            </SwiperSlide> */}
            {/* PORTFOLIO 3 */}
            {/* <SwiperSlide>
              <div className="portfolio__content grid">
                <img src={portfolio3} alt="" className="portfolio__img" />
                <div className="portfolio__data">
                  <h3 className="portfolio__title">Online Store</h3>
                  <p className="portfolio__description">
                    Website adaptable to all devices, with ui components and
                    animated interactions.
                  </p>
                  <a
                    href="#"
                    className="button button--flex button--small portfolio__button"
                  >
                    Demo
                    <i className="uil uil-arrow-right button__icon" />
                  </a>
                </div>
              </div>
            </SwiperSlide> */}
          </Swiper>
        </div>
      </section>
    </>
  );
};

export default Portfolio;
