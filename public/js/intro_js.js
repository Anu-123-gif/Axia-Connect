const body = document.querySelector("body");
const modal = document.querySelector(".modal");
const modalButton = document.querySelector(".modal-button");
const closeButton1 = document.querySelector(".close-button-1");
const closeButton2 = document.querySelector(".close-button-2");
let isOpened = false;

const openModal = () => {
  modal.classList.add("is-open");
  body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.remove("is-open");
  body.style.overflow = "hidden";
};

modalButton.addEventListener("click", openModal);
closeButton1.addEventListener("click", closeModal);
closeButton2.addEventListener("click", closeModal);

document.onkeydown = (evt) => {
  evt = evt || window.event;
  evt.keyCode === 27 ? closeModal() : false;
};

/*SIGN UP*/

const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

signUpButton.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});

signInButton.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});
