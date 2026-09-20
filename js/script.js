// script.js — plain JavaScript, no build step, no framework.
// Re-implements every interactive behaviour from the original React app:
// scroll-reveal, mobile menu, theme toggle, a simple search/jump palette,
// the scroll progress bar, and the navbar's "scrolled" background state.

(function () {
  "use strict";

  /* ---------- 1. Scroll reveal (fade + slide up on scroll into view) ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal:not(.reveal-visible)");
    if (!items.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    items.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add("reveal-visible");
      } else {
        observer.observe(el);
      }
    });
  }

  /* ---------- 2. Navbar background on scroll ---------- */
  function initNavbarScrollState() {
    var header = document.getElementById("site-header");
    if (!header) return;

    var scrolledClasses = [
      "border-border/60",
      "bg-background/75",
      "shadow-subtle",
      "backdrop-blur-lg",
      "supports-[backdrop-filter]:bg-background/55",
      "dark:border-border",
      "dark:bg-background/80",
      "dark:backdrop-blur-md",
      "dark:supports-[backdrop-filter]:bg-background/60",
    ];
    var idleClasses = ["border-transparent", "bg-transparent"];

    var ticking = false;
    function update() {
      var scrolled = window.scrollY > 8;
      if (scrolled) {
        header.classList.remove.apply(header.classList, idleClasses);
        header.classList.add.apply(header.classList, scrolledClasses);
      } else {
        header.classList.remove.apply(header.classList, scrolledClasses);
        header.classList.add.apply(header.classList, idleClasses);
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 3. Scroll progress bar ---------- */
  function initScrollProgressBar() {
    var bar = document.getElementById("scroll-progress-bar");
    if (!bar) return;

    var ticking = false;
    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = "scaleX(" + progress + ")";
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  /* ---------- 4. Mobile menu ---------- */
  function initMobileMenu() {
    var trigger = document.getElementById("mobile-menu-trigger");
    var overlay = document.getElementById("mobile-menu-overlay");
    var panel = document.getElementById("mobile-menu-panel");
    var closeBtn = document.getElementById("mobile-menu-close");
    var searchTrigger = document.getElementById("mobile-search-trigger");
    if (!trigger || !overlay || !panel) return;

    function open() {
      overlay.hidden = false;
      panel.hidden = false;
      requestAnimationFrame(function () {
        overlay.dataset.state = "open";
        panel.dataset.state = "open";
      });
      trigger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function close() {
      overlay.dataset.state = "closed";
      panel.dataset.state = "closed";
      trigger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        overlay.hidden = true;
        panel.hidden = true;
      }, 220);
    }

    trigger.addEventListener("click", open);
    overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    if (searchTrigger) {
      searchTrigger.addEventListener("click", function () {
        close();
        window.setTimeout(openCommandPalette, 220);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.dataset.state === "open") close();
    });
  }

  /* ---------- 5. Theme toggle (Light / Dark / System) ---------- */
  function applyTheme(value) {
    var root = document.documentElement;
    var resolved = value;
    if (value === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (resolved === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem("theme", value);
    } catch (e) {}
    updateThemeDots(value);
  }

  function updateThemeDots(value) {
    document.querySelectorAll("#theme-menu [data-theme-value]").forEach(function (item) {
      var dot = item.querySelector(".theme-dot");
      if (!dot) return;
      dot.hidden = item.getAttribute("data-theme-value") !== value;
    });
  }

  function initThemeToggle() {
    var trigger = document.getElementById("theme-toggle-trigger");
    var menu = document.getElementById("theme-menu");
    if (!trigger || !menu) return;

    var current = "dark";
    try {
      current = localStorage.getItem("theme") || "dark";
    } catch (e) {}
    updateThemeDots(current);

    function openMenu() {
      menu.hidden = false;
      requestAnimationFrame(function () {
        menu.dataset.state = "open";
      });
      document.addEventListener("click", onOutsideClick, true);
    }
    function closeMenu() {
      menu.dataset.state = "closed";
      window.setTimeout(function () {
        menu.hidden = true;
      }, 180);
      document.removeEventListener("click", onOutsideClick, true);
    }
    function onOutsideClick(e) {
      if (!menu.contains(e.target) && e.target !== trigger) closeMenu();
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menu.dataset.state === "open") {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.querySelectorAll("[data-theme-value]").forEach(function (item) {
      item.addEventListener("click", function () {
        applyTheme(item.getAttribute("data-theme-value"));
        closeMenu();
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.dataset.state === "open") closeMenu();
    });
  }

  /* ---------- 6. Command palette (simple search / jump modal) ---------- */
  function openCommandPalette() {
    var overlay = document.getElementById("command-palette-overlay");
    var modal = document.getElementById("command-palette");
    var input = document.getElementById("command-palette-input");
    if (!overlay || !modal) return;
    overlay.hidden = false;
    modal.hidden = false;
    requestAnimationFrame(function () {
      overlay.dataset.state = "open";
      modal.dataset.state = "open";
    });
    document.body.style.overflow = "hidden";
    if (input) {
      input.value = "";
      filterCommandItems("");
      window.setTimeout(function () {
        input.focus();
      }, 50);
    }
  }

  function closeCommandPalette() {
    var overlay = document.getElementById("command-palette-overlay");
    var modal = document.getElementById("command-palette");
    if (!overlay || !modal) return;
    overlay.dataset.state = "closed";
    modal.dataset.state = "closed";
    document.body.style.overflow = "";
    window.setTimeout(function () {
      overlay.hidden = true;
      modal.hidden = true;
    }, 180);
  }

  function filterCommandItems(query) {
    var q = query.trim().toLowerCase();
    document.querySelectorAll("#command-palette-list li").forEach(function (li) {
      var text = li.textContent.trim().toLowerCase();
      li.style.display = !q || text.indexOf(q) !== -1 ? "" : "none";
    });
  }

  function initCommandPalette() {
    var overlay = document.getElementById("command-palette-overlay");
    var modal = document.getElementById("command-palette");
    var input = document.getElementById("command-palette-input");
    if (!overlay || !modal) return;

    document.querySelectorAll(".command-palette-trigger").forEach(function (btn) {
      btn.addEventListener("click", openCommandPalette);
    });

    overlay.addEventListener("click", closeCommandPalette);
    document.querySelectorAll("#command-palette-list a").forEach(function (a) {
      a.addEventListener("click", closeCommandPalette);
    });
    if (input) {
      input.addEventListener("input", function () {
        filterCommandItems(input.value);
      });
    }

    document.addEventListener("keydown", function (e) {
      var isK = e.key === "k" || e.key === "K";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        if (modal.dataset.state === "open") {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      } else if (e.key === "Escape" && modal.dataset.state === "open") {
        closeCommandPalette();
      }
    });
  }

  /* ---------- 7. GitHub contributions heatmap (client-side fetch) ---------- */
  // The original app fetched this server-side at build time. A static
  // export has no server, so this now fetches directly in the visitor's
  // browser instead — it will show real data as long as their browser can
  // reach github-contributions-api.jogruber.de (it couldn't be baked in at
  // build time in the sandbox this site was generated in).
  function initGithubContributions() {
    var container = document.getElementById("github-contributions-container");
    if (!container) return;

    var LEVEL_COLOR = {
      0: "#161B22",
      1: "#0E4429",
      2: "#006D32",
      3: "#26A641",
      4: "#39D353",
    };
    var CELL_SIZE = 11;
    var CELL_GAP = 3;
    var CELL_STRIDE = CELL_SIZE + CELL_GAP;

    fetch("https://github-contributions-api.jogruber.de/v4/Rukhmai-Parshad?y=last")
      .then(function (res) {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then(function (raw) {
        if (!raw || !raw.contributions || !raw.contributions.length) {
          throw new Error("no contributions");
        }
        var days = raw.contributions.map(function (d) {
          return {
            date: d.date,
            count: d.count,
            level: Math.min(4, Math.max(0, d.level)),
          };
        });
        var total =
          (raw.total && raw.total.lastYear) ||
          days.reduce(function (sum, d) {
            return sum + d.count;
          }, 0);

        var weeks = [];
        var currentWeek = [];
        days.forEach(function (day) {
          var weekday = new Date(day.date + "T00:00:00Z").getUTCDay();
          if (weekday === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
          }
          currentWeek.push(day);
        });
        if (currentWeek.length > 0) weeks.push(currentWeek);

        var width = weeks.length * CELL_STRIDE;
        var height = 7 * CELL_STRIDE;

        var svgNS = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 " + width + " " + height);
        svg.setAttribute("role", "img");
        svg.setAttribute(
          "aria-label",
          "GitHub contribution heatmap: " + total + " contributions in the last year"
        );
        svg.setAttribute("class", "h-auto min-w-[640px]");
        svg.style.width = "100%";

        weeks.forEach(function (week, weekIndex) {
          week.forEach(function (day) {
            var weekday = new Date(day.date + "T00:00:00Z").getUTCDay();
            var rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", weekIndex * CELL_STRIDE);
            rect.setAttribute("y", weekday * CELL_STRIDE);
            rect.setAttribute("width", CELL_SIZE);
            rect.setAttribute("height", CELL_SIZE);
            rect.setAttribute("rx", 2.5);
            rect.setAttribute("fill", LEVEL_COLOR[day.level]);
            rect.setAttribute(
              "class",
              "transition-[filter] duration-300 ease-out hover:brightness-125"
            );
            var title = document.createElementNS(svgNS, "title");
            title.textContent =
              day.count + (day.count === 1 ? " contribution" : " contributions") + " on " + day.date;
            rect.appendChild(title);
            svg.appendChild(rect);
          });
        });

        var wrap = document.createElement("div");
        var scrollWrap = document.createElement("div");
        scrollWrap.className = "relative overflow-x-auto overflow-y-hidden pb-2";
        scrollWrap.appendChild(svg);
        wrap.appendChild(scrollWrap);

        var footer = document.createElement("div");
        footer.className = "mt-3 flex items-center justify-between gap-3";
        footer.innerHTML =
          '<p class="text-xs text-muted-foreground"><span class="font-semibold text-foreground">' +
          total.toLocaleString("en-US") +
          "</span> contributions in the last year</p>" +
          '<div class="flex items-center gap-1.5" aria-hidden="true"><span class="text-xs text-muted-foreground">Less</span></div>';
        var legend = footer.querySelector("div");
        [0, 1, 2, 3, 4].forEach(function (level) {
          var sw = document.createElement("span");
          sw.className = "h-2.5 w-2.5 rounded-sm";
          sw.style.backgroundColor = LEVEL_COLOR[level];
          legend.appendChild(sw);
        });
        var more = document.createElement("span");
        more.className = "text-xs text-muted-foreground";
        more.textContent = "More";
        legend.appendChild(more);
        wrap.appendChild(footer);

        container.replaceWith(wrap);
      })
      .catch(function () {
        // Leave the existing "unavailable" fallback exactly as it is.
      });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initNavbarScrollState();
    initScrollProgressBar();
    initMobileMenu();
    initThemeToggle();
    initCommandPalette();
    initGithubContributions();
  });
})();
