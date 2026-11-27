
        const input = document.getElementById('input-img');
        const lista = document.getElementById('lista-imgs');
        const formulario = document.getElementById('formulario');
        const dropArea = document.getElementById('drop-area');
        const btnSelecionar = document.getElementById('btn-selecionar');
        const btnConverter = document.getElementById('btn-converter');
        const contador = document.getElementById('contador');
        const mensagemVazia = document.getElementById('mensagem-vazia');

        // Array de imagens selecionadas
        let imagensSelecionadas = [];


        // Abrir seletor de imagens
        btnSelecionar.addEventListener('click', () => {

            input.click();

        });


        // Verificar se é uma imagem
        function ehImagem(arquivo) {

            return arquivo.type.startsWith('image/');

        }


        // Adicionar imagens
        function adicionarImagens(arquivos) {

            Array.from(arquivos).forEach(arquivo => {

                if (!ehImagem(arquivo)) return;

                // Evitar duplicações
                const duplicada = imagensSelecionadas.some(item =>

                    item.arquivo.name === arquivo.name &&
                    item.arquivo.size === arquivo.size &&
                    item.arquivo.lastModified === arquivo.lastModified

                );

                if (!duplicada) {

                    imagensSelecionadas.push({

                        id: crypto.randomUUID(),

                        arquivo: arquivo

                    });

                }

            });

            atualizarLista();

        }


        // Selecionar imagens pelo botão
        input.addEventListener('change', () => {

            adicionarImagens(input.files);

            input.value = '';

        });


        // Atualizar lista de imagens
        function atualizarLista() {

            lista.innerHTML = '';

            imagensSelecionadas.forEach((itemImagem, indice) => {

                const imagem = itemImagem.arquivo;

                const item = document.createElement('li');

                item.className = 'file-item';

                item.draggable = true;

                item.dataset.id = itemImagem.id;


                // Informações
                const informacoes = document.createElement('div');

                informacoes.className = 'file-info';


                // Indicador de arraste
                const indicador = document.createElement('span');

                indicador.textContent = '⠿';

                indicador.className = 'drag-handle';

                indicador.title = 'Arraste para mudar a ordem';


                // Numeração
                const numero = document.createElement('span');

                numero.className = 'file-number';

                numero.textContent = `${indice + 1}.`;


                // Ícone
                const icone = document.createElement('span');

                icone.textContent = '🖼️';


                // Nome do arquivo
                const nome = document.createElement('span');

                nome.textContent = imagem.name;

                nome.className = 'file-name';


                // Botão remover
                const remover = document.createElement('button');

                remover.type = 'button';

                remover.textContent = '✕';

                remover.className = 'remove-button';

                remover.title = 'Remover imagem';


                remover.addEventListener('click', () => {

                    imagensSelecionadas = imagensSelecionadas.filter(

                        imagem => imagem.id !== itemImagem.id

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


            // Contador
            contador.textContent =
                `${imagensSelecionadas.length} imagem(ns)`;


            // Mensagem de lista vazia
            mensagemVazia.style.display =
                imagensSelecionadas.length === 0 ? 'block' : 'none';


            // Habilitar botão
            btnConverter.disabled =
                imagensSelecionadas.length === 0;

        }


        // Encontrar posição de destino do arquivo
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


                if (

                    distancia < 0 &&

                    distancia > menorDistancia

                ) {

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

            item.classList.add('dragging');

            evento.dataTransfer.effectAllowed = 'move';

            evento.dataTransfer.setData(

                'text/plain',

                item.dataset.id

            );

        });


        // Reorganizar visualmente
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


        // Salvar nova ordem
        lista.addEventListener('dragend', () => {

            const novaOrdem = [

                ...lista.querySelectorAll('.file-item')

            ].map(item => item.dataset.id);


            imagensSelecionadas.sort((a, b) => {

                return novaOrdem.indexOf(a.id) -

                       novaOrdem.indexOf(b.id);

            });


            atualizarLista();

        });


        // Permitir arrastar imagens externas para a área
        ['dragenter', 'dragover'].forEach(evento => {

            dropArea.addEventListener(evento, e => {

                e.preventDefault();

                e.stopPropagation();

                dropArea.classList.add('drag-active');

            });

        });


        ['dragleave', 'drop'].forEach(evento => {

            dropArea.addEventListener(evento, e => {

                e.preventDefault();

                e.stopPropagation();

                dropArea.classList.remove('drag-active');

            });

        });


        // Receber imagens externas
        dropArea.addEventListener('drop', evento => {

            adicionarImagens(evento.dataTransfer.files);

        });


        // Enviar imagens para o Flask
        formulario.addEventListener('submit', async evento => {

            evento.preventDefault();


            if (imagensSelecionadas.length === 0) {

                alert('Selecione pelo menos uma imagem.');

                return;

            }


            const dados = new FormData();


            // Enviar na ordem definida pelo usuário
            imagensSelecionadas.forEach(item => {

                dados.append('imagens', item.arquivo);

            });


            btnConverter.disabled = true;

            btnConverter.textContent = 'Convertendo imagens...';


            try {

                const resposta = await fetch('/imagens-para-pdf', {

                    method: 'POST',

                    body: dados

                });


                if (!resposta.ok) {

                    throw new Error('Erro ao converter as imagens.');

                }


                const blob = await resposta.blob();

                const url = URL.createObjectURL(blob);


                const link = document.createElement('a');

                link.href = url;

                link.download = 'imagens_convertidas.pdf';


                document.body.appendChild(link);

                link.click();

                link.remove();


                setTimeout(() => {

                    URL.revokeObjectURL(url);

                }, 1000);


            } catch (erro) {

                alert(erro.message);

            } finally {

                btnConverter.disabled = imagensSelecionadas.length === 0;

                btnConverter.textContent = '🖼️ Converter em PDF';

            }

        });


        // Inicializar página
        atualizarLista();
