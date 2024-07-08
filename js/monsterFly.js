function novoElemento(tagName, className) {
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)

    this.setAltura = altura => corpo.style.height = `${altura}px`
}


function ParDeBarreiras(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    this.setX = x => this.elemento.style.left = `${x}px`
    this.getLargura = () => this.elemento.clientWidth

    this.sortearAbertura()
    this.setX(x)
}

// surgimento das barreiras pelo mapa
function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco * 1),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3),
        new ParDeBarreiras(altura, abertura, largura + espaco * 4)
    ]

    // movimentação das barreiras
    const deslocamento = 5
    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento sair da área do jogo
            if (par.getX() < -par.getLargura()) {
                par.setX(par.getX() + espaco * this.pares.length)
                par.sortearAbertura()
            }

            const meio = largura / 2
            const cruzouOMeio = par.getX() + deslocamento >= meio
                && par.getX() < meio
            if (cruzouOMeio) {
                notificarPonto()
                // Som para pontuação
                const audioPonto = new Audio('sounds/ponto.mp3');
                audioPonto.addEventListener('canplaythrough', function () {
                    audioPonto.play();
                });
            }
        })
    }
}

function Jogo(alturaJogo) {
    let voando = false
    let posY = alturaJogo / 2 // Posição inicial do monstro
    let velocidadeY = 0 // Velocidade inicial do movimento

    this.elemento = novoElemento('img', 'eye-purple')
    this.elemento.src = 'imgs/eye-purple.gif'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = e => voando = true
    window.onkeyup = e => voando = false
    window.onmousedown = () => voando = true;
    window.onmouseup = () => voando = false;

    this.animar = () => {
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if (voando) {
            velocidadeY += 0.45
        } else {
            velocidadeY -= 0.35
        }

        let novoY = posY + velocidadeY

        if (novoY <= 0) {
            novoY = 0
            velocidadeY = 0 // Continue a se mover, mas não ultrapasse a borda
        } else if (novoY >= alturaMaxima) {
            novoY = alturaMaxima
            velocidadeY = 0 // Continue a se mover, mas não ultrapasse a borda
        }

        posY = novoY
        this.setY(posY)
    }

    this.setY(alturaJogo / 2)
}

function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect()
    const b = elementoB.getBoundingClientRect()

    const horizontal = a.left + a.width >= b.left
        && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top
        && b.top + b.height >= a.top
    return horizontal && vertical
}

function colidiu(monstro, barreiras) {
    let colidiu = false
    barreiras.pares.forEach(parDeBarreiras => {
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(monstro.elemento, superior)
                || estaoSobrepostos(monstro.elemento, inferior)
        }
    })
    return colidiu
}


function MonsterFly() {
    let pontos = 0

    const areaDoJogo = document.querySelector('[monster-fly]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras(altura, largura, 230, 400,
        () => progresso.atualizarPontos(++pontos))
    const monstro = new Jogo(altura)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(monstro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))


    // loop do jogo
    this.start = () => {
        const audioBacktrack = new Audio("sounds/backtrack.mp3")
        // audioBacktrack.addEventListener('canplay', function() {
        //         audioBacktrack.play();
        //     });
        const telaFinal = document.querySelector('.tela-fim')
        telaFinal.style.display = "none";
        const telaFinalPontos = document.querySelector('.ponto')
        const jogarNovamente = document.querySelector('.restart')
        jogarNovamente.onclick = function () {
            location.reload();
        }
        // jogarNovamente.addEventListener('click', reload())
        const temporizador = setInterval(() => {
            barreiras.animar()
            monstro.animar()

            // condição para GAME OVER
            if (colidiu(monstro, barreiras)) {
                clearInterval(temporizador)
                telaFinalPontos.innerHTML = pontos;
                telaFinal.style.display = "block"
                monstro.elemento.src = 'imgs/eye-purple.png'
                const audioFim = new Audio('sounds/fim.mp3');
                audioFim.addEventListener('canplaythrough', function () {
                    audioFim.play();
                });
                // audioBacktrack.pause();
            }
        }, 20)
    }
}

new MonsterFly().start()