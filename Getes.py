
from flask import render_template
from main import app




@app.route('/')
def home():
    return render_template('main.html')

@app.route('/getJuntaPdf', methods=['GET'])
def getJuntaPdf():
    # função que junta os arquivos PDF enviados pelo usuário e retorna o arquivo em dawlod automaticamente
    return render_template('megPDF.html')





@app.route('/getJuntaImgPdf', methods=['GET'])
def getJuntaImgPdf():
    return render_template('megImgPdf.html')





@app.route('/cortar-pdf', methods=['GET'])
def cortaPdf():
    return render_template('cortarPdf.html')



@app.route('/transformar-pdf-word', methods=['GET'])
def transformarPdfWord():
    return render_template('pdfWord.html')



@app.route('/transformar-word-pdf', methods=['GET'])
def transformarWordPdf():
    return render_template('wordPdf.html')

