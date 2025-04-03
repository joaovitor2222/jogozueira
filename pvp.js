document.addEventListener("DOMContentLoaded", () => {
    const gameArea = document.getElementById("gameArea");
    const endTurnBtn = document.getElementById("endTurn");
    const towerButtons = document.querySelectorAll(".towerBtn");

    const playerLivesInput = document.getElementById("playerLives");
    const player2CoinsInput = document.getElementById("player2Coins");
    const player2CoinRateInput = document.getElementById("player2CoinRate");

    let playerTurn = 1;
    let playerLives = parseInt(playerLivesInput.value);
    let player2Coins = parseInt(player2CoinsInput.value);
    let player2CoinRate = parseInt(player2CoinRateInput.value);

    let towers = [];
    let troops = [];
    let coinInterval;
    let maxTowers = 30; // Limite inicial de torres

    // Tipos de tropas (Player 2 pode escolher)
    const troopTypes = {
        ninja: { hp: 350, speed: 4, cost: 300 },
        defensor: { hp: 900, speed: 2, cost: 500 },
        spawnador: { hp: 200, speed: 2, cost: 250 },
        barbaro: { hp: 300, speed: 2.5, cost: 100 },
        goblin: { hp: 30, speed: 4, cost: 50 },
        chefe: { hp: 4000, speed: 1, cost: 1800 },
        mineiro: { hp: 50, speed: 1, cost: 100 }
    };

    // Tipos de torres (Player 1)
    const towerTypes = {
        heavy: { attackSpeed: 2000, damage: 100, color: "purple" },
        fast: { attackSpeed: 500, damage: 20, color: "orange" },
        balanced: { attackSpeed: 1000, damage: 40, color: "yellow" }
    };

    let secretButtonClicks = 0;
    const secretButton = document.createElement("button");
    secretButton.textContent = "⚙";
    secretButton.style.position = "fixed";
    secretButton.style.bottom = "20px";
    secretButton.style.right = "20px";
    secretButton.style.width = "40px";
    secretButton.style.height = "40px";
    secretButton.style.borderRadius = "50%";
    secretButton.style.backgroundColor = "blue";
    secretButton.style.color = "white";
    secretButton.style.border = "none";
    secretButton.style.cursor = "pointer";
    secretButton.style.zIndex = "1000";

    document.body.appendChild(secretButton);

    // Div oculta para configurações avançadas
    const advancedSettings = document.createElement("div");
    advancedSettings.style.position = "fixed";
    advancedSettings.style.bottom = "70px";
    advancedSettings.style.right = "20px";
    advancedSettings.style.backgroundColor = "white";
    advancedSettings.style.padding = "10px";
    advancedSettings.style.border = "1px solid black";
    advancedSettings.style.display = "none";
    advancedSettings.style.zIndex = "1000";

    advancedSettings.innerHTML = `
    <h3 style="color: blue;">Mudar Máximo de Torres</h3>
    <label style="color: blue;">Escolha o máximo de torres que o Player 1 pode colocar:</label>
    <br>
    <input type="number" id="maxTowersInput" value="${maxTowers}" min="1" max="100">
    <button id="saveAdvancedSettings">Salvar</button>
    `;


    document.body.appendChild(advancedSettings);

    // Evento para mostrar configurações ocultas após 3 cliques
    secretButton.addEventListener("click", () => {
        secretButtonClicks++;
        if (secretButtonClicks >= 3) {
            advancedSettings.style.display = "block";
        }
    });

    // Evento para salvar a configuração avançada
    document.getElementById("saveAdvancedSettings").addEventListener("click", () => {
        maxTowers = parseInt(document.getElementById("maxTowersInput").value);
        advancedSettings.style.display = "none";
        secretButtonClicks = 0; // Reseta o contador
    });

    // Criar loja de tropas (Player 2)
    function createTroopShop() {
        const troopShop = document.createElement("div");
        troopShop.id = "troopShop";

        Object.keys(troopTypes).forEach(type => {
            const btn = document.createElement("button");
            btn.classList.add("troopBtn");
            btn.dataset.troop = type;
            btn.textContent = `${type} (${troopTypes[type].cost})`;
            btn.addEventListener("click", () => spawnTroop(type));
            troopShop.appendChild(btn);
        });

        document.body.insertBefore(troopShop, gameArea);
    }

    // Posicionar torres (Player 1)
    towerButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (playerTurn !== 1) return;
            placeTower(button.dataset.tower);
        });
    });

    function placeTower(type) {
        if (playerTurn === 1) {
            if (towers.length >= maxTowers) {
                alert("Você já atingiu o limite máximo de torres!");
                return; // Impede a adição da torre
            }
        }

        const tower = document.createElement("div");
        tower.classList.add("tower");
        tower.style.left = Math.random() * 750 + "px";
        tower.style.top = "50px";
        tower.dataset.type = type;
        tower.attackSpeed = towerTypes[type].attackSpeed;
        tower.damage = towerTypes[type].damage;
        tower.style.backgroundColor = towerTypes[type].color;

        gameArea.appendChild(tower);
        towers.push(tower);

        attackTroops(tower);
    }

    // Criar tropas (Player 2)
    function spawnTroop(type) {
        if (playerTurn !== 2) return;
        if (player2Coins < troopTypes[type].cost) return;

        player2Coins -= troopTypes[type].cost;
        updateCoins();

        const troop = document.createElement("div");
        troop.classList.add("troop");
        troop.style.left = "10px";
        troop.hp = troopTypes[type].hp;
        troop.speed = troopTypes[type].speed;
        troop.type = type;

        gameArea.appendChild(troop);
        troops.push(troop);
        moveTroop(troop);
    }

    function moveTroop(troop) {
        let posX = 10;
        const moveInterval = setInterval(() => {
            if (troop.hp <= 0) {
                clearInterval(moveInterval);
                gameArea.removeChild(troop);
                troops = troops.filter(t => t !== troop);
                return;
            }

            posX += troop.speed;
            troop.style.left = posX + "px";

            if (posX > 770) {
                clearInterval(moveInterval);
                gameArea.removeChild(troop);
                playerLives--;
                updateLives();
            }
        }, 50);
    }

    function attackTroops(tower) {
        setInterval(() => {
            if (troops.length === 0) return;

            let target = troops.reduce((weakest, troop) => 
                troop.hp < weakest.hp ? troop : weakest
            , troops[0]);

            if (!target) return;

            target.hp -= tower.damage;

            // Criar projétil visual (opcional)
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

    function updateLives() {
        playerLivesDisplay.textContent = playerLives;
        if (playerLives <= 0) {
            alert("Player 1 perdeu! Player 2 venceu!");
            location.reload();
        }
    }

    function updateCoins() {
        player2CoinsInput.value = player2Coins;
    }

    function endTurn() {
        if (playerTurn === 1) {
            playerTurn = 2;
            alert("Turno do Player 2! Compre tropas!");
            coinInterval = setInterval(() => {
                player2Coins += parseInt(player2CoinRateInput.value);
                updateCoins();
            }, 2600);
        } else {
            playerTurn = 1;
            alert("Turno do Player 1! Posicione torres!");
            clearInterval(coinInterval);
        }
    }

    endTurnBtn.addEventListener("click", endTurn);
    createTroopShop();
});
