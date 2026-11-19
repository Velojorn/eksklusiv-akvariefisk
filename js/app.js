(function () {
  "use strict";

  var FARGER = [
    ["#C2452D", "#E9A15A"], ["#1F2A21", "#F4EFE6"], ["#2E3B44", "#D9DED6"],
    ["#7A6A3A", "#C9B27C"], ["#E07A1F", "#2A4F8A"], ["#2C7A7B", "#E8743B"]
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Tegnet fisk som brukes når en fisk mangler bilde
  function tegning(i) {
    var f = FARGER[i % FARGER.length];
    return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="v' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCE6D3"/><stop offset="1" stop-color="#A9BFA0"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#v' + i + ')"/>' +
      '<path d="M0 250c40-30 70-10 90 5s50 10 70-10 0 55 0 55H0z" fill="#7E9A72" opacity=".6"/>' +
      '<path d="M300 300c10-50 30-90 25-140M330 300c5-40 25-60 40-110M355 300c0-30-10-50 0-80" stroke="#4E6F4A" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<g transform="translate(70 80)">' +
      '<path d="M20 70C60 0 160-5 210 55l55-45-15 70 15 70-55-45C160 165 60 140 20 70z" fill="' + f[0] + '"/>' +
      '<path d="M110 22c20 30 20 70 0 100" stroke="' + f[1] + '" stroke-width="10" fill="none" opacity=".75"/>' +
      '<path d="M160 30c15 25 15 55 0 85" stroke="' + f[1] + '" stroke-width="8" fill="none" opacity=".6"/>' +
      '<circle cx="60" cy="62" r="7" fill="#FFFDF9"/><circle cx="61" cy="62" r="3.5" fill="#1F2A21"/>' +
      '</g>' +
      '<circle cx="80" cy="60" r="6" fill="none" stroke="#FFFDF9" stroke-width="2" opacity=".7"/>' +
      '<circle cx="66" cy="38" r="4" fill="none" stroke="#FFFDF9" stroke-width="2" opacity=".6"/>' +
      '</svg>';
  }

  function bilde(fisk, i) {
    return fisk.bilde
      ? '<img src="' + esc(fisk.bilde) + '" alt="' + esc(fisk.navn) + '" loading="lazy">'
      : tegning(i);
  }

  function statusKlasse(s) {
    s = (s || "").toLowerCase();
    if (s.indexOf("utsolgt") > -1) return "status-utsolgt";
    if (s.indexOf("få") > -1) return "status-fa";
    if (s.indexOf("kommer") > -1) return "status-kommer";
    return "";
  }

  function hent(fil) {
    if (window.BUTIKKDATA) return Promise.resolve(window.BUTIKKDATA[fil]);
    return fetch("data/" + fil + ".json", { cache: "no-store" }).then(function (r) { return r.json(); });
  }

  var fisker = [], valgt = "Alle", aktiv = null;

  function tegnFilter(kategorier) {
    var navn = ["Alle"].concat(kategorier.filter(function (k) {
      return fisker.some(function (f) { return f.kategori === k; });
    }));
    var el = document.getElementById("filter");
    el.hidden = navn.length < 3;
    el.innerHTML = navn.map(function (n) {
      return '<button role="tab" aria-selected="' + (n === valgt) + '" data-kat="' + esc(n) + '">' + esc(n) + "</button>";
    }).join("");
  }

  function tegnKort() {
    var liste = fisker.filter(function (f) { return valgt === "Alle" || f.kategori === valgt; });
    document.getElementById("tomt").hidden = liste.length > 0;
    document.getElementById("rutenett").innerHTML = liste.map(function (f) {
      var i = fisker.indexOf(f), sk = statusKlasse(f.status);
      return '<button class="kort' + (sk === "status-utsolgt" ? " utsolgt" : "") + '" data-i="' + i + '">' +
        '<div class="kort-bilde">' + bilde(f, i) +
        (f.status ? '<span class="status ' + sk + '">' + esc(f.status) + "</span>" : "") + "</div>" +
        '<div class="kort-tekst">' +
        (f.kategori ? '<p class="kort-kategori">' + esc(f.kategori) + "</p>" : "") +
        "<h3>" + esc(f.navn) + "</h3>" +
        (f.latinsk ? '<p class="latinsk">' + esc(f.latinsk) + "</p>" : "") +
        '<span class="pris">' + esc(f.pris || "Pris på forespørsel") + "</span>" +
        "</div></button>";
    }).join("");
  }

  function fyllValg() {
    var sel = document.getElementById("fisk-valg");
    fisker.forEach(function (f) {
      var o = document.createElement("option");
      o.value = o.textContent = f.navn;
      sel.appendChild(o);
    });
  }

  function apne(i) {
    var f = fisker[i]; aktiv = f;
    document.getElementById("detalj-bilde").innerHTML = bilde(f, i);
    document.getElementById("detalj-kategori").textContent = f.kategori || "";
    document.getElementById("detalj-navn").textContent = f.navn;
    document.getElementById("detalj-latinsk").textContent = f.latinsk || "";
    document.getElementById("detalj-beskrivelse").textContent = f.beskrivelse || "";
    document.getElementById("detalj-pris").textContent = f.pris || "Pris på forespørsel";
    var fakta = [["Status", f.status], ["Størrelse", f.storrelse], ["Temperatur", f.temperatur], ["pH", f.ph]];
    document.getElementById("detalj-fakta").innerHTML = fakta.filter(function (x) { return x[1]; })
      .map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + esc(x[1]) + "</dd>"; }).join("");
    document.getElementById("detalj").showModal();
  }

  function fyllInnstillinger(s) {
    document.querySelectorAll("[data-felt]").forEach(function (el) {
      var v = s[el.getAttribute("data-felt")];
      if (v) el.textContent = v;
    });
    if (s.butikknavn) document.title = s.butikknavn;
    var k = [];
    if (s.epost) k.push('<li>E-post: <a href="mailto:' + esc(s.epost) + '">' + esc(s.epost) + "</a></li>");
    if (s.telefon) k.push("<li>Telefon: " + esc(s.telefon) + "</li>");
    if (s.adresse) k.push("<li>" + esc(s.adresse) + "</li>");
    if (s.orgnr) k.push("<li>Org.nr. " + esc(s.orgnr) + "</li>");
    document.getElementById("kontakt").innerHTML = k.join("");
  }

  // Hendelser
  document.getElementById("filter").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    valgt = b.getAttribute("data-kat");
    document.querySelectorAll("#filter button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
    tegnKort();
  });
  document.getElementById("rutenett").addEventListener("click", function (e) {
    var k = e.target.closest(".kort"); if (k) apne(+k.getAttribute("data-i"));
  });
  var dlg = document.getElementById("detalj");
  document.getElementById("lukk").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  document.getElementById("detalj-knapp").addEventListener("click", function () {
    dlg.close();
    if (aktiv) document.getElementById("fisk-valg").value = aktiv.navn;
    document.getElementById("foresporsel").scrollIntoView({ behavior: "smooth" });
    setTimeout(function () { document.querySelector('#skjema [name="navn"]').focus({ preventScroll: true }); }, 500);
  });

  // Skjema – sendes til Netlify Forms, som videresender til e-post
  var skjema = document.getElementById("skjema"), status = document.getElementById("skjema-status");
  skjema.addEventListener("submit", function (e) {
    e.preventDefault();
    status.className = "skjema-status";
    if (window.BUTIKKDATA) {
      status.textContent = "Dette er en forhåndsvisning – skjemaet sender først når siden er publisert.";
      return;
    }
    var knapp = skjema.querySelector("button[type=submit]");
    knapp.disabled = true; status.textContent = "Sender …";
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(skjema)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      skjema.reset();
      status.className = "skjema-status ok";
      status.textContent = "Takk! Forespørselen er sendt, og vi tar kontakt så snart vi kan.";
    }).catch(function () {
      status.className = "skjema-status feil";
      status.textContent = "Noe gikk galt. Prøv igjen, eller send oss en e-post direkte.";
    }).then(function () { knapp.disabled = false; });
  });

  // Last inn data
  Promise.all([hent("fisker"), hent("kategorier"), hent("innstillinger")]).then(function (d) {
    fisker = (d[0].fisker || []).filter(function (f) { return f.vis !== false; });
    var rang = function (f) { var s = statusKlasse(f.status); return s === "status-utsolgt" ? 2 : s === "status-kommer" ? 1 : 0; };
    fisker.sort(function (a, b) { return rang(a) - rang(b); });
    fyllInnstillinger(d[2] || {});
    tegnFilter((d[1].kategorier || []).map(function (k) { return k.navn; }));
    tegnKort();
    fyllValg();
  }).catch(function () {
    document.getElementById("rutenett").innerHTML = "<p>Kunne ikke laste fiskene. Prøv å laste siden på nytt.</p>";
  });
})();
