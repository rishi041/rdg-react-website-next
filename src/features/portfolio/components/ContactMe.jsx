"use client";

import { useState } from "react";
import emailjs from "emailjs-com";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const ContactMe = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    message: "",
  });

  const notifySuccess = () =>
    toast.success("Sent Successfully.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const notifyError = () =>
    toast.error("Unable to send email.", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // const data = formData;
    // console.log("Form-Data:", data);

    if (
      !formData.fullname ||
      !formData.email ||
      !formData.phone ||
      !formData.message
    ) {
      // If any field is empty, show an error toast
      toast.error("Please fill in all the fields.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return; // Stop form submission
    }

    const serviceId = "service_bfajuzs";
    const templateId = "template_92sfzbb";
    const userId = "Y3TlO_znGl7kgIvqg";

    const emailData = {
      to_name: "Rushikesh Ganorkar",
      from_name: formData.fullname,
      from_email: formData.email,
      phone: formData.phone,
      message: formData.message,
    };

    emailjs.send(serviceId, templateId, emailData, userId).then(
      (response) => {
        notifySuccess();
        console.log("Email sent successfully!", response);
      },
      (error) => {
        notifyError();
        console.error("Error sending email:", error);
      },
    );

    setFormData({
      fullname: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <>
      <section className="contact section" id="contact">
        <h2 className="section__title">Contact Me</h2>
        <span className="section__subtitle">Get in touch</span>
        <div className="contact__container container grid">
          <div>
            <div className="contact__information">
              <a href="tel:+918484886125" style={{ color: "inherit" }}>
                <i className="uil uil-phone contact__icon" />
              </a>
              <div>
                <h3 className="contact__title">Phone</h3>
                <span className="contact__subtitle">
                  <a href="tel:+918793671464" style={{ color: "inherit" }}>
                    +91 8793671464
                  </a>
                  ,{" "}
                </span>
                <span className="contact__subtitle">
                  <a href="tel:+918484886125" style={{ color: "inherit" }}>
                    +91 8484886125
                  </a>
                </span>
              </div>
            </div>
            <div className="contact__information">
              <a
                href="mailto:rdganorkars3@gmail.com"
                style={{ color: "inherit", display: "flex" }}
              >
                <i className="uil uil-envelope contact__icon" />
                <div>
                  <h3 className="contact__title">Email</h3>
                  <span className="contact__subtitle">
                    rdganorkars3@gmail.com
                  </span>
                </div>
              </a>
            </div>
            <div className="contact__information">
              <i className="uil uil-map-marker contact__icon" />
              <div>
                <h3 className="contact__title">Location</h3>
                <span className="contact__subtitle">Pune - Maharashtra</span>
              </div>
            </div>
          </div>
          <form className="contact__form grid" onSubmit={handleSubmit}>
            <div className="contact__inputs grid">
              <div className="contact__content">
                <label className="contact__label">
                  Name
                </label>
                <input
                  type="text"
                  className="contact__input"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                />
              </div>
              <div className="contact__content">
                <label className="contact__label">
                  Email
                </label>
                <input
                  type="email"
                  className="contact__input"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="contact__content">
              <label className="contact__label">
                Phone Number
              </label>
              <input
                type="number"
                className="contact__input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="contact__content">
              <label className="contact__label">
                Message
              </label>
              <textarea
                cols={0}
                rows={7}
                className="contact__input"
                name="message"
                value={formData.message}
                onChange={handleChange}
              />
            </div>
            <div>
              <button
                type="submit"
                className="button button--flex"
                style={{ border: "none", cursor: "pointer" }}
              >
                Send Message
                <i className="uil uil-message button__icon" />
              </button>
            </div>
          </form>
        </div>
      </section>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

export default ContactMe;
