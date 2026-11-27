from flask import Flask
app = Flask(__name__)

from Getes import *
from Posts import *


if __name__ == '__main__':
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )