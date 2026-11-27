
        // Configuração do PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


        const formulario = document.getElementById('formulario');

        const inputArquivo = document.getElementById('arquivo');

        const paginaInicio = document.getElementById('pagina_inicio');

        const paginaFim = document.getElementById('pagina_fim');

        const btnCortar = document.getElementById('btn-cortar');

        const nomeArquivo = document.getElementById('nome-arquivo');

        const informacoesPdf = document.getElementById('informacoes-pdf');

        const totalPaginasTexto = document.getElementById('total-paginas');

        const mensagem = document.getElementById('mensagem');


        let totalPaginas = 0;

        let pdfCarregado = false;


        // Exibir mensagens
        function mostrarMensagem(texto, tipo = 'erro') {

            mensagem.textContent = texto;

            mensagem.className = `message ${tipo}`;

        }


        // Limpar mensagens
        function limparMensagem() {

            mensagem.textContent = '';

            mensagem.className = 'message';

        }


        // Validar intervalo de páginas
        function validarIntervalo() {

            limparMensagem();

            btnCortar.disabled = true;


            if (!pdfCarregado) {
                return false;
            }


            const inicio = paginaInicio.value;

            const fim = paginaFim.value;


            // Verificar campos vazios
            if (inicio === '' || fim === '') {
                return false;
            }


            const numeroInicio = Number(inicio);

            const numeroFim = Number(fim);


            // Verificar números inteiros
            if (
                !Number.isInteger(numeroInicio) ||
                !Number.isInteger(numeroFim)
            ) {

                mostrarMensagem(
                    'Informe números inteiros para as páginas.'
                );

                return false;

            }


            // Página inicial mínima
            if (numeroInicio < 1) {

                mostrarMensagem(
                    'A página inicial deve ser maior ou igual a 1.'
                );

                return false;

            }


            // Página final mínima
            if (numeroFim < 1) {

                mostrarMensagem(
                    'A página final deve ser maior ou igual a 1.'
                );

                return false;

            }


            // Página inicial não pode ultrapassar a final
            if (numeroInicio > numeroFim) {

                mostrarMensagem(
                    'A página inicial não pode ser maior que a página final.'
                );

                return false;

            }


            // Verificar limite do documento
            if (numeroInicio > totalPaginas || numeroFim > totalPaginas) {

                mostrarMensagem(
                    `O documento possui ${totalPaginas} páginas. Informe um intervalo válido.`
                );

                return false;

            }


            btnCortar.disabled = false;

            return true;

        }


        // Quando selecionar um PDF
        inputArquivo.addEventListener('change', async () => {

            const arquivo = inputArquivo.files[0];


            // Reiniciar informações
            pdfCarregado = false;

            totalPaginas = 0;

            paginaInicio.value = '';

            paginaFim.value = '';

            paginaInicio.disabled = true;

            paginaFim.disabled = true;

            btnCortar.disabled = true;

            informacoesPdf.hidden = true;

            limparMensagem();


            if (!arquivo) {

                nomeArquivo.textContent =
                    'Nenhum arquivo selecionado';

                return;

            }


            // Verificar formato
            const ehPDF =
                arquivo.type === 'application/pdf' ||
                arquivo.name.toLowerCase().endsWith('.pdf');


            if (!ehPDF) {

                mostrarMensagem('Selecione um arquivo PDF válido.');

                inputArquivo.value = '';

                return;

            }


            nomeArquivo.textContent = arquivo.name;

            mostrarMensagem(
                'Verificando quantidade de páginas...',
                'loading'
            );


            try {

                const buffer = await arquivo.arrayBuffer();

                const pdf = await pdfjsLib.getDocument({
                    data: new Uint8Array(buffer)
                }).promise;


                totalPaginas = pdf.numPages;

                pdfCarregado = true;


                // Exibir quantidade de páginas
                totalPaginasTexto.textContent =
                    `Total de páginas: ${totalPaginas}`;

                informacoesPdf.hidden = false;


                // Configurar limites dos campos
                paginaInicio.min = 1;

                paginaInicio.max = totalPaginas;

                paginaFim.min = 1;

                paginaFim.max = totalPaginas;


                paginaInicio.disabled = false;

                paginaFim.disabled = false;


                // Valores iniciais
                paginaInicio.value = 1;

                paginaFim.value = totalPaginas;


                limparMensagem();

                validarIntervalo();

                pdf.destroy();


            } catch (erro) {

                console.error(erro);

                pdfCarregado = false;

                totalPaginas = 0;

                mostrarMensagem(
                    'Não foi possível ler esse PDF. Verifique se o arquivo não está corrompido ou protegido por senha.'
                );

                inputArquivo.value = '';

                nomeArquivo.textContent =
                    'Nenhum arquivo válido carregado';

            }

        });


        // Validar quando os campos forem alterados
        paginaInicio.addEventListener('input', validarIntervalo);

        paginaFim.addEventListener('input', validarIntervalo);


        // Enviar para o Flask
        formulario.addEventListener('submit', async evento => {

            evento.preventDefault();


            if (!validarIntervalo()) {
                return;
            }


            const arquivo = inputArquivo.files[0];

            const inicio = Number(paginaInicio.value);

            const fim = Number(paginaFim.value);


            const dados = new FormData();

            dados.append('arquivo', arquivo);

            dados.append('pagina_inicio', inicio);

            dados.append('pagina_fim', fim);


            btnCortar.disabled = true;

            btnCortar.textContent = 'Processando PDF...';


            try {

                const resposta = await fetch('/cortar-pdf', {

                    method: 'POST',

                    body: dados

                });


                if (!resposta.ok) {

                    const erro = await resposta.text();

                    throw new Error(
                        erro || 'Erro ao cortar o PDF.'
                    );

                }


                const blob = await resposta.blob();

                const url = URL.createObjectURL(blob);


                const link = document.createElement('a');

                link.href = url;

                link.download = 'pdf_cortado.pdf';


                document.body.appendChild(link);

                link.click();

                link.remove();


                setTimeout(() => {

                    URL.revokeObjectURL(url);

                }, 1000);


                mostrarMensagem(
                    'PDF cortado com sucesso!',
                    'success'
                );


            } catch (erro) {

                mostrarMensagem(erro.message);


            } finally {

                btnCortar.textContent = '✂️ Cortar PDF';

                btnCortar.disabled = !validarIntervalo();

            }

        });
