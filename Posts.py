from main import app
from flask import request, send_file, after_this_request
from pypdf import PdfWriter,  PdfReader
from io import BytesIO
from PIL import Image
import os
import tempfile
from pdf2docx import Converter
import subprocess
import shutil

@app.route('/juntar-pdf', methods=['POST'])
def juntarPdf():
    if request.method == 'POST':
        # junta os arquivos PDF enviados pelo usuário e retorna o arquivo em dawlod automaticamente
        pdf_files = request.files.getlist('arquivos') # pega os arquivos PDF enviados pelo usuário
        pdf_final = PdfWriter()

        for arquivo in pdf_files:
            if arquivo.filename.endswith('.pdf'):
                pdf_final.append(arquivo)

        resultado = BytesIO()

        pdf_final.write(resultado)
        pdf_final.close()

        resultado.seek(0)

        return send_file(
            resultado,
            as_attachment=True,
            download_name='pdf_unificado.pdf',
            mimetype='application/pdf'
        )


@app.route('/imagens-para-pdf', methods=['POST'])
def imagens_para_pdf():
    # suba com o estrondo do trovão
    arquivos = request.files.getlist('imagens')

    imagens = []

    for arquivo in arquivos:

        imagem = Image.open(arquivo).convert('RGB')

        imagens.append(imagem)

    if not imagens:
        return 'Nenhuma imagem enviada', 400

    resultado = BytesIO()

    imagens[0].save(
        resultado,
        format='PDF',
        save_all=True,
        append_images=imagens[1:]
    )

    resultado.seek(0)

    return send_file(
        resultado,
        as_attachment=True,
        download_name='imagens_convertidas.pdf',
        mimetype='application/pdf'
    )


@app.route('/cortar-pdf', methods=['POST'])
def cortar_pdf():

    # com vontade com moral nessa arera eu sou o tal
    arquivo = request.files.get('arquivo')

    pagina_inicio = int(request.form.get('pagina_inicio'))
    pagina_fim = int(request.form.get('pagina_fim'))

    if not arquivo or not arquivo.filename.lower().endswith('.pdf'):
        return 'Selecione um arquivo PDF válido.', 400

    leitor = PdfReader(arquivo)

    total_paginas = len(leitor.pages)

    if pagina_inicio < 1 or pagina_fim > total_paginas:
        return f'O PDF possui apenas {total_paginas} páginas.', 400

    if pagina_inicio > pagina_fim:
        return 'A página inicial não pode ser maior que a final.', 400

    escritor = PdfWriter()

    # Extrair as páginas selecionadas
    for pagina in range(pagina_inicio - 1, pagina_fim):
        escritor.add_page(leitor.pages[pagina])

    resultado = BytesIO()

    escritor.write(resultado)
    resultado.seek(0)

    return send_file(
        resultado,
        as_attachment=True,
        download_name='pdf_cortado.pdf',
        mimetype='application/pdf'
    )



@app.route('/pdf-para-word', methods=['POST'])
def pdf_para_word():

    arquivo = request.files.get('arquivo')

    if not arquivo or not arquivo.filename.lower().endswith('.pdf'):
        return 'Selecione um arquivo PDF válido.', 400

    try:
        with tempfile.TemporaryDirectory() as pasta:

            caminho_pdf = os.path.join(pasta, 'original.pdf')
            caminho_word = os.path.join(pasta, 'convertido.docx')

            arquivo.save(caminho_pdf)

            conversor = Converter(caminho_pdf)

            try:
                conversor.convert(caminho_word)
            finally:
                conversor.close()

            with open(caminho_word, 'rb') as documento:
                resultado = BytesIO(documento.read())

            resultado.seek(0)

        return send_file(
            resultado,
            as_attachment=True,
            download_name='documento_convertido.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as erro:
        return f'Erro na conversão: {erro}', 500

    '''
    um conto de fadas e um carpinteiro , só zinho sem nada só pensa em dinheiro,
    e a nova terra ...
    '''



@app.route('/word-para-pdf', methods=['POST'])
def word_para_pdf():

    arquivo = request.files.get('arquivo')

    if not arquivo or not arquivo.filename.lower().endswith('.docx'):
        return 'Selecione um documento Word válido.', 400

    pasta = tempfile.mkdtemp()

    try:
        caminho_word = os.path.join(pasta, 'original.docx')
        caminho_pdf = os.path.join(pasta, 'original.pdf')

        arquivo.save(caminho_word)

        libreoffice = r'C:\Program Files\LibreOffice\program\soffice.exe'

        subprocess.run(
            [
                libreoffice,
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', pasta,
                caminho_word
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=120
        )

        if not os.path.exists(caminho_pdf):
            shutil.rmtree(pasta, ignore_errors=True)
            return 'Não foi possível gerar o PDF.', 500

        @after_this_request
        def remover_arquivos(response):
            shutil.rmtree(pasta, ignore_errors=True)
            return response

        return send_file(
            caminho_pdf,
            as_attachment=True,
            download_name='word_convertido.pdf',
            mimetype='application/pdf'
        )

    
    except subprocess.CalledProcessError as erro:
        shutil.rmtree(pasta, ignore_errors=True)
        return f'Erro na conversão: {erro.stderr}', 500

    except Exception as erro:
        shutil.rmtree(pasta, ignore_errors=True)
        return f'Erro: {erro}', 500
    '''
    um dia um gago mi falou que a mulher que ele tanto amou fofo foi embora e entre frases desbotados ele disiassim pra sua amada numa canção qui qui qui dizia assimm'''
