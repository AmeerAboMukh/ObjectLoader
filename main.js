
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require("body-parser");
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const { Console } = require('console');


const app = express();
const port = 3000;

const db = new sqlite3.Database('Database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const storage = multer.diskStorage({
    
    destination: './public/objmodels', 
    filename: (req, file, cb) => {
     
       const kind =  file.originalname.slice(-4);
      const uniqueFileName =  req.body.modelName + kind;
      cb(null, uniqueFileName);
    },
  });

  const textureStorage = multer.diskStorage({
    destination: './public/objmodels', 
    filename: (req, file, cb) => {
        const uniqueFileName = file.originalname;
        cb(null, uniqueFileName);
    },
});

const uploadTextures = multer({ storage: textureStorage });

const upload = multer({ storage: storage });
const uploaddouble =  multer({ storage: storage }).fields([
    { name: 'model', maxCount: 1 }, 
    { name: 'mtl', maxCount: 1 }  ]);

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({extended: true}))

app.use(express.static(path.join(__dirname,"public")));
app.use('/MTLLoader',express.static(path.join(__dirname,'../node_modules/three/examples/jsm/loaders/MTLLoader.js')));
app.use(cors());

app.set("views",path.join(__dirname,"views"));
app.set('view engine', 'ejs');


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/upload-textures', (req, res) => {
    db.all('SELECT * FROM models', [], (err, models) => {
        if (err) {
            console.error(err.message);
        } else {
            res.render('upload-textures', {
                models: models,
                successMessage: '' 
            });
        }
    });
});

app.get('/upload-colors', (req, res) => {
    db.all('SELECT * FROM models', [], (err, models) => {
        if (err) {
            console.error(err.message);
        } else {
            res.render('upload-colors', {
                models: models,
                successMessage: ''
            });
        }
    });
});


app.get('/asdf', (req, res) => {
    const tempFile = req.query.tempFile; 
    const texturePaths = req.query.texturePaths ? JSON.parse(req.query.texturePaths) : [];
    const colors = req.query.Colors ? JSON.parse(req.query.Colors) : {};
    res.render('aa', { tempFile: tempFile, texturePaths: texturePaths ,Colors: colors});
});

app.get('/close', (req,res) => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Closed the database connection.');
            res.redirect('/');
        }
    });
    
    
});

app.get('/public/objmodels/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public', 'objmodels', filename);

    res.download(filePath, filename, err => {
        if (err) {
            console.error(err);
            return res.status(404).send('File not found.');
        }
    });
});
app.get('/show', (req,res) => {
    db.all('SELECT * FROM models', [], (err, rows) => {
        if (err) {
            console.error(err.message);
        } else {
            res.render("show",{models:rows});
        }
    });
});

app.get('/show/:id', function (req, res, next) {
    const id = req.params.id;
    db.get('SELECT * FROM models WHERE model_id=?', [id], function(err, row) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching model.');
        }
        if (row != undefined) {
            const model = row;
            req.session.tempfile = model.file_path; 
            const textureData = {};

            db.all('SELECT texture_path, texture_part FROM textures WHERE model_id=?', [id], function(err, rows) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error fetching textures.');
                }

                rows.forEach(row => {
                    const texturePath = row.texture_path;
                    const texturePart = row.texture_part;

                    if (!textureData[texturePart]) {
                        textureData[texturePart] = [];
                    }

                    textureData[texturePart].push(texturePath);
                });
                 db.all('SELECT color_part ,red, blue, black, white, purple FROM colors WHERE model_id=?', [id], function(err, colorRow) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error fetching colors.');
                    }
                    const colors = colorRow || {}; 
    
                const redirectURL = `/asdf?tempFile=${encodeURIComponent(model.model_name)}&texturePaths=${encodeURIComponent(JSON.stringify(textureData))}
                &Colors=${encodeURIComponent(JSON.stringify(colors))}`;

                res.redirect(redirectURL);
            });
        });

        }
        
    });
});

app.post('/upload', uploaddouble, (req, res) => {
    const modelData = req.files['model'][0];
    const modelName = req.body.modelName;
    const modelPath = "./public/objmodels" + `/${modelName}`;
    db.run('INSERT INTO models (model_name,file_path, description) VALUES (?,?,?)', [modelName,modelPath, 'Model Description'], function(err){
        if (err) {
            console.error(err);
            return res.status(500).send('Error uploading the model.');
        }

        const modelId = this.lastID;
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        db.run('INSERT INTO model_files (model_id,file_path, file_data) VALUES (?,?, ?)', [modelId,modelPath, modelData], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error uploading the model.');
            }
            res.redirect('/');
        });
    });
});


app.post('/download', upload.single('model'), (req, res) => {
    if (req.body) {
        const imageName = req.file.originalname;
        const imagePath = `./public/objmodels/${imageName}`;
        fs.renameSync(req.file.path, imagePath);
    }
    res.redirect('/');
});

app.post('/upload-textures', uploadTextures.array('textures'), (req, res) => {
    const modelName = req.body.modelId;
    const textures = req.files;
    const part = req.body.selectedPart;

    db.get('SELECT model_id FROM models WHERE model_name = ?', [modelName], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching model ID.');
        }

        if (row) {
            const modelId = row.model_id;

            textures.forEach(texture => {
                const texturePath = `public/objmodels/${texture.filename}`;
                db.run('INSERT INTO textures (model_id, texture_path, texture_part) VALUES (?,?,?)', [modelId, texturePath, part], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error uploading textures.');
                    }
                });
            });
        }

        db.all('SELECT * FROM models', [], (err, models) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Error fetching models.');
            }

            res.render('upload-textures', {
                models: models,
                successMessage: 'Textures uploaded successfully.'
            });
        });
    });
});

app.post('/upload-colors', upload.single('selectedColors'), (req, res) => {
    const modelName = req.body.modelId;
    const part = req.body.selectedPart;
    const selectedColorsJSON = req.body.selectedColors;
    const selectedColors = JSON.parse(selectedColorsJSON);

    const red = selectedColors.includes("red") ? "red" : null;
    const blue = selectedColors.includes("blue") ? "blue" : null;
    const black = selectedColors.includes("black") ? "black" : null;
    const white = selectedColors.includes("white") ? "white" : null;
    const purple = selectedColors.includes("purple") ? "purple" : null;

    db.get('SELECT model_id FROM models WHERE model_name = ?', [modelName], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching model ID.');
        }

        if (row) {
            const modelId = row.model_id;

            db.run(
                'INSERT INTO colors (model_id, color_part, red, blue, black, white, purple) VALUES (?,?, ?, ?, ?, ?, ?)',
                [modelId,part, red, blue, black, white, purple],
                (err) => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).send('Error saving colors to the database');
                    } else {
                        res.redirect('/upload-colors');
                    }
                }
            );
        } else {
            res.status(404).send('Model not found');
        }
    });
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    
});