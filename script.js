document.addEventListener("DOMContentLoaded", () => {
    const gameArea = document.getElementById("gameArea");
    const coinDisplay = document.getElementById("coins");
    const troopButtons = document.querySelectorAll(".troopBtn");
    const difficultySelect = document.getElementById("difficulty");
    

    let coins = 1000;
    let troops = [];
    let towers = [];
    let difficulty = "easy";
    let mineiros = 0;
    let coinInterval, towerInterval;
    const maxTowers = 20;

    const aiLivesDisplay = document.getElementById("aiLives");

    let aiLives = 20; // Vida inicial
    updateAILives(); // Definir vida inicial com base na dificuldade

    const troopTypes = {
        ninja: { hp: 350, speed: 4, cost: 300, boostTime: 5000 },
        defensor: { hp: 900, speed: 2, cost: 500, shield: 0.6 },
        spawnador: { hp: 200, speed: 2, cost: 250, minions: 4 },
        barbaro: { hp: 300, speed: 2.5, cost: 100 },
        goblin: { hp: 30, speed: 4, cost: 50 },
        chefe: { hp: 4000, speed: 1, cost: 1800, spawns: 2 },
        mineiro: { hp: 50, speed: 1, cost: 100 }
    };

    const towerTypes = {
        heavy: { attackSpeed: 10000, damage: 800, color: "purple" },
        fast: { attackSpeed: 500, damage: 20, color: "orange" },
        balanced: { attackSpeed: 1000, damage: 40, color: "yellow" }
    };

    const upgrades = {
        life: [100, 500, 1000, 1900, 3000],
        speed: [100, 500, 1000, 1900, 3000],
        shield: [100, 500, 1000, 1900, 3000]
    };
    
    const discounts = {
        goblin: 0.3,
        barbaro: 0.3,
        mineiro: 0.3
    };

    const shopContainer = document.getElementById("shop");
    
    function upgradeTroop(troop, stat) {
        let level = troop[stat + "Level"] || 0;
        if (level >= 5) return;
    
        let cost = upgrades[stat][level];
        if (["goblin", "mineiro"].includes(troop.type)) {
            cost *= discounts[troop.type];
        }
    
        if (coins < cost) return;
        coins -= cost;
        updateCoins();
    
        troop[stat + "Level"] = level + 1;
    
        if (stat === "life") {
            troop.maxHp *= 1.2;
            troop.hp = troop.maxHp;
        } else if (stat === "speed") {
            troop.speed *= 1.1;
        } else if (stat === "shield" && troop.type === "defensor") {
            troop.maxShield *= 1.2;
            troop.shield = troop.maxShield;
        }
    
        updateHealthBars(troop);
    }

    function createUpgradeButtons(troop) {
    const upgradePanel = document.createElement("div");
    upgradePanel.classList.add("upgrade-panel");

    ["life", "speed", "shield"].forEach(stat => {
        if (stat === "shield" && troop.type !== "defensor") return;

        const btn = document.createElement("button");
        btn.textContent = `Upgrade ${stat}`;
        btn.addEventListener("click", () => upgradeTroop(troop, stat));

        upgradePanel.appendChild(btn);
    });

    shopContainer.appendChild(upgradePanel);
    }

    function spawnTroop(type) {
        if (coins < troopTypes[type].cost) return;
    
        coins -= troopTypes[type].cost;
        updateCoins();
    
        const troop = document.createElement("div");
        troop.classList.add("troop");
        troop.style.left = "10px";
        troop.hp = troopTypes[type].hp;
        troop.maxHp = troop.hp;
        troop.speed = troopTypes[type].speed;
        troop.type = type;
    
        // Criação da barra de HP
        const hpBar = document.createElement("div");
        hpBar.classList.add("hp-bar");
        troop.appendChild(hpBar);
    
        if (type === "defensor") {
            troop.shield = troop.hp * 0.4; // Escudo inicia com 40% da vida
            troop.maxShield = troop.shield;
    
            // Barra de escudo
            const shieldBar = document.createElement("div");
            shieldBar.classList.add("shield-bar");
            troop.appendChild(shieldBar);
        }
    
        if (type === "mineiro") {
            mineiros++;
        }
    
        gameArea.appendChild(troop);
        troops.push(troop);
        moveTroop(troop);

        createUpgradeButtons(troop);
    }

    function updateHealthBars(troop) {
        const hpBar = troop.querySelector(".hp-bar");
        hpBar.style.width = (troop.hp / troop.maxHp) * 100 + "%";
    
        if (troop.type === "defensor") {
            const shieldBar = troop.querySelector(".shield-bar");
            shieldBar.style.width = (troop.shield / troop.maxShield) * 100 + "%";
        }
    }
    

    function moveTroop(troop) {
        let posX = 10;
        const moveInterval = setInterval(() => {
            if (troop.hp <= 0) {
                clearInterval(moveInterval);
                gameArea.removeChild(troop);
                troops = troops.filter(t => t !== troop);

                if (troop.type === "mineiro") {
                    mineiros--;
                }
                return;
            }

            posX += troop.speed;
            troop.style.left = posX + "px";

            if (posX > 770) {
                clearInterval(moveInterval);
                gameArea.removeChild(troop);
                troops = troops.filter(t => t !== troop);
                troopPassed(); // Chama a função para reduzir a vida da IA
            }
        }, 50);
    }

    function updateAILives() {
        const difficulty = difficultySelect.value;
        if (difficulty === "easy" || difficulty === "medium") {
            aiLives = 20;
        } else if (difficulty === "hard") {
            aiLives = 22;
        } else if (difficulty === "hardcore") {
            aiLives = 25;
        }
        aiLivesDisplay.textContent = aiLives;
    }

    function troopPassed() {
        aiLives--;
        aiLivesDisplay.textContent = aiLives;
        if (aiLives <= 0) {
            alert("A IA perdeu! Você venceu!");
            location.reload();
        }
    }

    function gainCoins() {
        coins += 100 + (mineiros * 50);
        updateCoins();
    }

    function updateCoins() {
        coinDisplay.textContent = coins;
    }

    function spawnCounterTower(troopType) {
        if (towers.length >= maxTowers) {
            gameArea.removeChild(towers[0]);
            towers.shift();
        }

        let counterTower;
        if (["goblin", "ninja"].includes(troopType)) {
            counterTower = "fast";
        } else if (["chefe", "defensor"].includes(troopType)) {
            counterTower = "heavy";
        } else {
            counterTower = "balanced";
        }

        const tower = document.createElement("div");
        tower.classList.add("tower");
        tower.style.left = Math.random() * 750 + "px";
        tower.style.top = "50px";
        tower.attackSpeed = towerTypes[counterTower].attackSpeed;
        tower.damage = towerTypes[counterTower].damage;
        tower.style.backgroundColor = towerTypes[counterTower].color;

        gameArea.appendChild(tower);
        towers.push(tower);
        attackTroops(tower);
    }

    function attackTroops(tower) {
        setInterval(() => {
            if (troops.length === 0) return;

            let target = troops.reduce((weakest, troop) => {
                return troop.hp < weakest.hp ? troop : weakest;
            }, troops[0]);

            if (!target) return;

            target.hp -= tower.damage;

            const projectile = document.createElement("div");
            projectile.classList.add("projectile");
            projectile.style.left = parseInt(tower.style.left) + "px";
            projectile.style.top = "80px";

            gameArea.appendChild(projectile);

            let posX = parseInt(tower.style.left);
            const moveProjectile = setInterval(() => {
                posX += (parseInt(target.style.left) - posX) * 0.1;
                projectile.style.left = posX + "px";

                if (Math.abs(posX - parseInt(target.style.left)) < 10) {
                    gameArea.removeChild(projectile);
                    clearInterval(moveProjectile);
                }
            }, 50);
        }, tower.attackSpeed);
    }

    function startGame() {
        difficulty = difficultySelect.value;

        clearInterval(coinInterval);
        clearInterval(towerInterval);

        coinInterval = setInterval(() => {
            gainCoins();
        }, 2600);

        let spawnRate = {
            easy: 20000,
            medium: 12000,
            hard: 8000,
            hardcore: 4000
        };

        if (difficulty === "hardcore") {
            // Se for "hardcore", spawn uma torre contra as tropas ao invés da torre normal
            towerInterval = setInterval(() => {
                // Verifica se há tropas para gerar a torre de contra-ataque
                const randomTroop = troops[Math.floor(Math.random() * troops.length)];
                if (randomTroop) {
                    spawnCounterTower(randomTroop.type); // Chama spawnCounterTower baseado no tipo de tropa
                }
            }, spawnRate[difficulty]);
        } else {
            // Caso não seja hardcore, spawn de torres regulares
            if (difficulty !== "hardcore") {
                towerInterval = setInterval(spawnTower, spawnRate[difficulty]);
            }
        }
    }

    function spawnTower() {
        if (towers.length >= maxTowers) {
            gameArea.removeChild(towers[0]);
            towers.shift();
        }

        let types = ["heavy", "fast", "balanced"];
        let randomType = types[Math.floor(Math.random() * types.length)];

        const tower = document.createElement("div");
        tower.classList.add("tower");
        tower.style.left = Math.random() * 750 + "px";
        tower.style.top = "50px";
        tower.attackSpeed = towerTypes[randomType].attackSpeed;
        tower.damage = towerTypes[randomType].damage;
        tower.style.backgroundColor = towerTypes[randomType].color;

        gameArea.appendChild(tower);
        towers.push(tower);
        attackTroops(tower);
    }

    troopButtons.forEach(button => {
        button.addEventListener("click", () => {
            spawnTroop(button.dataset.troop);
        });
    });

    difficultySelect.addEventListener("change", startGame);
    startGame();
});
