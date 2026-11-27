const formulario = document.getElementById('formulario');
        const inputArquivo = document.getElementById('arquivo');
        const dropArea = document.getElementById('drop-area');

        const arquivoInfo = document.getElementById('arquivo-info');
        const nomeArquivo = document.getElementById('nome-arquivo');
        const tamanhoArquivo = document.getElementById('tamanho-arquivo');

        const btnRemover = document.getElementById('btn-remover');
        const btnConverter = document.getElementById('btn-converter');
        const mensagemStatus = document.getElementById('mensagem-status');

        let arquivoSelecionado = null;

        function formatarTamanho(bytes) {

            if (bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(2) + ' KB';
            }

            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }

        function selecionarArquivo(arquivo) {

            mensagemStatus.textContent = '';
            mensagemStatus.className = 'mensagem-status';

            if (!arquivo) return;

            const nomeValido = arquivo.name.toLowerCase().endsWith('.docx');

            const tipoValido =
                arquivo.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                || arquivo.type === '';

            if (!nomeValido || !tipoValido) {

                mensagemStatus.textContent =
                    'Selecione um documento Word válido (.docx).';

                mensagemStatus.classList.add('erro');

                inputArquivo.value = '';
                arquivoSelecionado = null;

                atualizarInterface();

                return;
            }

            arquivoSelecionado = arquivo;

            atualizarInterface();
        }

        function atualizarInterface() {

            if (arquivoSelecionado) {

                nomeArquivo.textContent = arquivoSelecionado.name;

                tamanhoArquivo.textContent =
                    formatarTamanho(arquivoSelecionado.size);

                arquivoInfo.classList.add('ativo');

                btnConverter.disabled = false;

            } else {

                arquivoInfo.classList.remove('ativo');

                btnConverter.disabled = true;

                inputArquivo.value = '';

            }
        }

        // Selecionar documento

        inputArquivo.addEventListener('change', () => {

            selecionarArquivo(inputArquivo.files[0]);

        });

        // Remover documento

        btnRemover.addEventListener('click', () => {

            arquivoSelecionado = null;

            atualizarInterface();

            mensagemStatus.textContent = '';
            mensagemStatus.className = 'mensagem-status';

        });

        // Arrastar documento para a área de upload

        dropArea.addEventListener('dragover', (evento) => {

            evento.preventDefault();

            dropArea.classList.add('drag-over');

        });

        dropArea.addEventListener('dragleave', () => {

            dropArea.classList.remove('drag-over');

        });

        dropArea.addEventListener('drop', (evento) => {

            evento.preventDefault();

            dropArea.classList.remove('drag-over');

            const arquivo = evento.dataTransfer.files[0];

            selecionarArquivo(arquivo);

        });

        // Converter documento Word para PDF

        formulario.addEventListener('submit', async (evento) => {

            evento.preventDefault();

            if (!arquivoSelecionado) {

                mensagemStatus.textContent =
                    'Selecione um documento Word!';

                mensagemStatus.classList.add('erro');

                return;
            }

            const dados = new FormData();

            dados.append('arquivo', arquivoSelecionado);

            btnConverter.disabled = true;
            btnConverter.textContent = 'Convertendo...';

            mensagemStatus.textContent =
                'Aguarde enquanto seu documento é convertido.';

            mensagemStatus.className = 'mensagem-status carregando';

            try {

                const resposta = await fetch('/word-para-pdf', {
                    method: 'POST',
                    body: dados
                });

                if (!resposta.ok) {
                    throw new Error(await resposta.text());
                }

                const blob = await resposta.blob();

                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');

                link.href = url;
                link.download = 'documento_convertido.pdf';

                document.body.appendChild(link);

                link.click();

                link.remove();

                URL.revokeObjectURL(url);

                mensagemStatus.textContent =
                    'Documento convertido com sucesso!';

                mensagemStatus.className = 'mensagem-status sucesso';

            } catch (erro) {

                mensagemStatus.textContent =
                    erro.message || 'Não foi possível converter o documento.';

                mensagemStatus.className = 'mensagem-status erro';

            } finally {

                btnConverter.textContent = 'Converter para PDF';

                btnConverter.disabled = !arquivoSelecionado;

            }

        });