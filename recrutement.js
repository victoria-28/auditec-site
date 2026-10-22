/* Formulaire de candidature (Nous rejoindre).
   Envoi : renseigner data-endpoint sur <form id="rjForm"> (service d'envoi de formulaires ou script de l'hébergeur)
   pour transmettre les champs et le CV à servicerh@auditec-paris.fr. Sans endpoint, le formulaire ouvre
   la messagerie du candidat avec le message prérempli, et lui rappelle de joindre son CV. */
(function () {
  const form = document.getElementById('rjForm'); if (!form) return;
  const cv = document.getElementById('rjCv'), cvName = document.getElementById('rjCvName');
  const err = document.getElementById('rjError'), done = document.getElementById('rjDone');
  const MAX = 5 * 1024 * 1024;
  cv.addEventListener('change', () => { cvName.textContent = cv.files[0] ? cv.files[0].name : 'Aucun fichier sélectionné'; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = '';
    const nom = form.nom.value.trim(), mail = form.email.value.trim(), f = cv.files[0];
    if (!nom || !mail) { err.textContent = 'Merci d\'indiquer votre nom et votre e-mail.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { err.textContent = 'Cette adresse e-mail ne semble pas valide.'; return; }
    if (!f) { err.textContent = 'Merci de joindre votre CV au format PDF.'; return; }
    if (!/\.pdf$/i.test(f.name)) { err.textContent = 'Le CV doit être un fichier PDF.'; return; }
    if (f.size > MAX) { err.textContent = 'Le fichier dépasse 5 Mo.'; return; }
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      try {
        const r = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } });
        if (!r.ok) throw new Error();
        form.querySelectorAll('.form-field, .rj-row, .rj-submit').forEach(el => el.hidden = true);
        done.hidden = false; done.textContent = 'Merci ! Votre candidature a bien été envoyée. Notre service des ressources humaines revient vers vous rapidement.';
      } catch (_) { err.textContent = 'L\'envoi n\'a pas abouti. Vous pouvez écrire directement à ' + form.dataset.to + '.'; }
      return;
    }
    const sujet = 'Candidature : ' + (form.poste.value.trim() || 'candidature spontanée') + ' (' + nom + ')';
    const corps = 'Nom : ' + nom + '\nE-mail : ' + mail + '\nTéléphone : ' + form.telephone.value.trim() + '\nPoste visé : ' + (form.poste.value.trim() || 'Candidature spontanée') + '\n\n' + form.message.value.trim() + '\n\n(CV joint : ' + f.name + ')';
    window.location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);
    done.hidden = false; done.textContent = 'Votre messagerie s\'ouvre avec votre candidature préremplie : pensez à y joindre votre CV (' + f.name + ') avant l\'envoi.';
  });
})();
