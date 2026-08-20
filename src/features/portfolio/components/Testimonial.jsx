const Testimonial = () => {
  return (
    <>
      <section className="testimonial section">
        <h2 className="section__title">Testimonial</h2>
        <span className="section__subtitle">My client saying</span>
        <div className="testimonial__container container swiper mySwiper">
          <div className="swiper-wrapper">
            {/* Testimonial 1 */}
            <div className="testimonial__content swiper-slide">
              <div className="testimonial__data">
                <div className="testimonial__header">
                  <img
                    src="/src/assets/testimonial1.jpg"
                    alt=""
                    className="testimonial__img"
                  />
                  <div>
                    <h3 className="testimonial__name">Sara Smith</h3>
                    <span className="testimonial__client">Client</span>
                  </div>
                </div>
                <div>
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                </div>
              </div>
              <p className="testimonial__description">
                I get a good impression, I carry out my project with all the
                possible quality and attention and support 24 hours a day.
              </p>
            </div>
            {/* Testimonial 2 */}
            <div className="testimonial__content swiper-slide">
              <div className="testimonial__data">
                <div className="testimonial__header">
                  <img
                    src="/src/assets/testimonial2.jpg"
                    alt=""
                    className="testimonial__img"
                  />
                  <div>
                    <h3 className="testimonial__name">Matt robinson</h3>
                    <span className="testimonial__client">Client</span>
                  </div>
                </div>
                <div>
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                </div>
              </div>
              <p className="testimonial__description">
                I get a good impression, I carry out my project with all the
                possible quality and attention and support 24 hours a day.
              </p>
            </div>
            {/* Testimonial 3 */}
            <div className="testimonial__content swiper-slide">
              <div className="testimonial__data">
                <div className="testimonial__header">
                  <img
                    src="/src/assets/testimonial3.jpg"
                    alt=""
                    className="testimonial__img"
                  />
                  <div>
                    <h3 className="testimonial__name">Raul Harris</h3>
                    <span className="testimonial__client">Client</span>
                  </div>
                </div>
                <div>
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                  <i className="uil uil-star testimonial__icon-star" />
                </div>
              </div>
              <p className="testimonial__description">
                I get a good impression, I carry out my project with all the
                possible quality and attention and support 24 hours a day.
              </p>
            </div>
          </div>
          <div className="swiper-pagination swiper-pagination-testimonial" />
        </div>
      </section>
    </>
  );
};

export default Testimonial;
