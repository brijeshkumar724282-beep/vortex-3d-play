# Vortex Play — Playful 3D Parallax Playground

Solid cream playground with a swirling Three.js particle vortex, floating CSS shapes with mouse parallax, GSAP scroll parallax, marquee, magnetic buttons, tilt gallery, services, process, counters, testimonial slider, validated contact form.

Palette: cream `#FFF6E9`, ink `#131313`, coral `#FF5C39`, teal `#0E9F8A`. Flat solid colors only. Fredoka headings + Inter body.

## Run

```bash
python3 -m http.server 8000
```

Open http://localhost:8000

## Features

1. Sticky pill nav + hamburger under 820px + Lenis smooth anchors + scroll progress bar
2. Hero particle vortex canvas (mouse reactive, capped pixel ratio, static frame on reduced motion or mobile) + layered shapes + GSAP intro + dual CTA
3. Scroll parallax gallery with 6 solid cards at varied speeds + hover tilt
4. Services + 4 process steps with scrub reveals + animated counters + auto rotating testimonial slider
5. Validated contact form + footer with back to top

## Notes

* Static only: `index.html` + `styles.css` + `script.js`
* CDN with guards: Three.js, GSAP + ScrollTrigger, Lenis. Page works if any CDN fails (2D fallback art, native scroll, IntersectionObserver reveals)
* Responsive at 360 / 768 / 1200, no horizontal scroll, canvas resizes
* Reduced motion respected throughout
