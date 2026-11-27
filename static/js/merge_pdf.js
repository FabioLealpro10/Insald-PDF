const input = document.getElementById('input-pdf');
const lista = document.getElementById('lista-pdfs');
const formulario = document.getElementById('formulario');
const dropArea = document.getElementById('drop-area');
const contador = document.getElementById('contador');
const mensagemVazia = document.getElementById('mensagem-vazia');
const btnJuntar = document.getElementById('btn-juntar');

// Array que armazena os PDFs e seus identificadores.
let arquivosSelecionados = [];

// Identificador do arquivo que está sendo arrastado.
let idArrastado = null;


// Verifica se o arquivo é PDF
function ehPDF(arquivo) {
    return arquivo.type === 'application/pdf' ||
           arquivo.name.toLowerCase().endsWith('.pdf');
}


// Adiciona arquivos à lista
function adicionarArquivos(arquivos) {

    Array.from(arquivos).forEach(arquivo => {

        if (!ehPDF(arquivo)) return;

        const duplicado = arquivosSelecionados.some(item =>
            item.arquivo.name === arquivo.name &&
            item.arquivo.size === arquivo.size &&
            item.arquivo.lastModified === arquivo.lastModified
        );

        if (!duplicado) {

            arquivosSelecionados.push({
                id: crypto.randomUUID(),
                arquivo: arquivo
            });

        }

    });

    atualizarLista();
}


// Seleção pelo botão
input.addEventListener('change', () => {

    adicionarArquivos(input.files);

    input.value = '';

});


// Atualiza a lista de arquivos
function atualizarLista() {

    lista.innerHTML = '';

    arquivosSelecionados.forEach((itemArquivo, indice) => {

        const arquivo = itemArquivo.arquivo;

        const item = document.createElement('li');

        item.className = 'file-item';
        item.draggable = true;
        item.dataset.id = itemArquivo.id;

        // Informações do arquivo
        const informacoes = document.createElement('div');

        informacoes.className = 'file-info';

        // Indicador de arraste
        const indicador = document.createElement('span');

        indicador.textContent = '⠿';
        indicador.className = 'drag-handle';
        indicador.title = 'Arraste para alterar a ordem';

        // Numeração
        const numero = document.createElement('span');

        numero.className = 'file-number';
        numero.textContent = `${indice + 1}.`;

        // Ícone
        const icone = document.createElement('span');

        icone.textContent = '📄';

        // Nome
        const nome = document.createElement('span');

        nome.textContent = arquivo.name;
        nome.className = 'file-name';

        // Botão remover
        const remover = document.createElement('button');

        remover.type = 'button';
        remover.textContent = '✕';
        remover.className = 'remove-button';
        remover.title = 'Remover arquivo';

        remover.addEventListener('click', () => {

            arquivosSelecionados = arquivosSelecionados.filter(
                item => item.id !== itemArquivo.id
            );

            atualizarLista();

        });

        informacoes.append(
            indicador,
            numero,
            icone,
            nome
        );

        item.append(
            informacoes,
            remover
        );

        lista.appendChild(item);

    });

    // Atualizar contador
    contador.textContent =
        `${arquivosSelecionados.length} arquivo(s)`;

    // Mensagem quando não há arquivos
    mensagemVazia.style.display =
        arquivosSelecionados.length === 0 ? 'block' : 'none';

    // Exige pelo menos dois PDFs
    btnJuntar.disabled = arquivosSelecionados.length < 2;

}


// Identifica a posição onde o arquivo será colocado
function obterElementoApos(posicaoY) {

    const elementos = [
        ...lista.querySelectorAll('.file-item:not(.dragging)')
    ];

    let elementoMaisProximo = null;
    let menorDistancia = Number.NEGATIVE_INFINITY;

    elementos.forEach(elemento => {

        const caixa = elemento.getBoundingClientRect();

        const distancia =
            posicaoY - caixa.top - caixa.height / 2;

        if (distancia < 0 && distancia > menorDistancia) {

            menorDistancia = distancia;

            elementoMaisProximo = elemento;

        }

    });

    return elementoMaisProximo;

}


// Iniciar arraste
lista.addEventListener('dragstart', evento => {

    const item = evento.target.closest('.file-item');

    if (!item) return;

    idArrastado = item.dataset.id;

    item.classList.add('dragging');

    evento.dataTransfer.effectAllowed = 'move';

    evento.dataTransfer.setData('text/plain', idArrastado);

});


// Reorganizar visualmente os arquivos
lista.addEventListener('dragover', evento => {

    evento.preventDefault();

    const itemArrastado = lista.querySelector('.dragging');

    if (!itemArrastado) return;

    const elementoApos = obterElementoApos(evento.clientY);

    if (elementoApos) {

        lista.insertBefore(itemArrastado, elementoApos);

    } else {

        lista.appendChild(itemArrastado);

    }

});


// Salvar a nova ordem após soltar o arquivo
lista.addEventListener('dragend', () => {

    const novaOrdem = [
        ...lista.querySelectorAll('.file-item')
    ].map(item => item.dataset.id);

    arquivosSelecionados.sort((a, b) => {

        return novaOrdem.indexOf(a.id) -
               novaOrdem.indexOf(b.id);

    });

    idArrastado = null;

    atualizarLista();

});


// Impede o comportamento padrão do navegador na área de upload
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evento => {

    dropArea.addEventListener(evento, e => {

        e.preventDefault();
        e.stopPropagation();

    });

});


// Efeito visual ao arrastar arquivos externos
['dragenter', 'dragover'].forEach(evento => {

    dropArea.addEventListener(evento, () => {

        dropArea.classList.add('drag-active');

    });

});

['dragleave', 'drop'].forEach(evento => {

    dropArea.addEventListener(evento, () => {

        dropArea.classList.remove('drag-active');

    });

});


// Recebe arquivos externos
dropArea.addEventListener('drop', evento => {

    adicionarArquivos(evento.dataTransfer.files);

});


// Enviar os arquivos na ordem definida pelo usuário
formulario.addEventListener('submit', async evento => {

    evento.preventDefault();

    if (arquivosSelecionados.length < 2) {

        alert('Selecione pelo menos dois arquivos PDF.');

        return;

    }

    const dados = new FormData();

    // A sequência do array determina a ordem de envio.
    arquivosSelecionados.forEach(item => {

        dados.append('arquivos', item.arquivo);

    });

    btnJuntar.disabled = true;

    btnJuntar.textContent = 'Processando PDFs...';

    try {

        const resposta = await fetch('/juntar-pdf', {

            method: 'POST',

            body: dados

        });

        if (!resposta.ok) {

            throw new Error('Erro ao juntar os PDFs.');

        }

        const blob = await resposta.blob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');

        link.href = url;

        link.download = 'pdf_unificado.pdf';

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (erro) {

        alert(erro.message);

    } finally {

        btnJuntar.disabled = arquivosSelecionados.length < 2;

        btnJuntar.textContent = '📑 Juntar PDFs';

    }

});


// Inicializar
atualizarLista();