#!/bin/sh

start ./ngrok.exe http 8000
start python -m http.server 8000
