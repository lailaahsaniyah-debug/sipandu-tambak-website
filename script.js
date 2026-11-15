
/* ==================================================
   SIPANDU-TAMBAK USM × HUAWEI
   INTERACTIVE PAGE NAVIGATION
   FINAL VERSION
================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ================================================
     01. ELEMENT SELECTORS
  ================================================ */

  const mainContent = document.querySelector(".main-content");

  const slides = Array.from(
    document.querySelectorAll(".main-content > section")
  );

  const navLinks = Array.from(
    document.querySelectorAll(".nav-link")
  );

  const exploreButton = document.querySelector(".hero .btn");

  const slideIds = slides.map(slide => slide.id);


  /* ================================================
     02. PAGE NAVIGATION
  ================================================ */

  function showSlide(slideId, updateHistory = true) {

    const targetSlide = document.getElementById(slideId);

    // Validate target page
    if (
      !targetSlide ||
      !targetSlide.matches(".main-content > section")
    ) {
      return;
    }

    const currentSlide = slides.find(
      slide => slide.classList.contains("active")
    );

    // Avoid unnecessary navigation
    if (currentSlide === targetSlide) {
      updateNavigation(slideId);
      return;
    }

    // Hide all sections
    slides.forEach(slide => {
      slide.classList.remove("active");
      slide.scrollTop = 0;
    });

    // Show selected section
    targetSlide.classList.add("active");

    // Reset page scroll
    targetSlide.scrollTop = 0;

    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    // Update sidebar
    updateNavigation(slideId);

    // Update browser URL
    if (updateHistory) {
      const newHash = `#${slideId}`;

      if (window.location.hash !== newHash) {
        history.pushState(
          { section: slideId },
          "",
          newHash
        );
      }
    }

  }


  /* ================================================
     03. SIDEBAR ACTIVE STATE
  ================================================ */

  function updateNavigation(slideId) {

    navLinks.forEach(link => {

      const isActive =
        link.getAttribute("href") === `#${slideId}`;

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }

    });

  }


  /* ================================================
     04. INITIAL PAGE
  ================================================ */

  function loadInitialPage() {

    const requestedSlide = window.location.hash.substring(1);

    const initialSlide = slideIds.includes(requestedSlide)
      ? requestedSlide
      : "home";

    // Make sure exactly one section is active
    slides.forEach(slide => {
      slide.classList.remove("active");
    });

    const initialElement = document.getElementById(initialSlide);

    if (initialElement) {
      initialElement.classList.add("active");
      initialElement.scrollTop = 0;
    }

    updateNavigation(initialSlide);

    // Normalize URL when no valid section is provided
    if (window.location.hash !== `#${initialSlide}`) {
      history.replaceState(
        { section: initialSlide },
        "",
        `#${initialSlide}`
      );
    }

  }

  loadInitialPage();


  /* ================================================
     05. SIDEBAR CLICK
  ================================================ */

  navLinks.forEach(link => {

    link.addEventListener("click", event => {

      event.preventDefault();

      const href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) {
        return;
      }

      const slideId = href.substring(1);

      showSlide(slideId);

    });

  });


  /* ================================================
     06. EXPLORE PROJECT BUTTON
  ================================================ */

  if (exploreButton) {

    exploreButton.addEventListener("click", event => {

      event.preventDefault();

      showSlide("about");

    });

  }


  /* ================================================
     07. BROWSER BACK & FORWARD
  ================================================ */

  window.addEventListener("popstate", () => {

    const requestedSlide = window.location.hash.substring(1);

    const targetSlide = slideIds.includes(requestedSlide)
      ? requestedSlide
      : "home";

    showSlide(targetSlide, false);

  });


  /* ================================================
     08. KEYBOARD NAVIGATION
  ================================================ */

  document.addEventListener("keydown", event => {

    const target = event.target;

    // Ignore navigation while typing or interacting
    if (
      target instanceof HTMLElement &&
      (
        target.matches(
          "input, textarea, select, button, a, [contenteditable='true']"
        ) ||
        target.isContentEditable
      )
    ) {
      return;
    }

    // Ignore modified keyboard shortcuts
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const activeSlide = slides.find(
      slide => slide.classList.contains("active")
    );

    const currentIndex = slideIds.indexOf(activeSlide?.id);

    if (currentIndex === -1) {
      return;
    }

    // Next section
    if (
      event.key === "ArrowRight" &&
      currentIndex < slideIds.length - 1
    ) {
      event.preventDefault();

      showSlide(slideIds[currentIndex + 1]);
    }

    // Previous section
    else if (
      event.key === "ArrowLeft" &&
      currentIndex > 0
    ) {
      event.preventDefault();

      showSlide(slideIds[currentIndex - 1]);
    }

    // First section
    else if (event.key === "Home") {

      event.preventDefault();

      showSlide("home");

    }

    // Last section
    else if (event.key === "End") {

      event.preventDefault();

      showSlide("documentation");

    }

  });


  /* ================================================
     09. INITIALIZATION
  ================================================ */

  console.log(
    "SIPANDU-TAMBAK | Interactive Navigation Ready"
  );

});
