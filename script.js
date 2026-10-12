(() => {
  "use strict";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen = () => window.innerWidth < 768;
  const hasGsap = typeof window.gsap !== "undefined";
  const hasST = typeof window.ScrollTrigger !== "undefined";
  if (hasGsap && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  try {
    if (typeof window.Lenis !== "undefined" && !prefersReduced) {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } catch (e) { lenis = null; }

  /* ---------- Progress bar + nav ---------- */
  const bar = document.getElementById("progressBar");
  const updateProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
  if (lenis) lenis.on("scroll", updateProgress);

  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  if (burger && navLinks) {
    burger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }));
  }

  const goTo = (target) => {
    const el = document.querySelector(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -90 });
    else el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
  };
  document.querySelectorAll("[data-scroll]").forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href && href.startsWith("#")) { e.preventDefault(); goTo(href === "#top" ? "main" : href); }
    });
  });
  const toTop = document.getElementById("toTop");
  if (toTop) toTop.addEventListener("click", () => {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });

  /* ---------- Three.js particle vortex ---------- */
  const canvas = document.getElementById("vortexCanvas");
  let mouseX = 0, mouseY = 0, targetRX = 0, targetRY = 0;
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    targetRY = mouseX * 0.45;
    targetRX = mouseY * 0.35;
  }, { passive: true });

  function paintFallback() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.fillStyle = "#FDEED3"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const cols = ["#FF5C39", "#0E9F8A", "#131313"];
    for (let i = 0; i < 220; i++) {
      const a = (i / 220) * Math.PI * 4;
      const rad = 12 + i * 1.6 * dpr;
      ctx.fillStyle = cols[i % 3];
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62, (3 + (i % 5)) * dpr * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function initVortex() {
    if (!canvas) return;
    const staticMode = prefersReduced || isSmallScreen();
    if (typeof window.THREE === "undefined") { paintFallback(); return; }
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      cam.position.z = 9;

      const COUNT = isSmallScreen() ? 420 : 950;
      const pos = new Float32Array(COUNT * 3);
      const col = new Float32Array(COUNT * 3);
      const palette = [new THREE.Color("#FF5C39"), new THREE.Color("#0E9F8A"), new THREE.Color("#131313")];
      for (let i = 0; i < COUNT; i++) {
        const t = i / COUNT;
        const angle = t * Math.PI * 10;
        const radius = 0.4 + t * 4.4;
        pos[i * 3] = Math.cos(angle) * radius;
        pos[i * 3 + 1] = Math.sin(angle) * radius * 0.62;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
        const c = palette[i % 3];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      const coreGeo = new THREE.IcosahedronGeometry(0.9, 1);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xFF5C39, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      scene.add(core);

      const resize = () => {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight;
        renderer.setSize(w, h, false);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      let rx = 0, ry = 0;
      const renderOne = (time) => {
        points.rotation.z = time * 0.00012;
        core.rotation.x += 0.004; core.rotation.y += 0.006;
        rx += (targetRX - rx) * 0.06;
        ry += (targetRY - ry) * 0.06;
        scene.rotation.x = rx; scene.rotation.y = ry;
        renderer.render(scene, cam);
      };
      if (staticMode) {
        renderOne(1400);
        return;
      }
      const loop = (time) => { renderOne(time || 0); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    } catch (e) { paintFallback(); }
  }
  initVortex();
  window.addEventListener("resize", () => { if (typeof window.THREE === "undefined") paintFallback(); });

  /* ---------- Hero mouse parallax on CSS shapes ---------- */
  const hero = document.getElementById("hero");
  const shapes = Array.from(document.querySelectorAll(".shape[data-depth]"));
  if (hero && shapes.length && !prefersReduced) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      shapes.forEach(s => {
        const d = parseFloat(s.getAttribute("data-depth")) || 0.08;
        s.style.transform = "translate(" + (nx * d * 320) + "px," + (ny * d * 320) + "px)";
      });
    });
    hero.addEventListener("pointerleave", () => shapes.forEach(s => { s.style.transform = ""; }));
  }

  /* ---------- GSAP intro + scroll parallax ---------- */
  if (hasGsap && hasST && !prefersReduced) {
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".heroEyebrow", { y: 24, opacity: 0, duration: 0.6 })
      .from(".heroTitle", { y: 46, opacity: 0, duration: 0.8 }, "-=0.3")
      .from(".heroCopy", { y: 30, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".heroCtas .btn", { y: 22, opacity: 0, duration: 0.55, stagger: 0.12 }, "-=0.4")
      .from(".heroMeta div", { y: 18, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.3")
      .from(".shape", { scale: 0, opacity: 0, duration: 0.7, stagger: 0.08, ease: "back.out(1.6)" }, "-=0.9");

    gsap.utils.toArray("[data-speed]").forEach(el => {
      const s = parseFloat(el.getAttribute("data-speed")) || 0.5;
      gsap.to(el, {
        y: () => (s - 0.6) * 160,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.1 }
      });
    });

    gsap.utils.toArray(".reveal").forEach(el => {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
    gsap.utils.toArray(".revealTilt").forEach((el, i) => {
      gsap.from(el, {
        y: 60, opacity: 0, rotate: i % 2 ? 2 : -2, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" }
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  const magnets = document.querySelectorAll(".magnetic");
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (finePointer && !prefersReduced) {
    magnets.forEach(btn => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.18 + "px," + y * 0.22 + "px)";
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Tilt on gallery cards ---------- */
  document.querySelectorAll("[data-tilt]").forEach(card => {
    if (!finePointer || prefersReduced) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(700px) rotateY(" + px * 10 + "deg) rotateX(" + (py * -10) + "deg) translateY(-4px)";
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const end = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (prefersReduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { runCounter(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => io.observe(c));

  /* ---------- Testimonial slider ---------- */
  const slides = Array.from(document.querySelectorAll("#slides .slide"));
  const dotsWrap = document.getElementById("dots");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  let idx = 0, timer = null;
  const dots = slides.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", "Show story " + (i + 1));
    if (i === 0) d.classList.add("on");
    d.addEventListener("click", () => { show(i); restart(); });
    if (dotsWrap) dotsWrap.appendChild(d);
    return d;
  });
  function show(n) {
    idx = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("isActive", i === idx));
    dots.forEach((d, i) => d.classList.toggle("on", i === idx));
  }
  function restart() {
    if (timer) clearInterval(timer);
    if (prefersReduced || slides.length < 2) return;
    timer = setInterval(() => show(idx + 1), 5000);
  }
  if (prevBtn) prevBtn.addEventListener("click", () => { show(idx - 1); restart(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { show(idx + 1); restart(); });
  const slider = document.getElementById("slider");
  if (slider) {
    slider.addEventListener("pointerenter", () => { if (timer) clearInterval(timer); });
    slider.addEventListener("pointerleave", restart);
  }
  restart();

  /* ---------- Contact validation ---------- */
  const form = document.getElementById("contactForm");
  const ok = document.getElementById("formOk");
  const setErr = (id, msg) => {
    const s = document.querySelector('[data-err="' + id + '"]');
    if (s) s.textContent = msg || "";
  };
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("fName").value.trim();
      const email = document.getElementById("fEmail").value.trim();
      const msg = document.getElementById("fMsg").value.trim();
      let valid = true;
      if (name.length < 2) { setErr("fName", "Please add your name."); valid = false; } else setErr("fName", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("fEmail", "Please add a valid email."); valid = false; } else setErr("fEmail", "");
      if (msg.length < 10) { setErr("fMsg", "Please add a message with at least 10 characters."); valid = false; } else setErr("fMsg", "");
      if (!valid) return;
      if (ok) ok.classList.add("show");
      form.reset();
      setTimeout(() => { if (ok) ok.classList.remove("show"); }, 6000);
    });
  }
})();
