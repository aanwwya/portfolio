const loader = document.querySelector("[data-loader]");
const cursorGlow = document.querySelector("[data-cursor-glow]");
const particleCanvas = document.querySelector("[data-particles]");
const navButtons = document.querySelectorAll("[data-target]");
const revealItems = document.querySelectorAll(".reveal");
const dockButtons = document.querySelectorAll(".dock-button");
const sections = document.querySelectorAll("section[id]");
const filters = document.querySelectorAll(".filter");
const projectCards = document.querySelectorAll(".project-card");
const counters = document.querySelectorAll("[data-count]");

window.addEventListener("load", () => {
  setTimeout(() => loader.classList.add("hidden"), 650);
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);
    if (target) {
      const panel = target.querySelector(".window-panel");
      target.classList.remove("closed");
      panel?.classList.remove("minimized", "fullscreen");
      syncFullscreenState();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

function syncFullscreenState() {
  document.body.classList.toggle(
    "window-fullscreen",
    Boolean(document.querySelector(".window-panel.fullscreen"))
  );
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-window-action]");
  if (!button) return;

  const action = button.dataset.windowAction;
  const panel = button.closest(".window-panel");
  const section = button.closest(".window-section");

  if (!panel || !section) return;

  if (action === "minimize") {
    panel.classList.toggle("minimized");
    panel.classList.remove("fullscreen");
  }

  if (action === "fullscreen") {
    panel.classList.toggle("fullscreen");
    panel.classList.remove("minimized");
  }

  if (action === "close") {
    panel.classList.remove("minimized", "fullscreen");
    section.classList.add("closed");
    document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  syncFullscreenState();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".window-panel.fullscreen").forEach((panel) => {
    panel.classList.remove("fullscreen");
  });
  syncFullscreenState();
});

document.addEventListener("pointermove", (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.body.classList.toggle("show-dock", entry.target.id !== "home");
      dockButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.target === entry.target.id);
      });
    });
  },
  { threshold: 0.48 }
);

sections.forEach((section) => sectionObserver.observe(section));

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = "true";
      animateCount(entry.target);
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => counterObserver.observe(counter));

function animateCount(element) {
  const target = Number(element.dataset.count);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 36));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = current;
  }, 32);
}

filters.forEach((filter) => {
  filter.addEventListener("click", () => {
    const category = filter.dataset.filter;

    filters.forEach((item) => item.classList.toggle("active", item === filter));
    projectCards.forEach((card) => {
      const isVisible = category === "all" || card.dataset.category.includes(category);
      card.classList.toggle("hidden", !isVisible);
    });
  });
});

const ctx = particleCanvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  particleCanvas.width = window.innerWidth * ratio;
  particleCanvas.height = window.innerHeight * ratio;
  particleCanvas.style.width = `${window.innerWidth}px`;
  particleCanvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildParticles();
}

function buildParticles() {
  const count = Math.min(78, Math.floor(window.innerWidth / 14));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: Math.random() * 1.8 + 0.8,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    color: Math.random() > 0.5 ? "rgba(79,216,255,0.55)" : "rgba(255,209,154,0.55)"
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
    if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();

    for (let i = index + 1; i < particles.length; i += 1) {
      const other = particles[i];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 110) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `rgba(255,244,228,${0.08 - distance / 1600})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(drawParticles);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawParticles();
