import sqlite3

con = sqlite3.connect("Database.db")
con.execute("""CREATE TABLE models (model_id INTEGER PRIMARY KEY AUTOINCREMENT, 
model_name varchar(255),
file_path varchar(255), 
description TEXT
)""")
con.execute("""CREATE TABLE model_files (file_id INTEGER PRIMARY KEY AUTOINCREMENT, 
model_id int,
file_path varchar(255),  
file_data LONGBLOB, 
FOREIGN KEY (model_id) REFERENCES models(model_id))""")

con.execute("""CREATE TABLE textures (
    texture_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id int,
    texture_path varchar(255),
    texture_part varchar(255),
    FOREIGN KEY (model_id) REFERENCES models(model_id)
)""")

con.execute("""CREATE TABLE colors (
color_id INTEGER PRIMARY KEY AUTOINCREMENT,
model_id INTEGER ,
color_part varchar(255), 
red varchar(255),
blue varchar(255),
black varchar(255),
white varchar(255),
purple varchar(255), 
FOREIGN KEY (model_id) REFERENCES models(model_id))""")

con.commit()
con.close()