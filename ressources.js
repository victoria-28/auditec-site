/* Page Ressources : simulateurs et échéancier.
   Taux et barèmes utilisés (à mettre à jour chaque année) :
   - Impôt sur les sociétés : 15 % jusqu'à 42 500 € de bénéfice pour les PME éligibles, 25 % au-delà.
   - Prélèvement forfaitaire unique sur les dividendes : 31,4 % (loi de finances 2026).
   - Barème kilométrique : arrêté du 27 mars 2023, reconduit en 2024, 2025 et 2026 ; +20 % pour les véhicules électriques.
   - Charges sur salaires : ordres de grandeur pour un cadre (salariales 22 %, patronales 42 %),
     et pour un président de SAS (patronales 45 %, pas de cotisation chômage). */
(function () {
  const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' €';
  const pct = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR') + ' %';

  const IS_RATE_REDUIT = 0.15, IS_SEUIL = 42500, IS_RATE = 0.25, PFU = 0.314;
  const impotSocietes = (benef, pme) => {
    if (benef <= 0) return 0;
    if (!pme) return benef * IS_RATE;
    return Math.min(benef, IS_SEUIL) * IS_RATE_REDUIT + Math.max(0, benef - IS_SEUIL) * IS_RATE;
  };
  // Barème kilométrique voitures [jusqu'à 5 000 km], [5 001 à 20 000 km : a*d + b], [au-delà de 20 000 km]
  const IK = {
    3: [0.529, [0.316, 1065], 0.370],
    4: [0.606, [0.340, 1330], 0.407],
    5: [0.636, [0.357, 1395], 0.427],
    6: [0.665, [0.374, 1457], 0.447],
    7: [0.697, [0.394, 1515], 0.470]
  };
  const indemnites = (d, cv, elec) => {
    const b = IK[cv]; let v;
    if (d <= 5000) v = d * b[0]; else if (d <= 20000) v = d * b[1][0] + b[1][1]; else v = d * b[2];
    return elec ? v * 1.2 : v;
  };

  const range = (id, label, min, max, step, val) =>
    `<label class="sim-field"><span class="sim-label">${label}</span><output id="${id}Out"></output>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  const results = cells => `<div class="sim-results">${cells.map((c, i) =>
      `<div class="sim-res${i === cells.length - 1 ? ' is-total' : ''}"><span>${c[0]}</span><strong id="${c[1]}"></strong></div>`).join('')}</div>`;
  const cta = note => `<p class="sim-note">${note}</p><a href="../contact.html" class="btn-primary sim-cta">Affiner avec un expert</a>`;

  const SIMS = {
    recrutement: {
      title: "Coût d'un recrutement",
      html: () => range('rBrut', 'Salaire brut annuel', 20000, 150000, 1000, 45000) +
        results([['Net salarié', 'rNet'], ['Charges patronales', 'rCharges'], ['Coût total', 'rTotal']]) +
        cta("Estimation indicative pour un cadre, hors réductions de cotisations et aides à l'embauche."),
      calc: () => {
        const b = +val('rBrut'); out('rBrut', fmt(b));
        set('rNet', fmt(b * 0.78)); set('rCharges', fmt(b * 0.42)); set('rTotal', fmt(b * 1.42));
      }
    },
    remuneration: {
      title: 'Salaire ou dividendes ?',
      html: () => range('dEnv', 'Budget disponible avant impôt', 10000, 300000, 1000, 80000) +
        results([['Net en salaire', 'dSal'], ['Net en dividendes', 'dDiv'], ['Écart', 'dEcart']]) +
        cta("Président de SAS, société éligible au taux réduit d'IS. Le salaire reste soumis à l'impôt sur le revenu mais ouvre des droits à la retraite ; les dividendes n'en ouvrent pas."),
      calc: () => {
        const e = +val('dEnv'); out('dEnv', fmt(e));
        const netSal = e / 1.45 * 0.78;
        const netDiv = (e - impotSocietes(e, true)) * (1 - PFU);
        set('dSal', fmt(netSal)); set('dDiv', fmt(netDiv));
        set('dEcart', (netDiv >= netSal ? 'Dividendes +' : 'Salaire +') + fmt(Math.abs(netDiv - netSal)));
      }
    },
    is: {
      title: 'Impôt sur les sociétés',
      html: () => range('iBen', 'Bénéfice imposable', 0, 500000, 1000, 60000) +
        `<label class="sim-check"><input type="checkbox" id="iPme" checked> PME éligible au taux réduit de 15 % (chiffre d'affaires inférieur à 10 M€, capital détenu à 75 % par des personnes physiques)</label>` +
        results([['Taux effectif', 'iTaux'], ['Acompte trimestriel suivant', 'iAcompte'], ['Impôt sur les sociétés', 'iTotal']]) +
        cta("Hors contribution sociale de 3,3 %, qui ne concerne que les sociétés dont l'IS dépasse 763 000 €. Les acomptes sont dus si l'IS de l'exercice précédent dépasse 3 000 €."),
      calc: () => {
        const b = +val('iBen'); out('iBen', fmt(b));
        const is = impotSocietes(b, document.getElementById('iPme').checked);
        set('iTotal', fmt(is)); set('iTaux', b > 0 ? pct(is / b * 100) : '0 %');
        set('iAcompte', is > 3000 ? fmt(is / 4) : 'Aucun');
      }
    },
    ik: {
      title: 'Indemnités kilométriques',
      html: () => range('kKm', 'Kilomètres professionnels par an', 0, 40000, 500, 8000) +
        `<div class="sim-seg" role="radiogroup" aria-label="Puissance fiscale">${[3, 4, 5, 6, 7].map(c =>
          `<label><input type="radio" name="kCv" value="${c}"${c === 5 ? ' checked' : ''}><span>${c === 3 ? '3 CV et moins' : c === 7 ? '7 CV et plus' : c + ' CV'}</span></label>`).join('')}</div>` +
        `<label class="sim-check"><input type="checkbox" id="kElec"> Véhicule 100 % électrique (majoration de 20 %)</label>` +
        results([['Par kilomètre', 'kUnit'], ['Puissance', 'kPuis'], ['Indemnités annuelles', 'kTotal']]) +
        cta('Barème fiscal des voitures, reconduit à l\'identique en 2026.'),
      calc: () => {
        const d = +val('kKm'); out('kKm', d.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' km');
        const cv = +document.querySelector('input[name="kCv"]:checked').value;
        const v = indemnites(d, cv, document.getElementById('kElec').checked);
        set('kTotal', fmt(v)); set('kUnit', d > 0 ? (Math.round(v / d * 1000) / 1000).toLocaleString('fr-FR') + ' €' : '0 €');
        set('kPuis', cv === 3 ? '3 CV et moins' : cv === 7 ? '7 CV et plus' : cv + ' CV');
      }
    },
    valeur: {
      title: 'Valeur de votre entreprise',
      html: () => range('vEbe', "Excédent brut d'exploitation (EBE)", 0, 3000000, 10000, 300000) +
        range('vTreso', 'Trésorerie nette de dettes', -1000000, 2000000, 10000, 100000) +
        results([['Fourchette basse', 'vBas'], ['Fourchette haute', 'vHaut'], ['Valeur centrale', 'vMid']]) +
        cta("Approche par les multiples, de 4 à 6 fois l'EBE selon le secteur, la taille et la récurrence du chiffre d'affaires, augmentée de la trésorerie nette. Une évaluation complète croise plusieurs méthodes."),
      calc: () => {
        const e = +val('vEbe'), t = +val('vTreso'); out('vEbe', fmt(e)); out('vTreso', fmt(t));
        const lo = Math.max(0, e * 4 + t), hi = Math.max(0, e * 6 + t);
        set('vBas', fmt(lo)); set('vHaut', fmt(hi)); set('vMid', fmt((lo + hi) / 2));
      }
    }
  };
  const val = id => document.getElementById(id).value;
  const out = (id, t) => { const o = document.getElementById(id + 'Out'); if (o) o.textContent = t; };
  const set = (id, t) => { document.getElementById(id).textContent = t; };
  const paintRange = r => { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); };

  function openSim(key) {
    const card = document.getElementById('simCard'); if (!card) return;
    const sim = SIMS[key];
    card.innerHTML = `<div class="sim-head"><h3>${sim.title}</h3><span class="sim-tag">Essayez</span></div>` + sim.html();
    const run = () => { card.querySelectorAll('input[type=range]').forEach(paintRange); sim.calc(); };
    card.querySelectorAll('input').forEach(i => i.addEventListener('input', run));
    run();
    document.querySelectorAll('.sim-tab').forEach(t => {
      const on = t.dataset.sim === key; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on);
    });
  }
  document.querySelectorAll('.sim-tab').forEach(t => t.addEventListener('click', () => {
    openSim(t.dataset.sim);
    if (window.innerWidth < 960) document.getElementById('simCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  openSim('recrutement');

  /* ---------- Échéancier ---------- */
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const MOIS_C = ['JANV.', 'FÉVR.', 'MARS', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.'];
  const paques = y => { // calcul de Pâques (algorithme de Meeus)
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  };
  const feries = y => {
    const p = paques(y), add = n => { const d = new Date(p); d.setDate(d.getDate() + n); return d; };
    return [new Date(y, 0, 1), add(1), new Date(y, 4, 1), new Date(y, 4, 8), add(39), add(50), new Date(y, 6, 14),
      new Date(y, 7, 15), new Date(y, 10, 1), new Date(y, 10, 11), new Date(y, 11, 25)].map(d => d.toDateString());
  };
  const ouvre = d => {
    const f = feries(d.getFullYear());
    while (d.getDay() === 0 || d.getDay() === 6 || f.includes(d.toDateString())) d.setDate(d.getDate() + 1);
    return d;
  };
  function echeances(from, days) {
    const list = [], end = new Date(from); end.setDate(end.getDate() + days);
    for (let y = from.getFullYear(); y <= end.getFullYear(); y++) {
      for (let m = 0; m < 12; m++) {
        const prev = MOIS[(m + 11) % 12];
        list.push({ d: new Date(y, m, 5), t: 'DSN de ' + prev, s: 'Entreprises de 50 salariés et plus', c: 'Social' });
        list.push({ d: new Date(y, m, 15), t: 'DSN de ' + prev, s: 'Entreprises de moins de 50 salariés', c: 'Social' });
        list.push({ d: new Date(y, m, 24), t: 'Déclaration et paiement de la TVA', s: 'Régime réel normal, entre le 15 et le 24 selon votre entreprise', c: 'Fiscal' });
      }
      [2, 5, 8, 11].forEach(m => list.push({ d: new Date(y, m, 15), t: "Acompte d'impôt sur les sociétés", s: "Sociétés à l'IS, clôture au 31/12", c: 'Fiscal' }));
      list.push({ d: new Date(y, 4, 15), t: "Solde de l'impôt sur les sociétés", s: 'Exercice clos au 31/12', c: 'Fiscal' });
      list.push({ d: new Date(y, 5, 15), t: 'Acompte de CFE', s: "Si la CFE de l'année précédente atteint 3 000 €", c: 'Fiscal' });
      list.push({ d: new Date(y, 11, 15), t: 'Solde de la CFE', s: 'Cotisation foncière des entreprises', c: 'Fiscal' });
      list.push({ d: new Date(y, 6, 24), t: 'Acompte de TVA de juillet', s: 'Régime simplifié, entre le 15 et le 24 selon votre entreprise', c: 'Fiscal' });
      list.push({ d: new Date(y, 11, 24), t: 'Acompte de TVA de décembre', s: 'Régime simplifié, entre le 15 et le 24 selon votre entreprise', c: 'Fiscal' });
      list.push({ d: new Date(y, 9, 20), t: 'Taxe foncière, paiement en ligne', s: 'Propriétaires de locaux ; le 15 octobre pour les autres moyens de paiement', c: 'Fiscal' });
    }
    const start = new Date(from); start.setHours(0, 0, 0, 0);
    const items = list.map(e => ({ ...e, d: ouvre(e.d) })).filter(e => e.d >= start).sort((a, b) => a.d - b.d);
    const inWindow = items.filter(e => e.d <= end);
    return inWindow.length >= 5 ? inWindow : items.slice(0, 5);
  }
  const ul = document.getElementById('echList');
  if (ul) {
    const items = echeances(new Date(), 30);
    ul.innerHTML = items.map(e => `<li class="ech-item"><div class="ech-date"><strong>${String(e.d.getDate()).padStart(2, '0')}</strong><span>${MOIS_C[e.d.getMonth()]}</span></div>
      <div class="ech-body"><h3>${e.t}</h3><p>${e.s}</p></div><span class="ech-cat ech-${e.c.toLowerCase()}">${e.c}</span></li>`).join('');
    const btn = document.getElementById('echIcs');
    if (btn) btn.addEventListener('click', () => {
      const pad = n => String(n).padStart(2, '0');
      const ds = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
      const ev = items.map((e, i) => {
        const n = new Date(e.d); n.setDate(n.getDate() + 1);
        return ['BEGIN:VEVENT', 'UID:auditec-' + ds(e.d) + '-' + i + '@auditec-paris.fr', 'DTSTAMP:' + ds(new Date()) + 'T000000Z',
          'DTSTART;VALUE=DATE:' + ds(e.d), 'DTEND;VALUE=DATE:' + ds(n), 'SUMMARY:' + e.t, 'DESCRIPTION:' + e.s + ' (Auditec)',
          'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:' + e.t, 'END:VALARM', 'END:VEVENT'].join('\r\n');
      });
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Auditec//Echeancier//FR', ...ev, 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'echeances-auditec.ics'; document.body.appendChild(a); a.click(); a.remove();
    });
  }
})();
