
/* ==================================================
   SIPANDU-TAMBAK USM × HUAWEI
   INTERACTIVE PAGE NAVIGATION
   UPDATED VERSION — TEAM READY
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

  // Semua section akan terdeteksi otomatis,
  // termasuk section Team yang ditambahkan nanti.
  const slideIds = slides.map(slide => slide.id);


  /* ================================================
     02. SIDEBAR ACTIVE STATE
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
     03. PAGE NAVIGATION
  ================================================ */

  function showSlide(slideId, updateHistory = true) {

    const targetSlide = document.getElementById(slideId);

    // Pastikan section tujuan memang tersedia
    // di dalam main-content.
    if (
      !targetSlide ||
      !targetSlide.matches(".main-content > section")
    ) {
      return;
    }

    const currentSlide = slides.find(
      slide => slide.classList.contains("active")
    );

    // Hindari perpindahan yang tidak diperlukan.
    if (currentSlide === targetSlide) {
      updateNavigation(slideId);
      return;
    }

    // Sembunyikan semua section.
    slides.forEach(slide => {
      slide.classList.remove("active");
      slide.scrollTop = 0;
    });

    // Tampilkan section tujuan.
    targetSlide.classList.add("active");

    // Reset posisi scroll.
    targetSlide.scrollTop = 0;

    if (mainContent) {
      mainContent.scrollTop = 0;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    // Perbarui menu aktif.
    updateNavigation(slideId);

    // Perbarui URL browser.
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
     04. INITIAL PAGE
  ================================================ */

  function loadInitialPage() {

    const requestedSlide =
      window.location.hash.substring(1);

    const initialSlide = slideIds.includes(requestedSlide)
      ? requestedSlide
      : "home";

    // Pastikan hanya satu section yang aktif.
    slides.forEach(slide => {
      slide.classList.remove("active");
    });

    const initialElement =
      document.getElementById(initialSlide);

    if (initialElement) {
      initialElement.classList.add("active");
      initialElement.scrollTop = 0;
    }

    updateNavigation(initialSlide);

    // Normalisasi URL jika hash tidak valid.
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

      const href = link.getAttribute("href");

      // Link Admin dan link eksternal tetap bekerja normal.
      if (!href || !href.startsWith("#")) {
        return;
      }

      event.preventDefault();

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

    const requestedSlide =
      window.location.hash.substring(1);

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

    // Abaikan ketika pengguna sedang mengetik
    // atau berinteraksi dengan elemen tertentu.
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

    // Abaikan shortcut keyboard kombinasi.
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

    const currentIndex =
      slideIds.indexOf(activeSlide?.id);

    if (currentIndex === -1) {
      return;
    }

    // Section berikutnya.
    if (
      event.key === "ArrowRight" &&
      currentIndex < slideIds.length - 1
    ) {
      event.preventDefault();

      showSlide(slideIds[currentIndex + 1]);
    }

    // Section sebelumnya.
    else if (
      event.key === "ArrowLeft" &&
      currentIndex > 0
    ) {
      event.preventDefault();

      showSlide(slideIds[currentIndex - 1]);
    }

    // Kembali ke Home.
    else if (event.key === "Home") {

      event.preventDefault();

      showSlide(slideIds[0]);

    }

    // Menuju section terakhir,
    // termasuk Team jika sudah ditambahkan.
    else if (event.key === "End") {

      event.preventDefault();

      showSlide(slideIds[slideIds.length - 1]);

    }

  });


  /* ================================================
     09. INITIALIZATION
  ================================================ */

  console.log(
    "SIPANDU-TAMBAK | Interactive Navigation Ready"
  );

  console.log(
    "Available Sections:",
    slideIds
  );

});
