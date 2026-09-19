/* SharpBid v3 — shared behaviour (no dependencies) */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile nav ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var navLinks = document.querySelector(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) navLinks.classList.remove("open");
    });
  }

  /* ---------- nav shrink on scroll ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveal ---------- */
  var reveals = document.querySelectorAll(".rev-up");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- live takeoff hero ---------- */
  var sheet = document.getElementById("takeoff-sheet");
  if (sheet) {
    var rooms = Array.prototype.slice.call(sheet.querySelectorAll(".room"));
    var tallyEl = document.getElementById("tally");
    var areasEl = document.getElementById("tallyAreas");
    var total = 0;
    var shownTotal = 0;
    var raf = null;

    function fmt(n) { return n.toLocaleString("en-CA"); }
    function renderTally() {
      var measured = rooms.filter(function (r) { return r.classList.contains("measured"); });
      total = measured.reduce(function (s, r) { return s + (+r.getAttribute("data-sf") || 0); }, 0);
      if (areasEl) areasEl.textContent = measured.length + "/" + rooms.length;
      if (reduced) { if (tallyEl) tallyEl.textContent = fmt(total); return; }
      cancelAnimationFrame(raf);
      var start = shownTotal, diff = total - start, t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 500, 1);
        shownTotal = Math.round(start + diff * (1 - Math.pow(1 - p, 3)));
        if (tallyEl) tallyEl.textContent = fmt(shownTotal);
        if (p < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    function toggleRoom(room) {
      room.classList.toggle("measured");
      renderTally();
    }
    rooms.forEach(function (room) {
      room.addEventListener("click", function () { toggleRoom(room); });
      room.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRoom(room); }
      });
    });

    /* auto-measure sequence when the hero enters view */
    var started = false;
    function autoRun() {
      if (started) return;
      started = true;
      if (reduced) {
        rooms.forEach(function (r) { r.classList.add("measured"); });
        renderTally();
        return;
      }
      rooms.forEach(function (room, i) {
        setTimeout(function () {
          room.classList.add("measured");
          renderTally();
        }, 500 + i * 320);
      });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { autoRun(); obs.disconnect(); }
      }, { threshold: 0.35 }).observe(sheet);
    } else { autoRun(); }
  }

  /* ---------- count-up big stats ---------- */
  var nums = document.querySelectorAll(".bignum");
  if (nums.length) {
    var runNum = function (el) {
      var end = +el.getAttribute("data-count") || 0;
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = prefix + end.toLocaleString("en-CA") + suffix; return; }
      var t0 = null;
      function tick(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 900, 1);
        el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-CA") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runNum(en.target); nio.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (el) { nio.observe(el); });
    } else { nums.forEach(runNum); }
  }

  /* ---------- scope check calculator ---------- */
  var calc = document.querySelector(".calc");
  if (calc) {
    var CFG = {
      flooring: { base: 450, incl: 15000, per: 0.012, label: "Flooring / Div 09" },
      drywall:  { base: 450, incl: 8000,  per: 0.020, label: "Drywall & steel stud" },
      acoustic: { base: 450, incl: 8000,  per: 0.020, label: "Acoustic ceilings (ACT)" },
      painting: { base: 450, incl: 10000, per: 0.014, label: "Painting" },
      glazing:  { base: 900, incl: 10000, per: 0.030, label: "Glazing / Div 08" },
      roofing:  { base: 600, incl: 10000, per: 0.012, label: "Roofing & building envelope" },
      metals:   { base: 600, incl: 10000, per: 0.012, label: "Misc metals / Div 05" },
      concrete: { base: 500, incl: 5000,  per: 0.020, label: "Concrete / formwork", note: "(low-rise scope)" },
      framing:  { base: 600, incl: 10000, per: 0.012, label: "Framing / wood-frame", note: "(wall & sheathing areas)" }
    };
    var trade = "flooring";
    var range = document.getElementById("sfRange");
    var sfOut = document.getElementById("sfOut");
    var sfNote = document.getElementById("sfNote");
    var priceEl = document.getElementById("calcPrice");
    var daysEl = document.getElementById("calcDays");
    var lockBtn = document.getElementById("calcLock");
    var lastQuote = {};

    function update() {
      var c = CFG[trade];
      var sf = +range.value;
      var price = c.base + Math.max(0, sf - c.incl) * c.per;
      price = Math.round(price / 25) * 25;
      var days = price <= 900 ? "1 business day" : price <= 2000 ? "2 business days" : "3 business days";
      sfOut.textContent = sf.toLocaleString("en-CA");
      sfNote.textContent = c.note || "";
      priceEl.textContent = "$" + price.toLocaleString("en-CA");
      daysEl.textContent = days;
      lastQuote = { trade: c.label, sf: sf, price: price, days: days };
    }
    calc.querySelectorAll(".pill").forEach(function (p) {
      p.addEventListener("click", function () {
        calc.querySelectorAll(".pill").forEach(function (x) { x.classList.remove("on"); });
        p.classList.add("on");
        trade = p.getAttribute("data-trade");
        update();
      });
    });
    range.addEventListener("input", update);
    update();

    if (lockBtn) {
      lockBtn.addEventListener("click", function () {
        var sel = document.getElementById("q-trade");
        var det = document.getElementById("q-details");
        var moreFields = document.getElementById("more-fields");
        var moreToggle = document.getElementById("moreToggle");
        if (sel) {
          Array.prototype.forEach.call(sel.options, function (o) {
            if (o.text.indexOf(lastQuote.trade.split(" ")[0]) === 0) sel.value = o.value || o.text;
          });
        }
        if (det) {
          if (moreFields && moreFields.hidden && moreToggle) { moreFields.hidden = false; moreToggle.setAttribute("aria-expanded", "true"); }
          det.value = "Scope Check: " + lastQuote.trade + ", ~" + lastQuote.sf.toLocaleString("en-CA") +
            " SF — ballpark $" + lastQuote.price.toLocaleString("en-CA") + " / " + lastQuote.days + ". Please confirm in writing.";
        }
        var q = document.getElementById("quote");
        if (q) q.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    }
  }

  /* ---------- bid traps ---------- */
  var trapText = document.getElementById("trapText");
  if (trapText) {
    var TRAPS = [
      ["FLOORING", "The finish schedule says LVT-1, the plan tag says CPT-1. Whichever you priced, the other one shows up in the change order — against you."],
      ["DRYWALL", "Head-of-wall deflection details hide in the structural set. Price partitions off the architectural alone and every top track is wrong."],
      ["GLAZING", "Spandrel shown on elevations, missing from the glass schedule. If your glass quote followed the schedule, you just bought the spandrel."],
      ["MISC METALS", "Embeds live on S-sheets, the rail lives on A-sheets. Bid one set and half the package is somebody's assumption."],
      ["PAINTING", "'Site-painted' vs 'pre-finished' doors is decided in the Division 8 spec — not Division 9. Count doors from the door schedule, not the finish plan."],
      ["CONCRETE", "Formwork is priced on contact area, not concrete volume. A thin wall with two faces costs more to form than a thick one with the same cubes."],
      ["FLOORING", "Moisture mitigation 'where RH exceeds spec' is an open allowance. Qualify the SF or you own the whole slab."],
      ["DRYWALL", "Rated shaftwall counted as standard partition: same SF, different assembly, twice the labour. Type marks first, areas second."],
      ["GLAZING", "Sealant joints get measured twice by GCs and zero times by subs. LF by condition — or it's free work."],
      ["MISC METALS", "'Miscellaneous metals as required' in the spec means everything nobody else claimed. Exclude by list, not by hope."],
      ["PAINTING", "Exposed deck spray isn't on the finish schedule — it's a reflected ceiling plan item. Check the RCP or you missed a level's worth."],
      ["CONCRETE", "Housekeeping pads are shown on the mechanical drawings and poured by you. Read the M-sheets or they're a freebie."]
    ];
    var week = 0;
    try {
      var now = new Date();
      var jan1 = new Date(now.getFullYear(), 0, 1);
      week = Math.floor((now - jan1) / 604800000);
    } catch (e) { week = 0; }
    var idx = ((week % TRAPS.length) + TRAPS.length) % TRAPS.length;
    var tagEl = document.getElementById("trapTag");
    function renderTrap() {
      var t = TRAPS[idx];
      if (tagEl) tagEl.textContent = "BID TRAP Nº " + (idx + 1) + " · " + t[0];
      trapText.textContent = t[1];
    }
    var prev = document.getElementById("trapPrev");
    var next = document.getElementById("trapNext");
    if (prev) prev.addEventListener("click", function () { idx = (idx - 1 + TRAPS.length) % TRAPS.length; renderTrap(); });
    if (next) next.addEventListener("click", function () { idx = (idx + 1) % TRAPS.length; renderTrap(); });
    renderTrap();
  }

  /* ---------- progressive form ---------- */
  var moreToggle2 = document.getElementById("moreToggle");
  var moreFields2 = document.getElementById("more-fields");
  if (moreToggle2 && moreFields2) {
    moreToggle2.addEventListener("click", function () {
      var open = moreFields2.hidden;
      moreFields2.hidden = !open;
      moreToggle2.setAttribute("aria-expanded", open ? "true" : "false");
      moreToggle2.textContent = open ? "－ Hide details" : "＋ Add details (name, phone, deadline)";
    });
  }

  /* ---------- quote form → Formspree (existing endpoint preserved) ---------- */
  var form = document.getElementById("quote-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data._subject = "New SharpBid lead: " + (data.trade || "General") + (data.name ? " — " + data.name : "");
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch("https://formspree.io/f/mpqoylwk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("send failed");
          form.style.display = "none";
          var ok = document.querySelector(".form-ok");
          if (ok) ok.style.display = "block";
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "Get my fixed quote";
          alert("Something went wrong. Email info@sharpbid.ca directly or call (604) 245-4344.");
        });
    });
  }

  /* ---------- sticky mobile action bar (all pages) ---------- */
  var bar = document.createElement("div");
  bar.className = "sticky-bar";
  bar.innerHTML =
    '<a class="sb-call" href="tel:+16042454344">☎ Call now</a>' +
    '<a class="sb-quote" href="' + (document.getElementById("quote") ? "#quote" : "/#quote") + '">Get a fixed quote</a>';
  document.body.appendChild(bar);
  var quoteSec = document.getElementById("quote");
  if (quoteSec && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("off", entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(quoteSec);
  }
})();
