// Sauvegarde automatique

document.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll("input");

    // Charger l'XP Global depuis la mémoire du navigateur
    let globalXP = parseInt(localStorage.getItem("global_xp")) || 0;
    mettreAJourAffichageXP();

    // Gestion de la sauvegarde des cases et des champs
    inputs.forEach((input, index) => {
        const uniqueKey = input.id ? input.id : "input_pos_" + index;
        const valeur = localStorage.getItem(uniqueKey);
        
        if (valeur !== null) {
            if (input.type === "checkbox") {
                input.checked = valeur === "true";
            } else {
                input.value = valeur;
            }
        }

        input.addEventListener("input", () => {
            if (input.type === "checkbox") {
                localStorage.setItem(uniqueKey, input.checked);
                calculerProgressionSeance(); // Mise à jour de la jauge à chaque clic
                
                // NOUVEAU : On vérifie si la carte doit passer au vert
                verifierCompletionCarte(input.closest('.card')); 
            } else {
                localStorage.setItem(uniqueKey, input.value);
            }
        });
    });

    // Fonction de calcul de la jauge de la séance du jour (ONGLET ACTIF UNIQUEMENT)
    function calculerProgressionSeance() {
        // 1. On cherche l'onglet actuellement affiché à l'écran
        let seanceActive = document.querySelector('.seance-content[style*="display: block"]');
        
        // Sécurité : au premier chargement, c'est la séance 1 qui est active
        if (!seanceActive) {
            seanceActive = document.getElementById("seance_1");
        }

        // 2. On compte uniquement les cases de CETTE séance
        const checkboxes = seanceActive.querySelectorAll('input[type="checkbox"]');
        const total = checkboxes.length;
        const cochees = seanceActive.querySelectorAll('input[type="checkbox"]:checked').length;

        // Sécurité pour éviter la division par zéro si un onglet est vide
        if (total === 0) return;

        // Calcul du pourcentage
        const pourcentage = Math.round((cochees / total) * 100);

        // Mise à jour visuelle de la barre et du texte
        const sessionBar = document.getElementById("session_bar");
        const sessionPct = document.getElementById("session_pct");
        if (sessionBar) sessionBar.style.width = pourcentage + "%";
        if (sessionPct) sessionPct.textContent = pourcentage;

        // Logique de validation (Blocage journalier pour éviter la triche)
        const dateDuJour = new Date().toISOString().split('T')[0];
        // On crée une clé unique par jour ET par séance pour éviter de valider deux fois le même jour
        const idSeance = seanceActive.id; 
        const keyValidation = "valide_" + idSeance + "_" + dateDuJour;

        if (pourcentage === 100) {
            // Si cette séance précise n'a pas encore été validée aujourd'hui
            if (!localStorage.getItem(keyValidation)) {
                globalXP += 100; // +100 XP pour la séance complète
                localStorage.setItem("global_xp", globalXP);
                localStorage.setItem(keyValidation, "true"); 
                
                alert("🔥 SÉANCE VALIDÉE ! 🔥\nExcellent travail. +100 XP ajoutés à ton profil.");
                mettreAJourAffichageXP();
            }
        }
    }

    // Fonction de mise à jour des niveaux Gymbro
    function mettreAJourAffichageXP() {
        // 1 niveau tous les 500 XP (environ 1 semaine de ton programme)
        const niveauActuel = Math.floor(globalXP / 500) + 1; 

        const levelElement = document.getElementById("user_level");
        const titleElement = document.getElementById("user_title");
        const globalXpElement = document.getElementById("global_xp");

        if (levelElement) levelElement.textContent = niveauActuel;
        if (globalXpElement) globalXpElement.textContent = globalXP;

        if (titleElement) {
            if (niveauActuel === 1) titleElement.textContent = "Novice";
            else if (niveauActuel === 2) titleElement.textContent = "Initié";
            else if (niveauActuel === 3) titleElement.textContent = "Régulier";
            else if (niveauActuel === 4) titleElement.textContent = "Machine";
            else if (niveauActuel === 5) titleElement.textContent = "Spartiate";
            else titleElement.textContent = "Dieu du Stade";
        }
    }

    // Lancement au démarrage
    calculerProgressionSeance();

    // --- 3. BOUTON SAUVEGARDER (RESET DE LA SÉANCE) ---
    const btnSauvegarder = document.querySelector("button");
    if (btnSauvegarder) {
        btnSauvegarder.addEventListener("click", () => {
            const validation = confirm("Veux-tu clôturer cette séance ? Tes performances (poids/reps) seront mémorisées, mais les cases seront remises à zéro pour ton prochain entraînement.");
            
            if (validation) {
                inputs.forEach((input, index) => {
                    if (input.type === "checkbox") {
                        input.checked = false; // Décoche la case visuellement
                        const uniqueKey = input.id ? input.id : "input_pos_" + index;
                        localStorage.setItem(uniqueKey, false); // Sauvegarde l'état décoché
                    }
                });
                
                calculerProgressionSeance(); // La jauge retombe à 0%
            }
        });
    }

    // --- 4. GESTION DES ONGLETS DE NAVIGATION ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const seanceContents = document.querySelectorAll('.seance-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Retirer la couleur orange de tous les boutons
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // 2. Masquer toutes les séances
            seanceContents.forEach(content => content.style.display = 'none');

            // 3. Activer le bouton cliqué et afficher sa séance
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
            
            // 4. Recalculer la jauge pour la nouvelle séance affichée
            calculerProgressionSeance();
        });
    });
    // --- Fonction d'analyse visuelle des cartes ---
    function verifierCompletionCarte(carte) {
        if (!carte) return;
        const checkboxes = carte.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length === 0) return;

        // Vérifie si TOUTES les cases de la carte sont cochées
        const toutesCochees = Array.from(checkboxes).every(box => box.checked);
        
        if (toutesCochees) {
            carte.classList.add('completed');
        } else {
            carte.classList.remove('completed');
        }
    }

    // --- 5. AUTO-VALIDATION DES SÉRIES ---
    // On sélectionne toutes les lignes des tableaux
    const lignes = document.querySelectorAll("tr");

    lignes.forEach(ligne => {
        // Pour chaque ligne, on cherche les champs de saisie et la case à cocher
        const champsSaisie = ligne.querySelectorAll('input[type="number"], input[type="text"]');
        const caseCocher = ligne.querySelector('input[type="checkbox"]');

        // Si la ligne contient bien une case à cocher ET des champs à remplir
        if (caseCocher && champsSaisie.length > 0) {
            champsSaisie.forEach(champ => {
                // On écoute chaque fois que tu tapes un chiffre
                champ.addEventListener("input", () => {
                    let toutEstRempli = true;
                    
                    // On vérifie si tous les champs de la ligne ont une valeur
                    champsSaisie.forEach(c => {
                        if (c.value.trim() === "") {
                            toutEstRempli = false;
                        }
                    });

                    // Si tout est rempli et que la case n'est pas encore cochée
                    if (toutEstRempli && !caseCocher.checked) {
                        caseCocher.checked = true; // Auto-coche
                        
                        // Déclenche artificiellement l'événement pour sauvegarder et calculer l'XP
                        caseCocher.dispatchEvent(new Event("input"));
                    }
                });
            });
        }
    });

    // Scan initial pour colorer les cartes déjà terminées au chargement
    document.querySelectorAll('.card').forEach(carte => verifierCompletionCarte(carte));

// --- 6. CHRONOMÈTRE DE REPOS ---
    let chronoInterval;
    const displayChrono = document.getElementById("chrono_display");
    const btnStopChrono = document.getElementById("btn_stop_chrono");
    const chronoBtns = document.querySelectorAll(".chrono-btn:not(.stop)");

    function demarrerChrono(secondes) {
        // Sécurité : On stoppe et nettoie tout chrono précédent
        clearInterval(chronoInterval);
        
        // Remise à zéro visuelle (couleur orange)
        displayChrono.style.color = "#ff6600";
        afficherTemps(secondes);

        let tempsRestant = secondes;

        // Boucle qui s'exécute toutes les 1000 ms (1 seconde)
        chronoInterval = setInterval(() => {
            tempsRestant--;
            afficherTemps(tempsRestant);

            // Action de fin
            if (tempsRestant <= 0) {
                clearInterval(chronoInterval);
                displayChrono.style.color = "#28a745"; // Passe au vert vif pour le départ
            }
        }, 1000);
    }

    // Formatage propre en MM:SS
    function afficherTemps(secondes) {
        const minutes = Math.floor(secondes / 60);
        const restesSecondes = secondes % 60;
        displayChrono.textContent = 
            (minutes < 10 ? "0" : "") + minutes + ":" + 
            (restesSecondes < 10 ? "0" : "") + restesSecondes;
    }

    // Activation des boutons de temps
    chronoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tempsDemande = parseInt(btn.getAttribute("data-time"));
            demarrerChrono(tempsDemande);
        });
    });

    // Activation du bouton d'arrêt d'urgence
    if (btnStopChrono) {
        btnStopChrono.addEventListener("click", () => {
            clearInterval(chronoInterval);
            displayChrono.textContent = "00:00";
            displayChrono.style.color = "#ff6600";
        });
    }

});