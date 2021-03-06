#!/bin/env node
var http	= require('http');
var express	= require('express');
var fs      = require('fs-extra');
var multer	= require('multer')

var app		= require('express')();
var server	= http.createServer(app);

var childProcess 	= require('child_process')

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		var newDir = app.get('persistentDataDir')+String(Date.now())+'/';
		req.dateNow = String(Date.now());
		fs.mkdir(newDir,function(e){
			if(!e || e && e.code =='EEXIST'){
				cb(null,newDir)
			}else{
				console.log(e);
			}
		})
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname)
	}
})
var upload	= multer({storage : storage});

app.get('/osrtest',function(req,res){
	var child = childProcess.execFile(app.get('persistentDataDir')+'imago_console',[app.get('persistentDataDir')+'structure.png'],
		function(e,stdout,stderr){
			if(e){
				res.send({error:e})
			}else if(stderr){
				res.send({error:stderr})
			}else{
				res.send('done')
			}
		})
})

app.post('/osr',upload.single('photo'),function(req,res){
	var dir = app.get('persistentDataDir')+req.dateNow+'/';
	console.log(dir);
	console.log(req.file.originalname);
	var child = childProcess.execFile('./public/imago_console',[dir+req.file.originalname,'-o',dir+'mol.mol'],
		function(e,stdout,stderr){
			if(e){
				res.send({error:e})
				fs.remove(req.file.destination,function(e2){
					if(e2){
						console.log(e2)
					}
				})
			}else if(stderr){
				res.send({error:stderr})
				fs.remove(req.file.destination,function(e2){
					if(e2){
						console.log(e2)
					}
				})
			}else{
				fs.readFile(req.file.destination+'mol.mol','utf-8',function(e1,d){
					if(e1){
						res.send({error:e1})
						fs.remove(req.file.destination,function(e2){
							if(e2){
								console.log(e2)
							}
						})
					}else{
						res.send({mol:d})
						fs.remove(req.file.destination,function(e2){
							if(e2){
								console.log(e2)
							}
						})
					}
				})
			}
		})
})

app.get('/test',function(req,res){
	res.sendfile('upload.html')
})

app.set('persistentDataDir',process.env.OPENSHIFT_DATA_DIR || process.env.DATA_DIR ||'./public/');
//app.set('persistentDataDir','./public/');

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002 );
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "127.0.0.1");

server.listen(app.get('port'),app.get('ip'));