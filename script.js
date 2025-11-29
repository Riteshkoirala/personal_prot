const root = document.documentElement;
const THEME_KEY = "super-engineer-theme";

// Theme Management
function setTheme(theme) {
  if (!["light", "dark"].includes(theme)) return;
  if (theme === "dark") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", "light");
  }
  window.localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    setTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

function setupThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    setTheme(isLight ? "dark" : "light");
  });
}

// Advanced Cursor System - Fast & Responsive
let cursor = { x: 0, y: 0, targetX: 0, targetY: 0 };
let cursorSpeed = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let lastTime = Date.now();

function initCursor() {
  const cursorEl = document.getElementById("cursorBubble");
  if (!cursorEl) return;

  let rafId;

  function updateCursor() {
    const now = Date.now();
    const deltaTime = Math.max(now - lastTime, 1);
    lastTime = now;

    // Calculate speed (pixels per second)
    const dx = cursor.x - lastMouseX;
    const dy = cursor.y - lastMouseY;
    cursorSpeed = Math.sqrt(dx * dx + dy * dy) / (deltaTime / 1000);
    lastMouseX = cursor.x;
    lastMouseY = cursor.y;

    // Dynamic lerp factor - faster on fast movement, snaps closer
    // Base lerp: 0.4 (much faster than before)
    // On fast movement (>300px/s): increase to 0.6-0.8 for snappier response
    let lerpFactor = 0.4;
    if (cursorSpeed > 300) {
      lerpFactor = Math.min(0.4 + (cursorSpeed - 300) / 500, 0.75);
    }

    // Smooth follow with minimal delay
    cursor.targetX += (cursor.x - cursor.targetX) * lerpFactor;
    cursor.targetY += (cursor.y - cursor.targetY) * lerpFactor;

    // Calculate rotation based on movement direction (jeep facing direction)
    let rotation = 0;
    if (cursorSpeed > 50) {
      const angle = Math.atan2(cursor.y - cursor.targetY, cursor.x - cursor.targetX);
      rotation = (angle * 180) / Math.PI;
    }

    // Slight tilt on fast movement (jeep leaning into turns)
    let tilt = 0;
    if (cursorSpeed > 200) {
      const speedFactor = Math.min((cursorSpeed - 200) / 400, 0.3);
      tilt = rotation * speedFactor * 0.1;
    }

    cursorEl.style.transform = `translate(${cursor.targetX}px, ${cursor.targetY}px) rotate(${rotation + tilt}deg)`;
    cursorEl.style.left = "0";
    cursorEl.style.top = "0";

    rafId = requestAnimationFrame(updateCursor);
  }

  document.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });

  // Hover detection
  const interactiveElements = document.querySelectorAll("a, button, .btn, .project-card, .skill-card, .about-card");
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursorEl.classList.add("hover");
    });
    el.addEventListener("mouseleave", () => {
      cursorEl.classList.remove("hover");
    });
    el.addEventListener("mousedown", () => {
      cursorEl.classList.add("click");
    });
    el.addEventListener("mouseup", () => {
      cursorEl.classList.remove("click");
    });
  });

  // Section-based color changes - new palette
  const sections = document.querySelectorAll(".section, .hero");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id || entry.target.className;
          const colors = {
            hero: ["#F72585", "#4895EF"],
            about: ["#F72585", "#4895EF"],
            skills: ["#4895EF", "#F72585"],
            projects: ["#F72585", "#B5179E"],
            experience: ["#4895EF", "#F72585"],
            contact: ["#F72585", "#4895EF"],
            "group-projects": ["#4895EF", "#F72585"],
            "solo-series": ["#F72585", "#4895EF"],
            online: ["#4895EF", "#F72585"],
            founders: ["#F72585", "#4895EF"],
          };
          const [color1, color2] = colors[sectionId] || colors.hero;
          cursorEl.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
        }
      });
    },
    { threshold: 0.5 }
  );
  sections.forEach((section) => observer.observe(section));

  updateCursor();
}

// Button Interactions - Soft Rubber Feel
function initButtonInteractions() {
  const buttons = document.querySelectorAll(".btn, button");
  buttons.forEach((btn) => {
    // Ripple effect
    btn.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = x + "px";
      ripple.style.top = y + "px";
      ripple.classList.add("ripple");

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      // Confetti on primary buttons
      if (btn.classList.contains("primary")) {
        createConfetti(e.clientX, e.clientY);
      }
    });

    // Text animation on hover
    const originalText = btn.textContent;
    btn.addEventListener("mouseenter", function () {
      if (this.classList.contains("primary")) {
        const texts = ["CLICK", "CLIIICK", "WEEE"];
        let idx = 0;
        const interval = setInterval(() => {
          this.textContent = texts[idx % texts.length];
          idx++;
          if (idx >= texts.length * 2) {
            clearInterval(interval);
            this.textContent = originalText;
          }
        }, 150);
      }
    });
  });
}

// Card Flip Functionality
function initCardFlip() {
  const projectCards = document.querySelectorAll(".project-card");
  const skillCards = document.querySelectorAll(".skill-card");

  // Wrap project card content
  projectCards.forEach((card) => {
    if (!card.querySelector(".project-card-inner")) {
      const inner = document.createElement("div");
      inner.className = "project-card-inner";
      
      const front = document.createElement("div");
      front.className = "project-card-front";
      front.innerHTML = card.innerHTML;
      
      const back = document.createElement("div");
      back.className = "project-card-back";
      const backContent = document.createElement("div");
      backContent.className = "project-card-back-content";
      backContent.innerHTML = `<p>💡 <strong>Click again to flip back!</strong></p><p style="margin-top: 12px; font-size: 14px; opacity: 0.8;">This project demonstrates real-world backend engineering with production-ready code.</p>`;
      back.appendChild(backContent);
      
      inner.appendChild(front);
      inner.appendChild(back);
      card.innerHTML = "";
      card.appendChild(inner);
      
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        card.classList.toggle("flipped");
      });
    }
  });

  // Wrap skill card content
  skillCards.forEach((card) => {
    if (!card.querySelector(".skill-card-inner")) {
      const inner = document.createElement("div");
      inner.className = "skill-card-inner";
      
      const front = document.createElement("div");
      front.className = "skill-card-front";
      front.innerHTML = card.innerHTML;
      
      const back = document.createElement("div");
      back.className = "skill-card-back";
      const backContent = document.createElement("div");
      backContent.className = "skill-card-back-content";
      backContent.innerHTML = `<p>🚀 <strong>Expert Level</strong></p><p style="margin-top: 12px; font-size: 14px; opacity: 0.8;">Proven through real projects and production deployments.</p>`;
      back.appendChild(backContent);
      
      inner.appendChild(front);
      inner.appendChild(back);
      card.innerHTML = "";
      card.appendChild(inner);
      
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        card.classList.toggle("flipped");
      });
    }
  });
}

// Card 3D Tilt Effect
function initCardTilt() {
  const cards = document.querySelectorAll(".project-card, .skill-card, .about-card");
  cards.forEach((card) => {
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetTiltX = (e.clientY - centerY) / 20;
      targetTiltY = (centerX - e.clientX) / 20;
    });

    card.addEventListener("mouseleave", () => {
      targetTiltX = 0;
      targetTiltY = 0;
    });

    // Smooth tilt animation
    function animateTilt() {
      tiltX += (targetTiltX - tiltX) * 0.1;
      tiltY += (targetTiltY - tiltY) * 0.1;
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
      requestAnimationFrame(animateTilt);
    }
    animateTilt();

    // Dynamic shadow
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.boxShadow = `0 ${10 + y / 10}px ${30 + x / 5}px rgba(255, 107, 157, 0.4)`;
    });

    // Wiggle on multiple clicks
    let clickCount = 0;
    let clickTimer;
    card.addEventListener("click", () => {
      clickCount++;
      clearTimeout(clickTimer);
      if (clickCount >= 3) {
        card.style.animation = "wiggle 0.5s ease";
        setTimeout(() => {
          card.style.animation = "";
          clickCount = 0;
        }, 500);
      }
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500);
    });
  });
}

// Scroll Animations
function initScrollAnimations() {
  const sections = document.querySelectorAll(".section");
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 100);
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

// Navbar Scroll Behavior
function initNavbar() {
  const header = document.querySelector(".site-header");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
    lastScroll = currentScroll;
  });

  // Active link highlighting
  const navLinks = document.querySelectorAll(".nav a");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

// Confetti System
function createConfetti(x, y) {
  const colors = ["#F72585", "#4895EF", "#B5179E", "#51CF66", "#FFFFFF"];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = x + "px";
    confetti.style.top = y + "px";
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 1000);
  }
}

// Floating Emojis - Programming Icons Only
function createFloatingEmojis() {
  const emojis = [
    "🚀", "💻", "✨", "🎨", "🔥", "⚡", "🎯", "💡",
    "⚙️", "🔧", "📊", "🗄️", "💾", "🔌", "🌐", "📱",
    "🐍", "☕", "📦", "🔐", "🚦", "📡", "🎮", "🖥️",
    "💿", "📀", "🔄", "⚡", "🌊", "🎪", "🎭", "🎬"
  ];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const emoji = document.createElement("div");
    emoji.className = "floating-emoji";
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = Math.random() * 100 + "%";
    emoji.style.top = Math.random() * 100 + "%";
    emoji.style.animationDelay = Math.random() * 15 + "s";
    emoji.style.animationDuration = 10 + Math.random() * 10 + "s";
    document.body.appendChild(emoji);
  }
}

// Easter Eggs / Popups
function initEasterEggs() {
  let clickCount = 0;
  document.addEventListener("click", () => {
    clickCount++;
    if (clickCount === 5) {
      showPopup("Woah there! Curious much? 😏");
      clickCount = 0;
    }
  });
}

function showPopup(message) {
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.95);
    color: #1a1a2e;
    padding: 20px 30px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    border: 3px solid #F72585;
  `;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.animation = "popOut 0.3s ease forwards";
    setTimeout(() => popup.remove(), 300);
  }, 2000);
}

// Special Section Behaviors
function initSectionBehaviors() {
  // Skills - bounce on hover
  const skillCards = document.querySelectorAll(".skill-card");
  skillCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const items = card.querySelectorAll("li");
      items.forEach((item, index) => {
        setTimeout(() => {
          item.style.animation = "bounce 0.5s ease";
          setTimeout(() => {
            item.style.animation = "";
          }, 500);
        }, index * 50);
      });
    });
  });

  // Contact section - shake button
  const contactSection = document.querySelector("#contact");
  if (contactSection) {
    const contactButton = contactSection.querySelector(".btn.primary");
    if (contactButton) {
      setInterval(() => {
        contactButton.style.animation = "shake 0.5s ease";
        setTimeout(() => {
          contactButton.style.animation = "";
        }, 500);
      }, 5000);
    }
  }
}

// Cycle Specialties
function cycleSpecialties() {
  const el = document.getElementById("specialties");
  if (!el) return;

  const items = [
    "PHP · Laravel · JavaScript · MySQL · AWS",
    "Python · FastAPI · Distributed systems · Microservices",
    "Cloud deployments · CI/CD · Observability · Problem‑solving",
  ];

  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % items.length;
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    setTimeout(() => {
      el.textContent = items[idx];
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 200);
  }, 4000);
}

// Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

// Add CSS animations dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes popIn {
    from {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  @keyframes popOut {
    from {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: rippleAnimation 0.6s ease-out;
    pointer-events: none;
  }
  @keyframes rippleAnimation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize Everything
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupThemeToggle();
  cycleSpecialties();
  initCursor();
  initCardFlip(); // Must run before tilt
  setTimeout(() => {
    initCardTilt(); // Run after cards are wrapped
  }, 100);
  initButtonInteractions();
  initScrollAnimations();
  initNavbar();
  createFloatingEmojis();
  initEasterEggs();
  initSectionBehaviors();
  initSmoothScroll();
  initWelcomePopup();

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
});

// Welcome Popup - Show on Every Page Load
function initWelcomePopup() {
  const popup = document.getElementById("welcomePopup");
  const closeBtn = document.getElementById("welcomeClose");
  const welcomeBtn = document.getElementById("welcomeBtn");
  const overlay = popup?.querySelector(".welcome-popup-overlay");
  
  if (!popup) return;

  // Show popup on every page load/reload after a short delay
  setTimeout(() => {
    popup.classList.add("show");
  }, 800);

  // Close button handler
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.classList.remove("show");
    });
  }

  // Overlay click to close
  if (overlay) {
    overlay.addEventListener("click", () => {
      popup.classList.remove("show");
    });
  }

  // Welcome button - scroll to contact
  if (welcomeBtn) {
    welcomeBtn.addEventListener("click", () => {
      popup.classList.remove("show");
      setTimeout(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          contactSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.classList.contains("show")) {
      popup.classList.remove("show");
    }
  });
}
