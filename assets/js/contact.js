/* Diagnostic dirigeant : trois questions, une recommandation, puis préremplissage du formulaire. */
(function () {
  const card = document.getElementById('diagCard'); if (!card) return;
  const QUESTIONS = [
    { q: 'Vous êtes…', options: ['En création', 'Dirigeant de PME', 'Profession libérale', 'Filiale de groupe'] },
    { q: "Votre priorité aujourd'hui ?", options: ['Gagner du temps', 'Piloter ma trésorerie', 'Sécuriser mes comptes', 'Optimiser ma fiscalité'] },
    { q: 'Combien de collaborateurs ?', options: ['0 à 10', '10 à 50', '50 à 250', 'Plus de 250'] }
  ];
  // La recommandation dépend de la priorité (réponse 2) ; un projet en création oriente vers l'étape « Je crée ».
  const RESULTS = [
    { t: 'Externalisation comptable et paie', d: 'Nous prenons en charge la production pour vous libérer du temps, avec un point mensuel dédié.', link: 'expertises/comptable-fiscal.html' },
    { t: 'Tableau de bord et prévisionnel de trésorerie', d: 'Des indicateurs mensuels et un prévisionnel à 12 mois, suivis avec votre expert.', link: 'parcours.html#piloter' },
    { t: 'Revue des comptes et audit contractuel', d: 'Un diagnostic de vos processus et de vos comptes pour fiabiliser vos décisions.', link: 'expertises/audit.html' },
    { t: 'Revue fiscale et optimisation', d: "Une analyse de votre situation pour identifier les leviers d'optimisation légaux.", link: 'expertises/comptable-fiscal.html' }
  ];
  const CREATION = { t: 'Accompagnement à la création', d: 'Statut, prévisionnel, choix fiscal et social : nous posons avec vous les bases de votre entreprise, dès le premier rendez-vous.', link: 'parcours.html#creer' };
  let answers = [];

  function render() {
    const step = answers.length;
    const bar = `<div class="diag-top"><span>${step < 3 ? 'Question ' + (step + 1) + ' sur 3' : 'Votre recommandation'}</span>${step > 0 ? '<button type="button" class="diag-back">← Retour</button>' : ''}</div>
      <div class="diag-progress"><span style="width:${Math.min(step, 3) / 3 * 100}%"></span></div>`;
    if (step < 3) {
      const Q = QUESTIONS[step];
      card.innerHTML = bar + `<h3>${Q.q}</h3><div class="diag-options">${Q.options.map((o, i) => `<button type="button" class="diag-opt" data-i="${i}">${o}</button>`).join('')}</div>`;
      card.querySelectorAll('.diag-opt').forEach(b => b.addEventListener('click', () => { answers.push(+b.dataset.i); render(); focusFirst(); }));
    } else {
      const R = answers[0] === 0 && answers[1] !== 2 ? CREATION : RESULTS[answers[1]];
      card.innerHTML = bar + `<span class="eyebrow">Notre recommandation</span><h3>${R.t}</h3><p class="diag-res">${R.d}</p>
        <ul class="diag-recap">${answers.map((a, i) => `<li><span>${QUESTIONS[i].q.replace('…', '')}</span>${QUESTIONS[i].options[a]}</li>`).join('')}</ul>
        <div class="diag-ctas"><button type="button" class="btn-primary diag-send">Recevoir cette recommandation</button><a class="btn-ghost" href="${R.link}">En savoir plus</a></div>
        <button type="button" class="diag-restart">Recommencer</button>`;
      card.querySelector('.diag-send').addEventListener('click', () => {
        const t = document.getElementById('besoin');
        if (t) {
          t.value = `Diagnostic : ${QUESTIONS[0].options[answers[0]]}, priorité « ${QUESTIONS[1].options[answers[1]].toLowerCase()} », ${QUESTIONS[2].options[answers[2]]} collaborateurs.\nRecommandation : ${R.t}.\n\n`;
          document.getElementById('formulaire').scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }, 600);
        }
      });
      card.querySelector('.diag-restart').addEventListener('click', () => { answers = []; render(); focusFirst(); });
    }
    const back = card.querySelector('.diag-back');
    if (back) back.addEventListener('click', () => { answers.pop(); render(); focusFirst(); });
  }
  function focusFirst() { const b = card.querySelector('.diag-opt, .diag-send'); if (b) b.focus({ preventScroll: true }); }
  render();
})();
